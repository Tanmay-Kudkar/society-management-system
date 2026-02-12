import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { authApi } from '../../../api'
import { Building2, Mail, ArrowLeft, CheckCircle, AlertCircle, Send } from 'lucide-react'
import '../styles/animations.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { isDark } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`forgot-page ${isDark ? 'is-dark' : 'is-light'}`}>
      <div className="forgot-panel">
        {/* Logo */}
        <div className="forgot-logo">
          <Link to="/welcome" className="forgot-logo-link">
            <div className="forgot-logo-badge" style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}>
              <Building2 className="forgot-logo-icon" />
            </div>
            <span className="forgot-brand">SocietyHub</span>
          </Link>
        </div>

        {/* Card */}
        <div className="forgot-card">
          {!sent ? (
            <>
              <div className="forgot-card-header">
                <div className="forgot-card-icon"
                  style={{ background: isDark ? 'color-mix(in srgb, var(--accent-primary) 15%, #1e293b)' : 'color-mix(in srgb, var(--accent-primary) 10%, white)' }}
                >
                  <Mail className="forgot-card-icon-svg" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h2 className="forgot-card-title">Forgot Password?</h2>
                <p className="forgot-card-subtitle">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="forgot-alert">
                  <AlertCircle className="forgot-alert-icon" />
                  <p className="forgot-alert-text">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="forgot-form">
                <div className="forgot-field">
                  <label className="forgot-label">
                    Email Address
                  </label>
                  <div className="forgot-input-wrap">
                    <Mail className="forgot-input-icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="forgot-input"
                      placeholder="Enter your registered email"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="forgot-submit"
                  style={{
                    background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))`,
                    boxShadow: `0 8px 24px -4px color-mix(in srgb, var(--accent-primary) 40%, transparent)`
                  }}
                >
                  <span className={`forgot-submit-content ${loading ? 'is-hidden' : ''}`}>
                    <Send className="forgot-submit-icon" />
                    Send Reset Link
                  </span>
                  {loading && (
                    <span className="forgot-submit-loading">
                      <div className="forgot-submit-spinner" />
                      Sending...
                    </span>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="forgot-success">
              <div className="forgot-success-icon"
                style={{ background: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)' }}
              >
                <CheckCircle className="forgot-success-icon-svg" />
              </div>
              <h3 className="forgot-success-title">Check Your Email</h3>
              <p className="forgot-success-text">
                If an account exists for <strong className="forgot-success-email">{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <p className="forgot-success-note">
                Didn't receive the email? Check your spam folder or try again in a few minutes.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="forgot-success-button"
              >
                Try Another Email
              </button>
            </div>
          )}

          {/* Back to Login */}
          <div className="forgot-back">
            <Link
              to="/login"
              className="forgot-back-link"
            >
              <ArrowLeft className="forgot-back-icon" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
