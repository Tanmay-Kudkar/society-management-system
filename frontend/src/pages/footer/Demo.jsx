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
      <section className="px-4 py-16 sm:px-6 sm:py-[5.25rem]">
        <div className="mx-auto max-w-4xl text-center">
          <span className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-primary))] px-4 py-2 text-sm font-semibold text-[var(--accent-primary)]">
            <Play className="h-4 w-4" />
            <span>Live Demo</span>
          </span>
          <h1 className="animate-fade-in-up mb-6 text-[clamp(2.25rem,4vw,3.75rem)] font-black leading-[1.05] text-[var(--text-primary)]" style={{ animationDelay: '100ms' }}>
            See SocietyHub{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }}>in Action</span>
          </h1>
          <p className="animate-fade-in-up mx-auto mb-8 max-w-[42rem] text-[1.15rem] text-[color-mix(in_srgb,var(--text-primary)_68%,var(--text-secondary))]" style={{ animationDelay: '200ms' }}>
            Explore our platform with a guided walkthrough. No signup needed.
          </p>
          <div className="animate-fade-in-up flex flex-wrap justify-center gap-3" style={{ animationDelay: '300ms' }}>
            <button onClick={() => navigate('/login')} className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-secondary)]">
              Try Free Demo
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => navigate('/contact')} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-strong)]">
              Schedule Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-lg">
            <div className="flex items-center gap-3 border-b border-[var(--border-light)] bg-[var(--bg-tertiary)] px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f85149]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#d29922]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#3fb950]" />
              </div>
              <span className="font-mono text-xs text-[var(--text-tertiary)]">app.societyhub.com/dashboard</span>
            </div>
            <div className="grid min-h-[280px] grid-cols-1 sm:grid-cols-[140px_1fr]">
              <div className="flex gap-1 overflow-x-auto border-b border-[var(--border-light)] bg-[var(--bg-secondary)] p-2 sm:block sm:overflow-visible sm:border-b-0 sm:border-r sm:p-3">
                {previewTabs.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`block whitespace-nowrap rounded px-3 py-2 text-left text-xs transition sm:mb-1.5 sm:w-full ${
                      activePreviewTab === item
                        ? 'bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] font-semibold text-[var(--accent-primary)] sm:border-l-2 sm:border-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                    }`}
                    onClick={() => setActivePreviewTab(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-4 p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {previewContent[activePreviewTab].stats.map((stat, i) => (
                    <div key={i} className="rounded-lg bg-[var(--bg-tertiary)] p-3 text-center">
                      <span className="block text-xl font-extrabold text-[var(--accent-primary)]">{stat.value}</span>
                      <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">{stat.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex min-h-[120px] flex-1 flex-col items-center justify-end rounded-lg bg-[var(--bg-tertiary)] px-2 pb-2 pt-4">
                  <div className="flex h-20 w-full max-w-[280px] items-end gap-2">
                    {previewContent[activePreviewTab].bars.map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm bg-[linear-gradient(to_top,var(--accent-primary),var(--accent-secondary))] opacity-70 transition hover:opacity-100" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <span className="mt-2 text-xs text-[var(--text-tertiary)]">{previewContent[activePreviewTab].chartLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Walkthrough */}
      <section className="px-4 py-16 sm:px-6 sm:py-[5.25rem]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-extrabold text-[var(--text-primary)]">What You'll Explore</h2>
            <p className="text-[var(--text-secondary)]">A complete walkthrough of our key features</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {demoFeatures.map((f, i) => (
              <div key={i} className="animate-fade-in-up rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-card)_92%,var(--bg-secondary))] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)]">
                  <f.icon className="h-6 w-6 text-[var(--accent-primary)]" />
                </div>
                <h3 className="mb-2 text-base font-bold text-[var(--text-primary)]">{f.title}</h3>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="px-4 py-16 sm:px-6 sm:py-[5.25rem]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-extrabold text-[var(--text-primary)]">Get Started in 4 Steps</h2>
            <p className="text-[var(--text-secondary)]">From signup to live in under 10 minutes</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={i} className="animate-fade-in-up relative rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-card)_92%,var(--bg-secondary))] p-6 text-center transition hover:-translate-y-0.5 hover:border-[var(--accent-primary)]" style={{ animationDelay: `${i * 100}ms` }}>
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-sm font-extrabold text-[var(--accent-primary)]">{s.step}</span>
                <h3 className="mb-2 text-base font-bold text-[var(--text-primary)]">{s.title}</h3>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{s.desc}</p>
                {i < steps.length - 1 && <div className="absolute right-[-0.75rem] top-1/2 hidden h-0.5 w-3 bg-[var(--border-default)] md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--accent-primary)_24%,var(--border-default))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent-primary)_14%,var(--bg-card))_0%,var(--bg-card)_100%)] px-8 py-10 text-center shadow-lg">
            <CheckCircle className="mx-auto mb-6 h-12 w-12 text-[var(--color-success)]" />
            <h2 className="mb-3 text-[1.75rem] font-extrabold text-[var(--text-primary)]">Ready to See It Live?</h2>
            <p className="mx-auto mb-6 max-w-[28rem] text-base text-[color-mix(in_srgb,var(--text-primary)_68%,var(--text-secondary))]">Schedule a personalized demo with our team or start exploring on your own.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate('/login')} className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-secondary)]">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => navigate('/contact')} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-strong)]">
                Book a Demo Call
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
