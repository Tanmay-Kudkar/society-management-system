import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  Building2, Mail, Lock, AlertCircle, Eye, EyeOff, ArrowLeft,
  Sparkles, Sun, Moon, Monitor, CheckCircle, ShieldCheck, ArrowRight,
  Users, Key, Shield, Briefcase, Home, UserCheck, ChevronDown
} from 'lucide-react'
import '../styles/animations.css'

const PORTALS = [
  { key: 'admin',      label: 'Admin',      icon: Shield,    desc: 'Platform Owner, Org Owner, Society Admin', detail: 'Full platform & society control' },
  { key: 'management', label: 'Management', icon: Briefcase, desc: 'Chairman, Secretary, Treasurer, Committee, Manager, Employee', detail: 'Society governance & day-to-day operations' },
  { key: 'resident',   label: 'Resident',   icon: Home,      desc: 'Member (Flat Owner), Tenant', detail: 'Society residents & tenants' },
  { key: 'visitor',    label: 'Visitor',    icon: UserCheck,  desc: 'Visitor', detail: 'Temporary guest & visitor access' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [portalType, setPortalType] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [shake, setShake] = useState(false)
  const [errorPulse, setErrorPulse] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [demoLoaded, setDemoLoaded] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isDesktopView, setIsDesktopView] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  const [canHover, setCanHover] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  const dropdownRef = useRef(null)
  const hoverTimeout = useRef(null)
  const { login, user, loading: authLoading } = useAuth()
  const { isDark, theme, setTheme, resetToSystemTheme, isManual } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    setIsLoaded(true)
    setDemoLoaded(true)
    
    // Check URL params for portal pre-selection (e.g., ?portal=resident)
    const urlParams = new URLSearchParams(window.location.search)
    const portalParam = urlParams.get('portal')
    
    const savedEmail = localStorage.getItem('rememberedEmail')
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true'
    const savedPortal = localStorage.getItem('rememberedPortal')
    
    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
    
    // Priority: URL param > saved portal > no selection
    if (portalParam && ['admin', 'management', 'resident', 'visitor'].includes(portalParam)) {
      setPortalType(portalParam)
    } else if (savedPortal) {
      setPortalType(savedPortal)
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleChange = () => setIsDesktopView(mediaQuery.matches)
    handleChange()
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  useEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const handleHoverChange = () => setCanHover(hoverQuery.matches)
    handleHoverChange()
    if (hoverQuery.addEventListener) {
      hoverQuery.addEventListener('change', handleHoverChange)
    } else {
      hoverQuery.addListener(handleHoverChange)
    }
    return () => {
      if (hoverQuery.removeEventListener) {
        hoverQuery.removeEventListener('change', handleHoverChange)
      } else {
        hoverQuery.removeListener(handleHoverChange)
      }
    }
  }, [])

  useEffect(() => {
    if (!isDesktopView && portalType === 'admin') {
      setPortalType('')
    }
  }, [isDesktopView, portalType])

  useEffect(() => {
    if (!authLoading && user) navigate('/', { replace: true })
  }, [user, authLoading, navigate])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on Escape
  useEffect(() => {
    if (!dropdownOpen) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [dropdownOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShake(false)
    setErrorPulse(false)

    if (!portalType) {
      setError('Please select a portal type to continue.')
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }

    setLoading(true)

    const result = await login(email, password, { portalType, rememberMe })
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('rememberedPortal', portalType)
      } else {
        localStorage.removeItem('rememberedEmail')
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberedPortal')
      }
      navigate('/')
    } else {
      setError(result.error)
      setShake(true)
      setErrorPulse(true)
      setTimeout(() => setShake(false), 600)
      setTimeout(() => setErrorPulse(false), 1000)
    }
    setLoading(false)
  }

  return (
    <div className={`login-page ${isDark ? 'is-dark' : 'is-light'}`}>
      {/* ─── Left Side — Decorative ─── */}
      <div
        className="login-hero"
        style={isDark
          ? { background: `linear-gradient(to bottom right, color-mix(in srgb, var(--accent-primary) 30%, #0f172a), #0f172a, color-mix(in srgb, var(--accent-secondary) 20%, #0f172a))` }
          : { background: `linear-gradient(135deg, var(--accent-primary), var(--accent-gradient-via), var(--accent-secondary))` }
        }
      >
        {/* Background blobs */}
        {isDark ? (
          <>
            <div className="login-hero-mesh gradient-mesh" />
            <div className="login-hero-orb login-hero-orb-primary animate-floatSlow" style={{ background: 'color-mix(in srgb, var(--accent-primary) 25%, transparent)' }} />
            <div className="login-hero-orb login-hero-orb-secondary animate-float" style={{ background: 'color-mix(in srgb, var(--accent-secondary) 20%, transparent)' }} />
            <div className="login-hero-orb login-hero-orb-accent animate-floatSlow" style={{ animationDelay: '1s', background: 'color-mix(in srgb, var(--accent-light) 15%, transparent)' }} />
          </>
        ) : (
          <div className="login-hero-light-orbs">
            <div className="login-hero-orb login-hero-orb-soft animate-floatSlow" />
            <div className="login-hero-orb login-hero-orb-soft-alt animate-float" />
          </div>
        )}

        {/* Grid overlay */}
        <div
          className={`login-hero-grid ${isDark ? 'is-dark' : 'is-light'}`}
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />

        {/* Left content */}
        <div className="login-hero-content">
          <div className={`login-hero-entrance ${isLoaded ? 'is-visible' : ''}`}>
            <Link
              to="/welcome"
              className={`login-back-link ${isDark ? 'is-dark' : 'is-light'}`}
            >
              <ArrowLeft className="login-back-icon" />
              Back to Home
            </Link>

            <div className="login-brand">
              <div
                className="login-brand-badge"
                style={isDark
                  ? { background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))`, boxShadow: '0 20px 40px color-mix(in srgb, var(--accent-primary) 30%, transparent)' }
                  : { background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(16px)' }
                }
              >
                <Building2 className="login-brand-icon" />
              </div>
              <div>
                <h1 className="login-brand-title">SocietyHub</h1>
                <p className={`login-brand-subtitle ${isDark ? 'is-dark' : 'is-light'}`}>Admin Portal</p>
              </div>
            </div>

            <h2 className="login-hero-title">
              Welcome back to
              <span
                className={`login-hero-highlight ${isDark ? 'is-dark' : 'is-light'}`}
                style={isDark ? { backgroundImage: `linear-gradient(to right, var(--accent-light), var(--accent-secondary))` } : {}}
              >
                the future of society management
              </span>
            </h2>

            <p className={`login-hero-text ${isDark ? 'is-dark' : 'is-light'}`}>
              Sign in to access your dashboard and manage your society with ease and efficiency.
            </p>

            {/* Feature pills */}
            <div className="login-feature-pills stagger-children">
              {[
                { icon: ShieldCheck, text: 'Secure Login' },
                { icon: Users, text: 'Role-Based Access' },
                { icon: Key, text: '24/7 Available' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className={`login-feature-pill ${isDark ? 'is-dark' : 'is-light'}`}
                >
                  <feature.icon className="login-feature-icon" style={{ color: isDark ? 'var(--accent-light)' : '#fde047' }} />
                  {feature.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right Side — Login Form ─── */}
      <div className={`login-form-panel ${isDark ? 'is-dark' : 'is-light'}`}>
        <div className={`login-form-card ${isLoaded ? 'is-visible' : ''}`}>
          {/* Theme Toggle */}
          <div className="login-theme-toggle">
            <div className={`login-theme-track ${isDark ? 'is-dark' : 'is-light'}`}>
              {[
                { label: 'System', icon: Monitor, active: !isManual, action: resetToSystemTheme },
                { label: 'Light', icon: Sun, active: isManual && theme === 'light', action: () => setTheme('light') },
                { label: 'Dark', icon: Moon, active: isManual && theme === 'dark', action: () => setTheme('dark') },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={opt.action}
                  className={`login-theme-button ${opt.active ? 'is-active' : ''} ${isDark ? 'is-dark' : 'is-light'}`}
                  style={opt.active ? { background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` } : {}}
                  title={opt.label}
                >
                  <opt.icon className="login-theme-icon" />
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Logo */}
          <div className="login-mobile-brand">
            <Link to="/welcome" className={`login-mobile-back ${isDark ? 'is-dark' : 'is-light'}`}>
              <ArrowLeft className="login-mobile-back-icon" />
              Back to Home
            </Link>
            <div className="login-mobile-logo">
              <div className="login-mobile-badge" style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}>
                <Building2 className="login-mobile-icon" />
              </div>
              <span className={`login-mobile-title ${isDark ? 'is-dark' : 'is-light'}`}>SocietyHub</span>
            </div>
          </div>

          {/* Form Header */}
          <div className="login-form-header">
            <h2 className={`login-form-title ${isDark ? 'is-dark' : 'is-light'}`}>
              Sign in to your account
            </h2>
            <p className={`login-form-subtitle ${isDark ? 'is-dark' : 'is-light'}`}>
              Select your portal and enter your credentials
            </p>
          </div>

          {/* ─── Portal Type Selector ─── */}
          <div className="login-portal">
            <label className={`login-label ${isDark ? 'is-dark' : 'is-light'}`}>
              Select Portal
            </label>
            <div
              className="login-portal-field"
              ref={dropdownRef}
              onMouseEnter={() => {
                if (!canHover) return
                if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
                hoverTimeout.current = setTimeout(() => setDropdownOpen(true), 220)
              }}
              onMouseLeave={() => {
                if (!canHover) return
                if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
                hoverTimeout.current = setTimeout(() => setDropdownOpen(false), 220)
              }}
              onFocusCapture={() => setDropdownOpen(true)}
              onBlurCapture={() => setDropdownOpen(false)}
            >
              {/* Custom Dropdown Trigger */}
              {(() => {
                const selectedPortal = PORTALS.find(p => p.key === portalType)
                const SelectedIcon = selectedPortal?.icon
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      if (canHover) {
                        if (dropdownOpen) setDropdownOpen(false)
                        return
                      }
                      setDropdownOpen((prev) => !prev)
                    }}
                    aria-expanded={dropdownOpen}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setDropdownOpen(false)
                        e.currentTarget.blur()
                      }
                    }}
                    className={`login-portal-trigger ${dropdownOpen ? 'is-open' : ''} ${isDark ? 'is-dark' : 'is-light'}`}
                    style={dropdownOpen ? { boxShadow: `0 4px 20px color-mix(in srgb, var(--accent-primary) 20%, transparent)` } : {}}
                  >
                    {/* Icon */}
                    <div
                      className="login-portal-icon"
                      style={{
                        background: selectedPortal
                          ? isDark
                            ? 'color-mix(in srgb, var(--accent-primary) 15%, transparent)'
                            : 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
                          : isDark ? 'rgba(100,116,139,0.15)' : 'rgba(156,163,175,0.15)'
                      }}
                    >
                      {SelectedIcon
                        ? <SelectedIcon className="login-portal-icon-svg" style={{ color: 'var(--accent-primary)' }} />
                        : <Shield className="login-portal-icon-svg" style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
                      }
                    </div>
                    {/* Text */}
                    <div className="login-portal-text">
                      {selectedPortal ? (
                        <>
                          <span className={`login-portal-title ${isDark ? 'is-dark' : 'is-light'}`}>
                            {selectedPortal.label} Portal
                          </span>
                          <span className={`login-portal-detail ${isDark ? 'is-dark' : 'is-light'}`}>
                            {selectedPortal.detail}
                          </span>
                        </>
                      ) : (
                        <span className={`login-portal-placeholder ${isDark ? 'is-dark' : 'is-light'}`}>
                          Choose your portal type...
                        </span>
                      )}
                    </div>
                    {/* Chevron */}
                    <ChevronDown
                      className={`login-portal-chevron ${dropdownOpen ? 'is-open' : ''} ${isDark ? 'is-dark' : 'is-light'}`}
                    />
                  </button>
                )
              })()}

              {/* Custom Dropdown Menu */}
              <div
                className={`login-portal-menu ${dropdownOpen ? 'is-open' : ''} ${isDark ? 'is-dark' : 'is-light'}`}
              >
                {(isDesktopView ? PORTALS : PORTALS.filter(p => p.key !== 'admin')).map((p, i) => {
                  const active = portalType === p.key
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => { setPortalType(p.key); setDropdownOpen(false); setError('') }}
                      className={`login-portal-item ${active ? 'is-active' : ''} ${isDark ? 'is-dark' : 'is-light'} ${i < PORTALS.length - 1 ? 'has-divider' : ''}`}
                    >
                      {/* Icon */}
                      <div
                        className="login-portal-item-icon"
                        style={{
                          background: active
                            ? isDark
                              ? 'color-mix(in srgb, var(--accent-primary) 20%, transparent)'
                              : 'color-mix(in srgb, var(--accent-primary) 12%, white)'
                            : isDark ? 'rgba(100,116,139,0.12)' : 'rgba(100,116,139,0.08)'
                        }}
                      >
                        <p.icon
                          className="login-portal-item-icon-svg"
                          style={{ color: active ? 'var(--accent-primary)' : isDark ? '#94a3b8' : '#475569' }}
                        />
                      </div>
                      {/* Label + Desc */}
                      <div className="login-portal-item-text">
                        <span
                          className={`login-portal-item-title ${active ? 'is-active' : ''} ${isDark ? 'is-dark' : 'is-light'}`}
                          style={active ? { color: 'var(--accent-primary)' } : {}}
                        >
                          {p.label}
                        </span>
                        <span className={`login-portal-item-desc ${isDark ? 'is-dark' : 'is-light'}`}>
                          {p.desc}
                        </span>
                      </div>
                      {/* Active Check */}
                      {active && (
                        <div
                          className="login-portal-item-check"
                          style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
                        >
                          <CheckCircle className="login-portal-item-check-icon" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className={`login-error ${errorPulse ? 'is-pulsing' : ''} ${isDark ? 'is-dark' : 'is-light'}`}
            >
              <div className={`login-error-icon ${isDark ? 'is-dark' : 'is-light'}`}>
                <AlertCircle className={`login-error-icon-svg ${isDark ? 'is-dark' : 'is-light'}`} />
              </div>
              <div className="login-error-body">
                <p className={`login-error-title ${isDark ? 'is-dark' : 'is-light'}`}>Authentication Failed</p>
                <p className={`login-error-text ${isDark ? 'is-dark' : 'is-light'}`}>{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className={`login-error-dismiss ${isDark ? 'is-dark' : 'is-light'}`}
              >
                <svg className="login-error-dismiss-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={`login-form ${shake ? 'is-shaking' : ''}`}>
            {/* Email */}
            <div className="login-field">
              <label className={`login-label ${isDark ? 'is-dark' : 'is-light'}`}>
                Email Address
              </label>
              <div className="login-input-shell">
                <div
                  className={`login-input-glow ${focusedField === 'email' ? 'is-focused' : ''}`}
                  style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
                />
                <div className="login-input-wrapper">
                  <Mail
                    className="login-input-icon"
                    style={{ color: focusedField === 'email' ? 'var(--accent-primary)' : isDark ? '#6b7280' : '#9ca3af' }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`login-input ${isDark ? 'is-dark' : 'is-light'}`}
                    placeholder=" user@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label className={`login-label ${isDark ? 'is-dark' : 'is-light'}`}>
                Password
              </label>
              <div className="login-input-shell">
                <div
                  className={`login-input-glow ${focusedField === 'password' ? 'is-focused' : ''}`}
                  style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
                />
                <div className="login-input-wrapper">
                  <Lock
                    className="login-input-icon"
                    style={{ color: focusedField === 'password' ? 'var(--accent-primary)' : isDark ? '#6b7280' : '#9ca3af' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`login-input login-input-password ${isDark ? 'is-dark' : 'is-light'}`}
                    placeholder=" Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`login-input-action ${isDark ? 'is-dark' : 'is-light'}`}
                  >
                    {showPassword ? <EyeOff className="login-input-action-icon" /> : <Eye className="login-input-action-icon" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="login-form-row">
              <label className="login-remember">
                <div className="login-remember-box">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="login-remember-input"
                  />
                  <div
                    className={`login-remember-check ${isDark ? 'is-dark' : 'is-light'} ${rememberMe ? 'is-checked' : ''}`}
                    style={rememberMe ? { background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))`, borderColor: 'transparent' } : {}}
                  >
                    {rememberMe && <CheckCircle className="login-remember-icon" />}
                  </div>
                </div>
                <span className={`login-remember-label ${isDark ? 'is-dark' : 'is-light'}`}>Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="login-forgot-link"
                style={{ color: 'var(--accent-primary)' }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`login-submit ${loading ? 'is-loading' : ''}`}
              style={{
                background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))`,
                boxShadow: `
                  0 10px 20px -5px color-mix(in srgb, var(--accent-primary) 50%, transparent),
                  0 4px 6px -2px color-mix(in srgb, var(--accent-primary) 30%, transparent),
                  inset 0 1px 0 rgba(255,255,255,0.3),
                  inset 0 -2px 0 rgba(0,0,0,0.1)
                `
              }}
            >
              <span className={`login-submit-text ${loading ? 'is-hidden' : ''}`}>
                Sign In
              </span>

              {loading && (
                <span className="login-submit-loading animate-fade-in-up">
                  <div className="login-submit-spinner" />
                  Signing in...
                </span>
              )}

              {/* Shine overlay */}
              <div className="login-submit-shine" />
            </button>
          </form>

          {/* Footer — Request Access */}
          <p className={`login-footer ${isDark ? 'is-dark' : 'is-light'}`}>
            Don't have an account?{' '}
            <Link to="/contact" className="login-footer-link" style={{ color: 'var(--accent-primary)' }}>
              Request Access
            </Link>
          </p>

          {/* Demo Credentials */}
          <div
            className={`login-demo ${demoLoaded ? 'is-visible' : ''} ${isDark ? 'is-dark' : 'is-light'}`}
          >
            <div className="login-demo-header">
              <Sparkles className="login-demo-icon" style={{ color: 'var(--accent-primary)' }} />
              <p className={`login-demo-title ${isDark ? 'is-dark' : 'is-light'}`}>Demo Credentials</p>
            </div>
            <div className="login-demo-body">
              <div className="login-demo-row">
                <span className={`login-demo-text ${isDark ? 'is-dark' : 'is-light'}`}>
                  <span className="login-demo-strong">Email:</span> admin@society.com
                </span>
                <button
                  type="button"
                  onClick={() => { setEmail('admin@society.com'); setPassword('admin123'); setPortalType('admin') }}
                  className="login-demo-action"
                  style={{ color: 'var(--accent-primary)', background: isDark ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 8%, white)' }}
                >
                  Auto-fill
                </button>
              </div>
              <p className={`login-demo-text ${isDark ? 'is-dark' : 'is-light'}`}>
                <span className="login-demo-strong">Password:</span> admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
