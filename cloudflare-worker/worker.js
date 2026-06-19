// Прокси перед Supabase (Frankfurt) — обходит блокировку/замедление
// провайдером прямого доступа к qnkgvsxjxjfmjopnzmdu.supabase.co.
// Воркер всегда проксирует ТОЛЬКО на этот хост (open-proxy невозможен).

const SUPABASE_HOST = 'qnkgvsxjxjfmjopnzmdu.supabase.co'

export default {
  async fetch(request) {
    const url = new URL(request.url)
    url.hostname = SUPABASE_HOST
    url.protocol = 'https:'
    url.port = ''

    // Realtime (WebSocket)
    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const upstream = await fetch(url.toString(), {
        method: request.method,
        headers: request.headers,
      })
      return new Response(null, { status: 101, webSocket: upstream.webSocket })
    }

    // REST / Auth / Storage / Functions
    const init = {
      method: request.method,
      headers: request.headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'follow',
      cf: { cacheEverything: false },
    }
    const response = await fetch(url.toString(), init)
    const headers = new Headers(response.headers)
    headers.delete('content-encoding')
    headers.delete('content-length')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  },
}
