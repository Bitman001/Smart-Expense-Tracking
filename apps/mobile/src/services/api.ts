import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API 基础 URL 由 Expo 环境变量驱动:
// - 开发:读取 .env.development 中的 EXPO_PUBLIC_API_URL
// - 生产打包:读取 .env.production
// - 两者都缺失时降级到本地后端(方便开发者首次克隆即跑)
// 注意:客户端可见的变量必须以 EXPO_PUBLIC_ 前缀,否则 Expo 不会打进 bundle。
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

if (__DEV__) {
  // 运行时打印实际命中的后端地址,避免配置错了自己还不知道
  // eslint-disable-next-line no-console
  console.log('[api] baseURL =', API_BASE_URL);
}

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

// 把 axios 错误转成给用户看的中文提示。集中在一处方便后续调整文案,
// 调用方既可以读 `error.userMessage` 也可以直接读 `error.message`(两者一致)。
function getFriendlyError(error: any): string {
  // 1. 网络错误(最常见,RN/Web 上 axios 拿不到 response 时落到这里)
  //    特别针对国内用户可能开启 VPN 干扰路由的情况给出明确指引。
  if (error?.message === 'Network Error' || !error?.response) {
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return '⏱️ 请求超时,网络较慢,请稍后再试';
    }
    return '⚠️ 无法连接服务器\n\n可能原因:\n• 您可能开启了 VPN,请尝试关闭\n• 网络连接不稳定,请检查 WiFi/移动网络\n• 服务器临时维护中';
  }

  // 2. 超时(有 response 但被 axios 标记超时,极少见)
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return '⏱️ 请求超时,网络较慢,请稍后再试';
  }

  // 3. HTTP 状态码 → 中文文案,后端业务 error 字段优先
  const status = error.response?.status;
  const backendError = error.response?.data?.error || error.response?.data?.message;

  switch (status) {
    case 400: return backendError || '请求参数有误';
    case 401: return backendError || '登录已过期,请重新登录';
    case 403: return backendError || '您没有权限执行此操作';
    case 404: return backendError || '请求的资源不存在';
    case 409: return backendError || '该数据已存在或冲突';
    case 429: return backendError || '请求过于频繁,请稍后再试';
    case 500: return '服务器开小差了,请稍后再试';
    case 502:
    case 503:
    case 504: return '服务暂时不可用,请稍后再试';
  }

  if (backendError) return backendError;
  return `请求失败(${status || '未知错误'})`;
}

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const friendly = getFriendlyError(error);
    // 新建一个 Error 让 message 已经是中文友好提示,同时挂 userMessage 兼容
    // 显式调用 `error.userMessage || error.message` 的写法。
    const wrapped: any = new Error(friendly);
    wrapped.userMessage = friendly;
    wrapped.status = error?.response?.status;
    wrapped.original = error;
    return Promise.reject(wrapped);
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
