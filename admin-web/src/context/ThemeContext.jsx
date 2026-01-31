import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

// Accent color definitions
export const ACCENT_COLORS = {
  purple: {
    name: 'Purple',
    primary: '#a855f7',
    secondary: '#ec4899',
    gradient: 'from-purple-500 via-pink-500 to-orange-400',
    bg: 'bg-purple-500',
    text: 'text-purple-500',
    border: 'border-purple-500',
    hover: 'hover:bg-purple-600',
    ring: 'ring-purple-500',
    lightBg: 'bg-purple-50',
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
    gradient: 'from-blue-500 via-cyan-500 to-teal-400',
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    border: 'border-blue-500',
    hover: 'hover:bg-blue-600',
    ring: 'ring-blue-500',
    lightBg: 'bg-blue-50',
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
    gradient: 'from-green-500 via-emerald-500 to-teal-400',
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-500',
    hover: 'hover:bg-green-600',
    ring: 'ring-green-500',
    lightBg: 'bg-green-50',
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
    gradient: 'from-orange-500 via-amber-500 to-yellow-400',
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    border: 'border-orange-500',
    hover: 'hover:bg-orange-600',
    ring: 'ring-orange-500',
    lightBg: 'bg-orange-50',
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
    gradient: 'from-red-500 via-rose-500 to-pink-400',
    bg: 'bg-red-500',
    text: 'text-red-500',
    border: 'border-red-500',
    hover: 'hover:bg-red-600',
    ring: 'ring-red-500',
    lightBg: 'bg-red-50',
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
    gradient: 'from-teal-500 via-cyan-500 to-blue-400',
    bg: 'bg-teal-500',
    text: 'text-teal-500',
    border: 'border-teal-500',
    hover: 'hover:bg-teal-600',
    ring: 'ring-teal-500',
    lightBg: 'bg-teal-50',
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
