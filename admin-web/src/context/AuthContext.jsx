import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api'

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

  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password })
      // Backend returns: { id, name, email, role, societyId, flatId, token, tokenType }
      // Backend also sets HTTP-only cookie with JWT
      const { token, id, name, email: userEmail, role, societyId, flatId } = response.data
      
      const userData = { id, name, email: userEmail, role, societyId, flatId }
      
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

  const isMasterAdmin = () => hasRole('MASTER_ADMIN')
  const isSocietyAdmin = () => hasRole('SOCIETY_ADMIN')
  const isChairman = () => hasRole('CHAIRMAN')
  const isSecretary = () => hasRole('SECRETARY')
  const isTreasurer = () => hasRole('TREASURER')
  const isCommittee = () => hasRole('COMMITTEE')
  const isMember = () => hasRole('MEMBER')
  
  const isAdminLevel = () => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN')
  const isCommitteeLevel = () => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE')
  
  // Permission checks for specific actions
  const canManageNotices = () => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'EMPLOYEE')
  const canManageDocuments = () => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'EMPLOYEE')
  const canViewFinancials = () => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE')

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
    isMasterAdmin,
    isSocietyAdmin,
    isChairman,
    isSecretary,
    isTreasurer,
    isCommittee,
    isMember,
    isAdminLevel,
    isCommitteeLevel,
    canManageNotices,
    canManageDocuments,
    canViewFinancials,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
