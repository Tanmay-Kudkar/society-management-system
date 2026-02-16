/**
 * useBackendStatus.js
 * Detects if the backend is waking up from a cold start (free-tier sleep).
 * Exports a boolean `isWakingUp` that becomes true if the first API call
 * takes longer than WAKE_THRESHOLD ms, and resets once the backend responds.
 *
 * This hook is designed to be used alongside skeleton loaders so the
 * WakeUpBanner can be shown automatically.
 */
import { useState, useEffect, useRef } from 'react'

const WAKE_THRESHOLD = 4000   // ms — if first request takes longer, assume cold start
const HEALTH_ENDPOINT = '/health'  // lightweight ping endpoint
const SESSION_KEY = 'backend_awake'

export default function useBackendStatus(apiBaseUrl) {
  const [isWakingUp, setIsWakingUp] = useState(false)
  const checked = useRef(false)

  useEffect(() => {
    // Only run once per session
    if (checked.current) return
    if (sessionStorage.getItem(SESSION_KEY) === '1') return
    checked.current = true

    const controller = new AbortController()
    let timer

    // If the fetch hasn't resolved within threshold, flag wake-up
    timer = setTimeout(() => setIsWakingUp(true), WAKE_THRESHOLD)

    const base = apiBaseUrl || import.meta.env?.VITE_API_URL || 'http://localhost:8080'

    fetch(`${base}${HEALTH_ENDPOINT}`, { signal: controller.signal, mode: 'cors' })
      .then(() => {
        clearTimeout(timer)
        setIsWakingUp(false)
        sessionStorage.setItem(SESSION_KEY, '1')
      })
      .catch(() => {
        // Network error — still waking up
        clearTimeout(timer)
        setIsWakingUp(true)
        // Retry after 5s
        setTimeout(() => {
          fetch(`${base}${HEALTH_ENDPOINT}`, { mode: 'cors' })
            .then(() => {
              setIsWakingUp(false)
              sessionStorage.setItem(SESSION_KEY, '1')
            })
            .catch(() => {})
        }, 5000)
      })

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [apiBaseUrl])

  return isWakingUp
}
