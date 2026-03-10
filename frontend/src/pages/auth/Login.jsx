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
      style={{ background: 'linear-gradient(160deg, #0b0f19 0%, #080c14 55%, #05070d 100%)' }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/4 top-0 h-[520px] w-[760px] -translate-x-1/2 -translate-y-1/3 rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, transparent 62%)' }}
        />
        <div
          className="absolute right-1/4 bottom-0 h-[400px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 65%)' }}
        />
      </div>

      <div className={`relative z-[1] w-full max-w-[1320px] transition-all duration-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-2.5 opacity-0'}`}>
        <div
          className="grid overflow-hidden rounded-2xl lg:grid-cols-[minmax(460px,1.2fr)_minmax(460px,560px)]"
          style={{
            border: '1px solid rgba(48,54,61,0.6)',
            background: 'rgba(10,14,22,0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.025)',
          }}
        >
          {/* === LEFT PANEL === */}
          <aside
            className="flex flex-col justify-center gap-6 p-8"
            style={{
              borderRight: '1px solid rgba(48,54,61,0.5)',
              background: 'rgba(8,12,20,0.55)',
            }}
          >
            <Link to="/welcome" className="mb-6 inline-flex items-center gap-3 no-underline">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)',
                  border: '1px solid rgba(59,130,246,0.4)',
                  boxShadow: '0 0 20px rgba(37,99,235,0.3)',
                }}
              >
                <Building2 size={24} />
              </div>
              <span className="text-2xl font-extrabold" style={{ letterSpacing: '-0.03em', color: '#e6edf3' }}>
                SocietyHub
              </span>
            </Link>

            <div className="flex flex-col gap-4">
              <span
                className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase"
                style={{
                  letterSpacing: '0.04em',
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  color: '#60a5fa',
                }}
              >
                Cooperative Governance Portal
              </span>
              <h2
                className="max-w-[28ch] font-extrabold leading-[1.24]"
                style={{ fontSize: 'clamp(1.6rem, 1.9vw, 1.85rem)', letterSpacing: '-0.03em', color: '#e6edf3' }}
              >
                Centralized Cooperative Society Administration System
              </h2>
              <p className="max-w-[58ch] text-[0.99rem] leading-[1.68]" style={{ color: '#6e7985' }}>
                Designed for committees and administrators to operate core society workflows with accountability and control.
              </p>
            </div>

            <div
              className="overflow-hidden rounded-xl"
              style={{ border: '1px solid rgba(48,54,61,0.5)', background: 'rgba(10,14,22,0.5)' }}
            >
              {[
                { icon: Users,     text: 'Member & Committee Management',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.22)'  },
                { icon: Briefcase, text: 'Maintenance & Billing Control',    color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.22)'  },
                { icon: FileText,  text: 'Complaint & Notice Tracking',      color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.22)' },
                { icon: Shield,    text: 'Secure Role-Based Access Control', color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.22)'  },
              ].map((item, idx, arr) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-3 text-[0.95rem] leading-[1.45]"
                  style={{
                    color: '#c9d1d9',
                    borderBottom: idx < arr.length - 1 ? '1px solid rgba(48,54,61,0.35)' : undefined,
                  }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ background: item.bg, border: `1px solid ${item.border}` }}
                  >
                    <item.icon size={14} style={{ color: item.color }} />
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* === RIGHT PANEL === */}
          <section className="relative flex flex-col p-8" style={{ background: 'transparent' }}>
            {/* Theme switcher */}
            <div
              className="absolute right-5 top-5 z-10 flex gap-0.5 rounded-md p-0.5"
              style={{ border: '1px solid rgba(48,54,61,0.6)', background: 'rgba(8,12,20,0.75)' }}
            >
              {[
                { key: 'system', icon: Monitor, active: !isManual,                        action: resetToSystemTheme     },
                { key: 'light',  icon: Sun,     active: isManual && theme === 'light',    action: () => setTheme('light') },
                { key: 'dark',   icon: Moon,    active: isManual && theme === 'dark',     action: () => setTheme('dark')  },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={opt.action}
                  className="flex h-7 w-7 items-center justify-center rounded transition"
                  style={opt.active ? { background: 'rgba(37,99,235,0.85)', color: '#fff' } : { color: '#6e7985' }}
                  title={opt.key}
                >
                  <opt.icon size={14} />
                </button>
              ))}
            </div>

            <div className="flex h-full flex-col justify-center">
              <div className="mb-7">
                <h1
                  className="mb-2 font-extrabold leading-none"
                  style={{ fontSize: 'clamp(1.95rem, 2.2vw, 2.2rem)', letterSpacing: '-0.03em', color: '#e6edf3' }}
                >
                  Sign in
                </h1>
                <p className="text-sm" style={{ color: '#6e7985' }}>Access your society management dashboard</p>
              </div>

              {error && (
                <div
                  className="mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
                  style={{
                    background: 'rgba(248,81,73,0.07)',
                    borderTop: '1px solid rgba(248,81,73,0.2)',
                    borderRight: '1px solid rgba(248,81,73,0.2)',
                    borderBottom: '1px solid rgba(248,81,73,0.2)',
                    borderLeft: '3px solid rgba(248,81,73,0.85)',
                    color: '#f85149',
                  }}
                >
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                  <button
                    onClick={() => setError('')}
                    className="ml-auto px-1 text-lg leading-none opacity-60 transition hover:opacity-100"
                    style={{ color: '#f85149' }}
                  >
                    &times;
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className={`flex flex-col gap-5 ${shake ? 'login-form-shake' : ''}`}>
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold" style={{ color: '#c9d1d9' }}>Email address</label>
                  <div
                    className="flex min-h-[2.95rem] items-center rounded-[10px] transition-all duration-150"
                    style={
                      fieldErrors.email
                        ? { background: 'rgba(16,21,31,0.92)', border: '1px solid rgba(248,81,73,0.55)', boxShadow: '0 0 0 3px rgba(248,81,73,0.08)' }
                        : focusedField === 'email'
                          ? { background: 'rgba(16,21,31,0.92)', border: '1px solid rgba(59,130,246,0.5)', boxShadow: '0 0 0 3px rgba(59,130,246,0.12)' }
                          : { background: 'rgba(16,21,31,0.92)', border: '1px solid rgba(48,54,61,0.88)' }
                    }
                  >
                    <Mail size={16} className="ml-3 shrink-0" style={{ color: '#6e7985' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setFieldErrors((prev) => { const rest = { ...prev }; delete rest.email; return rest })
                      }}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className="min-w-0 flex-1 border-none bg-transparent px-3 py-3 text-base outline-none placeholder:text-[#3d444d]"
                      style={{ color: '#e6edf3', caretColor: '#3b82f6' }}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      aria-invalid={Boolean(fieldErrors.email)}
                    />
                  </div>
                  {fieldErrors.email && <p className="text-xs" style={{ color: '#f85149' }}>{fieldErrors.email}</p>}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold" style={{ color: '#c9d1d9' }}>Password</label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold no-underline transition hover:underline"
                      style={{ color: '#3b82f6' }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div
                    className="flex min-h-[2.95rem] items-center rounded-[10px] transition-all duration-150"
                    style={
                      fieldErrors.password
                        ? { background: 'rgba(16,21,31,0.92)', border: '1px solid rgba(248,81,73,0.55)', boxShadow: '0 0 0 3px rgba(248,81,73,0.08)' }
                        : focusedField === 'password'
                          ? { background: 'rgba(16,21,31,0.92)', border: '1px solid rgba(59,130,246,0.5)', boxShadow: '0 0 0 3px rgba(59,130,246,0.12)' }
                          : { background: 'rgba(16,21,31,0.92)', border: '1px solid rgba(48,54,61,0.88)' }
                    }
                  >
                    <Lock size={16} className="ml-3 shrink-0" style={{ color: '#6e7985' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setFieldErrors((prev) => { const rest = { ...prev }; delete rest.password; return rest })
                      }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="min-w-0 flex-1 border-none bg-transparent px-3 py-3 text-base outline-none placeholder:text-[#3d444d]"
                      style={{ color: '#e6edf3', caretColor: '#3b82f6' }}
                      placeholder="Enter password"
                      required
                      autoComplete="current-password"
                      aria-invalid={Boolean(fieldErrors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="mr-1 rounded-lg p-2 transition hover:opacity-80"
                      style={{ color: '#6e7985' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-xs" style={{ color: '#f85149' }}>{fieldErrors.password}</p>}
                </div>

                {/* Remember me */}
                <label className="mt-[-2px] inline-flex cursor-pointer items-center gap-2 text-sm" style={{ color: '#6e7985' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-[17px] w-[17px] translate-y-[-1px] accent-blue-500"
                  />
                  <span>Remember me</span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setBtnHovered(true)}
                  onMouseLeave={() => setBtnHovered(false)}
                  className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] px-4 py-3 text-base font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)',
                    boxShadow: btnHovered && !loading ? '0 8px 30px rgba(37,99,235,0.65)' : '0 4px 15px rgba(37,99,235,0.35)',
                    transform: btnHovered && !loading ? 'translateY(-2px)' : 'none',
                  }}
                >
                  {loading
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    : <><span>Secure Login</span><ArrowRight size={16} /></>
                  }
                </button>

                <p className="text-center text-xs" style={{ color: '#4d555e' }}>
                  Authorized users only. Activity may be monitored.
                </p>
              </form>

              <p className="mt-5 text-center text-sm" style={{ color: '#6e7985' }}>
                Don't have an account?{' '}
                <Link
                  to="/contact"
                  className="font-semibold no-underline transition hover:underline"
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
