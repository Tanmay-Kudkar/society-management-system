import { useNavigate, Link } from 'react-router-dom'
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
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? isDark ? 'bg-slate-900/95 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-white/5' : 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-200/80'
          : isDark ? 'bg-transparent' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/welcome"
            className="flex items-center gap-2.5 group"
          >
            <div
              className="p-2 rounded-xl shadow-lg transition-all duration-300 group-hover:scale-110"
              style={{
                background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))`,
                boxShadow: `0 8px 16px -4px color-mix(in srgb, var(--accent-primary) 30%, transparent)`
              }}
            >
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span
                className="text-lg font-black tracking-tight bg-clip-text text-transparent"
                style={{ backgroundImage: isDark
                  ? `linear-gradient(to right, white, var(--accent-light), var(--accent-secondary))`
                  : `linear-gradient(to right, #111827, var(--accent-primary), var(--accent-secondary))`
                }}
              >SocietyHub</span>
              <span className="text-[8px] font-medium -mt-1 tracking-widest uppercase" style={{ color: isDark ? 'color-mix(in srgb, var(--accent-light) 70%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 70%, transparent)' }}>Management System</span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                style={location.pathname === l.path ? { color: 'var(--accent-primary)', background: isDark ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 8%, white)' } : {}}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme dropdown */}
            <div className="relative" ref={themeRef}>
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 hover:scale-110 focus:outline-none ${
                  isDark ? 'bg-slate-800/80 hover:bg-slate-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {!isManual ? <Monitor className="w-4 h-4 sm:w-5 sm:h-5" /> : isDark ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              {themeMenuOpen && (
                <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-2xl overflow-hidden z-50 animate-in-down ${isDark ? 'bg-slate-800 border border-white/10' : 'bg-white border border-gray-200'}`}>
                  <div className="py-1">
                    {[
                      { label: 'System', icon: Monitor, active: !isManual, action: () => { resetToSystemTheme(); setThemeMenuOpen(false) } },
                      { label: 'Light', icon: Sun, active: isManual && theme === 'light', action: () => { setTheme('light'); setThemeMenuOpen(false) } },
                      { label: 'Dark', icon: Moon, active: isManual && theme === 'dark', action: () => { setTheme('dark'); setThemeMenuOpen(false) } },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={opt.action}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          opt.active
                            ? isDark ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                            : isDark ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <opt.icon className="w-4 h-4" />
                        <span>{opt.label}</span>
                        {opt.active && <CheckCircle className="w-4 h-4 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-xl transition-all focus:outline-none ${isDark ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Login CTA */}
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
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
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className={`mx-4 mb-3 rounded-2xl p-4 space-y-1 ${isDark ? 'bg-slate-800/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200'}`}>
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDark ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={location.pathname === l.path ? { color: 'var(--accent-primary)', background: isDark ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 8%, white)' } : {}}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-3 rounded-xl text-white font-semibold mt-2"
              style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 animate-fade-in-up">
        {children}
      </main>

      {/* Footer */}
      <footer className={`py-12 px-4 border-t transition-colors ${isDark ? 'border-white/10 bg-slate-950/50' : 'border-gray-200 bg-white/50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/welcome" className="flex items-center gap-2.5 mb-4 group">
                <div className="p-2 rounded-xl transition-transform group-hover:scale-110" style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}>
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>SocietyHub</span>
              </Link>
              <p className={`text-sm mb-5 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                The complete digital solution for modern housing society management.
              </p>
              <div className="flex items-center gap-3">
                {[
                  { icon: <Twitter className="w-4 h-4" />, href: '#' },
                  { icon: <Github className="w-4 h-4" />, href: '#' },
                  { icon: <Linkedin className="w-4 h-4" />, href: '#' },
                ].map((s, i) => (
                  <a key={i} href={s.href} className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900'}`}>
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
              <div key={i}>
                <h4 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <Link
                        to={link.to}
                        className={`text-sm transition-colors duration-200 hover:translate-x-1 inline-block ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
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
          <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              © 2026 SocietyHub. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/privacy" className={`transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Privacy</Link>
              <Link to="/terms" className={`transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Terms</Link>
              <Link to="/contact" className={`transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
