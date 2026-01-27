import { createContext, useContext, useState, useEffect, useRef } from 'react'

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
  const [savedTheme, setSavedTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [savedAccentColor, setSavedAccentColor] = useState(() => localStorage.getItem('accentColor') || 'blue')
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
  const [previewAccentColor, setPreviewAccentColor] = useState(null)
  const [previewCompactSidebar, setPreviewCompactSidebar] = useState(null)

  // Computed values (preview if set, otherwise saved)
  const theme = previewTheme !== null ? previewTheme : savedTheme
  const accentColor = previewAccentColor !== null ? previewAccentColor : savedAccentColor
  const compactSidebar = previewCompactSidebar !== null ? previewCompactSidebar : savedCompactSidebar

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    const applyTheme = (isDark) => {
      if (isDark) {
        root.classList.add('dark')
      } else {
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
      // Apply immediately based on current system preference
      applyTheme(mediaQuery.matches)
      
      // Listen for system theme changes
      handleChange = (e) => applyTheme(e.matches)
      mediaQuery.addEventListener('change', handleChange)
    }
    
    // Cleanup function
    return () => {
      if (mediaQuery && handleChange) {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }
  }, [theme])

  // Apply accent color to document
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor)
  }, [accentColor])

  // Preview functions (set temporarily without persisting)
  const setThemePreview = (value) => setPreviewTheme(value)
  const setAccentColorPreview = (value) => setPreviewAccentColor(value)
  const setCompactSidebarPreview = (value) => setPreviewCompactSidebar(value)

  // Clear all previews (reset to saved values)
  const clearPreviews = () => {
    setPreviewTheme(null)
    setPreviewAccentColor(null)
    setPreviewCompactSidebar(null)
  }

  // Update functions that save to localStorage and clear preview
  const updateTheme = (newTheme) => {
    setSavedTheme(newTheme)
    setPreviewTheme(null)
    localStorage.setItem('theme', newTheme)
  }

  const updateAccentColor = (newColor) => {
    setSavedAccentColor(newColor)
    setPreviewAccentColor(null)
    localStorage.setItem('accentColor', newColor)
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
    // Current values (preview or saved)
    theme,
    accentColor,
    compactSidebar,
    notifications,
    // Saved values
    savedTheme,
    savedAccentColor,
    savedCompactSidebar,
    // Preview setters
    setThemePreview,
    setAccentColorPreview,
    setCompactSidebarPreview,
    clearPreviews,
    // Save functions
    updateTheme,
    updateAccentColor,
    updateCompactSidebar,
    updateNotifications,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
