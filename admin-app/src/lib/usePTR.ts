import { useEffect, useState } from 'react'

/** Simple pull-to-refresh for window-scrolled screens (touch devices). */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pulling, setPulling] = useState(false)
  useEffect(() => {
    let startY = 0
    let armed = false
    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      armed = window.scrollY <= 0
    }
    const onMove = (e: TouchEvent) => {
      if (!armed) return
      const dy = e.touches[0].clientY - startY
      if (dy > 90 && window.scrollY <= 0) {
        armed = false
        setPulling(true)
        onRefresh().finally(() => setPulling(false))
      }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
    }
  }, [onRefresh])
  return pulling
}
