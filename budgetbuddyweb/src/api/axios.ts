/**
 * Axios HTTP client configuration for BudgetBuddy API
 * Handles JWT authentication, error handling, and request retry logic
 */

import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

console.log('API base:', import.meta.env.VITE_API_BASE);

/**
 * Configured axios instance for API requests
 * Includes base URL, JSON headers, credential support, and timeout
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'https://localhost:7110',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

/**
 * Request interceptor: Attaches JWT token and adds request metadata
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bb_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to prevent caching issues
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handles errors, authentication, and retry logic
 */
api.interceptors.response.use(
  (response) => {
    // Log request duration in development
    if (import.meta.env.DEV && response.config.metadata) {
      const duration = new Date().getTime() - response.config.metadata.startTime.getTime();
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // Handle authentication errors
    if (status === 401 || status === 403) {
      localStorage.removeItem('bb_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Retry on network errors or 5xx server errors (max 2 retries)
    if (
      (!error.response || (status && status >= 500)) &&
      config &&
      !config._retry
    ) {
      config._retry = true;
      
      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      return api(config);
    }

    // Enhanced error logging
    console.error('API error:', {
      message: error.message,
      url: config?.url,
      method: config?.method,
      status,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
  }
}
