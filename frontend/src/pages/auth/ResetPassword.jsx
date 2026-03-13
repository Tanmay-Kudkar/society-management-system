import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../context'
import { authApi } from '../../../../api'
import { Building2, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react'

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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3 no-underline">
            <div className="rounded-xl p-3" style={{ background: 'linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))' }}>
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-[var(--text-primary)]">SocietyHub</span>
          </Link>
        </div>

        <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8 shadow-xl">
          {!success ? (
            <>
              <div className="mb-6 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: isDark ? 'color-mix(in srgb, var(--accent-primary) 15%, #1e293b)' : 'color-mix(in srgb, var(--accent-primary) 10%, white)' }}
                >
                  <ShieldCheck className="h-7 w-7" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h2 className="mb-2 text-3xl font-extrabold text-[var(--text-primary)]">Reset Password</h2>
                <p className="text-sm text-[var(--text-secondary)]">Create a strong password for your account.</p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-300/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[var(--text-primary)]">New Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border-2 border-[var(--border-default)] bg-[var(--bg-primary)] py-3 pl-12 pr-11 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)]"
                      placeholder="Enter new password"
                      required
                      disabled={!token}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-1">
                      <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${(strength / 5) * 100}%`, background: strengthColor }} />
                      </div>
                      <p className="mt-1 text-xs font-semibold" style={{ color: strengthColor }}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[var(--text-primary)]">Confirm Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-2xl border-2 border-[var(--border-default)] bg-[var(--bg-primary)] py-3 pl-12 pr-11 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)]"
                      placeholder="Confirm new password"
                      required
                      disabled={!token}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && <p className="text-xs text-red-500">Passwords do not match</p>}
                  {confirmPassword && password === confirmPassword && (
                    <p className="inline-flex items-center gap-1 text-xs text-emerald-500"><CheckCircle className="h-3 w-3" /> Passwords match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="relative mt-1 w-full overflow-hidden rounded-2xl px-6 py-3 font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                    boxShadow: '0 8px 24px -4px color-mix(in srgb, var(--accent-primary) 40%, transparent)',
                  }}
                >
                  {!loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Reset Password
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Resetting...
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
              <h3 className="mb-2 text-2xl font-extrabold text-[var(--text-primary)]">Password Reset Successful</h3>
              <p className="mb-5 text-sm text-[var(--text-secondary)]">Your password has been updated. Redirecting to sign in...</p>
              <Link to="/login" className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] no-underline transition hover:bg-[var(--bg-tertiary)]">
                Sign in now
              </Link>
            </div>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] no-underline transition hover:text-[var(--accent-primary)]">
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
