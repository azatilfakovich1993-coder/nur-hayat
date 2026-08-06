import { supabase } from '../supabase/client'
import { localDateStr } from './date'
import { rewardFeedback } from './feedback'

export const NUR_LEVELS = [
  { min: 0,    max: 100,  label: 'Новичок',    color: '#C9822E', light: '#E8A857', dark: '#A66A1F' },
  { min: 101,  max: 300,  label: 'Идущий',     color: '#2FA9A0', light: '#5FD4CB', dark: '#1F7A73' },
  { min: 301,  max: 700,  label: 'Упорный',    color: '#2D6A4F', light: '#4F9C78', dark: '#1D4A35' },
  { min: 701,  max: 1500, label: 'Покоритель', color: '#3D5FC4', light: '#6C8AE0', dark: '#2A3F8F' },
  { min: 1501, max: Infinity, label: 'Нур',    color: '#FFD700', light: '#FFF3B0', dark: '#E8A030' },
]

const MILESTONES = [
  { threshold: 101,  label: 'Идущий',     color: '#2FA9A0', light: '#5FD4CB', dark: '#1F7A73', text: 'Ты вступил на путь! Каждый намаз, каждое слово зикра — приближает тебя к Аллаху.' },
  { threshold: 301,  label: 'Упорный',    color: '#2D6A4F', light: '#4F9C78', dark: '#1D4A35', text: 'Твоё сердце открылось знанию. Продолжай — Аллах с теми, кто ищет Его.' },
  { threshold: 701,  label: 'Покоритель', color: '#3D5FC4', light: '#6C8AE0', dark: '#2A3F8F', text: 'Вера укрепляется в твоём сердце. МашаАллах — ты идёшь правильным путём.' },
  { threshold: 1501, label: 'Нур',        color: '#FFD700', light: '#FFF3B0', dark: '#E8A030', text: 'Ты стал Нуром! Пусть Аллах примет все твои усилия и одарит тебя Своей близостью.' },
]

export function getNurLevel(nur = 0) {
  return NUR_LEVELS.find(l => nur >= l.min && nur <= l.max) || NUR_LEVELS[0]
}

function checkMilestone(oldNur, newNur) {
  const crossed = MILESTONES.filter(m => oldNur < m.threshold && newNur >= m.threshold)
  return crossed.length ? crossed[crossed.length - 1] : null
}

// ── Очередь — все вызовы addNur выполняются последовательно ──────────────────
// Это предотвращает гонку состояний когда два начисления происходят одновременно
let nurQueue = Promise.resolve()

export function addNur(amount, user, profile, setProfile) {
  if (!user || !profile) return Promise.resolve(null)

  const oldNur = profile.nur ?? 0
  // Событие для немедленного обновления счётчика (подписывается только HomePage)
  window.dispatchEvent(new CustomEvent('nur-optimistic', { detail: { delta: amount } }))
  rewardFeedback()

  const result = nurQueue.then(async () => {
    // Читаем актуальное значение из БД чтобы не затереть параллельные начисления
    const { data } = await supabase
      .from('profiles')
      .select('nur')
      .eq('id', user.id)
      .single()

    const currentNur = data?.nur ?? oldNur
    const newNur = Math.max(0, currentNur + amount)

    // Сохраняем в БД
    await supabase.from('profiles').update({ nur: newNur }).eq('id', user.id)

    // Синхронизируем глобальный profile с фактическим значением БД
    setProfile(p => p ? { ...p, nur: newNur } : p)
    // Сообщаем UI финальное значение (profile в React-стейте обновится позже,
    // событие приходит сразу с актуальным числом)
    window.dispatchEvent(new CustomEvent('nur-settled', { detail: { nur: newNur } }))

    // Проверяем milestone
    const milestone = checkMilestone(currentNur, newNur)
    if (milestone) {
      window.dispatchEvent(new CustomEvent('nur-milestone', { detail: milestone }))
    }

    return { newNur, milestone }
  })

  nurQueue = result.catch(() => {})
  return result
}

// Начислить НУР только для конкретного уровня профиля
export async function addNurIfLevel(amount, levels, user, profile, setProfile) {
  if (!user || !profile) return null
  const userLevel = profile.level || 'seeker'
  const allowed = Array.isArray(levels) ? levels : [levels]
  if (!allowed.includes(userLevel)) return null
  return addNur(amount, user, profile, setProfile)
}

// Ежедневный бонус при входе: +15 НУР раз в сутки
export async function claimDailyLogin(user, profile, setProfile) {
  if (!user || !profile) return null
  const today = localDateStr()
  const key = `nur_daily_${today}_${user.id}`
  if (localStorage.getItem(key)) return null
  localStorage.setItem(key, '1')
  return addNur(15, user, profile, setProfile)
}
