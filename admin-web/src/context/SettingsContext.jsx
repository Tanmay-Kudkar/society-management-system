import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext(null)

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  // Load settings from localStorage (these are the "saved" values)
  const [savedTheme, setSavedTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [savedCompactSidebar, setSavedCompactSidebar] = useState(() => {
    const saved = localStorage.getItem('compactSidebar')
    return saved ? JSON.parse(saved) : false
  })
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notificationPreferences')
    return saved ? JSON.parse(saved) : {
      email_tickets: true,
      email_complaints: true,
      email_payments: true,
      email_contracts: true,
    }
  })

  // Preview values (for live preview before saving)
  const [previewTheme, setPreviewTheme] = useState(null)
  const [previewCompactSidebar, setPreviewCompactSidebar] = useState(null)

  // Computed values (preview if set, otherwise saved)
  const theme = previewTheme !== null ? previewTheme : savedTheme
  const compactSidebar = previewCompactSidebar !== null ? previewCompactSidebar : savedCompactSidebar

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    const applyTheme = (isDark) => {
      if (isDark) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }
    }
    
    let mediaQuery = null
    let handleChange = null
    
    if (theme === 'dark') {
      applyTheme(true)
    } else if (theme === 'light') {
      applyTheme(false)
    } else if (theme === 'system') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mediaQuery.matches)
      handleChange = (e) => applyTheme(e.matches)
      mediaQuery.addEventListener('change', handleChange)
    }
    
    return () => {
      if (mediaQuery && handleChange) {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }
  }, [theme])

  // Preview functions (set temporarily without persisting)
  const setThemePreview = (value) => setPreviewTheme(value)
  const setCompactSidebarPreview = (value) => setPreviewCompactSidebar(value)

  // Clear all previews (reset to saved values)
  const clearPreviews = () => {
    setPreviewTheme(null)
    setPreviewCompactSidebar(null)
  }

  // Update functions that save to localStorage and clear preview
  const updateTheme = (newTheme) => {
    setSavedTheme(newTheme)
    setPreviewTheme(null)
    localStorage.setItem('theme', newTheme)
  }

  const updateCompactSidebar = (value) => {
    setSavedCompactSidebar(value)
    setPreviewCompactSidebar(null)
    localStorage.setItem('compactSidebar', JSON.stringify(value))
  }

  const updateNotifications = (newNotifications) => {
    setNotifications(newNotifications)
    localStorage.setItem('notificationPreferences', JSON.stringify(newNotifications))
  }

  const value = {
    theme,
    compactSidebar,
    notifications,
    savedTheme,
    savedCompactSidebar,
    setThemePreview,
    setCompactSidebarPreview,
    clearPreviews,
    updateTheme,
    updateCompactSidebar,
    updateNotifications,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
