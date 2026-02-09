import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
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
    
    setToasts(prev => [...prev, { id, message, type, isExiting: false }])

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

  return (
    <ToastContext.Provider value={{ success, error, warning, info, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ toast, onClose }) {
  const { message, type, isExiting } = toast

  const configs = {
    success: {
      icon: CheckCircle,
      bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
      iconColor: 'text-white',
      border: 'border-green-400/30',
    },
    error: {
      icon: XCircle,
      bg: 'bg-gradient-to-r from-red-500 to-rose-500',
      iconColor: 'text-white',
      border: 'border-red-400/30',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      iconColor: 'text-white',
      border: 'border-yellow-400/30',
    },
    info: {
      icon: Info,
      bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      iconColor: 'text-white',
      border: 'border-blue-400/30',
    },
  }

  const config = configs[type] || configs.info
  const Icon = config.icon

  return (
    <div
      className={`
        pointer-events-auto
        ${config.bg}
        rounded-xl p-4 shadow-2xl
        border ${config.border}
        flex items-start gap-3
        backdrop-blur-sm
        transform transition-all duration-300 ease-out
        ${isExiting 
          ? 'animate-toast-out' 
          : 'animate-toast-in'
        }
        ${type === 'error' && !isExiting ? 'animate-error-shake' : ''}
      `}
    >
      <div className={`flex-shrink-0 ${config.iconColor} ${type === 'success' && !isExiting ? 'animate-success-pulse' : ''} ${type === 'error' && !isExiting ? 'animate-error-pulse' : ''}`}>
        <Icon className="w-6 h-6" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm leading-relaxed">
          {message}
        </p>
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-xl overflow-hidden">
        <div 
          className="h-full bg-white/50 animate-shrink"
          style={{
            animation: 'shrink 4s linear forwards',
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

export default ToastProvider
