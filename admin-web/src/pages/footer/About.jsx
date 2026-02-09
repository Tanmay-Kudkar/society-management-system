import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { Target, Heart, Zap, Shield, Globe, Users, Award, ArrowRight } from 'lucide-react'
import PageShell from '../../components/PageShell'

export default function About() {
  const navigate = useNavigate()
  const { isDark } = useTheme()

  const team = [
    { name: 'Tanmay Kudkar', role: 'Founder & CEO', initials: 'TK' },
    { name: 'Priya Sharma', role: 'CTO', initials: 'PS' },
    { name: 'Rahul Mehta', role: 'Head of Design', initials: 'RM' },
    { name: 'Ananya Patel', role: 'Lead Developer', initials: 'AP' },
  ]

  const values = [
    { icon: Heart, title: 'Community First', description: 'We believe in building strong communities through technology and innovation.' },
    { icon: Zap, title: 'Innovation', description: 'Constantly evolving to meet the needs of modern housing societies.' },
    { icon: Shield, title: 'Trust & Security', description: 'Your data security is our top priority with enterprise-grade protection.' },
    { icon: Globe, title: 'Accessibility', description: 'Making society management accessible to everyone, everywhere.' },
  ]

  const stats = [
    { value: '500+', label: 'Societies', color: 'var(--accent-primary)' },
    { value: '50K+', label: 'Residents', color: 'var(--accent-secondary)' },
    { value: '99.9%', label: 'Uptime', color: '#3b82f6' },
    { value: '24/7', label: 'Support', color: '#22c55e' },
  ]

  return (
    <PageShell>
      {/* Hero */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 animate-fade-in-up ${isDark ? 'bg-white/5' : 'border'}`}
            style={isDark ? {} : { background: 'color-mix(in srgb, var(--accent-primary) 8%, white)', borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' }}
          >
            <Target className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>Our Mission</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>Empowering </span>
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}>Communities</span>
          </h1>
          <p className={`text-xl max-w-2xl mx-auto animate-fade-in-up ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ animationDelay: '200ms' }}>
            We're on a mission to transform how housing societies operate, making management seamless and residents happier.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className={`py-16 sm:py-20 px-4 ${isDark ? 'bg-slate-800/30' : 'bg-white'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in-left">
              <h2 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Our Story</h2>
              <div className={`space-y-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <p>SocietyHub was born from a simple observation: managing a housing society shouldn't require spreadsheets, endless phone calls, and paper notices.</p>
                <p>Founded in 2024, we set out to build a platform that brings society management into the digital age. What started as a project to help our own society has grown into a solution trusted by hundreds of communities.</p>
                <p>Today, we're proud to serve over 500 societies, helping them save time, reduce conflicts, and build stronger communities.</p>
              </div>
            </div>
            <div
              className={`p-8 rounded-2xl animate-slide-in-right ${isDark ? 'bg-slate-800/80' : 'border'}`}
              style={isDark ? {} : { background: 'color-mix(in srgb, var(--accent-primary) 5%, white)', borderColor: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)' }}
            >
              <div className="grid grid-cols-2 gap-6 text-center stagger-children">
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="text-4xl font-black" style={{ color: s.color }}>{s.value}</div>
                    <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Our Values</h2>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {values.map((value, i) => (
              <div
                key={i}
                className={`group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 card-accent-hover ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={`py-16 sm:py-20 px-4 ${isDark ? 'bg-slate-800/30' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isDark ? 'bg-white/5' : 'border'}`}
              style={isDark ? {} : { background: 'color-mix(in srgb, var(--accent-primary) 8%, white)', borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' }}
            >
              <Users className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>Our Team</span>
            </div>
            <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Meet the People Behind SocietyHub</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-children">
            {team.map((member, i) => (
              <div
                key={i}
                className={`group text-center p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 card-accent-hover ${isDark ? 'bg-slate-800' : 'bg-gray-50 hover:bg-white'}`}
              >
                <div
                  className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold text-white group-hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
                >
                  {member.initials}
                </div>
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.name}</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="p-12 rounded-3xl relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))` }}
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 0%, transparent 50%), radial-gradient(circle at 70% 80%, white 0%, transparent 50%)' }} />
            <div className="relative z-10">
              <Award className="w-12 h-12 mx-auto mb-6 text-yellow-300" />
              <h2 className="text-3xl font-bold mb-4 text-white">Join Our Growing Family</h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">Be part of the community that's transforming society management</p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white font-bold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 group"
                style={{ color: 'var(--accent-primary)' }}
              >
                Get Started Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
