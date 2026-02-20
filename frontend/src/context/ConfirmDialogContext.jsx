import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

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

  return (
    <div className="confirm-dialog" role="presentation">
      <div className="confirm-dialog__backdrop" onClick={onCancel} />
      <div
        className="confirm-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className={[
          'confirm-dialog__icon-wrap',
          options.tone === 'warning' ? 'is-warning' : options.tone === 'neutral' ? 'is-neutral' : 'is-danger',
        ].join(' ')}>
          <Icon size={20} className="confirm-dialog__icon" />
        </div>

        <h3 id="confirm-dialog-title" className="confirm-dialog__title">
          {options.title}
        </h3>

        <p id="confirm-dialog-message" className="confirm-dialog__message">
          {options.message}
        </p>

        {Array.isArray(options.details) && options.details.length > 0 && (
          <div className="confirm-dialog__details" role="list">
            {options.details
              .filter((item) => item?.value !== undefined && item?.value !== null && String(item.value).trim() !== '')
              .map((item, idx) => (
                <div key={`${item.label}-${idx}`} className="confirm-dialog__detail-row" role="listitem">
                  <span className="confirm-dialog__detail-label">{item.label}</span>
                  <span className="confirm-dialog__detail-value">{item.value}</span>
                </div>
              ))}
          </div>
        )}

        {Array.isArray(options.impacts) && options.impacts.length > 0 && (
          <div className="confirm-dialog__impacts" role="list" aria-label="Impact summary">
            {options.impacts
              .filter((item) => Number(item?.count) > 0 && item?.label)
              .map((item, idx) => (
                <div key={`${item.label}-${idx}`} className="confirm-dialog__impact-chip" role="listitem">
                  <span className="confirm-dialog__impact-count">{item.count}</span>
                  <span className="confirm-dialog__impact-label">{item.label}</span>
                </div>
              ))}
          </div>
        )}

        {options.caution && (
          <p className="confirm-dialog__caution">{options.caution}</p>
        )}

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="confirm-dialog__btn confirm-dialog__btn--cancel"
            onClick={onCancel}
          >
            {options.cancelText}
          </button>
          <button
            type="button"
            className={[
              'confirm-dialog__btn',
              options.tone === 'warning'
                ? 'confirm-dialog__btn--warning'
                : options.tone === 'neutral'
                  ? 'confirm-dialog__btn--neutral'
                  : 'confirm-dialog__btn--danger',
            ].join(' ')}
            onClick={onConfirm}
          >
            {options.confirmText}
          </button>
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

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        close(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
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
