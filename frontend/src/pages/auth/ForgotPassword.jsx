import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context'
import { authApi } from '../../../../api'
import { Building2, Mail, ArrowLeft, CheckCircle, AlertCircle, Send } from 'lucide-react'

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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-3 py-8 sm:px-4 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 sm:mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3 no-underline">
            <div className="rounded-xl p-3" style={{ background: 'linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))' }}>
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-[var(--text-primary)]">SocietyHub</span>
          </Link>
        </div>

        <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 sm:p-8 shadow-xl">
          {!sent ? (
            <>
              <div className="mb-6 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: isDark ? 'color-mix(in srgb, var(--accent-primary) 15%, #1e293b)' : 'color-mix(in srgb, var(--accent-primary) 10%, white)' }}
                >
                  <Mail className="h-7 w-7" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h2 className="mb-2 text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">Forgot Password?</h2>
                <p className="text-sm text-[var(--text-secondary)]">Enter your email address and we'll send you a link to reset your password.</p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-300/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[var(--text-primary)]">Email Address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border-2 border-[var(--border-default)] bg-[var(--bg-primary)] py-3 pl-12 pr-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)]"
                      placeholder="Enter your registered email"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative mt-1 w-full overflow-hidden rounded-2xl px-6 py-3 font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                    boxShadow: '0 8px 24px -4px color-mix(in srgb, var(--accent-primary) 40%, transparent)',
                  }}
                >
                  {!loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Send className="h-4 w-4" />
                      Send Reset Link
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Sending...
                    </span>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="py-2 text-center">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)' }}
              >
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="mb-2 text-2xl font-extrabold text-[var(--text-primary)]">Check Your Email</h3>
              <p className="mb-2 text-sm leading-6 text-[var(--text-secondary)]">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <p className="mb-5 text-xs text-[var(--text-tertiary)]">Didn't receive the email? Check your spam folder or try again in a few minutes.</p>
              <button onClick={() => { setSent(false); setEmail('') }} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)]">
                Try Another Email
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] no-underline transition hover:text-[var(--accent-primary)]">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
