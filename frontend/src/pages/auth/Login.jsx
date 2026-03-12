import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context'
import { useTheme } from '../../context'
import {
  Building2, Mail, Lock, AlertCircle, Eye, EyeOff,
  Sun, Moon, Monitor, ArrowRight,
  Shield, Briefcase, FileText, Users
} from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [shake, setShake] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [btnHovered, setBtnHovered] = useState(false)
  const { login, user, loading: authLoading } = useAuth()
  const { theme, setTheme, resetToSystemTheme, isManual } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    setIsLoaded(true)
    const savedEmail = localStorage.getItem('rememberedEmail')
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true'
    
    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user) navigate('/', { replace: true })
  }, [user, authLoading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const nextFieldErrors = {}
    if (!email.trim()) nextFieldErrors.email = 'Email address is required.'
    if (!password) nextFieldErrors.password = 'Password is required.'

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setError('Please review the highlighted fields.')
      return
    }

    setLoading(true)
    const result = await login(email, password, { rememberMe })
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberedEmail')
        localStorage.removeItem('rememberMe')
      }
      navigate('/')
    } else {
      setError(result.error)
      setFieldErrors({ password: 'Invalid credentials. Please verify and try again.' })
      setShake(true)
      setTimeout(() => setShake(false), 600)
    }
    setLoading(false)
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-7"
      style={{ background: '#030712' }}
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
        {/* Top glow */}
        <div className="absolute -top-[5%] left-1/2 -translate-x-1/2 w-[900px] h-[600px]" style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(37,99,235,0.26) 0%, rgba(59,130,246,0.08) 50%, transparent 75%)' }} />
        {/* Top line */}
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />
        {/* Edge glows */}
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-80 h-[500px] rounded-full blur-3xl" style={{ background: 'rgba(37,99,235,0.07)' }} />
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-80 h-[500px] rounded-full blur-3xl" style={{ background: 'rgba(37,99,235,0.05)' }} />
      </div>

      <div className={`relative z-[1] w-full max-w-[1320px] transition-all duration-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-2.5 opacity-0'}`}>
        <div
          className="grid overflow-hidden rounded-2xl lg:grid-cols-[minmax(460px,1.2fr)_minmax(460px,560px)]"
          style={{
            border: '1px solid rgba(255,255,255,0.09)',
            background: 'rgba(255,255,255,0.025)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            boxShadow: '0 0 0 1px rgba(59,130,246,0.08), 0 32px 64px -12px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* === LEFT PANEL === */}
          <aside
            className="flex flex-col justify-between gap-8 p-9"
            style={{
              borderRight: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.015)',
            }}
          >
            {/* Logo */}
            <Link to="/welcome" className="inline-flex items-center gap-3 no-underline w-fit">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)',
                  boxShadow: '0 0 22px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <Building2 size={21} />
              </div>
              <span className="text-[1.35rem] font-black" style={{ letterSpacing: '-0.03em', color: '#f1f5f9' }}>
                SocietyHub
              </span>
            </Link>

            {/* Content block */}
            <div className="flex flex-col gap-5 flex-1 justify-center">
              {/* Badge */}
              <span
                className="inline-flex w-fit items-center gap-[6px] rounded-full px-3 py-[5px] text-[0.7rem] font-bold uppercase"
                style={{
                  letterSpacing: '0.07em',
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(59,130,246,0.06))',
                  border: '1px solid rgba(59,130,246,0.32)',
                  color: '#93c5fd',
                }}
              >
                <span className="w-[5px] h-[5px] rounded-full bg-[#60a5fa]" style={{ boxShadow: '0 0 6px rgba(96,165,250,0.8)' }} />
                Cooperative Governance Portal
              </span>

              <h2
                className="font-black leading-[1.2]"
                style={{ fontSize: 'clamp(1.6rem, 2vw, 1.95rem)', letterSpacing: '-0.035em', color: '#f1f5f9' }}
              >
                Centralized Cooperative Society Administration System
              </h2>
              <p className="text-[0.9375rem] leading-[1.72] max-w-[46ch]" style={{ color: '#475569' }}>
                Designed for committees and administrators to operate core society
                workflows with accountability and control.
              </p>

              {/* Feature list */}
              <div className="flex flex-col gap-2.5 mt-1">
                {[
                  { icon: Users,     text: 'Member & Committee Management',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.28)'  },
                  { icon: Briefcase, text: 'Maintenance & Billing Control',    color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.28)'  },
                  { icon: FileText,  text: 'Complaint & Notice Tracking',      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.28)' },
                  { icon: Shield,    text: 'Secure Role-Based Access Control', color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.28)'  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-[0.875rem] font-medium transition-all duration-200"
                    style={{
                      color: '#94a3b8',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.055)'; e.currentTarget.style.borderColor = `color-mix(in srgb, ${item.color} 22%, transparent)`; e.currentTarget.style.color = '#e2e8f0' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#94a3b8' }}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: item.bg, border: `1px solid ${item.border}` }}
                    >
                      <item.icon size={15} style={{ color: item.color }} />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer note */}
            <p className="text-[0.75rem]" style={{ color: '#334155' }}>
              © 2026 SocietyHub Technologies Pvt. Ltd.
            </p>
          </aside>

          {/* === RIGHT PANEL === */}
          <section className="relative flex flex-col p-9" style={{ background: 'transparent' }}>
            {/* Theme switcher */}
            <div
              className="absolute right-5 top-5 z-10 flex gap-0.5 rounded-lg p-[3px]"
              style={{ border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)' }}
            >
              {[
                { key: 'system', icon: Monitor, active: !isManual,                        action: resetToSystemTheme      },
                { key: 'light',  icon: Sun,     active: isManual && theme === 'light',    action: () => setTheme('light') },
                { key: 'dark',   icon: Moon,    active: isManual && theme === 'dark',     action: () => setTheme('dark')  },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={opt.action}
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-md transition-all duration-150"
                  style={opt.active
                    ? { background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.45)' }
                    : { color: '#475569' }}
                  title={opt.key}
                >
                  <opt.icon size={13} />
                </button>
              ))}
            </div>

            <div className="flex h-full flex-col justify-center">
              <div className="mb-8">
                <h1
                  className="mb-[6px] font-black leading-none"
                  style={{ fontSize: 'clamp(2rem, 2.3vw, 2.35rem)', letterSpacing: '-0.04em', color: '#f1f5f9' }}
                >
                  Sign in
                </h1>
                <p className="text-[0.9rem]" style={{ color: '#475569' }}>Access your society management dashboard</p>
              </div>

              {error && (
                <div
                  className="mb-5 flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.07)',
                    border: '1px solid rgba(239,68,68,0.22)',
                    borderLeft: '3px solid rgba(239,68,68,0.9)',
                    color: '#fca5a5',
                  }}
                >
                  <AlertCircle size={15} className="shrink-0 mt-[1px]" style={{ color: '#f87171' }} />
                  <span className="flex-1 leading-snug">{error}</span>
                  <button
                    onClick={() => setError('')}
                    className="ml-auto text-lg leading-none opacity-50 transition-opacity hover:opacity-100"
                    style={{ color: '#f87171' }}
                  >
                    &times;
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className={`flex flex-col gap-5 ${shake ? 'login-form-shake' : ''}`}>

                {/* Email */}
                <div className="flex flex-col gap-[6px]">
                  <label className="text-[0.8rem] font-semibold" style={{ color: '#94a3b8' }}>Email address</label>
                  <div
                    className="flex h-11 items-center rounded-xl transition-all duration-150"
                    style={
                      fieldErrors.email
                        ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.5)', boxShadow: '0 0 0 3px rgba(239,68,68,0.09)' }
                        : focusedField === 'email'
                          ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(59,130,246,0.65)', boxShadow: '0 0 0 3px rgba(59,130,246,0.13)' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }
                    }
                  >
                    <Mail size={15} className="ml-3.5 shrink-0" style={{ color: focusedField === 'email' ? '#3b82f6' : '#475569', transition: 'color 0.15s' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setFieldErrors((prev) => { const rest = { ...prev }; delete rest.email; return rest })
                      }}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className="min-w-0 flex-1 border-none bg-transparent px-3 py-2.5 text-[0.9rem] outline-none placeholder:text-[#334155]"
                      style={{ color: '#f1f5f9', caretColor: '#3b82f6' }}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      aria-invalid={Boolean(fieldErrors.email)}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="flex items-center gap-1.5 text-xs" style={{ color: '#f87171' }}>
                      <span className="inline-block w-1 h-1 rounded-full bg-[#f87171] shrink-0" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-[6px]">
                  <div className="flex items-center justify-between">
                    <label className="text-[0.8rem] font-semibold" style={{ color: '#94a3b8' }}>Password</label>
                    <Link
                      to="/forgot-password"
                      className="text-[0.775rem] font-semibold no-underline transition-all duration-150 hover:underline"
                      style={{ color: '#3b82f6' }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div
                    className="flex h-11 items-center rounded-xl transition-all duration-150"
                    style={
                      fieldErrors.password
                        ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.5)', boxShadow: '0 0 0 3px rgba(239,68,68,0.09)' }
                        : focusedField === 'password'
                          ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(59,130,246,0.65)', boxShadow: '0 0 0 3px rgba(59,130,246,0.13)' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }
                    }
                  >
                    <Lock size={15} className="ml-3.5 shrink-0" style={{ color: focusedField === 'password' ? '#3b82f6' : '#475569', transition: 'color 0.15s' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setFieldErrors((prev) => { const rest = { ...prev }; delete rest.password; return rest })
                      }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="min-w-0 flex-1 border-none bg-transparent px-3 py-2.5 text-[0.9rem] outline-none placeholder:text-[#334155]"
                      style={{ color: '#f1f5f9', caretColor: '#3b82f6' }}
                      placeholder="Enter password"
                      required
                      autoComplete="current-password"
                      aria-invalid={Boolean(fieldErrors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150 hover:bg-white/10"
                      style={{ color: showPassword ? '#60a5fa' : '#475569' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="flex items-center gap-1.5 text-xs" style={{ color: '#f87171' }}>
                      <span className="inline-block w-1 h-1 rounded-full bg-[#f87171] shrink-0" />
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Remember me */}
                <label className="inline-flex cursor-pointer items-center gap-2.5 text-[0.875rem]" style={{ color: '#64748b' }}>
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-[17px] w-[17px] cursor-pointer rounded accent-blue-500"
                    />
                  </div>
                  <span>Remember me</span>
                </label>

                {/* Divider */}
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setBtnHovered(true)}
                  onMouseLeave={() => setBtnHovered(false)}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-none text-[0.875rem] font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55"
                  style={{
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                    boxShadow: btnHovered && !loading
                      ? '0 8px 36px rgba(37,99,235,0.65), inset 0 1px 0 rgba(255,255,255,0.2)'
                      : '0 4px 18px rgba(37,99,235,0.42), inset 0 1px 0 rgba(255,255,255,0.15)',
                    transform: btnHovered && !loading ? 'translateY(-2px)' : 'none',
                  }}
                >
                  {loading
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    : <><span>Secure Login</span><ArrowRight size={15} /></>
                  }
                </button>

                <p className="text-center text-[0.75rem]" style={{ color: '#334155' }}>
                  Authorized users only. Activity may be monitored.
                </p>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="text-[0.7rem] font-medium" style={{ color: '#334155' }}>New to SocietyHub?</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <p className="text-center text-[0.875rem]" style={{ color: '#475569' }}>
                Don't have an account?{' '}
                <Link
                  to="/contact"
                  className="font-semibold no-underline transition-all duration-150 hover:underline"
                  style={{ color: '#3b82f6' }}
                >
                  Contact Administrator
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
