import { Shield, Eye, Lock, Server, Mail, Database, Clock } from 'lucide-react'
import PageShell from '../../components/PageShell'
import clsx from 'clsx'

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
      <div className="relative z-10">
        {/* Hero */}
        <section className="px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div
              className="animate-fade-in-up mb-6 inline-flex items-center gap-2.5 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] px-4 py-1.5 shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] p-1">
                <Shield className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)]">Your Data, Your Rights</span>
            </div>
            <h1 className="animate-fade-in-up mb-6 text-[clamp(2.5rem,5vw,4rem)] font-[950] leading-[1.05] tracking-tight text-[var(--text-primary)]" style={{ animationDelay: '100ms' }}>
              We Secure Your
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[#3b82f6] bg-clip-text text-transparent"> Digital Footprint</span>
            </h1>
            <p className="animate-fade-in-up mx-auto max-w-[42rem] text-[1.125rem] font-medium leading-relaxed text-[var(--text-secondary)]" style={{ animationDelay: '200ms' }}>
              Last updated: March 2026. <br className="hidden sm:inline" />
              This policy provides a crystal clear explanation of how we collect, use, and protect your information securely.
            </p>
          </div>
        </section>

        {/* Sections */}
        <section className="px-4 pb-24">
          <div className="mx-auto grid max-w-[1000px] gap-6 sm:grid-cols-2">
            {sections.map((section, i) => (
              <div
                key={i}
                className={clsx(
                  "group relative overflow-hidden rounded-[1.75rem] border border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[color-mix(in_srgb,var(--bg-card)_80%,transparent)] p-8 backdrop-blur-sm transition-all duration-500",
                  "hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] hover:shadow-[0_20px_40px_-15px_color-mix(in_srgb,var(--accent-primary)_12%,transparent)]"
                )}
                style={{ animationDelay: `${(i + 3) * 100}ms` }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--accent-primary)_4%,transparent)_0%,transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                
                <div className="relative z-10">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-primary)_15%,transparent),color-mix(in_srgb,var(--accent-primary)_5%,transparent))] shadow-inner ring-1 ring-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                    <section.icon className="h-6 w-6 text-[var(--accent-primary)]" />
                  </div>
                  
                  <h2 className="mb-5 text-[1.35rem] font-extrabold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors duration-300">
                    {section.title}
                  </h2>
                  
                  <ul className="flex list-none flex-col gap-3.5 p-0">
                    {section.content.map((item, j) => (
                      <li key={j} className="flex items-start gap-3.5 text-[0.95rem] font-medium leading-relaxed text-[color-mix(in_srgb,var(--text-secondary)_95%,transparent)]">
                        <div className="mt-[0.4rem] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)]">
                          <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
