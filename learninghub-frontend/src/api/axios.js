/**
 * LearningHUB — Axios instance with JWT interceptor
 */

import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
// Accept either the Render service origin or an explicit /api URL. This keeps
// production requests aligned with Flask's /api blueprint prefix.
const API_URL = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/api$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lhub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lhub_token');
      localStorage.removeItem('lhub_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
