import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api/${
  process.env.NEXT_PUBLIC_API_VERSION ?? 'v1'
}`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ───────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);

// ─── Typed API helpers ─────────────────────────────────────────────────────────
export const newsApi = {
  getArticles: (params?: Record<string, string | number | boolean>) =>
    apiClient.get('/news', { params }),
  getArticle: (id: string) => apiClient.get(`/news/${id}`),
  analyzeArticle: (id: string) => apiClient.post(`/news/${id}/analyze`),
  toggleSave: (id: string) => apiClient.post(`/news/${id}/save`),
  getSavedArticles: () => apiClient.get('/news/saved'),
  getAnalytics: () => apiClient.get('/news/analytics'),
};

export const aiApi = {
  chat: (message: string, conversationHistory: unknown[], articleId?: string) =>
    apiClient.post('/ai/chat', { message, conversationHistory, articleId }),
  getBriefing: () => apiClient.get('/ai/briefing'),
  getTrending: () => apiClient.get('/ai/trending'),
};

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
};

export const searchApi = {
  search: (q: string, limit = 10) => apiClient.get('/search', { params: { q, limit } }),
};

export const feedApi = {
  getStatus: () => apiClient.get('/feed/status'),
  triggerIngest: () => apiClient.post('/feed/ingest'),
};

export const analyticsApi = {
  getOverview: () => apiClient.get('/analytics/overview'),
};
