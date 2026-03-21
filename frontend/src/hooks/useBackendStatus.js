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
const RETRY_INTERVAL_MS = 500

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
    let retryTimer
    let currentController = controller

    // If the fetch hasn't resolved within threshold, flag wake-up
    timer = setTimeout(() => setIsWakingUp(true), WAKE_THRESHOLD)

    const base = apiBaseUrl || import.meta.env?.VITE_API_URL || 'http://localhost:8080'

    const pingBackend = (signal) => fetch(`${base}${HEALTH_ENDPOINT}`, { signal, mode: 'cors' })

    const scheduleRetry = () => {
      if (!checked.current) return

      retryTimer = setTimeout(() => {
        const retryController = new AbortController()
        currentController = retryController

        pingBackend(retryController.signal)
          .then(() => {
            clearTimeout(timer)
            setIsWakingUp(false)
            sessionStorage.setItem(SESSION_KEY, '1')
          })
          .catch(() => {
            setIsWakingUp(true)
            scheduleRetry()
          })
      }, RETRY_INTERVAL_MS)
    }

    pingBackend(controller.signal)
      .then(() => {
        clearTimeout(timer)
        setIsWakingUp(false)
        sessionStorage.setItem(SESSION_KEY, '1')
      })
      .catch(() => {
        // Network error — still waking up
        clearTimeout(timer)
        setIsWakingUp(true)
        // Keep retrying quickly for free-tier wake-up scenarios.
        scheduleRetry()
      })

    return () => {
      checked.current = false
      clearTimeout(timer)
      clearTimeout(retryTimer)
      currentController.abort()
    }
  }, [apiBaseUrl])

  return isWakingUp
}
