import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.8/mod.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!

async function getFcmAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const pemKey = serviceAccount.private_key
  const pemContents = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '')
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )
  const jwt = await create(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: getNumericDate(0),
      exp: getNumericDate(3600),
    },
    cryptoKey
  )
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })
  const tokenJson = await tokenRes.json()
  if (!tokenJson.access_token) throw new Error('No access token: ' + JSON.stringify(tokenJson))
  return tokenJson.access_token
}

serve(async (req) => {
  try {
    const body = await req.json()
    const record = body.record ?? body.new ?? body
    if (!record?.id) return new Response('no record', { status: 200 })

    // Отправляем уведомление ТОЛЬКО если это ответ на чьё-то сообщение
    if (!record.reply_to_id) {
      return new Response('not a reply, skip', { status: 200 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Находим автора сообщения на которое ответили
    const { data: originalMsg } = await supabase
      .from('messages')
      .select('user_id')
      .eq('id', record.reply_to_id)
      .single()

    if (!originalMsg) return new Response('original message not found', { status: 200 })

    const recipientId = originalMsg.user_id

    // Не уведомляем если человек ответил сам себе
    if (recipientId === record.user_id) {
      return new Response('self-reply, skip', { status: 200 })
    }

    // Получаем FCM-токен получателя
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('platform', 'android')
      .eq('user_id', recipientId)

    if (!tokens || tokens.length === 0) {
      return new Response('no token for recipient', { status: 200 })
    }

    const senderName = record.display_name || record.user_name || 'Нур Хаят'
    const text = record.content || '📩 Ответил(а) вам'

    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT)
    const projectId = serviceAccount.project_id
    const accessToken = await getFcmAccessToken(serviceAccount)

    const results = await Promise.allSettled(
      tokens.map(({ token }) =>
        fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title: `${senderName} ответил(а) вам`,
                body: text.length > 100 ? text.slice(0, 100) + '…' : text,
              },
              android: {
                priority: 'HIGH',
                notification: {
                  sound: 'default',
                  channel_id: 'chat_messages',
                  notification_priority: 'PRIORITY_HIGH',
                  default_sound: true,
                  default_vibrate_timings: true,
                },
              },
              data: {
                type: 'chat_reply',
                message_id: String(record.id),
              },
            },
          }),
        }).then(r => r.json())
      )
    )

    console.log('[notify-chat] sent reply notification to', recipientId)
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[notify-chat] error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
