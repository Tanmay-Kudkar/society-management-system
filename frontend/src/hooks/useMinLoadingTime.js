/**
 * useMinLoadingTime.js
 *
 * Smart skeleton gating:
 * - If data loads within DELAY_MS (200ms), skeleton is NEVER shown (fast cache/network)
 * - If loading is still in progress after DELAY_MS, skeleton appears
 * - Once skeleton is shown, it stays for at least MIN_MS (400ms) to avoid flash
 *
 * Usage:
 *   const showSkeleton = useMinLoadingTime(isLoading || isError)
 *   if (showSkeleton) return <Skeleton />
 */
import { useState, useEffect, useRef } from 'react'

const DELAY_MS = 200    // wait this long before showing skeleton
const MIN_MS   = 400    // once shown, keep visible for at least this long

export default function useMinLoadingTime(isLoading, minMs = MIN_MS, delayMs = DELAY_MS) {
  const [showSkeleton, setShowSkeleton] = useState(false)
  const delayTimerRef = useRef(null)  // fires to SHOW skeleton after delay
  const minTimerRef   = useRef(null)  // fires to HIDE skeleton after min time
  const shownAtRef    = useRef(null)  // when skeleton was first shown
  const pendingHide   = useRef(false) // loading finished while waiting to show

  useEffect(() => {
    if (isLoading) {
      pendingHide.current = false

      // Start delay timer — only show skeleton if still loading after DELAY_MS
      if (!delayTimerRef.current) {
        delayTimerRef.current = setTimeout(() => {
          delayTimerRef.current = null
          if (!pendingHide.current) {
            // Still loading after delay threshold — show skeleton now
            shownAtRef.current = Date.now()
            setShowSkeleton(true)
          }
        }, delayMs)
      }
    } else {
      // Loading finished
      if (delayTimerRef.current) {
        // Finished before delay threshold — cancel and never show skeleton
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
        pendingHide.current = false
        setShowSkeleton(false)
        return
      }

      if (shownAtRef.current) {
        // Skeleton is currently visible — keep it for minimum time
        const elapsed   = Date.now() - shownAtRef.current
        const remaining = minMs - elapsed

        const hide = () => {
          setShowSkeleton(false)
          shownAtRef.current  = null
          minTimerRef.current = null
          pendingHide.current = false
        }

        if (remaining > 0) {
          minTimerRef.current = setTimeout(hide, remaining)
        } else {
          hide()
        }
      } else {
        // Skeleton not yet shown, mark that load ended so delay timer won't show it
        pendingHide.current = true
        setShowSkeleton(false)
      }
    }

    return () => {
      // cleanup on unmount only — don't cancel mid-cycle
    }
  }, [isLoading, minMs, delayMs])

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current)
      if (minTimerRef.current)   clearTimeout(minTimerRef.current)
    }
  }, [])

  return showSkeleton
}
