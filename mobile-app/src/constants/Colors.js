// Color palette for the Society Management App
export const Colors = {
  // Primary colors
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  
  // Secondary colors
  secondary: '#10B981',
  secondaryLight: '#34D399',
  secondaryDark: '#059669',
  
  // Accent colors
  accent: '#F59E0B',
  accentLight: '#FBBF24',
  accentDark: '#D97706',
  
  // Status colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Light theme
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    border: '#E2E8F0',
    divider: '#F1F5F9',
    placeholder: '#94A3B8',
    disabled: '#CBD5E1',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Dark theme
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    card: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    border: '#334155',
    divider: '#1E293B',
    placeholder: '#64748B',
    disabled: '#475569',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

// Light theme
export const LightTheme = {
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  primaryDark: Colors.primaryDark,
  secondary: Colors.secondary,
  secondaryDark: Colors.secondaryDark,
  accent: Colors.accent,
  success: Colors.success,
  warning: Colors.warning,
  error: Colors.error,
  info: Colors.info,
  background: Colors.light.background,
  surface: Colors.light.surface,
  card: Colors.light.card,
  text: Colors.light.text,
  textSecondary: Colors.light.textSecondary,
  textTertiary: Colors.light.textTertiary,
  border: Colors.light.border,
  divider: Colors.light.divider,
  placeholder: Colors.light.placeholder,
  disabled: Colors.light.disabled,
  overlay: Colors.light.overlay,
  white: Colors.white,
  black: Colors.black,
};

// Dark theme
export const DarkTheme = {
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  primaryDark: Colors.primaryDark,
  secondary: Colors.secondary,
  secondaryDark: Colors.secondaryDark,
  accent: Colors.accent,
  success: Colors.success,
  warning: Colors.warning,
  error: Colors.error,
  info: Colors.info,
  background: Colors.dark.background,
  surface: Colors.dark.surface,
  card: Colors.dark.card,
  text: Colors.dark.text,
  textSecondary: Colors.dark.textSecondary,
  textTertiary: Colors.dark.textTertiary,
  border: Colors.dark.border,
  divider: Colors.dark.divider,
  placeholder: Colors.dark.placeholder,
  disabled: Colors.dark.disabled,
  overlay: Colors.dark.overlay,
  white: Colors.white,
  black: Colors.black,
};

export default Colors;
