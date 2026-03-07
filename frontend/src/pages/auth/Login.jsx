import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context'
import { useTheme } from '../../context'
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
    <div className="relative flex min-h-screen items-center justify-center bg-[color-mix(in_srgb,var(--bg-primary)_92%,#0f172a_8%)] px-4 py-8 sm:px-7">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent-primary)_2%,var(--bg-primary))_0%,var(--bg-primary)_50%)]" />

      <div className={`relative z-[1] w-full max-w-[1320px] transition-all duration-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-2.5 opacity-0'}`}>
        <div className="grid overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--border-default)_85%,#334155_15%)] bg-[color-mix(in_srgb,var(--bg-secondary)_95%,#0f172a_5%)] shadow-[0_25px_50px_-12px_color-mix(in_srgb,#000_25%,transparent)] lg:grid-cols-[minmax(460px,1.2fr)_minmax(460px,560px)]">
          <aside className="flex flex-col justify-center gap-6 border-r border-[color-mix(in_srgb,var(--border-default)_90%,#334155_10%)] bg-[color-mix(in_srgb,var(--bg-secondary)_50%,var(--bg-tertiary)_50%)] p-8">
            <Link to="/welcome" className="mb-6 inline-flex items-center gap-3 no-underline">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--accent-primary)_55%,var(--border-default))] bg-[color-mix(in_srgb,var(--accent-primary)_90%,#1e40af_10%)] text-white">
                <Building2 size={24} />
              </div>
              <span className="text-2xl font-extrabold tracking-[-0.03em] text-[var(--text-primary)]">SocietyHub</span>
            </Link>

            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit rounded-full border border-[color-mix(in_srgb,var(--border-default)_90%,#334155_10%)] bg-[color-mix(in_srgb,var(--bg-primary)_88%,#111827_12%)] px-3 py-1 text-xs font-bold uppercase tracking-[0.03em] text-[color-mix(in_srgb,var(--text-secondary)_84%,#94a3b8_16%)]">
                Cooperative Governance Portal
              </span>
              <h2 className="max-w-[28ch] text-[clamp(1.6rem,1.9vw,1.85rem)] font-extrabold leading-[1.24] tracking-[-0.02em] text-[color-mix(in_srgb,var(--text-primary)_90%,#e2e8f0_10%)]">
                Centralized Cooperative Society Administration System
              </h2>
              <p className="max-w-[58ch] text-[0.99rem] leading-[1.68] text-[color-mix(in_srgb,var(--text-secondary)_86%,#94a3b8_14%)]">
                Designed for committees and administrators to operate core society workflows with accountability and control.
              </p>
            </div>

            <div className="grid gap-3 rounded-xl border border-[color-mix(in_srgb,var(--border-light)_90%,#334155_10%)] bg-[color-mix(in_srgb,var(--bg-primary)_90%,#111827_10%)] p-4">
              {[
                { icon: Users, text: 'Member & Committee Management' },
                { icon: Briefcase, text: 'Maintenance & Billing Control' },
                { icon: FileText, text: 'Complaint & Notice Tracking' },
                { icon: Shield, text: 'Secure Role-Based Access Control' },
              ].map((item, idx) => (
                <div className="flex items-start gap-3 text-[0.95rem] leading-[1.45] text-[var(--text-primary)]" key={idx}>
                  <item.icon size={16} className="mt-0.5 shrink-0 text-[color-mix(in_srgb,var(--accent-primary)_82%,#1e40af_18%)]" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </aside>

          <section className="relative flex flex-col bg-transparent p-8">
            <div className="absolute right-5 top-5 z-10 flex gap-0.5 rounded-md border border-[color-mix(in_srgb,var(--border-light)_90%,#334155_10%)] bg-[color-mix(in_srgb,var(--bg-tertiary)_82%,#111827_18%)] p-0.5">
              {[
                { key: 'system', icon: Monitor, active: !isManual, action: resetToSystemTheme },
                { key: 'light', icon: Sun, active: isManual && theme === 'light', action: () => setTheme('light') },
                { key: 'dark', icon: Moon, active: isManual && theme === 'dark', action: () => setTheme('dark') },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={opt.action}
                  className={`flex h-7 w-7 items-center justify-center rounded transition ${opt.active ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-tertiary)] hover:bg-[color-mix(in_srgb,var(--bg-primary)_60%,transparent)] hover:text-[var(--text-primary)]'}`}
                  title={opt.key}
                >
                  <opt.icon size={14} />
                </button>
              ))}
            </div>

            <div className="flex h-full flex-col justify-center">
              <div className="mb-7">
                <h1 className="mb-2 text-[clamp(1.95rem,2.2vw,2.2rem)] font-extrabold leading-none tracking-[-0.02em] text-[color-mix(in_srgb,var(--text-primary)_92%,#e2e8f0_8%)]">Sign in</h1>
                <p className="text-sm text-[color-mix(in_srgb,var(--text-secondary)_88%,#94a3b8_12%)]">Access your society management dashboard</p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-[rgba(248,81,73,0.3)] bg-[rgba(248,81,73,0.1)] px-4 py-3 text-sm text-[#f85149]">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="ml-auto px-1 text-lg leading-none text-[#f85149]">&times;</button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[color-mix(in_srgb,var(--text-primary)_88%,#e2e8f0_12%)]">Access Type</label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`flex min-h-[2.95rem] w-full items-center justify-between rounded-[10px] border px-3 py-3 text-base transition ${
                        fieldErrors.portalType
                          ? 'border-red-500 shadow-[0_0_0_1px_color-mix(in_srgb,#ef4444_35%,transparent)]'
                          : dropdownOpen
                            ? 'border-[color-mix(in_srgb,var(--accent-primary)_76%,#1e40af_24%)] bg-[color-mix(in_srgb,var(--bg-primary)_80%,var(--accent-primary)_20%)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)]'
                            : 'border-[color-mix(in_srgb,var(--border-default)_82%,#334155_18%)] bg-[color-mix(in_srgb,var(--bg-primary)_92%,#111827_8%)]'
                      } ${selectedPortal ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                      aria-invalid={Boolean(fieldErrors.portalType)}
                    >
                      {selectedPortal ? (
                        <span className="inline-flex items-center gap-2">
                          <selectedPortal.icon size={16} className="text-[var(--accent-primary)]" />
                          {selectedPortal.label} Portal
                        </span>
                      ) : (
                        <span>Select portal type...</span>
                      )}
                      <ChevronDown size={16} className={`text-[var(--text-tertiary)] transition ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[60] rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] p-1 shadow-lg">
                        {PORTALS.map((p) => (
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
                            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition ${portalType === p.key ? 'bg-[rgba(47,129,247,0.08)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
                          >
                            <p.icon size={16} />
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className={`font-medium ${portalType === p.key ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>{p.label}</span>
                              <span className="text-xs text-[var(--text-tertiary)]">{p.desc}</span>
                            </div>
                            {portalType === p.key && <CheckCircle size={16} className="shrink-0 text-[var(--accent-primary)]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {fieldErrors.portalType && <p className="text-xs text-red-500">{fieldErrors.portalType}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[color-mix(in_srgb,var(--text-primary)_88%,#e2e8f0_12%)]">Email address</label>
                  <div className={`flex min-h-[2.95rem] items-center rounded-[10px] border bg-[color-mix(in_srgb,var(--bg-primary)_92%,#111827_8%)] transition ${fieldErrors.email ? 'border-red-500 shadow-[0_0_0_1px_color-mix(in_srgb,#ef4444_35%,transparent)]' : 'border-[color-mix(in_srgb,var(--border-default)_82%,#334155_18%)] focus-within:border-[color-mix(in_srgb,var(--accent-primary)_76%,#1e40af_24%)] focus-within:bg-[color-mix(in_srgb,var(--bg-primary)_80%,var(--accent-primary)_20%)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)]'}`}>
                    <Mail size={16} className="ml-3 text-[var(--text-tertiary)]" />
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
                      className="min-w-0 flex-1 border-none bg-transparent px-3 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      aria-invalid={Boolean(fieldErrors.email)}
                    />
                  </div>
                  {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-[color-mix(in_srgb,var(--text-primary)_88%,#e2e8f0_12%)]">Password</label>
                    <Link to="/forgot-password" className="text-xs text-[color-mix(in_srgb,var(--text-secondary)_80%,var(--accent-primary)_20%)] no-underline hover:text-[var(--accent-primary)] hover:underline">Forgot password?</Link>
                  </div>
                  <div className={`flex min-h-[2.95rem] items-center rounded-[10px] border bg-[color-mix(in_srgb,var(--bg-primary)_92%,#111827_8%)] transition ${fieldErrors.password ? 'border-red-500 shadow-[0_0_0_1px_color-mix(in_srgb,#ef4444_35%,transparent)]' : 'border-[color-mix(in_srgb,var(--border-default)_82%,#334155_18%)] focus-within:border-[color-mix(in_srgb,var(--accent-primary)_76%,#1e40af_24%)] focus-within:bg-[color-mix(in_srgb,var(--bg-primary)_80%,var(--accent-primary)_20%)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)]'}`}>
                    <Lock size={16} className="ml-3 text-[var(--text-tertiary)]" />
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
                      className="min-w-0 flex-1 border-none bg-transparent px-3 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                      placeholder="Enter password"
                      required
                      autoComplete="current-password"
                      aria-invalid={Boolean(fieldErrors.password)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="mr-1 rounded-lg p-2 text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
                </div>

                <label className="mt-[-2px] inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-[17px] w-[17px] translate-y-[-1px] accent-[var(--accent-primary)]" />
                  <span>Remember me</span>
                </label>

                <button type="submit" disabled={loading} className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[color-mix(in_srgb,var(--accent-primary)_86%,#1e40af_14%)] px-4 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--accent-secondary)_86%,#1e40af_14%)] disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> : <>
                    Secure Login
                    <ArrowRight size={16} />
                  </>}
                </button>

                <p className="text-center text-xs text-[var(--text-tertiary)]">Authorized users only. Activity may be monitored.</p>
              </form>

              <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
                Don't have an account?{' '}
                <Link to="/contact" className="font-semibold text-[var(--accent-primary)] no-underline hover:underline">Contact Administrator</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
