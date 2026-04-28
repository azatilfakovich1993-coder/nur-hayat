import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const ALLOWED_HOSTS = [
  'everyayah.com',
  'cdn.islamic.network',
  'verses.quran.com',
]

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const { searchParams } = new URL(req.url)
  const audioUrl = searchParams.get('url')

  if (!audioUrl) {
    return new Response('Missing url param', { status: 400, headers: CORS })
  }

  // Проверяем что URL с разрешённого хоста
  let parsed: URL
  try { parsed = new URL(audioUrl) } catch {
    return new Response('Invalid url', { status: 400, headers: CORS })
  }

  const host = parsed.hostname.replace('www.', '')
  if (!ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h))) {
    return new Response('Host not allowed', { status: 403, headers: CORS })
  }

  try {
    const upstream = await fetch(audioUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NurHayat/1.0)' }
    })

    if (!upstream.ok) {
      return new Response('Upstream error', { status: upstream.status, headers: CORS })
    }

    const contentType = upstream.headers.get('content-type') || 'audio/mpeg'
    const body = await upstream.arrayBuffer()

    return new Response(body, {
      headers: {
        ...CORS,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      }
    })
  } catch (e) {
    return new Response('Fetch error: ' + String(e), { status: 500, headers: CORS })
  }
})
