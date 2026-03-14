import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Star, Zap, Building2, ArrowRight, ShieldCheck } from 'lucide-react'
import PageShell from '../../components/PageShell'
import PublicSweepButton from '../../components/PublicSweepButton'

export default function Pricing() {
  const navigate = useNavigate()
  const [isAnnual, setIsAnnual] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState('Professional')

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: 'forever',
      description: 'Perfect for small communities starting digital operations.',
      icon: Building2,
      features: [
        'Up to 100 units',
        'Role-based logic (Members/Tenants)',
        'Basic Notices & Communication',
        'Complaint & ticket management',
        'Maintenance bill tracking',
        'Email support',
      ],
      cta: 'Get Started Free',
      popular: false,
    },
    {
      name: 'Professional',
      price: isAnnual ? '₹2,399' : '₹2,999',
      period: '/month',
      description: 'End-to-end automation for growing & standard societies.',
      icon: Zap,
      features: [
        'Up to 1000 units',
        'Complete billing & transaction tracking',
        'Vendor bills, contracts & reminders',
        'Wings, flats, tenant & vehicle modules',
        'Reports dashboard (MTD/YTD/custom)',
        'Emergency contacts & templates',
        'Priority email & chat support',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'billing',
      description: 'For large federations, and multi-society operations.',
      icon: Star,
      features: [
        'Unlimited societies and units',
        'Organization + society hierarchy controls',
        'Advanced security & audit logging',
        'Dedicated onboarding & migration data',
        'Custom workflow integrations',
        'Dedicated Account implementation',
        'SLA-backed priority support',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ]

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="animate-fade-in-up mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-blue-50/50 px-4 py-2 text-[0.85rem] font-bold text-blue-600 backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            <Zap className="h-4 w-4" />
            <span>Transparent Pricing</span>
          </span>
          <h1 className="animate-fade-in-up mb-6 text-4xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl" style={{ animationDelay: '100ms' }}>
            Simple plans for <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">smart societies</span>
          </h1>
          <p className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400" style={{ animationDelay: '200ms' }}>
            Choose the perfect plan that fits your residential community. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="animate-fade-in-up mt-10 flex justify-center" style={{ animationDelay: '300ms' }}>
            <div className="relative flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <button
                onClick={() => setIsAnnual(false)}
                className={`relative w-32 rounded-full py-2.5 text-sm font-bold transition-all duration-200 ${!isAnnual ? 'text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                {!isAnnual && <div className="absolute inset-0 rounded-full bg-slate-900 shadow-sm transition-all dark:bg-slate-700" />}
                <span className="relative z-10">Monthly</span>
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`relative w-40 rounded-full py-2.5 text-sm font-bold transition-all duration-200 ${isAnnual ? 'text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                {isAnnual && <div className="absolute inset-0 rounded-full bg-blue-600 shadow-sm transition-all dark:bg-blue-600" />}
                <span className="relative z-10 flex items-center justify-center gap-1.5:">
                  Annually <span className={isAnnual ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}>-20%</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="relative z-10 px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* md:grid-cols-2 puts the 3rd item centered on tablet. lg:grid-cols-3 fixes row structure on desktop */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:items-center">
            {plans.map((plan, i) => {
              const isSelected = selectedPlan === plan.name

              return (
                <div
                  key={i}
                  onClick={() => setSelectedPlan(plan.name)}
                  className={`animate-fade-in-up relative flex h-full cursor-pointer flex-col rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-2 ${
                    plan.popular
                      ? 'border-2 border-blue-500 bg-white/95 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] backdrop-blur-2xl dark:border-blue-500/80 dark:bg-slate-900/90 lg:scale-105 lg:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.4)] z-20'
                      : 'border-2 border-slate-300 bg-white/60 shadow-lg backdrop-blur-xl hover:border-slate-400 hover:shadow-xl dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-slate-500 z-10'
                  } ${
                    isSelected
                      ? 'ring-2 ring-blue-500/80 ring-offset-2 ring-offset-[var(--bg-primary)]'
                      : ''
                  } ${i === 2 ? 'md:col-span-2 md:mx-auto md:w-[calc(50%-1rem)] lg:col-span-1 lg:w-full' : ''}`}
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-max rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-[0.7rem] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/30">
                    Most Popular
                  </div>
                )}
                {isSelected && (
                  <div className="absolute right-4 top-4 rounded-full border border-blue-300/70 bg-blue-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300">
                    Selected
                  </div>
                )}
                <div className="mb-8">
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${plan.popular ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300'}`}>
                    <plan.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="min-h-[2.5rem] text-[0.95rem] leading-relaxed text-slate-600 dark:text-slate-400">{plan.description}</p>
                </div>
                
                <div className="mb-8 flex items-end gap-1.5 border-b border-slate-100 pb-8 dark:border-slate-800/80">
                  <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white xl:text-5xl">{plan.price}</span>
                  {plan.period && <span className="mb-1 text-[0.95rem] font-bold text-slate-500 dark:text-slate-400">{plan.period}</span>}
                </div>
                
                <ul className="mb-10 flex flex-1 list-none flex-col gap-4 p-0">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-[0.95rem] leading-snug text-slate-700 dark:text-slate-300">
                      <div className={`mt-0.5 shrink-0 rounded-full p-1 ${plan.popular ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400'}`}>
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                      <span className="font-medium text-slate-600 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <PublicSweepButton
                  onClick={() => navigate(plan.name === 'Enterprise' ? '/contact' : '/login')}
                  className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-[0.95rem] font-bold text-white shadow-md transition-all duration-200 hover:bg-blue-700"
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4 opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                </PublicSweepButton>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Feature Promise Banner */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-3xl border border-slate-300 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 px-6 py-10 shadow-[0_18px_45px_-18px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/80 dark:border-slate-700 dark:ring-slate-700/50 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-slate-900/65 dark:to-slate-800/70 sm:px-12 sm:py-12 lg:flex lg:items-center lg:justify-between">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/15" />

          <div className="relative lg:w-0 lg:flex-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Ready for a smart society?</h2>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">Start your free trial today. Cancel anytime. All standard features are unlocked for 14 days.</p>
          </div>

          <div className="relative mt-8 flex flex-shrink-0 items-center justify-center gap-1 lg:mt-0 lg:ml-8">
            <div className="flex items-center gap-2 rounded-full border border-blue-300 bg-white/85 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-blue-100/90 backdrop-blur-sm dark:border-slate-600 dark:ring-slate-700/60 dark:bg-slate-800/70 dark:text-slate-200">
              <ShieldCheck className="h-5 w-5 text-emerald-500" /> Fully Secured & Encrypted
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-24 sm:px-6 lg:pb-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="animate-fade-in-up mb-12 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-2">
            {[
              { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately with prorated billing.' },
              { q: 'Is there a free trial?', a: 'Professional plan comes with a 14-day free trial. No credit card required.' },
              { q: 'What payment methods do you accept?', a: 'We accept UPI, credit/debit cards, net banking, and bank transfers for annual plans.' },
              { q: 'Do you offer discounts for annual billing?', a: 'Yes, annual billing saves you 20% compared to monthly billing.' },
            ].map((faq, i) => (
              <div key={i} className="animate-fade-in-up group rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-500/30 dark:hover:shadow-blue-500/10" style={{ animationDelay: `${i * 80}ms` }}>
                <h4 className="mb-3 text-[1.05rem] font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">{faq.q}</h4>
                <p className="text-[0.95rem] leading-relaxed text-slate-600 dark:text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  )
}
