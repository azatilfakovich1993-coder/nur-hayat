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
    .select('user_id, timings, remind_before, utc_offset, prayer_notif_enabled, morning_adhkar_time, evening_adhkar_time, azkar_notif_enabled, local_scheduled_date, azkar_local_until')

  if (schedulesErr) console.error('[check-prayers] schedules query failed:', schedulesErr)
  if (!schedules?.length) {
    return new Response(JSON.stringify({ sent: 0, checked: 0 }))
  }

  const DAY_MIN = 1440
  // Приводим "минуту суток" к [0,1440). Без этого намаз, который по UTC
  // попадает в соседние сутки, не совпадал с nowUtcMin НИКОГДА, и push по нему
  // не уходил ни разу: Фаджр 02:40 в Москве (UTC+3) даёт 160-180 = -20, а
  // nowUtcMin всегда 0..1439. Так же ломалась поздняя Иша в западных поясах (>1440).
  const normMin = (m: number) => ((m % DAY_MIN) + DAY_MIN) % DAY_MIN
  // Окно [start, start+len) с корректным переходом через полночь.
  const inWindow = (nowMin: number, start: number, len: number) => normMin(nowMin - start) < len

  // Идемпотентность: без этого одно и то же событие (напр. "20 мин до Фаджра")
  // уходило до 5 раз подряд, пока держится 5-минутное окно ниже — сколько бы
  // раз за это окно ни дёрнул функцию внешний cron. claim() отправляет только
  // тому, кто первым "застолбил" tag на сегодня. Дата — локальная для
  // пользователя, а не UTC: иначе ночной Фаджр (23:40 UTC предыдущих суток)
  // и дневные намазы попадали бы в разные "дни" и дедупликация разъезжалась.
  async function claim(userId: string, tag: string, onDate: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('notif_log')
      .upsert({ user_id: userId, tag, sent_on: onDate }, { onConflict: 'user_id,tag,sent_on', ignoreDuplicates: true })
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
            local_scheduled_date, azkar_local_until } = schedule

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', user_id)

    if (!tokens?.length) continue

    // Без часового пояса нельзя посчитать ни одно время — раньше здесь
    // получался NaN, new Date(NaN).toISOString() кидал исключение, и
    // пользователь молча выпадал из рассылки целиком без внятной причины.
    if (utc_offset == null) {
      console.warn('[check-prayers] utc_offset не задан для', user_id, '— пропускаем')
      continue
    }

    // На Android телефон сам ставит локальные будильники на намаз, пока
    // приложение открывалось сегодня (см. PrayerPage.jsx) — раньше сервер
    // слал push независимо от этого, и Android-пользователь гарантированно
    // получал двойное уведомление на каждое событие намаза. Если телефон
    // уже отметился (local_scheduled_date = сегодня по его локальному
    // времени), для намазов не шлём на android-токены — только на
    // web/ios, у которых локального будильника нет.
    const userLocalToday = new Date(now.getTime() + (utc_offset as number) * 60000).toISOString().slice(0, 10)
    const localCoversToday = local_scheduled_date === userLocalToday
    const prayerTokens = localCoversToday ? tokens.filter(t => t.platform !== 'android') : tokens

    // То же самое для азкаров: телефон ставит их сразу на 30 дней вперёд и
    // отмечает, докуда (см. useAzkarNotif.js), поэтому тут сравнение с датой
    // конца покрытия, а не с одним сегодняшним днём, как у намаза.
    const azkarLocalCovers = azkar_local_until != null && azkar_local_until >= userLocalToday
    const azkarTokens = azkarLocalCovers ? tokens.filter(t => t.platform !== 'android') : tokens

    // ── Уведомления намазов ──────────────────────────────────
    if (prayer_notif_enabled !== false && timings && prayerTokens.length > 0) {
      for (const [prayerId, localTimeStr] of Object.entries(timings as Record<string, string>)) {
        const name = PRAYER_NAMES[prayerId]
        if (!name) continue

        const [h, m] = (localTimeStr as string).split(':').map(Number)
        const prayerUtcMin = normMin(h * 60 + m - (utc_offset as number))

        // За X минут до намаза
        for (const remindMin of remind_before as number[]) {
          const notifyAt = normMin(prayerUtcMin - remindMin)
          const tag = `prayer-${prayerId}-${remindMin}`
          // Окно шире, чем интервал cron (5 мин) — с запасом на задержку
          // самого вызова. claim() всё равно не даст отправить дважды.
          if (inWindow(nowUtcMin, notifyAt, 10) && await claim(user_id, tag, userLocalToday)) {
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
        if (inWindow(nowUtcMin, prayerUtcMin, 10) && await claim(user_id, atTimeTag, userLocalToday)) {
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
    if (morning_adhkar_time && azkar_notif_enabled !== false && azkarTokens.length > 0) {
      const [mh, mm] = (morning_adhkar_time as string).split(':').map(Number)
      const morningUtcMin = normMin(mh * 60 + mm - (utc_offset as number))
      if (inWindow(nowUtcMin, morningUtcMin, 10) && await claim(user_id, 'adhkar-morning', userLocalToday)) {
        const payload = {
          title: '🌅 Утренние азкары',
          body:  'Время для утренних зикров — начни день с поминания Аллаха',
          url:   '/learn',
          tag:   'adhkar-morning',
        }
        sent += await sendToUser(user_id, payload, azkarTokens)
      }
    }

    // ── Вечерние азкары ──────────────────────────────────────
    if (evening_adhkar_time && azkar_notif_enabled !== false && azkarTokens.length > 0) {
      const [eh, em] = (evening_adhkar_time as string).split(':').map(Number)
      const eveningUtcMin = normMin(eh * 60 + em - (utc_offset as number))
      if (inWindow(nowUtcMin, eveningUtcMin, 10) && await claim(user_id, 'adhkar-evening', userLocalToday)) {
        const payload = {
          title: '🌆 Вечерние азкары',
          body:  'Время для вечерних зикров — заверши день словами благодарности',
          url:   '/learn',
          tag:   'adhkar-evening',
        }
        sent += await sendToUser(user_id, payload, azkarTokens)
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
