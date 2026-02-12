import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
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

  const value = {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isManual,
    toggleTheme,
    setTheme,
    resetToSystemTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
