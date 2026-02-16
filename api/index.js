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
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

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

// Society API - requires userId for create/update/delete (PLATFORM_OWNER and ORGANIZATION_OWNER)
export const societyApi = {
  getAll: () => api.get('/societies'),
  getById: (id) => api.get(`/societies/${id}`),
  getByOrganizationId: (orgId) => api.get(`/societies/by-organization/${orgId}`),
  create: (data, userId) => api.post(`/societies?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/societies/${id}?userId=${userId}`, data),
  delete: (id, userId, force = false) =>
    api.delete(`/societies/${id}?userId=${userId}${force ? '&force=true' : ''}`),
}

// Organization API - PLATFORM_OWNER and ORGANIZATION_OWNER
export const organizationApi = {
  getAll: () => api.get('/organizations'),
  getById: (id) => api.get(`/organizations/${id}`),
  getByOwnerEmail: (email) => api.get(`/organizations/by-owner?email=${encodeURIComponent(email)}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  delete: (id, force = false) => api.delete(`/organizations/${id}${force ? '?force=true' : ''}`),
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

