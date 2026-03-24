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

const WAKE_THRESHOLD = 1200 // ms — show loader when a request is visibly slow
const HEALTH_ENDPOINT = '/health' // lightweight ping endpoint
const RETRY_INTERVAL_MS = 1000
const REQUEST_ACTIVITY_EVENT = 'societyhub:request-activity'

export default function useBackendStatus(apiBaseUrl) {
  const [isWakingUp, setIsWakingUp] = useState(false)
  const [statusText, setStatusText] = useState('Waiting for server response...')

  const activeRequestCountRef = useRef(0)
  const hasConnectionFailureRef = useRef(false)
  const isWakingUpRef = useRef(false)
  const wakeTimerRef = useRef(null)
  const retryTimerRef = useRef(null)
  const retryControllerRef = useRef(null)

  useEffect(() => {
    isWakingUpRef.current = isWakingUp
  }, [isWakingUp])

  useEffect(() => {
    const base = apiBaseUrl || import.meta.env?.VITE_API_URL || 'http://localhost:8080'

    const clearWakeTimer = () => {
      if (wakeTimerRef.current) {
        clearTimeout(wakeTimerRef.current)
        wakeTimerRef.current = null
      }
    }

    const clearRetryTimer = () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
    }

    const stopWakeState = () => {
      clearWakeTimer()
      clearRetryTimer()
      if (retryControllerRef.current) {
        retryControllerRef.current.abort()
        retryControllerRef.current = null
      }
      setIsWakingUp(false)
      setStatusText('Waiting for server response...')
    }

    const pingBackend = async () => {
      const controller = new AbortController()
      retryControllerRef.current = controller
      await fetch(`${base}${HEALTH_ENDPOINT}`, { signal: controller.signal, mode: 'cors' })
    }

    const scheduleHealthProbe = () => {
      clearRetryTimer()
      retryTimerRef.current = setTimeout(async () => {
        if (activeRequestCountRef.current <= 0) return
        try {
          await pingBackend()
          if (activeRequestCountRef.current > 0) {
            setStatusText('Waiting for server response...')
          }
        } catch {
          if (activeRequestCountRef.current > 0) {
            setStatusText('Reconnecting to server...')
          }
        } finally {
          if (activeRequestCountRef.current > 0) {
            scheduleHealthProbe()
          }
        }
      }, RETRY_INTERVAL_MS)
    }

    const startWakeIfStillSlow = () => {
      if (activeRequestCountRef.current <= 0) return
      wakeTimerRef.current = setTimeout(() => {
        if (activeRequestCountRef.current > 0) {
          setIsWakingUp(true)
          setStatusText('Waiting for server response...')
          scheduleHealthProbe()
        }
      }, WAKE_THRESHOLD)
    }

    const handleRequestActivity = (event) => {
      const count = Number(event?.detail?.activeRequestCount || 0)
      const hasConnectionFailure = Boolean(event?.detail?.hasConnectionFailure)
      activeRequestCountRef.current = count
      hasConnectionFailureRef.current = hasConnectionFailure

      if (count > 0) {
        if (!wakeTimerRef.current && !isWakingUpRef.current) {
          startWakeIfStillSlow()
        }
        return
      }

      // Keep loader visible between retry attempts while backend is still unreachable.
      if (hasConnectionFailure) {
        clearWakeTimer()
        setIsWakingUp(true)
        setStatusText('Reconnecting to server...')
        if (!retryTimerRef.current) {
          scheduleHealthProbe()
        }
        return
      }

      stopWakeState()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener(REQUEST_ACTIVITY_EVENT, handleRequestActivity)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(REQUEST_ACTIVITY_EVENT, handleRequestActivity)
      }
      stopWakeState()
    }
  }, [apiBaseUrl])

  return { isWakingUp, statusText }
}
