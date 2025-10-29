import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Customers API
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.patch(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  updateConsents: (id, data) => api.patch(`/customers/${id}/consents`, data),
  getStats: (id) => api.get(`/customers/${id}/stats`),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.patch(`/appointments/${id}`, data),
  reschedule: (id, data) => api.post(`/appointments/${id}/reschedule`, data),
  cancel: (id, data) => api.post(`/appointments/${id}/cancel`, data),
  confirm: (id) => api.post(`/appointments/${id}/confirm`),
  complete: (id, data) => api.post(`/appointments/${id}/complete`, data),
  markNoShow: (id) => api.post(`/appointments/${id}/no-show`),
};

// Messages API
export const messagesAPI = {
  getAll: (params) => api.get('/messages', { params }),
  getById: (id) => api.get(`/messages/${id}`),
  getMessages: (threadId, params) => api.get(`/threads/${threadId}/messages`, { params }),
  send: (data) => api.post('/messages', data),
  sendMessage: (data) => api.post('/messages/send', data),
  search: (query) => api.get('/messages/search', { params: { query } }),
};

// Threads API
export const threadsAPI = {
  getAll: (params) => api.get('/threads', { params }),
  getThreads: (params) => api.get('/threads', { params }),
  getById: (id) => api.get(`/threads/${id}`),
  assign: (id, userId) => api.post(`/threads/${id}/assign`, { userId }),
  markRead: (id) => api.post(`/threads/${id}/mark-read`),
  markAsRead: (id) => api.post(`/threads/${id}/mark-read`),
  updateStatus: (id, status) => api.patch(`/threads/${id}`, { status }),
  updateThread: (id, data) => api.patch(`/threads/${id}`, data),
};

// Services API
export const servicesAPI = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.patch(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
};

// Availability API
export const availabilityAPI = {
  getSlots: (params) => api.get('/availability/slots', { params }),
  checkSlot: (params) => api.get('/availability/check', { params }),
  getNext: (params) => api.get('/availability/next', { params }),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getUsers: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getSchedule: (id, params) => api.get(`/users/${id}/schedule`, { params }),
  updateAvailability: (id, data) => api.put(`/users/${id}/availability`, data),
};

// Phone Numbers API
export const numbersAPI = {
  search: (params) => api.get('/numbers/search', { params }),
  getAll: (params) => api.get('/numbers', { params }),
  getById: (id) => api.get(`/numbers/${id}`),
  purchase: (data) => api.post('/numbers', data),
  update: (id, data) => api.patch(`/numbers/${id}`, data),
  release: (id) => api.delete(`/numbers/${id}`),
};

// Organization API
export const organizationAPI = {
  get: () => api.get('/organization'),
  update: (data) => api.patch('/organization', data),
  getStats: () => api.get('/organization/stats'),
  // Twilio Configuration
  twilioConfigStatus: () => api.get('/organization/twilio-config'),
  updateTwilioConfig: (data) => api.patch('/organization/twilio-config', data),
  validateTwilioConfig: (data) => api.post('/organization/twilio-config/validate', data),
  fetchTwilioNumbers: (data) => api.post('/organization/twilio-config/fetch-numbers', data),
  importTwilioNumbers: (data) => api.post('/organization/twilio-config/import-numbers', data),
};

// Public API (no auth required)
const publicAPI = axios.create({
  baseURL: `${API_URL}/public`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const publicBookingAPI = {
  getOrg: (slug) => publicAPI.get(`/${slug}`),
  getServices: (slug) => publicAPI.get(`/${slug}/services`),
  getWorkers: (slug, serviceId) => publicAPI.get(`/${slug}/services/${serviceId}/workers`),
  getAvailability: (slug, params) => publicAPI.get(`/${slug}/availability`, { params }),
  book: (slug, data) => publicAPI.post(`/${slug}/book`, data),
  reschedule: (slug, data) => publicAPI.post(`/${slug}/reschedule`, data),
  cancel: (slug, data) => publicAPI.post(`/${slug}/cancel`, data),
};
