import { localDateStr } from './date'

export async function fetchTimings(lat, lon, method, school, fajrAngle, ishaAngle) {
  const today = localDateStr()
  const latR = Math.round(lat * 100) / 100
  const lonR = Math.round(lon * 100) / 100
  const cacheKey = `pt-${latR}-${lonR}-${method}-${school}-${fajrAngle}-${ishaAngle}-${today}`
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch {}

  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=99&methodSettings=${fajrAngle},null,${ishaAngle}&school=${school}&midnightMode=0`

  async function fetchOnce() {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error('aladhan error')
      return await res.json()
    } finally {
      clearTimeout(timer)
    }
  }

  // Под VPN/плохой сетью один запрос легко ловит таймаут — пробуем несколько раз,
  // прежде чем показать пользователю ошибку
  let lastErr
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const json = await fetchOnce()
      try { localStorage.setItem(cacheKey, JSON.stringify(json.data)) } catch {}
      return json.data
    } catch (err) {
      lastErr = err
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
    }
  }
  throw lastErr
}
