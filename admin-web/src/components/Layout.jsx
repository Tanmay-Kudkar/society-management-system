import { useState, useRef, useEffect, useMemo } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  Building2,
  Home,
  UserCheck,
  Car,
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
  ChevronDown,
  BarChart3,
  Layers,
} from 'lucide-react'
import clsx from 'clsx'

// PLATFORM_OWNER specific menu - simplified for platform management
const platformOwnerMenu = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    id: 'societies',
    label: 'Societies',
    icon: Building2,
    path: '/societies',
  },
  {
    id: 'users',
    label: 'Manage Users',
    icon: Users,
    path: '/users',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
]

// ORGANIZATION_OWNER specific menu - manages multiple societies
const orgOwnerMenu = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    id: 'societies',
    label: 'Societies',
    icon: Building2,
    path: '/societies',
  },
  {
    id: 'users',
    label: 'Society Admins',
    icon: Users,
    path: '/users',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
]

// Standard menu for SOCIETY_ADMIN and below - grouped by function
const standardMenuGroups = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    id: 'management',
    label: 'Management',
    icon: Building2,
    items: [
      { path: '/users', icon: Users, label: 'Users', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER'] },
      { path: '/wings', icon: Layers, label: 'Wings', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER'] },
      { path: '/unit-management', icon: Home, label: 'Units', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'] },
      { path: '/tenants', icon: UserCheck, label: 'Tenants', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'MEMBER'] },
      { path: '/vehicles', icon: Car, label: 'Vehicles', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'] },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER'],
    items: [
      { path: '/vendors', icon: Truck, label: 'Vendors', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER'] },
      { path: '/vendor-bills', icon: Receipt, label: 'Vendor Bills', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER'] },
      { path: '/contracts', icon: FileText, label: 'Contracts', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER'] },
      { path: '/maintenance-bills', icon: CreditCard, label: 'Maintenance Bills', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE'] },
      { path: '/transactions', icon: DollarSign, label: 'Transactions', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER'] },
      { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER'] },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: Megaphone,
    items: [
      { path: '/notices', icon: Megaphone, label: 'Notices' },
      { path: '/banners', icon: Image, label: 'Banners', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER'] },
      { path: '/tickets', icon: Ticket, label: 'Tickets' },
      { path: '/complaints', icon: MessageSquare, label: 'Complaints' },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: FileCheck,
    items: [
      { path: '/emergency-contacts', icon: Phone, label: 'Emergency Contacts' },
      { path: '/documents', icon: FileCheck, label: 'Documents' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
]

// Dropdown component for desktop navbar
function NavDropdown({ group, hasRole }) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef(null)
  const location = useLocation()

  // Check if user has access to the group itself
  if (group.roles && !hasRole(...group.roles)) return null

  const filteredItems = group.items?.filter(item => {
    if (!item.roles) return true
    return hasRole(...item.roles)
  }) || []

  if (group.items && filteredItems.length === 0) return null

  const isActive = group.path
    ? location.pathname === group.path
    : filteredItems.some(item => location.pathname === item.path)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150)
  }

  // Single link (no dropdown)
  if (group.path) {
    return (
      <NavLink
        to={group.path}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
          isActive
            ? 'accent-bg-light accent-text shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-[var(--accent-primary)] dark:hover:text-[var(--accent-light)] hover:shadow-md hover:scale-105'
        )}
      >
        <group.icon size={18} />
        <span>{group.label}</span>
      </NavLink>
    )
  }

  // Dropdown
  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
          isActive
            ? 'accent-bg-light accent-text shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-[var(--accent-primary)] dark:hover:text-[var(--accent-light)] hover:shadow-md hover:scale-105'
        )}
      >
        <group.icon size={18} />
        <span>{group.label}</span>
        <ChevronDown size={14} className={clsx('transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      <div 
        className={clsx(
          'absolute top-full left-0 mt-1 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 min-w-48 z-50 transition-all duration-200 origin-top',
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        )}
      >
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150',
                isActive
                  ? 'accent-bg-light accent-text'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              )
            }
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

// Mobile menu accordion - controlled from parent
function MobileAccordion({ group, hasRole, onNavigate, isOpen, onToggle }) {
  const location = useLocation()
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(0)

  // Check access permissions
  const hasGroupAccess = !group.roles || hasRole(...group.roles)
  
  const filteredItems = useMemo(() => {
    if (!group.items) return []
    return group.items.filter(item => {
      if (!item.roles) return true
      return hasRole(...item.roles)
    })
  }, [group.items, hasRole])

  // Calculate content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [filteredItems])

  // Early returns after all hooks
  if (!hasGroupAccess) return null
  if (group.items && filteredItems.length === 0) return null

  const isActiveGroup = group.path
    ? location.pathname === group.path
    : filteredItems.some(item => location.pathname === item.path)

  // Single link
  if (group.path) {
    return (
      <NavLink
        to={group.path}
        onClick={onNavigate}
        className={clsx(
          'flex items-center gap-3 px-4 py-3 text-base font-medium transition-all duration-200',
          isActiveGroup
            ? 'accent-bg-light accent-text shadow-md'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-[var(--accent-primary)] dark:hover:text-[var(--accent-light)] hover:shadow-lg hover:scale-[1.02] hover:translate-x-1'
        )}
      >
        <group.icon size={20} />
        <span>{group.label}</span>
      </NavLink>
    )
  }

  // Accordion
  return (
    <div className="overflow-hidden">
      <button
        onClick={onToggle}
        className={clsx(
          'w-full flex items-center justify-between px-4 py-3 text-base font-medium transition-all duration-200',
          isActiveGroup
            ? 'accent-text shadow-md bg-gray-50 dark:bg-slate-700/50'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-[var(--accent-primary)] dark:hover:text-[var(--accent-light)] hover:shadow-md hover:scale-[1.02] hover:translate-x-1'
        )}
      >
        <div className="flex items-center gap-3">
          <group.icon size={20} />
          <span>{group.label}</span>
        </div>
        <ChevronDown size={18} className={clsx('transition-transform duration-300 ease-out', isOpen && 'rotate-180')} />
      </button>

      <div 
        className="transition-all duration-300 ease-out overflow-hidden"
        style={{ height: isOpen ? contentHeight : 0 }}
      >
        <div ref={contentRef} className="bg-gray-50 dark:bg-slate-900/50">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 pl-12 pr-4 py-3 text-sm transition-all duration-150',
                  isActive
                    ? 'accent-bg-light accent-text'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                )
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openAccordion, setOpenAccordion] = useState(null) // Track which accordion is open

  // Determine which menu to show based on user role
  const isPlatformOwner = user?.role === 'PLATFORM_OWNER'
  const isOrgOwner = user?.role === 'ORGANIZATION_OWNER'
  const menuGroups = isPlatformOwner ? platformOwnerMenu : (isOrgOwner ? orgOwnerMenu : standardMenuGroups)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    // Reset accordions after drawer closes
    setTimeout(() => setOpenAccordion(null), 300)
  }

  const toggleMobileMenu = () => {
    if (mobileMenuOpen) {
      // Closing - reset accordions after transition
      setMobileMenuOpen(false)
      setTimeout(() => setOpenAccordion(null), 300)
    } else {
      // Opening - reset accordions immediately
      setOpenAccordion(null)
      setMobileMenuOpen(true)
    }
  }

  const handleAccordionToggle = (groupId) => {
    // If clicking the same one, close it; otherwise open the new one (closes others)
    setOpenAccordion(prev => prev === groupId ? null : groupId)
  }

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
        setOpenAccordion(null)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-slate-700/50 transition-colors duration-300">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-xl shadow-lg transition-transform hover:scale-105"
                style={{ 
                  background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))`,
                  boxShadow: `0 10px 15px -3px color-mix(in srgb, var(--accent-primary) 25%, transparent)`
                }}
              >
                <Building2 size={20} className="text-white" />
              </div>
              <span 
                className="text-xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
              >
                SocietyHub
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {menuGroups.map((group) => (
              <NavDropdown key={group.id} group={group} hasRole={hasRole} />
            ))}
          </nav>

          {/* User section - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600/50">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-105"
                style={{ 
                  background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))`,
                  boxShadow: `0 10px 15px -3px color-mix(in srgb, var(--accent-primary) 25%, transparent)`
                }}
              >
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-200">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200 font-medium tracking-tight uppercase">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 bg-gray-50 hover:bg-red-50 dark:bg-slate-700/50 dark:hover:bg-red-900/20 border border-gray-100 dark:border-slate-600/50 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <LogOut size={18} />
            </button>
          </div>

          {/* Hamburger - Mobile */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200"
          >
            <div className="relative w-6 h-6">
              <Menu 
                size={24} 
                className={clsx(
                  'absolute inset-0 transition-all duration-300',
                  mobileMenuOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                )}
              />
              <X 
                size={24} 
                className={clsx(
                  'absolute inset-0 transition-all duration-300',
                  mobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                )}
              />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        className={clsx(
          'fixed inset-0 z-50 lg:hidden transition-all duration-300',
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className={clsx(
            'absolute inset-0 bg-black transition-opacity duration-300',
            mobileMenuOpen ? 'opacity-50' : 'opacity-0'
          )}
          onClick={closeMobileMenu}
        />

        {/* Drawer */}
        <aside
          className={clsx(
            'absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-slate-800 shadow-xl transition-transform duration-300 ease-out',
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-xl"
                style={{ background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))` }}
              >
                <Building2 size={18} className="text-white" />
              </div>
              <span 
                className="text-lg font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))` }}
              >
                Menu
              </span>
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 overflow-y-auto pb-40">
            {menuGroups.map((group) => (
              <MobileAccordion
                key={group.id}
                group={group}
                hasRole={hasRole}
                onNavigate={closeMobileMenu}
                isOpen={openAccordion === group.id}
                onToggle={() => handleAccordionToggle(group.id)}
              />
            ))}
          </nav>

          {/* Mobile User Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))`,
                  boxShadow: `0 10px 15px -3px color-mix(in srgb, var(--accent-primary) 25%, transparent)`
                }}
              >
                <span className="text-white font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium uppercase tracking-tight">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/25 transition-all duration-200 cursor-pointer font-medium"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main content */}
      <main className="pt-16 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
