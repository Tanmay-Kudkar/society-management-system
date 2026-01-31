import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LightTheme, DarkTheme, STORAGE_KEYS } from '../constants';

const ThemeContext = createContext();

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(THEME_MODES.SYSTEM);
  const [isLoading, setIsLoading] = useState(true);

  // Determine if dark mode based on theme mode setting
  const isDark = 
    themeMode === THEME_MODES.DARK || 
    (themeMode === THEME_MODES.SYSTEM && systemColorScheme === 'dark');

  const theme = isDark ? DarkTheme : LightTheme;

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync(STORAGE_KEYS.THEME_MODE);
      if (savedTheme && Object.values(THEME_MODES).includes(savedTheme)) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeThemeMode = async (mode) => {
    try {
      setThemeMode(mode);
      await SecureStore.setItemAsync(STORAGE_KEYS.THEME_MODE, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    changeThemeMode(newMode);
  };

  const value = {
    theme,
    isDark,
    themeMode,
    isLoading,
    setThemeMode: changeThemeMode,
    toggleTheme,
    THEME_MODES,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
