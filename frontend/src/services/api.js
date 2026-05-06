import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (userData) => api.post('/auth/register', userData),
};

export const transactionService = {
  predict: (data) => api.post('/transactions/predict', data),
  getHistory: (page = 1) => api.get(`/transactions/history?page=${page}`),
  simulate: () => api.post('/transactions/simulate'),
  getAlerts: () => api.get('/transactions/alerts'),
  resolveAlert: (id) => api.put(`/transactions/alerts/${id}/resolve`),
};

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTrends: (days = 30) => api.get(`/analytics/fraud-trends?days=${days}`),
  getMerchantAnalysis: () => api.get('/analytics/merchant-analysis'),
  getGraphData: () => api.get('/analytics/graph-data'),
  chat: (query) => api.post('/analytics/chat', { query }),
};

export default api;
