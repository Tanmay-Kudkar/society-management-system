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

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't tried refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (refreshToken) {
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data;
          await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
        
        // You might want to emit an event here to trigger logout in the app
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============= Auth API =============
export const authAPI = {
  login: (email, password) => 
    apiClient.post('/auth/login', { email, password }),
  
  sendOTP: (phone) => 
    apiClient.post('/auth/send-otp', { phone }),
  
  verifyOTP: (phone, otp) => 
    apiClient.post('/auth/verify-otp', { phone, otp }),
  
  register: (userData) => 
    apiClient.post('/auth/register', userData),
  
  logout: () => 
    apiClient.post('/auth/logout'),
  
  verifyToken: () => 
    apiClient.get('/auth/verify'),
  
  refreshToken: (refreshToken) => 
    apiClient.post('/auth/refresh', { refreshToken }),
  
  forgotPassword: (email) => 
    apiClient.post('/auth/forgot-password', { email }),
  
  resetPassword: (token, password) => 
    apiClient.post('/auth/reset-password', { token, password }),
};

// ============= User API =============
export const userAPI = {
  getProfile: () => 
    apiClient.get('/users/profile'),
  
  updateProfile: (data) => 
    apiClient.put('/users/profile', data),
  
  changePassword: (oldPassword, newPassword) => 
    apiClient.post('/users/change-password', { oldPassword, newPassword }),
  
  uploadAvatar: (formData) => 
    apiClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getUsers: (params) => 
    apiClient.get('/users', { params }),
  
  getUserById: (id) => 
    apiClient.get(`/users/${id}`),
  
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
  
  createFlat: (data) => 
    apiClient.post('/flats', data),
  
  updateFlat: (id, data) => 
    apiClient.put(`/flats/${id}`, data),
  
  deleteFlat: (id) => 
    apiClient.delete(`/flats/${id}`),
  
  getFlatMembers: (id) => 
    apiClient.get(`/flats/${id}/members`),
};

// ============= Notices API =============
export const noticeAPI = {
  getNotices: (params) => 
    apiClient.get('/notices', { params }),
  
  getNoticeById: (id) => 
    apiClient.get(`/notices/${id}`),
  
  createNotice: (data) => 
    apiClient.post('/notices', data),
  
  updateNotice: (id, data) => 
    apiClient.put(`/notices/${id}`, data),
  
  deleteNotice: (id) => 
    apiClient.delete(`/notices/${id}`),
};

// ============= Complaints/Tickets API =============
export const complaintAPI = {
  getComplaints: (params) => 
    apiClient.get('/complaints', { params }),
  
  getComplaintById: (id) => 
    apiClient.get(`/complaints/${id}`),
  
  createComplaint: (data) => 
    apiClient.post('/complaints', data),
  
  updateComplaint: (id, data) => 
    apiClient.put(`/complaints/${id}`, data),
  
  deleteComplaint: (id) => 
    apiClient.delete(`/complaints/${id}`),
  
  addComment: (id, comment) => 
    apiClient.post(`/complaints/${id}/comments`, { comment }),
  
  updateStatus: (id, status) => 
    apiClient.patch(`/complaints/${id}/status`, { status }),
};

// ============= Maintenance/Bills API =============
export const maintenanceAPI = {
  getBills: (params) => 
    apiClient.get('/maintenance/bills', { params }),
  
  getBillById: (id) => 
    apiClient.get(`/maintenance/bills/${id}`),
  
  createBill: (data) => 
    apiClient.post('/maintenance/bills', data),
  
  updateBill: (id, data) => 
    apiClient.put(`/maintenance/bills/${id}`, data),
  
  deleteBill: (id) => 
    apiClient.delete(`/maintenance/bills/${id}`),
  
  getExpenses: (params) => 
    apiClient.get('/maintenance/expenses', { params }),
  
  createExpense: (data) => 
    apiClient.post('/maintenance/expenses', data),
};

// ============= Payments API =============
export const paymentAPI = {
  getPayments: (params) => 
    apiClient.get('/payments', { params }),
  
  getPaymentById: (id) => 
    apiClient.get(`/payments/${id}`),
  
  createPayment: (data) => 
    apiClient.post('/payments', data),
  
  getPaymentHistory: (params) => 
    apiClient.get('/payments/history', { params }),
  
  getDues: () => 
    apiClient.get('/payments/dues'),
  
  initiatePayment: (billId, amount) => 
    apiClient.post('/payments/initiate', { billId, amount }),
  
  verifyPayment: (paymentId, transactionId) => 
    apiClient.post('/payments/verify', { paymentId, transactionId }),
};

// ============= Visitors API =============
export const visitorAPI = {
  getVisitors: (params) => 
    apiClient.get('/visitors', { params }),
  
  getVisitorById: (id) => 
    apiClient.get(`/visitors/${id}`),
  
  createVisitor: (data) => 
    apiClient.post('/visitors', data),
  
  updateVisitor: (id, data) => 
    apiClient.put(`/visitors/${id}`, data),
  
  deleteVisitor: (id) => 
    apiClient.delete(`/visitors/${id}`),
  
  checkIn: (id) => 
    apiClient.post(`/visitors/${id}/check-in`),
  
  checkOut: (id) => 
    apiClient.post(`/visitors/${id}/check-out`),
  
  approveVisitor: (id) => 
    apiClient.post(`/visitors/${id}/approve`),
  
  rejectVisitor: (id) => 
    apiClient.post(`/visitors/${id}/reject`),
  
  getExpectedVisitors: () => 
    apiClient.get('/visitors/expected'),
  
  getActiveVisitors: () => 
    apiClient.get('/visitors/active'),
};

// ============= Dashboard API =============
export const dashboardAPI = {
  getAdminDashboard: () => 
    apiClient.get('/dashboard/admin'),
  
  getMemberDashboard: () => 
    apiClient.get('/dashboard/member'),
  
  getStaffDashboard: () => 
    apiClient.get('/dashboard/staff'),
  
  getStatistics: () => 
    apiClient.get('/dashboard/statistics'),
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

// ============= Documents API =============
export const documentAPI = {
  getDocuments: (params) => 
    apiClient.get('/documents', { params }),
  
  getDocumentById: (id) => 
    apiClient.get(`/documents/${id}`),
  
  uploadDocument: (formData) => 
    apiClient.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  deleteDocument: (id) => 
    apiClient.delete(`/documents/${id}`),
  
  downloadDocument: (id) => 
    apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    }),
};

export default apiClient;
