import { useNavigate, Link } from 'react-router-dom'
import clsx from 'clsx'
import { useTheme } from '../context/ThemeContext'
import { Building2, ArrowLeft, Sun, Moon, Monitor, CheckCircle, Menu, X, Github, Twitter, Linkedin } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import '../styles/animations.css'

/**
 * Shared shell for public pages (About, Contact, Privacy, Terms, etc.)
 * Provides consistent navbar, footer, theme toggle, and accent-synced styling.
 */
export default function PageShell({ children }) {
  const navigate = useNavigate()
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
    { label: 'Privacy', path: '/privacy' },
    { label: 'Terms', path: '/terms' },
  ]

  return (
    <div className={clsx("page-shell", isDark && "page-shell--dark")}>
      {/* Navbar */}
      <nav
        className={clsx(
          "page-shell__nav",
          scrolled && "page-shell__nav--scrolled"
        )}
      >
        <div className="page-shell__nav-inner">
          {/* Logo */}
          <Link
            to="/welcome"
            className="page-shell__logo"
          >
            <div
              className="page-shell__logo-mark"
              style={{
                background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))`,
                boxShadow: `0 8px 16px -4px color-mix(in srgb, var(--accent-primary) 30%, transparent)`
              }}
            >
              <Building2 className="page-shell__logo-icon" />
            </div>
            <div className="page-shell__logo-text">
              <span
                className="page-shell__brand"
                style={{ backgroundImage: isDark
                  ? `linear-gradient(to right, white, var(--accent-light), var(--accent-secondary))`
                  : `linear-gradient(to right, #111827, var(--accent-primary), var(--accent-secondary))`
                }}
              >SocietyHub</span>
              <span
                className="page-shell__tagline"
                style={{ color: isDark ? 'color-mix(in srgb, var(--accent-light) 70%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 70%, transparent)' }}
              >
                Management System
              </span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="page-shell__links">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className={clsx(
                  "page-shell__link",
                  location.pathname === l.path && "page-shell__link--active"
                )}
                style={location.pathname === l.path ? { color: 'var(--accent-primary)', background: isDark ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 8%, white)' } : {}}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="page-shell__actions">
            {/* Theme dropdown */}
            <div className="page-shell__theme" ref={themeRef}>
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className={clsx("page-shell__theme-button", isDark && "page-shell__theme-button--dark")}
              >
                {!isManual ? <Monitor className="page-shell__theme-icon" /> : isDark ? <Moon className="page-shell__theme-icon" /> : <Sun className="page-shell__theme-icon" />}
              </button>
              {themeMenuOpen && (
                <div className={clsx("page-shell__theme-menu", isDark && "page-shell__theme-menu--dark")}>
                  <div className="page-shell__theme-list">
                    {[
                      { label: 'System', icon: Monitor, active: !isManual, action: () => { resetToSystemTheme(); setThemeMenuOpen(false) } },
                      { label: 'Light', icon: Sun, active: isManual && theme === 'light', action: () => { setTheme('light'); setThemeMenuOpen(false) } },
                      { label: 'Dark', icon: Moon, active: isManual && theme === 'dark', action: () => { setTheme('dark'); setThemeMenuOpen(false) } },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={opt.action}
                        className={clsx(
                          "page-shell__theme-option",
                          opt.active && "page-shell__theme-option--active",
                          isDark && "page-shell__theme-option--dark"
                        )}
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

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={clsx("page-shell__menu-button", isDark && "page-shell__menu-button--dark")}
            >
              {mobileMenuOpen ? <X className="page-shell__menu-icon" /> : <Menu className="page-shell__menu-icon" />}
            </button>

            {/* Login CTA */}
            <Link
              to="/login"
              className="page-shell__login"
              style={{
                background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))`,
                boxShadow: `0 4px 14px -2px color-mix(in srgb, var(--accent-primary) 40%, transparent)`
              }}
            >
              Login
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={clsx("page-shell__mobile", mobileMenuOpen && "page-shell__mobile--open")}>
          <div className={clsx("page-shell__mobile-inner", isDark && "page-shell__mobile-inner--dark")}>
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  "page-shell__mobile-link",
                  location.pathname === l.path && "page-shell__mobile-link--active"
                )}
                style={location.pathname === l.path ? { color: 'var(--accent-primary)', background: isDark ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 8%, white)' } : {}}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="page-shell__mobile-login"
              style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="page-shell__main">
        {children}
      </main>

      {/* Footer */}
      <footer className={clsx("page-shell__footer", isDark && "page-shell__footer--dark")}>
        <div className="page-shell__footer-inner">
          <div className="page-shell__footer-grid">
            {/* Brand */}
            <div className="page-shell__footer-brand">
              <Link to="/welcome" className="page-shell__footer-logo">
                <div className="page-shell__footer-mark" style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}>
                  <Building2 className="page-shell__footer-mark-icon" />
                </div>
                <span className={clsx("page-shell__footer-name", isDark && "page-shell__footer-name--dark")}>SocietyHub</span>
              </Link>
              <p className={clsx("page-shell__footer-text", isDark && "page-shell__footer-text--dark")}>
                The complete digital solution for modern housing society management.
              </p>
              <div className="page-shell__social">
                {[
                  { icon: <Twitter className="page-shell__social-icon" />, href: '#' },
                  { icon: <Github className="page-shell__social-icon" />, href: '#' },
                  { icon: <Linkedin className="page-shell__social-icon" />, href: '#' },
                ].map((s, i) => (
                  <a key={i} href={s.href} className={clsx("page-shell__social-link", isDark && "page-shell__social-link--dark")}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { title: 'Product', links: [
                { label: 'Features', to: '/welcome#features' },
                { label: 'Pricing', to: '/welcome' },
                { label: 'Demo', to: '/welcome' },
              ]},
              { title: 'Company', links: [
                { label: 'About', to: '/about' },
                { label: 'Contact', to: '/contact' },
                { label: 'Careers', to: '/about' },
              ]},
              { title: 'Legal', links: [
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'Terms of Service', to: '/terms' },
                { label: 'Help Center', to: '/contact' },
              ]},
            ].map((section, i) => (
              <div key={i} className="page-shell__footer-section">
                <h4 className={clsx("page-shell__footer-title", isDark && "page-shell__footer-title--dark")}>{section.title}</h4>
                <ul className="page-shell__footer-links">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <Link
                        to={link.to}
                        className={clsx("page-shell__footer-link", isDark && "page-shell__footer-link--dark")}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div className={clsx("page-shell__footer-bottom", isDark && "page-shell__footer-bottom--dark")}>
            <p className={clsx("page-shell__footer-copy", isDark && "page-shell__footer-copy--dark")}>
              © 2026 SocietyHub. All rights reserved.
            </p>
            <div className="page-shell__footer-legal">
              <Link to="/privacy" className={clsx("page-shell__footer-legal-link", isDark && "page-shell__footer-legal-link--dark")}>Privacy</Link>
              <Link to="/terms" className={clsx("page-shell__footer-legal-link", isDark && "page-shell__footer-legal-link--dark")}>Terms</Link>
              <Link to="/contact" className={clsx("page-shell__footer-legal-link", isDark && "page-shell__footer-legal-link--dark")}>Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
