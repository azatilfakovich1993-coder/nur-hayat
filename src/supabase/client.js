import { createClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON

// Синхронное чтение из localStorage (предварительно восстановлено из Preferences в main.jsx)
// При записи дублируем в нативный Preferences для сохранения между перезапусками
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
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: false,
    storageKey:         'nur-hayat-auth',
    storage,
  },
})
