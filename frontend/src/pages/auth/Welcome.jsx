import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2, Shield, Users, CreditCard, Bell, ArrowRight, CheckCircle, ChevronDown, Car, Phone, MessageSquare, Key, Sparkles, Mail } from 'lucide-react'
import { enquiryApi } from '../../../../api'
import clsx from 'clsx'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'
import PublicSweepButton from '../../components/PublicSweepButton'
import PublicOutlineButton from '../../components/PublicOutlineButton'

import googlePlayBtn from '../../assets/icons/Get-it-on-Google-Play.svg'
import appStoreBtn from '../../assets/icons/Download-on-app-store.svg'
import twitterIcon from '../../assets/icons/twitter-logo.svg'
import youtubeIcon from '../../assets/icons/youtube.svg'
import linkedinIcon from '../../assets/icons/linkedin.svg'
import githubIcon from '../../assets/icons/github.svg'

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
  const [isLoaded, setIsLoaded] = useState(false)
  const [showHeroLeft, setShowHeroLeft] = useState(false)
  const [showHeroRight, setShowHeroRight] = useState(false)

  const [enrollName, setEnrollName] = useState('')
  const [enrollPhone, setEnrollPhone] = useState('')
  const [enrollReason, setEnrollReason] = useState('')
  const [enrollError, setEnrollError] = useState('')
  const [enrollSubmitting, setEnrollSubmitting] = useState(false)
  const [enrollSubmitted, setEnrollSubmitted] = useState(false)

  useEffect(() => {
    setIsLoaded(true)

    const leftTimer = setTimeout(() => setShowHeroLeft(true), 100)
    const rightTimer = setTimeout(() => setShowHeroRight(true), 220)

    return () => {
      clearTimeout(leftTimer)
      clearTimeout(rightTimer)
    }
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

  // Scroll-reveal refs
  const [featRef, featVisible] = useScrollReveal()
  const [statsRef, statsVisible] = useScrollReveal()
  const [ctaRef, ctaVisible] = useScrollReveal()

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
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
    <div className="landing-page min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-x-hidden">
      <PublicNavbar
        loaded={isLoaded}
        onBrandClick={() => scrollTo("hero")}
        navItems={[
          { label: "About Us", to: "/about" },
          { label: "Demo", to: "/demo" },
          { label: "Pricing", to: "/pricing" },
          { label: "Contact", to: "/contact" },
        ]}
        showAuthButtons={false}
        maxWidthClass="max-w-[1240px]"
        linksBreakpoint="lg"
        themeDesktopOnly={false}
      />

      {/* Hero */}
      <section
        id="hero"
        className="relative scroll-mt-28 overflow-hidden bg-[var(--bg-primary)] px-4 pb-14 pt-[6.5rem] transition-colors duration-300 sm:px-6 sm:pb-20 sm:pt-[7.5rem] md:pt-[8.5rem]"
      >
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, color-mix(in srgb, var(--border-default) 75%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--border-default) 75%, transparent) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
              maskImage:
                "radial-gradient(circle at 50% 30%, rgba(0,0,0,0.8), transparent 85%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-[1240px] items-center gap-8 sm:gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div
              className={clsx(
                "inline-flex items-center gap-2.5 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_5%,transparent)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)] shadow-sm backdrop-blur-sm transition-[transform,opacity] duration-500 sm:text-xs",
                showHeroLeft
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0",
              )}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-primary)] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
              </span>
              Trusted by communities across India
            </div>

            <h1
              className={clsx(
                "mt-8 text-[clamp(2rem,6.8vw,4.5rem)] font-[950] leading-[1.08] tracking-tight text-[var(--text-primary)] transition-[transform,opacity] duration-500 sm:mt-7 sm:leading-[1.05]",
                showHeroLeft
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0",
              )}
            >
              One platform to run
              <br />
              <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[#3b82f6] bg-clip-text text-transparent drop-shadow-sm">
                your entire society
              </span>
            </h1>

            <p
              className={clsx(
                "mt-7 max-w-xl text-[1rem] leading-relaxed font-medium text-[var(--text-secondary)] transition-[transform,opacity] duration-500 sm:mt-8 sm:text-[1.15rem]",
                showHeroLeft
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0",
              )}
            >
              Visitor logs, maintenance billing, complaints, notices, and member
              communication in one secure dashboard built for modern committees
              and residents.
            </p>

            <div className="mt-9 flex flex-col gap-4 transition-all duration-500 sm:mt-10 sm:flex-row">
              <PublicSweepButton
                onClick={() => scrollTo("enroll")}
                className="flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-8 text-[0.95rem] sm:text-[1.05rem] font-bold text-white transition-all duration-300 active:scale-95"
              >
                Enroll your society
                <ArrowRight className="h-5 w-5 opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
              </PublicSweepButton>

              <PublicOutlineButton
                onClick={() => navigate("/login")}
                className="flex h-14 w-full sm:w-auto items-center justify-center gap-2 px-8 text-[0.95rem] sm:text-[1.05rem] font-bold active:scale-95 rounded-2xl"
              >
                Society Login
                <Key className="h-5 w-5 text-[var(--text-secondary)]" />
              </PublicOutlineButton>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                { title: "Fast Onboarding", value: "48 hrs avg go-live" },
                {
                  title: "Resident Satisfaction",
                  value: "4.8/5 support score",
                },
                { title: "Billing Automation", value: "Up to 90% less work" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.25rem] border border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[color-mix(in_srgb,var(--bg-card)_60%,transparent)] p-5 shadow-sm backdrop-blur-md transition-all hover:border-[var(--accent-primary)] hover:shadow-md"
                >
                  <p className="text-[0.65rem] font-[800] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1">
                    {item.title}
                  </p>
                  <p className="text-[0.95rem] font-bold text-[var(--text-primary)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={clsx(
              "w-full perspective-1000 transition-[transform,opacity] duration-500",
              showHeroRight
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0",
            )}
          >
            {enrollSubmitted ? (
              <div className="group relative overflow-hidden rounded-[2.5rem] border border-[color-mix(in_srgb,var(--border-default)_40%,transparent)] bg-[linear-gradient(160deg,color-mix(in_srgb,#10b981_10%,var(--bg-card))_0%,color-mix(in_srgb,var(--bg-card)_95%,transparent)_100%)] p-10 text-center shadow-[0_24px_64px_-12px_rgba(16,185,129,0.15)] backdrop-blur-xl transition-all hover:shadow-[0_32px_80px_-12px_rgba(16,185,129,0.25)]">
                <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_12px_24px_rgba(16,185,129,0.3)]">
                  <CheckCircle size={36} className="text-white" />
                </div>
                <div className="relative z-10">
                  <p className="text-2xl font-[900] tracking-tight text-[var(--text-primary)]">
                    Enquiry Received
                  </p>
                  <p className="mt-3 text-[1.05rem] font-medium text-[var(--text-secondary)]">
                    We'll reach out to{" "}
                    <span className="font-bold text-[var(--text-primary)]">
                      +91 {enrollPhone}
                    </span>{" "}
                    within 24 hours.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEnrollSubmitted(false);
                    setEnrollName("");
                    setEnrollPhone("");
                    setEnrollReason("");
                  }}
                  className="mt-8 rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)]"
                >
                  Submit another enquiry
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleEnrollSubmit}
                id="enroll"
                className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-[color-mix(in_srgb,var(--accent-primary)_20%,var(--border-default))] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--bg-card)_90%,var(--accent-primary)_10%)_0%,color-mix(in_srgb,var(--bg-card)_95%,transparent)_100%)] p-6 sm:p-10 shadow-[0_24px_64px_-12px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)] backdrop-blur-xl"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,color-mix(in_srgb,var(--accent-primary)_8%,transparent)_0%,transparent_50%)] pointer-events-none" />

                <div className="relative z-10 mb-8 sm:mb-10">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] px-3 py-1.5 text-[0.85rem] font-bold text-[var(--accent-primary)]">
                    <Building2 size={16} className="shrink-0" />
                    <span className="leading-none tracking-tight">Enroll Society</span>
                  </div>
                  <p className="mt-4 text-[0.95rem] sm:text-[1rem] font-medium leading-relaxed text-[var(--text-secondary)]">
                    Fill in your details and our growth team will contact you
                    within 24 hours.
                  </p>
                </div>

                <div className="relative z-10 grid gap-5 sm:gap-6">
                  <div className="grid gap-2">
                    <label className="text-[0.85rem] font-bold text-[var(--text-primary)]">
                      Full Name
                    </label>
                    <input
                      value={enrollName}
                      onChange={(e) => setEnrollName(e.target.value)}
                      placeholder="Enter full name"
                      autoComplete="name"
                      className="peer h-14 w-full rounded-2xl border-2 border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[var(--bg-primary)] px-5 text-[1rem] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-[border-color,box-shadow,background-color] duration-300 ease-out focus:border-[var(--accent-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)]"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-[0.85rem] font-bold text-[var(--text-primary)]">
                      Phone Number
                    </label>
                      <div className="flex flex-row gap-3 sm:items-center">
                        <div className="flex h-14 w-[75px] sm:w-[90px] items-center justify-center rounded-2xl border-2 border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[color-mix(in_srgb,var(--bg-primary)_80%,transparent)] text-[1rem] font-bold text-[var(--text-primary)] shrink-0">
                        +91
                      </div>
                      <input
                        value={enrollPhone}
                        onChange={(e) =>
                          setEnrollPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        placeholder="10-digit number"
                        type="tel"
                        inputMode="tel"
                        maxLength={10}
                        autoComplete="tel"
                        className="peer h-14 w-full rounded-2xl border-2 border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[var(--bg-primary)] px-5 text-[1rem] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-[border-color,box-shadow,background-color] duration-300 ease-out focus:border-[var(--accent-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-[0.85rem] font-bold text-[var(--text-primary)]">
                      Select Reason
                    </label>
                    <div className="relative">
                      <select
                        value={enrollReason}
                        onChange={(e) => setEnrollReason(e.target.value)}
                        className="peer h-14 w-full appearance-none rounded-2xl border-2 border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[var(--bg-primary)] px-5 text-[1rem] font-medium text-[var(--text-primary)] transition-[border-color,box-shadow,background-color] duration-300 ease-out focus:border-[var(--accent-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)]"
                      >
                        <option value="">Select reason</option>
                        <option value="DEMO">Request a demo</option>
                        <option value="ONBOARDING">
                          New society onboarding
                        </option>
                        <option value="PRICING">Pricing enquiry</option>
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-transform peer-focus:rotate-180"
                        size={20}
                      />
                    </div>
                  </div>

                  <PublicSweepButton
                    type="submit"
                    disabled={enrollSubmitting}
                    className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] text-[1.1rem] font-bold text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {enrollSubmitting
                      ? "Submitting..."
                      : "Complete Enrollment"}
                    {!enrollSubmitting && (
                      <ArrowRight className="h-5 w-5 opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                    )}
                  </PublicSweepButton>
                </div>

                {enrollError && (
                  <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm font-bold text-red-500">
                    {enrollError}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </section>

      <>
      {/* Features */}
      <section
        id="features"
        className="cv-auto relative scroll-mt-28 overflow-hidden px-4 py-16 sm:px-6 sm:py-28"
        ref={featRef}
        style={{
          background:
            "color-mix(in srgb, var(--accent-primary) 3%, var(--bg-primary))",
        }}
      >
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[radial-gradient(circle_at_70%_30%,color-mix(in_srgb,var(--accent-primary)_5%,transparent)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative z-10">
          <div
            className={clsx(
              "text-center mb-20 transition-all duration-[800ms] ease-out",
              featVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10",
            )}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)]">
              <Sparkles
                size={14}
                className="text-[var(--accent-primary)] animate-pulse"
              />
              <span className="text-sm font-[800] uppercase tracking-[0.15em] text-[var(--accent-primary)]">
                Advanced Ecosystem
              </span>
            </div>

            <h2 className="text-[clamp(2.2rem,5vw,3.25rem)] font-[950] tracking-tighter text-[var(--text-primary)] mb-6 leading-[1.1]">
              Everything Your{" "}
              <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[#3b82f6] bg-clip-text text-transparent">
                Society Needs
              </span>
            </h2>
            <p className="text-[1.2rem] font-medium text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              A military-grade suite of digital tools designed to bring 100%
              transparency and automation to housing communities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className={clsx(
                  "group relative p-8 bg-[var(--bg-card)] border border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] rounded-[2rem] transition-all duration-500 overflow-hidden",
                  "hover:-translate-y-3 hover:border-[color-mix(in_srgb,var(--accent-primary)_40%,transparent)] hover:shadow-[0_30px_60px_-15px_color-mix(in_srgb,var(--accent-primary)_18%,transparent)]",
                  featVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12",
                )}
                style={{
                  transitionDelay: featVisible ? `${i * 100}ms` : "0ms",
                }}
              >
                {/* Individual card hover background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,color-mix(in_srgb,var(--accent-primary)_5%,transparent)_0%,transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div
                  className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6"
                  style={{
                    background: `linear-gradient(135deg, ${f.color}, color-mix(in srgb, ${f.color} 60%, black))`,
                    boxShadow: `0 12px 24px -6px color-mix(in srgb, ${f.color} 40%, transparent)`,
                  }}
                >
                  <f.icon size={28} className="text-white drop-shadow-sm" />
                </div>

                <h3 className="relative z-10 text-[1.4rem] font-[900] tracking-tight text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent-primary)] transition-colors duration-300">
                  {f.title}
                </h3>

                <p className="relative z-10 text-[1.05rem] leading-relaxed text-[var(--text-secondary)] font-medium">
                  {f.desc}
                </p>

                {/* Decorative corner tag */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                  <f.icon size={100} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        id="stats"
        className="cv-auto relative scroll-mt-28 px-4 py-16 sm:px-6 sm:py-28"
        ref={statsRef}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--accent-primary)_4%,transparent)_0%,transparent_70%)] opacity-60 pointer-events-none" />

        <div className="relative mx-auto max-w-[1200px]">
          <div
            className={clsx(
              "text-center mb-16 transition-all duration-[800ms] ease-out",
              statsVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12",
            )}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] px-4 py-1.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-primary)] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-primary)]"></span>
              </span>
              <span className="text-xs font-[800] uppercase tracking-widest text-[var(--accent-primary)]">
                Our Impact
              </span>
            </div>

            <h3 className="mb-5 text-[clamp(2.2rem,5vw,3.25rem)] font-[950] tracking-tighter text-[var(--text-primary)] leading-[1.1]">
              Numbers That{" "}
              <span className="bg-gradient-to-br from-[var(--accent-primary)] to-[#60a5fa] bg-clip-text text-transparent">
                Speak Volumes
              </span>
            </h3>
            <p className="mx-auto max-w-2xl text-[1.2rem] font-medium leading-relaxed text-[var(--text-secondary)]">
              Real-time statistics from our rapidly expanding ecosystem of
              digital communities and empowered societies.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={i}
                className={clsx(
                  "group relative overflow-hidden rounded-[2rem] border border-[color-mix(in_srgb,var(--accent-primary)_20%,var(--border-default))] bg-[var(--bg-card)] p-8 text-center transition-all duration-500 ease-out",
                  "hover:-translate-y-2 hover:border-[color-mix(in_srgb,var(--accent-primary)_50%,transparent)] hover:shadow-[0_24px_48px_-12px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)]",
                  statsVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12",
                )}
                style={{
                  transitionDelay: statsVisible ? `${i * 150}ms` : "0ms",
                }}
              >
                {/* Glow layer on hover */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,color-mix(in_srgb,var(--accent-primary)_8%,transparent)_0%,transparent_50%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative z-10 flex h-full flex-col items-center justify-center gap-1">
                  <div className="mb-1 text-[3.5rem] font-[900] tracking-tighter text-[var(--text-primary)] transition-transform duration-500 group-hover:scale-110">
                    <span className="bg-gradient-to-br from-[var(--text-primary)] via-[var(--accent-primary)] to-[#3b82f6] bg-[length:200%_auto] bg-clip-text text-transparent transition-all duration-500 group-hover:bg-right-bottom">
                      {s.value}
                    </span>
                  </div>

                  <div className="h-1.5 w-10 rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] transition-all duration-500 group-hover:w-16 group-hover:bg-[var(--accent-primary)]" />

                  <span className="mt-3 text-[0.95rem] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)] transition-colors duration-300 group-hover:text-[var(--text-primary)]">
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cv-auto relative px-6 py-24" ref={ctaRef}>
        <div className="mx-auto max-w-[1100px]">
          <div
            className={clsx(
              "group relative overflow-hidden rounded-[2.2rem] border border-[color-mix(in_srgb,#3b82f6_20%,transparent)] bg-[linear-gradient(135deg,#e0f2fe_0%,#dbeafe_50%,#eff6ff_100%)] px-8 py-14 text-center shadow-[0_36px_80px_-26px_rgba(59,130,246,0.15)] transition-all duration-700 sm:px-10 sm:py-16 dark:border-[color-mix(in_srgb,#60a5fa_40%,#1e3a8a)] dark:bg-[linear-gradient(150deg,#0f172a_0%,#102a56_55%,#0b1b34_100%)] dark:shadow-[0_36px_80px_-26px_rgba(30,64,175,0.45)]",
              ctaVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.96]",
            )}
          >
            {/* Atmospheric background */}
            <div
              className="absolute inset-0 opacity-[0.4] dark:opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, rgba(59,130,246,0.15) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            {/* Top Right Corner Circle */}
            <div className="pointer-events-none absolute -right-[150px] -top-[150px] h-[350px] w-[350px] rounded-full bg-blue-400/20 dark:bg-blue-500/20 mix-blend-multiply dark:mix-blend-screen transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.4]" />
            {/* Bottom Left Corner Circle */}
            <div className="pointer-events-none absolute -bottom-[150px] -left-[150px] h-[350px] w-[350px] rounded-full bg-sky-400/25 dark:bg-cyan-500/20 mix-blend-multiply dark:mix-blend-screen transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.4]" />

            <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(to_top,rgba(255,255,255,0.4),transparent)] dark:bg-[linear-gradient(to_top,rgba(2,6,23,0.45),transparent)]" />

            <div className="relative z-10">
              <div className="mx-auto mb-7 flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.2rem] bg-[#facc15] shadow-[0_14px_30px_rgba(250,204,21,0.35)] transition-transform duration-500 will-change-transform group-hover:-translate-y-1 group-hover:scale-105">
                <Building2 className="h-8 w-8 text-[#0f172a]" />
              </div>

              <h2 className="mb-4 text-[clamp(1.8rem,6vw,3.15rem)] font-[950] leading-[1.1] sm:leading-[1.06] tracking-tight text-slate-900 dark:text-white">
                Ready to <span className="text-[#3b82f6]">Transform</span> Your Society?
              </h2>

              <p className="mx-auto mb-10 max-w-[640px] text-[1rem] sm:text-[1.15rem] font-medium leading-relaxed text-slate-600 dark:text-slate-200 px-2 sm:px-0">
                Join 500+ forward-thinking communities already using SocietyHub to simplify their daily operations.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row px-2">
                <PublicSweepButton
                  onClick={() => navigate("/login")}
                  className="flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#3b82f6] px-9 text-[1rem] sm:text-[1.05rem] font-[800] text-white transition-all duration-300 hover:bg-[#2563eb] active:scale-95 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.4)]"
                  sweepClassName="bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)]"
                >
                  Get Started Now
                  <ArrowRight className="h-5 w-5 opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                </PublicSweepButton>

                <PublicOutlineButton
                  onClick={() => navigate("/pricing")}
                  className="flex h-14 w-full sm:w-auto items-center justify-center rounded-xl border border-blue-200 bg-blue-50/50 px-9 text-[1rem] sm:text-[1.05rem] font-[800] text-blue-700 backdrop-blur-sm transition-all duration-300 hover:border-blue-300 hover:bg-blue-100/50 active:scale-95 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:border-white/30 dark:hover:bg-white/10"
                  sweepClassName="bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)]"
                >
                  View Pricing
                </PublicOutlineButton>
              </div>

              <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-center gap-y-10 sm:gap-x-12 border-t border-blue-200/50 pt-10 dark:border-white/10">
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-[2.2rem] sm:text-[2.6rem] font-[950] tracking-tighter text-slate-900 leading-none dark:text-white">14-Day</span>
                  <span className="mt-2 text-[0.7rem] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Free Trial</span>
                </div>
                <div className="hidden h-10 w-px bg-blue-200/50 dark:bg-white/10 sm:block" />
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-[2.2rem] sm:text-[2.6rem] font-[950] tracking-tighter text-slate-900 leading-none dark:text-white">24/7</span>
                  <span className="mt-2 text-[0.7rem] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Expert Support</span>
                </div>
                <div className="hidden h-10 w-px bg-blue-200/50 dark:bg-white/10 sm:block" />
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-[2.2rem] sm:text-[2.6rem] font-[950] tracking-tighter text-slate-900 leading-none dark:text-white">99.9%</span>
                  <span className="mt-2 text-[0.7rem] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
      </>
    </div>
  );
}


