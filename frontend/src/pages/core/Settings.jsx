import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context'
import { useSettings } from '../../context'
import { userApi, authApi, notificationPreferenceApi } from '../../../../api'
import {
  User, Bell, Shield, Palette, Save, Check, Eye, EyeOff,
  AlertCircle, CheckCircle2, XCircle, LogOut, Monitor, Moon, Sun,
  Lock, Mail, Phone, BadgeCheck
} from 'lucide-react'
import clsx from 'clsx'
import Toggle from '../../components/Toggle'
import { PhoneInput } from '../../components'
import { SettingsSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import { getDeviceInfo } from '../../utils'

/* OS icons */
import windowsIcon from '../../assets/icons/os/windows.svg'
import macosIcon from '../../assets/icons/os/macos.svg'
import linuxIcon from '../../assets/icons/os/linux.svg'
import chromeosIcon from '../../assets/icons/os/chromeos.svg'
import androidIcon from '../../assets/icons/os/android.svg'
import unknownOsIcon from '../../assets/icons/os/unknown.svg'

/* Browser icons */
import chromeIcon from '../../assets/icons/browsers/chrome.svg'
import firefoxIcon from '../../assets/icons/browsers/firefox.svg'
import safariIcon from '../../assets/icons/browsers/safari.svg'
import edgeIcon from '../../assets/icons/browsers/edge.svg'
import operaIcon from '../../assets/icons/browsers/opera.svg'
import braveIcon from '../../assets/icons/browsers/brave.svg'
import vivaldiIcon from '../../assets/icons/browsers/vivaldi.svg'
import unknownBrowserIcon from '../../assets/icons/browsers/unknown.svg'

const OS_ICONS = { windows: windowsIcon, macos: macosIcon, linux: linuxIcon, chromeos: chromeosIcon, android: androidIcon, unknown: unknownOsIcon }
const BROWSER_ICONS = { chrome: chromeIcon, firefox: firefoxIcon, safari: safariIcon, edge: edgeIcon, opera: operaIcon, brave: braveIcon, vivaldi: vivaldiIcon, unknown: unknownBrowserIcon }

const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/

const passwordRules = [
  { id: 'length', label: 'At least 6 characters', test: (v) => v.length >= 6 },
  { id: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'One number', test: (v) => /\d/.test(v) },
]

const PasswordStrength = ({ password }) => {
  const passed = passwordRules.filter(r => r.test(password)).length
  const pct = (passed / passwordRules.length) * 100
  const tone = pct <= 25 ? 'weak' : pct <= 50 ? 'fair' : pct <= 75 ? 'good' : 'strong'
  const label = pct <= 25 ? 'Weak' : pct <= 50 ? 'Fair' : pct <= 75 ? 'Good' : 'Strong'

  if (!password) return null

  const fillClass = {
    weak: 'bg-red-500',
    fair: 'bg-amber-500',
    good: 'bg-blue-500',
    strong: 'bg-emerald-500',
  }[tone]

  const labelClass = {
    weak: 'text-red-500',
    fair: 'text-amber-500',
    good: 'text-blue-500',
    strong: 'text-emerald-500',
  }[tone]

  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded bg-[var(--border-light)]">
        <div
          className={clsx('h-full rounded transition-all duration-300', fillClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={clsx('min-w-12 text-[11px] font-semibold', labelClass)}>
        {label}
      </span>
    </div>
  )
}

const PasswordChecklist = ({ password }) => {
  if (!password) return null
  return (
    <div className="mt-1 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
      {passwordRules.map(rule => {
        const ok = rule.test(password)
        return (
          <div key={rule.id} className={clsx('flex items-center gap-1 text-[11px] transition-colors', ok ? 'text-emerald-500' : 'text-[var(--text-tertiary)]')}>
            {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            <span>{rule.label}</span>
          </div>
        )
      })}
    </div>
  )
}

const Alert = ({ type = 'error', children }) => {
  if (!children) return null
  const Icon = type === 'error' ? AlertCircle : CheckCircle2
  return (
    <div className={clsx('inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium', type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300')}>
      <Icon size={16} className="shrink-0" />
      <span>{children}</span>
    </div>
  )
}

/* ── main component ─────────────────────────────────────── */
export default function Settings() {
  const { user, logout, updateUser } = useAuth()

  const {
    theme, compactSidebar,
    setThemePreview,
    clearPreviews, updateTheme, updateCompactSidebar
  } = useSettings()

  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  /* ── Profile ── */
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  })
  const [profileErrors, setProfileErrors] = useState({})

  /* ── Password ── */
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  /* ── Notifications ── */
  const [localNotifications, setLocalNotifications] = useState({
    emailTickets: true,
    emailComplaints: true,
    emailPayments: true,
    emailContracts: true,
    emailTenants: true,
    emailNotices: true,
  })
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  /* ── Load notification prefs ── */
  useEffect(() => {
    if (user?.id) {
      notificationPreferenceApi.getByUserId(user.id)
        .then(res => {
          setLocalNotifications({
            emailTickets: res.data.emailTickets,
            emailComplaints: res.data.emailComplaints,
            emailPayments: res.data.emailPayments,
            emailContracts: res.data.emailContracts,
            emailTenants: res.data.emailTenants,
            emailNotices: res.data.emailNotices,
          })
        })
        .catch(() => {})
    }
  }, [user?.id])

  /* ── Clear previews on leave ── */
  useEffect(() => {
    return () => clearPreviews()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab !== 'appearance') clearPreviews()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || '', phone: user.phone || '' })
    }
  }, [user])

  // Clear feedback when switching tabs
  useEffect(() => {
    setError('')
    setSaved(false)
    setPasswordError('')
    setPasswordSaved(false)
    setProfileErrors({})
  }, [activeTab])

  /* ── Tabs ── */
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ]

  /* ── Profile validation ── */
  const validateProfile = () => {
    const errs = {}
    const name = profileData.name?.trim()
    if (!name) {
      errs.name = 'Name is required'
    } else if (name.length < 2) {
      errs.name = 'Name must be at least 2 characters'
    } else if (name.length > 100) {
      errs.name = 'Name must be under 100 characters'
    }

    const phone = profileData.phone?.trim()
    if (phone && !PHONE_REGEX.test(phone)) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number'
    }

    setProfileErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleProfileSave = async () => {
    if (!validateProfile()) return
    setSaving(true)
    setError('')
    try {
      await userApi.update(user.id, {
        name: profileData.name.trim(),
        email: user.email,
        phone: profileData.phone?.trim() || '',
        role: user.role,
      })
      const updatedUser = { ...user, name: profileData.name.trim(), phone: profileData.phone?.trim() || '' }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      if (updateUser) updateUser(updatedUser)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  /* ── Password validation + change ── */
  const passwordValid = useMemo(() => {
    const { currentPassword, newPassword, confirmPassword } = passwordData
    if (!currentPassword || !newPassword || !confirmPassword) return false
    if (newPassword !== confirmPassword) return false
    if (!passwordRules.every(r => r.test(newPassword))) return false
    return true
  }, [passwordData])

  const handlePasswordChange = async () => {
    setPasswordError('')

    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required')
      return
    }
    if (!passwordData.newPassword) {
      setPasswordError('New password is required')
      return
    }
    if (!passwordRules.every(r => r.test(passwordData.newPassword))) {
      setPasswordError('New password does not meet all requirements')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password')
      return
    }

    setSaving(true)
    try {
      await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswords({ current: false, new: false, confirm: false })
      setPasswordSaved(true)
      setTimeout(() => setPasswordSaved(false), 3000)
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  /* ── Notifications ── */
  const handleNotificationsSave = async () => {
    setNotificationsLoading(true)
    setError('')
    try {
      await notificationPreferenceApi.update(user.id, {
        emailTickets: localNotifications.emailTickets,
        emailComplaints: localNotifications.emailComplaints,
        emailPayments: localNotifications.emailPayments,
        emailContracts: localNotifications.emailContracts,
        emailTenants: localNotifications.emailTenants,
        emailNotices: localNotifications.emailNotices,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save notification preferences')
    } finally {
      setNotificationsLoading(false)
    }
  }

  /* ── Appearance ── */
  const handleAppearanceSave = () => {
    updateTheme(theme)
    updateCompactSidebar(compactSidebar)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  /* ── Logout all ── */
  const handleLogoutAll = () => {
    logout()
  }

  if (!user) {
    return (
      <>
        <WakeUpBanner show />
        <SettingsSkeleton />
      </>
    )
  }

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[var(--bg-secondary)] p-5 md:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage your account preferences</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
        {/* Tabs */}
        <div className="border-b border-[var(--border-light)]">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx('inline-flex items-center gap-2 whitespace-nowrap border-0 border-b-2 border-transparent bg-transparent px-5 py-3 text-sm font-semibold transition', activeTab === tab.id ? 'border-b-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--accent-primary)_6%,transparent)] text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]')}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-5 md:p-6">

          {/* ─── PROFILE TAB ─── */}
          {activeTab === 'profile' && (
            <div className="animate-fadeIn flex max-w-full flex-col gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-tertiary)),var(--bg-tertiary))] p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent-primary),color-mix(in_srgb,var(--accent-primary)_75%,#7c3aed))] text-2xl font-bold text-white shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-primary)_30%,transparent)]">
                  {profileData.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h3 className="m-0 text-[1.55rem] font-extrabold leading-tight text-[var(--text-primary)] md:text-[1.9rem]">{profileData.name || user?.name}</h3>
                  <p className="m-0 flex items-center gap-1 text-sm font-semibold text-[var(--text-secondary)] md:text-base">
                    <Mail size={13} />
                    {user?.email}
                  </p>
                  <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.03em] text-[var(--accent-primary)]">
                    <BadgeCheck size={12} />
                    {user?.role?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {error && <Alert type="error">{error}</Alert>}
              {saved && !error && <Alert type="success">Profile updated successfully!</Alert>}

              <div className="grid grid-cols-1 gap-3 border-t border-[var(--border-light)] pt-3 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)] md:text-base">
                    <User size={14} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => {
                      setProfileData({ ...profileData, name: e.target.value })
                      if (profileErrors.name) setProfileErrors({ ...profileErrors, name: null })
                    }}
                    className={clsx('min-h-10 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] md:text-[0.98rem]', profileErrors.name && '!border-red-500 !ring-2 !ring-red-500/15')}
                    placeholder="Enter your full name"
                    maxLength={100}
                  />
                  {profileErrors.name && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle size={12} />
                      {profileErrors.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)]">{profileData.name?.length || 0}/100 characters</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)] md:text-base">
                    <Mail size={14} />
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="min-h-10 w-full cursor-not-allowed rounded-lg border border-[color-mix(in_srgb,var(--border-light)_85%,var(--text-secondary))] bg-[var(--bg-tertiary)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] md:text-[0.98rem]"
                  />
                  <span className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)]">
                    <Lock size={11} />
                    Email cannot be changed
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)] md:text-base">
                    <Phone size={14} />
                    Phone Number
                  </label>
                  <PhoneInput
                    name="phone"
                    value={profileData.phone}
                    onChange={(e) => {
                      setProfileData({ ...profileData, phone: e.target.value })
                      if (profileErrors.phone) setProfileErrors({ ...profileErrors, phone: null })
                    }}
                  />
                  {profileErrors.phone && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle size={12} />
                      {profileErrors.phone}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)] md:text-base">
                    <BadgeCheck size={14} />
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role?.replace(/_/g, ' ') || ''}
                    disabled
                    className="min-h-10 w-full cursor-not-allowed rounded-lg border border-[color-mix(in_srgb,var(--border-light)_85%,var(--text-secondary))] bg-[var(--bg-tertiary)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] md:text-[0.98rem]"
                  />
                  <span className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)]">
                    <Lock size={11} />
                    Role is managed by administrators
                  </span>
                </div>
              </div>

              <button onClick={handleProfileSave} disabled={saving} className="inline-flex w-fit items-center gap-2 rounded-lg border-0 bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-primary)_30%,transparent)] disabled:cursor-not-allowed disabled:opacity-50">
                {saved ? <Check size={16} /> : <Save size={16} />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ─── NOTIFICATIONS TAB ─── */}
          {activeTab === 'notifications' && (
            <div className="animate-fadeIn flex max-w-full flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Notification Preferences</h3>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">Choose which email notifications you want to receive</p>
              </div>

              {error && <Alert type="error">{error}</Alert>}
              {saved && !error && <Alert type="success">Preferences saved successfully!</Alert>}

              <div className="flex flex-col gap-1">
                {[
                  { id: 'emailTickets', label: 'New Tickets', desc: 'Notified when tickets are created or updated', icon: '🎫' },
                  { id: 'emailComplaints', label: 'Complaints', desc: 'Notified about new complaints', icon: '⚠️' },
                  { id: 'emailPayments', label: 'Payments', desc: 'Notified about payment activities', icon: '💳' },
                  { id: 'emailContracts', label: 'Contract Expiry', desc: 'Reminded about expiring contracts', icon: '📝' },
                  { id: 'emailTenants', label: 'Tenant Agreements', desc: 'Reminded about expiring agreements', icon: '🏠' },
                  { id: 'emailNotices', label: 'Notices', desc: 'Notified when notices are published', icon: '📢' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-[var(--border-light)] bg-[var(--bg-tertiary)] px-3 py-2 transition hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_90%,var(--accent-primary))]">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[var(--border-light)] bg-[var(--bg-card)] text-lg leading-none">{item.icon}</span>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-primary)] md:text-[0.98rem]">{item.label}</h4>
                        <p className="text-xs font-medium text-[var(--text-tertiary)] md:text-[0.88rem]">{item.desc}</p>
                      </div>
                    </div>
                    <Toggle
                      checked={localNotifications[item.id]}
                      onChange={(e) => setLocalNotifications({
                        ...localNotifications,
                        [item.id]: e.target.checked
                      })}
                    />
                  </div>
                ))}
              </div>

              <button onClick={handleNotificationsSave} disabled={notificationsLoading} className="inline-flex w-fit items-center gap-2 rounded-lg border-0 bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-primary)_30%,transparent)] disabled:cursor-not-allowed disabled:opacity-50">
                {saved ? <Check size={16} /> : <Save size={16} />}
                {notificationsLoading ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
              </button>
            </div>
          )}

          {/* ─── SECURITY TAB ─── */}
          {activeTab === 'security' && (
            <div className="animate-fadeIn flex max-w-full flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Change Password</h3>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">Enter your current password and choose a new one</p>
              </div>

              {passwordError && <Alert type="error">{passwordError}</Alert>}
              {passwordSaved && <Alert type="success">Password changed successfully!</Alert>}

              <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange() }} className="flex w-full max-w-[480px] flex-col gap-4">
                {/* Hidden username for password managers */}
                <input type="text" name="username" autoComplete="username" value={user?.email || ''} readOnly className="absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]" aria-hidden="true" />

                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)] md:text-base">
                    <Lock size={14} />
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      autoComplete="current-password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="min-h-10 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 pr-10 text-sm font-semibold text-[var(--text-primary)] transition focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] md:text-[0.98rem]"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded p-1 text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
                      onClick={() => setShowPasswords(s => ({ ...s, current: !s.current }))}
                      tabIndex={-1}
                    >
                      {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)] md:text-base">
                    <Lock size={14} />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      autoComplete="new-password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="min-h-10 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 pr-10 text-sm font-semibold text-[var(--text-primary)] transition focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] md:text-[0.98rem]"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded p-1 text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
                      onClick={() => setShowPasswords(s => ({ ...s, new: !s.new }))}
                      tabIndex={-1}
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrength password={passwordData.newPassword} />
                  <PasswordChecklist password={passwordData.newPassword} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)] md:text-base">
                    <Lock size={14} />
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={clsx(
                        'min-h-10 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 pr-10 text-sm font-semibold text-[var(--text-primary)] transition focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] md:text-[0.98rem]',
                        passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && '!border-red-500 !ring-2 !ring-red-500/15'
                      )}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded p-1 text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
                      onClick={() => setShowPasswords(s => ({ ...s, confirm: !s.confirm }))}
                      tabIndex={-1}
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle size={12} />
                      Passwords do not match
                    </span>
                  )}
                  {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword.length > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                      <CheckCircle2 size={12} />
                      Passwords match
                    </span>
                  )}
                </div>

                <button type="submit" disabled={saving || !passwordValid} className="inline-flex w-fit items-center gap-2 rounded-lg border-0 bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-primary)_30%,transparent)] disabled:cursor-not-allowed disabled:opacity-50">
                  {passwordSaved ? <Check size={16} /> : <Shield size={16} />}
                  {saving ? 'Updating...' : passwordSaved ? 'Updated!' : 'Update Password'}
                </button>
              </form>

              {/* Active Sessions */}
              <div className="flex flex-col gap-3 border-t border-[var(--border-light)] pt-5">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Active Sessions</h3>
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">Manage your active login sessions</p>
                </div>
                {(() => {
                  const { os, browser } = getDeviceInfo()
                  const osIcon = OS_ICONS[os.icon] || OS_ICONS.unknown
                  const browserIcon = BROWSER_ICONS[browser.icon] || BROWSER_ICONS.unknown
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-light)] bg-[color-mix(in_srgb,var(--bg-tertiary)_86%,var(--bg-card))] px-4 py-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent-primary)_16%,transparent)] text-[var(--accent-primary)]">
                          <Monitor size={18} />
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                          <p className="text-base font-bold text-[var(--text-primary)]">Current Session</p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--text-primary)]">
                              <img src={osIcon} alt={os.name} className="h-4 w-4 shrink-0 object-contain" />
                              {os.name}{os.version ? ` ${os.version}` : ''}
                            </span>
                            <span className="select-none text-xs text-[var(--text-secondary)]">&bull;</span>
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--text-primary)]">
                              <img src={browserIcon} alt={browser.name} className="h-4 w-4 shrink-0 object-contain" />
                              {browser.name}
                            </span>
                            <span className="select-none text-xs text-[var(--text-secondary)]">&bull;</span>
                            <span className="inline-flex items-center text-sm font-bold text-emerald-600">Active now</span>
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-600">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                        Active
                      </span>
                    </div>
                  )
                })()}
              </div>

              {/* Danger Zone */}
                <div className="flex flex-col gap-3 border-t border-[var(--border-light)] pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-400/60 bg-red-500/10 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle size={18} className="shrink-0 text-red-500" />
                    <div>
                        <h3 className="text-base font-bold text-red-600">Danger Zone</h3>
                        <p className="text-sm font-semibold text-[var(--text-secondary)]">This will log you out from all devices and end all sessions</p>
                    </div>
                  </div>
                    <button onClick={handleLogoutAll} className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-red-400/70 bg-transparent px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-500/10">
                    <LogOut size={16} />
                    Logout from all devices
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── APPEARANCE TAB ─── */}
          {activeTab === 'appearance' && (
            <div className="animate-fadeIn flex max-w-full flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Theme</h3>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">Choose how the interface looks</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { id: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright' },
                  { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
                  { id: 'system', label: 'System', icon: Monitor, desc: 'Follow OS setting' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThemePreview(t.id)}
                    className={clsx('relative flex flex-col items-center gap-2 rounded-xl border-2 bg-[var(--bg-card)] p-4 text-center transition', theme === t.id ? 'border-[var(--accent-primary)] shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)]' : 'border-[var(--border-light)] hover:border-[color-mix(in_srgb,var(--accent-primary)_40%,var(--border-light))]')}
                  >
                    <div className={clsx('flex h-[4.5rem] w-full items-center justify-center rounded-lg', t.id === 'light' && 'border border-slate-200 bg-white text-slate-600', t.id === 'dark' && 'border border-slate-800 bg-slate-900 text-slate-400', t.id === 'system' && 'border border-slate-300 bg-[linear-gradient(135deg,#ffffff_50%,#111827_50%)] text-slate-500')}>
                      <t.icon size={24} className="opacity-80" />
                    </div>
                    <span className="text-base font-bold text-[var(--text-primary)]">{t.label}</span>
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">{t.desc}</span>
                    {theme === t.id && (
                      <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white">
                        <Check size={14} />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button onClick={handleAppearanceSave} className="inline-flex w-fit items-center gap-2 rounded-lg border-0 bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-primary)_30%,transparent)] disabled:cursor-not-allowed disabled:opacity-50">
                {saved ? <Check size={16} /> : <Save size={16} />}
                {saved ? 'Saved!' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
