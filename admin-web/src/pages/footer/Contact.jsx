import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { Building2, ArrowLeft, Sun, Moon, Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle } from 'lucide-react'
import '../../styles/animations.css'

export default function Contact() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simulate form submission
    setSubmitted(true)
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' })
      setSubmitted(false)
    }, 3000)
  }

  const contactMethods = [
    { icon: Mail, title: 'Email Us', value: 'support@societyhub.com', description: 'We reply within 24 hours' },
    { icon: Phone, title: 'Call Us', value: '+91 1800-XXX-XXXX', description: 'Mon-Sat, 9AM-6PM IST' },
    { icon: MapPin, title: 'Visit Us', value: 'Mumbai, India', description: 'By appointment only' },
    { icon: Clock, title: 'Business Hours', value: '9:00 AM - 6:00 PM', description: 'Monday to Saturday' },
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
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Get in Touch</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            <span className={isDark ? 'text-white' : 'text-gray-900'}>Contact </span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Us</span>
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, i) => (
              <div 
                key={i}
                className={`group p-6 rounded-2xl text-center transition-all duration-300 hover:-translate-y-2 cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:shadow-xl border border-gray-100'}`}
              >
                <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <method.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">{method.title}</h3>
                <p className={`font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{method.value}</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{method.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className={`p-8 md:p-12 rounded-3xl ${isDark ? 'bg-slate-800' : 'bg-white shadow-xl border border-gray-100'}`}>
            <h2 className="text-2xl font-bold mb-8 text-center">Send us a Message</h2>
            
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:ring-2 focus:ring-purple-500/20 outline-none ${
                        isDark 
                          ? 'bg-slate-700 border-slate-600 focus:border-purple-500 text-white placeholder:text-gray-400' 
                          : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900 placeholder:text-gray-400'
                      }`}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:ring-2 focus:ring-purple-500/20 outline-none ${
                        isDark 
                          ? 'bg-slate-700 border-slate-600 focus:border-purple-500 text-white placeholder:text-gray-400' 
                          : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900 placeholder:text-gray-400'
                      }`}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:ring-2 focus:ring-purple-500/20 outline-none ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 focus:border-purple-500 text-white placeholder:text-gray-400' 
                        : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900 placeholder:text-gray-400'
                    }`}
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:ring-2 focus:ring-purple-500/20 outline-none resize-none ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 focus:border-purple-500 text-white placeholder:text-gray-400' 
                        : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900 placeholder:text-gray-400'
                    }`}
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className={`h-64 rounded-2xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-200'} flex items-center justify-center`}>
            <div className="text-center">
              <MapPin className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>Interactive Map Coming Soon</p>
            </div>
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
