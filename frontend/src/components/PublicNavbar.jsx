import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Building2, Sun, Moon, Monitor, Check, Menu, X, ChevronDown } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const breakpointClassMap = {
  md: 'hidden md:flex',
  lg: 'hidden lg:flex',
}

export default function PublicNavbar({
  loaded = true,
  navItems = [],
  onBrandClick,
  brandSubtitle = false,
  showAuthButtons = true,
  maxWidthClass = 'max-w-[1240px]',
  linksBreakpoint = 'md',
  themeDesktopOnly = false,
}) {
  const location = useLocation()
  const { isDark, theme, setTheme, resetToSystemTheme, isManual } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const themeMenuRef = useRef(null)

  useEffect(() => {
    const handleOutside = (event) => {
      const path = event.composedPath ? event.composedPath() : []
      const clickedInside = themeMenuRef.current && (path.includes(themeMenuRef.current) || themeMenuRef.current.contains(event.target))
      if (!clickedInside) {
        setThemeMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [])

  const linksClass = breakpointClassMap[linksBreakpoint] || breakpointClassMap.md
  const rightClass = themeDesktopOnly ? 'hidden md:flex items-center gap-2' : 'flex items-center gap-2 sm:gap-3'
  const activeThemeLabel = !isManual ? 'System' : theme === 'dark' ? 'Dark' : 'Light'

  const applyThemeChoice = (action) => (event) => {
    event.preventDefault()
    event.stopPropagation()
    action()
    setThemeMenuOpen(false)
  }

  return (
    <header className={clsx(
      'fixed left-0 right-0 top-0 z-[120] px-4 pt-4 pb-4 sm:pt-6 transition duration-500 ease-out',
      loaded ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0',
    )}>
      <nav className={clsx(
        'mx-auto flex w-full items-center justify-between gap-3 rounded-full border border-white/60 bg-white/70 px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md transition-colors dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]',
        maxWidthClass
      )}>
        {onBrandClick ? (
            <button className="no-sweep flex cursor-pointer items-center gap-2.5 border-none bg-transparent p-0 text-inherit" onClick={onBrandClick}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_8px_18px_rgba(37,99,235,0.35)]">
                <Building2 size={17} />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[1.68rem] font-extrabold leading-none tracking-[-0.02em] text-slate-900 dark:text-white">SocietyHub</span>
                {brandSubtitle && <span className="mt-px text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Management System</span>}
              </div>
            </button>
          ) : (
            <Link to="/" className="no-sweep flex items-center gap-2.5 no-underline">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_8px_18px_rgba(37,99,235,0.35)]">
                <Building2 size={17} />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[1.68rem] font-extrabold leading-none tracking-[-0.02em] text-slate-900 dark:text-white">SocietyHub</span>
                {brandSubtitle && <span className="mt-px text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Management System</span>}
              </div>
            </Link>
          )}

          <div className={clsx(linksClass, 'items-center rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_15%,var(--border-default))] bg-[color-mix(in_srgb,var(--bg-primary)_84%,transparent)] px-1.5 py-1')}>
            {navItems.map((item) => {
              const isActive = item.to && location.pathname === item.to
              if (item.to) {
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={clsx(
                      'no-sweep rounded-full px-3.5 py-1.5 text-sm font-semibold no-underline transition-colors text-slate-700 hover:bg-[color-mix(in_srgb,var(--accent-primary)_16%,transparent)] hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
                      isActive && 'bg-[color-mix(in_srgb,var(--accent-primary)_18%,transparent)] text-[var(--accent-primary)] dark:text-[var(--accent-secondary)]',
                    )}
                  >
                    {item.label}
                  </Link>
                )
              }

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    item.onClick?.()
                    setMobileMenuOpen(false)
                  }}
                  className="no-sweep rounded-full px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_16%,transparent)] hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className={rightClass}>
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setThemeMenuOpen((prev) => !prev)}
                className="no-sweep inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_18%,var(--border-default))] bg-[color-mix(in_srgb,var(--bg-primary)_85%,transparent)] px-3 text-gray-800 transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)] dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Theme options"
                aria-expanded={themeMenuOpen}
                type="button"
              >
                {!isManual ? <Monitor size={16} /> : isDark ? <Moon size={16} /> : <Sun size={16} />}
                <span className="hidden text-xs font-semibold text-[var(--text-secondary)] lg:inline">{activeThemeLabel}</span>
                <ChevronDown size={14} />
              </button>

              {themeMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[212px] rounded-xl border border-[color-mix(in_srgb,var(--accent-primary)_22%,var(--border-default))] bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <button
                    onPointerDown={applyThemeChoice(() => resetToSystemTheme())}
                    className={clsx(
                      'no-sweep inline-flex w-full touch-manipulation items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      !isManual ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    )}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Monitor size={14} />
                      </span>
                      <span className="font-semibold">System Default</span>
                    </span>
                    {!isManual && <Check size={14} className="text-[var(--accent-primary)]" />}
                  </button>
                  <button
                    onPointerDown={applyThemeChoice(() => setTheme('light'))}
                    className={clsx(
                      'no-sweep inline-flex w-full touch-manipulation items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      isManual && theme === 'light' ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    )}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Sun size={14} />
                      </span>
                      <span className="font-semibold">Light Mode</span>
                    </span>
                    {isManual && theme === 'light' && <Check size={14} className="text-[var(--accent-primary)]" />}
                  </button>
                  <button
                    onPointerDown={applyThemeChoice(() => setTheme('dark'))}
                    className={clsx(
                      'no-sweep inline-flex w-full touch-manipulation items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      isManual && theme === 'dark' ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    )}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Moon size={14} />
                      </span>
                      <span className="font-semibold">Dark Mode</span>
                    </span>
                    {isManual && theme === 'dark' && <Check size={14} className="text-[var(--accent-primary)]" />}
                  </button>
                </div>
              )}
            </div>

            {showAuthButtons && (
              <>
                <Link
                  to="/login"
                  className="no-sweep hidden rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_18%,var(--border-default))] bg-[color-mix(in_srgb,var(--bg-primary)_85%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)] sm:inline-flex"
                >
                  Login
                </Link>
                <Link
                  to="/login"
                  className="no-sweep hidden rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_18%,var(--border-default))] bg-[color-mix(in_srgb,var(--bg-primary)_85%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)] sm:inline-flex"
                >
                  Admin Portal
                </Link>
              </>
            )}

            <button onClick={() => setMobileMenuOpen((prev) => !prev)} className="no-sweep md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_18%,var(--border-default))] bg-[color-mix(in_srgb,var(--bg-primary)_85%,transparent)] text-gray-800 transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)] dark:text-slate-300 dark:hover:bg-slate-800">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
      </nav>

      {mobileMenuOpen && (
        <div className={clsx('mt-2 mx-auto flex w-full flex-col gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--accent-primary)_22%,var(--border-default))] bg-[color-mix(in_srgb,var(--bg-card)_94%,white_6%)] p-3 shadow-lg dark:bg-slate-900/95 dark:backdrop-blur-md dark:border-slate-800 dark:shadow-black/20', maxWidthClass)}>
          {navItems.map((item) => item.to ? (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={clsx(
                'no-sweep rounded-lg border border-transparent px-3 py-2.5 text-left text-sm font-semibold no-underline transition-colors text-slate-700 hover:border-[color-mix(in_srgb,var(--accent-primary)_24%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)] hover:text-black dark:text-slate-300 dark:hover:text-white',
                location.pathname === item.to && 'border-[color-mix(in_srgb,var(--accent-primary)_24%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)] text-[var(--accent-primary)] dark:text-[var(--accent-secondary)]',
              )}
            >
              {item.label}
            </Link>
          ) : (
            <button
              key={item.label}
              onClick={() => {
                item.onClick?.()
                setMobileMenuOpen(false)
              }}
              className="no-sweep rounded-lg border border-transparent bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition-colors hover:border-[color-mix(in_srgb,var(--accent-primary)_24%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)] hover:text-black dark:text-slate-300 dark:hover:text-white"
            >
              {item.label}
            </button>
          ))}

          {showAuthButtons && (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="no-sweep mt-1 rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_18%,var(--border-default))] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)]"
              >
                Login
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="no-sweep rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_18%,var(--border-default))] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)]"
              >
                Admin Portal
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}