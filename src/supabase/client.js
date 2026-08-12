import { createClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'

function fetchWithTimeout(input, init = {}, ms = 20000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON

// Приложение ходит в Supabase ТОЛЬКО через собственный прокси (nurhayat.ru):
// прямой адрес в РФ без VPN ненадёжен, ради этого прокси и заведён.
//
// Здесь был автоматический запасной путь — при недоступности прокси запрос
// повторялся на прямой адрес. Задумывался он против редкой аварии (слетел
// сертификат, приложение отрезано от сервера), но на практике вышло хуже
// болезни: на мобильном интернете прокси иногда отвечает дольше секунд, и
// приложение перепрыгивало на прямой адрес — тот самый, который в РФ и не
// работает. Со стороны это выглядело как "работает, но нестабильно".
//
// Защита от аварии осталась, но снаружи: сторож (supabase/functions/watchdog)
// проверяет прокси каждые 5 минут и пишет разработчику. Чинить аварию должен
// человек, а не приложение у пользователя в кармане.

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
    fetch: (input, init) => fetchWithTimeout(input, init, 20000),
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
    // ВНИМАНИЕ: постоянные соединения (Realtime) в этом приложении НЕ работают
    // и подписок больше нет — не заводи их снова. Приложение ходит в Supabase
    // только через собственный прокси на PHP, а тот такие соединения держать не
    // умеет в принципе: на попытку подключиться отвечает ошибкой 500 (проверено
    // замером, напрямую в Supabase то же соединение поднимается нормально).
    // Библиотека при отказе переподключается снова и снова, и этот поток ошибок
    // с одного адреса защита хостинга принимает за атаку — так у разработчика
    // и оказался закрыт доступ с мобильного интернета.
    // Чат и счётчик непрочитанного обновляются опросом, см. ChatPage и App.
    timeout: 10000,
  },
})
