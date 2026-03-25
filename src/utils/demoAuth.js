// Демо-режим: хранит данные в localStorage вместо Firebase
const USER_KEY    = 'nh_user'
const PROFILE_KEY = 'nh_profile'

export const isDemoMode = () => {
  try {
    // Если API ключ — заглушка, включаем демо-режим
    return import.meta.env.VITE_FIREBASE_API_KEY === undefined ||
           !import.meta.env.VITE_FIREBASE_API_KEY
  } catch { return true }
}

export const demoGetUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}

export const demoGetProfile = () => {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) } catch { return null }
}

export const demoRegister = ({ name, email, password, language, translationId, level }) => {
  const user = {
    uid:         'demo_' + Date.now(),
    email,
    displayName: name
  }
  const profile = {
    name,
    email,
    language:      language || 'ru',
    translationId: translationId || 131,
    level:         level || 'seeker',
    nur:           10,
    streak:        1,
    onboarded:     false,
    createdAt:     new Date().toISOString()
  }
  localStorage.setItem(USER_KEY,    JSON.stringify(user))
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  return { user, profile }
}

export const demoLogin = (email, password) => {
  const user    = demoGetUser()
  const profile = demoGetProfile()
  if (!user || user.email !== email) throw new Error('user-not-found')
  return { user, profile }
}

export const demoLogout = () => {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(PROFILE_KEY)
}

export const demoUpdateProfile = (updates) => {
  const profile = { ...demoGetProfile(), ...updates }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  return profile
}
