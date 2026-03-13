import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2, Shield, Users, CreditCard, Bell, ArrowRight, CheckCircle, ChevronDown, Car, Phone, MessageSquare, Key, Sparkles, Mail } from 'lucide-react'
import { enquiryApi } from '../../../../api'
import clsx from 'clsx'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'

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
          { label: "Features", onClick: () => scrollTo("features") },
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
        className="relative scroll-mt-28 overflow-hidden px-4 pb-14 pt-20 transition-colors duration-300 sm:px-6 sm:pb-20 sm:pt-24 md:pt-28"
        style={{
          background:
            "radial-gradient(circle at 8% 10%, color-mix(in srgb, var(--accent-primary) 18%, transparent), transparent 45%), radial-gradient(circle at 88% 20%, color-mix(in srgb, #0ea5e9 16%, transparent), transparent 40%), var(--bg-primary)",
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 left-[-10%] h-[360px] w-[360px] rounded-full bg-blue-500/15 blur-3xl" />
          <div className="absolute right-[-8%] top-[12%] h-[320px] w-[320px] rounded-full bg-cyan-400/10 blur-3xl" />
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
                "inline-flex items-center gap-2.5 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_5%,transparent)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)] shadow-sm backdrop-blur-sm transition-all duration-500 sm:text-xs",
                isLoaded
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
                "mt-6 text-[clamp(2rem,6.8vw,4.5rem)] font-[950] leading-[1.05] tracking-tight text-[var(--text-primary)] transition-all duration-500",
                isLoaded
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
                "mt-6 max-w-xl text-[1rem] leading-relaxed font-medium text-[var(--text-secondary)] transition-all duration-500 sm:text-[1.15rem]",
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0",
              )}
            >
              Visitor logs, maintenance billing, complaints, notices, and member
              communication in one secure dashboard built for modern committees
              and residents.
            </p>

            <div
              className={clsx(
                "mt-8 flex flex-wrap gap-4 transition-all duration-500",
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0",
              )}
              style={{ transitionDelay: "120ms" }}
            >
              <button
                onClick={() => scrollTo("enroll")}
                className="group relative flex h-14 w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--accent-primary)] px-8 text-[1.05rem] font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_color-mix(in_srgb,var(--accent-primary)_40%,transparent)] active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Enroll your society
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] transition-transform duration-500 group-hover:translate-x-full" />
              </button>

              <button
                onClick={() => navigate("/login")}
                className="flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--bg-card)_85%,transparent)] px-8 text-[1.05rem] font-bold text-[var(--text-primary)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-primary)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_5%,transparent)] active:scale-95"
              >
                Society Login
                <Key className="h-5 w-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
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
                  className="rounded-[1.25rem] border border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[color-mix(in_srgb,var(--bg-card)_60%,transparent)] p-4 shadow-sm backdrop-blur-md"
                >
                  <p className="text-[0.7rem] font-[800] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[0.9rem] font-bold text-[var(--text-primary)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={clsx(
              "w-full perspective-1000 transition-all duration-700",
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0",
            )}
            style={{ transitionDelay: "200ms" }}
          >
            {enrollSubmitted ? (
              <div className="group relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-[linear-gradient(160deg,color-mix(in_srgb,#10b981_10%,var(--bg-card))_0%,color-mix(in_srgb,var(--bg-card)_95%,transparent)_100%)] p-10 text-center shadow-[0_24px_64px_-12px_rgba(16,185,129,0.15)] backdrop-blur-xl transition-all hover:shadow-[0_32px_80px_-12px_rgba(16,185,129,0.25)] border-[color-mix(in_srgb,var(--border-default)_40%,transparent)]">
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
                className="relative overflow-hidden rounded-[2.5rem] border border-[color-mix(in_srgb,var(--accent-primary)_20%,var(--border-default))] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--bg-card)_90%,var(--accent-primary)_10%)_0%,color-mix(in_srgb,var(--bg-card)_95%,transparent)_100%)] p-8 shadow-[0_24px_64px_-12px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)] backdrop-blur-xl sm:p-10"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,color-mix(in_srgb,var(--accent-primary)_8%,transparent)_0%,transparent_50%)] pointer-events-none" />

                <div className="relative z-10 mb-8">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] px-3 py-1.5 text-[0.85rem] font-bold text-[var(--accent-primary)]">
                    <Building2 size={16} />
                    Enroll Society
                  </div>
                  <p className="mt-4 text-[1rem] font-medium leading-relaxed text-[var(--text-secondary)]">
                    Fill in your details and our growth team will contact you
                    within 24 hours.
                  </p>
                </div>

                <div className="relative z-10 grid gap-5">
                  <div className="grid gap-2">
                    <label className="text-[0.85rem] font-bold text-[var(--text-primary)]">
                      Full Name
                    </label>
                    <input
                      value={enrollName}
                      onChange={(e) => setEnrollName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      autoComplete="name"
                      className="peer h-14 w-full rounded-2xl border-2 border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[var(--bg-primary)] px-5 text-[1rem] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[var(--accent-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)]"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-[0.85rem] font-bold text-[var(--text-primary)]">
                      Phone Number
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[90px_1fr]">
                      <div className="flex h-14 items-center justify-center rounded-2xl border-2 border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[color-mix(in_srgb,var(--bg-primary)_80%,transparent)] text-[1rem] font-bold text-[var(--text-primary)]">
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
                        className="peer h-14 w-full rounded-2xl border-2 border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[var(--bg-primary)] px-5 text-[1rem] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[var(--accent-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)]"
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
                        className="peer h-14 w-full appearance-none rounded-2xl border-2 border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[var(--bg-primary)] px-5 text-[1rem] font-medium text-[var(--text-primary)] transition-all focus:border-[var(--accent-primary)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)]"
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

                  <button
                    type="submit"
                    disabled={enrollSubmitting}
                    className="group relative mt-2 flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--accent-primary)] text-[1.1rem] font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_color-mix(in_srgb,var(--accent-primary)_40%,transparent)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {enrollSubmitting
                        ? "Submitting..."
                        : "Complete Enrollment"}
                      {!enrollSubmitting && (
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                      )}
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] transition-transform duration-500 group-hover:translate-x-full" />
                  </button>
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
              "group relative overflow-hidden rounded-[2.5rem] border border-[color-mix(in_srgb,var(--accent-primary)_40%,var(--border-default))] bg-[linear-gradient(160deg,var(--accent-primary)_0%,#1e3a8a_100%)] px-8 py-16 text-center shadow-[0_40px_80px_-20px_color-mix(in_srgb,var(--accent-primary)_40%,transparent)] transition-all duration-700",
              ctaVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.96]",
            )}
          >
            {/* Animated background patterns */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl transition-transform duration-[1.5s] group-hover:scale-150" />
            <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-[#3b82f6]/20 blur-3xl transition-transform duration-[1.5s] group-hover:scale-150" />

            <div className="relative z-10">
              <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-white/10 shadow-2xl backdrop-blur-md transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <Sparkles className="h-10 w-10 text-white" />
              </div>

              <h2 className="mb-4 text-[clamp(2.2rem,5vw,3.25rem)] font-[950] leading-[1.05] tracking-tight text-white">
                The Future of Society <br className="hidden sm:block" />{" "}
                Management Starts Here
              </h2>

              <p className="mx-auto mb-12 max-w-[540px] text-[1.25rem] font-medium leading-relaxed text-blue-50">
                Experience the most advanced dashboard for modern communities.
                Ready to upgrade your living experience?
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  onClick={() => navigate("/login")}
                  className="group relative flex h-16 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-10 text-[1.15rem] font-[800] text-blue-600 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(255,255,255,0.25)] active:scale-95"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Today for Free
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.05),transparent)] transition-transform duration-500 group-hover:translate-x-full" />
                </button>

                <button
                  onClick={() => navigate("/contact")}
                  className="flex h-16 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/5 px-10 text-[1.15rem] font-[800] text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white/10 active:scale-95"
                >
                  Schedule Demo
                </button>
              </div>

              <div className="mt-12 flex items-center justify-center gap-8 border-t border-white/10 pt-8 text-blue-100/60">
                <div className="text-center">
                  <div className="text-xl font-black text-white">10min</div>
                  <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em]">
                    Setup Time
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-xl font-black text-white">50k+</div>
                  <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em]">
                    Users Active
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-xl font-black text-white">99%</div>
                  <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em]">
                    Renewal Rate
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}


