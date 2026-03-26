import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '../../../api'
import { getErrorMessage } from '../utils'

const AuthContext = createContext(null)

const LOCATION_REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const LAST_KNOWN_LOCATION_STORAGE_KEY = 'auth.lastKnownLocation'

const isFiniteCoordinate = (value) => Number.isFinite(value)

const isValidLocation = (location) => (
  location &&
  isFiniteCoordinate(location.latitude) &&
  isFiniteCoordinate(location.longitude)
)

const readLastKnownLocation = () => {
  try {
    const raw = localStorage.getItem(LAST_KNOWN_LOCATION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidLocation(parsed) ? parsed : null
  } catch {
    return null
  }
}

const persistLastKnownLocation = (location) => {
  if (!isValidLocation(location)) return
  try {
    localStorage.setItem(LAST_KNOWN_LOCATION_STORAGE_KEY, JSON.stringify(location))
  } catch {
    // Ignore storage failures (private mode/quota)
  }
}

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
    } catch {
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
    } catch {
      // Ignore parse errors
    }
    return true // no cached user, must wait for auth check
  })
  const authChecked = useRef(false)
  const locationIntervalRef = useRef(null)
  const lastKnownLocationRef = useRef(readLastKnownLocation())

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return Promise.resolve(null)
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          lastKnownLocationRef.current = currentLocation
          persistLastKnownLocation(currentLocation)
          resolve({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          })
        },
        () => resolve(null),
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 120000,
        },
      )
    })
  }, [])

  const startLocationRefresh = useCallback((role) => {
    if (role !== 'SOCIETY_ADMIN') return
    // Clear any existing interval
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current)
    locationIntervalRef.current = setInterval(async () => {
      const loc = await getCurrentLocation()
      if (loc) {
        authApi.updateCurrentLocation(loc.latitude, loc.longitude).catch(() => {})
      }
    }, LOCATION_REFRESH_INTERVAL_MS)
  }, [getCurrentLocation])

  const stopLocationRefresh = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current)
      locationIntervalRef.current = null
    }
  }, [])

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
              prevUser.societyId === userData.societyId &&
              prevUser.flatId === userData.flatId &&
              prevUser.currentLoginAt === userData.currentLoginAt &&
              prevUser.currentLoginUserAgent === userData.currentLoginUserAgent &&
              prevUser.previousLoginAt === userData.previousLoginAt &&
              prevUser.previousLoginUserAgent === userData.previousLoginUserAgent

            return isSameUser ? prevUser : userData
          })
          localStorage.setItem('user', JSON.stringify(userData))
          // Resume location refresh if SOCIETY_ADMIN is already logged in
          startLocationRefresh(userData.role)
        } catch (error) {
          // Clear stale cached auth only when backend explicitly rejects the token.
          const status = error?.response?.status
          if (status === 401 || status === 403) {
            stopLocationRefresh()
            setUser(null)
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            queryClient.clear()
          }
        }
      }
      // Only update loading if it was true (avoids unnecessary re-render when cached user exists)
      setLoading((prev) => prev ? false : prev)
    }
    
    checkAuth()
    return () => stopLocationRefresh()
  }, [startLocationRefresh, stopLocationRefresh])

  const login = useCallback(async (email, password, { portalType, rememberMe, latitude, longitude } = {}) => {
    try {
      const response = await authApi.login({ email, password, portalType, rememberMe, latitude, longitude })
      const providedLocation = {
        latitude: Number(latitude),
        longitude: Number(longitude),
      }
      if (isValidLocation(providedLocation)) {
        lastKnownLocationRef.current = providedLocation
        persistLastKnownLocation(providedLocation)
      }

      const {
        token,
        id,
        name,
        email: userEmail,
        role,
        accountType,
        societyId,
        flatId,
        currentLoginAt,
        currentLoginUserAgent,
        previousLoginAt,
        previousLoginUserAgent,
      } = response.data

      const userData = {
        id,
        name,
        email: userEmail,
        role,
        accountType,
        societyId,
        flatId,
        currentLoginAt: currentLoginAt || null,
        currentLoginUserAgent: currentLoginUserAgent || '',
        previousLoginAt: previousLoginAt || null,
        previousLoginUserAgent: previousLoginUserAgent || '',
      }

      if (currentLoginAt) {
        localStorage.setItem('currentLoginAt', currentLoginAt)
      }
      if (previousLoginAt) {
        localStorage.setItem('previousLoginAt', previousLoginAt)
      }
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      startLocationRefresh(role)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: getErrorMessage(error, 'Sign-in could not be completed right now.')
      }
    }
  }, [startLocationRefresh])

  const logout = useCallback(async () => {
    const role = user?.role
    const location = await getCurrentLocation()

    // Hard guard: Society Admin must have live location enabled to logout.
    if (role === 'SOCIETY_ADMIN' && !location) {
      return {
        success: false,
        error: 'Enable location services and allow GPS access to complete logout.',
      }
    }

    const fallbackLocation = lastKnownLocationRef.current || readLastKnownLocation()
    const logoutLocation = location || fallbackLocation || undefined
    stopLocationRefresh()
    setUser(null)
    queryClient.clear()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    authApi.logout(logoutLocation).catch(() => {})

    return { success: true }
  }, [getCurrentLocation, stopLocationRefresh, queryClient, user?.role])

  const hasRole = useCallback((...roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }, [user])

  const hasPermissionRole = useCallback((...roles) => {
    if (!user) return false
    if (user.role === 'MASTER_ADMIN') return true
    return roles.includes(user.role)
  }, [user])

  const isPlatformOwner = useCallback(() => hasRole('MASTER_ADMIN'), [hasRole])
  const isMasterAdmin = useCallback(() => hasRole('MASTER_ADMIN'), [hasRole])
  const isOrganizationOwner = useCallback(() => false, []) // Deprecated: removed
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
  
  const isAdminLevel = useCallback(() => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'MANAGER'), [hasRole])
  const isCommitteeLevel = useCallback(() => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'), [hasRole])
  
  const canManageNotices = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN', 'SECRETARY', 'TREASURER'), [hasPermissionRole])
  const canManageDocuments = useCallback(() => hasPermissionRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'), [hasPermissionRole])
  const canViewFinancials = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE'), [hasPermissionRole])
  const canManageContracts = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN', 'SECRETARY'), [hasPermissionRole])
  const canManageEmergencyContacts = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN', 'SECRETARY'), [hasPermissionRole])
  const canManageMaintenanceBills = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN', 'SECRETARY', 'TREASURER'), [hasPermissionRole])
  const canManageTenants = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MEMBER'), [hasPermissionRole])
  const canManageTickets = useCallback(() => hasPermissionRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER'), [hasPermissionRole])
  const canCreateTickets = useCallback(() => hasPermissionRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'MEMBER', 'TENANT'), [hasPermissionRole])
  const canManageTransactions = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN', 'SECRETARY', 'TREASURER'), [hasPermissionRole])
  const canManageVendors = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'MANAGER'), [hasPermissionRole])
  const canManageVendorBills = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN', 'SECRETARY', 'TREASURER'), [hasPermissionRole])
  const canViewSecurityLogs = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN'), [hasPermissionRole])
  const canExportData = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'), [hasPermissionRole])
  const canManageSocieties = useCallback(() => hasPermissionRole(), [hasPermissionRole])
  const canManageUsers = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MEMBER'), [hasPermissionRole])
  const canManageFlats = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE'), [hasPermissionRole])
  const canManageWings = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN', 'SECRETARY'), [hasPermissionRole])
  const canManageVehicles = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'MANAGER', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE'), [hasPermissionRole])
  const canRaiseComplaints = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'MEMBER', 'TENANT'), [hasPermissionRole])
  const canManageComplaints = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'), [hasPermissionRole])
  const canManageOrganizations = useCallback(() => hasPermissionRole(), [hasPermissionRole])
  const canViewReports = useCallback(() => hasPermissionRole('SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'), [hasPermissionRole])

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
    canManageNotices, canManageDocuments, canViewFinancials,
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
