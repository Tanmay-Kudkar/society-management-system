import { useNavigate } from 'react-router-dom'
import { Check, Star, Zap, Building2, ArrowRight } from 'lucide-react'
import PageShell from '../../components/PageShell'

export default function Pricing() {
  const navigate = useNavigate()

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      description: 'For small communities starting digital operations',
      icon: Building2,
      color: 'var(--color-success)',
      features: [
        'Up to 100 units',
        'Role-based login (Member, Tenant, Employee)',
        'Notices & basic communication',
        'Complaint & ticket management',
        'Maintenance bill tracking',
        'Email support',
      ],
      cta: 'Get Started Free',
      popular: false,
    },
    {
      name: 'Professional',
      price: '₹2,999',
      period: '/month',
      description: 'For growing societies needing end-to-end automation',
      icon: Zap,
      color: 'var(--accent-primary)',
      features: [
        'Up to 1000 units',
        'Complete billing & transaction tracking',
        'Vendor bills, contracts & reminders',
        'Wings, flats, tenants & vehicles modules',
        'Reports dashboard (MTD/YTD/custom)',
        'Bulk import/export (users & units)',
        'Emergency contacts & document templates',
        'Priority email & chat support',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations, federations, and multi-society operations',
      icon: Star,
      color: 'var(--color-warning)',
      features: [
        'Unlimited societies and units',
        'Organization + society hierarchy controls',
        'Advanced security logging & audit visibility',
        'Dedicated onboarding and data migration help',
        'Custom integrations and workflow extensions',
        'Account manager + implementation support',
        'SLA-backed priority support',
        'Custom rollout for web + mobile app users',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ]

  return (
    <PageShell>
      {/* Hero */}
      <section className="px-4 py-16 sm:px-6 sm:py-[5.25rem]">
        <div className="mx-auto max-w-4xl text-center">
          <span className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-primary))] px-4 py-2 text-sm font-semibold text-[var(--accent-primary)]">
            <Zap className="h-4 w-4" />
            <span>Transparent Pricing</span>
          </span>
          <h1 className="animate-fade-in-up mb-6 text-[clamp(2.25rem,4vw,3.75rem)] font-black leading-[1.05] text-[var(--text-primary)]" style={{ animationDelay: '100ms' }}>
            Simple Plans,{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }}>Powerful Features</span>
          </h1>
          <p className="animate-fade-in-up mx-auto max-w-[42rem] text-[1.15rem] text-[color-mix(in_srgb,var(--text-primary)_68%,var(--text-secondary))]" style={{ animationDelay: '200ms' }}>
            Choose the plan that fits your society. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-12 sm:px-6 sm:pb-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`animate-fade-in-up relative flex flex-col rounded-2xl border p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                  plan.popular
                    ? 'border-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--bg-card)_92%,var(--bg-secondary))] shadow-[0_0_0_1px_var(--accent-primary),var(--shadow-md)] hover:shadow-[0_0_0_1px_var(--accent-primary),var(--shadow-xl)]'
                    : 'border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-card)_92%,var(--bg-secondary))] hover:border-[var(--border-strong)]'
                }`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))] px-4 py-1 text-xs font-bold tracking-[0.02em] text-white">Most Popular</div>}
                <div className="mb-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${plan.color} 12%, transparent)` }}>
                    <plan.icon style={{ color: plan.color }} className="h-6 w-6" />
                  </div>
                  <h3 className="mb-1.5 text-xl font-extrabold text-[var(--text-primary)]">{plan.name}</h3>
                  <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--text-primary)_64%,var(--text-secondary))]">{plan.description}</p>
                </div>
                <div className="mb-6 flex items-baseline gap-1 border-b border-[var(--border-light)] pb-6">
                  <span className="text-[2.5rem] font-black tracking-[-0.02em] text-[var(--text-primary)]">{plan.price}</span>
                  {plan.period && <span className="text-sm text-[var(--text-secondary)]">{plan.period}</span>}
                </div>
                <ul className="mb-8 flex flex-1 list-none flex-col gap-3 p-0">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm leading-6 text-[var(--text-secondary)]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: plan.color }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(plan.name === 'Enterprise' ? '/contact' : '/login')}
                  className={`group flex w-full items-center justify-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                    plan.popular
                      ? 'border-[var(--accent-primary)] bg-[linear-gradient(135deg,var(--accent-primary),var(--accent-600))] text-white hover:bg-[linear-gradient(135deg,var(--accent-secondary),var(--accent-primary))] hover:border-[var(--accent-secondary)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20 pt-6 sm:px-6 sm:pb-[4.5rem] sm:pt-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="animate-fade-in-up mb-8 text-3xl font-extrabold text-[var(--text-primary)]">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
            {[
              { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately with prorated billing.' },
              { q: 'Is there a free trial?', a: 'Professional plan comes with a 14-day free trial. No credit card required.' },
              { q: 'What payment methods do you accept?', a: 'We accept UPI, credit/debit cards, net banking, and bank transfers for annual plans.' },
              { q: 'Do you offer discounts for annual billing?', a: 'Yes, annual billing saves you 20% compared to monthly billing.' },
            ].map((faq, i) => (
              <div key={i} className="animate-fade-in-up rounded-xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-card)_92%,var(--bg-secondary))] p-6 transition hover:border-[var(--border-strong)]" style={{ animationDelay: `${i * 80}ms` }}>
                <h4 className="mb-2 text-[0.9375rem] font-bold text-[var(--text-primary)]">{faq.q}</h4>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  )
}
