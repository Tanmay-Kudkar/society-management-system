/**
 * useMinLoadingTime.js
 * Ensures a minimum display time for loading states so that
 * skeleton loaders are always visible briefly (like YouTube/Instagram).
 * Prevents jarring flash where skeleton appears and vanishes instantly.
 *
 * Usage:
 *   const showSkeleton = useMinLoadingTime(isLoading || isError, 400)
 *   if (showSkeleton) return <Skeleton />
 */
import { useState, useEffect, useRef } from 'react'

const DEFAULT_MIN_MS = 400

export default function useMinLoadingTime(isLoading, minMs = DEFAULT_MIN_MS) {
  const [showLoading, setShowLoading] = useState(isLoading)
  const startRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (isLoading) {
      // Loading started — record the start time
      startRef.current = Date.now()
      setShowLoading(true)

      // Clear any pending timer from a previous cycle
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    } else if (startRef.current) {
      // Loading finished — ensure minimum display time
      const elapsed = Date.now() - startRef.current
      const remaining = minMs - elapsed

      if (remaining > 0) {
        timerRef.current = setTimeout(() => {
          setShowLoading(false)
          startRef.current = null
          timerRef.current = null
        }, remaining)
      } else {
        setShowLoading(false)
        startRef.current = null
      }
    } else {
      // Never started loading (e.g., cached data on mount)
      // Still show skeleton briefly for visual consistency
      setShowLoading(true)
      timerRef.current = setTimeout(() => {
        setShowLoading(false)
        timerRef.current = null
      }, minMs)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isLoading, minMs])

  return showLoading
}
