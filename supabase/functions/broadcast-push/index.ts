import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import webPush from 'npm:web-push'
import { getFcmAccessToken, sendFcm } from '../_shared/fcm.ts'

// Рассылка push ВСЕМ пользователям сразу (например "мы снова онлайн" после
// простоя хостинга). В отличие от send-push, это не вызывается из
// приложения — только вручную (curl / вкладка Invoke в Supabase Dashboard),
// поэтому защищено тем же секретом, что и cron-функции, а не открыто клиенту.
serve(async (req) => {
  try {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { title, body, url, tag } = await req.json()
    if (!title) {
      return new Response(JSON.stringify({ error: 'Missing title' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
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

    const { data: rows } = await supabase.from('push_tokens').select('token, platform')
    if (!rows?.length) {
      return new Response(JSON.stringify({ sent: 0, total: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload = { title, body: body || '', url: url || '/home', tag: tag || 'broadcast' }
    const jsonPayload = JSON.stringify(payload)

    let sent = 0
    const staleTokens: string[] = []

    for (const { token, platform } of rows) {
      if (platform === 'android') {
        try {
          fcmAccessToken ??= await getFcmAccessToken(serviceAccount)
          const { ok, stale } = await sendFcm(fcmAccessToken, fcmProjectId, token, { ...payload, channelId: 'chat_messages' })
          if (ok) sent++
          else if (stale) staleTokens.push(token)
        } catch { /* временная ошибка FCM — пропускаем этот токен в этот раз */ }
        continue
      }
      try {
        await webPush.sendNotification(JSON.parse(token), jsonPayload)
        sent++
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) staleTokens.push(token)
      }
    }

    if (staleTokens.length) {
      await supabase.from('push_tokens').delete().in('token', staleTokens)
    }

    return new Response(JSON.stringify({ sent, total: rows.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
