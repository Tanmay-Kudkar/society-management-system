import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { authApi } from '../api'
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
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/welcome" className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl" style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}>
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>SocietyHub</span>
          </Link>
        </div>

        {/* Card */}
        <div className={`rounded-2xl border p-8 transition-all ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-gray-200 shadow-lg'}`}>
          {!success ? (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: isDark ? 'color-mix(in srgb, var(--accent-primary) 15%, #1e293b)' : 'color-mix(in srgb, var(--accent-primary) 10%, white)' }}
                >
                  <ShieldCheck className="w-7 h-7" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Reset Password</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Create a strong password for your account.
                </p>
              </div>

              {error && (
                <div className={`mb-4 p-3 rounded-xl border flex items-center gap-3 animate-error-shake ${isDark ? 'bg-red-950/40 border-red-800/60' : 'bg-red-50 border-red-200'}`}>
                  <AlertCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl outline-none transition-all ${
                        isDark
                          ? 'border-slate-600 bg-slate-700 text-white placeholder:text-gray-500 focus:border-[var(--accent-primary)]'
                          : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[var(--accent-primary)]'
                      }`}
                      placeholder="Enter new password"
                      required
                      disabled={!token}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${(strength / 5) * 100}%`, background: strengthColor }}
                        />
                      </div>
                      <p className="text-xs mt-1 font-medium" style={{ color: strengthColor }}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl outline-none transition-all ${
                        isDark
                          ? 'border-slate-600 bg-slate-700 text-white placeholder:text-gray-500 focus:border-[var(--accent-primary)]'
                          : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[var(--accent-primary)]'
                      }`}
                      placeholder="Confirm new password"
                      required
                      disabled={!token}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs mt-1 text-red-400">Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs mt-1 text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="relative w-full py-3 px-6 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group focus:outline-none hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))`,
                    boxShadow: `0 8px 24px -4px color-mix(in srgb, var(--accent-primary) 40%, transparent)`
                  }}
                >
                  <span className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : ''}`}>
                    <ShieldCheck className="w-4 h-4" />
                    Reset Password
                  </span>
                  {loading && (
                    <span className="absolute inset-0 flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </span>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center animate-fade-in-up">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)' }}
              >
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Password Reset Successful</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Your password has been updated. Redirecting to sign in...
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:underline"
                style={{ color: 'var(--accent-primary)' }}
              >
                Sign in now
              </Link>
            </div>
          )}

          {/* Back to Login */}
          {!success && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
