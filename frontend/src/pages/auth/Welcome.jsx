import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2, Shield, Users, CreditCard, Bell, ArrowRight, CheckCircle, ChevronDown, Car, Phone, MessageSquare, Key, Menu, X, Twitter, Linkedin, Monitor, Sparkles, Mail, Link2, Youtube } from 'lucide-react'
import { useTheme } from '../../context'
import { enquiryApi } from '../../../../api'
import clsx from 'clsx'
import { motion } from 'framer-motion'

/* Scroll-reveal hook */
function useScrollReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

export default function Welcome() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, setTheme } = useTheme()
  const [isLoaded, setIsLoaded] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [enrollName, setEnrollName] = useState('')
  const [enrollPhone, setEnrollPhone] = useState('')
  const [enrollReason, setEnrollReason] = useState('')
  const [enrollError, setEnrollError] = useState('')
  const [enrollSubmitting, setEnrollSubmitting] = useState(false)
  const [enrollSubmitted, setEnrollSubmitted] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!location.hash) return
    const targetId = location.hash.replace('#', '')
    const timer = setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => clearTimeout(timer)
  }, [location.hash])

  const features = [
    { icon: Building2, title: 'Society Management', desc: 'Complete admin control for housing societies with real-time insights', color: '#2f81f7' },
    { icon: CreditCard, title: 'Bills & Payments', desc: 'Automated maintenance bills with online payment integration', color: '#3fb950' },
    { icon: Users, title: 'Tenant Portal', desc: 'Self-service portal for tenants to raise requests and pay bills', color: '#d2a8ff' },
    { icon: Car, title: 'Vehicle Registry', desc: 'Manage parking slots and vehicle registrations digitally', color: '#f0883e' },
    { icon: MessageSquare, title: 'Complaints & Tickets', desc: 'Streamlined issue resolution with status tracking', color: '#f85149' },
    { icon: Bell, title: 'Notices & Alerts', desc: 'Broadcast important updates to all residents instantly', color: '#d29922' },
    { icon: Shield, title: 'Security & Access', desc: 'Role-based permissions for admins, committees, and residents', color: '#58a6ff' },
    { icon: Phone, title: '24/7 Support', desc: 'Round-the-clock support for your society management needs', color: '#56d364' },
  ]

  const stats = [
    { value: '500+', label: 'Societies' },
    { value: '50K+', label: 'Residents' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' },
  ]

  const footerSocialLinks = [
    { icon: Twitter, href: 'https://x.com', label: 'X' },
    { icon: Youtube, href: 'https://www.youtube.com', label: 'YouTube' },
    { icon: Linkedin, href: 'https://www.linkedin.com', label: 'LinkedIn' },
    { icon: Link2, href: '#', label: 'Website' },
  ]

  // Scroll-reveal refs
  const [featRef, featVisible] = useScrollReveal()
  const [statsRef, statsVisible] = useScrollReveal()
  const [ctaRef, ctaVisible] = useScrollReveal()

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  const handleEnrollSubmit = async (e) => {
    e.preventDefault()
    const errors = []
    if (enrollName.trim().length < 2) errors.push('a valid name')
    const digits = enrollPhone.replace(/\D/g, '')
    if (digits.length !== 10) errors.push('a 10-digit phone number')
    if (!enrollReason) errors.push('a reason')

    if (errors.length) {
      setEnrollError('Please enter ' + errors.join(', ') + '.')
      return
    }

    setEnrollError('')
    setEnrollSubmitting(true)
    try {
      await enquiryApi.submit({
        name: enrollName.trim(),
        phone: digits,
        reason: enrollReason,
      })
      setEnrollSubmitted(true)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong. Please try again.'
      setEnrollError(msg)
    } finally {
      setEnrollSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-x-hidden">
      {/* Nav */}
      <nav className={clsx(
        'fixed top-0 left-0 right-0 z-[100] px-4 pt-5 transition-all duration-300',
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      )}>
        <div className="mx-auto w-full max-w-[1240px] rounded-full bg-white/95 shadow-[0_16px_38px_rgba(2,6,23,0.14)] ring-1 ring-slate-200 backdrop-blur-sm px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <button className="flex items-center gap-2.5 bg-transparent border-none text-inherit p-0 cursor-pointer" onClick={() => scrollTo('hero')}>
              <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-[0_8px_18px_rgba(37,99,235,0.35)]">
                <Building2 size={17} />
              </div>
              <span className="text-[1.75rem] leading-none font-extrabold tracking-[-0.02em] text-slate-900">SocietyHub</span>
            </button>

            <div className="hidden lg:flex items-center gap-1">
              <button onClick={() => navigate('/about')} className="px-3 py-1.5 text-sm font-semibold text-slate-700 rounded-md hover:bg-slate-100 transition-colors">About Us</button>
              <button onClick={() => scrollTo('features')} className="px-3 py-1.5 text-sm font-semibold text-slate-700 rounded-md hover:bg-slate-100 transition-colors">Features</button>
              <button onClick={() => navigate('/pricing')} className="px-3 py-1.5 text-sm font-semibold text-slate-700 rounded-md hover:bg-slate-100 transition-colors">Pricing</button>
              <button onClick={() => navigate('/contact')} className="px-3 py-1.5 text-sm font-semibold text-slate-700 rounded-md hover:bg-slate-100 transition-colors">Contact</button>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <a className="hidden xl:inline-flex px-2 py-1 text-sm font-semibold text-slate-700 no-underline" href="tel:+919119300000" aria-label="Call SocietyHub">+91 91193 00000</a>
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                aria-label="Toggle dark mode"
              >
                <Monitor size={16} />
              </button>
              <button onClick={() => navigate('/login')} className="h-9 px-4 text-[13px] font-semibold rounded-lg border border-slate-300 text-slate-700 bg-transparent hover:bg-slate-50 transition-colors">Society Login</button>
              <button onClick={() => navigate('/login')} className="h-9 px-4 text-[13px] font-semibold rounded-lg border border-slate-300 text-slate-700 bg-transparent hover:bg-slate-50 transition-colors">Admin Portal</button>
              <button onClick={() => scrollTo('enroll')} className="h-9 px-4 text-[13px] font-semibold rounded-full border-none text-white bg-blue-600 inline-flex items-center gap-1.5 shadow-[0_10px_22px_rgba(37,99,235,0.35)] hover:bg-blue-500 transition-colors">
                Enroll your society
                <ArrowRight size={13} />
              </button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-300 text-slate-700 bg-white">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="mt-2 mx-auto w-full max-w-[1240px] rounded-2xl bg-white/95 shadow-[0_16px_38px_rgba(2,6,23,0.14)] ring-1 ring-slate-200 p-3 flex flex-col gap-2">
            {[
              { label: 'About Us', action: () => { navigate('/about'); setMobileMenuOpen(false) } },
              { label: 'Features', action: () => { scrollTo('features'); setMobileMenuOpen(false) } },
              { label: 'Pricing', action: () => { navigate('/pricing'); setMobileMenuOpen(false) } },
              { label: 'Contact', action: () => { navigate('/contact'); setMobileMenuOpen(false) } },
            ].map((item, i) => (
              <button key={item.label} onClick={item.action} className="text-sm font-semibold text-slate-700 bg-transparent border-none text-left py-2.5 px-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-100">
                {item.label}
              </button>
            ))}

            <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} className="mt-1 py-2.5 px-4 text-sm font-semibold text-slate-700 bg-transparent border border-slate-300 rounded-lg cursor-pointer">
              Society Login
            </button>
            <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} className="py-2.5 px-4 text-sm font-semibold text-slate-700 bg-transparent border border-slate-300 rounded-lg cursor-pointer">
              Admin Portal
            </button>
            <button onClick={() => { scrollTo('enroll'); setMobileMenuOpen(false) }} className="py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 border-none rounded-full cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-[0_10px_22px_rgba(37,99,235,0.35)]">
              Enroll your society
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="hero" className="relative min-h-screen pt-36 pb-20 px-6 overflow-hidden bg-[#0B0F19]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-36 -left-24 h-[380px] w-[380px] rounded-full bg-[#2563eb]/24 blur-3xl animate-mesh-slow" />
          <div className="absolute top-[20%] -right-20 h-[360px] w-[360px] rounded-full bg-[#4f46e5]/22 blur-3xl animate-mesh-slow [animation-delay:200ms]" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(148,163,184,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.24) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-[1100px] mx-auto text-center">
          <div className={clsx(
            'inline-flex items-center gap-2.5 py-2 px-4 rounded-full border border-slate-700/70 bg-slate-800/50 backdrop-blur-sm text-xs sm:text-sm font-semibold text-slate-300 transition-all',
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
            </span>
            Trusted by housing communities across India
          </div>

          <h1 className={clsx(
            'mt-7 text-[clamp(2.6rem,7.2vw,4.5rem)] font-extrabold leading-[1.02] tracking-tight text-white',
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )}>
            Visitor, Society and Accounting
            <br />
            <span className="text-blue-500" style={{ textShadow: '0 0 24px rgba(59,130,246,0.45)' }}>Management System</span>
          </h1>

          <p className={clsx(
            'mt-6 mx-auto max-w-2xl text-[1.05rem] leading-8 text-slate-400',
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )}>
            A complete platform to manage residents, visitor entries, billing, complaints, notices, and daily operations — built for modern housing societies.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
            className="mt-10"
          >
            {enrollSubmitted ? (
              <div className="mx-auto max-w-[520px] grid gap-3 p-8 rounded-t-[20px] rounded-b-xl text-center border border-slate-700/70 bg-[#111827]/85 backdrop-blur-md shadow-[0_22px_55px_rgba(15,23,42,0.45)]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                  <CheckCircle size={28} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-white">Enquiry Received</p>
                  <p className="mt-1 text-sm text-slate-300">We'll reach out to <span className="font-bold text-white">+91 {enrollPhone}</span> within 24 hours.</p>
                </div>
                <button
                  onClick={() => { setEnrollSubmitted(false); setEnrollName(''); setEnrollPhone(''); setEnrollReason('') }}
                  className="mx-auto text-xs font-semibold text-[var(--accent-primary)] bg-transparent border-none cursor-pointer underline underline-offset-2 hover:opacity-75"
                >
                  Submit another enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnrollSubmit} id="enroll" className="mx-auto max-w-[520px] p-10 rounded-t-[20px] rounded-b-xl border border-slate-700/70 bg-[#111827]/86 backdrop-blur-md shadow-[0_26px_65px_rgba(15,23,42,0.45)] text-left">
                <div className="mb-5">
                  <div className="inline-flex items-center gap-2 text-white font-bold text-base">
                    <Building2 size={16} className="text-blue-400" />
                    Enroll Your Society
                  </div>
                  <p className="mt-1 text-sm text-slate-400">Fill in your details — we'll reach out within 24 hours</p>
                </div>
                <div className="grid gap-5">
                  <label className="relative block">
                    <input
                      value={enrollName}
                      onChange={(e) => setEnrollName(e.target.value)}
                      placeholder=" "
                      autoComplete="name"
                      className="peer w-full h-[50px] px-4 pt-5 rounded-[10px] border border-slate-700 bg-[#0f172a] text-white text-sm font-semibold transition-all duration-200 hover:border-[#60a5fa] focus:outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-[#60a5fa]/25"
                    />
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 transition-all duration-200 peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-[#60a5fa] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[11px]">
                      Name
                    </span>
                  </label>

                  <div className="grid grid-cols-[88px_1fr] gap-2.5">
                    <div className="h-[50px] rounded-[10px] border border-slate-700 bg-[#0f172a] text-white text-sm font-bold flex items-center justify-center">
                      +91
                    </div>
                    <label className="relative block">
                      <input
                        value={enrollPhone}
                        onChange={(e) => setEnrollPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder=" "
                        type="tel"
                        inputMode="tel"
                        maxLength={10}
                        autoComplete="tel"
                        className="peer w-full h-[50px] px-4 pt-5 rounded-[10px] border border-slate-700 bg-[#0f172a] text-white text-sm font-semibold transition-all duration-200 hover:border-[#60a5fa] focus:outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-[#60a5fa]/25"
                      />
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 transition-all duration-200 peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-[#60a5fa] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[11px]">
                        Phone number
                      </span>
                    </label>
                  </div>

                  <div className="relative">
                    <select
                      value={enrollReason}
                      onChange={(e) => setEnrollReason(e.target.value)}
                      className="w-full h-[50px] px-4 rounded-[10px] border border-slate-700 bg-[#0f172a] text-white text-sm font-semibold appearance-none transition-all duration-200 hover:border-[#60a5fa] focus:outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-[#60a5fa]/25"
                    >
                      <option value="">Select Reason</option>
                      <option value="DEMO">Request a demo</option>
                      <option value="ONBOARDING">New society onboarding</option>
                      <option value="PRICING">Pricing enquiry</option>
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
                  </div>

                  <button
                    type="submit"
                    disabled={enrollSubmitting}
                    className="group relative h-[52px] w-full overflow-hidden rounded-xl border-none text-white text-base font-bold tracking-[0.01em] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#60a5fa)', boxShadow: '0 16px 36px rgba(37,99,235,0.36)' }}
                  >
                    <span className="relative z-10 inline-flex items-center justify-center gap-2">
                      {enrollSubmitting ? 'Submitting...' : 'Enroll your society'}
                      {!enrollSubmitting && <ArrowRight size={16} />}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[160%] skew-x-[-24deg] bg-gradient-to-r from-white/0 via-white/55 to-white/0 transition-transform duration-700 group-hover:translate-x-[380%]" />
                  </button>
                </div>

                {enrollError && <p className="mt-3 text-sm font-semibold text-center text-red-400">{enrollError}</p>}
              </form>
            )}
          </motion.div>

          <div className={clsx(
            'welcome-anim mt-7 flex flex-wrap justify-center gap-3 transition-all duration-500',
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )} style={{ transitionDelay: '0.4s' }}>
            <button onClick={() => navigate('/login')} className="inline-flex items-center gap-2 py-3 px-6 text-[0.9375rem] font-semibold text-slate-100 bg-slate-900/45 border border-slate-700 rounded-[var(--radius-md)] cursor-pointer transition-all hover:bg-slate-800/70 hover:border-slate-500">
              Society Login
              <Key size={16} />
            </button>
            <button onClick={() => scrollTo('features')} className="inline-flex items-center gap-2 py-3 px-6 text-[0.9375rem] font-semibold text-slate-100 bg-slate-900/45 border border-slate-700 rounded-[var(--radius-md)] cursor-pointer transition-all hover:bg-slate-800/70 hover:border-slate-500">
              Explore Features
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6" ref={featRef} style={{ background: 'color-mix(in srgb, var(--accent-primary) 3%, var(--bg-primary))' }}>
        <div className="max-w-[1100px] mx-auto">
          <div className={clsx(
            'text-center mb-14 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
            featVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}>
            <span className="inline-flex items-center gap-[0.375rem] py-[0.3rem] px-[0.875rem] text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-primary)] rounded-full mb-4 border" style={{ background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' }}><Sparkles size={12} /> Features</span>
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold tracking-[-0.025em] text-[var(--text-primary)] mb-3">Everything Your Society Needs</h2>
            <p className="text-base text-[var(--text-secondary)] max-w-[500px] mx-auto">A complete suite of tools designed for housing society management</p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className={clsx(
                  'p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] transition-all duration-300 relative group light:shadow-[var(--shadow-xs)]',
                  'cursor-default',
                  'hover:-translate-y-1.5 hover:shadow-[0_12px_32px_-4px_color-mix(in_srgb,var(--border-default)_60%,transparent)]',
                  featVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                )}
                style={{
                  transitionDelay: featVisible ? `${i * 80}ms` : '0ms',
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                  '--card-color': f.color,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `color-mix(in srgb, ${f.color} 55%, transparent)`
                  e.currentTarget.style.boxShadow = `0 12px 32px -4px color-mix(in srgb, ${f.color} 20%, transparent), 0 0 0 1px color-mix(in srgb, ${f.color} 30%, transparent)`
                  e.currentTarget.style.background = `color-mix(in srgb, ${f.color} 4%, var(--bg-card))`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.background = ''
                }}
              >
                <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-[1.15]" style={{ background: `color-mix(in srgb, ${f.color} 12%, transparent)`, color: f.color }}>
                  <f.icon size={22} />
                </div>
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-2 transition-colors duration-200 group-hover:text-[var(--accent-primary)]">{f.title}</h3>
                <p className="text-[0.8125rem] leading-[1.6] text-[var(--text-secondary)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 px-6" ref={statsRef}>
        <div className="max-w-[1100px] mx-auto">
          <div className={clsx(
            'bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-10 text-center relative overflow-hidden light:shadow-[var(--shadow-xs)] transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] after:content-[\'\'] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-[40%] after:h-px after:bg-gradient-to-r after:from-transparent after:via-[var(--accent-primary)] after:to-transparent',
            statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-[0.375rem]">Platform Statistics</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-10">Real-time numbers that speak for themselves</p>
            <div className="grid grid-cols-4 max-sm:grid-cols-2 gap-6">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex flex-col items-center gap-1 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
                    statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  )}
                  style={{ transitionDelay: statsVisible ? `${200 + i * 120}ms` : '0ms' }}
                >
                  <span className="text-4xl font-extrabold tracking-[-0.02em] tabular-nums bg-gradient-to-br from-[var(--accent-primary)] to-[#58a6ff] bg-clip-text text-transparent">{s.value}</span>
                  <span className="text-[0.8125rem] text-[var(--text-secondary)] font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[var(--bg-primary)]" ref={ctaRef}>
        <div className="max-w-[1100px] mx-auto">
          <div className={clsx(
            'bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl py-14 px-8 text-center relative overflow-hidden light:shadow-[var(--shadow-xs)] transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] before:content-[\'\'] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-[60%] before:h-px before:bg-gradient-to-r before:from-transparent before:via-[var(--accent-primary)] before:to-transparent',
            ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}>
            <h2 className="text-[clamp(1.5rem,3.5vw,2rem)] font-extrabold text-[var(--text-primary)] mb-3">Ready to Transform Your Society?</h2>
            <p className="text-base text-[var(--text-secondary)] max-w-[460px] mx-auto mb-8">Join thousands of societies already streamlining their operations</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate('/login')} className="inline-flex items-center gap-2 py-[0.875rem] px-8 text-base font-semibold text-white bg-[var(--accent-primary)] border-none rounded-[var(--radius-md)] cursor-pointer transition-all hover:bg-[var(--accent-hover)] hover:-translate-y-[2px] active:translate-y-0">
                Start Now — It's Free
                <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/contact')} className="inline-flex items-center gap-2 py-3 px-6 text-[0.9375rem] font-semibold text-[var(--text-primary)] bg-transparent border border-[var(--border-default)] rounded-[var(--radius-md)] cursor-pointer transition-all hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-muted)]">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="pt-[3.25rem] px-6 pb-4" style={{ borderTop: '1px solid color-mix(in srgb, var(--border-strong) 70%, transparent)', background: 'color-mix(in srgb, var(--bg-primary) 72%, var(--bg-overlay) 28%)' }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-[1.35fr_1fr_1.1fr_0.9fr_1fr] max-md:grid-cols-2 max-[480px]:grid-cols-1 gap-8 items-start mb-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent-primary)] flex items-center justify-center text-white">
                  <Building2 size={16} />
                </div>
                <div className="flex flex-col gap-[0.1rem]">
                  <span className="text-base font-extrabold text-[var(--text-secondary)]">SocietyHub</span>
                  <span className="text-[0.78rem] text-[var(--text-muted)] font-semibold">By SocietyHub Technologies</span>
                </div>
              </div>
              <p className="text-[0.8125rem] leading-[1.7] text-[var(--text-muted)] max-w-[280px]">
                SocietyHub is aimed at making life in your residential society easy and secure.
                Manage visitor access, domestic help and services, and much more.
              </p>
            </div>

            {[
              {
                title: 'Company',
                links: [
                  { label: 'About Us', action: () => navigate('/about') },
                  { label: 'Privacy Policy', action: () => navigate('/privacy') },
                  { label: 'Terms & Conditions', action: () => navigate('/terms') },
                  { label: 'Blog', action: () => navigate('/blog') },
                  { label: 'Sitemap', action: () => navigate('/help') },
                ],
              },
              {
                title: 'Solution',
                links: [
                  { label: 'Society Accounting System', action: () => scrollTo('features') },
                  { label: 'Society Management System', action: () => scrollTo('features') },
                  { label: 'Apartment Management Software', action: () => scrollTo('features') },
                  { label: 'Visitor Management System', action: () => scrollTo('features') },
                  { label: 'Parking Management System', action: () => scrollTo('features') },
                  { label: 'Housing Society', action: () => scrollTo('features') },
                ],
              },
            ].map((g, i) => (
              <div key={i} className="flex flex-col gap-3 min-w-0">
                <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-[0.05em]">{g.title}</h4>
                <ul className="list-none m-0 p-0 flex flex-col gap-[0.375rem]">
                  {g.links.map((l, j) => (
                    <li key={j}>
                      <button onClick={l.action} className="text-[0.8125rem] text-[var(--text-muted)] bg-transparent border-none cursor-pointer p-0 text-left transition-all leading-[1.55] no-underline hover:text-[var(--text-secondary)] hover:translate-x-px">{l.label}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="flex flex-col gap-3 min-w-0">
              <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-[0.05em]">Contact Us</h4>
              <ul className="list-none m-0 p-0 flex flex-col gap-[0.6rem]">
                <li>
                  <a href="mailto:assist@societyhub.com" className="inline-flex items-center gap-[0.4rem] text-[0.8125rem] text-[var(--text-muted)] no-underline transition-colors leading-[1.55] hover:text-[var(--text-secondary)]">
                    <Mail size={14} />
                    assist@societyhub.com
                  </a>
                </li>
                <li>
                  <a href="tel:+919119300000" className="inline-flex items-center gap-[0.4rem] text-[0.8125rem] text-[var(--text-muted)] no-underline transition-colors leading-[1.55] hover:text-[var(--text-secondary)]">
                    <Phone size={14} />
                    +91 91193 00000
                  </a>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 min-w-0">
              <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-[0.05em]">Get the Mobile App</h4>
              <div className="flex flex-col gap-[0.55rem]">
                <button type="button" className="inline-flex items-center justify-center w-full min-h-[38px] rounded-[var(--radius-sm)] text-[var(--text-secondary)] text-[0.78rem] font-bold tracking-[0.01em] cursor-pointer" style={{ border: '1px solid color-mix(in srgb, var(--border-default) 75%, transparent)', background: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)' }}>Get it on Google Play</button>
                <button type="button" className="inline-flex items-center justify-center w-full min-h-[38px] rounded-[var(--radius-sm)] text-[var(--text-secondary)] text-[0.78rem] font-bold tracking-[0.01em] cursor-pointer" style={{ border: '1px solid color-mix(in srgb, var(--border-default) 75%, transparent)', background: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)' }}>Download on the App Store</button>
              </div>
              <div className="flex gap-2">
                {footerSocialLinks.map((item, i) => (
                  <a key={i} href={item.href} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" style={{ background: 'color-mix(in srgb, var(--bg-tertiary) 86%, transparent)', border: '1px solid color-mix(in srgb, var(--border-default) 80%, transparent)' }} aria-label={`Open ${item.label} in new tab`}>
                    <item.icon size={14} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-[1.35rem] text-left" style={{ borderTop: '1px solid color-mix(in srgb, var(--border-strong) 60%, transparent)' }}>
            <p className="text-[0.79rem] text-[var(--text-muted)]">2017 – 2026 SocietyHub Technologies Pvt. Ltd. – All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
