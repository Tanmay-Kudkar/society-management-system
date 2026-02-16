import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth, ToastProvider, ThemeProvider, ConfirmDialogProvider } from './context'

import { Layout } from './components'
import { Welcome, Login, ForgotPassword, ResetPassword } from './pages/auth'
import { Dashboard, Settings, Reports } from './pages/core'
import { Users, RolesPermissions } from './pages/users'
import { Societies, Organizations, OrganizationDetail, SocietyAdmins, SocietyDetail } from './pages/society'
import { UnitManagement, Wings, Tenants, Vehicles } from './pages/unit'
import { VendorBills, Contracts, MaintenanceBills, Transactions, Payments, MyBills } from './pages/finance'
import { Notices, Banners, Tickets, Complaints, EmergencyContacts, Documents } from './pages/communication'
import { Vendors } from './pages/vendors'

// Footer Pages
import About from './pages/footer/About'
import Privacy from './pages/footer/Privacy'
import Terms from './pages/footer/Terms'
import Contact from './pages/footer/Contact'
import Pricing from './pages/footer/Pricing'
import Blog from './pages/footer/Blog'
import Demo from './pages/footer/Demo'
import Help from './pages/footer/Help'

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
  return (
    <ThemeProvider>
      <ConfirmDialogProvider>
        <ToastProvider>
          <ScrollToTop />
          <DynamicTitle />
          <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Footer Pages */}
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
        </ToastProvider>
      </ConfirmDialogProvider>
    </ThemeProvider>
  )
}

export default App
