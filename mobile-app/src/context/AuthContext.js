import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS, USER_ROLES } from '../constants';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for stored authentication on app start
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      const storedUser = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        
        // Optionally verify token with backend
        try {
          const response = await authAPI.verifyToken();
          if (response.data) {
            setUser(response.data.user || JSON.parse(storedUser));
          }
        } catch (error) {
          // Token invalid, clear storage
          if (error.response?.status === 401) {
            await logout();
          }
        }
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(email, password);
      const { token: authToken, user: userData } = response.data;

      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, authToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (phone) => {
    try {
      const response = await authAPI.sendOTP(phone);
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP.';
      return { success: false, error: message };
    }
  };

  const verifyOTP = async (phone, otp) => {
    try {
      setIsLoading(true);
      const response = await authAPI.verifyOTP(phone, otp);
      const { token: authToken, user: userData } = response.data;

      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, authToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed.';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout API if needed
      try {
        await authAPI.logout();
      } catch (error) {
        // Continue with local logout even if API fails
      }

      // Clear stored data
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);

      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData) => {
    try {
      const updatedUser = { ...user, ...userData };
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update user data.' };
    }
  };

  const refreshToken = async () => {
    try {
      const storedRefreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken(storedRefreshToken);
      const { token: newToken, refreshToken: newRefreshToken } = response.data;

      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, newToken);
      if (newRefreshToken) {
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
      }

      setToken(newToken);
      return { success: true, token: newToken };
    } catch (error) {
      await logout();
      return { success: false, error: 'Session expired. Please login again.' };
    }
  };

  // Role-based helpers
  const isPlatformOwner = user?.role === USER_ROLES.PLATFORM_OWNER;
  const isOrganizationOwner = user?.role === USER_ROLES.ORGANIZATION_OWNER;
  const isSocietyAdmin = user?.role === USER_ROLES.SOCIETY_ADMIN;
  const isAdmin = [USER_ROLES.PLATFORM_OWNER, USER_ROLES.ORGANIZATION_OWNER, USER_ROLES.SOCIETY_ADMIN].includes(user?.role);
  const isCommitteeLevel = [USER_ROLES.CHAIRMAN, USER_ROLES.SECRETARY, USER_ROLES.TREASURER, USER_ROLES.COMMITTEE].includes(user?.role);
  const isManager = user?.role === USER_ROLES.MANAGER;
  const isMember = user?.role === USER_ROLES.MEMBER;
  const isStaff = [USER_ROLES.EMPLOYEE, USER_ROLES.MANAGER].includes(user?.role);
  const isTenant = user?.role === USER_ROLES.TENANT;
  const isVisitor = user?.role === USER_ROLES.VISITOR;

  const hasRole = useCallback((roles) => {
    if (!user?.role) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  }, [user?.role]);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    sendOTP,
    verifyOTP,
    logout,
    updateUser,
    refreshToken,
    // Role helpers
    isPlatformOwner,
    isOrganizationOwner,
    isSocietyAdmin,
    isAdmin,
    isCommitteeLevel,
    isManager,
    isMember,
    isStaff,
    isTenant,
    isVisitor,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
