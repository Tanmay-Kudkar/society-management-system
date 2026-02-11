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
    id: 'organizations',
    label: 'Organizations',
    icon: Layers,
    path: '/organizations',
  },
  {
    id: 'society-admins',
    label: 'Society Admins',
    icon: UserCheck,
    path: '/society-admins',
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
  {
    id: 'roles-permissions',
    label: 'Roles & Access',
    icon: FileCheck,
    path: '/roles-permissions',
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
    icon: UserCheck,
    path: '/society-admins',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
  {
    id: 'roles-permissions',
    label: 'Roles & Access',
    icon: FileCheck,
    path: '/roles-permissions',
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
      { path: '/unit-management', icon: Home, label: 'Units & Users', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'] },
      { path: '/wings', icon: Layers, label: 'Wings', roles: ['SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER'] },
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
          'app-nav__link',
          isActive ? 'app-nav__link--active' : 'app-nav__link--idle'
        )}
        style={isActive ? { 
          background: `linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))`,
          boxShadow: `0 4px 12px -2px color-mix(in srgb, var(--accent-primary) 40%, transparent)`
        } : undefined}
      >
        <group.icon size={18} />
        <span>{group.label}</span>
      </NavLink>
    )
  }

  // Dropdown
  return (
    <div
      className="app-nav__item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={clsx(
          'app-nav__trigger',
          isActive ? 'app-nav__trigger--active' : 'app-nav__trigger--idle'
        )}
        style={isActive ? { 
          background: `linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))`,
          boxShadow: `0 4px 12px -2px color-mix(in srgb, var(--accent-primary) 40%, transparent)`
        } : undefined}
      >
        <group.icon size={18} />
        <span>{group.label}</span>
        <ChevronDown size={14} className={clsx('app-nav__chevron', isOpen && 'app-nav__chevron--open')} />
      </button>

      <div 
        className={clsx(
          'app-nav__menu',
          isOpen ? 'app-nav__menu--open' : 'app-nav__menu--closed'
        )}
        style={isOpen ? { boxShadow: '0 20px 40px -8px rgba(0,0,0,0.12), 0 8px 16px -4px rgba(0,0,0,0.08)' } : undefined}
      >
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              clsx(
                'app-nav__menu-link',
                isActive
                  ? 'app-nav__menu-link--active accent-bg-light accent-text'
                  : 'app-nav__menu-link--idle'
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
          'app-mobile__link',
          isActiveGroup
            ? 'app-mobile__link--active accent-bg-light accent-text'
            : 'app-mobile__link--idle'
        )}
      >
        <group.icon size={20} />
        <span>{group.label}</span>
      </NavLink>
    )
  }

  // Accordion
  return (
    <div className="app-mobile__accordion">
      <button
        onClick={onToggle}
        className={clsx(
          'app-mobile__trigger',
          isActiveGroup ? 'app-mobile__trigger--active' : 'app-mobile__trigger--idle'
        )}
      >
        <div className="app-mobile__trigger-row">
          <group.icon size={20} />
          <span>{group.label}</span>
        </div>
        <ChevronDown
          size={18}
          className={clsx('app-mobile__chevron', isOpen && 'app-mobile__chevron--open')}
        />
      </button>

      <div
        className="app-mobile__panel"
        style={{ height: isOpen ? contentHeight : 0 }}
      >
        <div ref={contentRef} className="app-mobile__panel-inner">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  'app-mobile__sublink',
                  isActive
                    ? 'app-mobile__sublink--active accent-bg-light accent-text'
                    : 'app-mobile__sublink--idle'
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
    <div className="app-layout">
      {/* Top Navbar */}
      <header className="app-layout__header">
        {/* Accent gradient line at top */}
        <div
          className="app-layout__accent"
          style={{ background: `linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-via), var(--accent-gradient-to))` }}
        />
        <div className="app-layout__bar">
          <div className="app-layout__bar-inner">
            {/* Logo */}
            <div className="app-layout__logo" onClick={() => navigate('/')}>
              <div
                className="app-layout__logo-mark"
                style={{ 
                  background: `linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-via), var(--accent-gradient-to))`,
                  boxShadow: `0 8px 20px -4px color-mix(in srgb, var(--accent-primary) 35%, transparent)`
                }}
              >
                <Building2 size={22} className="app-layout__logo-icon" />
              </div>
              <div className="app-layout__logo-text">
                <span
                  className="app-layout__brand"
                  style={{ backgroundImage: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))` }}
                >
                  SocietyHub
                </span>
                <span className="app-layout__subtitle">Management Platform</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="app-layout__nav">
              {menuGroups.map((group) => (
                <NavDropdown key={group.id} group={group} hasRole={hasRole} />
              ))}
            </nav>

            {/* User section - Desktop */}
            <div className="app-layout__user">
              <div 
                className="app-layout__user-card"
                style={{ 
                  borderColor: `color-mix(in srgb, var(--accent-primary) 20%, transparent)`,
                  background: `color-mix(in srgb, var(--accent-50) 50%, transparent)`
                }}
              >
                <div 
                  className="app-layout__user-avatar"
                  style={{ 
                    background: `linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))`,
                    boxShadow: `0 6px 12px -2px color-mix(in srgb, var(--accent-primary) 30%, transparent)`
                  }}
                >
                  <span className="app-layout__user-initial">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="app-layout__user-info">
                  <p className="app-layout__user-name">{user?.name}</p>
                  <p
                    className="app-layout__user-role"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {user?.role?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="app-layout__logout"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Hamburger - Mobile */}
            <button
              onClick={toggleMobileMenu}
              className="app-layout__menu-button"
            >
              <div className="app-layout__menu-icon">
                <Menu
                  size={24}
                  className={clsx(
                    'app-layout__menu-line',
                    mobileMenuOpen ? 'app-layout__menu-line--hidden' : 'app-layout__menu-line--visible'
                  )}
                />
                <X
                  size={24}
                  className={clsx(
                    'app-layout__menu-line',
                    mobileMenuOpen ? 'app-layout__menu-line--visible' : 'app-layout__menu-line--hidden-reverse'
                  )}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        className={clsx(
          'app-layout__drawer-overlay',
          mobileMenuOpen ? 'app-layout__drawer-overlay--open' : 'app-layout__drawer-overlay--closed'
        )}
      >
        {/* Backdrop */}
        <div
          className={clsx(
            'app-layout__drawer-backdrop',
            mobileMenuOpen ? 'app-layout__drawer-backdrop--open' : 'app-layout__drawer-backdrop--closed'
          )}
          onClick={closeMobileMenu}
        />

        {/* Drawer */}
        <aside
          className={clsx(
            'app-layout__drawer',
            mobileMenuOpen ? 'app-layout__drawer--open' : 'app-layout__drawer--closed'
          )}
        >
          {/* Mobile Header */}
          <div className="app-layout__drawer-header">
            <div className="app-layout__drawer-brand">
              <div
                className="app-layout__drawer-mark"
                style={{ background: `linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))` }}
              >
                <Building2 size={18} className="app-layout__drawer-icon" />
              </div>
              <div className="app-layout__drawer-text">
                <span
                  className="app-layout__drawer-title"
                  style={{ backgroundImage: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))` }}
                >
                  Menu
                </span>
                <span className="app-layout__drawer-subtitle">Navigation</span>
              </div>
            </div>
            <button
              onClick={closeMobileMenu}
              className="app-layout__drawer-close"
            >
              <X size={24} />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="app-layout__drawer-nav">
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
          <div className="app-layout__drawer-user">
            <div
              className="app-layout__drawer-user-card"
              style={{
                borderColor: `color-mix(in srgb, var(--accent-primary) 20%, transparent)`,
                background: `color-mix(in srgb, var(--accent-50) 50%, transparent)`
              }}
            >
              <div
                className="app-layout__drawer-avatar"
                style={{
                  background: `linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))`,
                  boxShadow: `0 6px 12px -2px color-mix(in srgb, var(--accent-primary) 30%, transparent)`
                }}
              >
                <span className="app-layout__drawer-initial">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="app-layout__drawer-info">
                <p className="app-layout__drawer-name">{user?.name}</p>
                <p
                  className="app-layout__drawer-role"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  {user?.role?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="app-layout__drawer-logout"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main content */}
      <main className="app-layout__main">
        <div className="app-layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
