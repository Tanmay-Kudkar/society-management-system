import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Shield, Users, FileText, Bell, CreditCard, ArrowRight, CheckCircle, Star, ChevronDown, Home, Car, Phone, Wallet, MessageSquare, Calendar, Key, Sparkles, Play, Sun, Moon, Menu, X, Github, Twitter, Linkedin, Info, FileCheck, Mail, Monitor } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import '../styles/animations.css'

// Animated counter component with continuous slow increment
function AnimatedCounter({ value, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [hasFinished, setHasFinished] = useState(false)
  const ref = useRef(null)

  // Parse the numeric value from string like "500+", "50K+", "99.9%"
  const parseValue = (val) => {
    const numStr = val.replace(/[^0-9.]/g, '')
    return parseFloat(numStr) || 0
  }

  const targetValue = parseValue(value)
  const hasK = value.includes('K')
  const hasPercent = value.includes('%')
  const hasPlus = value.includes('+')
  const isDecimal = value.includes('.')
  const isSupport = value === '24/7'

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [hasStarted])

  // Main counting animation
  useEffect(() => {
    if (!hasStarted || isSupport) return

    let startTime = null
    let animationFrame = null

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = easeOutQuart * targetValue
      
      setCount(currentValue)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setHasFinished(true)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [hasStarted, targetValue, duration, isSupport])

  // Slow continuous increment after initial animation
  useEffect(() => {
    if (!hasFinished || isSupport || hasPercent) return

    const interval = setInterval(() => {
      setCount(prev => prev + (hasK ? 0.1 : 1))
    }, 3000)

    return () => clearInterval(interval)
  }, [hasFinished, hasK, isSupport, hasPercent])

  // Format the displayed value
  const formatValue = () => {
    if (isSupport) return '24/7'
    let displayValue = isDecimal ? count.toFixed(1) : Math.floor(count)
    if (hasK) return `${displayValue}K${hasPlus ? '+' : ''}`
    if (hasPercent) return `${displayValue}%`
    if (hasPlus) return `${displayValue}+`
    return displayValue
  }

  return (
    <span ref={ref} className="welcome-tabular">
      {formatValue()}
    </span>
  )
}

export default function Welcome() {
  const navigate = useNavigate()
  const { theme, isDark, setTheme, resetToSystemTheme, isManual } = useTheme()
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeNavItem, setActiveNavItem] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const themeMenuRef = useRef(null)

  // Close theme menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setThemeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsLoaded(true)
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
      
      // Update active nav based on scroll position
      const sections = ['features', 'stats', 'contact']
      for (const section of sections) {
        const el = document.getElementById(section)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveNavItem(section)
            break
          }
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    { icon: Building2, title: 'Society Management', description: 'Complete admin control for housing societies with real-time insights', gradient: 'linear-gradient(135deg, #3b82f6, #22d3ee)' },
    { icon: Home, title: 'Flat Management', description: 'Track ownership, occupancy, and maintenance for every unit', gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
    { icon: CreditCard, title: 'Bill & Payments', description: 'Automated maintenance bills with online payment integration', gradient: 'linear-gradient(135deg, #22c55e, #10b981)' },
    { icon: Users, title: 'Tenant Portal', description: 'Self-service portal for tenants to raise requests and pay bills', gradient: 'linear-gradient(135deg, #f97316, #ef4444)' },
    { icon: Car, title: 'Vehicle Registry', description: 'Manage parking slots and vehicle registrations digitally', gradient: 'linear-gradient(135deg, #f59e0b, #f97316)' },
    { icon: MessageSquare, title: 'Complaints & Tickets', description: 'Streamlined issue resolution with status tracking', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { icon: Bell, title: 'Notices & Alerts', description: 'Broadcast important updates to all residents instantly', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
    { icon: Shield, title: 'Security & Access', description: 'Role-based permissions for admins, committees, and residents', gradient: 'linear-gradient(135deg, #14b8a6, #22d3ee)' },
  ]

  const stats = [
    { value: '500+', label: 'Societies', icon: Building2 },
    { value: '50K+', label: 'Residents', icon: Users },
    { value: '99.9%', label: 'Uptime', icon: Shield },
    { value: '24/7', label: 'Support', icon: Phone },
  ]

  // Pre-generate particle positions
  const particles = useMemo(() => 
    [...Array(30)].map((_, i) => ({
      left: `${(i * 3.5 + (i % 7) * 8) % 100}%`,
      top: `${(i * 4.2 + (i % 5) * 12) % 100}%`,
      size: `${4 + (i % 8)}px`,
      delay: `${(i % 10) * 0.4}s`,
      duration: `${6 + (i % 6)}s`,
      type: i % 3,
    })), [])

  // Realistic building silhouettes for society theme
  const buildings = useMemo(() => [
    // Modern Tower
    { left: '2%', height: '180px', width: '45px', type: 'tower', floors: 12, hasAntenna: true },
    // Residential Block
    { left: '10%', height: '120px', width: '70px', type: 'residential', floors: 8 },
    // Skyscraper
    { left: '22%', height: '220px', width: '55px', type: 'skyscraper', floors: 15, hasAntenna: true },
    // Wide Apartment
    { left: '32%', height: '100px', width: '90px', type: 'apartment', floors: 6 },
    // Medium Tower
    { left: '48%', height: '160px', width: '50px', type: 'tower', floors: 10 },
    // Office Building
    { left: '58%', height: '140px', width: '65px', type: 'office', floors: 9 },
    // Tall Skyscraper
    { left: '70%', height: '200px', width: '48px', type: 'skyscraper', floors: 14, hasAntenna: true },
    // Small Building
    { left: '82%', height: '90px', width: '55px', type: 'residential', floors: 5 },
    // End Tower
    { left: '92%', height: '130px', width: '40px', type: 'tower', floors: 8 },
  ], [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div
      className={`welcome-page ${isDark ? 'is-dark' : 'is-light'}`}
      style={!isDark ? { background: 'linear-gradient(to bottom, #f8fafc, white, color-mix(in srgb, var(--accent-light) 30%, white))' } : {}}
    >
      {/* Animated Background */}
      <div className="welcome-background">
        {/* Base gradient */}
        <div
          className={`welcome-background-base ${isDark ? 'is-dark' : 'is-light'}`}
          style={!isDark ? { background: `linear-gradient(to bottom right, color-mix(in srgb, var(--accent-light) 30%, white), white, color-mix(in srgb, var(--accent-light) 40%, white))` } : {}}
        ></div>
        
        {/* Animated gradient mesh */}
        <div className={`welcome-background-mesh ${isDark ? 'is-dark' : 'is-light'}`}>
          <div
            className={`welcome-background-mesh-layer welcome-background-mesh-layer--pulse ${isDark ? 'is-dark' : 'is-light'} animate-pulse-slow`}
            style={{
              background: isDark
                ? 'radial-gradient(ellipse at top, color-mix(in srgb, var(--accent-primary) 40%, transparent), transparent, transparent)'
                : 'radial-gradient(ellipse at top, color-mix(in srgb, var(--accent-light) 40%, transparent), transparent, transparent)'
            }}
          ></div>
          <div
            className={`welcome-background-mesh-layer welcome-background-mesh-layer--corner ${isDark ? 'is-dark' : 'is-light'} animate-pulse-slower`}
          ></div>
        </div>
        
        {/* Floating orbs with improved animation - only show in dark mode */}
        {isDark && (
          <>
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
            <div className="orb orb-4"></div>
          </>
        )}
        
        {/* Light mode decorative elements - more vibrant */}
        {!isDark && (
          <>
            <div
              className="welcome-light-orb welcome-light-orb--one animate-float"
              style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--accent-primary) 20%, transparent), color-mix(in srgb, var(--accent-secondary) 20%, transparent))' }}
            ></div>
            <div className="welcome-light-orb welcome-light-orb--two animate-floatSlow"></div>
            <div className="welcome-light-orb welcome-light-orb--three animate-float"></div>
            <div className="welcome-light-orb welcome-light-orb--four animate-floatSlow"></div>
          </>
        )}
        
        {/* Floating Particles */}
        <div className="particles-container">
          {particles.map((particle, i) => (
            <div
              key={i}
              className={`particle ${isDark ? `particle-${particle.type}` : 'particle-light'}`}
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            />
          ))}
        </div>

        {/* Realistic Building Silhouettes at bottom */}
        <div className="welcome-buildings">
          {buildings.map((building, i) => (
            <div
              key={i}
              className={`building-realistic ${isDark ? 'building-dark' : 'building-light-new'}`}
              style={{
                left: building.left,
                height: building.height,
                width: building.width,
                animationDelay: `${i * 0.15}s`,
              }}
            >
              {/* Building top design based on type */}
              {building.hasAntenna && (
                <div
                  className="welcome-building-antenna"
                  style={{ background: isDark ? '#475569' : 'var(--accent-primary)' }}
                >
                  <div className="welcome-building-antenna-dot animate-pulse"></div>
                </div>
              )}
              {/* Roof */}
              <div
                className={`welcome-building-roof ${isDark ? 'is-dark' : 'is-light'}`}
                style={!isDark ? { background: 'var(--accent-primary)', opacity: 0.6 } : {}}
              ></div>
              {/* Windows grid */}
              <div className={`building-windows-grid ${isDark ? '' : 'building-windows-light'}`} style={{ '--floors': building.floors }}></div>
              {/* Building reflection */}
              <div className={`welcome-building-reflection ${isDark ? 'is-dark' : 'is-light'}`}></div>
            </div>
          ))}
          {/* Ground with gradient */}
          <div
            className={`welcome-building-ground ${isDark ? 'is-dark' : 'is-light'}`}
            style={!isDark ? { background: `linear-gradient(to top, color-mix(in srgb, var(--accent-light) 50%, white), color-mix(in srgb, var(--accent-light) 25%, white), transparent)` } : {}}
          ></div>
          {/* Road */}
          <div
            className={`welcome-building-road ${isDark ? 'is-dark' : 'is-light'}`}
            style={!isDark ? { background: 'var(--accent-primary)', opacity: 0.5 } : {}}
          >
            <div
              className={`welcome-building-road-line ${isDark ? 'is-dark' : 'is-light'}`}
              style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, currentColor 20px, currentColor 40px)' }}
            ></div>
          </div>
        </div>

        {/* Grid overlay */}
        <div
          className={`welcome-grid-overlay ${isDark ? 'is-dark' : 'is-light'}`}
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px),
                              linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="welcome-content">
        {/* Navigation */}
        <nav className={`welcome-nav ${isLoaded ? 'is-visible' : ''}`}>
          <div className={`welcome-nav-surface ${
            scrolled 
              ? isDark ? 'nav-glass-scrolled' : 'nav-glass-light-scrolled'
              : isDark ? 'nav-glass' : 'nav-glass-light'
          }`}>
            <div className="welcome-nav-content">
              {/* Logo */}
              <div className="welcome-logo" onClick={() => scrollToSection('hero')}>
                <div className="welcome-logo-badge">
                  <div 
                    className="welcome-logo-badge-inner"
                    style={{ 
                      background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))`,
                      boxShadow: `0 10px 15px -3px color-mix(in srgb, var(--accent-primary) 30%, transparent)`
                    }}
                  >
                    <Building2 className="welcome-logo-icon" />
                  </div>
                  <div 
                    className="welcome-logo-badge-glow"
                    style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                  ></div>
                </div>
                <div className="welcome-logo-text">
                  <span 
                    className="welcome-logo-title"
                    style={{ backgroundImage: isDark ? `linear-gradient(to right, white, var(--accent-light), var(--accent-secondary))` : `linear-gradient(to right, #111827, var(--accent-primary), var(--accent-secondary))` }}
                  >
                    SocietyHub
                  </span>
                  <span
                    className="welcome-logo-subtitle"
                    style={{ color: isDark ? `color-mix(in srgb, var(--accent-light) 70%, transparent)` : `color-mix(in srgb, var(--accent-primary) 70%, transparent)` }}
                  >
                    Management System
                  </span>
                </div>
              </div>

              {/* Nav Links - Desktop */}
              <div className="welcome-nav-links">
                {[
                  { id: 'features', label: 'Features' },
                  { id: 'stats', label: 'Stats' },
                  { id: 'contact', label: 'Contact' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`nav-link-new welcome-nav-link ${activeNavItem === item.id ? (isDark ? 'nav-link-active-dark' : 'nav-link-active-light') : ''} ${isDark ? 'is-dark' : 'is-light'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Right Actions */}
              <div className="welcome-nav-actions">
                {/* Theme Toggle with Dropdown */}
                <div className="welcome-theme-menu" ref={themeMenuRef}>
                  <button
                    onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                    className={`welcome-theme-trigger ${isDark ? 'is-dark' : 'is-light'}`}
                    aria-label="Theme options"
                  >
                    {!isManual ? <Monitor className="welcome-theme-icon" /> : isDark ? <Moon className="welcome-theme-icon" /> : <Sun className="welcome-theme-icon" />}
                  </button>
                  
                  {/* Theme Dropdown Menu */}
                  {themeMenuOpen && (
                    <div className={`welcome-theme-dropdown ${isDark ? 'is-dark' : 'is-light'}`}>
                      <div className="welcome-theme-options">
                        <button
                          onClick={() => { resetToSystemTheme(); setThemeMenuOpen(false); }}
                          className={`welcome-theme-option ${isDark ? 'is-dark' : 'is-light'}`}
                          style={!isManual ? { background: isDark ? 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 10%, white)', color: 'var(--accent-primary)' } : {}}
                        >
                          <Monitor className="welcome-theme-option-icon" />
                          <span>System</span>
                          {!isManual && <CheckCircle className="welcome-theme-option-check" />}
                        </button>
                        <button
                          onClick={() => { setTheme('light'); setThemeMenuOpen(false); }}
                          className={`welcome-theme-option ${isDark ? 'is-dark' : 'is-light'}`}
                          style={isManual && theme === 'light' ? { background: isDark ? 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 10%, white)', color: 'var(--accent-primary)' } : {}}
                        >
                          <Sun className="welcome-theme-option-icon" />
                          <span>Light</span>
                          {isManual && theme === 'light' && <CheckCircle className="welcome-theme-option-check" />}
                        </button>
                        <button
                          onClick={() => { setTheme('dark'); setThemeMenuOpen(false); }}
                          className={`welcome-theme-option ${isDark ? 'is-dark' : 'is-light'}`}
                          style={isManual && theme === 'dark' ? { background: isDark ? 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 10%, white)', color: 'var(--accent-primary)' } : {}}
                        >
                          <Moon className="welcome-theme-option-icon" />
                          <span>Dark</span>
                          {isManual && theme === 'dark' && <CheckCircle className="welcome-theme-option-check" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`welcome-mobile-toggle ${isDark ? 'is-dark' : 'is-light'}`}
                >
                  {mobileMenuOpen ? <X className="welcome-mobile-toggle-icon" /> : <Menu className="welcome-mobile-toggle-icon" />}
                </button>

                {/* CTA Button - Desktop */}
                <button
                  onClick={() => navigate('/login')}
                  className={`welcome-nav-cta btn-primary-new ${isDark ? 'btn-primary-dark' : 'btn-primary-light'}`}
                >
                  <span className="welcome-nav-cta-content">
                    <Key className="welcome-nav-cta-icon" />
                    Login
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`welcome-mobile-menu ${mobileMenuOpen ? 'is-open' : ''} ${isDark ? 'is-dark' : 'is-light'}`}>
            <div className="welcome-mobile-menu-content">
              {[
                { id: 'features', label: 'Features', icon: Sparkles },
                { id: 'stats', label: 'Statistics', icon: Building2 },
                { id: 'contact', label: 'Contact', icon: Mail },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`welcome-mobile-link ${activeNavItem === item.id ? 'is-active' : ''} ${isDark ? 'is-dark' : 'is-light'}`}
                  style={activeNavItem === item.id ? { background: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)', color: 'var(--accent-primary)' } : {}}
                >
                  <item.icon className="welcome-mobile-link-icon" />
                  {item.label}
                </button>
              ))}
              <hr className={`welcome-mobile-divider ${isDark ? 'is-dark' : 'is-light'}`} />
              <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
                className="welcome-mobile-cta"
                style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
              >
                <Key className="welcome-mobile-cta-icon" />
                Login to Dashboard
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="hero" className="welcome-hero">
          <div className="welcome-hero-inner">
            {/* Trust Badge */}
            <div className={`welcome-trust ${isLoaded ? 'is-visible' : ''}`}>
              <div
                className={`welcome-trust-badge hover-lift ${isDark ? 'is-dark' : 'is-light'}`}
                style={!isDark ? { borderColor: 'color-mix(in srgb, var(--accent-light) 50%, transparent)', borderWidth: '1px', boxShadow: '0 10px 15px -3px color-mix(in srgb, var(--accent-primary) 10%, transparent)' } : {}}
              >
                <div className="welcome-trust-avatars">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i} 
                      className="welcome-trust-avatar"
                      style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                    >
                      {['S', 'M', 'R'][i]}
                    </div>
                  ))}
                </div>
                <div className={`welcome-trust-divider ${isDark ? 'is-dark' : 'is-light'}`}></div>
                <Star className="welcome-trust-star animate-pulse" />
                <span className={`welcome-trust-text ${isDark ? 'is-dark' : 'is-light'}`}>
                  Trusted by <span className={`welcome-trust-highlight ${isDark ? 'is-dark' : 'is-light'}`}>500+</span> Housing Societies
                </span>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className={`welcome-hero-title ${isLoaded ? 'is-visible' : ''}`}>
              <span className={`welcome-hero-title-line welcome-hero-title-primary ${isDark ? 'is-dark' : 'is-light'}`}>Your Society,</span>
              <span className="welcome-hero-title-line hero-gradient-text">
                Simplified
              </span>
            </h1>

            {/* Subheading */}
            <p className={`welcome-hero-subtitle ${isLoaded ? 'is-visible' : ''} ${isDark ? 'is-dark' : 'is-light'}`}>
              The complete <span className="welcome-hero-subtitle-strong" style={{ color: 'var(--accent-primary)' }}>digital ecosystem</span> for modern housing societies. 
              Manage bills, complaints, notices, and residents — all in one powerful platform.
            </p>

            {/* CTA Buttons */}
            <div className={`welcome-hero-actions ${isLoaded ? 'is-visible' : ''}`}>
              <button
                onClick={() => navigate('/login')}
                className="btn-hero-primary-new welcome-hero-cta"
                style={!isDark ? { boxShadow: '0 20px 25px -5px color-mix(in srgb, var(--accent-primary) 25%, transparent)' } : {}}
              >
                <span className="welcome-hero-cta-content">
                  <Sparkles className="welcome-hero-cta-icon" />
                  Get Started Free
                  <ArrowRight className="welcome-hero-cta-arrow" />
                </span>
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="btn-hero-secondary-new welcome-hero-cta welcome-hero-cta--secondary"
                style={!isDark ? { borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' } : {}}
              >
                <Play className="welcome-hero-cta-icon" />
                <span className="welcome-hero-cta-label">Watch Demo</span>
              </button>
            </div>

            {/* Quick Features */}
            <div className={`welcome-quick-features ${isLoaded ? 'is-visible' : ''}`}>
              {[
                { icon: CreditCard, text: 'Online Payments' },
                { icon: Bell, text: 'Instant Notices' },
                { icon: MessageSquare, text: 'Quick Support' },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className={`welcome-quick-feature ${isDark ? 'is-dark' : 'is-light'}`}
                >
                  <div 
                    className={`welcome-quick-feature-icon ${isDark ? 'is-dark' : 'is-light'}`}
                    style={isDark ? {} : { background: 'color-mix(in srgb, var(--accent-primary) 10%, white)' }}
                  >
                    <item.icon className="welcome-quick-feature-icon-svg" />
                  </div>
                  <span className="welcome-quick-feature-text">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Scroll Indicator */}
            <div className={`welcome-scroll-prompt ${isLoaded ? 'is-visible' : ''}`}>
              <button 
                onClick={(e) => { e.currentTarget.blur(); scrollToSection('features'); }} 
                className={`welcome-scroll-button ${isDark ? 'is-dark' : 'is-light'}`}
                style={{ outline: 'none', border: 'none', color: isDark ? undefined : 'var(--accent-primary)' }}
              >
                <span className="welcome-scroll-label" style={{ color: isDark ? undefined : 'var(--accent-primary)' }}>Explore Features</span>
                <div className="scroll-indicator">
                  <ChevronDown className="welcome-scroll-icon" />
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="welcome-section welcome-section--features">
          <div className="welcome-section-inner">
            <div className="welcome-section-header">
              <div 
                className={`welcome-section-badge ${isDark ? 'is-dark' : 'is-light'} ${isDark ? 'glass-badge' : ''}`}
                style={isDark ? {} : { background: `linear-gradient(to right, color-mix(in srgb, var(--accent-primary) 10%, white), color-mix(in srgb, var(--accent-secondary) 10%, white))`, borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' }}
              >
                <Sparkles className="welcome-section-badge-icon" style={{ color: 'var(--accent-primary)' }} />
                <span className={`welcome-section-badge-text ${isDark ? 'is-dark' : 'is-light'}`} style={{ color: isDark ? undefined : 'var(--accent-primary)' }}>Powerful Features</span>
              </div>
              <h2 className="welcome-section-title">
                <span className={`welcome-section-title-primary ${isDark ? 'is-dark' : 'is-light'}`}>Everything Your </span>
                <span className="hero-gradient-text">Society Needs</span>
              </h2>
              <p className={`welcome-section-subtitle ${isDark ? 'is-dark' : 'is-light'}`}>
                A complete suite of tools designed specifically for housing society management
              </p>
            </div>

            <div className="welcome-features-grid">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`feature-card-new welcome-feature-card ${isDark ? 'feature-card-dark' : 'feature-card-light'}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="feature-card-glow-new"></div>
                  <div className="welcome-feature-card-body">
                    <div className="feature-icon-new" style={{ background: feature.gradient }}>
                      <feature.icon className="welcome-feature-icon" />
                    </div>
                    <h3 className={`welcome-feature-title ${isDark ? 'is-dark' : 'is-light'}`}>
                      {feature.title}
                    </h3>
                    <p className={`welcome-feature-text ${isDark ? 'is-dark' : 'is-light'}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GitHub-style Animated Showcase - Dark Mode Only */}
        {isDark && (
          <section className="welcome-section welcome-section--showcase">
            <div className="welcome-section-inner">
              <div className="welcome-section-header">
                <h2 className="welcome-section-title">
                  <span className="welcome-section-title-primary is-dark">See It </span>
                  <span className="hero-gradient-text">In Action</span>
                </h2>
                <p className="welcome-section-subtitle is-dark">
                  Watch how SocietyHub transforms daily operations
                </p>
              </div>

              {/* Animated Tiles Container */}
              <div className="welcome-showcase-grid">
                {/* Community Tile */}
                <div className="github-tile">
                  <div className="github-tile-bg"></div>
                  <div className="welcome-showcase-card">
                    <div className="welcome-showcase-header">
                      <div className="welcome-showcase-icon-badge" style={{ background: 'linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))' }}>
                        <Users className="welcome-showcase-icon" />
                      </div>
                      <h3 className="welcome-showcase-title">Community Connect</h3>
                    </div>
                    
                    {/* Animated People */}
                    <div className="welcome-showcase-canvas">
                      <svg viewBox="0 0 300 150" className="welcome-showcase-svg">
                        {/* Building Background */}
                        <rect x="20" y="50" width="60" height="100" fill="#1e293b" rx="4"/>
                        <rect x="120" y="30" width="60" height="120" fill="#1e293b" rx="4"/>
                        <rect x="220" y="60" width="60" height="90" fill="#1e293b" rx="4"/>
                        
                        {/* Windows */}
                        {[30, 50, 70].map((x, i) => 
                          [60, 80, 100, 120].map((y, j) => (
                            <rect key={`w1-${i}-${j}`} x={x} y={y} width="8" height="10" 
                              className="github-window" style={{ animationDelay: `${(i + j) * 0.3}s` }}/>
                          ))
                        )}
                        {[130, 150, 170].map((x, i) => 
                          [40, 60, 80, 100, 120].map((y, j) => (
                            <rect key={`w2-${i}-${j}`} x={x} y={y} width="8" height="10" 
                              className="github-window" style={{ animationDelay: `${(i + j) * 0.25}s` }}/>
                          ))
                        )}
                        
                        {/* Animated People Walking */}
                        <g className="github-person-1">
                          <circle cx="0" cy="140" r="6" fill="#8b5cf6"/>
                          <rect x="-3" y="146" width="6" height="10" fill="#8b5cf6" rx="2"/>
                        </g>
                        <g className="github-person-2">
                          <circle cx="0" cy="140" r="6" fill="#ec4899"/>
                          <rect x="-3" y="146" width="6" height="10" fill="#ec4899" rx="2"/>
                        </g>
                        <g className="github-person-3">
                          <circle cx="0" cy="140" r="6" fill="#22c55e"/>
                          <rect x="-3" y="146" width="6" height="10" fill="#22c55e" rx="2"/>
                        </g>
                      </svg>
                      
                      {/* Status Updates */}
                      <div className="welcome-showcase-status welcome-showcase-status--full">
                        <div className="github-notification-popup">
                          <span className="welcome-showcase-status-dot">●</span>
                          <span className="welcome-showcase-status-text">New resident moved in</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="welcome-showcase-caption">
                      Residents connect, share updates, and build community
                    </p>
                  </div>
                </div>

                {/* Parking Tile */}
                <div className="github-tile">
                  <div className="github-tile-bg"></div>
                  <div className="welcome-showcase-card">
                    <div className="welcome-showcase-header">
                      <div
                        className="welcome-showcase-icon-badge"
                        style={{ background: 'linear-gradient(to bottom right, #3b82f6, #22d3ee)' }}
                      >
                        <Car className="welcome-showcase-icon" />
                      </div>
                      <h3 className="welcome-showcase-title">Smart Parking</h3>
                    </div>
                    
                    {/* Animated Parking Lot */}
                    <div className="welcome-showcase-canvas">
                      <svg viewBox="0 0 300 150" className="welcome-showcase-svg">
                        {/* Parking Lines */}
                        <rect x="20" y="30" width="50" height="80" fill="none" stroke="#334155" strokeWidth="2"/>
                        <rect x="80" y="30" width="50" height="80" fill="none" stroke="#334155" strokeWidth="2" className="parking-slot-highlight"/>
                        <rect x="140" y="30" width="50" height="80" fill="none" stroke="#334155" strokeWidth="2"/>
                        <rect x="200" y="30" width="50" height="80" fill="none" stroke="#334155" strokeWidth="2"/>
                        
                        {/* Parking Guidance Lines for Available Slot */}
                        <g className="parking-guidance">
                          <line x1="105" y1="25" x2="105" y2="20" stroke="#22c55e" strokeWidth="2" opacity="0.8"/>
                          <line x1="100" y1="20" x2="110" y2="20" stroke="#22c55e" strokeWidth="2" opacity="0.8"/>
                          <text x="105" y="17" textAnchor="middle" className="welcome-svg-label-xs welcome-svg-label-green">PARK HERE</text>
                        </g>
                        
                        {/* Parked Cars */}
                        <g transform="translate(20, 30)">
                          <rect x="8" y="15" width="34" height="50" fill="#3b82f6" rx="3"/>
                          <rect x="10" y="20" width="30" height="8" fill="#1e3a8a" opacity="0.6" rx="1"/>
                          <rect x="10" y="52" width="30" height="8" fill="#1e3a8a" opacity="0.6" rx="1"/>
                          <rect x="6" y="28" width="4" height="8" fill="#1e293b" rx="1"/>
                          <rect x="40" y="28" width="4" height="8" fill="#1e293b" rx="1"/>
                          <rect x="6" y="50" width="4" height="8" fill="#1e293b" rx="1"/>
                          <rect x="40" y="50" width="4" height="8" fill="#1e293b" rx="1"/>
                        </g>
                        
                        <g transform="translate(140, 30)">
                          <rect x="8" y="15" width="34" height="50" fill="#22c55e" rx="3"/>
                          <rect x="10" y="20" width="30" height="8" fill="#1e3a8a" opacity="0.6" rx="1"/>
                          <rect x="10" y="52" width="30" height="8" fill="#1e3a8a" opacity="0.6" rx="1"/>
                          <rect x="6" y="28" width="4" height="8" fill="#1e293b" rx="1"/>
                          <rect x="40" y="28" width="4" height="8" fill="#1e293b" rx="1"/>
                          <rect x="6" y="50" width="4" height="8" fill="#1e293b" rx="1"/>
                          <rect x="40" y="50" width="4" height="8" fill="#1e293b" rx="1"/>
                        </g>
                        
                        {/* Realistic Car - Top-Down View (Bird's Eye) */}
                        <defs>
                          <linearGradient id="carBodyOrange" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fb923c"/>
                            <stop offset="50%" stopColor="#f97316"/>
                            <stop offset="100%" stopColor="#fb923c"/>
                          </linearGradient>
                        </defs>
                        
                        <g className="github-car-enter">
                          {/* Car Shadow */}
                          <ellipse cx="17" cy="27" rx="13" ry="21" fill="#000000" opacity="0.2"/>
                          
                          {/* Main Car Body */}
                          <rect x="5" y="4" width="24" height="46" fill="url(#carBodyOrange)" rx="3"/>
                          
                          {/* Hood (Front) */}
                          <rect x="7" y="5" width="20" height="10" fill="#ea580c" rx="1.5"/>
                          <line x1="12" y1="8" x2="22" y2="8" stroke="#dc2626" strokeWidth="0.5" opacity="0.5"/>
                          <line x1="12" y1="11" x2="22" y2="11" stroke="#dc2626" strokeWidth="0.5" opacity="0.5"/>
                          
                          {/* Front Windshield */}
                          <rect x="8" y="15" width="18" height="6" fill="#1e3a8a" opacity="0.6" rx="1"/>
                          <rect x="9" y="16" width="16" height="4" fill="#0f172a" opacity="0.4" rx="0.5"/>
                          <line x1="17" y1="15" x2="17" y2="21" stroke="#1f2937" strokeWidth="0.5"/>
                          
                          {/* Roof/Cabin */}
                          <rect x="6" y="21" width="22" height="12" fill="#ea580c" rx="1"/>
                          
                          {/* Side Windows */}
                          <rect x="7" y="22" width="5" height="10" fill="#1e3a8a" opacity="0.6" rx="0.5"/>
                          <rect x="22" y="22" width="5" height="10" fill="#1e3a8a" opacity="0.6" rx="0.5"/>
                          
                          {/* Door Panels */}
                          <line x1="7" y1="27" x2="12" y2="27" stroke="#f97316" strokeWidth="1.5"/>
                          <line x1="22" y1="27" x2="27" y2="27" stroke="#f97316" strokeWidth="1.5"/>
                          
                          {/* Rear Windshield */}
                          <rect x="8" y="33" width="18" height="5" fill="#1e3a8a" opacity="0.6" rx="1"/>
                          <rect x="9" y="34" width="16" height="3" fill="#0f172a" opacity="0.4" rx="0.5"/>
                          <line x1="17" y1="33" x2="17" y2="38" stroke="#1f2937" strokeWidth="0.5"/>
                          
                          {/* Trunk (Rear) */}
                          <rect x="7" y="38" width="20" height="10" fill="#ea580c" rx="1.5"/>
                          <line x1="12" y1="41" x2="22" y2="41" stroke="#dc2626" strokeWidth="0.5" opacity="0.5"/>
                          <line x1="12" y1="44" x2="22" y2="44" stroke="#dc2626" strokeWidth="0.5" opacity="0.5"/>
                          
                          {/* Front Headlights */}
                          <ellipse cx="9" cy="5.5" rx="2" ry="1.5" fill="#fef3c7" className="car-headlight"/>
                          <ellipse cx="25" cy="5.5" rx="2" ry="1.5" fill="#fef3c7" className="car-headlight"/>
                          
                          {/* Rear Taillights */}
                          <rect x="8" y="47" width="3" height="2" fill="#dc2626" rx="0.5"/>
                          <rect x="23" y="47" width="3" height="2" fill="#dc2626" rx="0.5"/>
                          
                          {/* Side Mirrors */}
                          <ellipse cx="3" cy="23" rx="2" ry="2.5" fill="#1f2937"/>
                          <ellipse cx="31" cy="23" rx="2" ry="2.5" fill="#1f2937"/>
                          
                          {/* Wheels - Front Left */}
                          <rect x="3" y="12" width="4" height="8" fill="#1e293b" rx="1"/>
                          <rect x="3.5" y="13" width="3" height="6" fill="#0f172a" rx="0.5"/>
                          
                          {/* Wheels - Front Right */}
                          <rect x="27" y="12" width="4" height="8" fill="#1e293b" rx="1"/>
                          <rect x="27.5" y="13" width="3" height="6" fill="#0f172a" rx="0.5"/>
                          
                          {/* Wheels - Rear Left */}
                          <rect x="3" y="34" width="4" height="8" fill="#1e293b" rx="1"/>
                          <rect x="3.5" y="35" width="3" height="6" fill="#0f172a" rx="0.5"/>
                          
                          {/* Wheels - Rear Right */}
                          <rect x="27" y="34" width="4" height="8" fill="#1e293b" rx="1"/>
                          <rect x="27.5" y="35" width="3" height="6" fill="#0f172a" rx="0.5"/>
                          
                          {/* Body Shine/Highlights */}
                          <ellipse cx="17" cy="15" rx="6" ry="2" fill="#ffffff" opacity="0.2"/>
                          <ellipse cx="17" cy="40" rx="5" ry="1.5" fill="#ffffff" opacity="0.15"/>
                          <rect x="10" y="25" width="14" height="1" fill="#ffffff" opacity="0.2" rx="0.5"/>
                        </g>
                        
                        {/* Parking Sensors/Distance Indicators */}
                        <g className="parking-sensors">
                          <circle cx="75" cy="70" r="3" className="sensor-pulse" fill="#22c55e"/>
                          <circle cx="115" cy="70" r="3" className="sensor-pulse" fill="#22c55e" style={{animationDelay: '0.3s'}}/>
                          <circle cx="155" cy="70" r="3" className="sensor-pulse" fill="#22c55e" style={{animationDelay: '0.6s'}}/>
                        </g>
                        
                        {/* Slot Status Indicators */}
                        <circle cx="45" cy="120" r="4" fill="#3b82f6"/>
                        <circle cx="105" cy="120" r="4" className="github-slot-available"/>
                        <circle cx="165" cy="120" r="4" fill="#22c55e"/>
                        <circle cx="225" cy="120" r="4" className="github-slot-available"/>
                        
                        {/* Labels */}
                        <text x="45" y="140" textAnchor="middle" className="welcome-svg-label-sm welcome-svg-label-muted">A1</text>
                        <text x="105" y="140" textAnchor="middle" className="welcome-svg-label-sm welcome-svg-label-green strong">A2</text>
                        <text x="165" y="140" textAnchor="middle" className="welcome-svg-label-sm welcome-svg-label-muted">A3</text>
                        <text x="225" y="140" textAnchor="middle" className="welcome-svg-label-sm welcome-svg-label-green strong">A4</text>
                      </svg>
                      
                      {/* Live Counter with Animation */}
                      <div className="welcome-showcase-status welcome-showcase-status--right">
                        <span className="welcome-showcase-status-label">Available: </span>
                        <span className="welcome-showcase-status-value github-counter-live">2</span>
                      </div>
                      
                      {/* Live Status Indicator */}
                      <div className="welcome-showcase-status welcome-showcase-status--left">
                        <span className="welcome-showcase-live-dot live-indicator"></span>
                        <span className="welcome-showcase-status-label">LIVE</span>
                      </div>
                    </div>
                    
                    <p className="welcome-showcase-caption">
                      Real-time parking availability and vehicle tracking
                    </p>
                  </div>
                </div>

                {/* Security Tile */}
                <div className="github-tile">
                  <div className="github-tile-bg"></div>
                  <div className="welcome-showcase-card">
                    <div className="welcome-showcase-header">
                      <div
                        className="welcome-showcase-icon-badge"
                        style={{ background: 'linear-gradient(to bottom right, #22c55e, #10b981)' }}
                      >
                        <Shield className="welcome-showcase-icon" />
                      </div>
                      <h3 className="welcome-showcase-title">Security Center</h3>
                    </div>
                    
                    {/* Animated Security Dashboard */}
                    <div className="welcome-showcase-canvas">
                      <svg viewBox="0 0 300 150" className="welcome-showcase-svg">
                        {/* Security Gate */}
                        <rect x="130" y="100" width="40" height="50" fill="#334155"/>
                        <rect x="125" y="95" width="50" height="8" fill="#475569"/>
                        
                        {/* Gate Barrier - Animated */}
                        <g className="github-gate-barrier">
                          <rect x="170" y="108" width="60" height="6" fill="#f97316" rx="2"/>
                          <circle cx="175" cy="111" r="3" fill="#fbbf24"/>
                        </g>
                        
                        {/* Entry/Exit Arrows */}
                        <path d="M 80 120 L 120 120" stroke="#22c55e" strokeWidth="2" className="github-arrow-in"/>
                        <path d="M 180 130 L 240 130" stroke="#3b82f6" strokeWidth="2" className="github-arrow-out"/>
                        
                        {/* Security Icons */}
                        <circle cx="60" cy="50" r="20" fill="#1e293b" stroke="#22c55e" strokeWidth="2"/>
                        <text x="60" y="55" textAnchor="middle" className="welcome-svg-label-lg welcome-svg-label-green">✓</text>
                        
                        <circle cx="150" cy="50" r="20" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" className="github-scan-ring"/>
                        <text x="150" y="55" textAnchor="middle" className="welcome-svg-label-md welcome-svg-label-accent">ID</text>
                        
                        <circle cx="240" cy="50" r="20" fill="#1e293b" stroke="#3b82f6" strokeWidth="2"/>
                        <text x="240" y="55" textAnchor="middle" className="welcome-svg-label-lg welcome-svg-label-blue">📹</text>
                      </svg>
                      
                      {/* Security Log */}
                      <div className="welcome-showcase-status welcome-showcase-status--full">
                        <div className="github-security-log">
                          <span className="welcome-showcase-status-label welcome-showcase-status-label--muted">Latest:</span>
                          <span className="welcome-showcase-status-value github-log-text">Entry approved - A-101</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="welcome-showcase-caption">
                      Secure access control and visitor management
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section id="stats" className="welcome-section welcome-section--stats">
          <div className="welcome-section-inner">
            <div className={`stats-card-new ${isDark ? 'stats-card-dark' : 'stats-card-light'}`}>
              {/* Animated border */}
              <div className="stats-card-border-new"></div>
              
              {/* Live indicator */}
              <div className="welcome-stats-live">
                <span className="welcome-stats-live-pulse">
                  <span className="welcome-stats-live-ring animate-ping"></span>
                  <span className="welcome-stats-live-dot"></span>
                </span>
                <span className="welcome-stats-live-text">LIVE DATA</span>
              </div>

              <div className="welcome-stats-header">
                <h3 className={`welcome-stats-title ${isDark ? 'is-dark' : 'is-light'}`}>Platform Statistics</h3>
                <p className={`welcome-stats-subtitle ${isDark ? 'is-dark' : 'is-light'}`}>Real-time numbers that speak for themselves</p>
              </div>
              
              <div className="welcome-stats-grid">
                {stats.map((stat, index) => (
                  <div key={index} className="stat-item-new welcome-stat-item">
                    <div 
                      className="stat-icon-wrapper-new"
                      style={{ background: isDark ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 15%, white)' }}
                    >
                      <stat.icon 
                        className="welcome-stat-icon" 
                        style={{ color: 'var(--accent-primary)' }}
                      />
                    </div>
                    <div className="welcome-stat-number stat-number-new">
                      <AnimatedCounter value={stat.value} duration={2000 + index * 300} />
                    </div>
                    <div className={`welcome-stat-label ${isDark ? 'is-dark' : 'is-light'}`}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="welcome-section welcome-section--cta">
          <div className="welcome-section-inner">
            <div className={`cta-card-new ${isDark ? '' : ''}`} style={isDark ? {} : { background: `linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-via), var(--accent-gradient-to))` }}>
              <div className={`cta-card-bg-new ${isDark ? '' : ''}`} style={isDark ? {} : { background: `linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 95%, white), color-mix(in srgb, var(--accent-secondary) 95%, white), color-mix(in srgb, var(--accent-gradient-to) 95%, white))`, backgroundSize: '200% 200%', animation: 'gradientShift 8s ease infinite' }}></div>
              <div className="welcome-cta-content">
                <div className={`welcome-cta-badge ${isDark ? 'is-dark' : 'is-light'}`}>
                  <CheckCircle className="welcome-cta-badge-icon" />
                  <span className="welcome-cta-badge-text">No credit card required</span>
                </div>
                <h2 className="welcome-cta-title">
                  Ready to Transform<br />
                  <span className="hero-gradient-text" style={isDark ? {} : { background: 'linear-gradient(135deg, #fff, #fef08a, #fff)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>Your Society?</span>
                </h2>
                <p className="welcome-cta-text">
                  Join thousands of societies already using our platform to streamline their operations
                </p>
                <div className="welcome-cta-actions">
                  <button
                    onClick={() => navigate('/login')}
                    className={`welcome-cta-primary ${isDark ? 'is-dark' : 'is-light'}`}
                    style={!isDark ? { color: 'var(--accent-primary)' } : {}}
                  >
                    <span className="welcome-cta-primary-content">
                      Start Now - It's Free
                      <ArrowRight className="welcome-cta-primary-icon" />
                    </span>
                  </button>
                  <button
                    onClick={() => navigate('/contact')}
                    className={`welcome-cta-secondary ${isDark ? 'is-dark' : 'is-light'}`}
                  >
                    <span className="welcome-cta-secondary-content">
                      <Phone className="welcome-cta-secondary-icon" />
                      Contact Sales
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          id="contact"
          className={`welcome-footer ${isDark ? 'is-dark' : 'is-light'}`}
          style={!isDark ? { borderColor: 'color-mix(in srgb, var(--accent-light) 50%, transparent)', background: 'linear-gradient(to top, color-mix(in srgb, var(--accent-light) 25%, transparent), transparent)' } : {}}
        >
          <div className="welcome-section-inner welcome-footer-inner">
            <div className="welcome-footer-grid">
              <div className="welcome-footer-brand">
                <div className="welcome-footer-logo" onClick={() => scrollToSection('hero')}>
                  <div 
                    className="welcome-footer-badge"
                    style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                  >
                    <Building2 className="welcome-footer-badge-icon" />
                  </div>
                  <span className={`welcome-footer-brand-name ${isDark ? 'is-dark' : 'is-light'}`}>SocietyHub</span>
                </div>
                <p className={`welcome-footer-text ${isDark ? 'is-dark' : 'is-light'}`}>
                  The complete digital solution for modern housing society management. Simplify operations, enhance communication.
                </p>
                <div className="welcome-footer-socials">
                  {[
                    { name: 'twitter', icon: <Twitter className="welcome-footer-social-icon" /> },
                    { name: 'github', icon: <Github className="welcome-footer-social-icon" /> },
                    { name: 'linkedin', icon: <Linkedin className="welcome-footer-social-icon" /> },
                  ].map((social) => (
                    <a 
                      key={social.name}
                      href="#" 
                      className={`social-icon-new ${isDark ? 'social-icon-dark' : 'social-icon-light'}`}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>

              {[
                { title: 'Product', links: [
                  { label: 'Features', action: () => scrollToSection('features') },
                  { label: 'Pricing', action: () => {} },
                  { label: 'Demo', action: () => {} },
                  { label: 'Updates', action: () => {} },
                ]},
                { title: 'Company', links: [
                  { label: 'About', action: () => navigate('/about') },
                  { label: 'Careers', action: () => {} },
                  { label: 'Blog', action: () => {} },
                  { label: 'Contact', action: () => navigate('/contact') },
                ]},
                { title: 'Legal', links: [
                  { label: 'Privacy Policy', action: () => navigate('/privacy') },
                  { label: 'Terms of Service', action: () => navigate('/terms') },
                  { label: 'Cookie Policy', action: () => {} },
                  { label: 'Help Center', action: () => {} },
                ]},
              ].map((section, i) => (
                <div key={i}>
                  <h4 className={`welcome-footer-title ${isDark ? 'is-dark' : 'is-light'}`}>{section.title}</h4>
                  <ul className="welcome-footer-links">
                    {section.links.map((link, j) => (
                      <li key={j}>
                        <button 
                          onClick={link.action} 
                          className={`footer-link-new welcome-footer-link ${isDark ? 'footer-link-dark' : 'footer-link-light'}`}
                        >
                          {link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Copyright */}
            <div className={`welcome-footer-bottom ${isDark ? 'is-dark' : 'is-light'}`}>
              <p className={`welcome-footer-copy ${isDark ? 'is-dark' : 'is-light'}`}>
                © 2026 SocietyHub. All rights reserved. Made with ❤️ for housing societies.
              </p>
              <div className="welcome-footer-actions">
                <button onClick={() => navigate('/privacy')} className={`welcome-footer-action ${isDark ? 'is-dark' : 'is-light'}`}>Privacy</button>
                <button onClick={() => navigate('/terms')} className={`welcome-footer-action ${isDark ? 'is-dark' : 'is-light'}`}>Terms</button>
                <button onClick={() => navigate('/contact')} className={`welcome-footer-action ${isDark ? 'is-dark' : 'is-light'}`}>Contact</button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
