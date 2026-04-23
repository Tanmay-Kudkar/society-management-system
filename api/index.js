import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
export const REQUEST_ACTIVITY_EVENT = 'societyhub:request-activity'

const getStoredToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

const clearStoredAuth = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('authStorageMode')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
}

let activeRequestCount = 0
let hasConnectionFailure = false

const emitRequestActivity = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(REQUEST_ACTIVITY_EVENT, {
      detail: { activeRequestCount, hasConnectionFailure },
    })
  )
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for cross-origin requests
})

// Request interceptor to add auth token (fallback for header-based auth)
api.interceptors.request.use(
  (config) => {
    activeRequestCount += 1
    emitRequestActivity()

    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    hasConnectionFailure = false
    activeRequestCount = Math.max(0, activeRequestCount - 1)
    emitRequestActivity()
    return response
  },
  (error) => {
    hasConnectionFailure = !error?.response
    activeRequestCount = Math.max(0, activeRequestCount - 1)
    emitRequestActivity()

    if (error.response?.status === 401) {
      clearStoredAuth()
      // Do NOT use window.location.href in web apps - it bypasses React Router
      // and causes 404 on SPAs. Let the app's auth context/router handle redirects.
      // Mobile apps may need to handle 401 differently in their own interceptor.
    }
    return Promise.reject(error)
  }
)

export default api

// Enquiry API (public – no auth required)
export const enquiryApi = {
  submit: (data) => api.post('/enquiries', data),
}

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: (payload) => api.post('/auth/logout', payload),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  changePassword: (currentPassword, newPassword, specialKey = '') => api.post('/auth/change-password', { currentPassword, newPassword, specialKey }),
  getLoginAuditByUser: (userId) => api.get(`/auth/login-audit/user/${userId}`),
  getLoginAuditBySociety: (societyId) => api.get(`/auth/login-audit/society/${societyId}`),
  deleteLoginAudit: (id, deletePair = false) => api.delete(`/auth/login-audit/${id}`, { params: { deletePair } }),
  updateCurrentLocation: (latitude, longitude) => api.patch('/auth/login-audit/current-location', { latitude, longitude }),
}

// Society API - requires userId for create/update/delete (MASTER_ADMIN)
export const societyApi = {
  getAll: () => api.get('/societies'),
  getById: (id) => api.get(`/societies/${id}`),
  create: (data, userId) => api.post(`/societies?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/societies/${id}?userId=${userId}`, data),
  delete: (id, userId, force = false) =>
    api.delete(`/societies/${id}?userId=${userId}${force ? '&force=true' : ''}`),
}

// User API - No userId needed, backend gets user from JWT token
export const userApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getBySociety: (societyId) => api.get(`/users/society/${societyId}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id, force = false) => api.delete(`/users/${id}${force ? '?force=true' : ''}`),
  getCreatableRoles: () => api.get('/users/creatable-roles'),
  getUpdatableRoles: () => api.get('/users/updatable-roles'),
  // Bulk create users for units without users
  bulkCreateForUnits: (societyId) => api.post(`/users/bulk-create/${societyId}`),
  // Bulk import endpoints
  validateBulkImport: (file, societyId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post('/users/bulk-import/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  processBulkImport: (file, societyId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post('/users/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadImportTemplate: () => api.get('/users/bulk-import/template', {
    responseType: 'blob',
  }),
}

// Flat API
export const flatApi = {
  getAll: (userId) => api.get(`/flats?userId=${userId}`),
  getById: (id) => api.get(`/flats/${id}`),
  getBySociety: (societyId) => api.get(`/flats/society/${societyId}`),
  create: (data, userId) => api.post(`/flats?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/flats/${id}?userId=${userId}`, data),
  delete: (id, userId, force = true) => api.delete(`/flats/${id}?userId=${userId}${force ? '&force=true' : ''}`),
  
  // Bulk import endpoints
  validateBulkImport: (file, societyId, userId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post(`/flats/bulk-import/validate?userId=${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  processBulkImport: (file, societyId, userId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post(`/flats/bulk-import?userId=${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadImportTemplate: (userId) => api.get(`/flats/bulk-import/template?userId=${userId}`, {
    responseType: 'blob',
  }),
}

// Wing API
export const wingApi = {
  getBySociety: (societyId) => api.get(`/api/wings/society/${societyId}`),
  create: (data) => api.post('/api/wings', data),
  delete: (id, force = false) => api.delete(`/api/wings/${id}?force=${force}`),
  syncWithSocietyConfig: (societyId, force = false) => api.post(`/api/wings/society/${societyId}/sync-config?force=${force}`),
}

// Vendor API
export const vendorApi = {
  getAll: () => api.get('/vendors'),
  getById: (id) => api.get(`/vendors/${id}`),
  getBySociety: (societyId) => api.get(`/vendors/society/${societyId}`),
  getCommon: () => api.get('/vendors/common'),
  getByServiceType: (serviceType) => api.get(`/vendors/service-type/${serviceType}`),
  create: (data, userId) => api.post(`/vendors?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/vendors/${id}?userId=${userId}`, data),
  delete: (id, userId, force = true) => api.delete(`/vendors/${id}?userId=${userId}${force ? '&force=true' : ''}`),
  approve: (id, userId) => api.patch(`/vendors/${id}/approve?userId=${userId}`),
  reject: (id, userId) => api.patch(`/vendors/${id}/reject?userId=${userId}`),
  deactivate: (id, userId) => api.patch(`/vendors/${id}/deactivate?userId=${userId}`),
  getPending: (societyId) => api.get(`/vendors/pending${societyId ? `?societyId=${societyId}` : ''}`),
  validateBulkImport: (file, societyId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post('/vendors/bulk-import/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  processBulkImport: (file, societyId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post('/vendors/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadImportTemplate: () => api.get('/vendors/bulk-import/template', {
    responseType: 'blob',
  }),
}

// Vendor Bill API
export const vendorBillApi = {
  getAll: () => api.get('/vendor-bills'),
  getById: (id) => api.get(`/vendor-bills/${id}`),
  getByVendor: (vendorId) => api.get(`/vendor-bills/vendor/${vendorId}`),
  getBySociety: (societyId) => api.get(`/vendor-bills/society/${societyId}`),
  getByStatus: (status) => api.get(`/vendor-bills/status/${status}`),
  getPending: (societyId) => api.get(`/vendor-bills/pending/${societyId}`),
  create: (data, userId) => api.post(`/vendor-bills?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/vendor-bills/${id}?userId=${userId}`, data),
  recordPayment: (id, amount, paymentMode, referenceNumber, receivedByRole, receivedByName, paymentNotes, userId) => 
    api.post(`/vendor-bills/${id}/payment?amount=${amount}&paymentMode=${paymentMode}&referenceNumber=${encodeURIComponent(referenceNumber || '')}&receivedByRole=${encodeURIComponent(receivedByRole || '')}&receivedByName=${encodeURIComponent(receivedByName || '')}&paymentNotes=${encodeURIComponent(paymentNotes || '')}&userId=${userId}`),
  downloadReceiptPdf: (id, userId) =>
    api.get(`/vendor-bills/${id}/receipt/pdf?userId=${userId}`, { responseType: 'blob' }),
  delete: (id, userId, force = true) => api.delete(`/vendor-bills/${id}?userId=${userId}${force ? '&force=true' : ''}`),
}

// Contract API
export const contractApi = {
  getAll: () => api.get('/contracts'),
  getById: (id) => api.get(`/contracts/${id}`),
  getBySociety: (societyId) => api.get(`/contracts/society/${societyId}`),
  getByType: (contractType) => api.get(`/contracts/type/${contractType}`),
  getExpiringSoon: (societyId, days = 30) => api.get(`/contracts/expiring/${societyId}?days=${days}`),
  create: (data, userId) => api.post(`/contracts?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/contracts/${id}?userId=${userId}`, data),
  deactivate: (id, userId) => api.patch(`/contracts/${id}/deactivate?userId=${userId}`),
  delete: (id, userId, force = true) => api.delete(`/contracts/${id}?userId=${userId}${force ? '&force=true' : ''}`),
}

// Maintenance Bill API
export const maintenanceBillApi = {
  getAll: () => api.get('/maintenance-bills'),
  getBySociety: (societyId) => api.get(`/maintenance-bills/society/${societyId}`),
  getById: (id) => api.get(`/maintenance-bills/${id}`),
  getByFlat: (flatId) => api.get(`/maintenance-bills/flat/${flatId}`),
  getByMonth: (month) => api.get(`/maintenance-bills/month/${month}`),
  getByStatus: (status) => api.get(`/maintenance-bills/status/${status}`),
  getPending: () => api.get('/maintenance-bills/pending'),
  create: (data, userId) => api.post(`/maintenance-bills?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/maintenance-bills/${id}?userId=${userId}`, data),
  recordPayment: (id, amount, paymentMode, referenceNumber, userId) => 
    api.post(`/maintenance-bills/${id}/payment?amount=${amount}&paymentMode=${paymentMode}&referenceNumber=${encodeURIComponent(referenceNumber || '')}&userId=${userId}`),
  generateForSociety: (societyId, billMonth, amount, userId, propertyType) => 
    api.post(`/maintenance-bills/generate?societyId=${societyId}&billMonth=${billMonth}&amount=${amount}&userId=${userId}${propertyType ? '&propertyType=' + propertyType : ''}`),
  getGenerationPreview: (societyId, billMonth, propertyType) =>
    api.get(`/maintenance-bills/generate/preview?societyId=${societyId}&billMonth=${billMonth}${propertyType ? '&propertyType=' + propertyType : ''}`),
  downloadInvoicePdf: (id, userId) =>
    api.get(`/maintenance-bills/${id}/invoice/pdf?userId=${userId}`, { responseType: 'blob' }),
  delete: (id, userId, force = true) => api.delete(`/maintenance-bills/${id}?userId=${userId}${force ? '&force=true' : ''}`),
}

// Society Settings API (Phase 2 - F08)
export const societySettingApi = {
  getBySocietyId: (societyId, userId) => api.get(`/society-settings/${societyId}?userId=${userId}`),
  upsertBySocietyId: (societyId, data, userId) => api.put(`/society-settings/${societyId}?userId=${userId}`, data),
}

// Transaction API
export const transactionApi = {
  getAll: () => api.get('/transactions'),
  getById: (id) => api.get(`/transactions/${id}`),
  getBySociety: (societyId) => api.get(`/transactions/society/${societyId}`),
  getByType: (type) => api.get(`/transactions/type/${type}`),
  getByPaymentMode: (mode) => api.get(`/transactions/payment-mode/${mode}`),
  getByDateRange: (societyId, start, end) => api.get(`/transactions/date-range/${societyId}?start=${start}&end=${end}`),
  getSummary: (societyId) => api.get(`/transactions/summary/${societyId}`),
  getSummaryByCategory: (societyId, start, end) => api.get(`/transactions/summary/${societyId}/by-category?start=${start}&end=${end}`),
  create: (data, userId) => api.post(`/transactions?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/transactions/${id}?userId=${userId}`, data),
  delete: (id, userId, force = true) => api.delete(`/transactions/${id}?userId=${userId}${force ? '&force=true' : ''}`),
}

// Notice API
export const noticeApi = {
  getAll: () => api.get('/notices'),
  getById: (id) => api.get(`/notices/${id}`),
  getBySociety: (societyId) => api.get(`/notices/society/${societyId}`),
  getActive: (societyId) => api.get(`/notices/society/${societyId}`),
  create: (data, userId) => api.post(`/notices?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/notices/${id}?userId=${userId}`, data),
  undo: (id, userId) => api.patch(`/notices/${id}/undo?userId=${userId}`),
  delete: (id, userId, force = false) => api.delete(`/notices/${id}?userId=${userId}${force ? '&force=true' : ''}`),
  markAttendance: (id, userId, data) => api.post(`/notices/${id}/attendance?userId=${userId}`, data || {}),
  getMyAttendance: (id, userId) => api.get(`/notices/${id}/attendance/me?userId=${userId}`),
  getAttendanceByNotice: (id, userId) => api.get(`/notices/${id}/attendance?userId=${userId}`),
  exportAttendance: (id, userId, status = 'ALL') => api.get(`/notices/${id}/attendance/export?userId=${userId}&status=${encodeURIComponent(status)}`, { responseType: 'blob' }),
}

// Ticket API
export const ticketApi = {
  getAll: () => api.get('/tickets'),
  getById: (id) => api.get(`/tickets/${id}`),
  getBySociety: (societyId) => api.get(`/tickets/society/${societyId}`),
  getByRaisedBy: (userId) => api.get(`/tickets/raised-by/${userId}`),
  getByAssignedTo: (userId) => api.get(`/tickets/assigned-to/${userId}`),
  getByStatus: (status) => api.get(`/tickets/status/${status}`),
  getOverdue: () => api.get('/tickets/overdue'),
  getOverdueBySociety: (societyId) => api.get(`/tickets/overdue/society/${societyId}`),
  getOverdueCount: () => api.get('/tickets/overdue/count'),
  create: (data, userId) => api.post(`/tickets?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/tickets/${id}?userId=${userId}`, data),
  updateStatus: (id, status, resolution, userId) => {
    let url = `/tickets/${id}/status?status=${status}&userId=${userId}`;
    if (resolution) url += `&resolution=${encodeURIComponent(resolution)}`;
    return api.patch(url);
  },
  reply: (id, message, userId) => api.patch(`/tickets/${id}/reply?message=${encodeURIComponent(message)}&userId=${userId}`),
  getReplies: (id) => api.get(`/tickets/${id}/replies`),
  updateProgress: (id, progress, userId) => api.patch(`/tickets/${id}/progress?progress=${progress}&userId=${userId}`),
  assign: (id, assignedToId, userId) => api.patch(`/tickets/${id}/assign?assignedToId=${assignedToId}&userId=${userId}`),
  delete: (id, userId, force = true) => api.delete(`/tickets/${id}?userId=${userId}${force ? '&force=true' : ''}`),
}

// Complaint API
export const complaintApi = {
  getAll: (userId) => api.get(`/complaints?userId=${userId}`),
  getById: (id) => api.get(`/complaints/${id}`),
  getBySociety: (societyId, userId) => api.get(`/complaints/society/${societyId}?userId=${userId}`),
  getSlaSummary: (societyId, userId) => api.get(`/complaints/society/${societyId}/sla-summary?userId=${userId}`),
  getByUser: (targetUserId, userId) => api.get(`/complaints/user/${targetUserId}?userId=${userId}`),
  getByStatus: (status, userId) => api.get(`/complaints/status/${status}?userId=${userId}`),
  create: (data, userId) => api.post(`/complaints?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/complaints/${id}?userId=${userId}`, data),
  updateStatus: (id, status, resolution, userId) => {
    let url = `/complaints/${id}/status?status=${status}&userId=${userId}`;
    if (resolution) url += `&resolution=${encodeURIComponent(resolution)}`;
    return api.patch(url);
  },
  assign: (id, assignedToUserId, userId) => api.patch(`/complaints/${id}/assign?userId=${userId}`, { assignedToUserId }),
  addRemarks: (id, remarks, userId) => api.patch(`/complaints/${id}/remarks?userId=${userId}`, { remarks }),
  uploadAttachment: (file, societyId, userId, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post(`/complaints/attachments/upload?userId=${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  getComments: (id, userId) => api.get(`/complaints/${id}/comments?userId=${userId}`),
  addComment: (id, message, userId) => api.post(`/complaints/${id}/comments?userId=${userId}`, { message }),
  getHistory: (id, userId) => api.get(`/complaints/${id}/history?userId=${userId}`),
  downloadAttachment: (url) => api.get(url, { responseType: 'blob' }),
  undo: (id, userId) => api.patch(`/complaints/${id}/undo?userId=${userId}`),
  delete: (id, userId, force = false) => api.delete(`/complaints/${id}?userId=${userId}${force ? '&force=true' : ''}`),
}

// Emergency Contact API
export const emergencyContactApi = {
  getAll: () => api.get('/emergency-contacts'),
  getById: (id) => api.get(`/emergency-contacts/${id}`),
  getBySociety: (societyId) => api.get(`/emergency-contacts/society/${societyId}`),
  getByType: (contactType) => api.get(`/emergency-contacts/type/${contactType}`),
  create: (data, userId) => api.post(`/emergency-contacts?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/emergency-contacts/${id}?userId=${userId}`, data),
  deactivate: (id, userId) => api.patch(`/emergency-contacts/${id}/deactivate?userId=${userId}`),
  delete: (id, userId, force = true) => api.delete(`/emergency-contacts/${id}?userId=${userId}${force ? '&force=true' : ''}`),
  validateBulkImport: (file, societyId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post('/emergency-contacts/bulk-import/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  processBulkImport: (file, societyId, userId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post(`/emergency-contacts/bulk-import?userId=${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadImportTemplate: () => api.get('/emergency-contacts/bulk-import/template', {
    responseType: 'blob',
  }),
}

// Document Template API
export const documentTemplateApi = {
  getAll: () => api.get('/document-templates'),
  getById: (id) => api.get(`/document-templates/${id}`),
  getByType: (type) => api.get(`/document-templates/type/${type}`),
  create: (data, userId) => api.post(`/document-templates?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/document-templates/${id}?userId=${userId}`, data),
  deactivate: (id, userId) => api.patch(`/document-templates/${id}/deactivate?userId=${userId}`),
  generate: (id, data) => api.post(`/document-templates/${id}/generate`, data),
  delete: (id, userId, force = true) => api.delete(`/document-templates/${id}?userId=${userId}${force ? '&force=true' : ''}`),
}

// Tenant API
export const tenantApi = {
  getAll: () => api.get('/tenants'),
  getById: (id) => api.get(`/tenants/${id}`),
  getByFlat: (flatId) => api.get(`/tenants/flat/${flatId}`),
  getBySociety: (societyId) => api.get(`/tenants/society/${societyId}`),
  getActive: () => api.get('/tenants/active'),
  create: (data, userId) => api.post(`/tenants?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/tenants/${id}?userId=${userId}`, data),
  activate: (id, userId) => api.patch(`/tenants/${id}/activate?userId=${userId}`),
  deactivate: (id, userId) => api.patch(`/tenants/${id}/deactivate?userId=${userId}`),
  delete: (id, userId, force = true) => api.delete(`/tenants/${id}?userId=${userId}${force ? '&force=true' : ''}`),
  validateBulkImport: (file, societyId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post('/tenants/bulk-import/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  processBulkImport: (file, societyId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post('/tenants/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadImportTemplate: () => api.get('/tenants/bulk-import/template', {
    responseType: 'blob',
  }),
}

// Vehicle API
export const vehicleApi = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  getByFlat: (flatId) => api.get(`/vehicles/flat/${flatId}`),
  getBySociety: (societyId) => api.get(`/vehicles/society/${societyId}`),
  create: (data, userId) => api.post(`/vehicles?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/vehicles/${id}?userId=${userId}`, data),
  delete: (id, userId, force = true) => api.delete(`/vehicles/${id}?userId=${userId}${force ? '&force=true' : ''}`),
  validateBulkImport: (file, societyId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post('/vehicles/bulk-import/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  processBulkImport: (file, societyId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post('/vehicles/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadImportTemplate: () => api.get('/vehicles/bulk-import/template', {
    responseType: 'blob',
  }),
}

// Notification Preferences API
export const notificationPreferenceApi = {
  getByUserId: (userId) => api.get(`/notification-preferences/${userId}`),
  update: (userId, data) => api.put(`/notification-preferences/${userId}`, data),
}

// Payment API (Razorpay Integration)
export const paymentApi = {
  // Create a Razorpay order
  createOrder: (data) => api.post('/api/payments/create-order', data),
  
  // Verify payment after successful checkout
  verifyPayment: (data) => api.post('/api/payments/verify', data),
  
  // Handle payment failure
  handleFailure: (paymentId, errorCode, errorDescription) => 
    api.post(`/api/payments/failure?paymentId=${paymentId}&errorCode=${encodeURIComponent(errorCode || '')}&errorDescription=${encodeURIComponent(errorDescription || '')}`),

  // Mark payment as cancelled when checkout is dismissed
  handleCancel: (paymentId, reason) =>
    api.post(`/api/payments/cancel?paymentId=${paymentId}&reason=${encodeURIComponent(reason || '')}`),

  // Request refund from Razorpay
  requestRefund: (id, userId, data = {}) =>
    api.post(`/api/payments/${id}/request-refund?userId=${userId}`, data),
  
  // Get payment by ID
  getById: (id) => api.get(`/api/payments/${id}`),
  
  // Get payment by Razorpay order ID
  getByOrderId: (orderId) => api.get(`/api/payments/order/${orderId}`),
  
  // Get all payments for a user
  getByUser: (userId) => api.get(`/api/payments/user/${userId}`),
  
  // Get all payments for a society
  getBySociety: (societyId) => api.get(`/api/payments/society/${societyId}`),

  // Get recently deleted payments for a society (undo eligible)
  getDeletedBySociety: (societyId) => api.get(`/api/payments/deleted/society/${societyId}`),
  
  // Get all payments for a maintenance bill
  getByBill: (billId) => api.get(`/api/payments/bill/${billId}`),

  // Soft delete payment and allow undo for 30 minutes
  delete: (id, userId) => api.delete(`/api/payments/${id}?userId=${userId}`),

  // Undo payment deletion within 30 minutes
  undoDelete: (id) => api.post(`/api/payments/${id}/undo-delete`),
}

// Reports API
export const reportApi = {
  getMTD: (societyId) => api.get(`/api/reports/mtd/${societyId}`),
  getYTD: (societyId) => api.get(`/api/reports/ytd/${societyId}`),
  getCustom: (societyId, startDate, endDate) => 
    api.get(`/api/reports/custom/${societyId}?startDate=${startDate}&endDate=${endDate}`),
  getDashboard: (societyId) => api.get(`/api/reports/dashboard/${societyId}`),
  getComparison: (societyId, periodType) => 
    api.get(`/api/reports/comparison/${societyId}?periodType=${periodType}`),
}

// Export API for Excel downloads
export const exportApi = {
  transactions: (societyId, startDate, endDate) => 
    api.get(`/api/export/transactions/${societyId}?startDate=${startDate}&endDate=${endDate}`, { responseType: 'blob' }),
  maintenanceBills: (societyId, month) =>
      api.get(`/api/export/maintenance-bills/${societyId}${month ? `?month=${month}` : ''}`, { responseType: 'blob' }),
  vendorBills: (societyId, startDate, endDate) => {
      const url = startDate && endDate
        ? `/api/export/vendor-bills/${societyId}?startDate=${startDate}&endDate=${endDate}`
        : `/api/export/vendor-bills/${societyId}`;
      return api.get(url, { responseType: 'blob' });
    },
  vendors: (societyId) =>
    api.get(`/api/export/vendors/${societyId}`, { responseType: 'blob' }),
  tickets: (societyId, status) => 
    api.get(`/api/export/tickets/${societyId}${status ? `?status=${status}` : ''}`, { responseType: 'blob' }),
  flats: (societyId) =>
      api.get(`/api/export/flats/${societyId}`, { responseType: 'blob' }),
  paymentsBySociety: (societyId) =>
    api.get(`/api/export/payments/${societyId}`, { responseType: 'blob' }),
  paymentsByUser: (userId) =>
    api.get(`/api/export/payments/user/${userId}`, { responseType: 'blob' }),
  financialReport: (societyId, reportType, startDate, endDate) => {
    let url = `/api/export/financial-report/${societyId}?reportType=${reportType}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    return api.get(url, { responseType: 'blob' });
  },
  allTransactions: (startDate, endDate) => 
    api.get(`/api/export/all-transactions?startDate=${startDate}&endDate=${endDate}`, { responseType: 'blob' }),
  allTickets: (status) => 
    api.get(`/api/export/all-tickets${status ? `?status=${status}` : ''}`, { responseType: 'blob' }),
  allVendors: () =>
    api.get('/api/export/all-vendors', { responseType: 'blob' }),
}

// Visitor API
export const visitorApi = {
  getAll: (userId) => api.get(`/visitors?userId=${userId}`),
  getById: (id, userId) => api.get(`/visitors/${id}?userId=${userId}`),
  getBySociety: (societyId, userId) => api.get(`/visitors/society/${societyId}?userId=${userId}`),
  getTodayArrivals: (societyId, userId) => api.get(`/visitors/society/${societyId}/today?userId=${userId}`),
  getOverstayed: (societyId, userId, thresholdHours = 4) => api.get(`/visitors/society/${societyId}/overstayed?userId=${userId}&thresholdHours=${thresholdHours}`),
  getByDateRange: (societyId, userId, fromDate, toDate) => api.get(`/visitors/society/${societyId}/range?userId=${userId}&fromDate=${fromDate}&toDate=${toDate}`),
  getByFlat: (flatId, userId) => api.get(`/visitors/flat/${flatId}?userId=${userId}`),
  getByStatus: (status, userId) => api.get(`/visitors/status/${status}?userId=${userId}`),
  getByType: (type, userId) => api.get(`/visitors/type/${type}?userId=${userId}`),
  create: (userId, data) => api.post(`/visitors?userId=${userId}`, data),
  checkIn: (id, userId) => api.patch(`/visitors/${id}/check-in?userId=${userId}`),
  checkOut: (id, userId) => api.patch(`/visitors/${id}/check-out?userId=${userId}`),
  generateOtp: (id, userId) => api.post(`/visitors/${id}/otp/generate?userId=${userId}`),
  verifyOtp: (id, userId, otpCode) => api.post(`/visitors/${id}/otp/verify?userId=${userId}&otpCode=${encodeURIComponent(otpCode)}`),
  updateStatus: (id, userId, status) => api.patch(`/visitors/${id}/status?userId=${userId}&status=${status}`),
  delete: (id, userId) => api.delete(`/visitors/${id}?userId=${userId}`),
}

// Penalty & Fine System API
export const penaltyApi = {
  create: (userId, data) => api.post(`/penalties?userId=${userId}`, data),
  update: (id, userId, data) => api.put(`/penalties/${id}?userId=${userId}`, data),
  getById: (id, userId) => api.get(`/penalties/${id}?userId=${userId}`),
  getBySociety: (societyId, userId) => api.get(`/penalties/society/${societyId}?userId=${userId}`),
  getByStatus: (societyId, status, userId) => api.get(`/penalties/society/${societyId}/status/${status}?userId=${userId}`),
  getByPaymentStatus: (societyId, ps, userId) => api.get(`/penalties/society/${societyId}/payment/${ps}?userId=${userId}`),
  getByType: (societyId, type, userId) => api.get(`/penalties/society/${societyId}/type/${type}?userId=${userId}`),
  getByUser: (issuedToId, userId) => api.get(`/penalties/user/${issuedToId}?userId=${userId}`),
  markPaid: (id, userId) => api.patch(`/penalties/${id}/pay?userId=${userId}`),
  waive: (id, userId, reason) => api.patch(`/penalties/${id}/waive?userId=${userId}`, { reason }),
  appeal: (id, userId, notes) => api.patch(`/penalties/${id}/appeal?userId=${userId}`, { notes }),
  getCounts: (societyId, userId) => api.get(`/penalties/society/${societyId}/counts?userId=${userId}`),
  delete: (id, userId) => api.delete(`/penalties/${id}?userId=${userId}`),
}

// Society Rules / Bylaws API
export const societyRuleApi = {
  create: (userId, data) => api.post('/society-rules', data, { headers: { 'X-User-Id': userId } }),
  update: (id, userId, data) => api.put(`/society-rules/${id}`, data, { headers: { 'X-User-Id': userId } }),
  getById: (id, userId) => api.get(`/society-rules/${id}`, { headers: { 'X-User-Id': userId } }),
  getBySociety: (societyId, userId, params = {}) => api.get(`/society-rules/society/${societyId}`, { headers: { 'X-User-Id': userId }, params }),
  publish: (id, userId) => api.patch(`/society-rules/${id}/publish`, {}, { headers: { 'X-User-Id': userId } }),
  archive: (id, userId) => api.patch(`/society-rules/${id}/archive`, {}, { headers: { 'X-User-Id': userId } }),
  approve: (id, userId) => api.patch(`/society-rules/${id}/approve`, {}, { headers: { 'X-User-Id': userId } }),
  getCounts: (societyId, userId) => api.get(`/society-rules/society/${societyId}/counts`, { headers: { 'X-User-Id': userId } }),
  delete: (id, userId) => api.delete(`/society-rules/${id}`, { headers: { 'X-User-Id': userId } }),
}

// Employee API
export const employeeApi = {
  create: (data, userId) => api.post(`/employees?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/employees/${id}?userId=${userId}`, data),
  getById: (id, userId) => api.get(`/employees/${id}?userId=${userId}`),
  getByUserId: (targetUserId, userId) => api.get(`/employees/user/${targetUserId}?userId=${userId}`),
  getBySociety: (societyId, userId, params = {}) => api.get(`/employees/society/${societyId}?userId=${userId}`, { params }),
  getCounts: (societyId, userId) => api.get(`/employees/society/${societyId}/counts?userId=${userId}`),
  deactivate: (id, userId) => api.patch(`/employees/${id}/deactivate?userId=${userId}`),
  delete: (id, userId) => api.delete(`/employees/${id}?userId=${userId}`),
  recordAdvance: (id, amount, userId) => api.patch(`/employees/${id}/advance/record?amount=${amount}&userId=${userId}`),
  deductAdvance: (id, amount, userId) => api.patch(`/employees/${id}/advance/deduct?amount=${amount}&userId=${userId}`),
  updateIdProofMetadata: (id, data, userId) => api.put(`/employees/${id}/id-proof/metadata?userId=${userId}`, data),
  getIdProofMetadata: (id, userId) => api.get(`/employees/${id}/id-proof/metadata?userId=${userId}`),
  uploadIdProofDocument: (id, file, userId, idProofType, idProofNumber) => {
    const formData = new FormData();
    formData.append('file', file);
    if (idProofType) formData.append('idProofType', idProofType);
    if (idProofNumber) formData.append('idProofNumber', idProofNumber);
    return api.post(`/employees/${id}/id-proof/upload?userId=${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadIdProofDocument: (id, userId) => api.get(`/employees/${id}/id-proof/file?userId=${userId}`, { responseType: 'blob' }),
}

// Employee Attendance API
export const attendanceApi = {
  markAttendance: (employeeId, data, userId) => api.post(`/employee-attendance/employee/${employeeId}?userId=${userId}`, data),
  getBySociety: (societyId, userId, params = {}) => api.get(`/employee-attendance/society/${societyId}?userId=${userId}`, { params }),
  getByEmployee: (employeeId, userId, params = {}) => api.get(`/employee-attendance/employee/${employeeId}?userId=${userId}`, { params }),
  getSummary: (societyId, userId, params = {}) => api.get(`/employee-attendance/society/${societyId}/summary?userId=${userId}`, { params }),
}

// Employee Salary Payment API
export const employeeSalaryPaymentApi = {
  recordPayment: (employeeId, data, userId) => api.post(`/employee-salary-payments/employee/${employeeId}?userId=${userId}`, data),
  getBySociety: (societyId, userId, params = {}) => api.get(`/employee-salary-payments/society/${societyId}?userId=${userId}`, { params }),
  getByEmployee: (employeeId, userId, params = {}) => api.get(`/employee-salary-payments/employee/${employeeId}?userId=${userId}`, { params }),
}

// Helper function to download blob as file
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}


