/**
 * Validation utility for forms.
 * This module only contains form validation helpers.
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Phone validation regex (Indian format - 10 digits, optionally with +91)
const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/

// Flat number regex (alphanumeric with optional hyphen/slash)
const FLAT_NUMBER_REGEX = /^[A-Za-z0-9][A-Za-z0-9\-/]*$/

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`
  }
  return null
}

/**
 * Validate email format
 */
export const validateEmail = (email, fieldName = 'Email') => {
  if (!email) return `${fieldName} is required`
  if (!EMAIL_REGEX.test(email)) return `Invalid ${fieldName.toLowerCase()} format`
  return null
}

/**
 * Validate phone number
 */
export const validatePhone = (phone, fieldName = 'Phone number', required = false) => {
  if (!phone) {
    if (required) return `${fieldName} is required`
    return null
  }
  // Remove +91 prefix if present for validation
  const cleanPhone = phone.replace(/^\+91/, '')
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return `Invalid ${fieldName.toLowerCase()} format. Use 10-digit mobile number`
  }
  return null
}

/**
 * Validate password
 */
export const validatePassword = (password, isRequired = true, minLength = 6) => {
  if (!password) {
    if (isRequired) return 'Password is required'
    return null
  }
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`
  }
  return null
}

/**
 * Validate flat number
 */
export const validateFlatNumber = (flatNumber, fieldName = 'Flat number') => {
  if (!flatNumber) return `${fieldName} is required`
  if (!FLAT_NUMBER_REGEX.test(flatNumber)) {
    return `Invalid ${fieldName.toLowerCase()} format. Use alphanumeric characters only`
  }
  return null
}

/**
 * Validate numeric field
 */
export const validateNumber = (value, fieldName, options = {}) => {
  const { required = false, min, max, integer = false } = options
  
  if (!value && value !== 0) {
    if (required) return `${fieldName} is required`
    return null
  }
  
  const num = Number(value)
  if (isNaN(num)) return `${fieldName} must be a number`
  if (integer && !Number.isInteger(num)) return `${fieldName} must be a whole number`
  if (min !== undefined && num < min) return `${fieldName} must be at least ${min}`
  if (max !== undefined && num > max) return `${fieldName} must be at most ${max}`
  
  return null
}

/**
 * User form validation
 */
export const validateUserForm = (data, isEditing = false) => {
  const errors = {}
  
  const nameError = validateRequired(data.name, 'Name')
  if (nameError) errors.name = nameError
  
  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError
  
  if (!isEditing) {
    const passwordError = validatePassword(data.password, true)
    if (passwordError) errors.password = passwordError
  }
  
  const roleError = validateRequired(data.role, 'Role')
  if (roleError) errors.role = roleError
  
  const phoneError = validatePhone(data.phone, 'Phone number', false)
  if (phoneError) errors.phone = phoneError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Society form validation
 */
export const validateSocietyForm = (data) => {
  const errors = {}
  
  const nameError = validateRequired(data.name, 'Society name')
  if (nameError) errors.name = nameError
  
  const addressError = validateRequired(data.address, 'Address')
  if (addressError) errors.address = addressError
  
  const cityError = validateRequired(data.city, 'City')
  if (cityError) errors.city = cityError
  
  const stateError = validateRequired(data.state, 'State')
  if (stateError) errors.state = stateError
  
  const emailError = validateEmail(data.email, 'Society email')
  if (data.email && emailError) errors.email = emailError
  
  const phoneError = validatePhone(data.phone, 'Society phone', false)
  if (phoneError) errors.phone = phoneError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Flat/Unit form validation
 */
export const validateFlatForm = (data) => {
  const errors = {}
  
  const societyError = validateRequired(data.societyId, 'Society')
  if (societyError) errors.societyId = societyError
  
  const flatNumberError = validateFlatNumber(data.flatNumber)
  if (flatNumberError) errors.flatNumber = flatNumberError

  const unitTypeError = validateRequired(data.unitType, 'Unit type')
  if (unitTypeError) errors.unitType = unitTypeError

  const flatTypeError = validateRequired(data.flatType, 'Configuration')
  if (flatTypeError) errors.flatType = flatTypeError

  const floorError = validateNumber(data.floor, 'Floor', { required: true, integer: true, min: 0, max: 200 })
  if (floorError) errors.floor = floorError

  const areaError = validateNumber(data.area, 'Area', { required: true, min: 1 })
  if (areaError) errors.area = areaError
  
  const emailError = data.ownerEmail ? validateEmail(data.ownerEmail, 'Owner email') : null
  if (emailError) errors.ownerEmail = emailError
  
  const phoneError = validatePhone(data.ownerPhone, 'Owner phone', false)
  if (phoneError) errors.ownerPhone = phoneError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Notice form validation
 */
export const validateNoticeForm = (data) => {
  const errors = {}
  
  const societyError = validateRequired(data.societyId, 'Society')
  if (societyError) errors.societyId = societyError
  
  const titleError = validateRequired(data.title, 'Title')
  if (titleError) errors.title = titleError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Document template form validation
 */
export const validateDocumentForm = (data) => {
  const errors = {}
  
  const titleError = validateRequired(data.title, 'Title')
  if (titleError) errors.title = titleError
  
  const typeError = validateRequired(data.templateType, 'Template type')
  if (typeError) errors.templateType = typeError
  
  const contentError = validateRequired(data.content, 'Content')
  if (contentError) errors.content = contentError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}


// Vendor form validation

export const validateVendorForm = (data) => {
  const errors = {}
  
  const nameError = validateRequired(data.name, 'Vendor name')
  if (nameError) errors.name = nameError
  
  const serviceError = validateRequired(data.serviceType, 'Service type')
  if (serviceError) errors.serviceType = serviceError
  
  const phoneError = validatePhone(data.phone, 'Vendor phone', true)
  if (phoneError) errors.phone = phoneError
  
  const emailError = data.email ? validateEmail(data.email, 'Vendor email') : null
  if (emailError) errors.email = emailError
  
  const contactEmailError = data.contactPersonEmail ? validateEmail(data.contactPersonEmail, 'Contact person email') : null
  if (contactEmailError) errors.contactPersonEmail = contactEmailError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}


// Maintenance bill form validation
 
export const validateMaintenanceBillForm = (data) => {
  const errors = {}
  
  const flatError = validateRequired(data.flatId, 'Flat')
  if (flatError) errors.flatId = flatError
  
  const amountError = validateNumber(data.amount, 'Amount', { required: true, min: 0 })
  if (amountError) errors.amount = amountError
  
  const dueDateError = validateRequired(data.dueDate, 'Due date')
  if (dueDateError) errors.dueDate = dueDateError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
export default {
  validateRequired,
  validateEmail,
  validatePhone,
  validatePassword,
  validateFlatNumber,
  validateNumber,
  validateUserForm,
  validateSocietyForm,
  validateFlatForm,
  validateNoticeForm,
  validateDocumentForm,
  validateVendorForm,
  validateMaintenanceBillForm,
}
