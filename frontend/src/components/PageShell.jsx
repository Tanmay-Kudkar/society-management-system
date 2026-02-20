import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { useTheme } from '../context/ThemeContext'
import { Building2, Sun, Moon, Monitor, CheckCircle, Menu, X, Github, Twitter, Linkedin } from 'lucide-react'
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
  const isAdminMode = title !== undefined || subtitle !== undefined || Icon !== undefined || actions !== undefined || loading !== undefined

  if (isAdminMode) {
    return (
      <section className={clsx('admin-page-shell', className)}>
        {(title || subtitle || Icon || actions) && (
          <header className="admin-page-shell__header">
            <div className="admin-page-shell__heading">
              {Icon && (
                <span className="admin-page-shell__icon-wrap" aria-hidden="true">
                  <Icon className="admin-page-shell__icon" />
                </span>
              )}
              <div>
                {title && <h1 className="admin-page-shell__title">{title}</h1>}
                {subtitle && <p className="admin-page-shell__subtitle">{subtitle}</p>}
              </div>
            </div>
            {actions ? <div className="admin-page-shell__actions">{actions}</div> : null}
          </header>
        )}

        {loading ? (
          <div className="admin-page-shell__loading">Loading...</div>
        ) : (
          children
        )}
      </section>
    )
  }

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
    <div className="page-shell">
      {/* Navbar */}
      <nav className={clsx("page-shell__nav", scrolled && "page-shell__nav--scrolled")}>
        <div className="page-shell__nav-inner">
          <Link to="/welcome" className="page-shell__logo">
            <div className="page-shell__logo-mark">
              <Building2 className="page-shell__logo-icon" />
            </div>
            <div className="page-shell__logo-text">
              <span className="page-shell__brand">SocietyHub</span>
              <span className="page-shell__tagline">Management System</span>
            </div>
          </Link>

          <div className="page-shell__links">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className={clsx("page-shell__link", location.pathname === l.path && "page-shell__link--active")}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="page-shell__actions">
            <div className="page-shell__theme" ref={themeRef}>
              <button onClick={() => setThemeMenuOpen(!themeMenuOpen)} className="page-shell__theme-button" aria-label="Theme">
                {!isManual ? <Monitor className="page-shell__theme-icon" /> : isDark ? <Moon className="page-shell__theme-icon" /> : <Sun className="page-shell__theme-icon" />}
              </button>
              {themeMenuOpen && (
                <div className="page-shell__theme-menu">
                  <div className="page-shell__theme-list">
                    {[
                      { label: 'System', icon: Monitor, active: !isManual, action: () => { resetToSystemTheme(); setThemeMenuOpen(false) } },
                      { label: 'Light', icon: Sun, active: isManual && theme === 'light', action: () => { setTheme('light'); setThemeMenuOpen(false) } },
                      { label: 'Dark', icon: Moon, active: isManual && theme === 'dark', action: () => { setTheme('dark'); setThemeMenuOpen(false) } },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={opt.action}
                        className={clsx("page-shell__theme-option", opt.active && "page-shell__theme-option--active")}
                      >
                        <opt.icon className="page-shell__theme-option-icon" />
                        <span>{opt.label}</span>
                        {opt.active && <CheckCircle className="page-shell__theme-check" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="page-shell__menu-button">
              {mobileMenuOpen ? <X className="page-shell__menu-icon" /> : <Menu className="page-shell__menu-icon" />}
            </button>

            <Link to="/login" className="page-shell__login">Login</Link>
            <Link to="/login" className="page-shell__login">Admin Portal</Link>
          </div>
        </div>

        <div className={clsx("page-shell__mobile", mobileMenuOpen && "page-shell__mobile--open")}>
          <div className="page-shell__mobile-inner">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx("page-shell__mobile-link", location.pathname === l.path && "page-shell__mobile-link--active")}
              >
                {l.label}
              </Link>
            ))}
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="page-shell__mobile-login">
              Login
            </Link>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="page-shell__mobile-login">
              Admin Portal
            </Link>
          </div>
        </div>
      </nav>

      <main className="page-shell__main">{children}</main>

      {/* Footer */}
      <footer className="page-shell__footer">
        <div className="page-shell__footer-inner">
          <div className="page-shell__footer-grid">
            <div className="page-shell__footer-brand">
              <Link to="/welcome" className="page-shell__footer-logo">
                <div className="page-shell__footer-mark">
                  <Building2 className="page-shell__footer-mark-icon" />
                </div>
                <span className="page-shell__footer-name">SocietyHub</span>
              </Link>
              <p className="page-shell__footer-text">
                The complete digital solution for modern housing society management.
              </p>
              <div className="page-shell__social">
                {socialLinks.map((item, i) => (
                  <a
                    key={i}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="page-shell__social-link"
                    aria-label={`Open ${item.href} in new tab`}
                  >
                    <item.icon className="page-shell__social-icon" />
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Product', links: [
                { label: 'Features', to: '/welcome#features' },
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
              <div key={i} className="page-shell__footer-section">
                <h4 className="page-shell__footer-title">{section.title}</h4>
                <ul className="page-shell__footer-links">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <Link to={link.to} className="page-shell__footer-link">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="page-shell__footer-bottom">
            <p className="page-shell__footer-copy">© 2026 SocietyHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
