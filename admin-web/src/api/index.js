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
}

// Society API - requires userId for create/update/delete (MASTER_ADMIN only)
export const societyApi = {
  getAll: () => api.get('/societies'),
  getById: (id) => api.get(`/societies/${id}`),
  create: (data, userId) => api.post(`/societies?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/societies/${id}?userId=${userId}`, data),
  delete: (id, userId) => api.delete(`/societies/${id}?userId=${userId}`),
}

// User API - No userId needed, backend gets user from JWT token
export const userApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getBySociety: (societyId) => api.get(`/users/society/${societyId}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
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
  delete: (id, userId) => api.delete(`/flats/${id}?userId=${userId}`),
  
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
  delete: (id) => api.delete(`/api/wings/${id}`),
}

// Vendor API
export const vendorApi = {
  getAll: () => api.get('/vendors'),
  getById: (id) => api.get(`/vendors/${id}`),
  getBySociety: (societyId) => api.get(`/vendors/society/${societyId}`),
  create: (data, userId) => api.post(`/vendors?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/vendors/${id}?userId=${userId}`, data),
  delete: (id, userId) => api.delete(`/vendors/${id}?userId=${userId}`),
  approve: (id, userId) => api.patch(`/vendors/${id}/approve?userId=${userId}`),
  reject: (id, userId) => api.patch(`/vendors/${id}/reject?userId=${userId}`),
  getPending: (societyId) => api.get(`/vendors/pending${societyId ? `?societyId=${societyId}` : ''}`),
}

// Vendor Bill API
export const vendorBillApi = {
  getAll: () => api.get('/vendor-bills'),
  getById: (id) => api.get(`/vendor-bills/${id}`),
  getByVendor: (vendorId) => api.get(`/vendor-bills/vendor/${vendorId}`),
  getPending: () => api.get('/vendor-bills/pending'),
  create: (data, userId) => api.post(`/vendor-bills?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/vendor-bills/${id}?userId=${userId}`, data),
  recordPayment: (id, amount, paymentMode, referenceNumber, userId) => 
    api.post(`/vendor-bills/${id}/payment?amount=${amount}&paymentMode=${paymentMode}&referenceNumber=${encodeURIComponent(referenceNumber || '')}&userId=${userId}`),
  delete: (id, userId) => api.delete(`/vendor-bills/${id}?userId=${userId}`),
}

// Contract API
export const contractApi = {
  getAll: () => api.get('/contracts'),
  getById: (id) => api.get(`/contracts/${id}`),
  getBySociety: (societyId) => api.get(`/contracts/society/${societyId}`),
  getExpiringSoon: (societyId, days = 30) => api.get(`/contracts/expiring/${societyId}?days=${days}`),
  create: (data, userId) => api.post(`/contracts?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/contracts/${id}?userId=${userId}`, data),
  delete: (id, userId) => api.delete(`/contracts/${id}?userId=${userId}`),
}

// Maintenance Bill API
export const maintenanceBillApi = {
  getAll: () => api.get('/maintenance-bills'),
  getById: (id) => api.get(`/maintenance-bills/${id}`),
  getByFlat: (flatId) => api.get(`/maintenance-bills/flat/${flatId}`),
  getByMonth: (month) => api.get(`/maintenance-bills/month/${month}`),
  getPending: () => api.get('/maintenance-bills/pending'),
  create: (data, userId) => api.post(`/maintenance-bills?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/maintenance-bills/${id}?userId=${userId}`, data),
  recordPayment: (id, amount, paymentMode, referenceNumber, userId) => 
    api.post(`/maintenance-bills/${id}/payment?amount=${amount}&paymentMode=${paymentMode}&referenceNumber=${encodeURIComponent(referenceNumber || '')}&userId=${userId}`),
  generateForSociety: (societyId, billMonth, amount, userId) => 
    api.post(`/maintenance-bills/generate?societyId=${societyId}&billMonth=${billMonth}&amount=${amount}&userId=${userId}`),
  delete: (id, userId) => api.delete(`/maintenance-bills/${id}?userId=${userId}`),
}

// Transaction API
export const transactionApi = {
  getAll: () => api.get('/transactions'),
  getById: (id) => api.get(`/transactions/${id}`),
  getBySociety: (societyId) => api.get(`/transactions/society/${societyId}`),
  getByType: (type) => api.get(`/transactions/type/${type}`),
  getByPaymentMode: (mode) => api.get(`/transactions/payment-mode/${mode}`),
  getByDateRange: (societyId, start, end) => api.get(`/transactions/society/${societyId}/range?start=${start}&end=${end}`),
  getTotalIncome: (societyId) => api.get(`/transactions/society/${societyId}/income`),
  getTotalExpense: (societyId) => api.get(`/transactions/society/${societyId}/expense`),
  getSummaryByCategory: (societyId, start, end) => api.get(`/transactions/society/${societyId}/summary?start=${start}&end=${end}`),
  create: (data, userId) => api.post(`/transactions?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/transactions/${id}?userId=${userId}`, data),
  delete: (id, userId) => api.delete(`/transactions/${id}?userId=${userId}`),
}

// Notice API
export const noticeApi = {
  getAll: () => api.get('/notices'),
  getById: (id) => api.get(`/notices/${id}`),
  getBySociety: (societyId) => api.get(`/notices/society/${societyId}`),
  getActive: (societyId) => api.get(`/notices/active/${societyId}`),
  create: (data, userId) => api.post(`/notices?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/notices/${id}?userId=${userId}`, data),
  delete: (id, userId) => api.delete(`/notices/${id}?userId=${userId}`),
}

// Security Log API
export const securityLogApi = {
  getRecent: (societyId, limit = 10) => api.get(`/api/security-logs?societyId=${societyId}&limit=${limit}`),
}

// Banner API
export const bannerApi = {
  getAll: () => api.get('/banners'),
  getById: (id) => api.get(`/banners/${id}`),
  getActive: () => api.get('/banners/active'),
  create: (data, userId) => api.post(`/banners?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/banners/${id}?userId=${userId}`, data),
  delete: (id, userId) => api.delete(`/banners/${id}?userId=${userId}`),
}

// Ticket API
export const ticketApi = {
  getAll: () => api.get('/tickets'),
  getById: (id) => api.get(`/tickets/${id}`),
  getBySociety: (societyId) => api.get(`/tickets/society/${societyId}`),
  getByRaisedBy: (userId) => api.get(`/tickets/raised-by/${userId}`),
  getByAssignedTo: (userId) => api.get(`/tickets/assigned-to/${userId}`),
  getByStatus: (status) => api.get(`/tickets/status/${status}`),
  create: (data, userId) => api.post(`/tickets?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/tickets/${id}?userId=${userId}`, data),
  updateStatus: (id, status, resolution, userId) => {
    let url = `/tickets/${id}/status?status=${status}&userId=${userId}`;
    if (resolution) url += `&resolution=${encodeURIComponent(resolution)}`;
    return api.patch(url);
  },
  updateProgress: (id, progress, userId) => api.patch(`/tickets/${id}/progress?progress=${progress}&userId=${userId}`),
  assign: (id, assignedToId, userId) => api.patch(`/tickets/${id}/assign?assignedToId=${assignedToId}&userId=${userId}`),
  delete: (id, userId) => api.delete(`/tickets/${id}?userId=${userId}`),
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
  delete: (id, userId) => api.delete(`/complaints/${id}?userId=${userId}`),
}

// Emergency Contact API
export const emergencyContactApi = {
  getAll: () => api.get('/emergency-contacts'),
  getById: (id) => api.get(`/emergency-contacts/${id}`),
  getBySociety: (societyId) => api.get(`/emergency-contacts/society/${societyId}`),
  create: (data, userId) => api.post(`/emergency-contacts?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/emergency-contacts/${id}?userId=${userId}`, data),
  delete: (id, userId) => api.delete(`/emergency-contacts/${id}?userId=${userId}`),
}

// Document Template API
export const documentTemplateApi = {
  getAll: () => api.get('/document-templates'),
  getById: (id) => api.get(`/document-templates/${id}`),
  getByType: (type) => api.get(`/document-templates/type/${type}`),
  create: (data, userId) => api.post(`/document-templates?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/document-templates/${id}?userId=${userId}`, data),
  delete: (id, userId) => api.delete(`/document-templates/${id}?userId=${userId}`),
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
  delete: (id, userId) => api.delete(`/tenants/${id}?userId=${userId}`),
}

// Vehicle API
export const vehicleApi = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  getByFlat: (flatId) => api.get(`/vehicles/flat/${flatId}`),
  create: (data, userId) => api.post(`/vehicles?userId=${userId}`, data),
  update: (id, data, userId) => api.put(`/vehicles/${id}?userId=${userId}`, data),
  delete: (id, userId) => api.delete(`/vehicles/${id}?userId=${userId}`),
}

// Notification Preferences API
export const notificationPreferenceApi = {
  getByUserId: (userId) => api.get(`/notification-preferences/${userId}`),
  update: (userId, data) => api.put(`/notification-preferences/${userId}`, data),
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

