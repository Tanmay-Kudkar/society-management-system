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
    <span ref={ref} className="tabular-nums">
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
    { icon: Building2, title: 'Society Management', description: 'Complete admin control for housing societies with real-time insights', color: 'from-blue-500 to-cyan-500' },
    { icon: Home, title: 'Flat Management', description: 'Track ownership, occupancy, and maintenance for every unit', color: 'from-purple-500 to-pink-500' },
    { icon: CreditCard, title: 'Bill & Payments', description: 'Automated maintenance bills with online payment integration', color: 'from-green-500 to-emerald-500' },
    { icon: Users, title: 'Tenant Portal', description: 'Self-service portal for tenants to raise requests and pay bills', color: 'from-orange-500 to-red-500' },
    { icon: Car, title: 'Vehicle Registry', description: 'Manage parking slots and vehicle registrations digitally', color: 'from-yellow-500 to-orange-500' },
    { icon: MessageSquare, title: 'Complaints & Tickets', description: 'Streamlined issue resolution with status tracking', color: 'from-indigo-500 to-purple-500' },
    { icon: Bell, title: 'Notices & Alerts', description: 'Broadcast important updates to all residents instantly', color: 'from-pink-500 to-rose-500' },
    { icon: Shield, title: 'Security & Access', description: 'Role-based permissions for admins, committees, and residents', color: 'from-teal-500 to-cyan-500' },
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
    <div className={`min-h-screen overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-900 text-white' : 'bg-gradient-to-b from-slate-50 via-white to-purple-50 text-gray-900'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? 'bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-100'}`}></div>
        
        {/* Animated gradient mesh */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-30' : 'opacity-50'}`}>
          <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${isDark ? 'from-purple-900/40' : 'from-violet-300/40'} via-transparent to-transparent animate-pulse-slow`}></div>
          <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] ${isDark ? 'from-blue-900/30' : 'from-fuchsia-300/30'} via-transparent to-transparent animate-pulse-slower`}></div>
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
            <div className="absolute top-10 left-5 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/15 to-cyan-400/15 rounded-full blur-3xl animate-floatSlow"></div>
            <div className="absolute top-1/3 left-1/2 w-80 h-80 bg-gradient-to-br from-pink-400/15 to-rose-400/15 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-1/3 left-20 w-72 h-72 bg-gradient-to-br from-amber-300/10 to-orange-300/10 rounded-full blur-3xl animate-floatSlow"></div>
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
        <div className="absolute bottom-0 left-0 right-0 h-64 overflow-hidden pointer-events-none hidden md:block">
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
                <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-1 h-6 ${isDark ? 'bg-slate-600' : 'bg-violet-400'}`}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                </div>
              )}
              {/* Roof */}
              <div className={`absolute -top-2 left-0 right-0 h-2 ${isDark ? 'bg-slate-700' : 'bg-violet-300'} rounded-t`}></div>
              {/* Windows grid */}
              <div className={`building-windows-grid ${isDark ? '' : 'building-windows-light'}`} style={{ '--floors': building.floors }}></div>
              {/* Building reflection */}
              <div className={`absolute inset-y-0 right-0 w-1/4 ${isDark ? 'bg-gradient-to-r from-transparent to-slate-700/20' : 'bg-gradient-to-r from-transparent to-white/30'}`}></div>
            </div>
          ))}
          {/* Ground with gradient */}
          <div className={`absolute bottom-0 left-0 right-0 h-4 ${isDark ? 'bg-gradient-to-t from-slate-950 via-slate-900 to-transparent' : 'bg-gradient-to-t from-violet-200 via-purple-100 to-transparent'}`}></div>
          {/* Road */}
          <div className={`absolute bottom-0 left-0 right-0 h-2 ${isDark ? 'bg-slate-800' : 'bg-violet-300'}`}>
            <div className={`absolute top-1/2 left-0 right-0 h-0.5 ${isDark ? 'bg-yellow-500/30' : 'bg-amber-400/60'}`} style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, currentColor 20px, currentColor 40px)' }}></div>
          </div>
        </div>

        {/* Grid overlay */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-[0.02]' : 'opacity-[0.03]'}`} 
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px),
                              linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
          <div className={`mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 transition-all duration-300 ${
            scrolled 
              ? isDark ? 'nav-glass-scrolled' : 'nav-glass-light-scrolled'
              : isDark ? 'nav-glass' : 'nav-glass-light'
          }`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer" onClick={() => scrollToSection('hero')}>
                <div className="relative">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity"></div>
                </div>
                <div className="flex flex-col">
                  <span className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-purple-200 to-pink-200' : 'bg-gradient-to-r from-gray-900 via-purple-700 to-pink-600'} bg-clip-text text-transparent`}>
                    SocietyHub
                  </span>
                  <span className={`text-[8px] sm:text-[10px] font-medium -mt-1 tracking-widest uppercase ${isDark ? 'text-purple-300/70' : 'text-purple-600/70'}`}>Management System</span>
                </div>
              </div>

              {/* Nav Links - Desktop */}
              <div className="hidden md:flex items-center gap-1 sm:gap-2">
                {[
                  { id: 'features', label: 'Features' },
                  { id: 'stats', label: 'Stats' },
                  { id: 'contact', label: 'Contact' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`nav-link-new ${activeNavItem === item.id ? (isDark ? 'nav-link-active-dark' : 'nav-link-active-light') : ''} ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Theme Toggle with Dropdown */}
                <div className="relative" ref={themeMenuRef}>
                  <button
                    onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                    className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-0 ${
                      isDark 
                        ? 'bg-slate-800/80 hover:bg-slate-700 text-yellow-400' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    aria-label="Theme options"
                  >
                    {!isManual ? <Monitor className="w-4 h-4 sm:w-5 sm:h-5" /> : isDark ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                  
                  {/* Theme Dropdown Menu */}
                  {themeMenuOpen && (
                    <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-2xl overflow-hidden z-50 transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-800 border border-white/10' 
                        : 'bg-white border border-gray-200'
                    }`}>
                      <div className="py-1">
                        <button
                          onClick={() => { resetToSystemTheme(); setThemeMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            !isManual 
                              ? (isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600') 
                              : (isDark ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100')
                          }`}
                        >
                          <Monitor className="w-4 h-4" />
                          <span>System</span>
                          {!isManual && <CheckCircle className="w-4 h-4 ml-auto" />}
                        </button>
                        <button
                          onClick={() => { setTheme('light'); setThemeMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isManual && theme === 'light' 
                              ? (isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600') 
                              : (isDark ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100')
                          }`}
                        >
                          <Sun className="w-4 h-4" />
                          <span>Light</span>
                          {isManual && theme === 'light' && <CheckCircle className="w-4 h-4 ml-auto" />}
                        </button>
                        <button
                          onClick={() => { setTheme('dark'); setThemeMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isManual && theme === 'dark' 
                              ? (isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600') 
                              : (isDark ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100')
                          }`}
                        >
                          <Moon className="w-4 h-4" />
                          <span>Dark</span>
                          {isManual && theme === 'dark' && <CheckCircle className="w-4 h-4 ml-auto" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`md:hidden p-2 rounded-xl transition-all focus:outline-none focus:ring-0 ${isDark ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* CTA Button - Desktop */}
                <button
                  onClick={() => navigate('/login')}
                  className={`hidden sm:flex btn-primary-new ${isDark ? 'btn-primary-dark' : 'btn-primary-light'}`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Login
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`md:hidden mx-2 mt-2 rounded-2xl overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } ${isDark ? 'bg-slate-800/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl shadow-lg'}`}>
            <div className="p-4 space-y-2">
              {[
                { id: 'features', label: 'Features', icon: Sparkles },
                { id: 'stats', label: 'Statistics', icon: Building2 },
                { id: 'contact', label: 'Contact', icon: Mail },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all focus:outline-none focus:ring-0 ${
                    activeNavItem === item.id 
                      ? 'bg-purple-500/20 text-purple-500' 
                      : isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
              <hr className={isDark ? 'border-slate-700' : 'border-gray-200'} />
              <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Key className="w-5 h-5" />
                Login to Dashboard
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="hero" className="min-h-screen flex items-center justify-center px-4 pt-24">
          <div className="max-w-6xl mx-auto text-center">
            {/* Trust Badge */}
            <div className={`transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className={`inline-flex items-center gap-3 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full mb-6 sm:mb-8 hover-lift transition-all ${isDark ? 'glass-badge' : 'bg-white/80 shadow-lg shadow-violet-500/10 border border-violet-200/50 backdrop-blur-sm'}`}>
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-slate-900 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-white">
                      {['S', 'M', 'R'][i]}
                    </div>
                  ))}
                </div>
                <div className={`h-4 w-px ${isDark ? 'bg-white/20' : 'bg-gray-300'}`}></div>
                <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Trusted by <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>500+</span> Housing Societies</span>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className={`text-4xl sm:text-5xl md:text-7xl font-black mb-4 sm:mb-6 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <span className={`block drop-shadow-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Your Society,</span>
              <span className="block hero-gradient-text">
                Simplified
              </span>
            </h1>

            {/* Subheading */}
            <p className={`text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto mb-8 sm:mb-12 transition-all duration-1000 delay-700 leading-relaxed px-4 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              The complete <span className="text-purple-500 font-semibold">digital ecosystem</span> for modern housing societies. 
              Manage bills, complaints, notices, and residents — all in one powerful platform.
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-1000 delay-900 px-4 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <button
                onClick={() => navigate('/login')}
                className={`w-full sm:w-auto btn-hero-primary-new group ${isDark ? '' : 'shadow-xl shadow-violet-500/25'}`}
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className={`w-full sm:w-auto btn-hero-secondary-new group ${isDark ? '' : 'border-violet-300 text-violet-700 hover:border-violet-500 hover:bg-violet-50'}`}
              >
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Quick Features */}
            <div className={`mt-12 sm:mt-16 flex flex-wrap justify-center gap-4 sm:gap-6 transition-all duration-1000 delay-1000 px-4 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {[
                { icon: CreditCard, text: 'Online Payments' },
                { icon: Bell, text: 'Instant Notices' },
                { icon: MessageSquare, text: 'Quick Support' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2 transition-colors group ${isDark ? 'text-gray-400 hover:text-white' : 'text-violet-600 hover:text-violet-800'}`}>
                  <div className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-white/5 group-hover:bg-purple-500/20' : 'bg-violet-100 group-hover:bg-violet-200'}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Scroll Indicator */}
            <div className={`mt-16 sm:mt-20 transition-all duration-1000 delay-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <button 
                onClick={(e) => { e.currentTarget.blur(); scrollToSection('features'); }} 
                className={`inline-flex flex-col items-center transition-colors group focus:outline-none focus:ring-0 focus:border-none ${isDark ? 'text-gray-400 hover:text-white' : 'text-violet-500 hover:text-violet-700'}`}
                style={{ outline: 'none', border: 'none' }}
              >
                <span className="text-sm mb-2 group-hover:text-violet-600 transition-colors">Explore Features</span>
                <div className="scroll-indicator">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-32 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-20">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isDark ? 'glass-badge' : 'bg-gradient-to-r from-violet-100 to-fuchsia-100 border border-violet-200/50'}`}>
                <Sparkles className={`w-4 h-4 ${isDark ? 'text-purple-500' : 'text-violet-600'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-violet-700'}`}>Powerful Features</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 sm:mb-6">
                <span className={isDark ? 'text-white' : 'text-gray-900'}>Everything Your </span>
                <span className="hero-gradient-text">Society Needs</span>
              </h2>
              <p className={`text-lg sm:text-xl max-w-2xl mx-auto px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                A complete suite of tools designed specifically for housing society management
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`feature-card-new group ${isDark ? 'feature-card-dark' : 'feature-card-light'}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="feature-card-glow-new"></div>
                  <div className="relative z-10">
                    <div className={`feature-icon-new bg-gradient-to-br ${feature.color}`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`text-lg font-bold mb-2 transition-colors ${isDark ? 'text-white group-hover:text-purple-300' : 'text-gray-900 group-hover:text-purple-600'}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-20 sm:py-32 px-4">
          <div className="max-w-5xl mx-auto">
            <div className={`stats-card-new ${isDark ? 'stats-card-dark' : 'stats-card-light'}`}>
              {/* Animated border */}
              <div className="stats-card-border-new"></div>
              
              {/* Live indicator */}
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2 z-10">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs text-green-500 font-bold tracking-wider">LIVE DATA</span>
              </div>

              <div className="text-center mb-8 sm:mb-12">
                <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Platform Statistics</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Real-time numbers that speak for themselves</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="stat-item-new group">
                    <div className={`stat-icon-wrapper-new ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 group-hover:text-pink-500 transition-colors" />
                    </div>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black stat-number-new">
                      <AnimatedCounter value={stat.value} duration={2000 + index * 300} />
                    </div>
                    <div className={`font-medium text-xs sm:text-sm uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-32 px-4">
          <div className="max-w-5xl mx-auto">
            <div className={`cta-card-new ${isDark ? '' : 'shadow-2xl'}`}>
              <div className={`cta-card-bg-new ${isDark ? '' : 'from-purple-500 to-pink-500'}`}></div>
              <div className="relative z-10 text-center px-4">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 sm:mb-8 ${isDark ? 'bg-white/10' : 'bg-white/20'}`}>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white">No credit card required</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 sm:mb-6 text-white">
                  Ready to Transform<br />
                  <span className={isDark ? 'hero-gradient-text' : 'text-yellow-300'}>Your Society?</span>
                </h2>
                <p className="text-lg sm:text-xl text-white/80 mb-8 sm:mb-10 max-w-2xl mx-auto">
                  Join thousands of societies already using our platform to streamline their operations
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto btn-cta-primary-new group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Start Now - It's Free
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform" />
                    </span>
                  </button>
                  <button
                    onClick={() => navigate('/contact')}
                    className="w-full sm:w-auto btn-cta-secondary-new"
                  >
                    <Phone className="w-5 h-5" />
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" className={`py-12 sm:py-16 px-4 border-t transition-colors ${isDark ? 'border-white/10 bg-gradient-to-t from-slate-950 to-transparent' : 'border-violet-200/50 bg-gradient-to-t from-violet-100/50 to-transparent'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-3 mb-4 sm:mb-6 group cursor-pointer" onClick={() => scrollToSection('hero')}>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>SocietyHub</span>
                </div>
                <p className={`text-sm mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  The complete digital solution for modern housing society management. Simplify operations, enhance communication.
                </p>
                <div className="flex items-center gap-3">
                  {[
                    { name: 'twitter', icon: <Twitter className="w-4 h-4" /> },
                    { name: 'github', icon: <Github className="w-4 h-4" /> },
                    { name: 'linkedin', icon: <Linkedin className="w-4 h-4" /> },
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
                  <h4 className={`font-bold mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{section.title}</h4>
                  <ul className="space-y-3 sm:space-y-4">
                    {section.links.map((link, j) => (
                      <li key={j}>
                        <button 
                          onClick={link.action} 
                          className={`footer-link-new text-left focus:outline-none focus:ring-0 ${isDark ? 'footer-link-dark' : 'footer-link-light'}`}
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
            <div className={`pt-6 sm:pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <p className={`text-sm text-center sm:text-left ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                © 2026 SocietyHub. All rights reserved. Made with ❤️ for housing societies.
              </p>
              <div className="flex items-center gap-4 sm:gap-6 text-sm">
                <button onClick={() => navigate('/privacy')} className={`transition-colors focus:outline-none focus:ring-0 ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Privacy</button>
                <button onClick={() => navigate('/terms')} className={`transition-colors focus:outline-none focus:ring-0 ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Terms</button>
                <button onClick={() => navigate('/contact')} className={`transition-colors focus:outline-none focus:ring-0 ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Contact</button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
