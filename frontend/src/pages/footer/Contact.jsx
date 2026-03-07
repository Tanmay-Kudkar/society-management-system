import { useState } from 'react'
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle } from 'lucide-react'
import PageShell from '../../components/PageShell'

export default function Contact() {
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
      <section className="px-4 py-16 sm:py-[5.25rem]">
        <div className="mx-auto max-w-4xl text-center">
          <div
            className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-primary))] px-4 py-2 dark:border-transparent dark:bg-white/5"
          >
            <MessageSquare className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>Get in Touch</span>
          </div>
          <h1 className="animate-fade-in-up mb-6 text-[clamp(2.25rem,4vw,3.75rem)] font-black leading-[1.05] text-[var(--text-primary)]" style={{ animationDelay: '100ms' }}>
            <span className="text-[var(--text-primary)]">Contact </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
            >
              Us
            </span>
          </h1>
          <p className="animate-fade-in-up mx-auto max-w-[42rem] text-[1.15rem] text-[color-mix(in_srgb,var(--text-primary)_68%,var(--text-secondary))]" style={{ animationDelay: '200ms' }}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="px-4 pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="stagger-children grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-card)_92%,var(--bg-secondary))] p-6 text-center shadow-sm transition hover:-translate-y-2 hover:border-[var(--accent-primary)] hover:shadow-[0_0_20px_rgba(47,129,247,0.08)]"
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition group-hover:scale-110"
                  style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  <method.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-1 text-lg font-extrabold text-[var(--text-primary)]">{method.title}</h3>
                <p className="font-semibold" style={{ color: 'var(--accent-primary)' }}>{method.value}</p>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">{method.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="px-4 pb-16 pt-10 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="animate-fade-in-up rounded-3xl border border-[color-mix(in_srgb,var(--accent-primary)_18%,var(--border-default))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent-primary)_10%,var(--bg-card))_0%,color-mix(in_srgb,var(--bg-card)_92%,var(--bg-secondary))_100%)] p-8 shadow-xl md:p-12">
            <h2 className="mb-8 text-center text-2xl font-extrabold text-[var(--text-primary)]">Send us a Message</h2>

            {submitted ? (
              <div className="animate-scale-in py-12 text-center">
                <div
                  className="animate-success-pulse mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: 'color-mix(in srgb, #22c55e 15%, transparent)' }}
                >
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="mb-2 text-xl font-extrabold text-[var(--text-primary)]">Message Sent!</h3>
                <p className="text-[var(--text-secondary)]">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {[
                    { label: 'Your Name', key: 'name', type: 'text', placeholder: 'John Doe' },
                    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@example.com' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">{field.label}</label>
                      <input
                        type={field.type}
                        required
                        value={formData[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full rounded-xl border-2 border-[color-mix(in_srgb,var(--border-default)_65%,transparent)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)] dark:bg-[var(--bg-tertiary)]"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-xl border-2 border-[color-mix(in_srgb,var(--border-default)_65%,transparent)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)] dark:bg-[var(--bg-tertiary)]"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full resize-none rounded-xl border-2 border-[color-mix(in_srgb,var(--border-default)_65%,transparent)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)] dark:bg-[var(--bg-tertiary)]"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-4 font-extrabold text-white transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  {sending ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      Send Message
                    </>
                  )}
                  <div className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] transition duration-700 group-hover:translate-x-[100%]" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  )
}
