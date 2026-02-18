import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
  const [loading, setLoading] = useState(() => {
    // Skip loading spinner when cached user data exists
    try {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      if (storedUser && storedUser !== 'undefined' && token) {
        return false // cached user available, render immediately
      }
    } catch (e) {}
    return true // no cached user, must wait for auth check
  })
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
          setUser((prevUser) => {
            if (!prevUser) return userData

            const isSameUser =
              prevUser.id === userData.id &&
              prevUser.name === userData.name &&
              prevUser.email === userData.email &&
              prevUser.role === userData.role &&
              prevUser.accountType === userData.accountType &&
              prevUser.organizationId === userData.organizationId &&
              prevUser.societyId === userData.societyId &&
              prevUser.flatId === userData.flatId

            return isSameUser ? prevUser : userData
          })
          localStorage.setItem('user', JSON.stringify(userData))
        } catch (error) {
          // Cookie/token invalid - use localStorage data if available
        }
      }
      // Only update loading if it was true (avoids unnecessary re-render when cached user exists)
      setLoading((prev) => prev ? false : prev)
    }
    
    checkAuth()
  }, [])

  const login = useCallback(async (email, password, { portalType, rememberMe } = {}) => {
    try {
      const response = await authApi.login({ email, password, portalType, rememberMe })
      const { token, id, name, email: userEmail, role, accountType, organizationId, societyId, flatId } = response.data
      
      const userData = { id, name, email: userEmail, role, accountType, organizationId, societyId, flatId }
      
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
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    queryClient.clear()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    authApi.logout().catch(() => {})
  }, [queryClient])

  const hasRole = useCallback((...roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }, [user])

  const isPlatformOwner = useCallback(() => hasRole('MASTER_ADMIN'), [hasRole])
  const isMasterAdmin = useCallback(() => hasRole('MASTER_ADMIN'), [hasRole])
  const isOrganizationOwner = useCallback(() => false, []) // Deprecated: kept for backward compat
  const isSocietyAdmin = useCallback(() => hasRole('SOCIETY_ADMIN'), [hasRole])
  const isChairman = useCallback(() => hasRole('CHAIRMAN'), [hasRole])
  const isSecretary = useCallback(() => hasRole('SECRETARY'), [hasRole])
  const isTreasurer = useCallback(() => hasRole('TREASURER'), [hasRole])
  const isCommittee = useCallback(() => hasRole('COMMITTEE'), [hasRole])
  const isManager = useCallback(() => hasRole('MANAGER'), [hasRole])
  const isEmployee = useCallback(() => hasRole('EMPLOYEE'), [hasRole])
  const isMember = useCallback(() => hasRole('MEMBER'), [hasRole])
  const isTenant = useCallback(() => hasRole('TENANT'), [hasRole])
  const isVendor = useCallback(() => hasRole('VENDOR'), [hasRole])
  const isVisitor = useCallback(() => hasRole('VISITOR'), [hasRole])
  
  const isAdminLevel = useCallback(() => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN'), [hasRole])
  const isCommitteeLevel = useCallback(() => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'), [hasRole])
  
  const canManageNotices = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'), [hasRole])
  const canManageDocuments = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'), [hasRole])
  const canViewFinancials = useCallback(() => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE'), [hasRole])
  const canManageBanners = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER'), [hasRole])
  const canManageContracts = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY'), [hasRole])
  const canManageEmergencyContacts = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER'), [hasRole])
  const canManageMaintenanceBills = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER'), [hasRole])
  const canManageTenants = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'MEMBER'), [hasRole])
  const canManageTickets = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE', 'MANAGER'), [hasRole])
  const canCreateTickets = useCallback(() => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE', 'MEMBER', 'TENANT'), [hasRole])
  const canManageTransactions = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER'), [hasRole])
  const canManageVendors = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER'), [hasRole])
  const canManageVendorBills = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER'), [hasRole])
  const canViewSecurityLogs = useCallback(() => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN'), [hasRole])
  const canExportData = useCallback(() => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'), [hasRole])
  const canManageSocieties = useCallback(() => hasRole('MASTER_ADMIN'), [hasRole])
  const canManageUsers = useCallback(() => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'EMPLOYEE', 'MEMBER'), [hasRole])
  const canManageFlats = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'), [hasRole])
  const canManageWings = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER'), [hasRole])
  const canManageVehicles = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'), [hasRole])
  const canRaiseComplaints = useCallback(() => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE', 'MEMBER', 'TENANT'), [hasRole])
  const canManageComplaints = useCallback(() => hasRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'), [hasRole])
  const canManageOrganizations = useCallback(() => hasRole('MASTER_ADMIN'), [hasRole])
  const canViewReports = useCallback(() => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'), [hasRole])

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    updateUser,
    hasRole,
    isPlatformOwner,
    isMasterAdmin,
    isOrganizationOwner,
    isSocietyAdmin,
    isChairman,
    isSecretary,
    isTreasurer,
    isCommittee,
    isManager,
    isEmployee,
    isMember,
    isTenant,
    isVendor,
    isVisitor,
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
    canManageFlats,
    canManageWings,
    canManageVehicles,
    canRaiseComplaints,
    canManageComplaints,
    canManageOrganizations,
    canViewReports,
  }), [user, loading, login, logout, updateUser, hasRole,
    isPlatformOwner, isMasterAdmin, isOrganizationOwner, isSocietyAdmin, isChairman,
    isSecretary, isTreasurer, isCommittee, isManager, isEmployee, isMember,
    isTenant, isVendor, isVisitor, isAdminLevel, isCommitteeLevel,
    canManageNotices, canManageDocuments, canViewFinancials, canManageBanners,
    canManageContracts, canManageEmergencyContacts, canManageMaintenanceBills,
    canManageTenants, canManageTickets, canCreateTickets, canManageTransactions,
    canManageVendors, canManageVendorBills, canViewSecurityLogs, canExportData,
    canManageSocieties, canManageUsers, canManageFlats, canManageWings,
    canManageVehicles, canRaiseComplaints, canManageComplaints, canManageOrganizations,
    canViewReports])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
