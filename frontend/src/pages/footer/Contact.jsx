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
      <section className="contact-hero">
        <div className="contact-hero-inner">
          <div
            className="contact-pill animate-fade-in-up"
          >
            <MessageSquare className="contact-pill-icon" style={{ color: 'var(--accent-primary)' }} />
            <span className="contact-pill-text" style={{ color: 'var(--accent-primary)' }}>Get in Touch</span>
          </div>
          <h1 className="contact-title animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <span className="contact-title-text">Contact </span>
            <span
              className="contact-title-gradient"
              style={{ backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
            >
              Us
            </span>
          </h1>
          <p className="contact-lead animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="contact-methods">
        <div className="contact-methods-inner">
          <div className="contact-methods-grid stagger-children">
            {contactMethods.map((method, i) => (
              <div
                key={i}
                className="contact-method-card card-accent-hover"
              >
                <div
                  className="contact-method-icon"
                  style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  <method.icon className="contact-method-icon-svg" />
                </div>
                <h3 className="contact-method-title">{method.title}</h3>
                <p className="contact-method-value" style={{ color: 'var(--accent-primary)' }}>{method.value}</p>
                <p className="contact-method-desc">{method.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="contact-form-section">
        <div className="contact-form-inner">
          <div className="contact-form-card animate-fade-in-up">
            <h2 className="contact-form-title">Send us a Message</h2>

            {submitted ? (
              <div className="contact-success animate-scale-in">
                <div
                  className="contact-success-icon animate-success-pulse"
                  style={{ background: 'color-mix(in srgb, #22c55e 15%, transparent)' }}
                >
                  <CheckCircle className="contact-success-icon-svg" />
                </div>
                <h3 className="contact-success-title">Message Sent!</h3>
                <p className="contact-success-text">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="contact-form-grid">
                  {[
                    { label: 'Your Name', key: 'name', type: 'text', placeholder: 'John Doe' },
                    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@example.com' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="contact-label">{field.label}</label>
                      <input
                        type={field.type}
                        required
                        value={formData[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="contact-input"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="contact-label">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="contact-input"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="contact-label">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="contact-textarea"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="contact-submit"
                  style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  {sending ? (
                    <>
                      <div className="contact-submit-spinner" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="contact-submit-icon" />
                      Send Message
                    </>
                  )}
                  <div className="contact-submit-sheen" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  )
}
