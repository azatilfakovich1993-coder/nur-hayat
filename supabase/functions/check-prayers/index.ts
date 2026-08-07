import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import webPush from 'npm:web-push'
import { getFcmAccessToken, sendFcm } from '../_shared/fcm.ts'

const PRAYER_NAMES: Record<string, string> = {
  Fajr: 'Фаджр', Dhuhr: 'Зухр', Asr: 'Аср', Maghrib: 'Магриб', Isha: 'Иша',
}

serve(async (req) => {
  try {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  webPush.setVapidDetails(
    'mailto:admin@nurhayat.app',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!)
  const fcmProjectId = serviceAccount.project_id
  let fcmAccessToken: string | null = null

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const now = new Date()
  const nowUtcMin = now.getUTCHours() * 60 + now.getUTCMinutes()

  const { data: schedules, error: schedulesErr } = await supabase
    .from('prayer_schedules')
    .select('user_id, timings, remind_before, utc_offset, prayer_notif_enabled, morning_adhkar_time, evening_adhkar_time, azkar_notif_enabled, local_scheduled_date')

  if (schedulesErr) console.error('[check-prayers] schedules query failed:', schedulesErr)
  if (!schedules?.length) {
    return new Response(JSON.stringify({ sent: 0, checked: 0 }))
  }

  const todayStr = now.toISOString().slice(0, 10)

  // Идемпотентность: без этого одно и то же событие (напр. "20 мин до Фаджра")
  // уходило до 5 раз подряд, пока держится 5-минутное окно ниже — сколько бы
  // раз за это окно ни дёрнул функцию внешний cron. claim() отправляет только
  // тому, кто первым "застолбил" tag на сегодня.
  async function claim(userId: string, tag: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('notif_log')
      .upsert({ user_id: userId, tag, sent_on: todayStr }, { onConflict: 'user_id,tag,sent_on', ignoreDuplicates: true })
      .select()
    if (error) { console.error('[check-prayers] claim failed:', error.message); return true }
    return (data?.length ?? 0) > 0
  }

  // Android-приложение регистрирует "сырой" FCM-токен (platform='android'),
  // а не Web Push подписку — web-push.sendNotification() на нём упал бы
  // (JSON.parse кидает исключение на не-JSON строке), из-за чего push на
  // Android реально никогда не доходил. Поэтому шлём по двум каналам.
  async function sendToUser(userId: string, payload: { title: string; body: string; url?: string; tag?: string }, tokens: { token: string; platform: string | null }[]) {
    let sent = 0
    const jsonPayload = JSON.stringify(payload)
    for (const { token, platform } of tokens) {
      if (platform === 'android') {
        try {
          fcmAccessToken ??= await getFcmAccessToken(serviceAccount)
          const { ok, stale } = await sendFcm(fcmAccessToken, fcmProjectId, token, { ...payload, channelId: 'prayer_reminders' })
          if (ok) sent++
          else if (stale) await supabase.from('push_tokens').delete().eq('user_id', userId).eq('token', token)
        } catch { /* временная ошибка FCM — пробуем в следующий прогон */ }
        continue
      }
      try {
        await webPush.sendNotification(JSON.parse(token), jsonPayload)
        sent++
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase.from('push_tokens').delete()
            .eq('user_id', userId).eq('token', token)
        }
      }
    }
    return sent
  }

  let sent = 0

  for (const schedule of schedules) {
    // Ошибка на одном пользователе (например, кривые timings) раньше рушила
    // весь прогон — все следующие пользователи (и азкары этого же
    // пользователя, они идут в коде ниже намазов) молча не обрабатывались.
    try {
    const { user_id, timings, remind_before, utc_offset,
            prayer_notif_enabled, morning_adhkar_time, evening_adhkar_time, azkar_notif_enabled,
            local_scheduled_date } = schedule

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', user_id)

    if (!tokens?.length) continue

    // На Android телефон сам ставит локальные будильники на намаз, пока
    // приложение открывалось сегодня (см. PrayerPage.jsx) — раньше сервер
    // слал push независимо от этого, и Android-пользователь гарантированно
    // получал двойное уведомление на каждое событие намаза. Если телефон
    // уже отметился (local_scheduled_date = сегодня по его локальному
    // времени), для намазов не шлём на android-токены — только на
    // web/ios, у которых локального будильника нет. Азкары не трогаем —
    // для них локального будильника нет вообще ни на одной платформе.
    const userLocalToday = new Date(now.getTime() + (utc_offset as number) * 60000).toISOString().slice(0, 10)
    const localCoversToday = local_scheduled_date === userLocalToday
    const prayerTokens = localCoversToday ? tokens.filter(t => t.platform !== 'android') : tokens

    // ── Уведомления намазов ──────────────────────────────────
    if (prayer_notif_enabled !== false && timings && prayerTokens.length > 0) {
      for (const [prayerId, localTimeStr] of Object.entries(timings as Record<string, string>)) {
        const name = PRAYER_NAMES[prayerId]
        if (!name) continue

        const [h, m] = (localTimeStr as string).split(':').map(Number)
        const prayerUtcMin = h * 60 + m - (utc_offset as number)

        // За X минут до намаза
        for (const remindMin of remind_before as number[]) {
          const notifyAt = prayerUtcMin - remindMin
          const tag = `prayer-${prayerId}-${remindMin}`
          // Окно шире, чем интервал cron (5 мин) — с запасом на задержку
          // самого вызова. claim() всё равно не даст отправить дважды.
          if (nowUtcMin >= notifyAt && nowUtcMin < notifyAt + 10 && await claim(user_id, tag)) {
            const payload = {
              title: `🔔 До ${name} — ${remindMin} мин`,
              body:  `Намаз в ${(localTimeStr as string).slice(0, 5)}`,
              url:   '/prayer',
              tag,
            }
            sent += await sendToUser(user_id, payload, prayerTokens)
          }
        }

        // В момент намаза
        const atTimeTag = `prayer-${prayerId}-0`
        if (nowUtcMin >= prayerUtcMin && nowUtcMin < prayerUtcMin + 10 && await claim(user_id, atTimeTag)) {
          const payload = {
            title: `🕌 Время ${name}!`,
            body:  'Настало время намаза',
            url:   '/prayer',
            tag:   atTimeTag,
          }
          sent += await sendToUser(user_id, payload, prayerTokens)
        }
      }
    }

    // ── Утренние азкары ──────────────────────────────────────
    if (morning_adhkar_time && azkar_notif_enabled !== false) {
      const [mh, mm] = (morning_adhkar_time as string).split(':').map(Number)
      const morningUtcMin = mh * 60 + mm - (utc_offset as number)
      if (nowUtcMin >= morningUtcMin && nowUtcMin < morningUtcMin + 10 && await claim(user_id, 'adhkar-morning')) {
        const payload = {
          title: '🌅 Утренние азкары',
          body:  'Время для утренних зикров — начни день с поминания Аллаха',
          url:   '/learn',
          tag:   'adhkar-morning',
        }
        sent += await sendToUser(user_id, payload, tokens)
      }
    }

    // ── Вечерние азкары ──────────────────────────────────────
    if (evening_adhkar_time && azkar_notif_enabled !== false) {
      const [eh, em] = (evening_adhkar_time as string).split(':').map(Number)
      const eveningUtcMin = eh * 60 + em - (utc_offset as number)
      if (nowUtcMin >= eveningUtcMin && nowUtcMin < eveningUtcMin + 10 && await claim(user_id, 'adhkar-evening')) {
        const payload = {
          title: '🌆 Вечерние азкары',
          body:  'Время для вечерних зикров — заверши день словами благодарности',
          url:   '/learn',
          tag:   'adhkar-evening',
        }
        sent += await sendToUser(user_id, payload, tokens)
      }
    }
    } catch (err) {
      console.error('[check-prayers] failed for user', schedule.user_id, err)
    }
  }

  return new Response(JSON.stringify({ sent, checked: schedules.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
  } catch (err) {
    console.error('[check-prayers] error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
