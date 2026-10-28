// Axios API Service Abstraction
// Designed for seamless transition from mock layer to Spring Boot backend
import axios from 'axios';

// Future backend API base URL (configurable via Vite env)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Create configured Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor for future JWT / Auth tokens
apiClient.interceptors.request.use(
  (config) => {
    // Check if token exists in session storage for demo/authenticated requests
    const token = sessionStorage.getItem('civnexa_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent response wrapping and error normalization
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const formattedError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status || 500,
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
};

export default apiService;
