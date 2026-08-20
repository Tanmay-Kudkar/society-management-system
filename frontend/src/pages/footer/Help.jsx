import { useNavigate } from 'react-router-dom'
import { HelpCircle, Book, MessageCircle, Mail, Phone, ArrowRight, Search, ChevronRight } from 'lucide-react'
import PageShell from '../../components/PageShell'
import PublicSweepButton from '../../components/PublicSweepButton'
import PublicOutlineButton from '../../components/PublicOutlineButton'
import clsx from 'clsx'

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
      {/* Hero Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_6%,transparent)] blur-[100px]" />
        <div className="absolute top-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-[color-mix(in_srgb,var(--accent-secondary)_4%,transparent)] blur-[80px]" />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section className="px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div
              className="animate-fade-in-up mb-6 inline-flex items-center gap-2.5 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] px-4 py-1.5 shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] p-1">
                <HelpCircle className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)]">Help Center</span>
            </div>
            
            <h1 className="animate-fade-in-up mb-6 text-[clamp(2.5rem,5vw,4rem)] font-[950] leading-[1.05] tracking-tight text-[var(--text-primary)]" style={{ animationDelay: '100ms' }}>
              How Can We{' '}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[#3b82f6] bg-clip-text text-transparent">Help You?</span>
            </h1>
            
            <p className="animate-fade-in-up mx-auto mb-10 max-w-[42rem] text-[1.125rem] font-medium leading-relaxed text-[var(--text-secondary)]" style={{ animationDelay: '200ms' }}>
              Find answers, definitive guides, and resources to get the most out of your SocietyHub ecosystem.
            </p>
            
            <div className="animate-fade-in-up relative mx-auto max-w-[36rem]" style={{ animationDelay: '300ms' }}>
              <div className="absolute inset-0 -m-1.5 rounded-[1.25rem] bg-[linear-gradient(to_right,color-mix(in_srgb,var(--accent-primary)_40%,transparent),color-mix(in_srgb,var(--accent-secondary)_40%,transparent))] blur-[10px] opacity-40 pointer-events-none" />
              <div className="relative flex items-center rounded-2xl border-2 border-[color-mix(in_srgb,var(--accent-primary)_30%,var(--border-default))] bg-[color-mix(in_srgb,var(--bg-card)_95%,transparent)] px-3 shadow-sm backdrop-blur-xl transition-all focus-within:border-[var(--accent-primary)] focus-within:bg-[var(--bg-card)] focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)]">
                <Search className="ml-3 h-5 w-5 text-[var(--accent-primary)]" />
                <input 
                  type="text" 
                  placeholder="Search for help articles (e.g. billing, complaints)..." 
                  className="w-full min-w-0 bg-transparent px-4 py-4 text-[1.05rem] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:outline-none focus:ring-0 sm:py-5" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
              {categories.map((cat, i) => (
                <div 
                  key={i} 
                  className={clsx(
                    "group relative overflow-hidden rounded-[1.75rem] border border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[color-mix(in_srgb,var(--bg-card)_80%,transparent)] p-8 backdrop-blur-sm transition-all duration-500",
                    "hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] hover:shadow-[0_20px_40px_-15px_color-mix(in_srgb,var(--accent-primary)_12%,transparent)]"
                  )}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--accent-primary)_4%,transparent)_0%,transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  
                  <div className="relative z-10 mb-6">
                    <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${cat.color} 25%, transparent), color-mix(in srgb, ${cat.color} 10%, transparent))`, ring: `1px solid color-mix(in srgb, ${cat.color} 30%, transparent)` }}>
                      <cat.icon className="h-6 w-6" style={{ color: cat.color }} />
                    </div>
                    <h3 className="mb-2 text-[1.35rem] font-extrabold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors duration-300">{cat.title}</h3>
                    <p className="text-[0.95rem] font-medium leading-relaxed text-[color-mix(in_srgb,var(--text-secondary)_95%,transparent)]">{cat.description}</p>
                  </div>
                  
                  <ul className="relative z-10 flex list-none flex-col gap-3 border-t border-[color-mix(in_srgb,var(--border-light)_60%,transparent)] pt-5">
                    {cat.articles.map((article, j) => (
                      <li key={j} className="group/item flex cursor-pointer items-center gap-3 text-[0.95rem] font-medium text-[color-mix(in_srgb,var(--text-secondary)_95%,transparent)] transition-all hover:text-[var(--accent-primary)] hover:translate-x-1">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] transition-colors group-hover/item:bg-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)]">
                          <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)] transition-colors duration-300 group-hover/item:text-[var(--accent-primary)]" />
                        </div>
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
            <div className="text-center mb-12">
              <h2 className="text-[2rem] sm:text-[2.5rem] font-[900] tracking-tight text-[var(--text-primary)]">Frequently Asked Questions</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {faqs.map((faq, i) => (
                <div 
                  key={i} 
                  className={clsx(
                    "group rounded-[1.25rem] border border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[color-mix(in_srgb,var(--bg-card)_50%,transparent)] p-6 backdrop-blur-sm transition-all duration-300 hover:bg-[var(--bg-card)]",
                    "hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] hover:shadow-lg"
                  )}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <h4 className="mb-3 text-[1.05rem] font-bold leading-tight text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{faq.q}</h4>
                  <p className="text-[0.95rem] font-medium leading-relaxed text-[color-mix(in_srgb,var(--text-secondary)_90%,transparent)]">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Support CTA */}
        <section className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-[50rem]">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-[color-mix(in_srgb,var(--accent-primary)_30%,var(--border-default))] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--bg-card)_90%,var(--accent-primary)_10%)_0%,color-mix(in_srgb,var(--bg-card)_95%,transparent)_100%)] p-10 text-center shadow-[0_24px_64px_-12px_color-mix(in_srgb,var(--accent-primary)_10%,transparent)] backdrop-blur-xl sm:p-14">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,color-mix(in_srgb,var(--accent-primary)_8%,transparent)_0%,transparent_50%)] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-[var(--accent-primary)] to-[#3b82f6] shadow-[0_12px_24px_color-mix(in_srgb,var(--accent-primary)_30%,transparent)]">
                  <MessageCircle size={36} className="text-white" />
                </div>
                <h2 className="mb-4 text-[clamp(1.75rem,3vw,2.25rem)] font-[900] tracking-tight text-[var(--text-primary)]">Still Need Help?</h2>
                <p className="mx-auto mb-10 max-w-[32rem] text-[1.1rem] font-medium leading-relaxed text-[var(--text-secondary)]">Our technical support team is available around the clock to assist you with onboarding, data migration, and troubleshooting.</p>
                
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <PublicSweepButton onClick={() => navigate('/contact')} className="flex h-[3.25rem] items-center justify-center gap-2 rounded-[1.1rem] bg-[var(--accent-primary)] px-8 text-[1rem] font-bold text-white transition-all duration-300">
                    Contact Support
                    <ArrowRight className="h-[1.1rem] w-[1.1rem] opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                  </PublicSweepButton>
                  <PublicOutlineButton as="a" href="mailto:kudkartanmay25@gmail.com" className="flex h-[3.25rem] items-center justify-center px-8 text-[1rem] font-bold rounded-[1.1rem] no-underline">
                    Email Support
                  </PublicOutlineButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
