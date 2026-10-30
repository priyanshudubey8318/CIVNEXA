// Centralized Axios API Service Abstraction for CIVNEXA
// Connects React frontend to Spring Boot backend API (/api/v1)
// Enforces strict in-memory JWT token management without persistent storage
import axios from 'axios';

// Backend API base URL configurable via Vite environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Strict in-memory JWT access token reference (never written to localStorage or sessionStorage)
let inMemoryToken = null;

// Registered callback for automatic session invalidation upon HTTP 401
let unauthorizedHandler = null;

/**
 * Update the in-memory JWT access token
 * @param {string|null} token
 */
export const setAuthToken = (token) => {
  inMemoryToken = token || null;
};

/**
 * Retrieve the current in-memory JWT access token
 * @returns {string|null}
 */
export const getAuthToken = () => inMemoryToken;

/**
 * Clear the in-memory JWT access token
 */
export const clearAuthToken = () => {
  inMemoryToken = null;
};

/**
 * Register a listener invoked when an API request receives HTTP 401 Unauthorized
 * @param {Function} handler
 */
export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

// Create configured Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: attach Authorization header only when in-memory token is present
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers.Authorization) {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwraps data payload, triggers 401 session invalidation, and normalizes errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status || (error.code === 'ERR_NETWORK' ? 0 : 500);

    // Trigger automatic session cleanup on 401 Unauthorized
    if (status === 401 && typeof unauthorizedHandler === 'function') {
      try {
        unauthorizedHandler();
      } catch (handlerErr) {
        console.warn('Unauthorized handler execution failed', handlerErr);
      }
    }

    let defaultMessage = 'An unexpected error occurred';
    if (status === 401) {
      defaultMessage = 'Invalid email or password.';
    } else if (status === 403) {
      defaultMessage = 'Access denied by institutional policy.';
    } else if (status === 429) {
      defaultMessage = 'Too many login attempts. Please wait before trying again.';
    } else if (status === 0 || error.code === 'ERR_NETWORK') {
      defaultMessage = 'Unable to connect to CIVNEXA authentication service.';
    }

    const formattedError = {
      message: error.response?.data?.message || defaultMessage,
      status: status,
      data: error.response?.data || null,
      isApiError: true,
    };

    return Promise.reject(formattedError);
  }
);

// Abstract generic API service methods
export const apiService = {
  get: (url, params = {}) => apiClient.get(url, { params }),
  post: (url, data = {}) => apiClient.post(url, data),
  put: (url, data = {}) => apiClient.put(url, data),
  patch: (url, data = {}) => apiClient.patch(url, data),
  delete: (url) => apiClient.delete(url),
  setAuthToken,
  getAuthToken,
  clearAuthToken,
};

export default apiService;
