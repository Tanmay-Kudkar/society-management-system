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
      <section className="about-hero">
        <div className="about-hero-inner">
          <div
            className="about-pill animate-fade-in-up"
          >
            <Target className="about-pill-icon" style={{ color: 'var(--accent-primary)' }} />
            <span className="about-pill-text" style={{ color: 'var(--accent-primary)' }}>Our Mission</span>
          </div>
          <h1 className="about-hero-title animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <span className="about-hero-title-text">Empowering </span>
            <span
              className="about-hero-title-gradient"
              style={{ backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
            >
              Communities
            </span>
          </h1>
          <p className="about-hero-lead animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            We're on a mission to transform how housing societies operate, making management seamless and residents happier.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="about-story">
        <div className="about-story-inner">
          <div className="about-story-grid">
            <div className="about-story-content animate-slide-in-left">
              <h2 className="about-section-title">Our Story</h2>
              <div className="about-story-text">
                <p>SocietyHub was born from a simple observation: managing a housing society shouldn't require spreadsheets, endless phone calls, and paper notices.</p>
                <p>Founded in 2024, we set out to build a platform that brings society management into the digital age. What started as a project to help our own society has grown into a solution trusted by hundreds of communities.</p>
                <p>Today, we're proud to serve over 500 societies, helping them save time, reduce conflicts, and build stronger communities.</p>
              </div>
            </div>
            <div
              className="about-stats-card animate-slide-in-right"
            >
              <div className="about-stats-grid stagger-children">
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="about-stat-value" style={{ color: s.color }}>{s.value}</div>
                    <div className="about-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-values">
        <div className="about-values-inner">
          <div className="about-section-head">
            <h2 className="about-section-title">Our Values</h2>
            <p className="about-section-subtitle">The principles that guide everything we do</p>
          </div>
          <div className="about-values-grid stagger-children">
            {values.map((value, i) => (
              <div
                key={i}
                className="about-value-card card-accent-hover"
              >
                <div
                  className="about-value-icon"
                  style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  <value.icon className="about-value-icon-svg" />
                </div>
                <h3 className="about-card-title">{value.title}</h3>
                <p className="about-card-text">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="about-team">
        <div className="about-team-inner">
          <div className="about-section-head">
            <div
              className="about-pill about-pill--team"
            >
              <Users className="about-pill-icon" style={{ color: 'var(--accent-primary)' }} />
              <span className="about-pill-text" style={{ color: 'var(--accent-primary)' }}>Our Team</span>
            </div>
            <h2 className="about-section-title">Meet the People Behind SocietyHub</h2>
          </div>
          <div className="about-team-grid stagger-children">
            {team.map((member, i) => (
              <div
                key={i}
                className="about-team-card card-accent-hover"
              >
                <div
                  className="about-team-avatar"
                  style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  <member.avatarIcon className="about-team-avatar-icon" />
                </div>
                <h3 className="about-card-title about-team-name">{member.name}</h3>
                <p className="about-card-text about-team-role">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="about-cta-inner">
          <div className="about-cta-card">
            <div className="about-cta-overlay" />
            <div className="about-cta-content">
              <Award className="about-cta-award" />
              <h2 className="about-cta-title">Join Our Growing Family</h2>
              <p className="about-cta-text">Be part of the community that's transforming society management</p>
              <button onClick={() => navigate('/login')} className="about-cta-button">
                Get Started Today
                <ArrowRight className="about-cta-arrow" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
