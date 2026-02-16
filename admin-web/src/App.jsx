import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense, useRef } from 'react'
import { useAuth, ToastProvider, ThemeProvider, ConfirmDialogProvider } from './context'

import { Layout } from './components'

const lazyWithMinDelay = (importer, delay = 320) =>
  lazy(() =>
    Promise.all([
      importer(),
      new Promise((resolve) => setTimeout(resolve, delay)),
    ]).then(([module]) => module),
  )

const Welcome = lazyWithMinDelay(() => import('./pages/auth/Welcome'))
const Login = lazyWithMinDelay(() => import('./pages/auth/Login'))
const ForgotPassword = lazyWithMinDelay(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazyWithMinDelay(() => import('./pages/auth/ResetPassword'))

const Dashboard = lazyWithMinDelay(() => import('./pages/core/Dashboard'))
const Settings = lazyWithMinDelay(() => import('./pages/core/Settings'))
const Reports = lazyWithMinDelay(() => import('./pages/core/Reports'))

const Users = lazyWithMinDelay(() => import('./pages/users/Users'))
const RolesPermissions = lazyWithMinDelay(() => import('./pages/users/RolesPermissions'))

const Societies = lazyWithMinDelay(() => import('./pages/society/Societies'))
const Organizations = lazyWithMinDelay(() => import('./pages/society/Organizations'))
const OrganizationDetail = lazyWithMinDelay(() => import('./pages/society/OrganizationDetail'))
const SocietyAdmins = lazyWithMinDelay(() => import('./pages/society/SocietyAdmins'))
const SocietyDetail = lazyWithMinDelay(() => import('./pages/society/SocietyDetail'))

const UnitManagement = lazyWithMinDelay(() => import('./pages/unit/UnitManagement'))
const Wings = lazyWithMinDelay(() => import('./pages/unit/Wings'))
const Tenants = lazyWithMinDelay(() => import('./pages/unit/Tenants'))
const Vehicles = lazyWithMinDelay(() => import('./pages/unit/Vehicles'))

const VendorBills = lazyWithMinDelay(() => import('./pages/finance/VendorBills'))
const Contracts = lazyWithMinDelay(() => import('./pages/finance/Contracts'))
const MaintenanceBills = lazyWithMinDelay(() => import('./pages/finance/MaintenanceBills'))
const Transactions = lazyWithMinDelay(() => import('./pages/finance/Transactions'))
const Payments = lazyWithMinDelay(() => import('./pages/finance/Payments'))
const MyBills = lazyWithMinDelay(() => import('./pages/finance/MyBills'))

const Notices = lazyWithMinDelay(() => import('./pages/communication/Notices'))
const Banners = lazyWithMinDelay(() => import('./pages/communication/Banners'))
const Tickets = lazyWithMinDelay(() => import('./pages/communication/Tickets'))
const Complaints = lazyWithMinDelay(() => import('./pages/communication/Complaints'))
const EmergencyContacts = lazyWithMinDelay(() => import('./pages/communication/EmergencyContacts'))
const Documents = lazyWithMinDelay(() => import('./pages/communication/Documents'))

const Vendors = lazyWithMinDelay(() => import('./pages/vendors/Vendors'))

const About = lazyWithMinDelay(() => import('./pages/footer/About'))
const Privacy = lazyWithMinDelay(() => import('./pages/footer/Privacy'))
const Terms = lazyWithMinDelay(() => import('./pages/footer/Terms'))
const Contact = lazyWithMinDelay(() => import('./pages/footer/Contact'))
const Pricing = lazyWithMinDelay(() => import('./pages/footer/Pricing'))
const Blog = lazyWithMinDelay(() => import('./pages/footer/Blog'))
const Demo = lazyWithMinDelay(() => import('./pages/footer/Demo'))
const Help = lazyWithMinDelay(() => import('./pages/footer/Help'))

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    // Reset scroll on both window and document element to cover all containers
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])

  return null
}

const PAGE_TITLES = {
  '/welcome': 'Welcome',
  '/login': 'Sign In',
  '/forgot-password': 'Forgot Password',
  '/reset-password': 'Reset Password',
  '/about': 'About',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
  '/contact': 'Contact',
  '/pricing': 'Pricing',
  '/blog': 'Blog',
  '/demo': 'Demo',
  '/help': 'Help',
  '/': 'Dashboard',
  '/users': 'Users',
  '/societies': 'Societies',
  '/organizations': 'Organizations',
  '/society-admins': 'Society Admins',
  '/wings': 'Wings',
  '/unit-management': 'Unit & User Management',
  '/tenants': 'Tenants',
  '/vehicles': 'Vehicles',
  '/vendors': 'Vendors',
  '/vendor-bills': 'Vendor Bills',
  '/contracts': 'Contracts',
  '/maintenance-bills': 'Maintenance Bills',
  '/payments': 'Online Payments',
  '/my-bills': 'My Bills',
  '/transactions': 'Transactions',
  '/reports': 'Reports',
  '/roles-permissions': 'Roles & Permissions',
  '/notices': 'Notices',
  '/banners': 'Banners',
  '/tickets': 'Tickets',
  '/complaints': 'Complaints',
  '/emergency-contacts': 'Emergency Contacts',
  '/documents': 'Documents',
  '/settings': 'Settings',
}

const DynamicTitle = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    const title = PAGE_TITLES[pathname]
      || (pathname.startsWith('/organizations/') ? 'Organization Details' : null)
      || (pathname.startsWith('/societies/') ? 'Society Details' : null)
    document.title = title ? `${title} - SocietyHub` : 'SocietyHub'
  }, [pathname])

  return null
}

function App() {
  const { user } = useAuth()
  const didPrefetchRef = useRef(false)

  useEffect(() => {
    if (!user || didPrefetchRef.current) {
      return
    }

    const role = user?.role
    const importers = [
      () => import('./pages/core/Dashboard'),
      () => import('./pages/core/Settings'),
      () => import('./pages/communication/Notices'),
    ]

    if (role === 'PLATFORM_OWNER' || role === 'ORGANIZATION_OWNER') {
      importers.push(
        () => import('./pages/society/Societies'),
        () => import('./pages/society/Organizations'),
        () => import('./pages/society/SocietyAdmins'),
        () => import('./pages/users/Users'),
        () => import('./pages/core/Reports'),
      )
    } else if (role === 'MEMBER' || role === 'TENANT') {
      importers.push(
        () => import('./pages/finance/MyBills'),
        () => import('./pages/communication/Tickets'),
        () => import('./pages/communication/Complaints'),
      )
    } else {
      importers.push(
        () => import('./pages/unit/UnitManagement'),
        () => import('./pages/unit/Tenants'),
        () => import('./pages/unit/Vehicles'),
        () => import('./pages/finance/MaintenanceBills'),
        () => import('./pages/finance/Transactions'),
      )
    }

    const runPrefetch = () => {
      importers.slice(0, 8).forEach((loadPage) => {
        loadPage().catch(() => null)
      })
    }

    let idleId
    let timeoutId

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(runPrefetch, { timeout: 1500 })
    } else {
      timeoutId = window.setTimeout(runPrefetch, 350)
    }

    didPrefetchRef.current = true

    return () => {
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [user])

  const routeFallback = (
    <div className="skeleton-container" style={{ padding: '24px' }}>
      <div className="skeleton-hero">
        <div className="skeleton-row">
          <div className="skeleton-bone skeleton-bone--rounded" style={{ width: 44, height: 44 }} />
          <div className="skeleton-col">
            <div className="skeleton-bone" style={{ width: '35%', height: 24 }} />
            <div className="skeleton-bone" style={{ width: '55%', height: 14 }} />
          </div>
        </div>
      </div>
      <div className="skeleton-grid skeleton-grid--4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-stat">
            <div className="skeleton-bone skeleton-bone--rounded" style={{ width: 40, height: 40 }} />
            <div className="skeleton-bone" style={{ width: '55%', height: 24 }} />
            <div className="skeleton-bone" style={{ width: '75%', height: 13 }} />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <ThemeProvider>
      <ConfirmDialogProvider>
        <ToastProvider>
          <ScrollToTop />
          <DynamicTitle />
          <Suspense fallback={routeFallback}>
            <Routes>
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/help" element={<Help />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="societies" element={<Societies />} />
                <Route path="organizations" element={<Organizations />} />
                <Route path="organizations/:id" element={<OrganizationDetail />} />
                <Route path="society-admins" element={<SocietyAdmins />} />
                <Route path="societies/:id" element={<SocietyDetail />} />
                <Route path="wings" element={<Wings />} />
                <Route path="flats" element={<Navigate to="/unit-management" replace />} />
                <Route path="unit-management" element={<UnitManagement />} />
                <Route path="tenants" element={<Tenants />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="vendors" element={<Vendors />} />
                <Route path="vendor-bills" element={<VendorBills />} />
                <Route path="contracts" element={<Contracts />} />
                <Route path="maintenance-bills" element={<MaintenanceBills />} />
                <Route path="payments" element={<Payments />} />
                <Route path="my-bills" element={<MyBills />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="reports" element={<Reports />} />
                <Route path="roles-permissions" element={<RolesPermissions />} />
                <Route path="notices" element={<Notices />} />
                <Route path="banners" element={<Banners />} />
                <Route path="tickets" element={<Tickets />} />
                <Route path="complaints" element={<Complaints />} />
                <Route path="emergency-contacts" element={<EmergencyContacts />} />
                <Route path="documents" element={<Documents />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/welcome" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </ConfirmDialogProvider>
    </ThemeProvider>
  )
}

export default App
