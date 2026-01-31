import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { Building2, ArrowLeft, Users, Target, Award, Heart, Zap, Shield, Globe, Sun, Moon } from 'lucide-react'
import '../../styles/animations.css'

export default function About() {
  const navigate = useNavigate()
  const { theme, toggleTheme, isDark } = useTheme()

  const team = [
    { name: 'Tanmay Kudkar', role: 'Founder & CEO', image: 'TK' },
    { name: 'Priya Sharma', role: 'CTO', image: 'PS' },
    { name: 'Rahul Mehta', role: 'Head of Design', image: 'RM' },
    { name: 'Ananya Patel', role: 'Lead Developer', image: 'AP' },
  ]

  const values = [
    { icon: Heart, title: 'Community First', description: 'We believe in building strong communities through technology' },
    { icon: Zap, title: 'Innovation', description: 'Constantly evolving to meet the needs of modern societies' },
    { icon: Shield, title: 'Trust & Security', description: 'Your data security is our top priority' },
    { icon: Globe, title: 'Accessibility', description: 'Making society management accessible to everyone' },
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${isDark ? 'bg-slate-900/90 border-white/10' : 'bg-white/90 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/welcome')}
            className={`flex items-center gap-2 transition-colors group ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          
          <div className="flex items-center gap-3">
            <div 
              onClick={() => navigate('/welcome')} 
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">SocietyHub</span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl transition-all hover:scale-110 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-500 mb-6">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Our Mission</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            <span className={isDark ? 'text-white' : 'text-gray-900'}>Empowering </span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Communities</span>
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            We're on a mission to transform how housing societies operate, making management seamless and residents happier.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className={`py-20 px-4 ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className={`space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <p>
                  SocietyHub was born from a simple observation: managing a housing society shouldn't require spreadsheets, endless phone calls, and paper notices.
                </p>
                <p>
                  Founded in 2024, we set out to build a platform that brings society management into the digital age. What started as a project to help our own society has grown into a solution trusted by hundreds of communities.
                </p>
                <p>
                  Today, we're proud to serve over 500 societies, helping them save time, reduce conflicts, and build stronger communities.
                </p>
              </div>
            </div>
            <div className={`p-8 rounded-2xl ${isDark ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50' : 'bg-gradient-to-br from-purple-100 to-pink-100'}`}>
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-4xl font-black text-purple-500">500+</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Societies</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-pink-500">50K+</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Residents</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-blue-500">99.9%</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Uptime</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-green-500">24/7</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <div 
                key={i}
                className={`group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:shadow-xl border border-gray-100'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={`py-20 px-4 ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-500 mb-6">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Our Team</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Meet the People Behind SocietyHub</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, i) => (
              <div 
                key={i}
                className={`group text-center p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-50 hover:bg-white hover:shadow-xl'}`}
              >
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white group-hover:scale-110 transition-transform">
                  {member.image}
                </div>
                <h3 className="font-bold text-lg">{member.name}</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`p-12 rounded-3xl ${isDark ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
            <Award className="w-12 h-12 mx-auto mb-6 text-yellow-400" />
            <h2 className="text-3xl font-bold mb-4 text-white">Join Our Growing Family</h2>
            <p className={`mb-8 ${isDark ? 'text-gray-300' : 'text-white/80'}`}>
              Be part of the community that's transforming society management
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100 transition-all hover:scale-105"
            >
              Get Started Today
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 px-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto text-center">
          <p className={isDark ? 'text-gray-500' : 'text-gray-600'}>
            © 2026 SocietyHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
