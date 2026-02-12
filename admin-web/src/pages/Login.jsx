import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  Building2, Mail, Lock, AlertCircle, Eye, EyeOff,
  Sun, Moon, Monitor, CheckCircle, ArrowRight,
  Shield, Briefcase, Home, UserCheck, ChevronDown, FileText, Users
} from 'lucide-react'

const PORTALS = [
  { key: 'admin',      label: 'Admin',      icon: Shield,    desc: 'Platform & Society Admin', detail: 'Full platform control' },
  { key: 'management', label: 'Management', icon: Briefcase, desc: 'Chairman, Secretary, Manager', detail: 'Society operations' },
  { key: 'resident',   label: 'Resident',   icon: Home,      desc: 'Flat Owner, Tenant', detail: 'Resident access' },
  { key: 'visitor',    label: 'Visitor',     icon: UserCheck, desc: 'Guest access', detail: 'Temporary access' },
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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [isDesktopView, setIsDesktopView] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  const dropdownRef = useRef(null)
  const { login, user, loading: authLoading } = useAuth()
  const { theme, setTheme, resetToSystemTheme, isManual } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    setIsLoaded(true)
    const urlParams = new URLSearchParams(window.location.search)
    const portalParam = urlParams.get('portal')
    const savedEmail = localStorage.getItem('rememberedEmail')
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true'
    const savedPortal = localStorage.getItem('rememberedPortal')
    
    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
    if (portalParam && ['admin', 'management', 'resident', 'visitor'].includes(portalParam)) {
      setPortalType(portalParam)
    } else if (savedPortal) {
      setPortalType(savedPortal)
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = () => setIsDesktopView(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!isDesktopView && portalType === 'admin') setPortalType('')
  }, [isDesktopView, portalType])

  useEffect(() => {
    if (!authLoading && user) navigate('/', { replace: true })
  }, [user, authLoading, navigate])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const nextFieldErrors = {}
    if (!portalType) nextFieldErrors.portalType = 'Please select an access type.'
    if (!email.trim()) nextFieldErrors.email = 'Email address is required.'
    if (!password) nextFieldErrors.password = 'Password is required.'

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setError('Please review the highlighted fields.')
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
      setFieldErrors({ password: 'Invalid credentials. Please verify and try again.' })
    }
    setLoading(false)
  }

  const selectedPortal = PORTALS.find(p => p.key === portalType)

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-bg">
        <div className="login-bg-gradient" />
      </div>

      <div className={`login-container ${isLoaded ? 'is-visible' : ''}`}>
        <div className="login-split">
          <aside className="login-side">
            <Link to="/welcome" className="login-logo login-logo--side">
              <div className="login-logo-icon">
                <Building2 size={28} />
              </div>
              <span className="login-logo-text">SocietyHub</span>
            </Link>

            <div className="login-side-content">
              <span className="login-side-tag">
                Cooperative Governance Portal
              </span>
              <h2 className="login-side-title">Centralized Cooperative Society Administration System</h2>
              <p className="login-side-copy">
                Designed for committees and administrators to operate core society workflows with accountability and control.
              </p>
            </div>

            <div className="login-side-points">
              {[
                { icon: Users, text: 'Member & Committee Management' },
                { icon: Briefcase, text: 'Maintenance & Billing Control' },
                { icon: FileText, text: 'Complaint & Notice Tracking' },
                { icon: Shield, text: 'Secure Role-Based Access Control' },
              ].map((item, idx) => (
                <div className="login-side-point" key={idx}>
                  <item.icon size={16} />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </aside>

          <section className="login-main">
            {/* Theme Toggle */}
            <div className="login-theme-toggle">
              {[
                { key: 'system', icon: Monitor, active: !isManual, action: resetToSystemTheme },
                { key: 'light', icon: Sun, active: isManual && theme === 'light', action: () => setTheme('light') },
                { key: 'dark', icon: Moon, active: isManual && theme === 'dark', action: () => setTheme('dark') },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={opt.action}
                  className={`login-theme-btn ${opt.active ? 'is-active' : ''}`}
                  title={opt.key}
                >
                  <opt.icon size={14} />
                </button>
              ))}
            </div>

            {/* Card */}
            <div className="login-card">
              <div className="login-card-header">
                <h1 className="login-title">Sign in</h1>
                <p className="login-subtitle">Access your society management dashboard</p>
              </div>

              {/* Error */}
              {error && (
                <div className="login-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="login-error-close">&times;</button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                {/* Portal Selector */}
                <div className="login-field">
                  <label className="login-label">Access Type</label>
                  <div className="login-select-wrap" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`login-select-trigger ${dropdownOpen ? 'is-open' : ''} ${selectedPortal ? 'has-value' : ''} ${fieldErrors.portalType ? 'has-error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.portalType)}
                    >
                      {selectedPortal ? (
                        <span className="login-select-value">
                          <selectedPortal.icon size={16} className="login-select-icon" />
                          {selectedPortal.label} Portal
                        </span>
                      ) : (
                        <span className="login-select-placeholder">Select portal type...</span>
                      )}
                      <ChevronDown size={16} className={`login-select-chevron ${dropdownOpen ? 'is-open' : ''}`} />
                    </button>
                    {dropdownOpen && (
                      <div className="login-dropdown">
                        {(isDesktopView ? PORTALS : PORTALS.filter(p => p.key !== 'admin')).map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => {
                              setPortalType(p.key)
                              setDropdownOpen(false)
                              setError('')
                              setFieldErrors((prev) => {
                                const rest = { ...prev }
                                delete rest.portalType
                                return rest
                              })
                            }}
                            className={`login-dropdown-item ${portalType === p.key ? 'is-active' : ''}`}
                          >
                            <p.icon size={16} />
                            <div className="login-dropdown-text">
                              <span className="login-dropdown-label">{p.label}</span>
                              <span className="login-dropdown-desc">{p.desc}</span>
                            </div>
                            {portalType === p.key && <CheckCircle size={16} className="login-dropdown-check" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {fieldErrors.portalType && <p className="login-field-error">{fieldErrors.portalType}</p>}
                </div>

                {/* Email */}
                <div className="login-field">
                  <label className="login-label">Email address</label>
                  <div className={`login-input-wrap ${fieldErrors.email ? 'has-error' : ''}`}>
                    <Mail size={16} className="login-input-icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setFieldErrors((prev) => {
                          const rest = { ...prev }
                          delete rest.email
                          return rest
                        })
                      }}
                      className={`login-input ${fieldErrors.email ? 'has-error' : ''}`}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      aria-invalid={Boolean(fieldErrors.email)}
                    />
                  </div>
                  {fieldErrors.email && <p className="login-field-error">{fieldErrors.email}</p>}
                </div>

                {/* Password */}
                <div className="login-field">
                  <div className="login-label-row">
                    <label className="login-label">Password</label>
                    <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
                  </div>
                  <div className={`login-input-wrap ${fieldErrors.password ? 'has-error' : ''}`}>
                    <Lock size={16} className="login-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setFieldErrors((prev) => {
                          const rest = { ...prev }
                          delete rest.password
                          return rest
                        })
                      }}
                      className={`login-input login-input--password ${fieldErrors.password ? 'has-error' : ''}`}
                      placeholder="Enter password"
                      required
                      autoComplete="current-password"
                      aria-invalid={Boolean(fieldErrors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="login-eye-btn"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="login-field-error">{fieldErrors.password}</p>}
                </div>

                {/* Remember me */}
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="login-checkbox"
                  />
                  <span>Remember me</span>
                </label>

                {/* Submit */}
                <button type="submit" disabled={loading} className="login-submit">
                  {loading ? (
                    <span className="login-spinner" />
                  ) : (
                    <>
                      Secure Login
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="login-security-note">Authorized users only. Activity may be monitored.</p>
              </form>

              <p className="login-footer-text">
                Don't have an account?{' '}
                <Link to="/contact" className="login-footer-link">Contact Administrator</Link>
              </p>
            </div>

          </section>
        </div>
      </div>
    </div>
  )
}
