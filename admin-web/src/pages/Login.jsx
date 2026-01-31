import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Building2, Mail, Lock, AlertCircle, Eye, EyeOff, ArrowLeft, Sparkles, Sun, Moon } from 'lucide-react'
import '../styles/animations.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const { login } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className={`min-h-screen flex overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Left Side - Decorative */}
      <div 
        className={`hidden lg:flex lg:w-1/2 relative overflow-hidden ${isDark ? 'bg-slate-900' : ''}`}
        style={isDark ? {} : { background: `linear-gradient(to bottom right, var(--accent-gradient-from), var(--accent-gradient-via), var(--accent-gradient-to))` }}
      >
        {/* Background Elements */}
        {isDark ? (
          <>
            <div 
              className="absolute inset-0"
              style={{ background: `linear-gradient(to bottom right, color-mix(in srgb, var(--accent-primary) 30%, #0f172a), #0f172a, color-mix(in srgb, var(--accent-secondary) 20%, #0f172a))` }}
            ></div>
            <div className="absolute inset-0 gradient-mesh opacity-30"></div>
            {/* Floating Orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-floatSlow" style={{ background: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-float" style={{ background: 'color-mix(in srgb, var(--accent-secondary) 20%, transparent)' }}></div>
            <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full blur-3xl animate-floatSlow" style={{ animationDelay: '1s', background: 'color-mix(in srgb, var(--accent-light) 20%, transparent)' }}></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className={`transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Link to="/welcome" className={`inline-flex items-center gap-2 transition-colors mb-12 group ${isDark ? 'text-gray-400 hover:text-white' : 'text-white/80 hover:text-white'}`}>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>

            <div className="flex items-center gap-4 mb-8">
              <div 
                className={`p-4 rounded-2xl shadow-2xl ${isDark ? 'shadow-[var(--accent-primary)]/30' : 'bg-white/20 backdrop-blur-xl'}`}
                style={isDark ? { background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` } : {}}
              >
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">SocietyHub</h1>
                <p className={isDark ? 'text-gray-400' : 'text-white/80'}>Admin Portal</p>
              </div>
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Welcome back to
              <span 
                className={`block ${isDark ? 'bg-clip-text text-transparent' : 'text-yellow-200'}`}
                style={isDark ? { backgroundImage: `linear-gradient(to right, var(--accent-light), var(--accent-secondary))` } : {}}
              >
                the future of society management
              </span>
            </h2>

            <p className={`text-lg max-w-md ${isDark ? 'text-gray-400' : 'text-white/80'}`}>
              Sign in to access your dashboard and manage your society with ease.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mt-8">
              {['Secure Login', 'Role Based Access', '24/7 Available'].map((feature, i) => (
                <div 
                  key={i}
                  className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 ${isDark ? 'glass-dark text-gray-300' : 'bg-white/20 backdrop-blur-sm text-white'}`}
                  style={{ animationDelay: `${0.5 + i * 0.1}s` }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: isDark ? 'var(--accent-light)' : '#fde047' }} />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grid Pattern */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`} 
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Right Side - Login Form */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center px-4 py-12 transition-colors ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className={`max-w-md w-full transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Theme Toggle - Top Right */}
          <div className="flex justify-end mb-6">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 focus:outline-none ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/welcome" className={`inline-flex items-center gap-2 transition-colors mb-6 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl" style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}>
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>SocietyHub</span>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className={`text-2xl lg:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Sign in to your account
            </h2>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 animate-shake ${isDark ? 'bg-red-900/20 border-red-800/50' : 'bg-red-50 border-red-200'}`}>
              <div className={`flex-shrink-0 p-1 rounded-lg ${isDark ? 'bg-red-800/30' : 'bg-red-100'}`}>
                <AlertCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <div>
                <p className={`font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>Authentication Failed</p>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <div className="relative group">
                <div 
                  className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity -m-0.5"
                  style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
                ></div>
                <div className="relative">
                  <Mail 
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                    style={{ '--group-focus-color': 'var(--accent-primary)' }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl outline-none transition-all ${
                      isDark 
                        ? 'border-slate-700 bg-slate-800 text-white placeholder:text-gray-500' 
                        : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400'
                    }`}
                    style={{ '--tw-border-opacity': 1 }}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative group">
                <div 
                  className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity -m-0.5"
                  style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
                ></div>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl outline-none transition-all ${
                      isDark 
                        ? 'border-slate-700 bg-slate-800 text-white placeholder:text-gray-500' 
                        : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400'
                    }`}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors focus:outline-none ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500" />
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium transition-colors" style={{ color: 'var(--accent-primary)' }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-4 px-6 text-white font-semibold rounded-xl focus:ring-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group focus:outline-none"
              style={{ 
                background: `linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))`,
              }}
            >
              <span className={`flex items-center justify-center gap-2 transition-all ${loading ? 'opacity-0' : 'opacity-100'}`}>
                Sign In
              </span>
              
              {loading && (
                <span className="absolute inset-0 flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </span>
              )}

              {/* Hover Shine Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </button>
          </form>

          {/* Footer */}
          <p className={`mt-8 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Don't have an account?{' '}
            <a href="#" className="font-semibold transition-colors" style={{ color: 'var(--accent-primary)' }}>
              Contact Admin
            </a>
          </p>

          {/* Demo Credentials */}
          <div className={`mt-6 p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Demo Credentials</p>
            <div className="space-y-1 text-sm">
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}><span className="font-medium">Email:</span> admin@society.com</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}><span className="font-medium">Password:</span> admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
