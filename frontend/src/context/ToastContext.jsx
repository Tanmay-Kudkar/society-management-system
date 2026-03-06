import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import clsx from 'clsx'
import '../styles/animations.css'

const ToastContext = createContext()

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    
    setToasts(prev => [...prev, { id, message, type, duration, isExiting: false }])

    setTimeout(() => {
      setToasts(prev => 
        prev.map(t => t.id === id ? { ...t, isExiting: true } : t)
      )
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 300)
    }, duration)

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => 
      prev.map(t => t.id === id ? { ...t, isExiting: true } : t)
    )
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 300)
  }, [])

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast])
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast])
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast])
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast])

  // Listen for global mutation errors dispatched from MutationCache
  useEffect(() => {
    const handler = (e) => error(e.detail)
    window.addEventListener('global-mutation-error', handler)
    return () => window.removeEventListener('global-mutation-error', handler)
  }, [error])

  return (
    <ToastContext.Provider value={{ success, error, warning, info, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ toast, onClose }) {
  const { message, type, duration = 4000, isExiting } = toast

  const configs = {
    success: {
      icon: CheckCircle,
      title: 'Success',
    },
    error: {
      icon: XCircle,
      title: 'Error',
    },
    warning: {
      icon: AlertTriangle,
      title: 'Warning',
    },
    info: {
      icon: Info,
      title: 'Info',
    },
  }

  const config = configs[type] || configs.info
  const Icon = config.icon

  return (
    <div
      className={clsx(
        'toast',
        `toast--${type}`,
        isExiting ? 'toast--exit' : 'toast--enter',
        type === 'error' && !isExiting && 'toast--shake'
      )}
    >
      <div
        className={clsx(
          'toast__icon',
          `toast__icon--${type}`,
          type === 'success' && !isExiting && 'toast__icon--success',
          type === 'error' && !isExiting && 'toast__icon--error'
        )}
      >
        <Icon className="toast__icon-svg" />
      </div>
      
      <div className="toast__content">
        <p className="toast__title">{config.title}</p>
        <p className="toast__message">{message}</p>
      </div>

      <button
        onClick={onClose}
        className="toast__close"
      >
        <X className="toast__close-icon" />
      </button>

      {/* Progress bar */}
      <div className="toast__progress">
        <div
          className={clsx('toast__progress-bar', `toast__progress-bar--${type}`)}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  )
}

export default ToastProvider
