import { useRef } from 'react'

/**
 * Горизонтальный свайп для листания карточек.
 * Свайп влево → onNext(), свайп вправо → onPrev().
 */
export function useSwipeCards(onNext, onPrev, { threshold = 50 } = {}) {
  const start = useRef(null)

  function onTouchStart(e) {
    const t = e.touches[0]
    start.current = { x: t.clientX, y: t.clientY }
  }

  function onTouchEnd(e) {
    if (!start.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.current.x
    const dy = t.clientY - start.current.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    start.current = null

    if (absDx < threshold || absDx < absDy * 1.3) return

    if (dx < 0) onNext?.()
    else onPrev?.()
  }

  return { onTouchStart, onTouchEnd }
}
