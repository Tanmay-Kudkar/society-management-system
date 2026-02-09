import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle } from 'lucide-react'
import PageShell from '../../components/PageShell'

export default function Contact() {
  const { isDark } = useTheme()
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setSubmitted(true)
      setTimeout(() => {
        setFormData({ name: '', email: '', subject: '', message: '' })
        setSubmitted(false)
      }, 4000)
    }, 1500)
  }

  const contactMethods = [
    { icon: Mail, title: 'Email Us', value: 'support@societyhub.com', description: 'We reply within 24 hours' },
    { icon: Phone, title: 'Call Us', value: '+91 1800-XXX-XXXX', description: 'Mon-Sat, 9AM-6PM IST' },
    { icon: MapPin, title: 'Visit Us', value: 'Mumbai, India', description: 'By appointment only' },
    { icon: Clock, title: 'Business Hours', value: '9:00 AM - 6:00 PM', description: 'Monday to Saturday' },
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
            <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>Get in Touch</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>Contact </span>
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}>Us</span>
          </h1>
          <p className={`text-xl max-w-2xl mx-auto animate-fade-in-up ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ animationDelay: '200ms' }}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {contactMethods.map((method, i) => (
              <div
                key={i}
                className={`group p-6 rounded-2xl text-center transition-all duration-300 hover:-translate-y-2 card-accent-hover ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}
              >
                <div
                  className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  <method.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{method.title}</h3>
                <p className="font-medium" style={{ color: 'var(--accent-primary)' }}>{method.value}</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{method.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className={`p-8 md:p-12 rounded-3xl animate-fade-in-up ${isDark ? 'bg-slate-800' : 'bg-white shadow-xl border border-gray-100'}`}>
            <h2 className={`text-2xl font-bold mb-8 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Send us a Message</h2>

            {submitted ? (
              <div className="text-center py-12 animate-scale-in">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 animate-success-pulse"
                  style={{ background: 'color-mix(in srgb, #22c55e 15%, transparent)' }}
                >
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Message Sent!</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { label: 'Your Name', key: 'name', type: 'text', placeholder: 'John Doe' },
                    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@example.com' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{field.label}</label>
                      <input
                        type={field.type}
                        required
                        value={formData[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none focus:ring-2 ${
                          isDark
                            ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-400'
                            : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                        }`}
                        style={{ '--tw-ring-color': 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                        onBlur={(e) => e.target.style.borderColor = ''}
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none resize-none ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-4 px-6 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group relative overflow-hidden"
                  style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  {sending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      Send Message
                    </>
                  )}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  )
}
