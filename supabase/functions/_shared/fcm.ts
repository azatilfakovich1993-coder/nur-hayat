import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.8/mod.ts'

export async function getFcmAccessToken(serviceAccount: Record<string, string>): Promise<string> {
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

// notification.tag (web push) не имеет прямого аналога в FCM notification —
// кладём его в data, чтобы клиент мог дедуплицировать при необходимости.
export async function sendFcm(
  accessToken: string,
  projectId: string,
  token: string,
  { title, body, url, tag, channelId }: { title: string; body: string; url?: string; tag?: string; channelId?: string },
): Promise<{ ok: boolean; status: number; stale: boolean }> {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        android: {
          priority: 'HIGH',
          notification: {
            sound: 'default',
            channel_id: channelId || 'prayer_reminders',
            notification_priority: 'PRIORITY_HIGH',
            default_sound: true,
            default_vibrate_timings: true,
          },
        },
        data: { url: url || '/', tag: tag || 'nur-hayat' },
      },
    }),
  })
  // FCM возвращает 404/400 UNREGISTERED для невалидных/отозванных токенов
  let stale = false
  if (!res.ok) {
    try {
      const json = await res.json()
      stale = json?.error?.status === 'UNREGISTERED' || json?.error?.status === 'NOT_FOUND'
    } catch { /* тело не JSON — не считаем токен протухшим */ }
  }
  return { ok: res.ok, status: res.status, stale }
}
