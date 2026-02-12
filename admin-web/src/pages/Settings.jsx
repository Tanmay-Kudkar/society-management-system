import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSettings, ACCENT_COLORS } from '../context/SettingsContext'
import { userApi, notificationPreferenceApi } from '../../../api'
import { User, Bell, Shield, Palette, Save, Check } from 'lucide-react'
import clsx from 'clsx'
import Toggle from '../components/Toggle'
import { PhoneInput } from '../components/FormComponents'

export default function Settings() {
  const { user, logout, updateUser } = useAuth()
  const { 
    theme, accentColor, compactSidebar,
    setThemePreview, setAccentColorPreview, setCompactSidebarPreview,
    clearPreviews, updateTheme, updateAccentColor, updateCompactSidebar 
  } = useSettings()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)

  // Notification preferences state
  const [localNotifications, setLocalNotifications] = useState({
    emailTickets: true,
    emailComplaints: true,
    emailPayments: true,
    emailContracts: true,
    emailTenants: true,
    emailNotices: true,
  })
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  // Load notification preferences from API
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
        .catch(() => {
          // Use defaults if API fails
        })
    }
  }, [user?.id])

  // Clear previews when leaving the appearance tab or unmounting
  useEffect(() => {
    return () => {
      clearPreviews()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clear previews when switching away from appearance tab
  useEffect(() => {
    if (activeTab !== 'appearance') {
      clearPreviews()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ]

  const handleProfileSave = async () => {
    setSaving(true)
    setError('')
    try {
      await userApi.update(user.id, {
        name: profileData.name,
        email: user.email,
        phone: profileData.phone,
        role: user.role,
      })
      // Update local storage and context
      const updatedUser = { ...user, name: profileData.name, phone: profileData.phone }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      if (updateUser) {
        updateUser(updatedUser)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    setSaving(true)
    try {
      await userApi.update(user.id, {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        password: passwordData.newPassword,
      })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordSaved(true)
      setTimeout(() => setPasswordSaved(false), 2000)
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationsSave = async () => {
    setNotificationsLoading(true)
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
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save notification preferences')
    } finally {
      setNotificationsLoading(false)
    }
  }

  const handleAppearanceSave = () => {
    // Save the current (preview or saved) values to localStorage
    updateTheme(theme)
    updateAccentColor(accentColor)
    updateCompactSidebar(compactSidebar)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="settings-page">
      {/* Header */}
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
                className={clsx(
                  'settings-tab',
                  activeTab === tab.id ? 'is-active' : 'is-inactive'
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <div className="settings-profile">
                <div className="settings-avatar accent-bg-light accent-text">
                  {profileData.name?.charAt(0) || user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h3 className="settings-profile-name">{profileData.name || user?.name}</h3>
                  <p className="settings-profile-email">{user?.email}</p>
                  <span className="settings-role-badge accent-bg-light accent-text">{user?.role}</span>
                </div>
              </div>
              
              {error && (
                <div className="settings-alert settings-alert--error">
                  {error}
                </div>
              )}
              
              {saved && !error && (
                <div className="settings-alert settings-alert--success">
                  <Check size={16} />
                  Profile updated successfully!
                </div>
              )}
              
              <div className="settings-form-grid">
                <div className="settings-field">
                  <label className="settings-label">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="settings-input"
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="settings-input settings-input--disabled"
                  />
                </div>
                <PhoneInput
                  label="Phone Number"
                  name="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
                <div className="settings-field">
                  <label className="settings-label">Role</label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    disabled
                    className="settings-input settings-input--disabled"
                  />
                </div>
              </div>

              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="settings-primary-button"
              >
                <Save size={18} />
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Notification Preferences</h3>
              <p className="settings-section-subtitle">Choose which email notifications you want to receive</p>
              
              {[
                { id: 'emailTickets', label: 'New Tickets', desc: 'Get notified when new tickets are created or updated' },
                { id: 'emailComplaints', label: 'Complaints', desc: 'Get notified about new complaints' },
                { id: 'emailPayments', label: 'Payments', desc: 'Get notified about payment activities and due bills' },
                { id: 'emailContracts', label: 'Contract Expiry', desc: 'Get reminded about expiring contracts and agreements' },
                { id: 'emailTenants', label: 'Tenant Agreements', desc: 'Get reminded about expiring tenant agreements' },
                { id: 'emailNotices', label: 'Notices', desc: 'Get notified when new notices are published' },
              ].map((item) => (
                <div key={item.id} className="settings-toggle-card">
                  <div>
                    <h4 className="settings-toggle-title">{item.label}</h4>
                    <p className="settings-toggle-text">{item.desc}</p>
                  </div>
                  <Toggle
                    checked={localNotifications[item.id]}
                    onChange={(e) => setLocalNotifications({ ...localNotifications, [item.id]: e.target.checked })}
                  />
                </div>
              ))}

              <button
                onClick={handleNotificationsSave}
                disabled={notificationsLoading}
                className="settings-primary-button"
              >
                <Save size={18} />
                {notificationsLoading ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Change Password</h3>
              
              {passwordError && (
                <div className="settings-alert settings-alert--error">
                  {passwordError}
                </div>
              )}
              
              {passwordSaved && (
                <div className="settings-alert settings-alert--success">
                  Password updated successfully!
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="settings-form">
                {/* Hidden username field for accessibility */}
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={user?.email || ''}
                  readOnly
                  className="sr-only"
                  aria-hidden="true"
                />
                <div className="settings-field">
                  <label className="settings-label">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    autoComplete="current-password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="settings-input"
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    autoComplete="new-password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="settings-input"
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="settings-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="settings-primary-button"
                >
                  <Save size={18} />
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </form>

              <div className="settings-divider">
                <h3 className="settings-section-title">Active Sessions</h3>
                <div className="settings-session-card">
                  <div>
                    <p className="settings-session-title">Current Session</p>
                    <p className="settings-session-text">Windows • Chrome • Active now</p>
                  </div>
                  <span className="settings-status-badge">Active</span>
                </div>
              </div>

              <div className="settings-divider">
                <h3 className="settings-danger-title">Danger Zone</h3>
                <button
                  onClick={logout}
                  className="settings-danger-button"
                >
                  Logout from all devices
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Theme</h3>
              
              <div className="settings-theme-grid">
                <button 
                  onClick={() => setThemePreview('light')}
                  className={clsx(
                    'settings-theme-card',
                    theme === 'light' && 'is-active'
                  )}
                >
                  <div className="settings-theme-preview settings-theme-preview--light"></div>
                  <span className="settings-theme-label">Light</span>
                </button>
                <button 
                  onClick={() => setThemePreview('dark')}
                  className={clsx(
                    'settings-theme-card',
                    theme === 'dark' && 'is-active'
                  )}
                >
                  <div className="settings-theme-preview settings-theme-preview--dark"></div>
                  <span className="settings-theme-label">Dark</span>
                </button>
                <button 
                  onClick={() => setThemePreview('system')}
                  className={clsx(
                    'settings-theme-card',
                    theme === 'system' && 'is-active'
                  )}
                >
                  <div className="settings-theme-preview settings-theme-preview--system"></div>
                  <span className="settings-theme-label">System</span>
                </button>
              </div>

              <div className="settings-divider">
                <h3 className="settings-section-title">Accent Color</h3>
                <p className="settings-section-subtitle">
                  Choose an accent color that will be applied throughout the app, including the landing page.
                </p>
                <div className="settings-accent-grid">
                  {Object.entries(ACCENT_COLORS).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setAccentColorPreview(key)}
                      title={config.name}
                      className={clsx(
                        'settings-accent__swatch',
                        accentColor === key && 'settings-accent__swatch--active'
                      )}
                      style={{ backgroundColor: config.primary }}
                    >
                      {accentColor === key && (
                        <Check className="settings-accent__check" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="settings-accent-current">
                  Current: <span className="settings-accent-name" style={{ color: 'var(--accent-primary)' }}>{ACCENT_COLORS[accentColor]?.name || 'Blue'}</span>
                </p>
              </div>

              <button
                onClick={handleAppearanceSave}
                className="settings-primary-button"
              >
                <Save size={18} />
                {saved ? 'Saved!' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
