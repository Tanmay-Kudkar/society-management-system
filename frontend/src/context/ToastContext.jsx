import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import clsx from 'clsx'

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
    const payload = typeof message === 'string' ? { message } : (message || {})
    const normalizedMessage = payload.message || 'Something happened'
    const title = payload.title

    setToasts(prev => [...prev, { id, message: normalizedMessage, title, type, duration, isExiting: false }])

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
  const validation = useCallback((message, duration) => addToast(message, 'validation', duration), [addToast])
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast])

  useEffect(() => {
    const handler = (e) => error(e.detail)
    window.addEventListener('global-mutation-error', handler)
    return () => window.removeEventListener('global-mutation-error', handler)
  }, [error])

  return (
    <ToastContext.Provider value={{ success, error, warning, validation, info, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }) {
  const validationToasts = toasts.filter((toast) => toast.type === 'validation')
  const regularToasts = toasts.filter((toast) => toast.type !== 'validation')

  return (
    <>
      {validationToasts.length > 0 && (
        <div className="fixed left-1/2 top-20 z-[10000] flex w-[min(92vw,620px)] -translate-x-1/2 flex-col gap-2.5 pointer-events-none">
          {validationToasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </div>
      )}

      {regularToasts.length > 0 && (
        <div className="fixed top-5 right-4 z-[9999] flex max-w-[420px] w-full flex-col gap-2.5 pointer-events-none">
          {regularToasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </div>
      )}
    </>
  )
}

const typeBorder = {
  success: 'border border-emerald-500/30 border-l-4 border-l-emerald-600',
  error: 'border border-red-500/30 border-l-4 border-l-red-500',
  warning: 'border border-amber-500/30 border-l-4 border-l-amber-500',
  validation: 'border border-amber-500/40 border-l-4 border-l-amber-600',
  info: 'border border-blue-500/30 border-l-4 border-l-blue-500',
}

const typeIconBg = {
  success: 'bg-emerald-50 text-emerald-600',
  error: 'bg-red-50 text-red-500',
  warning: 'bg-amber-50 text-amber-600',
  validation: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-50 text-blue-600',
}

const typeCardBg = {
  success: 'bg-slate-50',
  error: 'bg-slate-50',
  warning: 'bg-slate-50',
  validation: 'bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50',
  info: 'bg-slate-50',
}

const typeProgress = {
  success: 'bg-emerald-600',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  validation: 'bg-amber-600',
  info: 'bg-blue-500',
}

function Toast({ toast, onClose }) {
  const { message, title, type, duration = 4000, isExiting } = toast

  const configs = {
    success: { icon: CheckCircle, title: 'Success' },
    error: { icon: XCircle, title: 'Error' },
    warning: { icon: AlertTriangle, title: 'Warning' },
    validation: { icon: AlertTriangle, title: 'Please Review Form' },
    info: { icon: Info, title: 'Info' },
  }

  const config = configs[type] || configs.info
  const Icon = config.icon

  return (
    <div
      className={clsx(
        'pointer-events-auto relative flex items-center gap-2.5 overflow-hidden rounded-xl px-3.5 py-3.5 shadow-lg transition-all',
        typeCardBg[type] || typeCardBg.info,
        typeBorder[type] || typeBorder.info,
        isExiting ? 'animate-[toast-out_0.3s_ease-in_forwards]' : 'animate-[toast-in_0.3s_ease-out]',
        type === 'error' && !isExiting && 'animate-[toast-shake_0.5s_ease-in-out]',
        type === 'validation' && !isExiting && 'shadow-[0_16px_36px_rgba(245,158,11,0.28)]',
      )}
    >
      <div className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', typeIconBg[type] || typeIconBg.info)}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 mb-0.5 text-[13px] font-extrabold leading-tight text-slate-900">{title || config.title}</p>
        <p className="m-0 whitespace-pre-line text-[12.5px] font-medium leading-snug text-slate-700">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md border-0 bg-transparent p-0.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="absolute left-1 right-0 bottom-0 h-0.5 bg-slate-200/80">
        <div
          className={clsx('h-full w-full', typeProgress[type] || typeProgress.info)}
          style={{ animation: `toast-shrink ${duration}ms linear forwards` }}
        />
      </div>
    </div>
  )
}

export default ToastProvider
