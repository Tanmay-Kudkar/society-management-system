import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2, Shield, Users, CreditCard, Bell, ArrowRight, CheckCircle, ChevronDown, Car, Phone, MessageSquare, Key, Sun, Moon, Menu, X, Twitter, Linkedin, Monitor, Sparkles, Mail, Link2, Youtube } from 'lucide-react'
import { useTheme } from '../../context'
import { enquiryApi } from '../../../../api'
import clsx from 'clsx'

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
  const { isDark, theme, setTheme, resetToSystemTheme, isManual } = useTheme()
  const [isLoaded, setIsLoaded] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const themeMenuRef = useRef(null)

  const [enrollName, setEnrollName] = useState('')
  const [enrollPhone, setEnrollPhone] = useState('')
  const [enrollReason, setEnrollReason] = useState('')
  const [enrollError, setEnrollError] = useState('')
  const [enrollSubmitting, setEnrollSubmitting] = useState(false)
  const [enrollSubmitted, setEnrollSubmitted] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) setThemeMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setIsLoaded(true)
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
        'welcome-anim fixed top-0 left-0 right-0 z-[100] transition-all duration-300',
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      )}>
        {/* Floating pill bar */}
        <div className="mx-auto mt-3 max-w-[1180px] px-4">
          <div
            className={clsx(
              'flex items-center justify-between gap-4 rounded-2xl px-4 py-2.5 transition-all duration-300',
              scrolled
                ? 'shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.08)]'
                : 'shadow-[0_4px_20px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.07)]'
            )}
            style={{
              background: mobileMenuOpen
                ? 'rgba(3,7,18,0.98)'
                : 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
          >
            {/* ── LEFT: Logo ── */}
            <button
              className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none text-inherit p-0 shrink-0 group"
              onClick={() => scrollTo('hero')}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all duration-300 group-hover:scale-[1.06] group-hover:-rotate-3"
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #3b82f6 100%)',
                  boxShadow: '0 2px 12px rgba(37,99,235,0.45)',
                }}
              >
                <Building2 size={17} />
              </div>
              <span className="text-[1.125rem] font-black tracking-[-0.03em]" style={{ color: '#f1f5f9' }}>
                SocietyHub
              </span>
            </button>

            {/* ── CENTER: Nav links ── */}
            <div className="hidden md:flex items-center gap-0.5">
              {[
                { label: 'About Us',  action: () => navigate('/about')       },
                { label: 'Features',  action: () => scrollTo('features')     },
                { label: 'Pricing',   action: () => navigate('/pricing')     },
                { label: 'Contact',   action: () => navigate('/contact')     },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="relative text-[0.8125rem] font-semibold bg-transparent border-none cursor-pointer py-[6px] px-3.5 rounded-xl transition-all duration-150"
                  style={{ color: '#64748b' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent' }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* ── RIGHT: Actions ── */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Phone — visible ≥1024px */}
              <a
                href="tel:+919119300000"
                className="hidden lg:inline-flex items-center gap-1.5 text-[0.8rem] font-semibold no-underline transition-colors duration-150 px-2 py-1.5 rounded-xl"
                style={{ color: '#475569' }}
                aria-label="Call SocietyHub"
                onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent' }}
              >
                <Phone size={13} />
                +91 91193 00000
              </a>

              {/* Divider */}
              <div className="hidden lg:block w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

              {/* Theme picker */}
              <div className="relative" ref={themeMenuRef}>
                <button
                  onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 border"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.09)', color: '#475569' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#94a3b8' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#475569' }}
                  aria-label="Theme"
                >
                  {!isManual ? <Monitor size={14} /> : isDark ? <Moon size={14} /> : <Sun size={14} />}
                </button>
                {themeMenuOpen && (
                  <div
                    className="absolute top-[calc(100%+8px)] right-0 rounded-xl p-1.5 min-w-[138px] z-50 origin-top-right"
                    style={{
                      background: 'rgba(10,15,28,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
                      backdropFilter: 'blur(16px)',
                      animation: 'welcomeDropIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {[
                      { label: 'System', icon: Monitor, active: !isManual,                     action: () => { resetToSystemTheme(); setThemeMenuOpen(false) } },
                      { label: 'Light',  icon: Sun,     active: isManual && theme === 'light', action: () => { setTheme('light'); setThemeMenuOpen(false) }    },
                      { label: 'Dark',   icon: Moon,    active: isManual && theme === 'dark',  action: () => { setTheme('dark'); setThemeMenuOpen(false) }     },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={opt.action}
                        className="flex items-center gap-2 w-full py-[7px] px-2.5 text-[0.8rem] bg-transparent border-none rounded-lg cursor-pointer transition-all duration-100"
                        style={opt.active
                          ? { color: '#60a5fa', background: 'rgba(59,130,246,0.1)' }
                          : { color: '#64748b' }}
                        onMouseEnter={e => { if (!opt.active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#e2e8f0' } }}
                        onMouseLeave={e => { if (!opt.active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' } }}
                      >
                        <opt.icon size={13} />
                        <span>{opt.label}</span>
                        {opt.active && <CheckCircle size={13} className="ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-150 border"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.09)', color: '#64748b' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#64748b' }}
              >
                {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
              </button>

              {/* Divider before buttons */}
              <div className="hidden md:block w-px h-5 mx-0.5" style={{ background: 'rgba(255,255,255,0.1)' }} />

              {/* Society Login */}
              <button
                onClick={() => navigate('/login')}
                className="hidden md:flex items-center gap-1.5 py-[7px] px-3.5 text-[0.8125rem] font-semibold rounded-xl cursor-pointer transition-all duration-150 border"
                style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8' }}
              >
                Society Login
              </button>

              {/* Admin Portal */}
              <button
                onClick={() => navigate('/login')}
                className="hidden md:flex items-center gap-1.5 py-[7px] px-3.5 text-[0.8125rem] font-semibold rounded-xl cursor-pointer transition-all duration-150 border"
                style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8' }}
              >
                Admin Portal
              </button>

              {/* Primary CTA */}
              <button
                onClick={() => scrollTo('enroll')}
                className="hidden md:flex items-center gap-1.5 py-[7px] px-4 text-[0.8125rem] font-bold text-white border-none rounded-xl cursor-pointer transition-all duration-150"
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                  boxShadow: '0 2px 14px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(37,99,235,0.6), inset 0 1px 0 rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 14px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'none' }}
              >
                Enroll your society
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div
              className="mt-1 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(3,7,18,0.97)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
                backdropFilter: 'blur(20px)',
                animation: 'welcomeMobileSlide 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Nav links */}
              <div className="p-3 flex flex-col gap-0.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { label: 'About Us', action: () => { navigate('/about'); setMobileMenuOpen(false) } },
                  { label: 'Features', action: () => { scrollTo('features'); setMobileMenuOpen(false) } },
                  { label: 'Pricing',  action: () => { navigate('/pricing'); setMobileMenuOpen(false) } },
                  { label: 'Contact',  action: () => { navigate('/contact'); setMobileMenuOpen(false) } },
                ].map((item, i) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="text-[0.875rem] font-medium text-left py-2.5 px-3 rounded-xl bg-transparent border-none cursor-pointer transition-all duration-120"
                    style={{ color: '#64748b', opacity: 0, animation: `welcomeMenuItemIn 0.28s cubic-bezier(0.16,1,0.3,1) ${0.04 * (i + 1)}s forwards` }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {/* Action buttons */}
              <div className="p-3 flex flex-col gap-2" style={{ opacity: 0, animation: 'welcomeMenuItemIn 0.3s cubic-bezier(0.16,1,0.3,1) 0.22s forwards' }}>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
                    className="py-2.5 px-4 text-[0.8375rem] font-semibold rounded-xl border cursor-pointer transition-all duration-150"
                    style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.12)', color: '#94a3b8' }}
                  >
                    Society Login
                  </button>
                  <button
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
                    className="py-2.5 px-4 text-[0.8375rem] font-semibold rounded-xl border cursor-pointer transition-all duration-150"
                    style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.12)', color: '#94a3b8' }}
                  >
                    Admin Portal
                  </button>
                </div>
                <button
                  onClick={() => { scrollTo('enroll'); setMobileMenuOpen(false) }}
                  className="w-full py-2.5 px-4 text-[0.875rem] font-bold text-white border-none rounded-xl cursor-pointer transition-all duration-150 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                    boxShadow: '0 4px 20px rgba(37,99,235,0.45)',
                  }}
                >
                  Enroll your society <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center pt-28 pb-24 px-6 overflow-hidden" style={{ background: '#030712' }}>

        {/* ── Background layer ── */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
          {/* Dark grid */}
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.046) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.046) 1px, transparent 1px)', backgroundSize: '56px 56px', backgroundPosition: 'center center' }} />
          {/* Central spotlight glow */}
          <div className="absolute -top-[8%] left-1/2 -translate-x-1/2 w-[1100px] h-[750px]" style={{ background: 'radial-gradient(ellipse 68% 58% at 50% 0%, rgba(37,99,235,0.28) 0%, rgba(59,130,246,0.1) 42%, transparent 72%)' }} />
          {/* Top horizon line */}
          <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.6) 50%, transparent 100%)' }} />
          {/* Bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-44" style={{ background: 'linear-gradient(to top, rgba(3,7,18,0.9), transparent)' }} />
          {/* Soft edge glows */}
          <div className="absolute -left-48 top-[28%] w-96 h-[580px] rounded-full blur-3xl" style={{ background: 'rgba(37,99,235,0.075)' }} />
          <div className="absolute -right-48 top-[28%] w-96 h-[580px] rounded-full blur-3xl" style={{ background: 'rgba(37,99,235,0.055)' }} />
        </div>

        <div className="max-w-[780px] w-full mx-auto relative z-[1] flex flex-col items-center text-center">

          {/* Badge */}
          <div className={clsx(
            'welcome-anim inline-flex items-center gap-[6px] py-[5px] pl-[10px] pr-[14px] text-xs font-semibold rounded-full mb-8 transition-all duration-500',
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )} style={{ transitionDelay: '0.1s', background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(96,165,250,0.05))', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd', backdropFilter: 'blur(8px)' }}>
            <span className="w-[6px] h-[6px] rounded-full bg-[#60a5fa] shrink-0" style={{ boxShadow: '0 0 8px 1px rgba(96,165,250,0.75)', animation: 'heroPulse 2s ease-in-out infinite' }} />
            Trusted by housing communities across India
          </div>

          {/* Headline */}
          <h1 className={clsx(
            'welcome-anim text-[clamp(2.8rem,6.2vw,4.625rem)] font-black leading-[1.06] tracking-[-0.042em] text-white mb-6 transition-all duration-500',
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )} style={{ transitionDelay: '0.2s' }}>
            Visitor, Society and Accounting<br />
            <span style={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 35%, #60a5fa 68%, #93c5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 2px 28px rgba(59,130,246,0.35))' }}>
              Management System
            </span>
          </h1>

          {/* Description */}
          <p className={clsx(
            'welcome-anim text-[1.0625rem] leading-[1.78] mb-10 max-w-[540px] transition-all duration-500',
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )} style={{ transitionDelay: '0.3s', color: '#64748b' }}>
            A complete platform to manage residents, visitor entries, billing, complaints,
            notices, and daily operations — built for modern housing societies.
          </p>

          {/* Enroll form card */}
          <div id="enroll" className={clsx(
            'welcome-anim w-full mb-6 transition-all duration-500',
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )} style={{ transitionDelay: '0.35s' }}>
            {enrollSubmitted ? (
              <div className="p-8 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 0 0 1px rgba(59,130,246,0.08), 0 32px 64px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)' }}>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)' }}>
                  <CheckCircle size={28} style={{ color: '#22c55e' }} />
                </div>
                <p className="font-bold text-white text-lg mb-1">Enquiry Received!</p>
                <p className="text-sm mb-5" style={{ color: '#64748b' }}>
                  We'll reach out to <span className="font-semibold text-white">+91 {enrollPhone}</span> within 24 hours.
                </p>
                <button
                  onClick={() => { setEnrollSubmitted(false); setEnrollName(''); setEnrollPhone(''); setEnrollReason('') }}
                  className="text-sm font-semibold bg-transparent border-none cursor-pointer"
                  style={{ color: '#3b82f6', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                >
                  Submit another enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnrollSubmit}>
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 0 1px rgba(59,130,246,0.1), 0 28px 56px -8px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)', backdropFilter: 'blur(28px)' }}>

                  {/* Card header */}
                  <div className="flex items-center gap-3.5 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.28), rgba(59,130,246,0.12))', border: '1px solid rgba(59,130,246,0.35)' }}>
                      <Building2 size={17} style={{ color: '#60a5fa' }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold leading-none mb-[3px]" style={{ color: '#f1f5f9' }}>Enroll Your Society</p>
                      <p className="text-xs" style={{ color: '#475569' }}>Fill in your details — we'll reach out within 24 hours</p>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="p-6 flex flex-col gap-4">

                    {/* Name – full width */}
                    <div className="flex flex-col gap-[6px]">
                      <label className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-left" style={{ color: '#475569' }}>Name</label>
                      <input
                        value={enrollName}
                        onChange={(e) => setEnrollName(e.target.value)}
                        className="w-full h-[44px] px-4 rounded-xl text-[0.875rem] font-medium transition-all duration-150 focus:outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                        placeholder="Your full name"
                        autoComplete="name"
                      />
                    </div>

                    {/* Phone – full width with inline +91 prefix */}
                    <div className="flex flex-col gap-[6px]">
                      <label className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-left" style={{ color: '#475569' }}>Phone</label>
                      <div
                        id="phone-wrapper"
                        className="flex h-[44px] rounded-xl overflow-hidden transition-all duration-150"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <span
                          className="inline-flex items-center px-3.5 text-[0.875rem] font-bold shrink-0 select-none"
                          style={{ color: '#475569', borderRight: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
                        >
                          +91
                        </span>
                        <input
                          value={enrollPhone}
                          onChange={(e) => setEnrollPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="flex-1 h-full px-3.5 bg-transparent text-[0.875rem] font-medium focus:outline-none"
                          style={{ color: '#f1f5f9' }}
                          onFocus={e => {
                            const wrapper = document.getElementById('phone-wrapper')
                            if (wrapper) { wrapper.style.borderColor = 'rgba(59,130,246,0.7)'; wrapper.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; wrapper.style.background = 'rgba(255,255,255,0.08)' }
                          }}
                          onBlur={e => {
                            const wrapper = document.getElementById('phone-wrapper')
                            if (wrapper) { wrapper.style.borderColor = 'rgba(255,255,255,0.1)'; wrapper.style.boxShadow = 'none'; wrapper.style.background = 'rgba(255,255,255,0.05)' }
                          }}
                          placeholder="10-digit number"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    {/* Reason – full width */}
                    <div className="flex flex-col gap-[6px]">
                      <label className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-left" style={{ color: '#475569' }}>Reason</label>
                      <div className="relative">
                        <select
                          value={enrollReason}
                          onChange={(e) => setEnrollReason(e.target.value)}
                          className="w-full h-[44px] pl-4 pr-10 rounded-xl text-[0.875rem] font-medium appearance-none cursor-pointer transition-all duration-150 focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: enrollReason ? '#f1f5f9' : '#475569' }}
                          onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                        >
                          <option value="" style={{ background: '#0a0f1e' }}>Select a reason…</option>
                          <option value="DEMO" style={{ background: '#0a0f1e' }}>Request a demo</option>
                          <option value="ONBOARDING" style={{ background: '#0a0f1e' }}>New society onboarding</option>
                          <option value="PRICING" style={{ background: '#0a0f1e' }}>Pricing enquiry</option>
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                      </div>
                    </div>

                    {/* Submit – full width */}
                    <button
                      type="submit"
                      disabled={enrollSubmitting}
                      className="h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-xl border-none cursor-pointer text-[0.9rem] font-bold text-white transition-all duration-200 hover:-translate-y-[2px] active:translate-y-0 active:brightness-95 disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)', boxShadow: enrollSubmitting ? 'none' : '0 4px 24px rgba(37,99,235,0.5), inset 0 1px 0 rgba(255,255,255,0.16)' }}
                      onMouseEnter={e => { if (!enrollSubmitting) e.currentTarget.style.boxShadow = '0 8px 40px rgba(37,99,235,0.68), inset 0 1px 0 rgba(255,255,255,0.2)' }}
                      onMouseLeave={e => { if (!enrollSubmitting) e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,99,235,0.5), inset 0 1px 0 rgba(255,255,255,0.16)' }}
                    >
                      {enrollSubmitting
                        ? <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Submitting…</>
                        : <>Enroll your society <ArrowRight size={15} /></>}
                    </button>

                    {enrollError && (
                      <p className="text-[0.8rem] font-semibold flex items-center gap-1.5" style={{ color: '#f87171' }}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f87171] shrink-0" />
                        {enrollError}
                      </p>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* CTA buttons */}
          <div className={clsx(
            'welcome-anim flex flex-wrap justify-center gap-3 transition-all duration-500',
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )} style={{ transitionDelay: '0.42s' }}>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.13)', color: '#cbd5e1', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)' }}
            >
              <Key size={14} />
              Society Login
            </button>
            <button
              onClick={() => scrollTo('features')}
              className="inline-flex items-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{ color: '#60a5fa', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(59,130,246,0.26)', boxShadow: '0 1px 4px rgba(37,99,235,0.12)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.46)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(37,99,235,0.28)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.26)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(37,99,235,0.12)' }}
            >
              Explore Features
              <ChevronDown size={14} />
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
