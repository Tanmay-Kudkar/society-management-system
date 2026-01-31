import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { Building2, ArrowLeft, Shield, Sun, Moon, Lock, Eye, Database, Bell, Trash2, Mail } from 'lucide-react'
import '../../styles/animations.css'

export default function Privacy() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  const sections = [
    {
      icon: Database,
      title: 'Information We Collect',
      content: [
        'Personal identification information (Name, email address, phone number)',
        'Society and flat details for management purposes',
        'Payment information for transaction processing',
        'Usage data and analytics to improve our services',
        'Device information and IP addresses for security',
      ]
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: [
        'To provide and maintain our society management services',
        'To process payments and send transaction notifications',
        'To send important updates, notices, and service announcements',
        'To improve our platform based on usage patterns',
        'To provide customer support and respond to inquiries',
      ]
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: [
        'All data is encrypted using industry-standard AES-256 encryption',
        'Secure HTTPS connections for all data transmissions',
        'Regular security audits and penetration testing',
        'Access controls and authentication requirements',
        'Compliance with data protection regulations',
      ]
    },
    {
      icon: Bell,
      title: 'Communication Preferences',
      content: [
        'You can opt-out of promotional emails at any time',
        'Critical service notifications cannot be disabled',
        'Push notification preferences can be managed in settings',
        'SMS alerts can be configured per notification type',
      ]
    },
    {
      icon: Trash2,
      title: 'Data Retention & Deletion',
      content: [
        'Active account data is retained while your account is active',
        'You can request data deletion by contacting support',
        'Some data may be retained for legal compliance',
        'Backup data is automatically purged after 90 days',
      ]
    },
    {
      icon: Mail,
      title: 'Contact Us',
      content: [
        'For privacy-related inquiries: privacy@societyhub.com',
        'Data Protection Officer: dpo@societyhub.com',
        'General Support: support@societyhub.com',
        'Phone: +91 1800-XXX-XXXX (Toll Free)',
      ]
    },
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${isDark ? 'bg-slate-900/90 border-white/10' : 'bg-white/90 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/welcome')}
            className={`flex items-center gap-2 transition-colors group ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          
          <div 
            onClick={() => navigate('/welcome')} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">SocietyHub</span>
          </div>

          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl transition-all hover:scale-110 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-500 mb-6">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Your Privacy Matters</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            <span className={isDark ? 'text-white' : 'text-gray-900'}>Privacy </span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Policy</span>
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            We take your privacy seriously. This policy explains how we collect, use, and protect your personal information.
          </p>
          <p className={`mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Last updated: January 31, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, i) => (
            <div 
              key={i}
              className={`group p-8 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:shadow-xl border border-gray-100'}`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 group-hover:scale-110 transition-transform">
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                  <ul className={`space-y-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {section.content.map((item, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 px-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto text-center">
          <p className={isDark ? 'text-gray-500' : 'text-gray-600'}>
            © 2026 SocietyHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
