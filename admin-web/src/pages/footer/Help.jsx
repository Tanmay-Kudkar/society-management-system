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
      <section className="help-hero">
        <div className="help-hero-inner">
          <span className="help-pill animate-fade-in-up">
            <HelpCircle className="help-pill-icon" />
            <span>Help Center</span>
          </span>
          <h1 className="help-hero-title animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            How Can We{' '}
            <span className="help-hero-gradient">Help You?</span>
          </h1>
          <p className="help-hero-lead animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Find answers, guides, and resources to get the most out of SocietyHub.
          </p>
          <div className="help-search-wrap animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Search className="help-search-icon" />
            <input type="text" placeholder="Search for help articles..." className="help-search-input" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="help-categories">
        <div className="help-categories-inner">
          <div className="help-categories-grid">
            {categories.map((cat, i) => (
              <div key={i} className="help-category-card animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="help-category-header">
                  <div className="help-category-icon" style={{ background: `color-mix(in srgb, ${cat.color} 12%, transparent)` }}>
                    <cat.icon className="help-category-icon-svg" style={{ color: cat.color }} />
                  </div>
                  <h3 className="help-category-title">{cat.title}</h3>
                  <p className="help-category-desc">{cat.description}</p>
                </div>
                <ul className="help-article-list">
                  {cat.articles.map((article, j) => (
                    <li key={j} className="help-article-item">
                      <ChevronRight className="help-article-chevron" />
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
      <section className="help-faq">
        <div className="help-faq-inner">
          <h2 className="help-faq-title animate-fade-in-up">Frequently Asked Questions</h2>
          <div className="help-faq-grid">
            {faqs.map((faq, i) => (
              <div key={i} className="help-faq-card animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <h4 className="help-faq-question">{faq.q}</h4>
                <p className="help-faq-answer">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support CTA */}
      <section className="help-cta">
        <div className="help-cta-inner">
          <div className="help-cta-card">
            <MessageCircle className="help-cta-icon" />
            <h2 className="help-cta-title">Still Need Help?</h2>
            <p className="help-cta-text">Our support team is available 24/7 to assist you with any questions.</p>
            <div className="help-cta-actions">
              <button onClick={() => navigate('/contact')} className="help-btn-primary">
                Contact Support
                <ArrowRight className="help-btn-icon" />
              </button>
              <a href="mailto:support@societyhub.com" className="help-btn-outline">
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
