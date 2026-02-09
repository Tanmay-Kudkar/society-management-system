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
    <div className={`min-h-screen flex overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* ─── Left Side — Decorative ─── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={isDark
          ? { background: `linear-gradient(to bottom right, color-mix(in srgb, var(--accent-primary) 30%, #0f172a), #0f172a, color-mix(in srgb, var(--accent-secondary) 20%, #0f172a))` }
          : { background: `linear-gradient(135deg, var(--accent-primary), var(--accent-gradient-via), var(--accent-secondary))` }
        }
      >
        {/* Background blobs */}
        {isDark ? (
          <>
            <div className="absolute inset-0 gradient-mesh opacity-30" />
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-floatSlow" style={{ background: 'color-mix(in srgb, var(--accent-primary) 25%, transparent)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-float" style={{ background: 'color-mix(in srgb, var(--accent-secondary) 20%, transparent)' }} />
            <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full blur-3xl animate-floatSlow" style={{ animationDelay: '1s', background: 'color-mix(in srgb, var(--accent-light) 15%, transparent)' }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-floatSlow" />
              <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl animate-float" />
            </div>
          </>
        )}

        {/* Grid overlay */}
        <div
          className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`}
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />

        {/* Left content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className={`transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Link
              to="/welcome"
              className={`inline-flex items-center gap-2 transition-all mb-12 group ${isDark ? 'text-gray-400 hover:text-white' : 'text-white/80 hover:text-white'}`}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>

            <div className="flex items-center gap-4 mb-8">
              <div
                className="p-4 rounded-2xl shadow-2xl"
                style={isDark
                  ? { background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))`, boxShadow: '0 20px 40px color-mix(in srgb, var(--accent-primary) 30%, transparent)' }
                  : { background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(16px)' }
                }
              >
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">SocietyHub</h1>
                <p className={isDark ? 'text-gray-400' : 'text-white/80'}>Admin Portal</p>
              </div>
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Welcome back to
              <span
                className={`block mt-1 ${isDark ? 'bg-clip-text text-transparent' : 'text-yellow-200'}`}
                style={isDark ? { backgroundImage: `linear-gradient(to right, var(--accent-light), var(--accent-secondary))` } : {}}
              >
                the future of society management
              </span>
            </h2>

            <p className={`text-lg max-w-md leading-relaxed ${isDark ? 'text-gray-400' : 'text-white/80'}`}>
              Sign in to access your dashboard and manage your society with ease and efficiency.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mt-8 stagger-children">
              {[
                { icon: ShieldCheck, text: 'Secure Login' },
                { icon: Users, text: 'Role-Based Access' },
                { icon: Key, text: '24/7 Available' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className={`px-4 py-2.5 rounded-full text-sm flex items-center gap-2 ${isDark ? 'bg-white/5 text-gray-300 backdrop-blur-sm' : 'bg-white/20 backdrop-blur-sm text-white'}`}
                >
                  <feature.icon className="w-4 h-4" style={{ color: isDark ? 'var(--accent-light)' : '#fde047' }} />
                  {feature.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right Side — Login Form ─── */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-8 transition-colors ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className={`max-w-md w-full transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Theme Toggle */}
          <div className="flex justify-end mb-4">
            <div className={`inline-flex rounded-xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              {[
                { label: 'System', icon: Monitor, active: !isManual, action: resetToSystemTheme },
                { label: 'Light', icon: Sun, active: isManual && theme === 'light', action: () => setTheme('light') },
                { label: 'Dark', icon: Moon, active: isManual && theme === 'dark', action: () => setTheme('dark') },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={opt.action}
                  className={`p-2.5 transition-all duration-200 focus:outline-none cursor-pointer ${
                    opt.active
                      ? 'text-white'
                      : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={opt.active ? { background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` } : {}}
                  title={opt.label}
                >
                  <opt.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/welcome" className={`inline-flex items-center gap-2 transition-colors mb-4 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-3 rounded-xl" style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}>
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>SocietyHub</span>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left mb-6">
            <h2 className={`text-2xl lg:text-3xl font-bold mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Sign in to your account
            </h2>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Select your portal and enter your credentials
            </p>
          </div>

          {/* ─── Portal Type Selector ─── */}
          <div className="mb-5">
            <label className={`block text-sm font-semibold mb-2.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Select Portal
            </label>
            <div
              className="relative"
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
                    className={`w-full flex items-center gap-3 pl-4 pr-4 py-3.5 border-2 rounded-xl outline-none transition-all duration-300 cursor-pointer ${
                      dropdownOpen
                        ? isDark
                          ? 'border-[var(--accent-primary)] bg-slate-800 shadow-lg'
                          : 'border-[var(--accent-primary)] bg-white shadow-lg'
                        : isDark
                          ? 'border-slate-700 bg-slate-800 hover:border-slate-600'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    style={dropdownOpen ? { boxShadow: `0 4px 20px color-mix(in srgb, var(--accent-primary) 20%, transparent)` } : {}}
                  >
                    {/* Icon */}
                    <div
                      className="p-1.5 rounded-lg transition-colors duration-200"
                      style={{
                        background: selectedPortal
                          ? isDark
                            ? 'color-mix(in srgb, var(--accent-primary) 15%, transparent)'
                            : 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
                          : isDark ? 'rgba(100,116,139,0.15)' : 'rgba(156,163,175,0.15)'
                      }}
                    >
                      {SelectedIcon
                        ? <SelectedIcon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                        : <Shield className="w-4 h-4" style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
                      }
                    </div>
                    {/* Text */}
                    <div className="flex-1 text-left">
                      {selectedPortal ? (
                        <>
                          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {selectedPortal.label} Portal
                          </span>
                          <span className={`block text-xs font-medium mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {selectedPortal.detail}
                          </span>
                        </>
                      ) : (
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          Choose your portal type...
                        </span>
                      )}
                    </div>
                    {/* Chevron */}
                    <ChevronDown
                      className={`w-5 h-5 transition-all duration-300 ${dropdownOpen ? 'rotate-180' : ''} ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    />
                  </button>
                )
              })()}

              {/* Custom Dropdown Menu */}
              <div
                className={`absolute z-50 w-full mt-2 rounded-xl border overflow-hidden transition-all duration-300 ${
                  dropdownOpen
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-2 pointer-events-none'
                } ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 shadow-2xl shadow-black/40'
                    : 'bg-white border-gray-200 shadow-2xl shadow-black/8'
                }`}
              >
                {(isDesktopView ? PORTALS : PORTALS.filter(p => p.key !== 'admin')).map((p, i) => {
                  const active = portalType === p.key
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => { setPortalType(p.key); setDropdownOpen(false); setError('') }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-20 cursor-pointer ${
                        active
                          ? isDark
                            ? 'bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)]'
                            : 'bg-[color-mix(in_srgb,var(--accent-primary)_8%,white)]'
                          : isDark
                            ? 'hover:bg-slate-700/60'
                            : 'hover:bg-gray-50'
                      } ${i < PORTALS.length - 1 ? (isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-100') : ''}`}
                    >
                      {/* Icon */}
                      <div
                        className="p-2 rounded-lg transition-colors duration-200"
                        style={{
                          background: active
                            ? isDark
                              ? 'color-mix(in srgb, var(--accent-primary) 20%, transparent)'
                              : 'color-mix(in srgb, var(--accent-primary) 12%, white)'
                            : isDark ? 'rgba(100,116,139,0.12)' : 'rgba(100,116,139,0.08)'
                        }}
                      >
                        <p.icon
                          className="w-4.5 h-4.5 transition-colors duration-200"
                          style={{ color: active ? 'var(--accent-primary)' : isDark ? '#94a3b8' : '#475569' }}
                        />
                      </div>
                      {/* Label + Desc */}
                      <div className="flex-1 text-left">
                        <span
                          className={`text-sm font-bold transition-colors duration-200 ${
                            active ? '' : isDark ? 'text-gray-100' : 'text-gray-800'
                          }`}
                          style={active ? { color: 'var(--accent-primary)' } : {}}
                        >
                          {p.label}
                        </span>
                        <span className={`block text-xs font-medium mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {p.desc}
                        </span>
                      </div>
                      {/* Active Check */}
                      {active && (
                        <div
                          className="p-1 rounded-full"
                          style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
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
              className={`mb-4 p-3.5 rounded-xl border flex items-start gap-3 animate-error-shake ${errorPulse ? 'animate-error-pulse' : ''} ${isDark ? 'bg-red-950/40 border-red-800/60' : 'bg-red-50 border-red-200'}`}
            >
              <div className={`flex-shrink-0 p-1 rounded-lg ${isDark ? 'bg-red-800/40' : 'bg-red-100'}`}>
                <AlertCircle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>Authentication Failed</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-red-300/80' : 'text-red-600'}`}>{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className={`flex-shrink-0 p-1 rounded-md transition-colors ${isDark ? 'text-red-400 hover:bg-red-800/30' : 'text-red-600 hover:bg-red-100'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={`space-y-4 ${shake ? 'animate-error-shake' : ''}`}>
            {/* Email */}
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <div className="relative group">
                <div
                  className={`absolute inset-0 rounded-xl blur transition-opacity -m-0.5 ${focusedField === 'email' ? 'opacity-100' : 'opacity-0'}`}
                  style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
                />
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors"
                    style={{ color: focusedField === 'email' ? 'var(--accent-primary)' : isDark ? '#6b7280' : '#9ca3af' }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl outline-none transition-all duration-200 ${
                      isDark
                        ? 'border-slate-700 bg-slate-800 text-white placeholder:text-gray-500 focus:border-[var(--accent-primary)]'
                        : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[var(--accent-primary)]'
                    }`}
                    placeholder=" user@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative group">
                <div
                  className={`absolute inset-0 rounded-xl blur transition-opacity -m-0.5 ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'}`}
                  style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
                />
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors"
                    style={{ color: focusedField === 'password' ? 'var(--accent-primary)' : isDark ? '#6b7280' : '#9ca3af' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl outline-none transition-all duration-200 ${
                      isDark
                        ? 'border-slate-700 bg-slate-800 text-white placeholder:text-gray-500 focus:border-[var(--accent-primary)]'
                        : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[var(--accent-primary)]'
                    }`}
                    placeholder=" Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all focus:outline-none cursor-pointer ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center peer-checked:border-transparent ${
                      isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'
                    }`}
                    style={rememberMe ? { background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))`, borderColor: 'transparent' } : {}}
                  >
                    {rememberMe && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: 'var(--accent-primary)' }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 px-6 text-white font-semibold tracking-[0.05em] uppercase text-sm rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group focus:outline-none focus:ring-4 focus:ring-accent-primary/20 hover:-translate-y-0.5 active:translate-y-px"
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
              <span className={`block transition-all duration-300 ${loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                Sign In
              </span>

              {loading && (
                <span className="absolute inset-0 flex items-center justify-center gap-3 animate-fade-in-up">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              )}

              {/* Shine overlay */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
            </button>
          </form>

          {/* Footer — Request Access */}
          <p className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Don't have an account?{' '}
            <Link to="/contact" className="font-semibold transition-colors hover:underline" style={{ color: 'var(--accent-primary)' }}>
              Request Access
            </Link>
          </p>

          {/* Demo Credentials */}
          <div
            className={`mt-4 p-3.5 rounded-xl border transition-opacity transition-transform duration-500 ${demoLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Demo Credentials</p>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  <span className="font-medium">Email:</span> admin@society.com
                </span>
                <button
                  type="button"
                  onClick={() => { setEmail('admin@society.com'); setPassword('admin123'); setPortalType('admin') }}
                  className="text-xs font-medium px-2 py-1 rounded-md transition-all hover:scale-105"
                  style={{ color: 'var(--accent-primary)', background: isDark ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 8%, white)' }}
                >
                  Auto-fill
                </button>
              </div>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                <span className="font-medium">Password:</span> admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
