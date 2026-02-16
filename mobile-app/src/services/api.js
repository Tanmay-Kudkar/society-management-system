import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, STORAGE_KEYS } from '../constants';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If 401, clear stored credentials (user must login again)
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    }

    return Promise.reject(error);
  }
);

// ============= Auth API =============
export const authAPI = {
  login: (email, password) => 
    apiClient.post('/auth/login', { email, password }),
  
  register: (userData) => 
    apiClient.post('/auth/register', userData),
  
  logout: () => 
    apiClient.post('/auth/logout'),
  
  me: () => 
    apiClient.get('/auth/me'),
  
  forgotPassword: (email) => 
    apiClient.post('/auth/forgot-password', { email }),
  
  resetPassword: (token, password) => 
    apiClient.post('/auth/reset-password', { token, password }),
  
  changePassword: (currentPassword, newPassword) => 
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),
};

// ============= User API =============
export const userAPI = {
  getUsers: (params) => 
    apiClient.get('/users', { params }),
  
  getUserById: (id) => 
    apiClient.get(`/users/${id}`),
  
  getUsersBySociety: (societyId) => 
    apiClient.get(`/users/society/${societyId}`),
  
  createUser: (data) => 
    apiClient.post('/users', data),
  
  updateUser: (id, data) => 
    apiClient.put(`/users/${id}`, data),
  
  deleteUser: (id) => 
    apiClient.delete(`/users/${id}`),
};

// ============= Society API =============
export const societyAPI = {
  getSocieties: (params) => 
    apiClient.get('/societies', { params }),
  
  getSocietyById: (id) => 
    apiClient.get(`/societies/${id}`),
  
  createSociety: (data) => 
    apiClient.post('/societies', data),
  
  updateSociety: (id, data) => 
    apiClient.put(`/societies/${id}`, data),
  
  deleteSociety: (id) => 
    apiClient.delete(`/societies/${id}`),
};

// ============= Flat API =============
export const flatAPI = {
  getFlats: (params) => 
    apiClient.get('/flats', { params }),
  
  getFlatById: (id) => 
    apiClient.get(`/flats/${id}`),
  
  getFlatsBySociety: (societyId) => 
    apiClient.get(`/flats/society/${societyId}`),
  
  createFlat: (data) => 
    apiClient.post('/flats', data),
  
  updateFlat: (id, data) => 
    apiClient.put(`/flats/${id}`, data),
  
  deleteFlat: (id) => 
    apiClient.delete(`/flats/${id}`),
};

// ============= Notices API =============
export const noticeAPI = {
  getNotices: (params) => 
    apiClient.get('/notices', { params }),
  
  getNoticeById: (id) => 
    apiClient.get(`/notices/${id}`),
  
  getNoticesBySociety: (societyId) => 
    apiClient.get(`/notices/society/${societyId}`),
  
  createNotice: (data, userId) => 
    apiClient.post(`/notices?userId=${userId}`, data),
  
  updateNotice: (id, data, userId) => 
    apiClient.put(`/notices/${id}?userId=${userId}`, data),
  
  deleteNotice: (id, userId) => 
    apiClient.delete(`/notices/${id}?userId=${userId}`),
};

// ============= Complaints API =============
export const complaintAPI = {
  getComplaints: (params) => 
    apiClient.get('/complaints', { params }),
  
  getComplaintById: (id) => 
    apiClient.get(`/complaints/${id}`),
  
  getComplaintsBySociety: (societyId, userId) => 
    apiClient.get(`/complaints/society/${societyId}?userId=${userId}`),
  
  getComplaintsByStatus: (status, userId) => 
    apiClient.get(`/complaints/status/${status}?userId=${userId}`),
  
  createComplaint: (data, userId) => 
    apiClient.post(`/complaints?userId=${userId}`, data),
  
  updateStatus: (id, status, resolution, userId) => {
    let url = `/complaints/${id}/status?status=${status}&userId=${userId}`;
    if (resolution) url += `&resolution=${encodeURIComponent(resolution)}`;
    return apiClient.patch(url);
  },
  
  deleteComplaint: (id, userId) => 
    apiClient.delete(`/complaints/${id}?userId=${userId}`),
};

// ============= Maintenance Bills API =============
export const maintenanceAPI = {
  getBills: (params) => 
    apiClient.get('/maintenance-bills', { params }),
  
  getBillById: (id) => 
    apiClient.get(`/maintenance-bills/${id}`),
  
  getBillsByFlat: (flatId) => 
    apiClient.get(`/maintenance-bills/flat/${flatId}`),
  
  getPendingBills: () => 
    apiClient.get('/maintenance-bills/pending'),
  
  createBill: (data, userId) => 
    apiClient.post(`/maintenance-bills?userId=${userId}`, data),
  
  updateBill: (id, data, userId) => 
    apiClient.put(`/maintenance-bills/${id}?userId=${userId}`, data),
  
  recordPayment: (id, amount, paymentMode, referenceNumber, userId) => 
    apiClient.post(`/maintenance-bills/${id}/payment?amount=${amount}&paymentMode=${paymentMode}&referenceNumber=${encodeURIComponent(referenceNumber || '')}&userId=${userId}`),
  
  deleteBill: (id, userId) => 
    apiClient.delete(`/maintenance-bills/${id}?userId=${userId}`),
};

// ============= Payments API (Razorpay) =============
export const paymentAPI = {
  createOrder: (data) => 
    apiClient.post('/api/payments/create-order', data),
  
  verifyPayment: (data) => 
    apiClient.post('/api/payments/verify', data),
  
  handleFailure: (paymentId, errorCode, errorDescription) => 
    apiClient.post(`/api/payments/failure?paymentId=${paymentId}&errorCode=${encodeURIComponent(errorCode || '')}&errorDescription=${encodeURIComponent(errorDescription || '')}`),
  
  getPaymentById: (id) => 
    apiClient.get(`/api/payments/${id}`),
  
  getPaymentByOrderId: (orderId) => 
    apiClient.get(`/api/payments/order/${orderId}`),
  
  getPaymentsByUser: (userId) => 
    apiClient.get(`/api/payments/user/${userId}`),
  
  getPaymentsBySociety: (societyId) => 
    apiClient.get(`/api/payments/society/${societyId}`),
  
  getPaymentsByBill: (billId) => 
    apiClient.get(`/api/payments/bill/${billId}`),
};

// ============= Tickets API =============
export const ticketAPI = {
  getTickets: (params) => 
    apiClient.get('/tickets', { params }),
  
  getTicketById: (id) => 
    apiClient.get(`/tickets/${id}`),
  
  getTicketsBySociety: (societyId) => 
    apiClient.get(`/tickets/society/${societyId}`),
  
  getTicketsByStatus: (status) => 
    apiClient.get(`/tickets/status/${status}`),
  
  createTicket: (data, userId) => 
    apiClient.post(`/tickets?userId=${userId}`, data),
  
  updateTicket: (id, data, userId) => 
    apiClient.put(`/tickets/${id}?userId=${userId}`, data),
  
  updateTicketStatus: (id, status, resolution, userId) => {
    let url = `/tickets/${id}/status?status=${status}&userId=${userId}`;
    if (resolution) url += `&resolution=${encodeURIComponent(resolution)}`;
    return apiClient.patch(url);
  },
  
  deleteTicket: (id, userId) => 
    apiClient.delete(`/tickets/${id}?userId=${userId}`),
};

// ============= Reports/Dashboard API =============
export const reportAPI = {
  getDashboard: (societyId) => 
    apiClient.get(`/api/reports/dashboard/${societyId}`),
  
  getMTD: (societyId) => 
    apiClient.get(`/api/reports/mtd/${societyId}`),
  
  getYTD: (societyId) => 
    apiClient.get(`/api/reports/ytd/${societyId}`),
};

// ============= Vehicles API =============
export const vehicleAPI = {
  getVehicles: (params) => 
    apiClient.get('/vehicles', { params }),
  
  getVehicleById: (id) => 
    apiClient.get(`/vehicles/${id}`),
  
  createVehicle: (data) => 
    apiClient.post('/vehicles', data),
  
  updateVehicle: (id, data) => 
    apiClient.put(`/vehicles/${id}`, data),
  
  deleteVehicle: (id) => 
    apiClient.delete(`/vehicles/${id}`),
};

// ============= Emergency Contacts API =============
export const emergencyAPI = {
  getContacts: (params) => 
    apiClient.get('/emergency-contacts', { params }),
  
  getContactById: (id) => 
    apiClient.get(`/emergency-contacts/${id}`),
  
  createContact: (data) => 
    apiClient.post('/emergency-contacts', data),
  
  updateContact: (id, data) => 
    apiClient.put(`/emergency-contacts/${id}`, data),
  
  deleteContact: (id) => 
    apiClient.delete(`/emergency-contacts/${id}`),
};

// ============= Document Templates API =============
export const documentAPI = {
  getTemplates: (params) => 
    apiClient.get('/document-templates', { params }),
  
  getTemplateById: (id) => 
    apiClient.get(`/document-templates/${id}`),
  
  getTemplatesByType: (templateType) => 
    apiClient.get(`/document-templates/type/${templateType}`),
  
  generateDocument: (id, data) => 
    apiClient.post(`/document-templates/${id}/generate`, data),
};

// ============= Banners API =============
export const bannerAPI = {
  getActive: (societyId) => 
    apiClient.get(`/banners/active/${societyId}`),
  
  getBySociety: (societyId) => 
    apiClient.get(`/banners/society/${societyId}`),
};

// ============= Notification Preferences API =============
export const notificationPreferenceAPI = {
  getByUserId: (userId) => 
    apiClient.get(`/notification-preferences/${userId}`),
  
  update: (userId, data) => 
    apiClient.put(`/notification-preferences/${userId}`, data),
};

// TODO: No backend VisitorController exists yet — stub export to prevent import crashes
export const visitorAPI = {
  getVisitors: () => Promise.reject(new Error('Visitor API not implemented in backend')),
  getVisitorById: () => Promise.reject(new Error('Visitor API not implemented in backend')),
  createVisitor: () => Promise.reject(new Error('Visitor API not implemented in backend')),
  approveVisitor: () => Promise.reject(new Error('Visitor API not implemented in backend')),
  rejectVisitor: () => Promise.reject(new Error('Visitor API not implemented in backend')),
  checkIn: () => Promise.reject(new Error('Visitor API not implemented in backend')),
  checkOut: () => Promise.reject(new Error('Visitor API not implemented in backend')),
};

// TODO: No backend DashboardController exists yet — uses /api/reports/dashboard instead
export const dashboardAPI = {
  getAdminDashboard: () => Promise.reject(new Error('Dashboard API not implemented — use reportAPI.getDashboard(societyId)')),
  getMemberDashboard: () => Promise.reject(new Error('Dashboard API not implemented — use reportAPI.getDashboard(societyId)')),
  getStaffDashboard: () => Promise.reject(new Error('Dashboard API not implemented — use reportAPI.getDashboard(societyId)')),
  getStatistics: () => Promise.reject(new Error('Dashboard API not implemented — use reportAPI.getDashboard(societyId)')),
};

export default apiClient;
