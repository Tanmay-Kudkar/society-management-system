import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

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
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
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
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
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
  getAll: () => api.get('/api/wings'),
  getById: (id) => api.get(`/api/wings/${id}`),
  getBySociety: (societyId) => api.get(`/api/wings/society/${societyId}`),
  create: (data) => api.post('/api/wings', data),
  update: (id, data) => api.put(`/api/wings/${id}`, data),
  delete: (id, force = true) => api.delete(`/api/wings/${id}${force ? '?force=true' : ''}`),
  validateBulkImport: (file, societyId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post('/api/wings/bulk-import/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  processBulkImport: (file, societyId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('societyId', societyId);
    return api.post('/api/wings/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadImportTemplate: () => api.get('/api/wings/bulk-import/template', {
    responseType: 'blob',
  }),
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
  recordPayment: (id, amount, paymentMode, referenceNumber, userId) => 
    api.post(`/vendor-bills/${id}/payment?amount=${amount}&paymentMode=${paymentMode}&referenceNumber=${encodeURIComponent(referenceNumber || '')}&userId=${userId}`),
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
  delete: (id, userId, force = true) => api.delete(`/notices/${id}?userId=${userId}${force ? '&force=true' : ''}`),
}

// Security Log API
export const securityLogApi = {
  getRecent: (societyId, limit = 10) => api.get(`/api/security-logs?societyId=${societyId}&limit=${limit}`),
  create: (data) => api.post('/api/security-logs', data),
}

// Banner API
export const bannerApi = {
  getAll: () => api.get('/banners'),
  getById: (id) => api.get(`/banners/${id}`),
  getBySociety: (societyId) => api.get(`/banners/society/${societyId}`),
  getActive: (societyId) => api.get(`/banners/active/${societyId}`),
  create: (data, userId) => api.post(`/banners?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/banners/${id}?userId=${userId}`, data),
  deactivate: (id, userId) => api.patch(`/banners/${id}/deactivate?userId=${userId}`),
  delete: (id, userId, force = true) => api.delete(`/banners/${id}?userId=${userId}${force ? '&force=true' : ''}`),
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
  updateProgress: (id, progress, userId) => api.patch(`/tickets/${id}/progress?progress=${progress}&userId=${userId}`),
  assign: (id, assignedToId, userId) => api.patch(`/tickets/${id}/assign?assignedToId=${assignedToId}&userId=${userId}`),
  delete: (id, userId, force = true) => api.delete(`/tickets/${id}?userId=${userId}${force ? '&force=true' : ''}`),
}

// Complaint API
export const complaintApi = {
  getAll: (userId) => api.get(`/complaints?userId=${userId}`),
  getById: (id) => api.get(`/complaints/${id}`),
  getBySociety: (societyId, userId) => api.get(`/complaints/society/${societyId}?userId=${userId}`),
  getByUser: (targetUserId, userId) => api.get(`/complaints/user/${targetUserId}?userId=${userId}`),
  getByStatus: (status, userId) => api.get(`/complaints/status/${status}?userId=${userId}`),
  create: (data, userId) => api.post(`/complaints?userId=${userId}`, data),
  updateStatus: (id, status, resolution, userId) => {
    let url = `/complaints/${id}/status?status=${status}&userId=${userId}`;
    if (resolution) url += `&resolution=${encodeURIComponent(resolution)}`;
    return api.patch(url);
  },
  delete: (id, userId, force = true) => api.delete(`/complaints/${id}?userId=${userId}${force ? '&force=true' : ''}`),
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
  getActive: () => api.get('/tenants/active'),
  create: (data, userId) => api.post(`/tenants?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/tenants/${id}?userId=${userId}`, data),
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
  
  // Get payment by ID
  getById: (id) => api.get(`/api/payments/${id}`),
  
  // Get payment by Razorpay order ID
  getByOrderId: (orderId) => api.get(`/api/payments/order/${orderId}`),
  
  // Get all payments for a user
  getByUser: (userId) => api.get(`/api/payments/user/${userId}`),
  
  // Get all payments for a society
  getBySociety: (societyId) => api.get(`/api/payments/society/${societyId}`),
  
  // Get all payments for a maintenance bill
  getByBill: (billId) => api.get(`/api/payments/bill/${billId}`),
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
    let url = `/api/export/vendor-bills/${societyId}`;
    if (startDate && endDate) url += `?startDate=${startDate}&endDate=${endDate}`;
    return api.get(url, { responseType: 'blob' });
  },
  tickets: (societyId, status) => 
    api.get(`/api/export/tickets/${societyId}${status ? `?status=${status}` : ''}`, { responseType: 'blob' }),
  flats: (societyId) => 
    api.get(`/api/export/flats/${societyId}`, { responseType: 'blob' }),
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

// Domestic Staff API
export const domesticStaffApi = {
  getAll: (userId) => api.get(`/domestic-staff?userId=${userId}`),
  getById: (id, userId) => api.get(`/domestic-staff/${id}?userId=${userId}`),
  getBySociety: (societyId, userId) => api.get(`/domestic-staff/society/${societyId}?userId=${userId}`),
  getActiveBySociety: (societyId, userId) => api.get(`/domestic-staff/society/${societyId}/active?userId=${userId}`),
  getByType: (societyId, type, userId) => api.get(`/domestic-staff/society/${societyId}/type/${type}?userId=${userId}`),
  create: (userId, data) => api.post(`/domestic-staff?userId=${userId}`, data),
  update: (id, userId, data) => api.put(`/domestic-staff/${id}?userId=${userId}`, data),
  toggleStatus: (id, userId) => api.patch(`/domestic-staff/${id}/toggle-status?userId=${userId}`),
  verify: (id, userId) => api.patch(`/domestic-staff/${id}/verify?userId=${userId}`),
  delete: (id, userId) => api.delete(`/domestic-staff/${id}?userId=${userId}`),
  // Attendance
  recordAttendance: (userId, data) => api.post(`/domestic-staff/attendance?userId=${userId}`, data),
  getAttendanceBySociety: (societyId, userId, date) => api.get(`/domestic-staff/attendance/society/${societyId}?userId=${userId}${date ? `&date=${date}` : ''}`),
  getAttendanceByStaff: (staffId, userId, startDate, endDate) => api.get(`/domestic-staff/attendance/staff/${staffId}?userId=${userId}&startDate=${startDate}&endDate=${endDate}`),
  getAttendanceByFlat: (flatId, userId) => api.get(`/domestic-staff/attendance/flat/${flatId}?userId=${userId}`),
  markCheckOut: (attendanceId, userId) => api.patch(`/domestic-staff/attendance/${attendanceId}/check-out?userId=${userId}`),
}

// Safety API (SOS Alerts + Gate Logs)
export const safetyApi = {
  // SOS Alerts
  createAlert: (userId, data) => api.post(`/safety/sos?userId=${userId}`, data),
  getAllAlerts: (userId) => api.get(`/safety/sos?userId=${userId}`),
  getAlertsBySociety: (societyId, userId) => api.get(`/safety/sos/society/${societyId}?userId=${userId}`),
  getAlertsByStatus: (societyId, status, userId) => api.get(`/safety/sos/society/${societyId}/status/${status}?userId=${userId}`),
  getAlertById: (id, userId) => api.get(`/safety/sos/${id}?userId=${userId}`),
  acknowledgeAlert: (id, userId) => api.patch(`/safety/sos/${id}/acknowledge?userId=${userId}`),
  resolveAlert: (id, userId, notes) => api.patch(`/safety/sos/${id}/resolve?userId=${userId}${notes ? `&resolutionNotes=${encodeURIComponent(notes)}` : ''}`),
  markFalseAlarm: (id, userId) => api.patch(`/safety/sos/${id}/false-alarm?userId=${userId}`),
  escalateAlert: (id, userId) => api.patch(`/safety/sos/${id}/escalate?userId=${userId}`),
  getAlertsByPriority: (societyId, priority, userId) => api.get(`/safety/sos/society/${societyId}/priority/${priority}?userId=${userId}`),
  getActiveAlerts: (societyId, userId) => api.get(`/safety/sos/society/${societyId}/active?userId=${userId}`),
  getAlertCounts: (societyId, userId) => api.get(`/safety/sos/society/${societyId}/counts?userId=${userId}`),
  // Gate Logs
  createGateLog: (userId, data) => api.post(`/safety/gate-log?userId=${userId}`, data),
  getGateLogsBySociety: (societyId, userId) => api.get(`/safety/gate-log/society/${societyId}?userId=${userId}`),
  getGateLogsByFlat: (flatId, userId) => api.get(`/safety/gate-log/flat/${flatId}?userId=${userId}`),
  getGateLogsByDateRange: (societyId, userId, start, end) => api.get(`/safety/gate-log/society/${societyId}/range?userId=${userId}&start=${start}&end=${end}`),
  getGateLogsByEntryType: (societyId, entryType, userId) => api.get(`/safety/gate-log/society/${societyId}/type/${entryType}?userId=${userId}`),
  getGateLogsByStatus: (societyId, status, userId) => api.get(`/safety/gate-log/society/${societyId}/status/${status}?userId=${userId}`),
  getGateLogById: (id, userId) => api.get(`/safety/gate-log/${id}?userId=${userId}`),
  markExit: (id, userId) => api.patch(`/safety/gate-log/${id}/exit?userId=${userId}`),
  deleteGateLog: (id, userId) => api.delete(`/safety/gate-log/${id}?userId=${userId}`),
}

// ===================== ASSETS / INVENTORY =====================
export const assetApi = {
  create: (userId, data) => api.post(`/assets?userId=${userId}`, data),
  update: (id, userId, data) => api.put(`/assets/${id}?userId=${userId}`, data),
  getById: (id, userId) => api.get(`/assets/${id}?userId=${userId}`),
  getBySociety: (societyId, userId) => api.get(`/assets/society/${societyId}?userId=${userId}`),
  getByStatus: (societyId, status, userId) => api.get(`/assets/society/${societyId}/status/${status}?userId=${userId}`),
  getByCategory: (societyId, category, userId) => api.get(`/assets/society/${societyId}/category/${category}?userId=${userId}`),
  updateStatus: (id, userId, status) => api.patch(`/assets/${id}/status?userId=${userId}&status=${status}`),
  assign: (id, userId, assignedToId) => api.patch(`/assets/${id}/assign?userId=${userId}&assignedToId=${assignedToId}`),
  unassign: (id, userId) => api.patch(`/assets/${id}/unassign?userId=${userId}`),
  getLowStock: (societyId, userId) => api.get(`/assets/society/${societyId}/low-stock?userId=${userId}`),
  getCounts: (societyId, userId) => api.get(`/assets/society/${societyId}/counts?userId=${userId}`),
  delete: (id, userId) => api.delete(`/assets/${id}?userId=${userId}`),
}

// ===================== WORK ORDERS =====================
export const workOrderApi = {
  create: (userId, data) => api.post(`/work-orders?userId=${userId}`, data),
  getById: (id, userId) => api.get(`/work-orders/${id}?userId=${userId}`),
  getBySociety: (societyId, userId) => api.get(`/work-orders/society/${societyId}?userId=${userId}`),
  getByStatus: (societyId, status, userId) => api.get(`/work-orders/society/${societyId}/status/${status}?userId=${userId}`),
  getByCategory: (societyId, category, userId) => api.get(`/work-orders/society/${societyId}/category/${category}?userId=${userId}`),
  getByPriority: (societyId, priority, userId) => api.get(`/work-orders/society/${societyId}/priority/${priority}?userId=${userId}`),
  getByAssignee: (assigneeId, userId) => api.get(`/work-orders/assignee/${assigneeId}?userId=${userId}`),
  getByRequester: (requesterId, userId) => api.get(`/work-orders/requester/${requesterId}?userId=${userId}`),
  assign: (id, userId, assignedToId) => api.patch(`/work-orders/${id}/assign?userId=${userId}&assignedToId=${assignedToId}`),
  startWork: (id, userId) => api.patch(`/work-orders/${id}/start?userId=${userId}`),
  putOnHold: (id, userId, notes) => api.patch(`/work-orders/${id}/hold?userId=${userId}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`),
  complete: (id, userId, resolutionNotes, actualCost) => api.patch(`/work-orders/${id}/complete?userId=${userId}${resolutionNotes ? `&resolutionNotes=${encodeURIComponent(resolutionNotes)}` : ''}${actualCost ? `&actualCost=${actualCost}` : ''}`),
  cancel: (id, userId, reason) => api.patch(`/work-orders/${id}/cancel?userId=${userId}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`),
  getCounts: (societyId, userId) => api.get(`/work-orders/society/${societyId}/counts?userId=${userId}`),
  delete: (id, userId) => api.delete(`/work-orders/${id}?userId=${userId}`),
}

// ===================== PATROL & DUTY ROSTER =====================
export const patrolApi = {
  // Checkpoints
  createCheckpoint: (userId, data) => api.post(`/patrol/checkpoints?userId=${userId}`, data),
  getCheckpoints: (societyId, userId) => api.get(`/patrol/checkpoints/society/${societyId}?userId=${userId}`),
  updateCheckpoint: (id, userId, data) => api.put(`/patrol/checkpoints/${id}?userId=${userId}`, data),
  deleteCheckpoint: (id, userId) => api.delete(`/patrol/checkpoints/${id}?userId=${userId}`),
  // Patrol Logs
  logPatrol: (userId, data) => api.post(`/patrol/logs?userId=${userId}`, data),
  getPatrolLogs: (societyId, userId) => api.get(`/patrol/logs/society/${societyId}?userId=${userId}`),
  getPatrolLogsByGuard: (guardId, userId) => api.get(`/patrol/logs/guard/${guardId}?userId=${userId}`),
  getPatrolLogsByDateRange: (societyId, userId, start, end) => api.get(`/patrol/logs/society/${societyId}/range?userId=${userId}&start=${start}&end=${end}`),
  // Duty Rosters
  createDutyRoster: (userId, data) => api.post(`/patrol/duty?userId=${userId}`, data),
  getDutyRosterByDate: (societyId, userId, date) => api.get(`/patrol/duty/society/${societyId}?userId=${userId}&date=${date}`),
  getDutyRosterByDateRange: (societyId, userId, start, end) => api.get(`/patrol/duty/society/${societyId}/range?userId=${userId}&start=${start}&end=${end}`),
  checkIn: (id, userId) => api.patch(`/patrol/duty/${id}/check-in?userId=${userId}`),
  checkOut: (id, userId) => api.patch(`/patrol/duty/${id}/check-out?userId=${userId}`),
  markAbsent: (id, userId) => api.patch(`/patrol/duty/${id}/absent?userId=${userId}`),
  markLeave: (id, userId) => api.patch(`/patrol/duty/${id}/leave?userId=${userId}`),
  deleteDutyRoster: (id, userId) => api.delete(`/patrol/duty/${id}?userId=${userId}`),
}

// ===================== APPROVALS =====================
export const approvalApi = {
  // Workflows
  createWorkflow: (userId, data) => api.post(`/approvals/workflows?userId=${userId}`, data),
  getWorkflowById: (id) => api.get(`/approvals/workflows/${id}`),
  getWorkflowsBySociety: (societyId) => api.get(`/approvals/workflows/society/${societyId}`),
  getWorkflowsBySocietyAndType: (societyId, entityType) => api.get(`/approvals/workflows/society/${societyId}/type/${entityType}`),
  updateWorkflow: (id, userId, data) => api.put(`/approvals/workflows/${id}?userId=${userId}`, data),
  deleteWorkflow: (id, userId) => api.delete(`/approvals/workflows/${id}?userId=${userId}`),
  // Approval Requests
  createRequest: (userId, data) => api.post(`/approvals/requests?userId=${userId}`, data),
  getRequestById: (id) => api.get(`/approvals/requests/${id}`),
  getRequestsBySociety: (societyId) => api.get(`/approvals/requests/society/${societyId}`),
  getRequestsByStatus: (societyId, status) => api.get(`/approvals/requests/society/${societyId}/status/${status}`),
  getRequestsByEntityType: (societyId, entityType) => api.get(`/approvals/requests/society/${societyId}/type/${entityType}`),
  getRequestsByUser: (userId) => api.get(`/approvals/requests/user/${userId}`),
  getPendingForApprover: (societyId, userId) => api.get(`/approvals/requests/pending/${societyId}?userId=${userId}`),
  // Actions
  takeAction: (requestId, userId, data) => api.post(`/approvals/requests/${requestId}/action?userId=${userId}`, data),
  cancelRequest: (requestId, userId) => api.post(`/approvals/requests/${requestId}/cancel?userId=${userId}`),
}

// Staff Shifts API
export const staffShiftApi = {
  create: (userId, data) => api.post(`/staff-shifts?userId=${userId}`, data),
  getById: (id, userId) => api.get(`/staff-shifts/${id}?userId=${userId}`),
  getBySociety: (societyId, userId) => api.get(`/staff-shifts/society/${societyId}?userId=${userId}`),
  getByDate: (societyId, date, userId) => api.get(`/staff-shifts/society/${societyId}/date?date=${date}&userId=${userId}`),
  getByStatus: (societyId, status, userId) => api.get(`/staff-shifts/society/${societyId}/status/${status}?userId=${userId}`),
  getByStaff: (staffUserId, userId) => api.get(`/staff-shifts/staff/${staffUserId}?userId=${userId}`),
  getByDateRange: (societyId, start, end, userId) => api.get(`/staff-shifts/society/${societyId}/range?start=${start}&end=${end}&userId=${userId}`),
  checkIn: (id, userId) => api.patch(`/staff-shifts/${id}/check-in?userId=${userId}`),
  checkOut: (id, userId) => api.patch(`/staff-shifts/${id}/check-out?userId=${userId}`),
  markAbsent: (id, userId) => api.patch(`/staff-shifts/${id}/absent?userId=${userId}`),
  getDayCounts: (societyId, date, userId) => api.get(`/staff-shifts/society/${societyId}/day-counts?date=${date}&userId=${userId}`),
  delete: (id, userId) => api.delete(`/staff-shifts/${id}?userId=${userId}`),
}

// Common Area Maintenance Schedule API
export const commonAreaApi = {
  create: (userId, data) => api.post(`/common-areas?userId=${userId}`, data),
  update: (id, userId, data) => api.put(`/common-areas/${id}?userId=${userId}`, data),
  getById: (id, userId) => api.get(`/common-areas/${id}?userId=${userId}`),
  getBySociety: (societyId, userId) => api.get(`/common-areas/society/${societyId}?userId=${userId}`),
  getByStatus: (societyId, status, userId) => api.get(`/common-areas/society/${societyId}/status/${status}?userId=${userId}`),
  getByAreaType: (societyId, areaType, userId) => api.get(`/common-areas/society/${societyId}/area-type/${areaType}?userId=${userId}`),
  getByMaintenanceType: (societyId, maintenanceType, userId) => api.get(`/common-areas/society/${societyId}/maintenance-type/${maintenanceType}?userId=${userId}`),
  getOverdue: (societyId, userId) => api.get(`/common-areas/society/${societyId}/overdue?userId=${userId}`),
  markCompleted: (id, userId) => api.patch(`/common-areas/${id}/complete?userId=${userId}`),
  pause: (id, userId) => api.patch(`/common-areas/${id}/pause?userId=${userId}`),
  resume: (id, userId) => api.patch(`/common-areas/${id}/resume?userId=${userId}`),
  getCounts: (societyId, userId) => api.get(`/common-areas/society/${societyId}/counts?userId=${userId}`),
  delete: (id, userId) => api.delete(`/common-areas/${id}?userId=${userId}`),
}

// Facility / Amenity Booking API
export const facilityBookingApi = {
  create: (userId, data) => api.post(`/facility-bookings?userId=${userId}`, data),
  update: (id, userId, data) => api.put(`/facility-bookings/${id}?userId=${userId}`, data),
  getById: (id, userId) => api.get(`/facility-bookings/${id}?userId=${userId}`),
  getBySociety: (societyId, userId) => api.get(`/facility-bookings/society/${societyId}?userId=${userId}`),
  getByStatus: (societyId, status, userId) => api.get(`/facility-bookings/society/${societyId}/status/${status}?userId=${userId}`),
  getByDate: (societyId, date, userId) => api.get(`/facility-bookings/society/${societyId}/date/${date}?userId=${userId}`),
  getByFacilityType: (societyId, type, userId) => api.get(`/facility-bookings/society/${societyId}/type/${type}?userId=${userId}`),
  getByUser: (bookedById, userId) => api.get(`/facility-bookings/user/${bookedById}?userId=${userId}`),
  getByDateRange: (societyId, startDate, endDate, userId) => api.get(`/facility-bookings/society/${societyId}/range?startDate=${startDate}&endDate=${endDate}&userId=${userId}`),
  approve: (id, userId, adminNotes) => api.patch(`/facility-bookings/${id}/approve?userId=${userId}`, { adminNotes }),
  reject: (id, userId, adminNotes) => api.patch(`/facility-bookings/${id}/reject?userId=${userId}`, { adminNotes }),
  cancel: (id, userId, reason) => api.patch(`/facility-bookings/${id}/cancel?userId=${userId}`, { reason }),
  getCounts: (societyId, userId) => api.get(`/facility-bookings/society/${societyId}/counts?userId=${userId}`),
  delete: (id, userId) => api.delete(`/facility-bookings/${id}?userId=${userId}`),
}

// Renovation NOC API
export const renovationNocApi = {
  create: (userId, data) => api.post(`/renovation-nocs?userId=${userId}`, data),
  update: (id, userId, data) => api.put(`/renovation-nocs/${id}?userId=${userId}`, data),
  getById: (id, userId) => api.get(`/renovation-nocs/${id}?userId=${userId}`),
  getBySociety: (societyId, userId) => api.get(`/renovation-nocs/society/${societyId}?userId=${userId}`),
  getByStatus: (societyId, status, userId) => api.get(`/renovation-nocs/society/${societyId}/status/${status}?userId=${userId}`),
  getByType: (societyId, type, userId) => api.get(`/renovation-nocs/society/${societyId}/type/${type}?userId=${userId}`),
  getByUser: (requestedById, userId) => api.get(`/renovation-nocs/user/${requestedById}?userId=${userId}`),
  approve: (id, userId, adminNotes) => api.patch(`/renovation-nocs/${id}/approve?userId=${userId}`, { adminNotes }),
  reject: (id, userId, reason) => api.patch(`/renovation-nocs/${id}/reject?userId=${userId}`, { reason }),
  markInProgress: (id, userId) => api.patch(`/renovation-nocs/${id}/in-progress?userId=${userId}`),
  markCompleted: (id, userId) => api.patch(`/renovation-nocs/${id}/completed?userId=${userId}`),
  getCounts: (societyId, userId) => api.get(`/renovation-nocs/society/${societyId}/counts?userId=${userId}`),
  delete: (id, userId) => api.delete(`/renovation-nocs/${id}?userId=${userId}`),
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

// Move-In / Move-Out Tracking API
export const moveRecordApi = {
  create: (userId, data) => api.post(`/move-records?userId=${userId}`, data),
  update: (id, userId, data) => api.put(`/move-records/${id}?userId=${userId}`, data),
  getById: (id, userId) => api.get(`/move-records/${id}?userId=${userId}`),
  getBySociety: (societyId, userId) => api.get(`/move-records/society/${societyId}?userId=${userId}`),
  getByType: (societyId, type, userId) => api.get(`/move-records/society/${societyId}/type/${type}?userId=${userId}`),
  getByStatus: (societyId, status, userId) => api.get(`/move-records/society/${societyId}/status/${status}?userId=${userId}`),
  getByDate: (societyId, date, userId) => api.get(`/move-records/society/${societyId}/date/${date}?userId=${userId}`),
  getByUser: (targetUserId, userId) => api.get(`/move-records/user/${targetUserId}?userId=${userId}`),
  markInProgress: (id, userId) => api.patch(`/move-records/${id}/in-progress?userId=${userId}`),
  markCompleted: (id, userId) => api.patch(`/move-records/${id}/completed?userId=${userId}`),
  markCancelled: (id, userId) => api.patch(`/move-records/${id}/cancelled?userId=${userId}`),
  getCounts: (societyId, userId) => api.get(`/move-records/society/${societyId}/counts?userId=${userId}`),
  delete: (id, userId) => api.delete(`/move-records/${id}?userId=${userId}`),
}

// Pet Registration API
export const petRegistrationApi = {
  create: (userId, data) => api.post('/pet-registrations', data, { headers: { 'X-User-Id': userId } }),
  update: (id, userId, data) => api.put(`/pet-registrations/${id}`, data, { headers: { 'X-User-Id': userId } }),
  getById: (id, userId) => api.get(`/pet-registrations/${id}`, { headers: { 'X-User-Id': userId } }),
  getBySociety: (societyId, userId, params = {}) => api.get(`/pet-registrations/society/${societyId}`, { headers: { 'X-User-Id': userId }, params }),
  approve: (id, userId) => api.patch(`/pet-registrations/${id}/approve`, {}, { headers: { 'X-User-Id': userId } }),
  reject: (id, userId, reason) => api.patch(`/pet-registrations/${id}/reject`, { reason }, { headers: { 'X-User-Id': userId } }),
  getCounts: (societyId, userId) => api.get(`/pet-registrations/society/${societyId}/counts`, { headers: { 'X-User-Id': userId } }),
  delete: (id, userId) => api.delete(`/pet-registrations/${id}`, { headers: { 'X-User-Id': userId } }),
}

// Classified / Internal Marketplace API
export const classifiedApi = {
  create: (userId, data) => api.post('/classifieds', data, { headers: { 'X-User-Id': userId } }),
  update: (id, userId, data) => api.put(`/classifieds/${id}`, data, { headers: { 'X-User-Id': userId } }),
  getById: (id, userId) => api.get(`/classifieds/${id}`, { headers: { 'X-User-Id': userId } }),
  getBySociety: (societyId, userId, params = {}) => api.get(`/classifieds/society/${societyId}`, { headers: { 'X-User-Id': userId }, params }),
  markSold: (id, userId) => api.patch(`/classifieds/${id}/sold`, {}, { headers: { 'X-User-Id': userId } }),
  markClosed: (id, userId) => api.patch(`/classifieds/${id}/close`, {}, { headers: { 'X-User-Id': userId } }),
  flag: (id, userId, reason) => api.patch(`/classifieds/${id}/flag`, { reason }, { headers: { 'X-User-Id': userId } }),
  unflag: (id, userId) => api.patch(`/classifieds/${id}/unflag`, {}, { headers: { 'X-User-Id': userId } }),
  getCounts: (societyId, userId) => api.get(`/classifieds/society/${societyId}/counts`, { headers: { 'X-User-Id': userId } }),
  delete: (id, userId) => api.delete(`/classifieds/${id}`, { headers: { 'X-User-Id': userId } }),
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

