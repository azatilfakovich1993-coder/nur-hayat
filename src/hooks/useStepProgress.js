import { useState } from 'react'

// Запоминает текущий шаг/карточку урока в localStorage под своим ключом,
// чтобы при повторном открытии раздел открывался ровно с того места,
// где пользователь остановился в прошлый раз.
export function useStepProgress(key, max) {
  const storageKey = `lesson_progress_${key}`

  const [step, setStepState] = useState(() => {
    const saved = parseInt(localStorage.getItem(storageKey), 10)
    if (Number.isNaN(saved) || saved < 0) return 0
    return max != null ? Math.min(saved, max - 1) : saved
  })

  function setStep(next) {
    setStepState(prev => {
      const value = typeof next === 'function' ? next(prev) : next
      localStorage.setItem(storageKey, String(value))
      return value
    })
  }

  return [step, setStep]
}
