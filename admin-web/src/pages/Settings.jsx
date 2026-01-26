import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Save } from 'lucide-react'
import clsx from 'clsx'

export default function Settings() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ]

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tabs */}
        <div className="border-b border-gray-100">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition',
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
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
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{user?.role}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    defaultValue={user?.phone || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input
                    type="text"
                    defaultValue={user?.role}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Save size={18} />
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4 max-w-2xl">
              <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
              
              {[
                { id: 'email_tickets', label: 'New Tickets', desc: 'Get notified when new tickets are created' },
                { id: 'email_complaints', label: 'Complaints', desc: 'Get notified about new complaints' },
                { id: 'email_payments', label: 'Payments', desc: 'Get notified about payment activities' },
                { id: 'email_contracts', label: 'Contract Expiry', desc: 'Get reminded about expiring contracts' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.label}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}

              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mt-4"
              >
                <Save size={18} />
                {saved ? 'Saved!' : 'Save Preferences'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="font-semibold text-gray-900">Change Password</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Save size={18} />
                Update Password
              </button>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Active Sessions</h3>
                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Current Session</p>
                    <p className="text-sm text-gray-500">Windows • Chrome • Active now</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
                <button
                  onClick={logout}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                >
                  Logout from all devices
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="font-semibold text-gray-900">Theme</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <button className="p-4 border-2 border-blue-500 rounded-lg bg-white text-center">
                  <div className="w-full h-12 bg-white border border-gray-200 rounded mb-2"></div>
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button className="p-4 border-2 border-gray-200 rounded-lg bg-white text-center hover:border-gray-300 transition">
                  <div className="w-full h-12 bg-gray-900 rounded mb-2"></div>
                  <span className="text-sm font-medium">Dark</span>
                </button>
                <button className="p-4 border-2 border-gray-200 rounded-lg bg-white text-center hover:border-gray-300 transition">
                  <div className="w-full h-12 bg-gradient-to-r from-white to-gray-900 rounded mb-2"></div>
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Accent Color</h3>
                <div className="flex gap-3">
                  {['blue', 'indigo', 'purple', 'pink', 'green', 'orange'].map((color) => (
                    <button
                      key={color}
                      className={clsx(
                        'w-10 h-10 rounded-full ring-2 ring-offset-2 transition',
                        color === 'blue' && 'bg-blue-500 ring-blue-500',
                        color === 'indigo' && 'bg-indigo-500 ring-transparent hover:ring-indigo-500',
                        color === 'purple' && 'bg-purple-500 ring-transparent hover:ring-purple-500',
                        color === 'pink' && 'bg-pink-500 ring-transparent hover:ring-pink-500',
                        color === 'green' && 'bg-green-500 ring-transparent hover:ring-green-500',
                        color === 'orange' && 'bg-orange-500 ring-transparent hover:ring-orange-500'
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Sidebar</h3>
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Compact Sidebar</h4>
                    <p className="text-sm text-gray-500">Use icons only in the sidebar</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                </label>
              </div>

              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
