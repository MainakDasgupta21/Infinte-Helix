import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
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
  getToday: (userId) => api.get('/dashboard/today', userId ? { params: { user_id: userId } } : undefined),
  getScreenHistory: (userId, days = 7) =>
    api.get('/dashboard/screen-history', { params: { ...(userId && { user_id: userId }), days } }),
};

export const journalAPI = {
  create: (entry) => api.post('/journal', entry),
  list: (params) => api.get('/journal', { params }),
  getById: (id) => api.get(`/journal/${id}`),
};

export const reportsAPI = {
  getWeekly: (userId) => api.get('/reports/weekly', userId ? { params: { user_id: userId } } : undefined),
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
  authorize: () => api.get('/calendar/authorize'),
  disconnect: () => api.post('/calendar/disconnect'),
};

export const chatAPI = {
  sendMessage: (message, user_id) => api.post('/chat/message', { message, user_id }),
  getHistory: (user_id, limit) => api.get('/chat/history', { params: { user_id, limit } }),
  clearHistory: (user_id) => api.delete('/chat/history', { data: { user_id } }),
  getQuickReplies: (user_id) => api.get('/chat/quick-replies', { params: { user_id } }),
};

export const cycleAPI = {
  getSuggestions: (phase) => api.get(`/cycle/suggestions/${phase}`),
  setPhase: (phase) => api.post('/cycle/phase', { phase }),
};

export const hydrationAPI = {
  log: (amount_ml = 250, userId) => api.post('/hydration/log', { amount_ml, ...(userId && { user_id: userId }) }),
  getToday: (userId) => api.get('/hydration/today', userId ? { params: { user_id: userId } } : undefined),
};

export const selfCareAPI = {
  log: (action, userId) => api.post('/selfcare/log', { action, ...(userId && { user_id: userId }) }),
  getToday: (userId) => api.get('/selfcare/today', userId ? { params: { user_id: userId } } : undefined),
};

export const todoAPI = {
  create: (text, remindAt, userId) =>
    api.post('/todos', { text, remind_at: remindAt || null, ...(userId && { user_id: userId }) }),
  getToday: (userId) =>
    api.get('/todos/today', userId ? { params: { user_id: userId } } : undefined),
  toggle: (todoId, userId) =>
    api.post(`/todos/${todoId}/toggle`, { ...(userId && { user_id: userId }) }),
  remove: (todoId, userId) =>
    api.delete(`/todos/${todoId}`, { data: { ...(userId && { user_id: userId }) } }),
};

export const privateCareAPI = {
  log: (type, note, userId) => api.post('/privatecare/log', { type, note, ...(userId && { user_id: userId }) }),
  getHistory: (userId, days = 90) =>
    api.get('/privatecare/history', { params: { ...(userId && { user_id: userId }), days } }),
  getPeriodHistory: (userId, start, end) =>
    api.get('/privatecare/period-history', { params: { ...(userId && { user_id: userId }), start, end } }),
};

export default api;
