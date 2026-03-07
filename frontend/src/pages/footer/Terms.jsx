import { FileText, AlertTriangle, CreditCard, ShieldAlert, Gavel, HandshakeIcon, UserCheck } from 'lucide-react'
import PageShell from '../../components/PageShell'

export default function Terms() {
  const sections = [
    {
      icon: UserCheck, title: '1. Acceptance of Terms',
      content: 'By accessing or using SocietyHub, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services. These terms apply to all users, including society administrators, committee members, residents, tenants, and visitors.'
    },
    {
      icon: FileText, title: '2. Service Description',
      content: 'SocietyHub provides a digital platform for housing society management, including but not limited to: resident management, billing and payments, complaint tracking, notice broadcasting, document management, vehicle registration, visitor management, and reporting. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time with reasonable notice.'
    },
    {
      icon: ShieldAlert, title: '3. User Responsibilities',
      content: 'Users are responsible for maintaining the confidentiality of their login credentials and for all activities under their account. Society administrators must ensure accurate data entry and proper use of role-based access controls. Users must not attempt to access data belonging to other societies or users beyond their authorized scope. Any security concerns must be reported immediately.'
    },
    {
      icon: CreditCard, title: '4. Payments & Billing',
      content: 'Subscription fees are billed according to the chosen plan (Free, Basic, Premium, or Lifetime). Payment processing is handled by secure third-party providers. Maintenance bills generated through the platform are the responsibility of the respective society. Refund policies apply as per the subscription agreement. Late payment may result in service limitations.'
    },
    {
      icon: AlertTriangle, title: '5. Prohibited Activities',
      content: 'Users must not: attempt unauthorized access to other accounts or societies; use the platform for illegal activities; upload malicious content or code; share confidential society data with unauthorized parties; manipulate financial records or billing information; use automated tools to scrape or collect data; impersonate other users or roles. Violation may result in account suspension or termination.'
    },
    {
      icon: Gavel, title: '6. Limitation of Liability',
      content: 'SocietyHub is provided "as-is" without warranties of any kind. While we strive for 99.9% uptime, we are not liable for service interruptions, data loss due to user error, or third-party service failures. Our total liability shall not exceed the fees paid during the twelve months prior to the claim. We are not responsible for decisions made based on data presented through our platform.'
    },
    {
      icon: HandshakeIcon, title: '7. Dispute Resolution',
      content: 'Any disputes arising from the use of SocietyHub shall be resolved through good-faith negotiation between the parties. If negotiation fails, disputes will be submitted to binding arbitration in Mumbai, India, under the Arbitration and Conciliation Act, 1996. The language of arbitration shall be English. Each party shall bear its own costs. These terms are governed by the laws of India.'
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
            <FileText className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>Legal Agreement</span>
          </div>
          <h1 className="animate-fade-in-up mb-6 text-[clamp(2.25rem,4vw,3.75rem)] font-black leading-[1.05] text-[var(--text-primary)]" style={{ animationDelay: '100ms' }}>
            <span className="text-[var(--text-primary)]">Terms of </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
            >
              Service
            </span>
          </h1>
          <p className="animate-fade-in-up mx-auto max-w-[42rem] text-[1.125rem] text-[var(--text-secondary)]" style={{ animationDelay: '200ms' }}>
            Last updated: February 2026. Please read these terms carefully before using our platform.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="px-4 pb-20">
        <div className="stagger-children mx-auto flex max-w-4xl flex-col gap-6">
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
                  <h2 className="mb-3 text-xl font-extrabold text-[var(--text-primary)]">{section.title}</h2>
                  <p className="text-sm leading-7 text-[var(--text-secondary)]">{section.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
