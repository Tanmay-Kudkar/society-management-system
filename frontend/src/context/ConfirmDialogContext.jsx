import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import NeonSweepButton from '../components/NeonSweepButton'
import { acquireScrollLock, releaseScrollLock } from '../utils/scrollLock'

const ConfirmDialogContext = createContext(null)

const DEFAULT_OPTIONS = {
  title: 'Confirm Action',
  message: 'Are you sure you want to continue?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  tone: 'danger', // danger | warning | neutral
  details: [],
  impacts: [],
  caution: '',
}

function ConfirmDialog({ open, options, onCancel, onConfirm }) {
  if (!open) return null

  const Icon = options.tone === 'danger' ? Trash2 : AlertTriangle
  const iconWrapToneClass =
    options.tone === 'warning'
      ? 'bg-amber-100/95'
      : options.tone === 'neutral'
        ? 'bg-slate-200/95'
        : 'bg-red-100/95'
  const iconToneClass =
    options.tone === 'warning' ? 'text-amber-600' : options.tone === 'neutral' ? 'text-slate-700' : 'text-red-500'
  const confirmTone = options.tone === 'danger' ? 'danger' : options.tone === 'neutral' ? 'slate' : 'cyan'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" onClick={onCancel} />
      <div
        className="relative w-full max-w-[420px] rounded-2xl border border-slate-400/20 bg-slate-950 px-5 pb-[18px] pt-6 text-center shadow-[0_24px_56px_rgba(2,6,23,0.55)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className={[
          'mx-auto mb-[14px] inline-flex h-11 w-11 items-center justify-center rounded-full',
          iconWrapToneClass,
        ].join(' ')}>
          <Icon size={20} className={iconToneClass} />
        </div>

        <h3 id="confirm-dialog-title" className="m-0 text-[1.3rem] font-bold text-slate-50">
          {options.title}
        </h3>

        <p id="confirm-dialog-message" className="mx-auto mt-3 max-w-[36ch] text-base leading-[1.45] text-slate-300">
          {options.message}
        </p>

        {Array.isArray(options.details) && options.details.length > 0 && (
          <div className="mt-[14px] overflow-hidden rounded-xl border border-slate-400/20 bg-slate-900/40" role="list">
            {options.details
              .filter((item) => item?.value !== undefined && item?.value !== null && String(item.value).trim() !== '')
              .map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className="grid grid-cols-[minmax(92px,120px)_1fr] gap-2 border-t border-slate-400/15 px-2.5 py-2 text-left first:border-t-0"
                  role="listitem"
                >
                  <span className="text-[0.76rem] font-bold uppercase tracking-[0.02em] text-slate-400">{item.label}</span>
                  <span className="break-words text-[0.86rem] font-semibold text-slate-200">{item.value}</span>
                </div>
              ))}
          </div>
        )}

        {Array.isArray(options.impacts) && options.impacts.length > 0 && (
          <div className="mt-2.5 flex flex-wrap justify-center gap-2" role="list" aria-label="Impact summary">
            {options.impacts
              .filter((item) => Number(item?.count) > 0 && item?.label)
              .map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/25 bg-slate-900/45 px-2.5 py-1"
                  role="listitem"
                >
                  <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500/20 text-[0.72rem] font-extrabold text-rose-300">
                    {item.count}
                  </span>
                  <span className="text-[0.76rem] font-bold text-slate-300">{item.label}</span>
                </div>
              ))}
          </div>
        )}

        {options.caution && (
          <p className="mt-2.5 text-[0.79rem] text-rose-300">{options.caution}</p>
        )}

        <div className="mt-[18px] flex gap-2.5">
          <NeonSweepButton
            tone="slate"
            size="md"
            className="min-h-[42px] flex-1"
            onClick={onCancel}
          >
            {options.cancelText}
          </NeonSweepButton>
          <NeonSweepButton
            tone={confirmTone}
            size="md"
            className="min-h-[42px] flex-1"
            onClick={onConfirm}
          >
            {options.confirmText}
          </NeonSweepButton>
        </div>
      </div>
    </div>
  )
}

export function ConfirmDialogProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState(DEFAULT_OPTIONS)
  const resolverRef = useRef(null)

  const close = useCallback((result) => {
    setOpen(false)
    if (resolverRef.current) {
      resolverRef.current(result)
      resolverRef.current = null
    }
  }, [])

  const confirm = useCallback((customOptions = {}) => {
    setOptions({ ...DEFAULT_OPTIONS, ...customOptions })
    setOpen(true)
    return new Promise((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  useEffect(() => {
    if (!open) return undefined

    acquireScrollLock()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        close(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      releaseScrollLock()
    }
  }, [open, close])

  useEffect(() => {
    return () => {
      if (resolverRef.current) {
        resolverRef.current(false)
        resolverRef.current = null
      }
    }
  }, [])

  const value = useMemo(() => confirm, [confirm])

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={open}
        options={options}
        onCancel={() => close(false)}
        onConfirm={() => close(true)}
      />
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider')
  }
  return context
}
