import { useEffect, useRef } from 'react'

// Стек обработчиков аппаратной кнопки "назад" — верхний (последний зарегистрированный)
// получает нажатие первым. Нужен потому что многие экраны (буквы, вуду и т.п.)
// рисуют внутреннюю навигацию через useState, а не через реальные роуты,
// поэтому история браузера/Capacitor о них не знает.
const stack = []

export function pushBackHandler(fn) {
  stack.push(fn)
  return () => {
    const i = stack.lastIndexOf(fn)
    if (i !== -1) stack.splice(i, 1)
  }
}

export function runTopBackHandler() {
  if (stack.length === 0) return false
  stack[stack.length - 1]()
  return true
}

// active=true — пока экран показан, его onBack перехватывает аппаратную кнопку "назад"
export function useBackHandler(active, onBack) {
  const cbRef = useRef(onBack)
  useEffect(() => { cbRef.current = onBack })
  useEffect(() => {
    if (!active) return
    return pushBackHandler(() => cbRef.current())
  }, [active])
}
