import Colors, { LightTheme, DarkTheme } from './Colors';
import Layout, { scale, verticalScale, moderateScale } from './Layout';

// API Configuration
export const API_CONFIG = {
<<<<<<< HEAD
  BASE_URL: 'http://localhost:8080',
=======
  BASE_URL: 'http://localhost:8080/api',
>>>>>>> Nidhish
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME_MODE: 'theme_mode',
  NOTIFICATION_TOKEN: 'notification_token',
  ONBOARDING_COMPLETE: 'onboarding_complete',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
  STAFF: 'staff',
  SECURITY: 'security',
  MAINTENANCE: 'maintenance',
};

// Complaint Status
export const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  PARTIAL: 'partial',
};

// Visitor Status
export const VISITOR_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  REJECTED: 'rejected',
};

export {
  Colors,
  LightTheme,
  DarkTheme,
  Layout,
  scale,
  verticalScale,
  moderateScale,
};
