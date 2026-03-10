import { useState } from 'react'
import { Info } from 'lucide-react'

export default function InfoTooltip({ text, size = 16 }) {
  const [show, setShow] = useState(false)

  if (!text) return null

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(prev => !prev)}
    >
      <Info
        size={size}
        className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
        aria-label={text}
      />
      {show && (
        <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated,var(--bg-card))] px-3 py-2 text-xs font-normal text-[var(--text-secondary)] shadow-lg">
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-[var(--border-default)] bg-[var(--bg-elevated,var(--bg-card))]" />
          {text}
        </div>
      )}
    </div>
  )
}
