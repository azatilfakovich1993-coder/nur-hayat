import { localDateStr } from './date'

// Метод «свои углы» у Aladhan — только при нём работает methodSettings.
export const CUSTOM_METHOD = 99
// Метод по умолчанию — САМР (Духовное управление мусульман России), номер 14
// по справочнику Aladhan. Приложение русскоязычное, и именно он задумывался
// основным (в прежнем списке стоял под ошибочным номером 15).
export const DEFAULT_METHOD = 14

export async function fetchTimings(lat, lon, method, school, fajrAngle, ishaAngle) {
  const today = localDateStr()
  const latR = Math.round(lat * 100) / 100
  const lonR = Math.round(lon * 100) / 100
  const cacheKey = `pt-${latR}-${lonR}-${method}-${school}-${fajrAngle}-${ishaAngle}-${today}`
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch {}

  // Раньше здесь всегда стоял method=99 (свой расчёт по углам), а выбранный
  // пользователем метод уходил только в ключ кэша. Из-за этого переключение
  // «Мировая лига / САМР / Турция / Умм аль-Кура» не меняло ВООБЩЕ НИЧЕГО:
  // галочка переезжала, времена оставались прежними.
  //
  // Подменить метод углами нельзя: например, у Умм аль-Кура Иша считается не
  // по углу, а как «90 минут после Магриба». Поэтому настоящий метод передаём
  // как есть, а methodSettings отправляем только для метода 99 («Свои углы»),
  // где углы и есть смысл настройки.
  const url = method === CUSTOM_METHOD
    ? `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=99&methodSettings=${fajrAngle},null,${ishaAngle}&school=${school}&midnightMode=0`
    : `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}&school=${school}&midnightMode=0`

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
