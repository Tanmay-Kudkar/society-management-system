import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { authApi } from '../../../api'
import { Building2, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import '../styles/animations.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { isDark } = useTheme()

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [token])

  const passwordStrength = (pw) => {
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 10) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }

  const strength = passwordStrength(password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength] || ''
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][strength] || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 4000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`reset-page ${isDark ? 'is-dark' : 'is-light'}`}>
      <div className="reset-panel">
        {/* Logo */}
        <div className="reset-logo">
          <Link to="/welcome" className="reset-logo-link">
            <div className="reset-logo-badge" style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}>
              <Building2 className="reset-logo-icon" />
            </div>
            <span className="reset-brand">SocietyHub</span>
          </Link>
        </div>

        {/* Card */}
        <div className="reset-card">
          {!success ? (
            <>
              <div className="reset-card-header">
                <div className="reset-card-icon"
                  style={{ background: isDark ? 'color-mix(in srgb, var(--accent-primary) 15%, #1e293b)' : 'color-mix(in srgb, var(--accent-primary) 10%, white)' }}
                >
                  <ShieldCheck className="reset-card-icon-svg" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h2 className="reset-card-title">Reset Password</h2>
                <p className="reset-card-subtitle">
                  Create a strong password for your account.
                </p>
              </div>

              {error && (
                <div className="reset-alert">
                  <AlertCircle className="reset-alert-icon" />
                  <p className="reset-alert-text">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="reset-form">
                {/* New Password */}
                <div className="reset-field">
                  <label className="reset-label">
                    New Password
                  </label>
                  <div className="reset-input-wrap">
                    <Lock className="reset-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="reset-input"
                      placeholder="Enter new password"
                      required
                      disabled={!token}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="reset-input-action"
                    >
                      {showPassword ? <EyeOff className="reset-input-action-icon" /> : <Eye className="reset-input-action-icon" />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {password && (
                    <div className="reset-strength">
                      <div className={`reset-strength-track ${isDark ? 'is-dark' : 'is-light'}`}>
                        <div
                          className="reset-strength-bar"
                          style={{ width: `${(strength / 5) * 100}%`, background: strengthColor }}
                        />
                      </div>
                      <p className="reset-strength-label" style={{ color: strengthColor }}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="reset-field">
                  <label className="reset-label">
                    Confirm Password
                  </label>
                  <div className="reset-input-wrap">
                    <Lock className="reset-input-icon" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="reset-input"
                      placeholder="Confirm new password"
                      required
                      disabled={!token}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="reset-input-action"
                    >
                      {showConfirm ? <EyeOff className="reset-input-action-icon" /> : <Eye className="reset-input-action-icon" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="reset-match reset-match--error">Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="reset-match reset-match--success">
                      <CheckCircle className="reset-match-icon" /> Passwords match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="reset-submit"
                  style={{
                    background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))`,
                    boxShadow: `0 8px 24px -4px color-mix(in srgb, var(--accent-primary) 40%, transparent)`
                  }}
                >
                  <span className={`reset-submit-content ${loading ? 'is-hidden' : ''}`}>
                    <ShieldCheck className="reset-submit-icon" />
                    Reset Password
                  </span>
                  {loading && (
                    <span className="reset-submit-loading">
                      <div className="reset-submit-spinner" />
                      Resetting...
                    </span>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="reset-success">
              <div className="reset-success-icon"
                style={{ background: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)' }}
              >
                <CheckCircle className="reset-success-icon-svg" />
              </div>
              <h3 className="reset-success-title">Password Reset Successful</h3>
              <p className="reset-success-text">
                Your password has been updated. Redirecting to sign in...
              </p>
              <Link
                to="/login"
                className="reset-success-link"
              >
                Sign in now
              </Link>
            </div>
          )}

          {/* Back to Login */}
          {!success && (
            <div className="reset-back">
              <Link
                to="/login"
                className="reset-back-link"
              >
                <ArrowLeft className="reset-back-icon" />
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
