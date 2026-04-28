import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body = await req.json().catch(() => ({}))
    const { name, email, message } = body

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Заполните все поля' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Нур Хаят <onboarding@resend.dev>',
        to:   ['azatilfakovich1993@gmail.com'],
        subject: `📩 Обращение от ${name} — Нур Хаят`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#C9A84C;">Новое обращение — Нур Хаят</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px;font-weight:bold;color:#555;width:120px;">Имя:</td>
                <td style="padding:8px;">${name}</td>
              </tr>
              <tr style="background:#f9f9f9;">
                <td style="padding:8px;font-weight:bold;color:#555;">Email:</td>
                <td style="padding:8px;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding:8px;font-weight:bold;color:#555;vertical-align:top;">Сообщение:</td>
                <td style="padding:8px;white-space:pre-wrap;">${message}</td>
              </tr>
            </table>
            <hr style="margin-top:24px;border:none;border-top:1px solid #eee;">
            <p style="color:#aaa;font-size:12px;">Нур Хаят · nurhayat-78bc5.web.app</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: err }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
