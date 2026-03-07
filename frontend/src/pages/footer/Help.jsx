import { useNavigate } from 'react-router-dom'
import { HelpCircle, Book, MessageCircle, Mail, Phone, ArrowRight, Search, ChevronRight } from 'lucide-react'
import PageShell from '../../components/PageShell'

export default function Help() {
  const navigate = useNavigate()

  const categories = [
    {
      icon: Book,
      title: 'Getting Started',
      description: 'Learn the basics of setting up and using SocietyHub.',
      articles: ['Creating your society account', 'Adding wings and units', 'Inviting residents', 'Setting up billing'],
      color: 'var(--accent-primary)',
    },
    {
      icon: MessageCircle,
      title: 'Managing Complaints',
      description: 'Everything about the complaint and ticket system.',
      articles: ['Filing a complaint', 'Tracking complaint status', 'Escalation process', 'Resolution workflow'],
      color: 'var(--color-success)',
    },
    {
      icon: Mail,
      title: 'Notices & Communication',
      description: 'How to broadcast notices and communicate with residents.',
      articles: ['Creating notices', 'Targeting specific recipients', 'Push notification settings', 'Email preferences'],
      color: 'var(--color-warning)',
    },
    {
      icon: Phone,
      title: 'Billing & Payments',
      description: 'Manage maintenance bills, payments, and receipts.',
      articles: ['Generating bills', 'Payment methods', 'Downloading receipts', 'Overdue management'],
      color: 'var(--color-error)',
    },
  ]

  const faqs = [
    { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page, enter your registered email, and follow the reset link sent to your inbox.' },
    { q: 'Can I manage multiple societies?', a: 'Yes, the Enterprise plan supports multi-society federation. Contact our team for setup assistance.' },
    { q: 'How do I generate maintenance bills?', a: 'Navigate to Bills → Generate Bills, select the billing period, and click "Generate". Bills are auto-sent to residents.' },
    { q: 'Is my data secure?', a: 'Absolutely. We use AES-256 encryption, regular backups, and comply with data protection regulations.' },
    { q: 'How do I add a new resident?', a: 'Go to Residents → Add Resident, fill in details, and assign them to a unit. They\'ll receive an invitation email.' },
    { q: 'Can residents pay bills online?', a: 'Yes, residents can pay via UPI, credit/debit cards, or net banking through the resident portal.' },
  ]

  return (
    <PageShell>
      {/* Hero */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-primary))] px-4 py-2 text-sm font-semibold text-[var(--accent-primary)]">
            <HelpCircle className="h-4 w-4" />
            <span>Help Center</span>
          </span>
          <h1 className="animate-fade-in-up mb-6 text-[clamp(2.25rem,4vw,3.75rem)] font-black leading-[1.05] text-[var(--text-primary)]" style={{ animationDelay: '100ms' }}>
            How Can We{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }}>Help You?</span>
          </h1>
          <p className="animate-fade-in-up mx-auto mb-8 max-w-[42rem] text-xl text-[var(--text-secondary)]" style={{ animationDelay: '200ms' }}>
            Find answers, guides, and resources to get the most out of SocietyHub.
          </p>
          <div className="animate-fade-in-up relative mx-auto max-w-[32rem]" style={{ animationDelay: '300ms' }}>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input type="text" placeholder="Search for help articles..." className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3 pl-11 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition focus:border-[var(--accent-primary)] focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)]" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {categories.map((cat, i) => (
              <div key={i} className="animate-fade-in-up rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:shadow-lg" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="mb-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${cat.color} 12%, transparent)` }}>
                    <cat.icon className="h-6 w-6" style={{ color: cat.color }} />
                  </div>
                  <h3 className="mb-1.5 text-lg font-bold text-[var(--text-primary)]">{cat.title}</h3>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{cat.description}</p>
                </div>
                <ul className="flex list-none flex-col gap-2 border-t border-[var(--border-light)] pt-4">
                  {cat.articles.map((article, j) => (
                    <li key={j} className="group flex cursor-pointer items-center gap-2 py-1.5 text-sm text-[var(--text-secondary)] transition hover:text-[var(--accent-primary)]">
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent-primary)]" />
                      <span>{article}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="animate-fade-in-up mb-10 text-center text-3xl font-extrabold text-[var(--text-primary)]">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {faqs.map((faq, i) => (
              <div key={i} className="animate-fade-in-up rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 transition hover:border-[var(--border-default)]" style={{ animationDelay: `${i * 60}ms` }}>
                <h4 className="mb-2 text-[0.9375rem] font-bold text-[var(--text-primary)]">{faq.q}</h4>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-[42rem]">
          <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] px-8 py-12 text-center">
            <MessageCircle className="mx-auto mb-6 h-12 w-12 text-[var(--accent-primary)]" />
            <h2 className="mb-3 text-[1.75rem] font-extrabold text-[var(--text-primary)]">Still Need Help?</h2>
            <p className="mx-auto mb-8 max-w-[28rem] text-base text-[var(--text-secondary)]">Our support team is available 24/7 to assist you with any questions.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate('/contact')} className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-secondary)]">
                Contact Support
                <ArrowRight className="h-4 w-4" />
              </button>
              <a href="mailto:support@societyhub.com" className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] no-underline transition hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-strong)]">
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
