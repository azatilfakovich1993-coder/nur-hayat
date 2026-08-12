import { localDateStr } from './date'

// Метод «свои углы» у Aladhan — только при нём работает methodSettings.
export const CUSTOM_METHOD = 99
// Метод по умолчанию — САМР (Духовное управление мусульман России), номер 14
// по справочнику Aladhan. Приложение русскоязычное, и именно он задумывался
// основным (в прежнем списке стоял под ошибочным номером 15).
export const DEFAULT_METHOD = 14

// Отметка «метод расчёта уже определён и записан». Ставится один раз: либо при
// первом заходе во вкладку «Намаз», либо при автонастройке после регистрации —
// смотря что случится раньше. Живёт здесь, а не в PrayerPage, потому что нужна
// обоим.
export const METHOD_MIGRATED_KEY = 'prayer_method_real_v1'

// Последний удачный расчёт — чтобы вкладка «Намаз» показывала времена сразу,
// не дожидаясь спутников. Хранится один на всё приложение: какой бы точкой ни
// был получен, для сегодняшнего дня он верен с точностью до пары минут.
const LAST_KEY = 'pt-last'

// Подпись настроек расчёта. Если человек сменил метод или школу, показывать
// прежний результат нельзя — времена по ним и должны отличаться.
const sigOf = (method, school, fajrAngle, ishaAngle) =>
  `${method}-${school}-${fajrAngle}-${ishaAngle}`

// Готовый результат за сегодня, посчитанный по тем же настройкам. Нужен, чтобы
// показать времена мгновенно, пока в фоне определяется точное местоположение.
export function cachedTimings(method, school, fajrAngle, ishaAngle) {
  try {
    const raw = localStorage.getItem(LAST_KEY)
    if (!raw) return null
    const o = JSON.parse(raw)
    if (o?.date !== localDateStr()) return null
    if (o?.sig !== sigOf(method, school, fajrAngle, ishaAngle)) return null
    return o
  } catch { return null }
}

export async function fetchTimings(lat, lon, method, school, fajrAngle, ishaAngle) {
  const today = localDateStr()
  // Координаты округляем ДО запроса, а не только для ключа кэша. Раньше в адрес
  // уходили сырые показания GPS, которые дрожат в последних знаках при каждом
  // измерении, — из-за этого запрос всякий раз считался новым. Сотая доля
  // градуса это около километра, времена намаза на таком расстоянии расходятся
  // на считаные секунды.
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
  // Запрос идёт через собственный прокси, а не напрямую в api.aladhan.com:
  // с мобильного интернета в РФ этот сервис недоступен (браузер на телефоне
  // прямо пишет "нет соединения"), и времена намаза не загружались вообще.
  // Тем же путём уже ходит поиск городов — см. /nominatim.
  //
  // Дата в адресе указывается явно. Без неё Aladhan отвечает перенаправлением
  // на адрес с датой, а прокси отдаёт его клиенту как есть — тот идёт по
  // относительной ссылке уже на наш домен, промахивается мимо ветки /aladhan/
  // и упирается в Supabase. С датой перенаправления нет вовсе.
  const [y, m, d] = today.split('-')
  const base = `${import.meta.env.VITE_SUPABASE_URL}/aladhan/v1/timings/${d}-${m}-${y}`
  const url = method === CUSTOM_METHOD
    ? `${base}?latitude=${latR}&longitude=${lonR}&method=99&methodSettings=${fajrAngle},null,${ishaAngle}&school=${school}&midnightMode=0`
    : `${base}?latitude=${latR}&longitude=${lonR}&method=${method}&school=${school}&midnightMode=0`

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
      try {
        localStorage.setItem(LAST_KEY, JSON.stringify({
          date: today,
          sig:  sigOf(method, school, fajrAngle, ishaAngle),
          lat:  latR,
          lon:  lonR,
          data: json.data,
        }))
      } catch {}
      return json.data
    } catch (err) {
      lastErr = err
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
    }
  }
  throw lastErr
}
