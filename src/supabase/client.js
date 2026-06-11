import { createClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'

function fetchWithTimeout(input, init = {}, ms = 20000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON

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
    // WebSocket через прокси часто нестабилен в РФ — не ждём вечно
    timeout: 10000,
  },
})
