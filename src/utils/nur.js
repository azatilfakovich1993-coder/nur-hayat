import { supabase } from '../supabase/client'

export const NUR_LEVELS = [
  { min: 0,    max: 100,  emoji: '🕯️', label: 'Искра',     color: '#2D6A4F' },
  { min: 101,  max: 300,  emoji: '🌙', label: 'Путник',    color: '#7B6BAE' },
  { min: 301,  max: 700,  emoji: '⭐', label: 'Ищущий',    color: '#C9A84C' },
  { min: 701,  max: 1500, emoji: '🌟', label: 'Верующий',  color: '#E8A030' },
  { min: 1501, max: Infinity, emoji: '☀️', label: 'Нур',   color: '#FFD700' },
]

const MILESTONES = [
  { threshold: 101,  emoji: '🌙', label: 'Путник',    color: '#7B6BAE', text: 'Ты вступил на путь! Каждый намаз, каждое слово зикра — приближает тебя к Аллаху.' },
  { threshold: 301,  emoji: '⭐', label: 'Ищущий',    color: '#C9A84C', text: 'Твоё сердце открылось знанию. Продолжай — Аллах с теми, кто ищет Его.' },
  { threshold: 701,  emoji: '🌟', label: 'Верующий',  color: '#E8A030', text: 'Вера укрепляется в твоём сердце. МашаАллах — ты идёшь правильным путём.' },
  { threshold: 1501, emoji: '☀️', label: 'Нур',       color: '#FFD700', text: 'Ты стал Нуром! Пусть Аллах примет все твои усилия и одарит тебя Своей близостью.' },
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
  const today = new Date().toISOString().slice(0, 10)
  const key = `nur_daily_${today}_${user.id}`
  if (localStorage.getItem(key)) return null
  localStorage.setItem(key, '1')
  return addNur(15, user, profile, setProfile)
}
