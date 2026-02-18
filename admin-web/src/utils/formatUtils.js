/**
 * Shared format utilities for the admin web app.
 * Provides role display names, currency formatting, date formatting, etc.
 */

// ── Role Display Helpers ──────────────────────────────────────────────

/** Ordered list of all 12 roles (hierarchy order, Level 0 → Level 6) */
export const ALL_ROLES = [
  'MASTER_ADMIN',
  'SOCIETY_ADMIN',
  'CHAIRMAN',
  'SECRETARY',
  'TREASURER',
  'COMMITTEE',
  'MANAGER',
  'EMPLOYEE',
  'MEMBER',
  'TENANT',
  'VENDOR',
  'VISITOR',
]

/** Human-readable display names for each role */
export const ROLE_LABELS = {
  MASTER_ADMIN: 'Master Admin',
  SOCIETY_ADMIN: 'Society Admin',
  CHAIRMAN: 'Chairman',
  SECRETARY: 'Secretary',
  TREASURER: 'Treasurer',
  COMMITTEE: 'Committee',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
  MEMBER: 'Member',
  TENANT: 'Tenant',
  VENDOR: 'Vendor',
  VISITOR: 'Visitor',
}

/** Role hierarchy levels (lower = higher authority) */
export const ROLE_LEVELS = {
  MASTER_ADMIN: 0,
  SOCIETY_ADMIN: 1,
  CHAIRMAN: 2,
  SECRETARY: 2,
  TREASURER: 2,
  COMMITTEE: 3,
  MANAGER: 3,
  EMPLOYEE: 4,
  MEMBER: 4,
  TENANT: 5,
  VENDOR: 5,
  VISITOR: 6,
}

/**
 * Get human-readable display name for a role.
 * @param {string} role - Role enum string (e.g. 'MASTER_ADMIN')
 * @returns {string} Display name (e.g. 'Master Admin')
 */
export function formatRole(role) {
  return ROLE_LABELS[role] || role?.replace(/_/g, ' ') || 'Unknown'
}

/**
 * Check if roleA outranks roleB in the hierarchy.
 * @param {string} roleA
 * @param {string} roleB
 * @returns {boolean}
 */
export function outranks(roleA, roleB) {
  const levelA = ROLE_LEVELS[roleA] ?? 99
  const levelB = ROLE_LEVELS[roleB] ?? 99
  return levelA < levelB
}

// ── Currency Formatting ───────────────────────────────────────────────

const INR_FORMAT = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/**
 * Format a number as Indian Rupees (₹).
 * @param {number|string} amount
 * @returns {string} e.g. '₹1,23,456.78'
 */
export function formatCurrency(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (num == null || isNaN(num)) return '₹0'
  return INR_FORMAT.format(num)
}

/**
 * Format a number with Indian number grouping (no currency symbol).
 * @param {number|string} value
 * @returns {string} e.g. '1,23,456'
 */
export function formatNumber(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (num == null || isNaN(num)) return '0'
  return new Intl.NumberFormat('en-IN').format(num)
}

// ── Date / Time Formatting ────────────────────────────────────────────

/**
 * Format a date string or Date object to a readable format.
 * @param {string|Date} date
 * @param {'short'|'medium'|'long'} style
 * @returns {string}
 */
export function formatDate(date, style = 'medium') {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'

  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
  }

  return d.toLocaleDateString('en-IN', options[style] || options.medium)
}

/**
 * Format a date string or Date object to date + time.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get relative time string (e.g. "2 hours ago", "3 days ago").
 * @param {string|Date} date
 * @returns {string}
 */
export function timeAgo(date) {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'

  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

// ── String Utilities ──────────────────────────────────────────────────

/**
 * Truncate a string to a maximum length, appending '…' if truncated.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(str, maxLen = 50) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert enum-style string to title case (e.g. 'SOME_VALUE' → 'Some Value').
 * @param {string} str
 * @returns {string}
 */
export function enumToTitle(str) {
  if (!str) return ''
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// ── Phone Formatting ──────────────────────────────────────────────────

/**
 * Format an Indian phone number for display.
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  if (!phone) return '-'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }
  return phone
}
