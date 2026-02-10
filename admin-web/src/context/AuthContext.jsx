import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '../../../api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(() => {
    // Initialize from localStorage immediately to prevent flash
    try {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      if (storedUser && storedUser !== 'undefined' && token) {
        return JSON.parse(storedUser)
      }
    } catch (e) {
      // Ignore parse errors
    }
    return null
  })
  const [loading, setLoading] = useState(true)
  const authChecked = useRef(false)

  useEffect(() => {
    // Prevent multiple auth checks
    if (authChecked.current) return
    authChecked.current = true

    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      
      // Only try /auth/me if we have a token (meaning user previously logged in)
      if (token) {
        try {
          const response = await authApi.me()
          const userData = response.data
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
        } catch (error) {
          // Cookie/token invalid - use localStorage data if available
          // Don't clear localStorage here, let the user stay logged in
          // They'll get 401 on actual API calls which will trigger logout
          console.log('Auth check failed, using cached user data')
        }
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const login = async (email, password, { portalType, rememberMe } = {}) => {
    try {
      const response = await authApi.login({ email, password, portalType, rememberMe })
      // Backend returns: { id, name, email, role, accountType, organizationId, societyId, flatId, token, tokenType }
      // Backend also sets HTTP-only cookie with JWT
      const { token, id, name, email: userEmail, role, accountType, organizationId, societyId, flatId } = response.data
      
      const userData = { id, name, email: userEmail, role, accountType, organizationId, societyId, flatId }
      
      // Store in localStorage as fallback and for quick access
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const logout = () => {
    // Clear user state immediately for instant UI response
    setUser(null)
    // Clear all cached queries to ensure fresh data on next login
    queryClient.clear()
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Call backend to clear HTTP-only cookie (fire and forget - don't wait)
    authApi.logout().catch(() => {})
  }

  const hasRole = (...roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const isPlatformOwner = () => hasRole('PLATFORM_OWNER')
  const isOrganizationOwner = () => hasRole('ORGANIZATION_OWNER')
  const isSocietyAdmin = () => hasRole('SOCIETY_ADMIN')
  const isChairman = () => hasRole('CHAIRMAN')
  const isSecretary = () => hasRole('SECRETARY')
  const isTreasurer = () => hasRole('TREASURER')
  const isCommittee = () => hasRole('COMMITTEE')
  const isManager = () => hasRole('MANAGER')
  const isMember = () => hasRole('MEMBER')
  
  const isAdminLevel = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN')
  const isCommitteeLevel = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')
  
  // ═══════════════════════════════════════════════════════════════
  // Module Permission checks - aligned with backend @PreAuthorize
  // These are MODULE-LEVEL permissions (banners, tickets, etc.)
  // NOT user CRUD permissions (which are in RolePermissions.java)
  // ═══════════════════════════════════════════════════════════════
  
  // Notices: Staff level (PO → EMPLOYEE can manage)
  const canManageNotices = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE')
  // Documents: Staff level
  const canManageDocuments = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE')
  // Financials: Committee level (leadership + financial roles)
  const canViewFinancials = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE')
  
  // Banners: Operational management
  const canManageBanners = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')
  // Contracts: Administrative + leadership
  const canManageContracts = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY')
  // Emergency Contacts: Operational management
  const canManageEmergencyContacts = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')
  // Maintenance Bills: Financial operations (Treasurer included)
  const canManageMaintenanceBills = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER')
  // Tenants: Module-level tenant management (MANAGER keeps access for day-to-day ops)
  const canManageTenants = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE', 'MANAGER', 'MEMBER')
  // Tickets: Module-level ticket management
  const canManageTickets = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE', 'MANAGER')
  // Ticket Creation: Almost everyone can raise tickets
  const canCreateTickets = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE', 'MEMBER', 'TENANT')
  // Transactions: Financial operations
  const canManageTransactions = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER')
  // Vendors: Operational management
  const canManageVendors = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER')
  // Vendor Bills: Financial operations
  const canManageVendorBills = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER')
  // Security Logs: Leadership only
  const canViewSecurityLogs = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN')
  // Data Export: Committee level
  const canExportData = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')
  // Societies: Platform/Org level only
  const canManageSocieties = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER')
  
  // ═══════════════════════════════════════════════════════════════
  // USER CRUD permissions - aligned with Permission Matrix
  // MANAGER has NO user CRUD rights (not in permission matrix)
  // ═══════════════════════════════════════════════════════════════
  const canManageUsers = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'EMPLOYEE', 'MEMBER')

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    hasRole,
    isPlatformOwner,
    isOrganizationOwner,
    isSocietyAdmin,
    isChairman,
    isSecretary,
    isTreasurer,
    isCommittee,
    isManager,
    isMember,
    isAdminLevel,
    isCommitteeLevel,
    canManageNotices,
    canManageDocuments,
    canViewFinancials,
    canManageBanners,
    canManageContracts,
    canManageEmergencyContacts,
    canManageMaintenanceBills,
    canManageTenants,
    canManageTickets,
    canCreateTickets,
    canManageTransactions,
    canManageVendors,
    canManageVendorBills,
    canViewSecurityLogs,
    canExportData,
    canManageSocieties,
    canManageUsers,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
