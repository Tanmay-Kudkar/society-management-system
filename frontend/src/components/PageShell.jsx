import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { useTheme } from '../context/ThemeContext'
import { Building2, Sun, Moon, Monitor, CheckCircle, Menu, X, Github, Twitter, Linkedin, Info } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

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
  // All hooks must be called unconditionally at the top
  const location = useLocation()
  const { isDark, theme, setTheme, resetToSystemTheme, isManual } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const themeRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

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

  const navLinks = [
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Blog', path: '/blog' },
  ]

  const socialLinks = [
    { icon: Twitter, href: 'https://x.com' },
    { icon: Github, href: 'https://github.com' },
    { icon: Linkedin, href: 'https://www.linkedin.com' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Navbar */}
      <nav
        className={clsx(
          'sticky top-0 z-[70] border-b border-transparent bg-[color-mix(in_srgb,var(--bg-primary)_88%,transparent)] px-3 py-2.5 backdrop-blur transition-all duration-300',
          scrolled && 'border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-primary)_94%,transparent)] shadow-sm backdrop-blur-md'
        )}
      >
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-secondary)_86%,transparent)] px-3.5 py-2.5 shadow-sm sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="rounded-md bg-[var(--accent-primary)] p-2 transition-transform duration-200 hover:scale-[1.04]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[1.35rem] font-extrabold leading-none tracking-[-0.02em] text-[var(--text-primary)]">SocietyHub</span>
              <span className="mt-px text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Management System</span>
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-[0.85rem] font-semibold text-[var(--text-secondary)] no-underline transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
                  location.pathname === l.path && 'bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] font-bold text-[var(--accent-primary)]'
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative" ref={themeRef}>
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="rounded-md border border-[var(--border-default)] bg-[var(--bg-tertiary)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]"
                aria-label="Theme"
              >
                {!isManual ? <Monitor className="h-[18px] w-[18px] sm:h-5 sm:w-5" /> : isDark ? <Moon className="h-[18px] w-[18px] sm:h-5 sm:w-5" /> : <Sun className="h-[18px] w-[18px] sm:h-5 sm:w-5" />}
              </button>
              {themeMenuOpen && (
                <div className="absolute right-0 z-50 mt-1.5 w-44 overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-lg">
                  <div className="py-1">
                    {[
                      { label: 'System', icon: Monitor, active: !isManual, action: () => { resetToSystemTheme(); setThemeMenuOpen(false) } },
                      { label: 'Light', icon: Sun, active: isManual && theme === 'light', action: () => { setTheme('light'); setThemeMenuOpen(false) } },
                      { label: 'Dark', icon: Moon, active: isManual && theme === 'dark', action: () => { setTheme('dark'); setThemeMenuOpen(false) } },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={opt.action}
                        className={clsx(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)]',
                          opt.active && 'bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] font-semibold'
                        )}
                      >
                        <opt.icon className="h-4 w-4" />
                        <span>{opt.label}</span>
                        {opt.active && <CheckCircle className="ml-auto h-4 w-4 text-[var(--accent-primary)]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md border border-[var(--border-default)] bg-[var(--bg-tertiary)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] md:hidden"
            >
              {mobileMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>

            <Link
              to="/login"
              className="hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)] no-underline transition hover:-translate-y-px hover:bg-[var(--bg-tertiary)] sm:inline-flex"
            >
              Login
            </Link>
            <Link
              to="/login"
              className="hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)] no-underline transition hover:-translate-y-px hover:bg-[var(--bg-tertiary)] sm:inline-flex"
            >
              Admin Portal
            </Link>
          </div>
        </div>

        <div className={clsx('overflow-hidden transition-all duration-300 md:hidden', mobileMenuOpen ? 'max-h-80' : 'max-h-0')}>
          <div className="mx-auto mt-2 max-w-[1120px] rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-3">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  'mb-1.5 block rounded-md px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] no-underline transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
                  location.pathname === l.path && 'bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-[var(--accent-primary)]'
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 block rounded-md border border-[var(--border-default)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] no-underline transition hover:bg-[var(--bg-tertiary)]"
            >
              Login
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 block rounded-md border border-[var(--border-default)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] no-underline transition hover:bg-[var(--bg-tertiary)]"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:px-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-default)] bg-[var(--bg-secondary)]/60">
        <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <Link to="/" className="inline-flex items-center gap-2 no-underline">
                <div className="rounded-md bg-[var(--accent-primary)] p-2 transition-transform duration-200 hover:scale-[1.04]">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-bold text-[var(--text-primary)]">SocietyHub</span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--text-secondary)]">
                The complete digital solution for modern housing society management.
              </p>
              <div className="mt-4 flex items-center gap-2">
                {socialLinks.map((item, i) => (
                  <a
                    key={i}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:-translate-y-px hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                    aria-label={`Open ${item.href} in new tab`}
                  >
                    <item.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Product', links: [
                { label: 'Features', to: '/#features' },
                { label: 'Pricing', to: '/pricing' },
                { label: 'Demo', to: '/demo' },
              ]},
              { title: 'Company', links: [
                { label: 'About', to: '/about' },
                { label: 'Contact', to: '/contact' },
                { label: 'Blog', to: '/blog' },
              ]},
              { title: 'Legal', links: [
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'Terms of Service', to: '/terms' },
                { label: 'Help Center', to: '/help' },
              ]},
            ].map((section, i) => (
              <div key={i}>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <Link to={link.to} className="text-sm text-[var(--text-secondary)] no-underline transition hover:text-[var(--text-primary)]">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-[var(--border-default)] pt-4">
            <p className="text-xs text-[var(--text-tertiary)]">© 2026 SocietyHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
