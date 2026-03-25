import axios from 'axios';
import { auth } from './firebase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth?.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // token retrieval failed — proceed without auth
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    console.warn('API Error:', error.message);
    return Promise.reject(error);
  }
);

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export const authAPI = {
  register: (token, profile) => api.post('/auth/register', profile, authHeader(token)),
  syncProfile: (token) => api.post('/auth/sync', {}, authHeader(token)),
  getProfile: (token) => api.get('/auth/profile', authHeader(token)),
};

export const emotionAPI = {
  analyze: (text) => api.post('/emotion/analyze', { text }),
};

export const sentimentAPI = {
  analyze: (text) => api.post('/sentiment/analyze', { text }),
};

export const dashboardAPI = {
  getToday: () => api.get('/dashboard/today'),
  getScreenHistory: (days = 7) =>
    api.get('/dashboard/screen-history', { params: { days } }),
};

export const journalAPI = {
  create: (entry) => api.post('/journal', entry),
  list: (params) => api.get('/journal', { params }),
  getById: (id) => api.get(`/journal/${id}`),
};

export const reportsAPI = {
  getWeekly: () => api.get('/reports/weekly'),
};

export const trackerAPI = {
  getStatus: () => api.get('/tracker/status'),
  start: () => api.post('/tracker/start'),
  stop: () => api.post('/tracker/stop'),
};

export const nudgeAPI = {
  generate: (context) => api.post('/nudge/generate', context),
  dismiss: (id) => api.post(`/nudge/${id}/dismiss`),
};

export const calendarAPI = {
  getMeetings: () => api.get('/calendar/meetings'),
  getNext: () => api.get('/calendar/next'),
  getStatus: () => api.get('/calendar/status'),
  authorize: (provider = 'microsoft') =>
    api.get('/calendar/authorize', { params: { provider } }),
  disconnect: (provider = 'microsoft') =>
    api.post('/calendar/disconnect', { provider }),
  createEvent: (event) => api.post('/calendar/events', event),
};

export const chatAPI = {
  sendMessage: (message, page_context) =>
    api.post('/chat/message', { message, page_context }),
  getHistory: (limit) => api.get('/chat/history', { params: { limit } }),
  clearHistory: () => api.delete('/chat/history'),
  getQuickReplies: () => api.get('/chat/quick-replies'),
};

export const cycleAPI = {
  getSuggestions: (phase) => api.get(`/cycle/suggestions/${phase}`),
  setPhase: (phase) => api.post('/cycle/phase', { phase }),
};

export const hydrationAPI = {
  log: (amount_ml = 250) => api.post('/hydration/log', { amount_ml }),
  getToday: () => api.get('/hydration/today'),
};

export const selfCareAPI = {
  log: (action) => api.post('/selfcare/log', { action }),
  getToday: () => api.get('/selfcare/today'),
};

export const todoAPI = {
  create: (text, remindAt, userId, date, category) =>
    api.post('/todos', { text, remind_at: remindAt || null, date: date || null, category: category || 'work', ...(userId && { user_id: userId }) }),
  getToday: (userId) =>
    api.get('/todos/today', userId ? { params: { user_id: userId } } : undefined),
  getByDate: (date, userId) =>
    api.get(`/todos/date/${date}`, userId ? { params: { user_id: userId } } : undefined),
  getUpcoming: (userId) =>
    api.get('/todos/upcoming', userId ? { params: { user_id: userId } } : undefined),
  getHistory: (userId, days = 30) =>
    api.get('/todos/history', { params: { ...(userId && { user_id: userId }), days } }),
  toggle: (todoId, userId) =>
    api.post(`/todos/${todoId}/toggle`, { ...(userId && { user_id: userId }) }),
  remove: (todoId, userId) =>
    api.delete(`/todos/${todoId}`, { data: { ...(userId && { user_id: userId }) } }),
};

export const settingsAPI = {
  get: () => api.get('/user/settings'),
  update: (settings) => api.put('/user/settings', { settings }),
};

export const privateCareAPI = {
  log: (type, note) => api.post('/privatecare/log', { type, note }),
  getHistory: (days = 90) =>
    api.get('/privatecare/history', { params: { days } }),
  getPeriodHistory: (start, end) =>
    api.get('/privatecare/period-history', { params: { start, end } }),
};

export default api;
