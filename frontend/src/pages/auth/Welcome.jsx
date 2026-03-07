import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2, Shield, Users, CreditCard, Bell, ArrowRight, CheckCircle, ChevronDown, Car, Phone, MessageSquare, Key, Sun, Moon, Menu, X, Twitter, Linkedin, Monitor, Sparkles, Mail, Link2, Youtube } from 'lucide-react'
import { useTheme } from '../../context'
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

  const handleEnrollSubmit = (e) => {
    e.preventDefault()
    const nameOk = enrollName.trim().length >= 2
    const phoneOk = enrollPhone.trim().length >= 8

    if (!nameOk || !phoneOk) {
      setEnrollError('Please enter your name and phone number.')
      return
    }

    setEnrollError('')
    navigate('/contact', {
      state: {
        name: enrollName.trim(),
        phone: enrollPhone.trim(),
        reason: enrollReason || null,
      },
    })
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-x-hidden">
      {/* Nav */}
      <nav className={clsx(
        'welcome-anim fixed top-0 left-0 right-0 z-[100] py-3 px-4 flex flex-col items-stretch backdrop-blur-[8px] transition-all duration-200 border-b border-transparent',
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
        scrolled ? 'border-b-[var(--border-default)] shadow-[var(--shadow-sm)]' : '',
        mobileMenuOpen ? 'bg-[var(--bg-primary)] backdrop-blur-none' : ''
      )} style={{ background: mobileMenuOpen ? 'var(--bg-primary)' : scrolled ? 'color-mix(in srgb, var(--bg-primary) 92%, transparent)' : 'color-mix(in srgb, var(--bg-primary) 88%, transparent)' }}>
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between gap-6 border border-[var(--border-default)] rounded-xl py-[0.55rem] px-3 shadow-[var(--shadow-sm)]" style={{ background: 'color-mix(in srgb, var(--bg-secondary) 88%, transparent)' }}>
          <button className="flex items-center gap-[0.625rem] cursor-pointer bg-transparent border-none text-inherit p-0 transition-opacity hover:opacity-[0.85] group" onClick={() => scrollTo('hero')}>
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--accent-primary)] flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-[1.08] group-hover:-rotate-3">
              <Building2 size={18} />
            </div>
            <span className="text-[1.35rem] font-extrabold text-[var(--text-primary)] tracking-[-0.02em]">SocietyHub</span>
          </button>

          <div className="flex gap-1 max-md:hidden">
            <button onClick={() => navigate('/about')} className="text-sm font-semibold text-[var(--text-secondary)] bg-transparent border-none cursor-pointer py-[0.375rem] px-3 rounded-[var(--radius-md)] transition-colors relative hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">About Us</button>
            <button onClick={() => scrollTo('features')} className="text-sm font-semibold text-[var(--text-secondary)] bg-transparent border-none cursor-pointer py-[0.375rem] px-3 rounded-[var(--radius-md)] transition-colors relative hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">Features</button>
            <button onClick={() => navigate('/pricing')} className="text-sm font-semibold text-[var(--text-secondary)] bg-transparent border-none cursor-pointer py-[0.375rem] px-3 rounded-[var(--radius-md)] transition-colors relative hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">Pricing</button>
            <button onClick={() => navigate('/contact')} className="text-sm font-semibold text-[var(--text-secondary)] bg-transparent border-none cursor-pointer py-[0.375rem] px-3 rounded-[var(--radius-md)] transition-colors relative hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">Contact</button>
          </div>

          <div className="flex items-center gap-2">
            <a className="hidden min-[900px]:inline-flex items-center text-sm font-bold text-[var(--text-secondary)] no-underline py-[0.375rem] px-2 rounded-[var(--radius-md)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]" href="tel:+919119300000" aria-label="Call SocietyHub">
              +91 91193 00000
            </a>

            {/* Theme dropdown */}
            <div className="relative" ref={themeMenuRef}>
              <button onClick={() => setThemeMenuOpen(!themeMenuOpen)} className="w-[34px] h-[34px] rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-secondary)] flex items-center justify-center cursor-pointer transition-colors hover:text-[var(--text-primary)] hover:border-[var(--border-muted)]" aria-label="Theme">
                {!isManual ? <Monitor size={16} /> : isDark ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              {themeMenuOpen && (
                <div className="absolute top-[calc(100%+6px)] right-0 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[0.375rem] min-w-[140px] shadow-[var(--shadow-lg)] z-50 origin-top-right" style={{ animation: 'welcomeDropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  {[
                    { label: 'System', icon: Monitor, active: !isManual, action: () => { resetToSystemTheme(); setThemeMenuOpen(false) } },
                    { label: 'Light', icon: Sun, active: isManual && theme === 'light', action: () => { setTheme('light'); setThemeMenuOpen(false) } },
                    { label: 'Dark', icon: Moon, active: isManual && theme === 'dark', action: () => { setTheme('dark'); setThemeMenuOpen(false) } },
                  ].map((opt) => (
                    <button key={opt.label} onClick={opt.action} className={clsx(
                      'flex items-center gap-2 w-full py-2 px-[0.625rem] text-[0.8125rem] bg-transparent border-none rounded-[var(--radius-sm)] cursor-pointer transition-colors',
                      opt.active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                    )} style={opt.active ? { background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' } : undefined}>
                      <opt.icon size={14} />
                      <span>{opt.label}</span>
                      {opt.active && <CheckCircle size={14} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="hidden max-md:flex w-[34px] h-[34px] items-center justify-center bg-transparent border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-secondary)] cursor-pointer transition-all hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] active:scale-[0.92]">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <button onClick={() => navigate('/login')} className="flex items-center gap-[0.375rem] py-2 px-4 text-[0.8125rem] font-semibold text-[var(--text-primary)] bg-transparent border border-[var(--border-default)] rounded-[var(--radius-md)] cursor-pointer transition-all max-md:hidden hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-muted)]">
              Society Login
            </button>
            <button onClick={() => navigate('/login')} className="flex items-center gap-[0.375rem] py-2 px-4 text-[0.8125rem] font-semibold text-[var(--text-primary)] bg-transparent border border-[var(--border-default)] rounded-[var(--radius-md)] cursor-pointer transition-all max-md:hidden hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-muted)]">
              Admin Portal
            </button>
            <button onClick={() => scrollTo('hero')} className="flex items-center gap-[0.375rem] py-2 px-4 text-[0.8125rem] font-semibold text-white bg-[var(--accent-primary)] border-none rounded-[var(--radius-md)] cursor-pointer transition-all max-md:hidden hover:bg-[var(--accent-hover)] hover:-translate-y-px">
              Enroll your society
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="welcome-anim flex flex-col gap-1 py-3 px-4 pb-4" style={{ animation: 'welcomeMobileSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {[
              { label: 'About Us', action: () => { navigate('/about'); setMobileMenuOpen(false) } },
              { label: 'Features', action: () => { scrollTo('features'); setMobileMenuOpen(false) } },
              { label: 'Pricing', action: () => { navigate('/pricing'); setMobileMenuOpen(false) } },
              { label: 'Contact', action: () => { navigate('/contact'); setMobileMenuOpen(false) } },
            ].map((item, i) => (
              <button key={item.label} onClick={item.action} className="welcome-anim text-sm font-medium text-[var(--text-secondary)] bg-transparent border-none text-left py-[0.625rem] px-3 rounded-[var(--radius-md)] cursor-pointer transition-all hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] hover:pl-4 active:scale-[0.98]" style={{ opacity: 0, animation: `welcomeMenuItemIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${0.04 * (i + 1)}s forwards` }}>
                {item.label}
              </button>
            ))}

            <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} className="welcome-anim mt-2 py-[0.625rem] px-4 text-sm font-semibold text-[var(--accent-primary)] bg-transparent border-[1.5px] border-[var(--accent-primary)] rounded-[var(--radius-md)] cursor-pointer transition-all hover:-translate-y-px" style={{ opacity: 0, animation: 'welcomeMenuItemIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards' }}>
              Society Login
            </button>
            <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} className="welcome-anim py-[0.625rem] px-4 text-sm font-semibold text-white bg-[var(--accent-primary)] border-none rounded-[var(--radius-md)] cursor-pointer transition-all hover:bg-[var(--accent-hover)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98]" style={{ opacity: 0, animation: 'welcomeMenuItemIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards' }}>
              Admin Portal
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="hero" className="min-h-screen flex items-center justify-center pt-28 px-6 pb-16 relative overflow-hidden before:content-[''] before:absolute before:-top-[30%] before:left-1/2 before:-translate-x-1/2 before:w-[800px] before:h-[800px] before:rounded-full before:pointer-events-none" style={{ '--tw-before-bg': 'radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 8%, transparent) 0%, transparent 70%)' }}>
        <div className="max-w-[1200px] text-left relative z-[1]" style={{ position: 'relative' }}>
          <div className="grid grid-cols-[1.2fr_0.8fr] max-[980px]:grid-cols-1 gap-8 items-center">
            <div className="min-w-0">
              <div className={clsx(
                'welcome-anim inline-flex items-center gap-2 py-[0.375rem] px-[0.875rem] text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-full mb-6 transition-all duration-500',
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              )} style={{ transitionDelay: '0.1s' }}>
                <span className="welcome-anim w-[6px] h-[6px] rounded-full bg-[#3fb950]" style={{ animation: 'heroPulse 2s ease-in-out infinite' }} />
                Trusted by housing communities across India
              </div>

              <h1 className={clsx(
                'welcome-anim text-[clamp(2.5rem,6vw,4rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)] mb-5 transition-all duration-500',
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )} style={{ transitionDelay: '0.2s' }}>
                Visitor, Society and Accounting<br />
                <span className="bg-gradient-to-br from-[var(--accent-primary)] via-[#58a6ff] to-[#79c0ff] bg-clip-text text-transparent">Management System</span>
              </h1>

              <p className={clsx(
                'welcome-anim text-lg leading-[1.65] text-[var(--text-secondary)] max-w-[560px] mb-6 transition-all duration-500',
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              )} style={{ transitionDelay: '0.3s' }}>
                A complete platform to manage residents, bills, complaints, notices, and daily operations —
                built for modern housing societies.
              </p>

              <form className={clsx(
                'welcome-anim mb-5 transition-all duration-500',
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              )} style={{ transitionDelay: '0.35s' }} onSubmit={handleEnrollSubmit}>
                <div className="grid grid-cols-2 max-[680px]:grid-cols-1 gap-3 p-[0.875rem] rounded-xl border border-[var(--border-default)] shadow-[var(--shadow-sm)]" style={{ background: 'color-mix(in srgb, var(--bg-secondary) 88%, transparent)' }}>
                  <label className="flex flex-col gap-[0.35rem] min-w-0">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Name</span>
                    <input
                      value={enrollName}
                      onChange={(e) => setEnrollName(e.target.value)}
                      className="h-[42px] py-[0.55rem] px-[0.8rem] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.95rem] font-semibold focus:outline-2 focus:outline-[color-mix(in_srgb,var(--accent-primary)_50%,transparent)] focus:outline-offset-2"
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </label>

                  <label className="flex flex-col gap-[0.35rem] min-w-0">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Phone</span>
                    <div className="flex items-stretch gap-2">
                      <span className="inline-flex items-center px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-extrabold">+91</span>
                      <input
                        value={enrollPhone}
                        onChange={(e) => setEnrollPhone(e.target.value)}
                        className="flex-1 h-[42px] py-[0.55rem] px-[0.8rem] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.95rem] font-semibold focus:outline-2 focus:outline-[color-mix(in_srgb,var(--accent-primary)_50%,transparent)] focus:outline-offset-2"
                        placeholder="Enter phone number"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </div>
                  </label>

                  <label className="flex flex-col gap-[0.35rem] min-w-0">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Select Reason</span>
                    <select
                      value={enrollReason}
                      onChange={(e) => setEnrollReason(e.target.value)}
                      className="h-[42px] py-[0.55rem] px-[0.8rem] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.95rem] font-semibold focus:outline-2 focus:outline-[color-mix(in_srgb,var(--accent-primary)_50%,transparent)] focus:outline-offset-2"
                    >
                      <option value="">Select reason</option>
                      <option value="DEMO">Request a demo</option>
                      <option value="ONBOARDING">New society onboarding</option>
                      <option value="PRICING">Pricing enquiry</option>
                    </select>
                  </label>

                  <button type="submit" className="h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-[var(--radius-md)] border-none cursor-pointer bg-[var(--accent-primary)] text-white font-extrabold text-[0.95rem] transition-all hover:bg-[var(--accent-hover)] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none" style={{ boxShadow: 'none' }}>
                    Enroll your society
                    <ArrowRight size={16} />
                  </button>
                </div>

                {enrollError && <p className="mt-2 text-sm font-bold" style={{ color: 'var(--danger-600, var(--text-secondary))' }}>{enrollError}</p>}
              </form>

              <div className={clsx(
                'welcome-anim flex flex-wrap justify-start gap-3 transition-all duration-500',
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              )} style={{ transitionDelay: '0.4s' }}>
                <button onClick={() => navigate('/login')} className="inline-flex items-center gap-2 py-3 px-6 text-[0.9375rem] font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-strong)] rounded-[var(--radius-md)] cursor-pointer transition-all hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-muted)]">
                  Society Login
                  <Key size={16} />
                </button>
                <button onClick={() => scrollTo('features')} className="inline-flex items-center gap-2 py-3 px-6 text-[0.9375rem] font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-strong)] rounded-[var(--radius-md)] cursor-pointer transition-all hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-muted)]">
                  Explore Features
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            <div className="flex justify-center" aria-hidden="true">
              <div className="w-[min(420px,100%)] rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-md)] p-4" style={{ background: 'color-mix(in srgb, var(--bg-secondary) 90%, transparent)' }}>
                <div className="flex gap-2 justify-between">
                  <div className="inline-flex items-center gap-2 py-[0.55rem] px-3 rounded-full border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-secondary)] font-extrabold text-[0.85rem]">
                    <Shield size={18} />
                    Secure
                  </div>
                  <div className="inline-flex items-center gap-2 py-[0.55rem] px-3 rounded-full border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-secondary)] font-extrabold text-[0.85rem]">
                    <Users size={18} />
                    Residents
                  </div>
                </div>
                <div className="my-[0.85rem] h-[220px] rounded-xl border border-dashed border-[var(--border-default)]" style={{ background: 'color-mix(in srgb, var(--accent-primary) 6%, var(--bg-primary))' }} />
                <div className="flex gap-2 justify-between">
                  <div className="inline-flex items-center gap-2 py-[0.55rem] px-3 rounded-full border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-secondary)] font-extrabold text-[0.85rem]">
                    <CreditCard size={18} />
                    Payments
                  </div>
                  <div className="inline-flex items-center gap-2 py-[0.55rem] px-3 rounded-full border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-secondary)] font-extrabold text-[0.85rem]">
                    <Bell size={18} />
                    Notices
                  </div>
                </div>
              </div>
            </div>
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
                  featVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                )}
                style={{ transitionDelay: featVisible ? `${i * 80}ms` : '0ms', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-[1.08]" style={{ background: `color-mix(in srgb, ${f.color} 12%, transparent)`, color: f.color }}>
                  <f.icon size={22} />
                </div>
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-2">{f.title}</h3>
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
