import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Building2, CreditCard, Users, MessageSquare, Bell, Shield, ArrowRight, CheckCircle } from 'lucide-react'
import PageShell from '../../components/PageShell'

export default function Demo() {
  const navigate = useNavigate()
  const [activePreviewTab, setActivePreviewTab] = useState('Dashboard')

  const demoFeatures = [
    { icon: Building2, title: 'Society Dashboard', desc: 'Get a bird\'s-eye view of your entire society — units, residents, and key metrics at a glance.' },
    { icon: CreditCard, title: 'Bill Management', desc: 'See how maintenance bills are generated, tracked, and collected with zero manual effort.' },
    { icon: Users, title: 'Resident Portal', desc: 'Experience the self-service portal where residents raise requests and manage their profiles.' },
    { icon: MessageSquare, title: 'Complaint Tracking', desc: 'Watch how complaints flow from submission to resolution with full status tracking.' },
    { icon: Bell, title: 'Notice Broadcasting', desc: 'Send targeted notices to specific wings, floors, or all residents with one click.' },
    { icon: Shield, title: 'Role-Based Access', desc: 'See how admins, committee members, and residents get different access levels.' },
  ]

  const steps = [
    { step: '01', title: 'Sign Up Free', desc: 'Create your account in under 2 minutes. No credit card required.' },
    { step: '02', title: 'Add Your Society', desc: 'Enter your society details — wings, floors, and units are auto-configured.' },
    { step: '03', title: 'Invite Residents', desc: 'Send bulk invitations via email or WhatsApp. Residents join with one click.' },
    { step: '04', title: 'Go Live', desc: 'Start managing bills, notices, and complaints from day one.' },
  ]

  const previewTabs = ['Dashboard', 'Residents', 'Bills', 'Notices', 'Complaints']

  const previewContent = {
    Dashboard: {
      stats: [
        { label: 'Total Units', value: '248' },
        { label: 'Active Residents', value: '612' },
        { label: 'Pending Bills', value: '34' },
        { label: 'Open Tickets', value: '8' },
      ],
      bars: [65, 80, 55, 90, 70, 85, 60],
      chartLabel: 'Monthly Collection Trend',
    },
    Residents: {
      stats: [
        { label: 'Owners', value: '332' },
        { label: 'Tenants', value: '280' },
        { label: 'Pending KYC', value: '12' },
        { label: 'New This Month', value: '19' },
      ],
      bars: [58, 66, 72, 81, 78, 69, 74],
      chartLabel: 'Resident Onboarding Trend',
    },
    Bills: {
      stats: [
        { label: 'Generated', value: '248' },
        { label: 'Collected', value: '214' },
        { label: 'Pending', value: '34' },
        { label: 'Collection %', value: '86%' },
      ],
      bars: [48, 52, 63, 75, 84, 88, 91],
      chartLabel: 'Bill Collection Progress',
    },
    Notices: {
      stats: [
        { label: 'Published', value: '42' },
        { label: 'Active', value: '7' },
        { label: 'Read Rate', value: '89%' },
        { label: 'Urgent', value: '2' },
      ],
      bars: [40, 68, 62, 71, 84, 79, 88],
      chartLabel: 'Notice Engagement Trend',
    },
    Complaints: {
      stats: [
        { label: 'Raised', value: '96' },
        { label: 'Resolved', value: '83' },
        { label: 'Open', value: '13' },
        { label: 'Avg SLA', value: '1.8d' },
      ],
      bars: [78, 74, 69, 63, 57, 52, 46],
      chartLabel: 'Open Complaints Trend',
    },
  }

  return (
    <PageShell>
      {/* Hero */}
      <section className="demo-hero">
        <div className="demo-hero-inner">
          <span className="demo-pill animate-fade-in-up">
            <Play className="demo-pill-icon" />
            <span>Live Demo</span>
          </span>
          <h1 className="demo-hero-title animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            See SocietyHub{' '}
            <span className="demo-hero-gradient">in Action</span>
          </h1>
          <p className="demo-hero-lead animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Explore our platform with a guided walkthrough. No signup needed.
          </p>
          <div className="demo-hero-actions animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <button onClick={() => navigate('/login')} className="demo-btn-primary">
              Try Free Demo
              <ArrowRight className="demo-btn-icon" />
            </button>
            <button onClick={() => navigate('/contact')} className="demo-btn-secondary">
              Schedule Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="demo-preview">
        <div className="demo-preview-inner">
          <div className="demo-preview-card animate-fade-in-up">
            <div className="demo-preview-header">
              <div className="demo-preview-dots">
                <span className="demo-dot demo-dot--red" />
                <span className="demo-dot demo-dot--yellow" />
                <span className="demo-dot demo-dot--green" />
              </div>
              <span className="demo-preview-url">app.societyhub.com/dashboard</span>
            </div>
            <div className="demo-preview-body">
              <div className="demo-preview-sidebar">
                {previewTabs.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`demo-sidebar-item ${activePreviewTab === item ? 'demo-sidebar-item--active' : ''}`}
                    onClick={() => setActivePreviewTab(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="demo-preview-content">
                <div className="demo-stat-row">
                  {previewContent[activePreviewTab].stats.map((stat, i) => (
                    <div key={i} className="demo-stat-box">
                      <span className="demo-stat-value">{stat.value}</span>
                      <span className="demo-stat-label">{stat.label}</span>
                    </div>
                  ))}
                </div>
                <div className="demo-chart-placeholder">
                  <div className="demo-chart-bars">
                    {previewContent[activePreviewTab].bars.map((h, i) => (
                      <div key={i} className="demo-chart-bar" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <span className="demo-chart-label">{previewContent[activePreviewTab].chartLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Walkthrough */}
      <section className="demo-features">
        <div className="demo-features-inner">
          <div className="demo-section-head">
            <h2 className="demo-section-title">What You'll Explore</h2>
            <p className="demo-section-subtitle">A complete walkthrough of our key features</p>
          </div>
          <div className="demo-features-grid">
            {demoFeatures.map((f, i) => (
              <div key={i} className="demo-feature-card animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="demo-feature-icon">
                  <f.icon className="demo-feature-icon-svg" />
                </div>
                <h3 className="demo-feature-title">{f.title}</h3>
                <p className="demo-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="demo-steps">
        <div className="demo-steps-inner">
          <div className="demo-section-head">
            <h2 className="demo-section-title">Get Started in 4 Steps</h2>
            <p className="demo-section-subtitle">From signup to live in under 10 minutes</p>
          </div>
          <div className="demo-steps-grid">
            {steps.map((s, i) => (
              <div key={i} className="demo-step-card animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <span className="demo-step-number">{s.step}</span>
                <h3 className="demo-step-title">{s.title}</h3>
                <p className="demo-step-desc">{s.desc}</p>
                {i < steps.length - 1 && <div className="demo-step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="demo-cta">
        <div className="demo-cta-inner">
          <div className="demo-cta-card">
            <CheckCircle className="demo-cta-icon" />
            <h2 className="demo-cta-title">Ready to See It Live?</h2>
            <p className="demo-cta-text">Schedule a personalized demo with our team or start exploring on your own.</p>
            <div className="demo-cta-actions">
              <button onClick={() => navigate('/login')} className="demo-btn-primary">
                Start Free Trial
                <ArrowRight className="demo-btn-icon" />
              </button>
              <button onClick={() => navigate('/contact')} className="demo-btn-outline">
                Book a Demo Call
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
