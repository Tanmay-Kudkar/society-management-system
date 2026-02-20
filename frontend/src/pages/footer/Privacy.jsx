import { Shield, Eye, Lock, Server, Mail, Database, Clock } from 'lucide-react'
import PageShell from '../../components/PageShell'

export default function Privacy() {
  const sections = [
    {
      icon: Eye, title: 'Information We Collect',
      content: [
        'Personal information (name, email, phone) provided during registration.',
        'Society and flat details for management purposes.',
        'Payment information processed through secure payment gateways.',
        'Usage data and analytics to improve our services.',
        'Device information and IP addresses for security purposes.',
      ]
    },
    {
      icon: Database, title: 'How We Use Your Data',
      content: [
        'To provide and maintain our society management services.',
        'To process billing and payment transactions securely.',
        'To send important notices and updates about your society.',
        'To improve our platform based on usage patterns and feedback.',
        'To ensure security and prevent unauthorized access to your account.',
      ]
    },
    {
      icon: Lock, title: 'Data Security',
      content: [
        'All data is encrypted in transit using TLS 1.3 encryption.',
        'Sensitive data is encrypted at rest using AES-256 encryption.',
        'Regular security audits and penetration testing are conducted.',
        'Role-based access control ensures only authorized personnel access data.',
        'We follow industry-standard security practices and compliance frameworks.',
      ]
    },
    {
      icon: Mail, title: 'Communications',
      content: [
        'We may send service-related emails that are necessary for operations.',
        'Marketing communications can be opted out at any time.',
        'Push notifications for important society updates can be managed in settings.',
        'We will never share your contact information with third parties for marketing.',
      ]
    },
    {
      icon: Server, title: 'Data Retention',
      content: [
        'Active account data is retained for the duration of your membership.',
        'Transaction records are maintained as required by applicable laws.',
        'You can request data deletion by contacting our support team.',
        'Backup data is automatically purged after 90 days of account deletion.',
      ]
    },
    {
      icon: Clock, title: 'Your Rights',
      content: [
        'Right to access your personal data stored on our platform.',
        'Right to request correction of inaccurate personal information.',
        'Right to request deletion of your account and associated data.',
        'Right to data portability — export your data in standard formats.',
        'Right to withdraw consent for non-essential data processing.',
      ]
    },
  ]

  return (
    <PageShell>
      {/* Hero */}
      <section className="privacy-hero">
        <div className="privacy-hero-inner">
          <div
            className="privacy-pill animate-fade-in-up"
          >
            <Shield className="privacy-pill-icon" style={{ color: 'var(--accent-primary)' }} />
            <span className="privacy-pill-text" style={{ color: 'var(--accent-primary)' }}>Your Data, Your Rights</span>
          </div>
          <h1 className="privacy-title animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <span className="privacy-title-text">Privacy </span>
            <span
              className="privacy-title-gradient"
              style={{ backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
            >
              Policy
            </span>
          </h1>
          <p className="privacy-lead animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Last updated: February 2026. We take your privacy seriously. This policy explains how we collect, use, and protect your information.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="privacy-sections">
        <div className="privacy-sections-inner stagger-children">
          {sections.map((section, i) => (
            <div
              key={i}
              className="privacy-card card-accent-hover"
            >
              <div className="privacy-card-row">
                <div
                  className="privacy-card-icon"
                  style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  <section.icon className="privacy-card-icon-svg" />
                </div>
                <div className="privacy-card-body">
                  <h2 className="privacy-card-title">{section.title}</h2>
                  <ul className="privacy-list">
                    {section.content.map((item, j) => (
                      <li key={j} className="privacy-list-item">
                        <span className="privacy-bullet" style={{ background: 'var(--accent-primary)' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
