import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { Building2, ArrowLeft, FileText, Sun, Moon, CheckCircle, XCircle, AlertTriangle, Scale, CreditCard, HelpCircle } from 'lucide-react'
import '../../styles/animations.css'

export default function Terms() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  const sections = [
    {
      icon: CheckCircle,
      title: 'Acceptance of Terms',
      content: `By accessing and using SocietyHub's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to modify these terms at any time, and your continued use of the platform constitutes acceptance of any changes.`
    },
    {
      icon: FileText,
      title: 'Service Description',
      content: `SocietyHub provides a comprehensive digital platform for housing society management, including but not limited to: resident management, billing and payment processing, complaint management, notice distribution, vehicle registry, and document management. We strive to maintain 99.9% uptime but do not guarantee uninterrupted service.`
    },
    {
      icon: Scale,
      title: 'User Responsibilities',
      content: `Users are responsible for maintaining the confidentiality of their account credentials, providing accurate and current information, using the service in compliance with all applicable laws, not sharing access with unauthorized parties, and reporting any security breaches immediately. Society administrators are responsible for managing their society's data and user access.`
    },
    {
      icon: CreditCard,
      title: 'Payment Terms',
      content: `Payment processing is handled through secure third-party gateways. All maintenance bills and fees must be paid by the due date. Late payments may incur additional charges as per society rules. Refunds are processed according to our refund policy. We are not responsible for failed transactions due to bank issues.`
    },
    {
      icon: XCircle,
      title: 'Prohibited Activities',
      content: `Users may not: attempt to gain unauthorized access to other accounts, use the service for any illegal purpose, upload malicious content or malware, harass or harm other users, resell or redistribute our services without permission, scrape or collect user data without authorization, or interfere with the proper operation of the platform.`
    },
    {
      icon: AlertTriangle,
      title: 'Limitation of Liability',
      content: `SocietyHub shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services. Our total liability shall not exceed the amount paid by you in the past 12 months. We are not liable for actions taken by society administrators or other users.`
    },
    {
      icon: HelpCircle,
      title: 'Dispute Resolution',
      content: `Any disputes arising from the use of our services shall first be attempted to be resolved through good faith negotiation. If unresolved, disputes shall be submitted to binding arbitration in accordance with Indian law. The venue for any legal proceedings shall be Mumbai, India.`
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
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Legal Agreement</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            <span className={isDark ? 'text-white' : 'text-gray-900'}>Terms of </span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Service</span>
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Please read these terms carefully before using our services. By using SocietyHub, you agree to these terms.
          </p>
          <p className={`mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Effective Date: January 1, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map((section, i) => (
            <div 
              key={i}
              className={`group p-8 rounded-2xl transition-all duration-300 hover:scale-[1.01] ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:shadow-xl border border-gray-100'}`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 group-hover:scale-110 transition-transform">
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-3">{section.title}</h2>
                  <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30' : 'bg-gradient-to-br from-purple-100 to-pink-100'}`}>
            <h3 className="text-xl font-bold mb-4">Questions about our Terms?</h3>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              If you have any questions about these Terms of Service, please contact our legal team.
            </p>
            <a 
              href="mailto:legal@societyhub.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform"
            >
              Contact Legal Team
            </a>
          </div>
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
