import { useRef } from 'react'

/**
 * Свайп вниз или в сторону → onClose().
 * topZone — высота зоны от верха экрана где начинается свайп (шапка компонента).
 */
export function useSwipeDown(onClose, { threshold = 50, topZone = 160 } = {}) {
  const start = useRef(null)

  function onTouchStart(e) {
    const t = e.touches[0]
    start.current = { x: t.clientX, y: t.clientY }
  }

  function onTouchEnd(e) {
    if (!start.current) return
    const t = e.changedTouches[0]
    const dy = t.clientY - start.current.y
    const dx = t.clientX - start.current.x
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    start.current = null

    // Свайп вниз (из верхней зоны — шапка)
    const startedInHeader = e.changedTouches[0].clientY - dy <= topZone
    if (startedInHeader && dy > threshold && absDy > absDx * 0.8) {
      onClose()
      return
    }

    // Свайп вправо (закрыть как в Telegram)
    if (dx > threshold * 1.2 && absDx > absDy * 1.5) {
      onClose()
    }
  }

  return { onTouchStart, onTouchEnd }
}
