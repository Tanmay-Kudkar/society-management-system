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

  return (
    <div className="settings-pw-strength">
      <div className="settings-pw-strength__bar">
        <div
          className={`settings-pw-strength__fill settings-pw-strength__fill--${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`settings-pw-strength__label settings-pw-strength__label--${tone}`}>
        {label}
      </span>
    </div>
  )
}

const PasswordChecklist = ({ password }) => {
  if (!password) return null
  return (
    <div className="settings-pw-checklist">
      {passwordRules.map(rule => {
        const ok = rule.test(password)
        return (
          <div key={rule.id} className={clsx('settings-pw-checklist__item', ok && 'is-ok')}>
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
    <div className={`settings-alert settings-alert--${type}`}>
      <Icon size={16} className="settings-alert__icon" />
      <span className="settings-alert__text">{children}</span>
    </div>
  )
}

/* ── main component ─────────────────────────────────────── */
export default function Settings() {
  const { user, logout, updateUser } = useAuth()
  const {
    theme, compactSidebar,
    setThemePreview, setCompactSidebarPreview,
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

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your account preferences</p>
      </div>

      <div className="settings-card">
        {/* Tabs */}
        <div className="settings-tabs">
          <nav className="settings-tabs-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx('settings-tab', activeTab === tab.id ? 'is-active' : 'is-inactive')}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-content">

          {/* ─── PROFILE TAB ─── */}
          {activeTab === 'profile' && (
            <div className="settings-section animate-fadeIn">
              <div className="settings-profile-header">
                <div className="settings-avatar">
                  {profileData.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="settings-profile-info">
                  <h3 className="settings-profile-name">{profileData.name || user?.name}</h3>
                  <p className="settings-profile-email">
                    <Mail size={13} />
                    {user?.email}
                  </p>
                  <span className="settings-role-badge">
                    <BadgeCheck size={12} />
                    {user?.role?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {error && <Alert type="error">{error}</Alert>}
              {saved && !error && <Alert type="success">Profile updated successfully!</Alert>}

              <div className="settings-form-grid">
                <div className="settings-field">
                  <label className="settings-label">
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
                    className={clsx('settings-input', profileErrors.name && 'settings-input--error')}
                    placeholder="Enter your full name"
                    maxLength={100}
                  />
                  {profileErrors.name && (
                    <span className="settings-field-error">
                      <AlertCircle size={12} />
                      {profileErrors.name}
                    </span>
                  )}
                  <span className="settings-field-hint">{profileData.name?.length || 0}/100 characters</span>
                </div>
                <div className="settings-field">
                  <label className="settings-label">
                    <Mail size={14} />
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="settings-input settings-input--disabled"
                  />
                  <span className="settings-field-hint">
                    <Lock size={11} />
                    Email cannot be changed
                  </span>
                </div>
                <div className="settings-field">
                  <label className="settings-label">
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
                    <span className="settings-field-error">
                      <AlertCircle size={12} />
                      {profileErrors.phone}
                    </span>
                  )}
                </div>
                <div className="settings-field">
                  <label className="settings-label">
                    <BadgeCheck size={14} />
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role?.replace(/_/g, ' ') || ''}
                    disabled
                    className="settings-input settings-input--disabled"
                  />
                  <span className="settings-field-hint">
                    <Lock size={11} />
                    Role is managed by administrators
                  </span>
                </div>
              </div>

              <button onClick={handleProfileSave} disabled={saving} className="settings-primary-button">
                {saved ? <Check size={16} /> : <Save size={16} />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ─── NOTIFICATIONS TAB ─── */}
          {activeTab === 'notifications' && (
            <div className="settings-section animate-fadeIn">
              <div className="settings-section-header">
                <h3 className="settings-section-title">Notification Preferences</h3>
                <p className="settings-section-subtitle">Choose which email notifications you want to receive</p>
              </div>

              {error && <Alert type="error">{error}</Alert>}
              {saved && !error && <Alert type="success">Preferences saved successfully!</Alert>}

              <div className="settings-toggle-list">
                {[
                  { id: 'emailTickets', label: 'New Tickets', desc: 'Notified when tickets are created or updated', icon: '🎫' },
                  { id: 'emailComplaints', label: 'Complaints', desc: 'Notified about new complaints', icon: '⚠️' },
                  { id: 'emailPayments', label: 'Payments', desc: 'Notified about payment activities', icon: '💳' },
                  { id: 'emailContracts', label: 'Contract Expiry', desc: 'Reminded about expiring contracts', icon: '📝' },
                  { id: 'emailTenants', label: 'Tenant Agreements', desc: 'Reminded about expiring agreements', icon: '🏠' },
                  { id: 'emailNotices', label: 'Notices', desc: 'Notified when notices are published', icon: '📢' },
                ].map((item) => (
                  <div key={item.id} className="settings-toggle-card">
                    <div className="settings-toggle-card__left">
                      <span className="settings-toggle-card__icon">{item.icon}</span>
                      <div>
                        <h4 className="settings-toggle-title">{item.label}</h4>
                        <p className="settings-toggle-text">{item.desc}</p>
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

              <button onClick={handleNotificationsSave} disabled={notificationsLoading} className="settings-primary-button">
                {saved ? <Check size={16} /> : <Save size={16} />}
                {notificationsLoading ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
              </button>
            </div>
          )}

          {/* ─── SECURITY TAB ─── */}
          {activeTab === 'security' && (
            <div className="settings-section animate-fadeIn">
              <div className="settings-section-header">
                <h3 className="settings-section-title">Change Password</h3>
                <p className="settings-section-subtitle">Enter your current password and choose a new one</p>
              </div>

              {passwordError && <Alert type="error">{passwordError}</Alert>}
              {passwordSaved && <Alert type="success">Password changed successfully!</Alert>}

              <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange() }} className="settings-form">
                {/* Hidden username for password managers */}
                <input type="text" name="username" autoComplete="username" value={user?.email || ''} readOnly className="sr-only" aria-hidden="true" />

                <div className="settings-field">
                  <label className="settings-label">
                    <Lock size={14} />
                    Current Password
                  </label>
                  <div className="settings-input-wrap">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      autoComplete="current-password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="settings-input settings-input--has-icon"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="settings-input-toggle"
                      onClick={() => setShowPasswords(s => ({ ...s, current: !s.current }))}
                      tabIndex={-1}
                    >
                      {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-label">
                    <Lock size={14} />
                    New Password
                  </label>
                  <div className="settings-input-wrap">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      autoComplete="new-password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="settings-input settings-input--has-icon"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="settings-input-toggle"
                      onClick={() => setShowPasswords(s => ({ ...s, new: !s.new }))}
                      tabIndex={-1}
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrength password={passwordData.newPassword} />
                  <PasswordChecklist password={passwordData.newPassword} />
                </div>

                <div className="settings-field">
                  <label className="settings-label">
                    <Lock size={14} />
                    Confirm New Password
                  </label>
                  <div className="settings-input-wrap">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={clsx(
                        'settings-input settings-input--has-icon',
                        passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && 'settings-input--error'
                      )}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="settings-input-toggle"
                      onClick={() => setShowPasswords(s => ({ ...s, confirm: !s.confirm }))}
                      tabIndex={-1}
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <span className="settings-field-error">
                      <AlertCircle size={12} />
                      Passwords do not match
                    </span>
                  )}
                  {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword.length > 0 && (
                    <span className="settings-field-success">
                      <CheckCircle2 size={12} />
                      Passwords match
                    </span>
                  )}
                </div>

                <button type="submit" disabled={saving || !passwordValid} className="settings-primary-button">
                  {passwordSaved ? <Check size={16} /> : <Shield size={16} />}
                  {saving ? 'Updating...' : passwordSaved ? 'Updated!' : 'Update Password'}
                </button>
              </form>

              {/* Active Sessions */}
              <div className="settings-divider">
                <div className="settings-section-header">
                  <h3 className="settings-section-title">Active Sessions</h3>
                  <p className="settings-section-subtitle">Manage your active login sessions</p>
                </div>
                {(() => {
                  const { os, browser } = getDeviceInfo()
                  const osIcon = OS_ICONS[os.icon] || OS_ICONS.unknown
                  const browserIcon = BROWSER_ICONS[browser.icon] || BROWSER_ICONS.unknown
                  return (
                    <div className="settings-session-card">
                      <div className="settings-session-card__left">
                        <div className="settings-session-card__icon">
                          <Monitor size={18} />
                        </div>
                        <div className="settings-session-card__info">
                          <p className="settings-session-title">Current Session</p>
                          <div className="settings-session-details">
                            <span className="settings-session-chip">
                              <img src={osIcon} alt={os.name} className="settings-session-chip__icon" />
                              {os.name}{os.version ? ` ${os.version}` : ''}
                            </span>
                            <span className="settings-session-separator">&bull;</span>
                            <span className="settings-session-chip">
                              <img src={browserIcon} alt={browser.name} className="settings-session-chip__icon" />
                              {browser.name}
                            </span>
                            <span className="settings-session-separator">&bull;</span>
                            <span className="settings-session-chip settings-session-chip--active">Active now</span>
                          </div>
                        </div>
                      </div>
                      <span className="settings-status-badge">
                        <span className="settings-status-badge__dot" />
                        Active
                      </span>
                    </div>
                  )
                })()}
              </div>

              {/* Danger Zone */}
              <div className="settings-divider">
                <div className="settings-danger-zone">
                  <div className="settings-danger-zone__header">
                    <AlertCircle size={18} className="settings-danger-zone__icon" />
                    <div>
                      <h3 className="settings-danger-title">Danger Zone</h3>
                      <p className="settings-danger-text">This will log you out from all devices and end all sessions</p>
                    </div>
                  </div>
                  <button onClick={handleLogoutAll} className="settings-danger-button">
                    <LogOut size={16} />
                    Logout from all devices
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── APPEARANCE TAB ─── */}
          {activeTab === 'appearance' && (
            <div className="settings-section animate-fadeIn">
              <div className="settings-section-header">
                <h3 className="settings-section-title">Theme</h3>
                <p className="settings-section-subtitle">Choose how the interface looks</p>
              </div>

              <div className="settings-theme-grid">
                {[
                  { id: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright' },
                  { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
                  { id: 'system', label: 'System', icon: Monitor, desc: 'Follow OS setting' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThemePreview(t.id)}
                    className={clsx('settings-theme-card', theme === t.id && 'is-active')}
                  >
                    <div className={`settings-theme-preview settings-theme-preview--${t.id}`}>
                      <t.icon size={24} className="settings-theme-preview__icon" />
                    </div>
                    <span className="settings-theme-label">{t.label}</span>
                    <span className="settings-theme-desc">{t.desc}</span>
                    {theme === t.id && (
                      <span className="settings-theme-active">
                        <Check size={14} />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button onClick={handleAppearanceSave} className="settings-primary-button">
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
