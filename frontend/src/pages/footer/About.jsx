import { useNavigate } from 'react-router-dom'
import { Target, Heart, Zap, Shield, Globe, Users, Award, ArrowRight, Crown, Cpu, Palette, Code2 } from 'lucide-react'
import PageShell from '../../components/PageShell'

export default function About() {
  const navigate = useNavigate()

  const team = [
    { name: 'Tanmay Kudkar & Nidhish Vartak', role: 'Founder & CEO', avatarIcon: Crown },
    { name: 'Parth Waghe', role: 'Chief Technology Officer (CTO)', avatarIcon: Cpu },
    { name: 'Atharva Raut', role: 'Head of Designing', avatarIcon: Palette },
    { name: 'Yash Thakur & Tanmay Kudkar', role: 'Lead Developers', avatarIcon: Code2 },
  ]

  const values = [
    { icon: Heart, title: 'Community First', description: 'We believe in building strong communities through technology and innovation.' },
    { icon: Zap, title: 'Innovation', description: 'Constantly evolving to meet the needs of modern housing societies.' },
    { icon: Shield, title: 'Trust & Security', description: 'Your data security is our top priority with enterprise-grade protection.' },
    { icon: Globe, title: 'Accessibility', description: 'Making society management accessible to everyone, everywhere.' },
  ]

  const stats = [
    { value: '500+', label: 'Societies', color: 'var(--accent-primary)' },
    { value: '50K+', label: 'Residents', color: 'var(--accent-secondary)' },
    { value: '99.9%', label: 'Uptime', color: '#3b82f6' },
    { value: '24/7', label: 'Support', color: '#22c55e' },
  ]

  return (
    <PageShell>
      {/* Hero */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div
            className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-primary))] px-4 py-2"
          >
            <Target className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>Our Mission</span>
          </div>
          <h1 className="animate-fade-in-up mb-6 text-[clamp(2.25rem,4vw,3.75rem)] font-black leading-[1.05] text-[var(--text-primary)]" style={{ animationDelay: '100ms' }}>
            <span className="text-[var(--text-primary)]">Empowering </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
            >
              Communities
            </span>
          </h1>
          <p className="animate-fade-in-up mx-auto max-w-[42rem] text-[1.15rem] text-[var(--text-secondary)]" style={{ animationDelay: '200ms' }}>
            We're on a mission to transform how housing societies operate, making management seamless and residents happier.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-[var(--bg-primary)] px-4 py-16 sm:py-[4.75rem]">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="animate-slide-in-left">
              <h2 className="mb-6 text-3xl font-extrabold text-[var(--text-primary)]">Our Story</h2>
              <div className="flex flex-col gap-4 leading-7 text-[var(--text-secondary)]">
                <p>SocietyHub was born from a simple observation: managing a housing society shouldn't require spreadsheets, endless phone calls, and paper notices.</p>
                <p>Founded in 2024, we set out to build a platform that brings society management into the digital age. What started as a project to help our own society has grown into a solution trusted by hundreds of communities.</p>
                <p>Today, we're proud to serve over 500 societies, helping them save time, reduce conflicts, and build stronger communities.</p>
              </div>
            </div>
            <div
              className="animate-slide-in-right rounded-2xl border border-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_5%,var(--bg-primary))] p-8"
            >
              <div className="stagger-children grid grid-cols-2 gap-6 text-center">
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="text-4xl font-black" style={{ color: s.color }}>{s.value}</div>
                    <div className="mt-1 text-sm text-[var(--text-secondary)]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-extrabold text-[var(--text-primary)]">Our Values</h2>
            <p className="text-[var(--text-secondary)]">The principles that guide everything we do</p>
          </div>
          <div className="stagger-children grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-sm transition hover:-translate-y-1.5 hover:border-[var(--border-default)] hover:shadow-[0_0_20px_rgba(47,129,247,0.08)]"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                  style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  <value.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-extrabold text-[var(--text-primary)]">{value.title}</h3>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-[var(--bg-primary)] px-4 pb-8 pt-14 sm:pb-9 sm:pt-[4.5rem]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-primary))] px-4 py-2"
            >
              <Users className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>Our Team</span>
            </div>
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">Meet the People Behind SocietyHub</h2>
          </div>
          <div className="stagger-children grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {team.map((member, i) => (
              <div
                key={i}
                className="flex min-h-full flex-col items-center justify-start rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 text-center shadow-sm transition hover:-translate-y-1.5 hover:border-[var(--border-default)] hover:shadow-[0_0_20px_rgba(47,129,247,0.08)]"
              >
                <div
                  className="mb-4 flex h-[6.25rem] w-[6.25rem] items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_color-mix(in_srgb,var(--accent-primary)_24%,transparent)] transition-transform"
                  style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  <member.avatarIcon className="h-8 w-8 text-white [stroke-width:2.25]" />
                </div>
                <h3 className="mb-2 flex min-h-[4.1rem] w-full items-start justify-center text-center text-lg font-extrabold leading-[1.25] text-[var(--text-primary)]">{member.name}</h3>
                <p className="mb-0 min-h-[2.7rem] w-full text-center text-[0.98rem] font-semibold leading-[1.35] text-[color-mix(in_srgb,var(--text-primary)_78%,var(--text-secondary))]">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 pt-6 sm:pb-20 sm:pt-9">
        <div className="mx-auto max-w-4xl text-center">
          <div className="relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--accent-primary)_26%,var(--border-default))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent-primary)_18%,var(--bg-card))_0%,var(--bg-card)_100%)] px-8 py-10 shadow-lg">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,color-mix(in_srgb,var(--accent-primary)_35%,transparent)_0%,transparent_38%),radial-gradient(circle_at_78%_78%,color-mix(in_srgb,var(--accent-secondary)_28%,transparent)_0%,transparent_42%)] opacity-35" />
            <div className="relative z-[1]">
              <Award className="mx-auto mb-4 h-10 w-10 text-[color-mix(in_srgb,#facc15_88%,white)]" />
              <h2 className="mb-3 text-[clamp(1.8rem,3.5vw,2.25rem)] font-extrabold text-[var(--text-primary)]">Join Our Growing Family</h2>
              <p className="mx-auto mb-6 max-w-[36rem] text-[1.05rem] text-[var(--text-secondary)]">Be part of the community that's transforming society management</p>
              <button
                onClick={() => navigate('/login')}
                className="group inline-flex items-center gap-2 rounded-lg border border-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--accent-primary)_18%,var(--bg-secondary))] px-6 py-3.5 font-bold text-[var(--text-primary)] transition hover:-translate-y-px hover:border-[var(--accent-secondary)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_28%,var(--bg-secondary))]"
              >
                Get Started Today
                <ArrowRight className="h-[1.1rem] w-[1.1rem] transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
