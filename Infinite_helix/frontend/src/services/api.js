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

export const emotionAPI = {
  analyze: (text) => api.post('/emotion/analyze', { text }),
};

export const sentimentAPI = {
  analyze: (text) => api.post('/sentiment/analyze', { text }),
};

export const dashboardAPI = {
  getToday: () => api.get('/dashboard/today'),
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
  authorize: () => api.get('/calendar/authorize'),
};

export const cycleAPI = {
  getSuggestions: (phase) => api.get(`/cycle/suggestions/${phase}`),
  setPhase: (phase) => api.post('/cycle/phase', { phase }),
};

export const hydrationAPI = {
  log: () => api.post('/hydration/log'),
  getToday: () => api.get('/hydration/today'),
};

export default api;
