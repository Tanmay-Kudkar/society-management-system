import { FileText, AlertTriangle, CreditCard, ShieldAlert, Gavel, HandshakeIcon, UserCheck } from 'lucide-react'
import PageShell from '../../components/PageShell'
import clsx from 'clsx'

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
      <div className="relative z-10">
        {/* Hero */}
        <section className="px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div
              className="animate-fade-in-up mb-6 inline-flex items-center gap-2.5 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] px-4 py-1.5 shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] p-1">
                <FileText className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)]">Legal Agreement</span>
            </div>
            <h1 className="animate-fade-in-up mb-6 text-[clamp(2.5rem,5vw,4rem)] font-[950] leading-[1.05] tracking-tight text-[var(--text-primary)]" style={{ animationDelay: '100ms' }}>
              Terms of <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[#3b82f6] bg-clip-text text-transparent"> Service</span>
            </h1>
            <p className="animate-fade-in-up mx-auto max-w-[42rem] text-[1.125rem] font-medium leading-relaxed text-[var(--text-secondary)]" style={{ animationDelay: '200ms' }}>
              Last updated: March 2026. <br className="hidden sm:inline" />
              Please read these terms carefully before using our platform to ensure a trusted community.
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
                  
                  <p className="text-[0.95rem] font-medium leading-relaxed text-[color-mix(in_srgb,var(--text-secondary)_95%,transparent)]">
                    {section.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
