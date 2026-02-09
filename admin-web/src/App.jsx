import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Societies from './pages/Societies'
import SocietyDetail from './pages/SocietyDetail'
import UnitManagement from './pages/UnitManagement'
import Wings from './pages/Wings'
import Tenants from './pages/Tenants'
import Vehicles from './pages/Vehicles'
import Vendors from './pages/Vendors'
import VendorBills from './pages/VendorBills'
import Contracts from './pages/Contracts'
import MaintenanceBills from './pages/MaintenanceBills'
import Transactions from './pages/Transactions'
import Notices from './pages/Notices'
import Banners from './pages/Banners'
import Tickets from './pages/Tickets'
import Complaints from './pages/Complaints'
import EmergencyContacts from './pages/EmergencyContacts'
import Documents from './pages/Documents'
import Settings from './pages/Settings'
import Reports from './pages/Reports'
// Footer Pages
import About from './pages/footer/About'
import Privacy from './pages/footer/Privacy'
import Terms from './pages/footer/Terms'
import Contact from './pages/footer/Contact'
import './styles/index.css'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
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
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="societies" element={<Societies />} />
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
        <Route path="transactions" element={<Transactions />} />
        <Route path="reports" element={<Reports />} />
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
    </ThemeProvider>
  )
}

export default App
