import { useEffect, useRef } from 'react'

// Стек обработчиков аппаратной кнопки "назад" — верхний (последний зарегистрированный)
// получает нажатие первым. Нужен потому что многие экраны (буквы, вуду и т.п.)
// рисуют внутреннюю навигацию через useState, а не через реальные роуты,
// поэтому история браузера/Capacitor о них не знает.
const stack = []

// base:true — для обёрток-контейнеров (LearnPage/BeginnerPath "закрыть весь
// раздел"), которые активируются в тот же React-коммит, что и монтирование
// вложенного экрана. React выполняет эффекты снизу вверх (сначала дочерние,
// потом родительские), поэтому обычный push всегда ставил бы контейнер
// НАД только что смонтированным экраном — "назад" закрывал бы сразу всё,
// перепрыгивая внутренний уровень. unshift кладёт контейнер в начало массива,
// то есть он никогда не окажется "верхним", пока где-то поверх него есть
// хоть один обычный (leaf) обработчик — независимо от порядка эффектов.
export function pushBackHandler(fn, opts) {
  if (opts?.base) stack.unshift(fn)
  else stack.push(fn)
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
export function useBackHandler(active, onBack, opts) {
  const cbRef = useRef(onBack)
  useEffect(() => { cbRef.current = onBack })
  useEffect(() => {
    if (!active) return
    return pushBackHandler(() => cbRef.current(), opts)
  }, [active])
}
