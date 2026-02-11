import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext(null)

// Accent color configurations with CSS variables for global theming
export const ACCENT_COLORS = {
  purple: {
    name: 'Purple',
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    cssVars: {
      '--accent-primary': '#8b5cf6',
      '--accent-secondary': '#a78bfa',
      '--accent-light': '#c4b5fd',
      '--accent-gradient-from': '#8b5cf6',
      '--accent-gradient-via': '#a855f7',
      '--accent-gradient-to': '#7c3aed',
    }
  },
  blue: {
    name: 'Blue',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    cssVars: {
      '--accent-primary': '#3b82f6',
      '--accent-secondary': '#60a5fa',
      '--accent-light': '#93c5fd',
      '--accent-gradient-from': '#3b82f6',
      '--accent-gradient-via': '#2563eb',
      '--accent-gradient-to': '#1d4ed8',
    }
  },
  indigo: {
    name: 'Indigo',
    primary: '#6366f1',
    secondary: '#818cf8',
    cssVars: {
      '--accent-primary': '#6366f1',
      '--accent-secondary': '#818cf8',
      '--accent-light': '#a5b4fc',
      '--accent-gradient-from': '#6366f1',
      '--accent-gradient-via': '#4f46e5',
      '--accent-gradient-to': '#4338ca',
    }
  },
  pink: {
    name: 'Pink',
    primary: '#ec4899',
    secondary: '#f472b6',
    cssVars: {
      '--accent-primary': '#ec4899',
      '--accent-secondary': '#f472b6',
      '--accent-light': '#f9a8d4',
      '--accent-gradient-from': '#ec4899',
      '--accent-gradient-via': '#db2777',
      '--accent-gradient-to': '#be185d',
    }
  },
  green: {
    name: 'Green',
    primary: '#22c55e',
    secondary: '#4ade80',
    cssVars: {
      '--accent-primary': '#22c55e',
      '--accent-secondary': '#4ade80',
      '--accent-light': '#86efac',
      '--accent-gradient-from': '#22c55e',
      '--accent-gradient-via': '#16a34a',
      '--accent-gradient-to': '#15803d',
    }
  },
  orange: {
    name: 'Orange',
    primary: '#f97316',
    secondary: '#fb923c',
    cssVars: {
      '--accent-primary': '#f97316',
      '--accent-secondary': '#fb923c',
      '--accent-light': '#fdba74',
      '--accent-gradient-from': '#f97316',
      '--accent-gradient-via': '#ea580c',
      '--accent-gradient-to': '#c2410c',
    }
  },
  teal: {
    name: 'Teal',
    primary: '#14b8a6',
    secondary: '#2dd4bf',
    cssVars: {
      '--accent-primary': '#14b8a6',
      '--accent-secondary': '#2dd4bf',
      '--accent-light': '#5eead4',
      '--accent-gradient-from': '#14b8a6',
      '--accent-gradient-via': '#0d9488',
      '--accent-gradient-to': '#0f766e',
    }
  },
  red: {
    name: 'Red',
    primary: '#ef4444',
    secondary: '#f87171',
    cssVars: {
      '--accent-primary': '#ef4444',
      '--accent-secondary': '#f87171',
      '--accent-light': '#fca5a5',
      '--accent-gradient-from': '#ef4444',
      '--accent-gradient-via': '#dc2626',
      '--accent-gradient-to': '#b91c1c',
    }
  },
}

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
  const [savedAccentColor, setSavedAccentColor] = useState(() => localStorage.getItem('accentColor') || 'purple')
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

  // Apply accent color CSS variables to document
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor)
    
    // Apply CSS variables for global accent theming
    const colorConfig = ACCENT_COLORS[accentColor]
    if (colorConfig?.cssVars) {
      const root = document.documentElement
      Object.entries(colorConfig.cssVars).forEach(([property, value]) => {
        root.style.setProperty(property, value)
      })
    }
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
