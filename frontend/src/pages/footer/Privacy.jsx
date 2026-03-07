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
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div
            className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-primary))] px-4 py-2 dark:border-transparent dark:bg-white/5"
          >
            <Shield className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>Your Data, Your Rights</span>
          </div>
          <h1 className="animate-fade-in-up mb-6 text-[clamp(2.25rem,4vw,3.75rem)] font-black leading-[1.05] text-[var(--text-primary)]" style={{ animationDelay: '100ms' }}>
            <span className="text-[var(--text-primary)]">Privacy </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
            >
              Policy
            </span>
          </h1>
          <p className="animate-fade-in-up mx-auto max-w-[42rem] text-[1.125rem] text-[var(--text-secondary)]" style={{ animationDelay: '200ms' }}>
            Last updated: February 2026. We take your privacy seriously. This policy explains how we collect, use, and protect your information.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="px-4 pb-20">
        <div className="stagger-children mx-auto flex max-w-4xl flex-col gap-8">
          {sections.map((section, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent-primary)] hover:shadow-[0_0_20px_rgba(47,129,247,0.08)] sm:p-8"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  <section.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="mb-4 text-xl font-extrabold text-[var(--text-primary)]">{section.title}</h2>
                  <ul className="flex list-none flex-col gap-3 p-0">
                    {section.content.map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm leading-7 text-[var(--text-secondary)]">
                        <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--accent-primary)' }} />
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
