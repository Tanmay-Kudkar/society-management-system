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
      <section className="pricing-hero">
        <div className="pricing-hero-inner">
          <span className="pricing-pill animate-fade-in-up">
            <Zap className="pricing-pill-icon" />
            <span>Transparent Pricing</span>
          </span>
          <h1 className="pricing-hero-title animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Simple Plans,{' '}
            <span className="pricing-hero-gradient">Powerful Features</span>
          </h1>
          <p className="pricing-hero-lead animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Choose the plan that fits your society. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pricing-cards-section">
        <div className="pricing-cards-inner">
          <div className="pricing-grid">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`pricing-card animate-fade-in-up ${plan.popular ? 'pricing-card--popular' : ''}`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {plan.popular && <div className="pricing-popular-badge">Most Popular</div>}
                <div className="pricing-card-header">
                  <div className="pricing-card-icon" style={{ background: `color-mix(in srgb, ${plan.color} 12%, transparent)` }}>
                    <plan.icon style={{ color: plan.color }} className="pricing-icon-svg" />
                  </div>
                  <h3 className="pricing-card-name">{plan.name}</h3>
                  <p className="pricing-card-desc">{plan.description}</p>
                </div>
                <div className="pricing-card-price">
                  <span className="pricing-amount">{plan.price}</span>
                  {plan.period && <span className="pricing-period">{plan.period}</span>}
                </div>
                <ul className="pricing-feature-list">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="pricing-feature-item">
                      <Check className="pricing-check-icon" style={{ color: plan.color }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(plan.name === 'Enterprise' ? '/contact' : '/login')}
                  className={`pricing-card-cta ${plan.popular ? 'pricing-card-cta--primary' : ''}`}
                >
                  {plan.cta}
                  <ArrowRight className="pricing-cta-arrow" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pricing-faq">
        <div className="pricing-faq-inner">
          <h2 className="pricing-faq-title animate-fade-in-up">Frequently Asked Questions</h2>
          <div className="pricing-faq-grid">
            {[
              { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately with prorated billing.' },
              { q: 'Is there a free trial?', a: 'Professional plan comes with a 14-day free trial. No credit card required.' },
              { q: 'What payment methods do you accept?', a: 'We accept UPI, credit/debit cards, net banking, and bank transfers for annual plans.' },
              { q: 'Do you offer discounts for annual billing?', a: 'Yes, annual billing saves you 20% compared to monthly billing.' },
            ].map((faq, i) => (
              <div key={i} className="pricing-faq-card animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <h4 className="pricing-faq-question">{faq.q}</h4>
                <p className="pricing-faq-answer">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  )
}
