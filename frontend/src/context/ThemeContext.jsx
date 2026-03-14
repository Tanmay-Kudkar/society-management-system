import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

const ThemeContext = createContext()
const THEME_STORAGE_KEY = 'theme'
const LEGACY_THEME_STORAGE_KEY = 'societyhub-theme'

const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [isManual, setIsManual] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') return true
    if (savedTheme === 'system') return false

    const legacyTheme = localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
    return legacyTheme === 'dark' || legacyTheme === 'light'
  })

  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme
    if (savedTheme === 'system') return getSystemTheme()

    const legacyTheme = localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
    if (legacyTheme === 'dark' || legacyTheme === 'light') {
      localStorage.setItem(THEME_STORAGE_KEY, legacyTheme)
      return legacyTheme
    }

    return getSystemTheme()
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

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0d1117' : '#ffffff')
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setThemeState(newTheme)
    setIsManual(true)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
  }, [theme])

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'system') {
      localStorage.setItem(THEME_STORAGE_KEY, 'system')
      localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
      setIsManual(false)
      setThemeState(getSystemTheme())
      return
    }

    setThemeState(newTheme)
    setIsManual(true)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
  }, [])

  const resetToSystemTheme = useCallback(() => {
    localStorage.setItem(THEME_STORAGE_KEY, 'system')
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
    setIsManual(false)
    setThemeState(getSystemTheme())
  }, [])

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isManual,
    toggleTheme,
    setTheme,
    resetToSystemTheme,
  }), [theme, isManual, toggleTheme, setTheme, resetToSystemTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
