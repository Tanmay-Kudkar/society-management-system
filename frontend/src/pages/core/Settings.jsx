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
import { PhoneInput, NeonSweepButton, InfoTooltip } from '../../components'
import { SettingsSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import { getDeviceInfo, getHighEntropyOSInfo } from '../../utils'

/* OS icons */
import windowsIcon from '../../assets/icons/os/windows.svg'
import macosIcon from '../../assets/icons/os/macos.svg'
import linuxIcon from '../../assets/icons/os/linux.svg'
import chromeosIcon from '../../assets/icons/os/chromeos.svg'
import androidIcon from '../../assets/icons/os/android.svg'
import iosIcon from '../../assets/icons/os/ios.svg'
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

const OS_ICONS = { windows: windowsIcon, macos: macosIcon, linux: linuxIcon, chromeos: chromeosIcon, android: androidIcon, ios: iosIcon, unknown: unknownOsIcon }
const BROWSER_ICONS = { chrome: chromeIcon, firefox: firefoxIcon, safari: safariIcon, edge: edgeIcon, opera: operaIcon, brave: braveIcon, vivaldi: vivaldiIcon, unknown: unknownBrowserIcon }

const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    <div className={clsx(
      'animate-fade-in-up inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all duration-300 ease-out',
      type === 'error'
        ? 'border-red-500/60 bg-red-500/15 text-red-700 dark:text-red-200'
        : 'border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
    )}>
      <Icon size={16} className="shrink-0" />
      <span>{children}</span>
    </div>
  )
}

/* ── main component ─────────────────────────────────────── */
export default function Settings() {
  const { user, logout, updateUser } = useAuth()

  const previousLoginLabel = useMemo(() => {
    const previousLoginAt = user?.previousLoginAt
    if (!previousLoginAt) return 'No previous login recorded yet'

    const parsed = new Date(previousLoginAt)
    if (Number.isNaN(parsed.getTime())) return 'Previous login timestamp unavailable'

    const weekday = parsed.toLocaleDateString('en-US', { weekday: 'long' })
    const datePart = parsed.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    const timePart = parsed.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })

    return `${weekday}, ${datePart} • ${timePart}`
  }, [user?.previousLoginAt])

  const previousLoginDevice = useMemo(() => {
    if (!user?.previousLoginUserAgent) return null
    return getDeviceInfo(user.previousLoginUserAgent)
  }, [user?.previousLoginUserAgent])

  const [currentLoginDevice, setCurrentLoginDevice] = useState(() => getDeviceInfo())

  useEffect(() => {
    let cancelled = false

    const hydrateOsVersion = async () => {
      const accurateOs = await getHighEntropyOSInfo()
      if (!accurateOs || cancelled) {
        return
      }

      setCurrentLoginDevice((prev) => ({
        ...prev,
        os: {
          ...prev.os,
          ...accurateOs,
        },
      }))
    }

    hydrateOsVersion()

    return () => {
      cancelled = true
    }
  }, [])

  const hasPreviousSession = Boolean(user?.previousLoginAt || user?.previousLoginUserAgent)

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
    email: user?.email || '',
    phone: user?.phone || '',
    specialKey: '',
  })
  const [profileErrors, setProfileErrors] = useState({})

  /* ── Password ── */
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    specialKey: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
    specialKey: false,
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
      setProfileData({ name: user.name || '', email: user.email || '', phone: user.phone || '', specialKey: '' })
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

    const email = profileData.email?.trim()
    if (!email) {
      errs.email = 'Email is required'
    } else if (!EMAIL_REGEX.test(email)) {
      errs.email = 'Enter a valid email address'
    }

    const isMasterAdminEmailChange =
      user?.role === 'MASTER_ADMIN' &&
      email &&
      email.toLowerCase() !== (user?.email || '').trim().toLowerCase()

    if (isMasterAdminEmailChange && !profileData.specialKey?.trim()) {
      errs.specialKey = 'Special key is required to change Master Admin email'
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
      const nextEmail = profileData.email.trim()
      const emailChanged = nextEmail.toLowerCase() !== (user?.email || '').trim().toLowerCase()

      await userApi.update(user.id, {
        name: profileData.name.trim(),
        email: nextEmail,
        phone: profileData.phone?.trim() || '',
        role: user.role,
        specialKey: profileData.specialKey?.trim() || '',
      })
      const updatedUser = {
        ...user,
        name: profileData.name.trim(),
        email: nextEmail,
        phone: profileData.phone?.trim() || '',
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      if (updateUser) updateUser(updatedUser)

      if (emailChanged) {
        setSaved(true)
        setTimeout(() => {
          logout()
        }, 900)
        return
      }

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
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (user?.role === 'MASTER_ADMIN' && !passwordData.specialKey?.trim()) {
      setPasswordError('Special key is required for Master Admin password update')
      return
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password')
      return
    }

    setSaving(true)
    try {
      await authApi.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        user?.role === 'MASTER_ADMIN' ? (passwordData.specialKey?.trim() || '') : ''
      )
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '', specialKey: '' })
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
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
          <InfoTooltip text="Manage your account preferences" />
        </div>
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
              <div className="relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--border-light)_72%,#3b82f6_28%)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-primary)_9%,var(--bg-tertiary))_0%,var(--bg-tertiary)_56%,color-mix(in_srgb,var(--accent-primary)_7%,var(--bg-card))_100%)] p-4 shadow-[0_16px_30px_rgba(15,23,42,0.10)] sm:p-5">
                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_18%,transparent)] blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 left-20 h-28 w-28 rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)] blur-2xl" />

                <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_35%,transparent)] blur-md" />
                      <div className="relative flex h-[4.1rem] w-[4.1rem] items-center justify-center rounded-full border border-[color-mix(in_srgb,#ffffff_35%,transparent)] bg-[linear-gradient(140deg,var(--accent-primary),color-mix(in_srgb,var(--accent-primary)_72%,#0ea5e9))] text-[1.7rem] font-extrabold text-white shadow-[0_10px_20px_color-mix(in_srgb,var(--accent-primary)_28%,transparent)] sm:h-[4.5rem] sm:w-[4.5rem]">
                        {profileData.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="mb-0.5 text-[0.72rem] font-bold uppercase tracking-[0.07em] text-[var(--text-secondary)]">Account Overview</p>
                      <h3 className="m-0 truncate text-[1.45rem] font-extrabold leading-tight tracking-[-0.02em] text-[var(--text-primary)] sm:text-[1.85rem]">
                        {profileData.name || user?.name}
                      </h3>
                      <p className="m-0 mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] sm:text-[0.98rem]">
                        <Mail size={13} />
                        <span className="truncate">{user?.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:min-w-[15rem]">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_36%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--accent-primary)]">
                      <BadgeCheck size={12} />
                      {user?.role?.replace(/_/g, ' ')}
                    </span>
                    <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-emerald-700 dark:text-emerald-300">
                      <Shield size={12} />
                      Verified Session
                    </div>
                  </div>
                </div>
              </div>

              {error && <Alert type="error">{error}</Alert>}
              {saved && !error && <Alert type="success">Profile updated successfully!</Alert>}

              <div className="grid grid-cols-1 gap-2.5 border-t border-[var(--border-light)] pt-4 sm:gap-4 md:grid-cols-2">
                <div className="flex h-full flex-col gap-2 rounded-xl border border-[var(--border-light)] bg-[color-mix(in_srgb,var(--bg-tertiary)_45%,transparent)] p-2.5 sm:p-4">
                  <label className="flex items-center gap-1.5 text-[0.84rem] font-bold text-[var(--text-primary)] sm:text-sm md:text-base">
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
                    className={clsx('min-h-11 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] md:text-[0.98rem]', profileErrors.name && '!border-red-500 !ring-2 !ring-red-500/15')}
                    placeholder="Enter your full name"
                    maxLength={100}
                  />
                  {profileErrors.name && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle size={12} />
                      {profileErrors.name}
                    </span>
                  )}
                  <span className="mt-auto flex items-center gap-1 text-[11px] font-semibold text-[var(--text-secondary)]">{profileData.name?.length || 0}/100 characters</span>
                </div>
                <div className="flex h-full flex-col gap-2 rounded-xl border border-[var(--border-light)] bg-[color-mix(in_srgb,var(--bg-tertiary)_45%,transparent)] p-2.5 sm:p-4">
                  <label className="flex items-center gap-1.5 text-[0.84rem] font-bold text-[var(--text-primary)] sm:text-sm md:text-base">
                    <Mail size={14} />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => {
                      setProfileData({ ...profileData, email: e.target.value })
                      if (profileErrors.email) setProfileErrors({ ...profileErrors, email: null })
                    }}
                    className={clsx(
                      'min-h-11 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] md:text-[0.98rem]',
                      profileErrors.email && '!border-red-500 !ring-2 !ring-red-500/15'
                    )}
                  />
                  {profileErrors.email ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle size={12} />
                      {profileErrors.email}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-[var(--text-secondary)]">
                      <Lock size={11} className="shrink-0" />
                      <span className="sm:hidden">Email change signs you out</span>
                      <span className="hidden sm:inline">Changing email will sign you out for security</span>
                    </span>
                  )}
                </div>
                {user?.role === 'MASTER_ADMIN' &&
                  profileData.email?.trim() &&
                  profileData.email.trim().toLowerCase() !== (user?.email || '').trim().toLowerCase() && (
                    <div className="animate-fade-in-up flex h-full flex-col gap-2 rounded-xl border border-red-600/90 bg-red-500/22 p-3 transition-all duration-300 ease-out sm:p-4 md:col-span-2">
                      <label className="flex items-center gap-1.5 text-sm font-extrabold text-red-900 dark:text-red-100 md:text-base">
                        <Shield size={14} />
                        Special Key (Master Admin)
                      </label>
                      <input
                        type="password"
                        value={profileData.specialKey}
                        onChange={(e) => {
                          setProfileData({ ...profileData, specialKey: e.target.value })
                          if (profileErrors.specialKey) setProfileErrors({ ...profileErrors, specialKey: null })
                        }}
                        className={clsx(
                          'min-h-10 w-full rounded-lg border border-red-600/75 bg-[var(--bg-card)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] transition focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/25 md:text-[0.98rem]',
                          profileErrors.specialKey && '!border-red-500 !ring-2 !ring-red-500/15'
                        )}
                        placeholder="Enter special key to confirm email change"
                      />
                      {profileErrors.specialKey ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                          <AlertCircle size={12} />
                          {profileErrors.specialKey}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-extrabold text-red-900 dark:text-red-100">
                          <Shield size={11} />
                          Required only for Master Admin email changes
                        </span>
                      )}
                    </div>
                  )}
                <div className="flex h-full flex-col gap-2 rounded-xl border border-[var(--border-light)] bg-[color-mix(in_srgb,var(--bg-tertiary)_45%,transparent)] p-2.5 sm:p-4">
                  <label className="flex items-center gap-1.5 text-[0.84rem] font-bold text-[var(--text-primary)] sm:text-sm md:text-base">
                    <Phone size={14} />
                    Phone Number
                  </label>
                  <PhoneInput
                    name="phone"
                    className="w-full"
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
              </div>

              <NeonSweepButton onClick={handleProfileSave} disabled={saving} tone="cyan" size="md" className="mt-1 w-full justify-center self-stretch sm:w-auto sm:self-start">
                {saved ? <Check size={16} /> : <Save size={16} />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </NeonSweepButton>
            </div>
          )}

          {/* ─── NOTIFICATIONS TAB ─── */}
          {activeTab === 'notifications' && (
            <div className="animate-fadeIn flex max-w-full flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
                  Notification Preferences
                  <InfoTooltip text="Choose which email notifications you want to receive" />
                </h3>
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

              <NeonSweepButton onClick={handleNotificationsSave} disabled={notificationsLoading} tone="cyan" size="md" className="self-start">
                {saved ? <Check size={16} /> : <Save size={16} />}
                {notificationsLoading ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
              </NeonSweepButton>
            </div>
          )}

          {/* ─── SECURITY TAB ─── */}
          {activeTab === 'security' && (
            <div className="animate-fadeIn flex max-w-full flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
                  Change Password
                  <InfoTooltip text="Enter your current password and choose a new one" />
                </h3>
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

                {user?.role === 'MASTER_ADMIN' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)] md:text-base">
                      <Shield size={14} />
                      Special Key
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.specialKey ? 'text' : 'password'}
                        value={passwordData.specialKey}
                        onChange={(e) => setPasswordData({ ...passwordData, specialKey: e.target.value })}
                        className="min-h-10 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 pr-10 text-sm font-semibold text-[var(--text-primary)] transition focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] md:text-[0.98rem]"
                        placeholder="Enter special key"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded p-1 text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
                        onClick={() => setShowPasswords(s => ({ ...s, specialKey: !s.specialKey }))}
                        tabIndex={-1}
                      >
                        {showPasswords.specialKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      Required for Master Admin password update
                    </span>
                  </div>
                )}

                <NeonSweepButton type="submit" disabled={saving || !passwordValid} tone="cyan" size="md" className="self-start">
                  {passwordSaved ? <Check size={16} /> : <Shield size={16} />}
                  {saving ? 'Updating...' : passwordSaved ? 'Updated!' : 'Update Password'}
                </NeonSweepButton>
              </form>

              {/* Session Control */}
              <div className="border-t border-[var(--border-light)] pt-6">
                <div className="mb-4 flex flex-col gap-1">
                  <h3 className="flex items-center gap-2 text-[1.04rem] font-extrabold tracking-[-0.01em] text-[var(--text-primary)] sm:text-[1.1rem]">
                    Session Control Center
                    <InfoTooltip text="Review this device session and manage account-wide access." />
                  </h3>
                </div>

                {(() => {
                  const os = currentLoginDevice.os
                  const browser = currentLoginDevice.browser
                  const osIcon = OS_ICONS[os.icon] || OS_ICONS.unknown
                  const browserIcon = BROWSER_ICONS[browser.icon] || BROWSER_ICONS.unknown

                  return (
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[1.25fr_1fr]">
                      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--border-light)_70%,#334155_30%)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-card)),var(--bg-card))] p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.06)] sm:p-5">
                        <div className="mb-3 flex items-start">
                          <div className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)] px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.05em] text-[var(--accent-primary)]">
                            <Monitor size={13} />
                            Current Session
                          </div>
                        </div>

                        <div className="rounded-xl border border-[var(--border-light)] bg-[color-mix(in_srgb,var(--bg-tertiary)_45%,transparent)] p-3.5 sm:p-4">
                          <p className="mb-2 text-sm font-extrabold tracking-[0.01em] text-[var(--text-secondary)]">Logged in from</p>
                          <div className="flex flex-col items-start gap-2.5 text-[0.92rem] font-bold text-[var(--text-primary)] sm:flex-row sm:flex-wrap sm:items-center">
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-light)] bg-[var(--bg-card)] px-2.5 py-1.5">
                              <img
                                src={osIcon}
                                alt={os.name}
                                className={clsx('h-4 w-4 shrink-0 object-contain', os.icon === 'ios' && 'dark:invert')}
                              />
                              {os.name}{os.version ? ` ${os.version}` : ''}
                            </span>
                            <span className="hidden text-[var(--text-primary)]/60 sm:inline">by</span>
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-light)] bg-[var(--bg-card)] px-2.5 py-1.5">
                              <img src={browserIcon} alt={browser.name} className="h-4 w-4 shrink-0 object-contain" />
                              {browser.name}
                            </span>
                          </div>
                          <div className="mt-4 border-t border-[var(--border-light)]/70 pt-3">
                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                              <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]/70 p-2.5">
                                <p className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Previous login</p>
                                <p className="mt-1 text-[0.84rem] font-semibold leading-5 text-[var(--text-primary)]">{previousLoginLabel}</p>
                              </div>
                              <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]/70 p-2.5">
                                <p className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Previous device</p>
                                {hasPreviousSession ? (
                                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.82rem] font-semibold text-[var(--text-primary)]">
                                    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-light)] bg-[var(--bg-card)] px-2 py-1">
                                      <img
                                        src={OS_ICONS[previousLoginDevice?.os?.icon || 'unknown'] || OS_ICONS.unknown}
                                        alt={previousLoginDevice?.os?.name || 'Previous OS'}
                                        className={clsx('h-3.5 w-3.5 shrink-0 object-contain', previousLoginDevice?.os?.icon === 'ios' && 'dark:invert')}
                                      />
                                      {previousLoginDevice
                                        ? `${previousLoginDevice.os?.name || 'Previous OS'}${previousLoginDevice.os?.version ? ` ${previousLoginDevice.os.version}` : ''}`
                                        : 'Previous OS'}
                                    </span>
                                    <span className="text-[var(--text-primary)]/60">by</span>
                                    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-light)] bg-[var(--bg-card)] px-2 py-1">
                                      <img
                                        src={BROWSER_ICONS[previousLoginDevice?.browser?.icon || 'unknown'] || BROWSER_ICONS.unknown}
                                        alt={previousLoginDevice?.browser?.name || 'Previous browser'}
                                        className="h-3.5 w-3.5 shrink-0 object-contain"
                                      />
                                      {previousLoginDevice?.browser?.name || 'Previous browser'}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="mt-1.5 text-[0.82rem] font-semibold leading-5 text-[var(--text-secondary)]">
                                    First login on this account.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-fit self-start rounded-2xl border border-red-500/60 bg-[linear-gradient(145deg,rgba(239,68,68,0.11),rgba(239,68,68,0.05))] p-3.5 shadow-[0_8px_20px_rgba(239,68,68,0.08)] sm:p-5">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-500/16 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.05em] text-red-700 dark:text-red-200">
                          <AlertCircle size={13} />
                          Danger Zone
                        </div>
                        <p className="mb-4 text-sm font-semibold leading-6 text-[var(--text-primary)]">
                          Immediately sign out from every active device and force re-authentication.
                        </p>
                        <NeonSweepButton
                          onClick={handleLogoutAll}
                          tone="danger"
                          size="md"
                          className="w-full justify-center border border-red-600/70 bg-red-500/16 text-red-800 hover:bg-red-500/24 dark:text-red-200"
                        >
                          <LogOut size={16} />
                          Logout from all devices
                        </NeonSweepButton>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* ─── APPEARANCE TAB ─── */}
          {activeTab === 'appearance' && (
            <div className="animate-fadeIn flex max-w-full flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
                  Theme
                  <InfoTooltip text="Choose how the interface looks" />
                </h3>
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

              <NeonSweepButton onClick={handleAppearanceSave} tone="cyan" size="md" className="self-start">
                {saved ? <Check size={16} /> : <Save size={16} />}
                {saved ? 'Saved!' : 'Save Preferences'}
              </NeonSweepButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
