import { useState } from 'react'

export default function InfoTooltip({ text, size = 16 }) {
  const [show, setShow] = useState(false)
  const buttonSize = Math.max(20, size + 8)

  if (!text) return null

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[12px] font-bold leading-none text-[var(--text-tertiary)] transition-colors hover:border-[var(--accent-primary)]/45 hover:text-[var(--accent-primary)]"
        style={{ width: `${buttonSize}px`, height: `${buttonSize}px`, fontSize: `${Math.max(11, size - 2)}px` }}
        aria-label={text}
        title="More info"
      >
        ⓘ
      </button>
      {show && (
        <div className="absolute left-1/2 top-full z-50 mt-2 min-w-[200px] max-w-[300px] -translate-x-1/2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated,var(--bg-card))] px-3 py-2 text-xs font-normal leading-relaxed text-[var(--text-secondary)] shadow-lg">
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-[var(--border-default)] bg-[var(--bg-elevated,var(--bg-card))]" />
          {text}
        </div>
      )}
    </div>
  )
}
