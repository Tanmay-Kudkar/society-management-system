import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Building2, Github, Twitter, Linkedin, Info } from 'lucide-react'
import { useState } from 'react'
import PublicFooter from './PublicFooter'

/**
 * Shared shell for public pages (About, Contact, Privacy, Terms, Pricing, Blog, Demo, Help)
 * Provides consistent navbar, footer, and theme toggle using CSS variables.
 */

export default function PageShell({
  children,
  title,
  subtitle,
  icon: Icon,
  loading,
  actions,
  className,
}) {
  const [subtitleTooltip, setSubtitleTooltip] = useState(false)

  const isAdminMode = title !== undefined || subtitle !== undefined || Icon !== undefined || actions !== undefined || loading !== undefined

  if (isAdminMode) {
    return (
      <section className={clsx('flex flex-col gap-5', className)}>
        {(title || subtitle || Icon || actions) && (
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {Icon && (
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] text-[var(--accent-primary)]"
                  aria-hidden="true"
                >
                  <Icon className="h-[1.1rem] w-[1.1rem]" />
                </span>
              )}
              <div className="flex items-center gap-2">
                {title && <h1 className="m-0 text-[1.8rem] font-extrabold leading-[1.15] text-[var(--text-primary)]">{title}</h1>}
                {subtitle && (
                  <div className="relative"
                    onMouseEnter={() => setSubtitleTooltip(true)}
                    onMouseLeave={() => setSubtitleTooltip(false)}
                    onClick={() => setSubtitleTooltip(prev => !prev)}
                  >
                    <Info size={16} className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors" aria-label={subtitle} />
                    {subtitleTooltip && (
                      <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated,var(--bg-card))] px-3 py-2 text-xs font-normal text-[var(--text-secondary)] shadow-lg">
                        <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-[var(--border-default)] bg-[var(--bg-elevated,var(--bg-card))]" />
                        {subtitle}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {actions ? <div className="inline-flex items-center gap-2.5">{actions}</div> : null}
          </header>
        )}

        {loading ? (
          <div className="py-4 text-[0.95rem] text-[var(--text-secondary)]">Loading...</div>
        ) : (
          children
        )}
      </section>
    )
  }

  return (
    <div className="landing-page flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:px-6">{children}</main>
      <PublicFooter />
    </div>
  )
}
