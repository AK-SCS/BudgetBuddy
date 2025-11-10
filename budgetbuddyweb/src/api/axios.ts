/**
 * Axios HTTP client configuration for BudgetBuddy API
 * Handles JWT authentication and automatic token refresh
 */

import axios from 'axios';

console.log('API base:', import.meta.env.VITE_API_BASE);

/**
 * Configured axios instance for API requests
 * Includes base URL, JSON headers, and credential support
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'https://localhost:7110',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

/**
 * Request interceptor: Attaches JWT token to all outgoing requests
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Response interceptor: Handles authentication errors and token expiration
 * Automatically redirects to login on 401/403 responses
 */
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('bb_token');
      window.location.href = '/login';
    }
    console.error('API error:', {
      message: err.message,
      url: err.config?.url,
      method: err.config?.method,
      status,
      data: err.response?.data,
    });
    return Promise.reject(err);
  }
);
