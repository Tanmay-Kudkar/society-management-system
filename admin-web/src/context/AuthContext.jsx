import { createContext, useContext, useState, useEffect } from 'react'
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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user on mount
    try {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      
      if (storedUser && storedUser !== 'undefined' && token) {
        setUser(JSON.parse(storedUser))
      } else {
        // Clear invalid data
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    } catch (error) {
      console.error('Error parsing stored user:', error)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password })
      // Backend returns: { id, name, email, role, token, tokenType }
      const { token, id, name, email: userEmail, role } = response.data
      
      const userData = { id, name, email: userEmail, role }
      
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
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
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
  
  const isAdminLevel = () => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN')
  const isCommitteeLevel = () => hasRole('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE')

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
    isAdminLevel,
    isCommitteeLevel,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
