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
          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: isDark ? 'color-mix(in srgb, var(--accent-primary) 15%, #1e293b)' : 'color-mix(in srgb, var(--accent-primary) 10%, white)' }}
                >
                  <Mail className="w-7 h-7" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Forgot Password?</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className={`mb-4 p-3 rounded-xl border flex items-center gap-3 animate-error-shake ${isDark ? 'bg-red-950/40 border-red-800/60' : 'bg-red-50 border-red-200'}`}>
                  <AlertCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl outline-none transition-all ${
                        isDark
                          ? 'border-slate-600 bg-slate-700 text-white placeholder:text-gray-500 focus:border-[var(--accent-primary)]'
                          : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[var(--accent-primary)]'
                      }`}
                      placeholder="Enter your registered email"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full py-3 px-6 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group focus:outline-none hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))`,
                    boxShadow: `0 8px 24px -4px color-mix(in srgb, var(--accent-primary) 40%, transparent)`
                  }}
                >
                  <span className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : ''}`}>
                    <Send className="w-4 h-4" />
                    Send Reset Link
                  </span>
                  {loading && (
                    <span className="absolute inset-0 flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
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
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Check Your Email</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                If an account exists for <strong className={isDark ? 'text-gray-200' : 'text-gray-700'}>{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <p className={`text-xs mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Didn't receive the email? Check your spam folder or try again in a few minutes.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                  isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Try Another Email
              </button>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
