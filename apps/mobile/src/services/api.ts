import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 配置 API 基础 URL - 开发时使用本地服务器
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.smartexpense.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || '网络错误';
    return Promise.reject(new Error(message));
  }
);

// ---- Auth API ----
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: { name?: string; avatar?: string }) =>
    api.put('/auth/me', data),
};

// ---- Records API ----
export const recordsAPI = {
  getList: (params?: {
    familyId?: string;
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) => api.get('/records', { params }),

  create: (data: {
    amount: number;
    type: string;
    categoryId: string;
    description?: string;
    date?: string;
    source?: string;
    familyId?: string;
  }) => api.post('/records', data),

  update: (id: string, data: any) => api.put(`/records/${id}`, data),
  delete: (id: string) => api.delete(`/records/${id}`),
  getSummary: (params?: { familyId?: string; month?: string }) =>
    api.get('/records/summary', { params }),
};

// ---- Categories API ----
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data: { name: string; icon: string; color: string; type: string }) =>
    api.post('/categories', data),
};

// ---- Families API ----
export const familiesAPI = {
  getList: () => api.get('/families'),
  create: (name: string) => api.post('/families', { name }),
  join: (inviteCode: string) => api.post('/families/join', { inviteCode }),
  updateMemberRole: (familyId: string, memberId: string, role: string) =>
    api.put(`/families/${familyId}/members/${memberId}`, { role }),
  getStats: (familyId: string, month?: string) =>
    api.get(`/families/${familyId}/stats`, { params: { month } }),
};

// ---- Parse API ----
export const parseAPI = {
  parseText: (text: string, useAI?: boolean) =>
    api.post('/parse', { text, useAI }),
};

// ---- Budget API ----
export const budgetsAPI = {
  getList: (params?: { month?: string; familyId?: string }) =>
    api.get('/budgets', { params }),
  createOrUpdate: (data: {
    amount: number;
    month?: string;
    categoryId?: string;
    familyId?: string;
  }) => api.post('/budgets', data),
};

// ---- Export API ----
export const exportAPI = {
  getCSV: (params?: { familyId?: string; startDate?: string; endDate?: string }) =>
    api.get('/export/csv', { params, responseType: 'blob' as any }),
  getShareData: (params?: { month?: string; familyId?: string }) =>
    api.get('/export/share-data', { params }),
};

export default api;
