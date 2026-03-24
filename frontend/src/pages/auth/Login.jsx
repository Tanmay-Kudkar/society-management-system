import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context'
import { useTheme } from '../../context'
import {
  Building2, Mail, Lock, AlertCircle, Eye, EyeOff,
  Sun, Moon, Monitor, ArrowRight, ArrowLeft,
  Shield, Briefcase, FileText, Users, MapPin, X, Bell
} from 'lucide-react'
import PublicSweepButton from '../../components/PublicSweepButton'
import { AnimatedModal } from '../../components'

const LocationPickerMap = lazy(() => import('../../components/LocationPickerMap'))

const DEFAULT_LOCATION = {
  latitude: 19.076,
  longitude: 72.8777,
}

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
  const [location, setLocation] = useState(DEFAULT_LOCATION)
  const [locationStatus, setLocationStatus] = useState('Detecting your location for society-admin session monitoring...')
  const [locating, setLocating] = useState(false)
  const [isManualLocation, setIsManualLocation] = useState(false)
  const [hasCapturedLocation, setHasCapturedLocation] = useState(false)
  const [isLocationPanelOpen, setIsLocationPanelOpen] = useState(false)
  const [locationName, setLocationName] = useState('Resolving location name...')
  const [isResolvingLocation, setIsResolvingLocation] = useState(false)
  const [showCoordinates, setShowCoordinates] = useState(false)
  const { login, user, loading: authLoading } = useAuth()
  const { theme, setTheme, resetToSystemTheme, isManual } = useTheme()
  const navigate = useNavigate()

  const resolveLocationName = useCallback(async (latitude, longitude) => {
    setIsResolvingLocation(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      )

      if (!response.ok) {
        throw new Error('Failed to resolve location name')
      }

      const data = await response.json()
      const address = data?.address || {}
      const conciseName = [
        address.suburb || address.neighbourhood || address.road || address.hamlet,
        address.city || address.town || address.village || address.county,
        address.state,
      ]
        .filter(Boolean)
        .join(', ')

      setLocationName(conciseName || data?.display_name || 'Pinned location selected')
    } catch (_) {
      setLocationName('Pinned location selected')
    } finally {
      setIsResolvingLocation(false)
    }
  }, [])

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by this browser. Use Adjust Map to set location manually.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setIsManualLocation(false)
        setHasCapturedLocation(true)
        setLocationStatus('Location captured. Click map to fine-tune the pin for accurate audit tracking.')
        setLocating(false)
      },
      () => {
        setLocationStatus('Location permission denied or timed out. You can click the map to set location manually.')
        setLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 120000,
      },
    )
  }, [])

  const getFreshLocationForSubmit = useCallback(() => {
    if (!navigator.geolocation) return Promise.resolve(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        () => resolve(null),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      )
    })
  }, [])

  useEffect(() => {
    setIsLoaded(true)
    const savedEmail = localStorage.getItem('rememberedEmail')
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true'

    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail)
      setRememberMe(true)
    }

    detectLocation()
  }, [detectLocation])

  useEffect(() => {
    resolveLocationName(location.latitude, location.longitude)
  }, [location.latitude, location.longitude, resolveLocationName])

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true })
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

    let submitLocation = (isManualLocation || hasCapturedLocation) ? location : null
    if (!isManualLocation) {
      const freshLocation = await getFreshLocationForSubmit()
      if (freshLocation) {
        submitLocation = freshLocation
        setLocation(freshLocation)
        setHasCapturedLocation(true)
        setLocationStatus('Live location captured for login audit.')
      }
    }

    const result = await login(email, password, {
      rememberMe,
      latitude: submitLocation?.latitude,
      longitude: submitLocation?.longitude,
    })
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberedEmail')
        localStorage.removeItem('rememberMe')
      }
      navigate('/dashboard')
    } else {
      setError(result.error)
      if ((result.error || '').toLowerCase().includes('invalid email or password')) {
        setFieldErrors({ password: 'Invalid credentials. Please verify and try again.' })
      }
      setShake(true)
      setTimeout(() => setShake(false), 600)
    }
    setLoading(false)
  }

  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--bg-primary)_92%,#0f172a_8%)] px-2 py-3 sm:items-center sm:px-5 sm:py-7 lg:px-7 lg:py-8">
      <div
        className={`pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent-primary)_2%,var(--bg-primary))_0%,var(--bg-primary)_50%)] transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      <div className={`relative z-[1] w-full max-w-[1320px] transition-all duration-700 ease-out ${isLoaded ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-[0.985] opacity-0'}`}>
        <div className={`grid overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--border-default)_85%,#334155_15%)] bg-[color-mix(in_srgb,var(--bg-secondary)_95%,#0f172a_5%)] shadow-[0_25px_50px_-12px_color-mix(in_srgb,#000_25%,transparent)] transition-all duration-700 ease-out sm:rounded-2xl lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <aside className="hidden lg:flex lg:flex-col lg:gap-6 lg:border-r lg:border-[color-mix(in_srgb,var(--border-default)_90%,#334155_10%)] lg:bg-[color-mix(in_srgb,var(--bg-secondary)_50%,var(--bg-tertiary)_50%)] lg:p-8">
            <Link to="/" className="mb-6 inline-flex items-center gap-3 no-underline">
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

            <div className="flex flex-col gap-5 rounded-2xl border border-[color-mix(in_srgb,var(--border-light)_90%,#334155_10%)] bg-[color-mix(in_srgb,var(--bg-primary)_90%,#111827_10%)] p-6 lg:p-7">
              {[
                { icon: Users, text: 'Member & Committee Management' },
                { icon: Briefcase, text: 'Maintenance & Billing Control' },     
                { icon: FileText, text: 'Complaint & Notice Tracking' },        
                { icon: Shield, text: 'Secure Role-Based Access Control' },
                { icon: Bell, text: 'Automated Reminders & Notifications' },     
              ].map((item, idx) => (
                <div className="flex items-center gap-4 text-[1.05rem] leading-relaxed text-[var(--text-primary)]" key={idx}>
                  <item.icon size={20} className="shrink-0 text-[color-mix(in_srgb,var(--accent-primary)_82%,#1e40af_18%)]" />
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-4 rounded-xl border border-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_3%,transparent)] p-5 pt-4">
              <div className="flex items-center justify-between border-b border-[color-mix(in_srgb,var(--border-light)_50%,transparent)] pb-3">
                 <div className="flex items-center gap-2 text-sm font-bold text-[color-mix(in_srgb,var(--text-primary)_90%,#e2e8f0_10%)]">
                    <Shield size={16} className="text-[var(--accent-primary)]" />
                    Enterprise Security
                 </div>
                 <span className="flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-success)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                    Protected
                 </span>
              </div>
              <p className="text-[0.85rem] leading-[1.6] text-[color-mix(in_srgb,var(--text-secondary)_80%,#94a3b8_20%)]">
                Your society data is protected with 256-bit encryption. All administrative workflows, financial transactions, and user access attempts are actively monitored for compliance.
              </p>
            </div>
          </aside>

          <section className={`relative flex flex-col bg-transparent p-3.5 transition-all duration-700 ease-out sm:p-7 lg:p-8 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`} style={{ transitionDelay: '90ms' }}>
            <div className="z-10 mb-4 flex items-center justify-between gap-2 sm:absolute sm:left-3 sm:right-3 sm:top-3 sm:mb-0">
              <Link
                to="/"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--border-light)_90%,#334155_10%)] bg-[color-mix(in_srgb,var(--bg-primary)_86%,#111827_14%)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] no-underline transition-colors duration-200 hover:text-[var(--text-primary)] lg:hidden"
                aria-label="Back to welcome page"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </Link>

              <div className="ml-auto rounded-xl border border-[color-mix(in_srgb,var(--border-light)_90%,#334155_10%)] bg-[color-mix(in_srgb,var(--bg-primary)_86%,#111827_14%)] p-1">
                <div className="flex items-center gap-1">
                {[
                  { key: 'system', icon: Monitor, label: 'System', active: !isManual, action: resetToSystemTheme },
                  { key: 'light', icon: Sun, label: 'Light', active: isManual && theme === 'light', action: () => setTheme('light') },
                  { key: 'dark', icon: Moon, label: 'Dark', active: isManual && theme === 'dark', action: () => setTheme('dark') },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={opt.action}
                    className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors duration-200 sm:min-h-9 sm:gap-1.5 sm:px-2.5 sm:text-xs ${opt.active ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_76%,transparent)]'}`}
                    title={opt.label}
                    aria-label={`Switch theme: ${opt.label}`}
                  >
                    <opt.icon size={15} />
                    <span className="hidden min-[390px]:inline">{opt.label}</span>
                  </button>
                ))}
                </div>
              </div>
            </div>
            <div className="flex h-full flex-col justify-start pt-1 sm:pt-16">
              <div className="mb-6 sm:mb-7">
                <h1 className="mb-2 text-[clamp(1.75rem,8vw,2.2rem)] font-extrabold leading-none tracking-[-0.02em] text-[color-mix(in_srgb,var(--text-primary)_92%,#e2e8f0_8%)]">Sign in</h1>
                <p className="pt-3 text-sm text-[color-mix(in_srgb,var(--text-secondary)_88%,#94a3b8_12%)]">Access your society management dashboard</p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-[rgba(248,81,73,0.3)] bg-[rgba(248,81,73,0.1)] px-4 py-3 text-sm text-[#f85149]">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="ml-auto px-1 text-lg leading-none text-[#f85149]">&times;</button>
                </div>
              )}

              <form onSubmit={handleSubmit} className={`flex flex-col gap-4 sm:gap-5 ${shake ? 'login-form-shake' : ''}`}>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[color-mix(in_srgb,var(--text-primary)_88%,#e2e8f0_12%)]">Email address</label>
                  <div className={`flex min-h-[2.95rem] items-center rounded-[10px] border bg-[color-mix(in_srgb,var(--bg-primary)_92%,#111827_8%)] transition-[border-color,box-shadow,background-color] duration-300 ease-out ${fieldErrors.email ? 'border-red-500 shadow-[0_0_0_1px_color-mix(in_srgb,#ef4444_35%,transparent)]' : 'border-[color-mix(in_srgb,var(--border-default)_82%,#334155_18%)] focus-within:border-[color-mix(in_srgb,var(--accent-primary)_76%,#1e40af_24%)] focus-within:bg-[color-mix(in_srgb,var(--bg-primary)_80%,var(--accent-primary)_20%)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)]'}`}>
                    <Mail size={16} className="ml-3 shrink-0 text-[var(--text-tertiary)]" />
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
                      className="min-w-0 flex-1 border-none bg-transparent px-3 py-3 text-base text-[var(--text-primary)] outline-none focus:outline-none focus-visible:outline-none placeholder:text-[var(--text-tertiary)]"
                      placeholder="you@example.com"
                      required
                      autoComplete="off"
                      aria-invalid={Boolean(fieldErrors.email)}
                    />
                  </div>
                  {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <label className="min-w-0 text-sm font-semibold text-[color-mix(in_srgb,var(--text-primary)_88%,#e2e8f0_12%)]">Password</label>
                    <Link to="/forgot-password" className="shrink-0 whitespace-nowrap text-xs text-[color-mix(in_srgb,var(--text-secondary)_80%,var(--accent-primary)_20%)] no-underline transition-colors duration-200 hover:text-[var(--accent-primary)]">Forgot password?</Link>
                  </div>
                  <div className={`flex min-h-[2.95rem] items-center rounded-[10px] border bg-[color-mix(in_srgb,var(--bg-primary)_92%,#111827_8%)] transition-[border-color,box-shadow,background-color] duration-300 ease-out ${fieldErrors.password ? 'border-red-500 shadow-[0_0_0_1px_color-mix(in_srgb,#ef4444_35%,transparent)]' : 'border-[color-mix(in_srgb,var(--border-default)_82%,#334155_18%)] focus-within:border-[color-mix(in_srgb,var(--accent-primary)_76%,#1e40af_24%)] focus-within:bg-[color-mix(in_srgb,var(--bg-primary)_80%,var(--accent-primary)_20%)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)]'}`}>
                    <Lock size={16} className="ml-3 shrink-0 text-[var(--text-tertiary)]" />
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
                      className="min-w-0 flex-1 border-none bg-transparent px-3 py-3 text-base text-[var(--text-primary)] outline-none focus:outline-none focus-visible:outline-none placeholder:text-[var(--text-tertiary)] [&::-ms-reveal]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
                      placeholder="Enter password"
                      required
                      autoComplete="off"
                      aria-invalid={Boolean(fieldErrors.password)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="mr-1.5 shrink-0 rounded-lg p-2 text-[var(--text-tertiary)] transition-colors duration-200 hover:text-[var(--text-secondary)]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
                </div>

                <div className="mt-[-2px] inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    aria-label="Remember me"
                    className="h-[17px] w-[17px] translate-y-[-1px] accent-[var(--accent-primary)]"
                  />
                  <span>Remember me</span>
                </div>

                <div className="rounded-[10px] border border-[color-mix(in_srgb,var(--border-default)_78%,#334155_22%)] bg-[color-mix(in_srgb,var(--bg-primary)_90%,#0f172a_10%)] p-3.5 transition-colors duration-300 hover:border-[color-mix(in_srgb,var(--accent-primary)_40%,var(--border-default))]">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.04em] text-[color-mix(in_srgb,var(--text-secondary)_75%,#94a3b8_25%)]">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">OSM Proximity Monitor</span>
                      </p>
                      <span className="max-w-full shrink-0 rounded-full bg-[color-mix(in_srgb,var(--bg-primary)_80%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                        Session Pin
                      </span>
                    </div>

                    <p
                      key={locationStatus}
                      className="animate-fadeIn text-xs leading-5 text-[var(--text-secondary)] line-clamp-2"
                    >
                      {locationStatus}
                    </p>

                    <div className="rounded-md border border-[color-mix(in_srgb,var(--border-default)_70%,#334155_30%)] bg-[color-mix(in_srgb,var(--bg-primary)_78%,#0f172a_22%)] px-2.5 py-2 transition-colors duration-300">
                      <p
                        key={locationName}
                        className="animate-fade-in-up text-[13px] font-semibold leading-5 text-[var(--text-primary)] break-words"
                      >
                        {isResolvingLocation ? 'Resolving place name...' : locationName}
                      </p>

                      <div
                        className={`grid transition-all duration-300 ease-out ${showCoordinates ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 mt-0'}`}
                      >
                        <p className="overflow-hidden text-[11px] text-[var(--text-tertiary)]">
                          Lat: {location.latitude.toFixed(5)} | Lng: {location.longitude.toFixed(5)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-0.5 min-[420px]:grid-cols-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={locating}
                        className="w-full rounded-md border border-[color-mix(in_srgb,var(--border-default)_78%,#334155_22%)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--accent-primary)_44%,var(--border-default))] hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_72%,transparent)] disabled:opacity-60"
                      >
                        {locating ? 'Locating...' : 'Refresh'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsLocationPanelOpen(true)}
                        className="w-full rounded-md border border-[color-mix(in_srgb,var(--border-default)_78%,#334155_22%)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--accent-primary)_44%,var(--border-default))] hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_72%,transparent)]"
                      >
                        Adjust Map
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCoordinates((prev) => !prev)}
                        className="w-full rounded-md border border-[color-mix(in_srgb,var(--border-default)_78%,#334155_22%)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--accent-primary)_44%,var(--border-default))] hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_72%,transparent)]"
                      >
                        {showCoordinates ? 'Hide Coords' : 'Show Coords'}
                      </button>
                    </div>
                  </div>
                </div>

                <PublicSweepButton type="submit" disabled={loading} className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[color-mix(in_srgb,var(--accent-primary)_86%,#1e40af_14%)] px-4 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--accent-secondary)_82%,#1e40af_18%)] disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> : <>
                    Secure Login
                    <ArrowRight size={16} />
                  </>}
                </PublicSweepButton>

                <p className="text-center text-xs text-[var(--text-tertiary)]">Authorized users only. Activity may be monitored.</p>
              </form>

              <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
                Don't have an account?{' '}
                <Link to="/contact" className="font-semibold text-[var(--accent-primary)] no-underline transition-colors duration-200 hover:text-[color-mix(in_srgb,var(--accent-primary)_78%,var(--accent-secondary))]">Contact Administrator</Link>
              </p>
            </div>

            <AnimatedModal
              open={isLocationPanelOpen}
              onRequestClose={() => setIsLocationPanelOpen(false)}
              className="w-full max-w-[560px] rounded-xl border border-[color-mix(in_srgb,var(--border-default)_80%,#334155_20%)] bg-[var(--bg-secondary)] p-3.5 shadow-2xl sm:p-4"
              backdropClassName="bg-black/45"
              durationMs={220}
            >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">Adjust Login Location</h3>
                      <p className="text-xs text-[var(--text-secondary)]">Click the map to place the location pin for proximity monitoring.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLocationPanelOpen(false)}
                      className="rounded-md p-1.5 text-[var(--text-tertiary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
                      aria-label="Close map dialog"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--border-default)_72%,#334155_28%)]">
                    <Suspense
                      fallback={
                        <div className="flex h-[260px] items-center justify-center text-sm font-medium text-[var(--text-secondary)]">
                          Loading map...
                        </div>
                      }
                    >
                      <LocationPickerMap
                        location={location}
                        onPick={(coords) => {
                          setLocation(coords)
                          setIsManualLocation(true)
                          setHasCapturedLocation(true)
                          setLocationStatus('Location pin updated manually. This location will be used for login audit.')
                        }}
                      />
                    </Suspense>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] text-[var(--text-tertiary)]">
                        {isResolvingLocation ? 'Resolving place name...' : locationName}
                      </p>
                      {showCoordinates && (
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                          Lat: {location.latitude.toFixed(6)} | Lng: {location.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLocationPanelOpen(false)}
                      className="rounded-md bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--accent-secondary)_78%,var(--accent-primary))]"
                    >
                      Done
                    </button>
                  </div>
            </AnimatedModal>
          </section>
        </div>
      </div>
    </div>
  )
}
