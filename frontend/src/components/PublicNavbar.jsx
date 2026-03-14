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
      'pointer-events-none fixed left-0 right-0 top-0 z-[120] flex flex-col px-3 pb-6 pt-3 transition duration-500 ease-out sm:px-4 sm:pb-8 sm:pt-6',
      'before:absolute before:inset-0 before:-z-10 before:w-full before:bg-white/30 before:backdrop-blur-md before:[mask-image:linear-gradient(to_bottom,black_60%,transparent)] dark:before:bg-slate-900/30',
      loaded ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0',
    )}>
      <nav className={clsx(
        'pointer-events-auto relative z-10 mx-auto flex w-full items-center justify-between gap-3 rounded-full border-2 border-slate-300/80 bg-white/50 px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-colors sm:px-5 sm:py-3 dark:border-slate-600/60 dark:bg-slate-900/50 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        maxWidthClass
      )}>
        {onBrandClick ? (
            <button className="no-sweep flex cursor-pointer items-center gap-2.5 border-none bg-transparent p-0 text-inherit hover:opacity-90" onClick={onBrandClick}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
                <Building2 size={17} />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[1.15rem] font-extrabold leading-none tracking-tight text-slate-900 dark:text-white sm:text-[1.35rem] lg:text-[1.5rem]">SocietyHub</span>
                {brandSubtitle && <span className="mt-px text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Management System</span>}
              </div>
            </button>
          ) : (
            <Link to="/" className="no-sweep flex items-center gap-2.5 no-underline hover:opacity-90">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
                <Building2 size={17} />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[1.15rem] font-extrabold leading-none tracking-tight text-slate-900 dark:text-white sm:text-[1.35rem] lg:text-[1.5rem]">SocietyHub</span>
                {brandSubtitle && <span className="mt-px text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Management System</span>}
              </div>
            </Link>
          )}

          <div className={clsx(linksClass, 'items-center gap-1 rounded-full border-2 border-slate-300/80 bg-transparent px-1.5 py-1.5 dark:border-slate-600/60')}>
            {navItems.map((item) => {
              const isActive = item.to && location.pathname === item.to
              if (item.to) {
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={clsx(
                      'no-sweep rounded-full px-4 py-1.5 text-[0.9rem] font-bold no-underline transition-colors hover:text-slate-900 dark:hover:text-white',
                      isActive ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'
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
                  className="no-sweep rounded-full px-4 py-1.5 text-[0.9rem] font-bold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
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
                className="no-sweep inline-flex h-9 items-center justify-center gap-1.5 rounded-full border-2 border-slate-300/80 bg-transparent pl-3 pr-2.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Theme options"
                aria-expanded={themeMenuOpen}
                type="button"
              >
                {!isManual ? <Monitor size={15} className="stroke-[2.5]" /> : isDark ? <Moon size={15} className="stroke-[2.5]" /> : <Sun size={15} className="stroke-[2.5]" />}
                <span className="hidden text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 lg:inline">{activeThemeLabel}</span>
                <ChevronDown size={14} className="ml-0.5 text-slate-500" />
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
                  className="no-sweep hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-[0.85rem] font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 sm:inline-flex"
                >
                  Login
                </Link>
                <Link
                  to="/login"
                  className="no-sweep hidden rounded-full bg-blue-600 px-4 py-2 text-[0.85rem] font-bold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 sm:inline-flex"
                >
                  Admin Portal
                </Link>
              </>
            )}

            <button onClick={() => setMobileMenuOpen((prev) => !prev)} className="no-sweep md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-300/80 bg-transparent text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600/60 dark:text-slate-300 dark:hover:bg-slate-800">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
      </nav>

      <div 
        className={clsx(
          'pointer-events-auto mx-auto w-full grid transition-all duration-300 ease-in-out', 
          maxWidthClass,
          mobileMenuOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {navItems.map((item) => item.to ? (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={clsx(
                'no-sweep rounded-xl px-4 py-3 text-left text-[0.95rem] font-bold no-underline transition-colors',
                location.pathname === item.to
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white'
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
              className="no-sweep rounded-xl px-4 py-3 text-left text-[0.95rem] font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white"
            >
              {item.label}
            </button>
          ))}

          {showAuthButtons && (
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="no-sweep rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-[0.95rem] font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Login
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="no-sweep rounded-xl bg-blue-600 px-4 py-3 text-center text-[0.95rem] font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Admin Portal
              </Link>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  )
}