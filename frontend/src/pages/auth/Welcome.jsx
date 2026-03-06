import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2, Shield, Users, CreditCard, Bell, ArrowRight, CheckCircle, ChevronDown, Car, Phone, MessageSquare, Key, Sun, Moon, Menu, X, Twitter, Linkedin, Monitor, Sparkles, Mail, Link2, Youtube } from 'lucide-react'
import { useTheme } from '../../context'

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
  const [featureHover, setFeatureHover] = useState({})
  const featureCardRefs = useRef([])

  const handleFeatureMouseMove = (e, i) => {
    const el = featureCardRefs.current[i]
    if (!el) return
    const rect = el.getBoundingClientRect()
    setFeatureHover(prev => ({ ...prev, [i]: { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true } }))
  }
  const handleFeatureMouseLeave = (i) => {
    setFeatureHover(prev => ({ ...prev, [i]: { ...prev[i], active: false } }))
  }

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
    <div className="welcome-page">
      {/* Nav */}
      <nav className={`welcome-nav ${scrolled ? 'is-scrolled' : ''} ${isLoaded ? 'is-visible' : ''} ${mobileMenuOpen ? 'is-menu-open' : ''}`}>
        <div className="welcome-nav-inner">
          <button className="welcome-logo" onClick={() => scrollTo('hero')}>
            <div className="welcome-logo-badge">
              <Building2 size={18} />
            </div>
            <span className="welcome-logo-text">SocietyHub</span>
          </button>

          <div className="welcome-nav-links">
            <button onClick={() => navigate('/about')} className="welcome-nav-link">About Us</button>
            <button onClick={() => scrollTo('features')} className="welcome-nav-link">Features</button>
            <button onClick={() => navigate('/pricing')} className="welcome-nav-link">Pricing</button>
            <button onClick={() => navigate('/contact')} className="welcome-nav-link">Contact</button>
          </div>

          <div className="welcome-nav-actions">
            <a className="welcome-nav-phone" href="tel:+919119300000" aria-label="Call SocietyHub">
              +91 91193 00000
            </a>

            {/* Theme dropdown */}
            <div className="welcome-theme-wrap" ref={themeMenuRef}>
              <button onClick={() => setThemeMenuOpen(!themeMenuOpen)} className="welcome-theme-btn" aria-label="Theme">
                {!isManual ? <Monitor size={16} /> : isDark ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              {themeMenuOpen && (
                <div className="welcome-theme-dropdown">
                  {[
                    { label: 'System', icon: Monitor, active: !isManual, action: () => { resetToSystemTheme(); setThemeMenuOpen(false) } },
                    { label: 'Light', icon: Sun, active: isManual && theme === 'light', action: () => { setTheme('light'); setThemeMenuOpen(false) } },
                    { label: 'Dark', icon: Moon, active: isManual && theme === 'dark', action: () => { setTheme('dark'); setThemeMenuOpen(false) } },
                  ].map((opt) => (
                    <button key={opt.label} onClick={opt.action} className={`welcome-theme-option ${opt.active ? 'is-active' : ''}`}>
                      <opt.icon size={14} />
                      <span>{opt.label}</span>
                      {opt.active && <CheckCircle size={14} className="welcome-theme-check" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="welcome-mobile-toggle">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <button onClick={() => navigate('/login')} className="welcome-cta-btn welcome-cta-btn--outline">
              Society Login
            </button>
            <button onClick={() => navigate('/login')} className="welcome-cta-btn welcome-cta-btn--outline">
              Admin Portal
            </button>
            <button onClick={() => scrollTo('hero')} className="welcome-cta-btn">
              Enroll your society
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="welcome-mobile-menu">
            <button onClick={() => { navigate('/about'); setMobileMenuOpen(false) }} className="welcome-mobile-link">About Us</button>
            <button onClick={() => { scrollTo('features'); setMobileMenuOpen(false) }} className="welcome-mobile-link">Features</button>
            <button onClick={() => { navigate('/pricing'); setMobileMenuOpen(false) }} className="welcome-mobile-link">Pricing</button>
            <button onClick={() => { navigate('/contact'); setMobileMenuOpen(false) }} className="welcome-mobile-link">Contact</button>

            <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} className="welcome-mobile-cta welcome-mobile-cta--outline">
              Society Login
            </button>
            <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} className="welcome-mobile-cta">
              Admin Portal
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="hero" className="welcome-hero">
        <div className="welcome-hero-inner">
          <div className="welcome-hero-grid">
            <div className="welcome-hero-copy">
              <div className={`welcome-hero-badge ${isLoaded ? 'is-visible' : ''}`}>
                <span className="welcome-hero-badge-dot" />
                Trusted by housing communities across India
              </div>

              <h1 className={`welcome-hero-title ${isLoaded ? 'is-visible' : ''}`}>
                Visitor, Society and Accounting<br />
                <span className="welcome-hero-gradient">Management System</span>
              </h1>

              <p className={`welcome-hero-subtitle ${isLoaded ? 'is-visible' : ''}`}>
                A complete platform to manage residents, bills, complaints, notices, and daily operations —
                built for modern housing societies.
              </p>

              <form className={`welcome-enroll ${isLoaded ? 'is-visible' : ''}`} onSubmit={handleEnrollSubmit}>
                <div className="welcome-enroll__grid">
                  <label className="welcome-enroll__field">
                    <span className="welcome-enroll__label">Name</span>
                    <input
                      value={enrollName}
                      onChange={(e) => setEnrollName(e.target.value)}
                      className="welcome-enroll__input"
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </label>

                  <label className="welcome-enroll__field">
                    <span className="welcome-enroll__label">Phone</span>
                    <div className="welcome-enroll__phone">
                      <span className="welcome-enroll__prefix">+91</span>
                      <input
                        value={enrollPhone}
                        onChange={(e) => setEnrollPhone(e.target.value)}
                        className="welcome-enroll__input welcome-enroll__input--phone"
                        placeholder="Enter phone number"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </div>
                  </label>

                  <label className="welcome-enroll__field">
                    <span className="welcome-enroll__label">Select Reason</span>
                    <select
                      value={enrollReason}
                      onChange={(e) => setEnrollReason(e.target.value)}
                      className="welcome-enroll__select"
                    >
                      <option value="">Select reason</option>
                      <option value="DEMO">Request a demo</option>
                      <option value="ONBOARDING">New society onboarding</option>
                      <option value="PRICING">Pricing enquiry</option>
                    </select>
                  </label>

                  <button type="submit" className="welcome-enroll__submit">
                    Enroll your society
                    <ArrowRight size={16} />
                  </button>
                </div>

                {enrollError && <p className="welcome-enroll__error">{enrollError}</p>}
              </form>

              <div className={`welcome-hero-actions ${isLoaded ? 'is-visible' : ''}`}>
                <button onClick={() => navigate('/login')} className="welcome-btn-secondary">
                  Society Login
                  <Key size={16} />
                </button>
                <button onClick={() => scrollTo('features')} className="welcome-btn-secondary">
                  Explore Features
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            <div className="welcome-hero-art" aria-hidden="true">
              <div className="welcome-hero-art__card">
                <div className="welcome-hero-art__row">
                  <div className="welcome-hero-art__chip">
                    <Shield size={18} />
                    Secure
                  </div>
                  <div className="welcome-hero-art__chip">
                    <Users size={18} />
                    Residents
                  </div>
                </div>
                <div className="welcome-hero-art__illustration" />
                <div className="welcome-hero-art__row">
                  <div className="welcome-hero-art__chip">
                    <CreditCard size={18} />
                    Payments
                  </div>
                  <div className="welcome-hero-art__chip">
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
      <section id="features" className="welcome-section welcome-section--features" ref={featRef}>
        <div className="welcome-section-inner">
          <div className={`welcome-section-header ${featVisible ? 'welcome-reveal' : 'welcome-hidden'}`}>
            <span className="welcome-section-tag"><Sparkles size={12} /> Features</span>
            <h2 className="welcome-section-title">Everything Your Society Needs</h2>
            <p className="welcome-section-desc">A complete suite of tools designed for housing society management</p>
          </div>

          <div className="welcome-features-grid">
            {features.map((f, i) => {
              const h = featureHover[i]
              const isHovered = h?.active
              return (
                <div
                  key={i}
                  ref={el => featureCardRefs.current[i] = el}
                  onMouseMove={e => handleFeatureMouseMove(e, i)}
                  onMouseLeave={() => handleFeatureMouseLeave(i)}
                  className={`welcome-feature-card ${featVisible ? 'welcome-reveal' : 'welcome-hidden'}`}
                  style={{
                    transitionDelay: featVisible ? `${i * 80}ms` : '0ms',
                    background: isHovered
                      ? `radial-gradient(circle 180px at ${h.x}px ${h.y}px, color-mix(in srgb, ${f.color} 18%, var(--bg-card)) 0%, var(--bg-card) 100%)`
                      : undefined,
                    borderColor: isHovered ? `color-mix(in srgb, ${f.color} 55%, transparent)` : undefined,
                    boxShadow: isHovered
                      ? `0 0 0 1px color-mix(in srgb, ${f.color} 30%, transparent), 0 8px 32px color-mix(in srgb, ${f.color} 18%, transparent)`
                      : undefined,
                  }}
                >
                  {isHovered && (
                    <span
                      className="welcome-feature-portal-shimmer"
                      style={{ background: `radial-gradient(circle 80px at ${h.x}px ${h.y}px, color-mix(in srgb, ${f.color} 35%, transparent), transparent 70%)` }}
                    />
                  )}
                  <div className="welcome-feature-icon" style={{ background: `color-mix(in srgb, ${f.color} 12%, transparent)`, color: f.color }}>
                    <f.icon size={22} />
                  </div>
                  <h3 className="welcome-feature-title">{f.title}</h3>
                  <p className="welcome-feature-desc">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="welcome-section welcome-section--stats" ref={statsRef}>
        <div className="welcome-section-inner">
          <div className={`welcome-stats-card ${statsVisible ? 'welcome-reveal' : 'welcome-hidden'}`}>
            <h3 className="welcome-stats-heading">Platform Statistics</h3>
            <p className="welcome-stats-subheading">Real-time numbers that speak for themselves</p>
            <div className="welcome-stats-grid">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className={`welcome-stat ${statsVisible ? 'welcome-reveal' : 'welcome-hidden'}`}
                  style={{ transitionDelay: statsVisible ? `${200 + i * 120}ms` : '0ms' }}
                >
                  <span className="welcome-stat-value">{s.value}</span>
                  <span className="welcome-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="welcome-section welcome-section--cta" ref={ctaRef}>
        <div className="welcome-section-inner">
          <div className={`welcome-cta-card ${ctaVisible ? 'welcome-reveal' : 'welcome-hidden'}`}>
            <h2 className="welcome-cta-title">Ready to Transform Your Society?</h2>
            <p className="welcome-cta-text">Join thousands of societies already streamlining their operations</p>
            <div className="welcome-cta-actions">
              <button onClick={() => navigate('/login')} className="welcome-btn-primary welcome-btn-lg">
                Start Now — It's Free
                <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/contact')} className="welcome-btn-outline">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="welcome-footer">
        <div className="welcome-section-inner">
          <div className="welcome-footer-grid welcome-footer-grid--nbh">
            <div className="welcome-footer-brand welcome-footer-brand--nbh">
              <div className="welcome-footer-logo welcome-footer-logo--nbh">
                <div className="welcome-footer-badge">
                  <Building2 size={16} />
                </div>
                <div className="welcome-footer-brand-stack">
                  <span className="welcome-footer-name">SocietyHub</span>
                  <span className="welcome-footer-byline">By SocietyHub Technologies</span>
                </div>
              </div>
              <p className="welcome-footer-text">
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
              <div key={i} className="welcome-footer-col">
                <h4 className="welcome-footer-heading">{g.title}</h4>
                <ul className="welcome-footer-links">
                  {g.links.map((l, j) => (
                    <li key={j}>
                      <button onClick={l.action} className="welcome-footer-link">{l.label}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="welcome-footer-col">
              <h4 className="welcome-footer-heading">Contact Us</h4>
              <ul className="welcome-footer-links welcome-footer-links--contact">
                <li>
                  <a href="mailto:assist@societyhub.com" className="welcome-footer-link welcome-footer-link--icon">
                    <Mail size={14} />
                    assist@societyhub.com
                  </a>
                </li>
                <li>
                  <a href="tel:+919119300000" className="welcome-footer-link welcome-footer-link--icon">
                    <Phone size={14} />
                    +91 91193 00000
                  </a>
                </li>
              </ul>
            </div>

            <div className="welcome-footer-col">
              <h4 className="welcome-footer-heading">Get the Mobile App</h4>
              <div className="welcome-footer-apps">
                <button type="button" className="welcome-store-badge">Get it on Google Play</button>
                <button type="button" className="welcome-store-badge">Download on the App Store</button>
              </div>
              <div className="welcome-footer-socials">
                {footerSocialLinks.map((item, i) => (
                  <a key={i} href={item.href} target="_blank" rel="noreferrer" className="welcome-social-link" aria-label={`Open ${item.label} in new tab`}>
                    <item.icon size={14} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="welcome-footer-bottom">
            <p>2017 – 2026 SocietyHub Technologies Pvt. Ltd. – All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
