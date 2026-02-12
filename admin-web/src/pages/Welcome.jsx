import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2, Shield, Users, CreditCard, Bell, ArrowRight, CheckCircle, ChevronDown, Car, Phone, MessageSquare, Key, Sun, Moon, Menu, X, Github, Twitter, Linkedin, Monitor, Sparkles } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

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

  const socialLinks = [
    { icon: Twitter, href: 'https://x.com', label: 'X' },
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Linkedin, href: 'https://www.linkedin.com', label: 'LinkedIn' },
  ]

  // Scroll-reveal refs
  const [featRef, featVisible] = useScrollReveal()
  const [statsRef, statsVisible] = useScrollReveal()
  const [ctaRef, ctaVisible] = useScrollReveal()

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  return (
    <div className="welcome-page">
      {/* Nav */}
      <nav className={`welcome-nav ${scrolled ? 'is-scrolled' : ''} ${isLoaded ? 'is-visible' : ''}`}>
        <div className="welcome-nav-inner">
          <button className="welcome-logo" onClick={() => scrollTo('hero')}>
            <div className="welcome-logo-badge">
              <Building2 size={18} />
            </div>
            <span className="welcome-logo-text">SocietyHub</span>
          </button>

          <div className="welcome-nav-links">
            {['Features', 'Stats', 'Contact'].map((item) => (
              <button key={item} onClick={() => scrollTo(item.toLowerCase())} className="welcome-nav-link">
                {item}
              </button>
            ))}
          </div>

          <div className="welcome-nav-actions">
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

            <button onClick={() => navigate('/login')} className="welcome-cta-btn">
              <Key size={14} />
              Login
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="welcome-mobile-menu">
            {['Features', 'Stats', 'Contact'].map((item) => (
              <button key={item} onClick={() => scrollTo(item.toLowerCase())} className="welcome-mobile-link">
                {item}
              </button>
            ))}
            <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} className="welcome-mobile-cta">
              Login to Dashboard
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="hero" className="welcome-hero">
        <div className="welcome-hero-inner">
          <div className={`welcome-hero-badge ${isLoaded ? 'is-visible' : ''}`}>
            <span className="welcome-hero-badge-dot" />
            Trusted by 500+ Housing Societies
          </div>

          <h1 className={`welcome-hero-title ${isLoaded ? 'is-visible' : ''}`}>
            Your Society,<br />
            <span className="welcome-hero-gradient">Simplified</span>
          </h1>

          <p className={`welcome-hero-subtitle ${isLoaded ? 'is-visible' : ''}`}>
            The complete digital ecosystem for modern housing societies.
            Manage bills, complaints, notices, and residents — all in one powerful platform.
          </p>

          <div className={`welcome-hero-actions ${isLoaded ? 'is-visible' : ''}`}>
            <button onClick={() => navigate('/login')} className="welcome-btn-primary">
              Get Started Free
              <ArrowRight size={16} />
            </button>
            <button onClick={() => scrollTo('features')} className="welcome-btn-secondary">
              Explore Features
              <ChevronDown size={16} />
            </button>
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
            {features.map((f, i) => (
              <div
                key={i}
                className={`welcome-feature-card ${featVisible ? 'welcome-reveal' : 'welcome-hidden'}`}
                style={{ transitionDelay: featVisible ? `${i * 80}ms` : '0ms' }}
              >
                <div className="welcome-feature-icon" style={{ background: `color-mix(in srgb, ${f.color} 12%, transparent)`, color: f.color }}>
                  <f.icon size={22} />
                </div>
                <h3 className="welcome-feature-title">{f.title}</h3>
                <p className="welcome-feature-desc">{f.desc}</p>
              </div>
            ))}
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
          <div className="welcome-footer-grid">
            <div className="welcome-footer-brand">
              <div className="welcome-footer-logo">
                <div className="welcome-footer-badge">
                  <Building2 size={16} />
                </div>
                <span className="welcome-footer-name">SocietyHub</span>
              </div>
              <p className="welcome-footer-text">
                The complete digital solution for modern housing society management.
              </p>
              <div className="welcome-footer-socials">
                {socialLinks.map((item, i) => (
                  <a key={i} href={item.href} target="_blank" rel="noreferrer" className="welcome-social-link" aria-label={`Open ${item.label} in new tab`}>
                    <item.icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Product', links: [{ label: 'Features', action: () => scrollTo('features') }, { label: 'Pricing', action: () => navigate('/pricing') }, { label: 'Demo', action: () => navigate('/demo') }] },
              { title: 'Company', links: [{ label: 'About', action: () => navigate('/about') }, { label: 'Contact', action: () => navigate('/contact') }, { label: 'Blog', action: () => navigate('/blog') }] },
              { title: 'Legal', links: [{ label: 'Privacy', action: () => navigate('/privacy') }, { label: 'Terms', action: () => navigate('/terms') }, { label: 'Help', action: () => navigate('/help') }] },
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
          </div>

          <div className="welcome-footer-bottom">
            <p> &copy; 2026 SocietyHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
