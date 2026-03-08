import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const getMe = () => api.get('/auth/me');

// Analytics
export const getAnalyticsOverview = (params: Record<string, string>) =>
  api.get('/analytics/overview', { params });

export const getAnalyticsTrends = (params: Record<string, string>) =>
  api.get('/analytics/trends', { params });

export const getAnalyticsByPlatform = (params: Record<string, string>) =>
  api.get('/analytics/by-platform', { params });

export const getFollowerGrowth = (params: Record<string, string>) =>
  api.get('/analytics/follower-growth', { params });

export const getContentPerformance = (params: Record<string, string>) =>
  api.get('/analytics/content-performance', { params });

// Spends
export const getSpendsOverview = (params: Record<string, string>) =>
  api.get('/spends/overview', { params });

export const getSpendsByPlatform = (params: Record<string, string>) =>
  api.get('/spends/by-platform', { params });

export const getSpendsTrends = (params: Record<string, string>) =>
  api.get('/spends/trends', { params });

export const getSpendsCampaigns = (params: Record<string, string>) =>
  api.get('/spends/campaigns', { params });

// Insights
export const getInsights = (params: Record<string, string>) =>
  api.get('/insights', { params });

export const generateInsights = (data: Record<string, unknown>) =>
  api.post('/insights/generate', data);

// Clients
export const getClients = () => api.get('/clients');
