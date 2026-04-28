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

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const userRef = useRef(null)

  useEffect(() => {
    // Сначала проверяем существующую сессию (критично для PWA)
    supabase.auth.getSession().then(({ data: { session } }) => {
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
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
      // Восстанавливаем прогресс из Supabase в localStorage
      if (data?.progress) restoreProgress(data.progress)
    } catch {
      // ignore
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
    setProfile(data)
  }

  const logout = async () => {
    // Сохраняем прогресс перед выходом
    if (userRef.current) await saveProgress(userRef.current.id)
    await supabase.auth.signOut()
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
