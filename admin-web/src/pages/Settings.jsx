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
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account preferences</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        {/* Tabs */}
        <div className="border-b border-gray-100 dark:border-slate-700">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition',
                  activeTab === tab.id
                    ? 'accent-text border-b-2 accent-border'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full accent-bg-light flex items-center justify-center accent-text text-2xl font-bold">
                  {profileData.name?.charAt(0) || user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{profileData.name || user?.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 accent-bg-light accent-text text-xs rounded-full">{user?.role}</span>
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {saved && !error && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm flex items-center gap-2">
                  <Check size={16} />
                  Profile updated successfully!
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-600 rounded-lg text-gray-500 dark:text-gray-400"
                  />
                </div>
                <PhoneInput
                  label="Phone Number"
                  name="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-600 rounded-lg text-gray-500 dark:text-gray-400"
                  />
                </div>
              </div>

              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 accent-btn rounded-lg transition disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4 max-w-2xl">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose which email notifications you want to receive</p>
              
              {[
                { id: 'emailTickets', label: 'New Tickets', desc: 'Get notified when new tickets are created or updated' },
                { id: 'emailComplaints', label: 'Complaints', desc: 'Get notified about new complaints' },
                { id: 'emailPayments', label: 'Payments', desc: 'Get notified about payment activities and due bills' },
                { id: 'emailContracts', label: 'Contract Expiry', desc: 'Get reminded about expiring contracts and agreements' },
                { id: 'emailTenants', label: 'Tenant Agreements', desc: 'Get reminded about expiring tenant agreements' },
                { id: 'emailNotices', label: 'Notices', desc: 'Get notified when new notices are published' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{item.label}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
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
                className="inline-flex items-center gap-2 px-4 py-2 accent-btn rounded-lg transition mt-4 disabled:opacity-50"
              >
                <Save size={18} />
                {notificationsLoading ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="font-semibold text-gray-900 dark:text-white">Change Password</h3>
              
              {passwordError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {passwordError}
                </div>
              )}
              
              {passwordSaved && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm">
                  Password updated successfully!
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="space-y-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    autoComplete="current-password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    autoComplete="new-password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 accent-btn rounded-lg transition disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </form>

              <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Active Sessions</h3>
                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Current Session</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Windows • Chrome • Active now</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">Active</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
                <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                <button
                  onClick={logout}
                  className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  Logout from all devices
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="font-semibold text-gray-900 dark:text-white">Theme</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => setThemePreview('light')}
                  className={clsx(
                    "p-4 border-2 rounded-lg bg-white text-center transition",
                    theme === 'light' ? 'border-blue-500' : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  )}
                >
                  <div className="w-full h-12 bg-white border border-gray-200 rounded mb-2"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
                </button>
                <button 
                  onClick={() => setThemePreview('dark')}
                  className={clsx(
                    "p-4 border-2 rounded-lg bg-white dark:bg-slate-700 text-center transition",
                    theme === 'dark' ? 'border-blue-500' : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  )}
                >
                  <div className="w-full h-12 bg-gray-900 rounded mb-2"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
                </button>
                <button 
                  onClick={() => setThemePreview('system')}
                  className={clsx(
                    "p-4 border-2 rounded-lg bg-white dark:bg-slate-700 text-center transition",
                    theme === 'system' ? 'border-blue-500' : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  )}
                >
                  <div className="w-full h-12 bg-gradient-to-r from-white to-gray-900 rounded mb-2"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">System</span>
                </button>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Accent Color</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Choose an accent color that will be applied throughout the app, including the landing page.
                </p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(ACCENT_COLORS).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setAccentColorPreview(key)}
                      title={config.name}
                      className={clsx(
                        'relative w-10 h-10 rounded-full ring-2 ring-offset-2 dark:ring-offset-slate-800 transition-all duration-200 hover:scale-110',
                        config.bg,
                        accentColor === key 
                          ? config.ring
                          : 'ring-transparent hover:ring-gray-300 dark:hover:ring-slate-500'
                      )}
                    >
                      {accentColor === key && (
                        <Check className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  Current: <span className="font-medium" style={{ color: 'var(--accent-primary)' }}>{ACCENT_COLORS[accentColor]?.name || 'Blue'}</span>
                </p>
              </div>

              <button
                onClick={handleAppearanceSave}
                className="inline-flex items-center gap-2 px-4 py-2 accent-btn rounded-lg transition mt-6"
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
