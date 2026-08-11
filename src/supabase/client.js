import { createClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'

function fetchWithTimeout(input, init = {}, ms = 20000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON

// ── Запасной путь на случай, когда прокси недоступен ──────────────
// Приложение ходит в Supabase через собственный прокси (nurhayat.ru), потому
// что прямой адрес в РФ нестабилен. Но когда у прокси слетел SSL-сертификат,
// приложение оказалось отрезано от сервера ЦЕЛИКОМ: не работали ни вход, ни
// регистрация, ни сохранение намазов, а внешне оно притворялось рабочим,
// показывая кэш. Теперь при сетевом отказе прокси тот же самый запрос
// повторяется на прямой адрес проекта.
//
// Адрес не хранится отдельной настройкой, а достаётся из anon-ключа: в нём
// лежит ref проекта. Так он не может разъехаться с VITE_SUPABASE_ANON.
function directUrlFromAnonKey(key) {
  try {
    const base64 = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { ref } = JSON.parse(atob(base64))
    return ref ? `https://${ref}.supabase.co` : null
  } catch { return null }
}

const DIRECT_URL = directUrlFromAnonKey(SUPABASE_ANON)

// Прокси уже подводил в этой сессии — не колотимся в него на каждом запросе.
// Сбрасывается при следующем запуске приложения, так что после починки прокси
// трафик сам возвращается на него.
let proxyDown = false

function toDirect(url) {
  return url.startsWith(SUPABASE_URL) ? DIRECT_URL + url.slice(SUPABASE_URL.length) : url
}

// Сколько ждать прокси, прежде чем параллельно попробовать прямой адрес.
// Раньше переключение происходило только после полного 20-секундного таймаута:
// при недоступном прокси вкладка "Намаз" открывалась двадцать секунд, и это
// выглядело как зависшее приложение. Тот же приём уже используется для видео
// букв — там он появился ровно по этой причине.
const HEDGE_AFTER_MS = 3000

function supabaseFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : input?.url
  const canFallback = DIRECT_URL && DIRECT_URL !== SUPABASE_URL && typeof url === 'string' && url.startsWith(SUPABASE_URL)

  if (!canFallback) return fetchWithTimeout(input, init, 20000)
  if (proxyDown)    return fetchWithTimeout(toDirect(url), init, 20000)

  // Гонку устраиваем ТОЛЬКО для чтения. Если продублировать запись — отметку
  // намаза, сообщение в чат, вставку события — дойти могут оба запроса, и
  // строка создастся дважды. Для GET повтор безвреден.
  const method = (init.method || 'GET').toUpperCase()
  if (method === 'GET') return hedgedGet(input, init, url)

  return withProxyFallback(fetchWithTimeout(input, init, 20000), init, url)
}

// Ждём прокси HEDGE_AFTER_MS; если не ответил — подключаем прямой адрес и
// берём того, кто первым закончит. Прокси при этом не отменяем: он остаётся
// предпочтительным, просто пользователь больше не ждёт его молча.
async function hedgedGet(input, init, url) {
  const viaProxy = withProxyFallback(fetchWithTimeout(input, init, 20000), init, url)
  const grace = new Promise(resolve => setTimeout(() => resolve('grace'), HEDGE_AFTER_MS))

  const first = await Promise.race([viaProxy.then(r => ({ res: r }), e => ({ err: e })), grace])
  if (first !== 'grace') {
    if (first.err) throw first.err
    return first.res
  }

  const viaDirect = fetchWithTimeout(toDirect(url), init, 20000)
  // Проигравший запрос игнорируем, но обязательно гасим его отказ — иначе
  // он всплывёт как необработанная ошибка и засорит консоль.
  viaProxy.catch(() => {})
  viaDirect.catch(() => {})
  return Promise.any([viaProxy, viaDirect])
}

function withProxyFallback(request, init, url) {
  // Обычные ответы сервера (401, 500 и т.п.) исключения НЕ бросают — в catch
  // попадают только настоящие отказы связи: DNS, TLS, обрыв, таймаут.
  return request.then(async (res) => {
    // Отдельный случай — домен или хостинг не оплачен. Тогда вместо отказа
    // связи приходит бодрая HTML-заглушка ("услуга приостановлена") с кодом
    // 200, и по одному лишь факту ответа прокси не отличить от рабочего.
    //
    // Одного заголовка content-type для этого МАЛО. При вставке строки (например
    // события аналитики) PostgREST отвечает "201 Created" с ПУСТЫМ телом, а
    // прокси проставляет ему text/html по умолчанию. Проверка по заголовку
    // считала это заглушкой и уводила всё приложение на прямой адрес — для
    // пользователей в РФ без VPN это означало бы полностью мёртвое приложение.
    // Поэтому убеждаемся, что в теле действительно лежит HTML-страница.
    if (!(res.headers.get('content-type') || '').includes('text/html')) return res
    if (res.headers.get('content-length') === '0') return res
    const text = await res.clone().text().catch(() => '')
    if (!/^\s*(<!doctype html|<html)/i.test(text)) return res

    const direct = await fetchWithTimeout(toDirect(url), init, 20000)
    proxyDown = true
    console.warn('[supabase] прокси отдаёт HTML-страницу вместо данных, перешли на прямой адрес')
    return direct
  }).catch(async (err) => {
    const res = await fetchWithTimeout(toDirect(url), init, 20000)
    proxyDown = true
    console.warn('[supabase] прокси недоступен, перешли на прямой адрес:', err?.message)
    return res
  })
}

// navigator.locks в Android WebView часто зависает навсегда — getSession() не возвращается.
async function inProcessLock(_name, _acquireTimeout, fn) {
  return await fn()
}

const storage = {
  getItem:    (key)        => localStorage.getItem(key),
  setItem:    (key, value) => {
    localStorage.setItem(key, value)
    Preferences.set({ key, value }).catch(() => {})
  },
  removeItem: (key)        => {
    localStorage.removeItem(key)
    Preferences.remove({ key }).catch(() => {})
  },
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  global: {
    fetch: supabaseFetch,
  },
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: false,
    storageKey:         'nur-hayat-auth',
    storage,
    lock:               inProcessLock,
  },
  realtime: {
    // WebSocket через прокси часто нестабилен в РФ — не ждём вечно
    timeout: 10000,
  },
})
