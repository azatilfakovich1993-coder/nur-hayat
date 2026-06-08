import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { supabase } from '../supabase/client'

const AuthContext = createContext(null)

// Все ключи localStorage, которые нужно синхронизировать между устройствами
const PROGRESS_KEYS = [
  'alphabet_listened',
  'surah_progress',
  'read_surahs',
  'shahada_confirmed',
  'liked_hadiths',
  'liked_verse_keys',
  'liked_verses_data',
  'beginner_path',
  'glossary_read',
  'prayer_streak',
  'prayer_city',
  'prayer_mode',
  'beginner_path_celebrated',
]

function restoreProgress(progress) {
  if (!progress || typeof progress !== 'object') return
  Object.entries(progress).forEach(([key, value]) => {
    if (PROGRESS_KEYS.includes(key) && value !== null && value !== undefined) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    }
  })
}

function collectProgress() {
  const progress = {}
  PROGRESS_KEYS.forEach(key => {
    const val = localStorage.getItem(key)
    if (val !== null) progress[key] = val
  })
  return progress
}

// Кэш профиля — показываем мгновенно при запуске, обновляем в фоне
// (на медленном/мобильном интернете не заставляем ждать сеть)
function getCachedProfile(userId) {
  try {
    const raw = localStorage.getItem('nur-hayat-profile-' + userId)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function setCachedProfile(userId, profile) {
  try { localStorage.setItem('nur-hayat-profile-' + userId, JSON.stringify(profile)) } catch {}
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const userRef = useRef(null)

  useEffect(() => {
    // Сначала проверяем существующую сессию (критично для PWA)
    // Таймаут 6 сек — Supabase может не отвечать в России
    Promise.race([
      supabase.auth.getSession(),
      new Promise(r => setTimeout(() => r({ data: { session: null } }), 4000))
    ]).then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      userRef.current = u
      if (u) loadProfile(u.id)
      else { setProfile(null); setLoading(false) }
    })

    // Затем слушаем изменения (логин, выход, обновление токена)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      userRef.current = u
      if (u) loadProfile(u.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Сохраняем прогресс когда пользователь уходит с вкладки / закрывает приложение
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && userRef.current) {
        saveProgress(userRef.current.id)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Периодическое сохранение каждые 2 минуты
  useEffect(() => {
    const id = setInterval(() => {
      if (userRef.current) saveProgress(userRef.current.id)
    }, 2 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  async function loadProfile(userId) {
    // Сначала показываем кэш — мгновенно, без ожидания сети
    const cached = getCachedProfile(userId)
    if (cached) {
      setProfile(cached)
      if (cached.progress) restoreProgress(cached.progress)
      setLoading(false)
    }
    try {
      const { data, error } = await Promise.race([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ])
      if (data) {
        setProfile(data)
        setCachedProfile(userId, data)
        if (data.progress) restoreProgress(data.progress)
      } else if (error?.code === 'PGRST116') {
        // Строки профиля нет — регистрация прервалась после signUp,
        // но до записи профиля (Supabase не успел ответить вовремя).
        // Создаём профиль сейчас, чтобы аккаунт не остался "битым".
        const u = userRef.current
        const { data: created } = await supabase.from('profiles').insert({
          id:             userId,
          name:           u?.user_metadata?.name || '',
          email:          u?.email || '',
          language:       'ru',
          translation_id: 131,
          level:          'seeker',
          nur:            10,
          streak:         1,
          onboarded:      false,
        }).select().single()
        if (created) {
          setProfile(created)
          setCachedProfile(userId, created)
        }
      }
    } catch {
      // сеть не ответила — остаёмся на кэше (если он был)
    } finally {
      setLoading(false)
    }
  }

  async function saveProgress(userId) {
    const uid = userId || userRef.current?.id
    if (!uid) return
    const progress = collectProgress()
    await supabase.from('profiles').update({ progress }).eq('id', uid)
  }

  const refreshProfile = async () => {
    if (!userRef.current) return
    const { data } = await supabase.from('profiles').select('*').eq('id', userRef.current.id).single()
    if (data) {
      setProfile(data)
      setCachedProfile(userRef.current.id, data)
    }
  }

  const logout = async () => {
    // Сохраняем прогресс перед выходом — не ждём дольше 3 секунд
    if (userRef.current) {
      await Promise.race([
        saveProgress(userRef.current.id),
        new Promise(r => setTimeout(r, 3000))
      ])
    }
    // signOut тоже с таймаутом — не ждём дольше 3 секунд
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise(r => setTimeout(r, 3000))
      ])
    } catch {}
    setUser(null)
    userRef.current = null
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, refreshProfile, saveProgress, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
