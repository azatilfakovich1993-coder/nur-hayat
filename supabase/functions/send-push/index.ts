import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import webPush from 'npm:web-push'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { recipient_id, title, body, url, tag } = await req.json()

    if (!recipient_id || !title) {
      return new Response(JSON.stringify({ error: 'Missing recipient_id or title' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    webPush.setVapidDetails(
      'mailto:admin@nurhayat.app',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!,
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: rows } = await supabaseClient
      .from('push_tokens')
      .select('token')
      .eq('user_id', recipient_id)

    if (!rows?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({
      title,
      body:  body  || '',
      url:   url   || '/chat',
      tag:   tag   || 'nur-hayat',
    })

    let sent = 0
    const staleTokens: string[] = []

    for (const { token } of rows) {
      try {
        const subscription = JSON.parse(token)
        await webPush.sendNotification(subscription, payload)
        sent++
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          staleTokens.push(token)
        }
      }
    }

    if (staleTokens.length) {
      await supabaseClient.from('push_tokens').delete().in('token', staleTokens)
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
