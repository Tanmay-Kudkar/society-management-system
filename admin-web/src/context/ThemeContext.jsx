import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

// Accent color definitions
export const ACCENT_COLORS = {
  purple: {
    name: 'Purple',
    primary: '#a855f7',
    secondary: '#ec4899',
    css: {
      '--accent-primary': '#a855f7',
      '--accent-secondary': '#ec4899',
      '--accent-gradient-from': '#a855f7',
      '--accent-gradient-via': '#ec4899',
      '--accent-gradient-to': '#f97316',
    }
  },
  blue: {
    name: 'Blue',
    primary: '#3b82f6',
    secondary: '#06b6d4',
    css: {
      '--accent-primary': '#3b82f6',
      '--accent-secondary': '#06b6d4',
      '--accent-gradient-from': '#3b82f6',
      '--accent-gradient-via': '#06b6d4',
      '--accent-gradient-to': '#14b8a6',
    }
  },
  green: {
    name: 'Green',
    primary: '#22c55e',
    secondary: '#10b981',
    css: {
      '--accent-primary': '#22c55e',
      '--accent-secondary': '#10b981',
      '--accent-gradient-from': '#22c55e',
      '--accent-gradient-via': '#10b981',
      '--accent-gradient-to': '#14b8a6',
    }
  },
  orange: {
    name: 'Orange',
    primary: '#f97316',
    secondary: '#f59e0b',
    css: {
      '--accent-primary': '#f97316',
      '--accent-secondary': '#f59e0b',
      '--accent-gradient-from': '#f97316',
      '--accent-gradient-via': '#f59e0b',
      '--accent-gradient-to': '#eab308',
    }
  },
  red: {
    name: 'Red',
    primary: '#ef4444',
    secondary: '#f43f5e',
    css: {
      '--accent-primary': '#ef4444',
      '--accent-secondary': '#f43f5e',
      '--accent-gradient-from': '#ef4444',
      '--accent-gradient-via': '#f43f5e',
      '--accent-gradient-to': '#ec4899',
    }
  },
  teal: {
    name: 'Teal',
    primary: '#14b8a6',
    secondary: '#06b6d4',
    css: {
      '--accent-primary': '#14b8a6',
      '--accent-secondary': '#06b6d4',
      '--accent-gradient-from': '#14b8a6',
      '--accent-gradient-via': '#06b6d4',
      '--accent-gradient-to': '#3b82f6',
    }
  },
}

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  // Track if user has manually set a preference
  const [isManual, setIsManual] = useState(() => {
    return localStorage.getItem('societyhub-theme') !== null
  })

  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem('societyhub-theme')
    if (savedTheme) return savedTheme
    
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    
    return 'dark'
  })

  // Accent color state
  const [accent, setAccentState] = useState(() => {
    const savedAccent = localStorage.getItem('societyhub-accent')
    return savedAccent && ACCENT_COLORS[savedAccent] ? savedAccent : 'purple'
  })

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      if (!isManual) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [isManual])

  // Apply theme to document (NOT accent - SettingsContext handles that)
  useEffect(() => {
    const root = document.documentElement
    
    // Theme classes
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    
    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff')
    }
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setThemeState(newTheme)
    setIsManual(true)
    localStorage.setItem('societyhub-theme', newTheme)
  }

  const setTheme = (newTheme) => {
    setThemeState(newTheme)
    setIsManual(true)
    localStorage.setItem('societyhub-theme', newTheme)
  }

  const resetToSystemTheme = () => {
    localStorage.removeItem('societyhub-theme')
    setIsManual(false)
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setThemeState(systemTheme)
  }

  const setAccent = (newAccent) => {
    if (ACCENT_COLORS[newAccent]) {
      setAccentState(newAccent)
      localStorage.setItem('societyhub-accent', newAccent)
    }
  }

  const value = {
    // Theme
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isManual,
    toggleTheme,
    setTheme,
    resetToSystemTheme,
    // Accent
    accent,
    accentConfig: ACCENT_COLORS[accent],
    accentColors: ACCENT_COLORS,
    setAccent,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
