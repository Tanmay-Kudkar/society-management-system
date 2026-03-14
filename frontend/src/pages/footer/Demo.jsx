import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Building2, CreditCard, Users, MessageSquare, Bell, Shield, ArrowRight, CheckCircle, MonitorSmartphone, Zap, ChevronRight, BarChart3, LockKeyhole } from 'lucide-react'
import PageShell from '../../components/PageShell'
import PublicSweepButton from '../../components/PublicSweepButton'
import PublicOutlineButton from '../../components/PublicOutlineButton'

export default function Demo() {
  const navigate = useNavigate()
  const [activePreviewTab, setActivePreviewTab] = useState('Dashboard')
  const [activeTimeframe, setActiveTimeframe] = useState('1M')

  const demoFeatures = [
    { icon: Building2, title: 'Society Dashboard', desc: 'Get a bird\'s-eye view of your entire society — units, residents, and key metrics at a glance.' },
    { icon: CreditCard, title: 'Bill Management', desc: 'See how maintenance bills are generated, tracked, and collected with zero manual effort.' },
    { icon: Users, title: 'Resident Portal', desc: 'Experience the self-service portal where residents raise requests and manage their profiles.' },
    { icon: MessageSquare, title: 'Complaint Tracking', desc: 'Watch how complaints flow from submission to resolution with full status tracking.' },
    { icon: Bell, title: 'Notice Broadcasting', desc: 'Send targeted notices to specific wings, floors, or all residents with one click.' },
    { icon: Shield, title: 'Role-Based Access', desc: 'See how admins, committee members, and residents get different access levels.' },
  ]

  const steps = [
    { step: '01', title: 'Contact Administrator', desc: 'Reach out to your society administrator or support team to request access.' },
    { step: '02', title: 'Receive Login Credentials', desc: 'Get your unique login credentials via email or WhatsApp.' },
    { step: '03', title: 'Login & Configure', desc: 'Log in and set up your society details — wings, floors, and units.' },
    { step: '04', title: 'Go Live', desc: 'Start managing bills, notices, and complaints from day one.' },
  ]

  const previewTabs = [
    { id: 'Dashboard', icon: BarChart3 },
    { id: 'Residents', icon: Users },
    { id: 'Bills', icon: CreditCard },
    { id: 'Notices', icon: Bell },
    { id: 'Complaints', icon: MessageSquare }
  ]

  const previewContent = {
    Dashboard: {
      stats: [
        { label: 'Total Units', value: '248', trend: '+12%' },
        { label: 'Active Residents', value: '612', trend: '+5%' },
        { label: 'Pending Bills', value: '34', trend: '-2%' },
        { label: 'Open Tickets', value: '8', trend: '-15%' },
      ],
      bars: [45, 60, 55, 90, 70, 85, 95],
      chartLabel: 'Monthly Collection Trend',
      color: 'var(--accent-primary)'
    },
    Residents: {
      stats: [
        { label: 'Owners', value: '332', trend: '+8%' },
        { label: 'Tenants', value: '280', trend: '+3%' },
        { label: 'Pending KYC', value: '12', trend: '-5%' },
        { label: 'New This Month', value: '19', trend: '+22%' },
      ],
      bars: [58, 66, 72, 81, 78, 69, 74],
      chartLabel: 'Resident Onboarding Trend',
      color: 'var(--color-success)'
    },
    Bills: {
      stats: [
        { label: 'Generated', value: '248', trend: '100%' },
        { label: 'Collected', value: '214', trend: '86%' },
        { label: 'Pending', value: '34', trend: '14%' },
        { label: 'Overdue', value: '12', trend: '5%' },
      ],
      bars: [48, 52, 63, 75, 84, 88, 91],
      chartLabel: 'Bill Collection Progress',
      color: 'var(--color-warning)'
    },
    Notices: {
      stats: [
        { label: 'Published', value: '42', trend: '+5' },
        { label: 'Active', value: '7', trend: '-1' },
        { label: 'Read Rate', value: '89%', trend: '+4%' },
        { label: 'Events', value: '3', trend: '+2' },
      ],
      bars: [40, 68, 62, 71, 84, 79, 88],
      chartLabel: 'Notice Engagement Trend',
      color: 'var(--color-accent-purple)'
    },
    Complaints: {
      stats: [
        { label: 'Raised', value: '96', trend: '+15%' },
        { label: 'Resolved', value: '83', trend: '+18%' },
        { label: 'Open', value: '13', trend: '-10%' },
        { label: 'Avg SLA', value: '24h', trend: '-12%' },
      ],
      bars: [78, 74, 69, 63, 57, 52, 46],
      chartLabel: 'Open Complaints Trend',
      color: 'var(--color-error)'
    },
  }

  const activeData = previewContent[activePreviewTab]

  return (
    <PageShell>
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[var(--bg-primary)] cv-auto">
        {/* Decorative Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen [&_.perf-lite_*]:hidden">
          <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] animate-pulse-slow rounded-full bg-[var(--accent-primary)] mix-blend-multiply opacity-[0.05] blur-[120px]" />
          <div className="absolute -right-[10%] top-[20%] h-[35%] w-[35%] animate-pulse-slow rounded-full bg-[var(--accent-secondary)] mix-blend-multiply opacity-[0.05] blur-[100px] [animation-delay:2s]" />
          <div className="absolute bottom-[-10%] left-[20%] h-[40%] w-[40%] animate-pulse-slow rounded-full bg-[var(--color-success)] mix-blend-multiply opacity-[0.03] blur-[120px] [animation-delay:4s]" />
        </div>

        <div className="relative z-10 mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-7xl sm:py-24">
          
          {/* Hero Section */}
          <section className="text-center max-w-4xl mx-auto mb-20 animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--accent-primary)] shadow-[0_0_20px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)] backdrop-blur-md">
              <Play className="h-4 w-4" />
              <span>Interactive Demo</span>
            </div>
            
            <h1 className="mb-6 text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[1.1] tracking-tight text-[var(--text-primary)]">
              Experience SocietyHub{' '}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent drop-shadow-sm">
                In Action
              </span>
            </h1>
            
            <p className="mx-auto mb-10 max-w-[42rem] text-[clamp(1.1rem,2vw,1.25rem)] text-[var(--text-secondary)] leading-relaxed">
              Explore our platform with a guided walkthrough. See how easy it is to manage operations, engage residents, and oversee finances—no signup needed.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <PublicSweepButton 
                onClick={() => navigate('/login')} 
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-8 py-4 text-base font-bold text-white transition-all sm:px-10"
              >
                <MonitorSmartphone className="h-5 w-5" />
                Try Live Demo
                <ArrowRight className="h-5 w-5 opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
              </PublicSweepButton>
              
              <PublicOutlineButton
                onClick={() => navigate('/contact')}
                className="inline-flex w-full sm:w-auto items-center justify-center px-8 py-4 text-base font-bold rounded-xl sm:px-10"
              >
                Schedule A Call
              </PublicOutlineButton>
            </div>
          </section>

          {/* Interactive Preview Dashboard */}
          <section className="mb-24 animate-fade-in-up [animation-delay:200ms] cv-auto">
            <div className="group relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--border-default)_50%,transparent)] bg-[color-mix(in_srgb,var(--bg-card)_60%,transparent)] backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 hover:border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)]">
              
              {/* Browser Header */}
              <div className="flex items-center justify-between border-b border-[color-mix(in_srgb,var(--border-light)_60%,transparent)] bg-[color-mix(in_srgb,var(--bg-secondary)_40%,transparent)] px-3 sm:px-4 py-2 sm:py-3 pb-2 sm:pb-3 pt-2 sm:pt-3 backdrop-blur-md">
                <div className="flex gap-1.5 sm:gap-2">
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#ff5f56] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.1)] border border-[rgba(0,0,0,0.1)]" />
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#ffbd2e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.1)] border border-[rgba(0,0,0,0.1)]" />
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#27c93f] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.1)] border border-[rgba(0,0,0,0.1)]" />
                </div>
                <div className="flex flex-1 justify-center px-2 sm:px-4">
                  <div className="flex w-full max-w-[240px] sm:max-w-[320px] items-center justify-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--border-default)_50%,transparent)] bg-[color-mix(in_srgb,var(--bg-primary)_80%,transparent)] px-3 sm:px-4 py-1.5 text-[0.75rem] sm:text-[0.8rem] font-medium text-[var(--text-primary)] shadow-sm transition-colors hover:border-[color-mix(in_srgb,var(--border-strong)_50%,transparent)]">
                    <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]" />
                    <span className="opacity-90 truncate">mysocietyhub.app/demo</span>
                  </div>
                </div>
                <div className="w-12 hidden sm:block" /> {/* Spacer */}
              </div>

              {/* Dashboard Content */}
              <div className="grid min-h-[400px] lg:grid-cols-[220px_1fr]">
                
                {/* Sidebar Navigation */}
                <div className="flex gap-2 p-3 overflow-x-auto lg:flex-col lg:overflow-visible lg:border-r lg:border-[var(--border-light)] border-b border-[var(--border-light)] bg-[color-mix(in_srgb,var(--bg-secondary)_30%,transparent)] lg:p-4 hide-scrollbar snap-x snap-mandatory">
                  {previewTabs.map((tab) => {
                    const isActive = activePreviewTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActivePreviewTab(tab.id)}
                        className={`group relative flex shrink-0 lg:w-full items-center justify-between rounded-xl px-4 py-2.5 sm:py-3 text-sm font-medium overflow-hidden transition-all duration-400 ease-in-out snap-center ${
                          isActive
                            ? 'bg-[var(--accent-primary)] text-white shadow-md'
                            : 'text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute inset-0 -translate-x-[120%] opacity-0 transition-[transform,opacity] group-hover:translate-x-[120%] group-hover:opacity-100 ${
                            isActive 
                              ? 'bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)] duration-[5200ms] ease-linear' 
                              : 'bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent-primary)_20%,transparent),transparent)] duration-[5200ms] ease-linear'
                          }`}
                        />
                        <div className="relative z-10 flex items-center gap-3">
                          <tab.icon className={`h-4 w-4 shrink-0 transition-transform duration-400 ease-in-out ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                          <span className="whitespace-nowrap">{tab.id}</span>
                        </div>
                        {isActive && (
                          <div className="relative z-10 hidden sm:flex shrink-0 items-center justify-center pr-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Main View Area */}
                <div className="flex flex-col gap-6 p-6 lg:p-8 relative">
                  {/* Decorative faint grid in background */}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                  {/* Header/Title */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">{activePreviewTab} Overview</h3>
                      <p className="text-sm text-[var(--text-secondary)]">Real-time metrics and insights</p>
                    </div>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
                       <Zap className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
                    {activeData.stats.map((stat, i) => (
                      <div key={i} className="group flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 sm:p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--accent-primary)] hover:shadow-md">
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] truncate">{stat.label}</span>
                        <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2">
                          <span className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">{stat.value}</span>
                          <span className={`text-[10px] sm:text-xs font-bold ${stat.trend.startsWith('+') ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                            {stat.trend}
                          </span>
                        </div>
                        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                          <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${45 + ((i * 17) % 40)}%`, backgroundColor: stat.trend.startsWith('+') ? 'var(--color-success)' : 'var(--accent-primary)' }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chart Area */}
                  <div className="relative z-10 mt-2 flex flex-1 flex-col rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4 sm:p-5 shadow-sm">
                    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                      <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">{activeData.chartLabel}</span>
                      <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-1.5 px-1 sm:px-2">
                        {['1W', '1M', '3M', '1Y'].map(t => (
                          <button 
                            key={t} 
                            onClick={() => setActiveTimeframe(t)}
                            className={`flex-1 sm:flex-none rounded-md px-2 py-1.5 sm:px-2.5 text-[10px] sm:text-[11px] font-extrabold tracking-wide transition-all text-center ${
                              activeTimeframe === t 
                                ? 'bg-[var(--accent-primary)] text-white shadow-md scale-100 sm:scale-105' 
                                : 'text-[var(--text-tertiary)] hover:bg-[color-mix(in_srgb,var(--text-secondary)_5%,transparent)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex h-[140px] sm:h-[180px] w-full items-end justify-between gap-1.5 sm:gap-2 px-1 sm:px-2">
                      {activeData.bars.map((h, i) => {
                        // Vary the height based on active timeframe to make it look interactive
                        const adjustedHeight = activeTimeframe === '1W' ? h * 0.75 : activeTimeframe === '3M' ? Math.min(100, h * 1.2) : activeTimeframe === '1Y' ? Math.min(100, h * 0.9 + 10) : h;
                        
                        return (
                          <div key={i} className="group relative flex h-full w-full flex-1 items-end justify-center pb-1 sm:pb-2">
                            <div 
                              className="w-full max-w-[28px] sm:max-w-[48px] rounded-t-lg sm:rounded-t-xl transition-all duration-700 hover:opacity-100 opacity-90 relative overflow-hidden shadow-sm" 
                              style={{ height: `${adjustedHeight}%`, backgroundColor: activeData.color }}
                            >
                               <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-white/20" />
                               <div className="absolute inset-x-0 top-0 h-[2px] bg-white/30" />
                               <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-2 flex justify-between px-1 sm:px-2 text-[8px] sm:text-[10px] font-bold text-[var(--text-tertiary)] uppercase">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="mb-24 cv-auto">
            <div className="mb-14 text-center">
              <h2 className="mb-4 text-[clamp(2rem,3vw,2.5rem)] font-extrabold text-[var(--text-primary)]">Platform Capabilities</h2>
              <p className="mx-auto max-w-2xl text-[1.1rem] text-[var(--text-secondary)]">A complete suite of tools designed to automate administration and improve resident living.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {demoFeatures.map((f, i) => (
                <div 
                  key={i} 
                  className="group relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--border-default)_60%,transparent)] bg-[color-mix(in_srgb,var(--bg-card)_40%,transparent)] backdrop-blur-md p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-primary)]"
                >
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--accent-primary)] opacity-5 blur-2xl transition-opacity group-hover:opacity-20" />
                  
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] relative z-10">
                    <f.icon className="h-7 w-7" />
                  </div>
                  
                  <h3 className="mb-3 text-xl font-bold text-[var(--text-primary)] relative z-10">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)] relative z-10">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Setup Steps */}
          <section className="mb-24 cv-auto relative rounded-3xl border border-[var(--border-light)] bg-[color-mix(in_srgb,var(--bg-tertiary)_30%,transparent)] p-8 sm:p-12 overflow-hidden">
            <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-radial from-[var(--accent-primary)] to-transparent opacity-[0.03] blur-3xl disabled-on-perf-lite" />
            
            <div className="relative z-10 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border-default)] pb-8">
              <div className="max-w-xl">
                <h2 className="mb-4 text-[clamp(2rem,3vw,2.5rem)] font-extrabold text-[var(--text-primary)]">Onboarding is a Breeze</h2>
                <p className="text-lg text-[var(--text-secondary)]">From administrator approval to fully live managed operations in under 10 minutes. No technical expertise required.</p>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-4">
              {steps.map((s, i) => (
                <div key={i} className="group relative">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-primary)] border-2 border-[var(--border-strong)] text-lg font-black text-[var(--text-primary)] shadow-sm transition-colors group-hover:border-[var(--accent-primary)] group-hover:text-[var(--accent-primary)]">
                      {s.step}
                    </span>
                    {i < steps.length - 1 && (
                      <div className="hidden md:block flex-1 border-t-2 border-dashed border-[var(--border-default)] mx-4 transition-colors group-hover:border-[var(--accent-primary)]" />
                    )}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA Strip */}
          <section className="cv-auto relative overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-primary)] to-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] p-6 sm:p-10 lg:p-14 text-center shadow-2xl disabled-on-perf-lite">
            <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
            
            <div className="relative z-10">
              <div className="mx-auto mb-4 sm:mb-6 flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)] ring-4 sm:ring-8 ring-[color-mix(in_srgb,var(--color-success)_5%,transparent)]">
                <CheckCircle className="h-7 w-7 sm:h-10 sm:w-10" />
              </div>
              <h2 className="mb-3 sm:mb-4 text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-extrabold text-[var(--text-primary)]">Ready to transform your society?</h2>
              <p className="mx-auto mb-8 sm:mb-10 max-w-2xl text-[0.95rem] sm:text-base md:text-lg leading-relaxed text-[var(--text-secondary)]">
                Hundreds of societies are already managing operations, billing, and resident communication seamlessly. Contact your administrator to get started.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <PublicSweepButton
                  onClick={() => navigate('/login')}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3.5 sm:px-10 sm:py-4 text-[0.95rem] sm:text-base font-bold text-white transition-transform hover:-translate-y-1"
                >
                  Login Here
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </PublicSweepButton>
                <PublicOutlineButton
                  onClick={() => navigate('/contact')}
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl px-6 py-3.5 sm:px-10 sm:py-4 text-[0.95rem] sm:text-base font-bold"
                >
                  Contact Support
                </PublicOutlineButton>
              </div>
            </div>
          </section>

        </div>
      </div>
    </PageShell>
  )
}
