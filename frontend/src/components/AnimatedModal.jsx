import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { acquireScrollLock, releaseScrollLock } from '../utils/scrollLock'

export const DEFAULT_ANIMATED_MODAL_DURATION_MS = 220

export default function AnimatedModal({
  open,
  isOpen,
  children,
  durationMs = DEFAULT_ANIMATED_MODAL_DURATION_MS,
  onRequestClose,
  closeOnBackdrop = false,
  lockScroll = true,
  trapFocus = true,
  restoreFocus = true,
  theme = 'inherit',
  backdropClassName,
  wrapperClassName,
  className,
  initialFocusRef,
  labelledBy,
  describedBy,
}) {
  const modalIsOpen = typeof open === 'boolean' ? open : Boolean(isOpen)
  const [isMounted, setIsMounted] = useState(modalIsOpen)
  const [isVisible, setIsVisible] = useState(modalIsOpen)
  const modalRef = useRef(null)
  const previouslyFocusedElement = useRef(null)
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    let rafId
    let timer
    const effectiveDuration = reducedMotionRef.current ? 0 : durationMs

    if (modalIsOpen) {
      setIsMounted(true)
      rafId = window.requestAnimationFrame(() => setIsVisible(true))
    } else if (isMounted) {
      setIsVisible(false)
      timer = window.setTimeout(() => setIsMounted(false), effectiveDuration)
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      window.clearTimeout(timer)
    }
  }, [modalIsOpen, isMounted, durationMs])

  useEffect(() => {
    if (!modalIsOpen || !onRequestClose) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onRequestClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modalIsOpen, onRequestClose])

  useEffect(() => {
    if (!modalIsOpen || !lockScroll) return undefined

    acquireScrollLock()

    return () => {
      releaseScrollLock()
    }
  }, [modalIsOpen, lockScroll])

  useEffect(() => {
    if (!modalIsOpen) return undefined

    previouslyFocusedElement.current = document.activeElement
    const focusTarget = initialFocusRef?.current || modalRef.current
    focusTarget?.focus?.()

    return () => {
      if (!restoreFocus) return
      previouslyFocusedElement.current?.focus?.()
    }
  }, [modalIsOpen, initialFocusRef, restoreFocus])

  useEffect(() => {
    if (!modalIsOpen || !trapFocus) return undefined

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return

      const focusableElements = modalRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )

      if (!focusableElements || focusableElements.length === 0) {
        event.preventDefault()
        modalRef.current?.focus?.()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modalIsOpen, trapFocus])

  if (!isMounted) return null

  const handleBackdropClick = () => {
    if (closeOnBackdrop && onRequestClose) {
      onRequestClose()
    }
  }

  const effectiveDuration = reducedMotionRef.current ? 0 : durationMs

  const panelThemeVariables =
    theme === 'dark'
      ? {
          '--bg-card': '#0a0a0a',
          '--bg-tertiary': '#121212',
          '--text-primary': '#ffffff',
          '--text-secondary': '#d1d5db',
          '--text-tertiary': '#94a3b8',
          '--border-light': '#252525',
          '--border-default': '#2c2c2c',
          '--placeholder-color': '#6b7280',
        }
      : undefined

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 transition-opacity',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        backdropClassName
      )}
      style={{ transitionDuration: `${effectiveDuration}ms` }}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className={clsx(
          'mx-auto flex w-full items-center justify-center transition-all ease-out',
          isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.985]',
          wrapperClassName
        )}
        style={{ transitionDuration: `${effectiveDuration}ms` }}
      >
        <div
          ref={modalRef}
          tabIndex={-1}
          className={clsx('flex w-full justify-center', className)}
          style={{
            transitionDuration: `${effectiveDuration}ms`,
            ...panelThemeVariables,
          }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
