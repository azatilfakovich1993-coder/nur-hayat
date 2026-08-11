import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { supabase } from '../supabase/client'
import { withTimeout, withRetry } from '../utils/network'

const AuthContext = createContext(null)
const AUTH_KEY = 'nur-hayat-auth'

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

function readStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.user ?? null
  } catch {
    return null
  }
}

function clearProgress() {
  PROGRESS_KEYS.forEach(key => localStorage.removeItem(key))
}

function restoreProgress(progress) {
  if (!progress || typeof progress !== 'object') return
  Object.entries(progress).forEach(([key, value]) => {
    if (PROGRESS_KEYS.includes(key) && value !== null && value !== undefined) {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
      }
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

function getCachedProfile(userId) {
  try {
    const raw = localStorage.getItem('nur-hayat-profile-' + userId)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function setCachedProfile(userId, profile) {
  try { localStorage.setItem('nur-hayat-profile-' + userId, JSON.stringify(profile)) } catch {}
}

// Заглушка на время, пока настоящий профиль едет с сервера. Здесь СОЗНАТЕЛЬНО
// нет gender: пол ничем не заменить, а угаданное значение открыло бы доступ не
// в тот раздел чата. Флаг _partial говорит остальному приложению "это ещё не
// настоящие данные" — по нему заглушка не попадает в кэш (иначе она оставалась
// бы там навсегда и подменяла собой профиль с реально заполненным полом).
function minimalProfile(user) {
  return {
    id:             user.id,
    name:           user.user_metadata?.name || user.email?.split('@')[0] || '',
    email:          user.email || '',
    language:       'ru',
    translation_id: 131,
    level:          'seeker',
    nur:            10,
    streak:         0,
    onboarded:      true,
    _partial:       true,
  }
}

export function AuthProvider({ children }) {
  const bootUser = readStoredUser()
  const bootProfile = bootUser ? getCachedProfile(bootUser.id) : null

  const [user,    setUser]       = useState(bootUser)
  const [profile, setProfileRaw] = useState(bootProfile)
  const [loading, setLoading]    = useState(false)
  const userRef = useRef(bootUser)
  const profileLoadRef = useRef(null)

  const setProfile = (updaterOrValue) => {
    setProfileRaw(prev => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
      // Заглушку (_partial) в кэш не пишем. Раньше писали — и если профиль не
      // успел загрузиться (медленная сеть, обрыв), в localStorage оседал профиль
      // без gender и подставлялся при каждом следующем запуске уже как готовый.
      // Пользователь с указанным на сервере полом получал в чате "укажи пол".
      if (next && !next._partial && userRef.current) setCachedProfile(userRef.current.id, next)
      return next
    })
  }

  useEffect(() => {
    const stored = readStoredUser()
    if (stored) {
      userRef.current = stored
      setUser(stored)
      const cached = getCachedProfile(stored.id)
      if (cached) {
        setProfile(cached)
        if (cached.progress) restoreProgress(cached.progress)
      } else {
        setProfile(minimalProfile(stored))
      }
      loadProfile(stored.id)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return

      const u = session?.user ?? null
      userRef.current = u
      setUser(u)

      if (!u) {
        setProfile(null)
        return
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        const lastUid = localStorage.getItem('nur-hayat-last-uid')
        if (lastUid !== u.id) clearProgress()
        localStorage.setItem('nur-hayat-last-uid', u.id)
        const cached = getCachedProfile(u.id)
        if (cached) {
          setProfile(cached)
          if (cached.progress) restoreProgress(cached.progress)
        } else {
          setProfile(minimalProfile(u))
        }
        loadProfile(u.id)
      }
    })

    withTimeout(supabase.auth.getSession(), 5000)
      .then(({ data: { session } }) => {
        const u = session?.user ?? readStoredUser()
        if (!u || userRef.current?.id === u.id) return
        userRef.current = u
        setUser(u)
        const cached = getCachedProfile(u.id)
        setProfile(cached || minimalProfile(u))
        loadProfile(u.id)
      })
      .catch(() => {})

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && userRef.current) {
        saveProgress(userRef.current.id)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      if (userRef.current) saveProgress(userRef.current.id)
    }, 2 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  async function loadProfile(userId) {
    if (profileLoadRef.current === userId) return
    profileLoadRef.current = userId

    try {
      const { data, error } = await withRetry(
        () => supabase.from('profiles').select('*').eq('id', userId).single(),
        { attempts: 3, timeoutMs: 12000 },
      )

      if (data) {
        setProfile(data)
        if (data.progress) restoreProgress(data.progress)
        return
      }

      if (error?.code !== 'PGRST116') return

      await new Promise(r => setTimeout(r, 1200))
      const { data: retried } = await withRetry(
        () => supabase.from('profiles').select('*').eq('id', userId).single(),
        { attempts: 2, timeoutMs: 12000 },
      )
      if (retried) {
        setProfile(retried)
        if (retried.progress) restoreProgress(retried.progress)
        return
      }

      const u = userRef.current
      const { data: created } = await withRetry(
        () => supabase.from('profiles').insert({
          id:             userId,
          name:           u?.user_metadata?.name || '',
          email:          u?.email || '',
          language:       'ru',
          translation_id: 131,
          level:          'seeker',
          nur:            10,
          streak:         1,
          onboarded:      false,
        }).select().single(),
        { attempts: 2, timeoutMs: 12000 },
      )
      if (created) setProfile(created)
    } catch {
      // сеть не ответила — остаёмся на кэше / minimalProfile
    } finally {
      profileLoadRef.current = null
    }
  }

  async function saveProgress(userId) {
    const uid = userId || userRef.current?.id
    if (!uid) return
    const progress = collectProgress()
    try {
      await withRetry(
        () => supabase.from('profiles').update({ progress }).eq('id', uid),
        { attempts: 2, timeoutMs: 10000 },
      )
    } catch {}
  }

  const refreshProfile = async () => {
    if (!userRef.current) return
    try {
      const { data } = await withRetry(
        () => supabase.from('profiles').select('*').eq('id', userRef.current.id).single(),
        { attempts: 2, timeoutMs: 10000 },
      )
      if (data) setProfile(data)
    } catch {}
  }

  const logout = async () => {
    if (userRef.current) {
      await Promise.race([
        saveProgress(userRef.current.id),
        new Promise(r => setTimeout(r, 3000)),
      ])
    }
    clearProgress()
    localStorage.removeItem('nur-hayat-last-uid')
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise(r => setTimeout(r, 3000)),
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
