import { useTheme } from '../../context/ThemeContext'
import { Shield, Eye, Lock, Server, Mail, Database, Clock } from 'lucide-react'
import PageShell from '../../components/PageShell'

export default function Privacy() {
  const { isDark } = useTheme()

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
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 animate-fade-in-up ${isDark ? 'bg-white/5' : 'border'}`}
            style={isDark ? {} : { background: 'color-mix(in srgb, var(--accent-primary) 8%, white)', borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' }}
          >
            <Shield className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>Your Data, Your Rights</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>Privacy </span>
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}>Policy</span>
          </h1>
          <p className={`text-lg max-w-2xl mx-auto animate-fade-in-up ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ animationDelay: '200ms' }}>
            Last updated: February 2026. We take your privacy seriously. This policy explains how we collect, use, and protect your information.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto space-y-8 stagger-children">
          {sections.map((section, i) => (
            <div
              key={i}
              className={`p-6 sm:p-8 rounded-2xl transition-all duration-300 card-accent-hover ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  <section.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{section.title}</h2>
                  <ul className="space-y-3">
                    {section.content.map((item, j) => (
                      <li key={j} className={`flex items-start gap-3 text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--accent-primary)' }} />
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
