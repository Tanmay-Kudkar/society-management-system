import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Societies from './pages/Societies'
import Flats from './pages/Flats'
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

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="societies" element={<Societies />} />
        <Route path="flats" element={<Flats />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="vendor-bills" element={<VendorBills />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="maintenance-bills" element={<MaintenanceBills />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="notices" element={<Notices />} />
        <Route path="banners" element={<Banners />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="emergency-contacts" element={<EmergencyContacts />} />
        <Route path="documents" element={<Documents />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
