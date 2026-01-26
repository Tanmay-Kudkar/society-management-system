import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  Building2,
  Home,
  Truck,
  Receipt,
  FileText,
  CreditCard,
  DollarSign,
  Megaphone,
  Image,
  Ticket,
  MessageSquare,
  Phone,
  FileCheck,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import clsx from 'clsx'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'Users', roles: ['MASTER_ADMIN', 'SOCIETY_ADMIN'] },
  { path: '/societies', icon: Building2, label: 'Societies', roles: ['MASTER_ADMIN'] },
  { path: '/flats', icon: Home, label: 'Flats' },
  { path: '/vendors', icon: Truck, label: 'Vendors' },
  { path: '/vendor-bills', icon: Receipt, label: 'Vendor Bills' },
  { path: '/contracts', icon: FileText, label: 'Contracts' },
  { path: '/maintenance-bills', icon: CreditCard, label: 'Maintenance Bills' },
  { path: '/transactions', icon: DollarSign, label: 'Transactions' },
  { path: '/notices', icon: Megaphone, label: 'Notices' },
  { path: '/banners', icon: Image, label: 'Banners' },
  { path: '/tickets', icon: Ticket, label: 'Tickets' },
  { path: '/complaints', icon: MessageSquare, label: 'Complaints' },
  { path: '/emergency-contacts', icon: Phone, label: 'Emergency Contacts' },
  { path: '/documents', icon: FileCheck, label: 'Documents' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true
    return hasRole(...item.roles)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button - only shown on mobile when sidebar is hidden */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-md border border-gray-200"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white border-r border-gray-200 w-64',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-600">Society SMS</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    )
                  }
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={clsx(
              'mt-4 flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors cursor-pointer'
            )}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="transition-all duration-300 min-h-screen overflow-auto lg:ml-64">
        <div className="p-6 lg:p-8 pb-20 pt-16 lg:pt-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
