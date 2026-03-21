let activeScrollLocks = 0
let originalStyles = null
let originalScrollY = 0

const getTarget = () => {
  if (typeof document === 'undefined') return null
  return document.body
}

const applyScrollLock = () => {
  const target = getTarget()
  if (!target) return

  if (!originalStyles) {
    originalStyles = {
      overflow: target.style.overflow,
      position: target.style.position,
      top: target.style.top,
      width: target.style.width,
      left: target.style.left,
      right: target.style.right,
      paddingRight: target.style.paddingRight,
    }
  }

  originalScrollY = window.scrollY || 0
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

  target.style.overflow = 'hidden'
  target.style.position = 'fixed'
  target.style.top = `-${originalScrollY}px`
  target.style.left = '0'
  target.style.right = '0'
  target.style.width = '100%'
  if (scrollbarWidth > 0) {
    target.style.paddingRight = `${scrollbarWidth}px`
  }
}

const restoreScrollLock = () => {
  const target = getTarget()
  if (!target || !originalStyles) return

  target.style.overflow = originalStyles.overflow
  target.style.position = originalStyles.position
  target.style.top = originalStyles.top
  target.style.width = originalStyles.width
  target.style.left = originalStyles.left
  target.style.right = originalStyles.right
  target.style.paddingRight = originalStyles.paddingRight

  window.scrollTo(0, originalScrollY)
  originalStyles = null
}

export const acquireScrollLock = () => {
  if (typeof window === 'undefined') return
  activeScrollLocks += 1
  if (activeScrollLocks === 1) {
    applyScrollLock()
  }
}

export const releaseScrollLock = () => {
  if (typeof window === 'undefined') return
  activeScrollLocks = Math.max(0, activeScrollLocks - 1)
  if (activeScrollLocks === 0) {
    restoreScrollLock()
  }
}
