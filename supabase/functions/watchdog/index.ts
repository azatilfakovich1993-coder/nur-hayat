import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getFcmAccessToken, sendFcm } from '../_shared/fcm.ts'

// Сторож за прокси nurhayat.ru.
//
// Приложение ходит в Supabase через прокси на REG.RU. Когда у прокси слетел
// SSL-сертификат, приложение оказалось отрезано от сервера на несколько часов,
// и разработчик узнал об этом от пользователя. Эта функция проверяет прокси
// каждые 5 минут (pg_cron) и пишет разработчику лично — push на телефон и
// письмо. Работает с самого Supabase, напрямую, поэтому падение REG.RU на неё
// не влияет.
//
// Пользователей это НЕ касается: им ничего не показывается и не шлётся.

const PROXY_URL = Deno.env.get('PROXY_URL') ?? 'https://nurhayat.ru'
const SERVICE_KEY = 'proxy'
// Пока авария не устранена, повторяем напоминание не чаще раза в час —
// иначе при пятиминутном cron это было бы 12 сообщений в час.
const REALERT_MS = 60 * 60 * 1000

type Check = { down: boolean; reason: string }

async function checkProxy(): Promise<Check> {
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15000)
    const res = await fetch(`${PROXY_URL}/auth/v1/health`, {
      headers: { apikey: anon },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer))

    // Домен или хостинг не оплачен — вместо отказа связи приходит бодрая
    // HTML-заглушка с кодом 200. Supabase HTML тут не отдаёт никогда.
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('text/html')) {
      return { down: true, reason: `прокси отдаёт HTML вместо данных (код ${res.status}) — похоже на заглушку хостинга или неоплаченный домен` }
    }
    if (!res.ok) {
      return { down: true, reason: `прокси ответил кодом ${res.status}` }
    }
    return { down: false, reason: 'ok' }
  } catch (err) {
    // Сюда попадают настоящие отказы связи: сертификат, DNS, обрыв, таймаут.
    return { down: true, reason: `нет связи с прокси: ${(err as Error).message}` }
  }
}

serve(async (req) => {
  try {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const check = await checkProxy()
    const now = new Date()

    const { data: state } = await supabase
      .from('service_health')
      .select('is_down, changed_at, last_alert_at')
      .eq('service', SERVICE_KEY)
      .maybeSingle()

    const wasDown = state?.is_down === true
    const lastAlert = state?.last_alert_at ? new Date(state.last_alert_at).getTime() : 0
    const stateChanged = wasDown !== check.down

    // Сообщаем: когда состояние изменилось (упало / поднялось) и когда авария
    // затянулась — раз в час, чтобы не забылась.
    const shouldAlert = stateChanged || (check.down && now.getTime() - lastAlert > REALERT_MS)

    if (stateChanged) {
      await supabase.from('service_health').upsert(
        { service: SERVICE_KEY, is_down: check.down, changed_at: now.toISOString() },
        { onConflict: 'service' },
      )
    }

    if (!shouldAlert) {
      return new Response(JSON.stringify({ down: check.down, alerted: false, reason: check.reason }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const downSince = wasDown && state?.changed_at ? new Date(state.changed_at) : now
    const title = check.down ? '⚠️ Nur Hayat: сервер недоступен' : '✅ Nur Hayat: сервер снова работает'
    const body = check.down
      ? `Проверьте REG.RU (хостинг и домен nurhayat.ru). ${check.reason}`
      : `Прокси отвечает нормально. Простой длился с ${downSince.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} МСК.`

    await Promise.allSettled([
      alertPush(supabase, title, body),
      alertEmail(title, body, check.reason),
    ])

    await supabase.from('service_health').upsert(
      { service: SERVICE_KEY, is_down: check.down, changed_at: stateChanged ? now.toISOString() : (state?.changed_at ?? now.toISOString()), last_alert_at: now.toISOString() },
      { onConflict: 'service' },
    )

    return new Response(JSON.stringify({ down: check.down, alerted: true, reason: check.reason }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[watchdog] error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})

// Push только на устройства разработчика — обычные пользователи об авариях
// не уведомляются.
async function alertPush(supabase: any, title: string, body: string) {
  const alertUserId = Deno.env.get('ALERT_USER_ID')
  if (!alertUserId) return
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token, platform')
    .eq('user_id', alertUserId)
    .eq('platform', 'android')
  if (!tokens?.length) return

  const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!)
  const accessToken = await getFcmAccessToken(serviceAccount)
  for (const { token } of tokens) {
    await sendFcm(accessToken, serviceAccount.project_id, token, {
      title, body, url: '/profile', tag: 'watchdog', channelId: 'prayer_reminders',
    }).catch(() => {})
  }
}

async function alertEmail(title: string, body: string, reason: string) {
  const key = Deno.env.get('RESEND_API_KEY')
  const to = Deno.env.get('ALERT_EMAIL')
  if (!key || !to) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Нур Хаят <onboarding@resend.dev>',
      to: [to],
      subject: title,
      html: `<div style="font-family:sans-serif;font-size:15px;line-height:1.6">
        <p><b>${title}</b></p>
        <p>${body}</p>
        <p style="color:#666;font-size:13px">Техническая причина: ${reason}</p>
        <p style="color:#666;font-size:13px">Проверено: ${PROXY_URL}/auth/v1/health</p>
      </div>`,
    }),
  }).catch(() => {})
}
