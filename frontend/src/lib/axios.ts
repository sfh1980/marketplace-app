/**
 * Axios Instance Configuration
 * 
 * This file creates a pre-configured Axios instance that all API calls will use.
 * Benefits:
 * - Centralized base URL configuration
 * - Automatic JWT token attachment
 * - Consistent error handling
 * - Request/response interceptors for cross-cutting concerns
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Base API URL
 * In development: http://localhost:3000
 * In production: This would be your deployed backend URL
 * 
 * Using environment variables allows different URLs for dev/staging/prod
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Create the Axios instance with default configuration
 */
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout after 30 seconds
  timeout: 30000,
});

/**
 * Request Interceptor
 * 
 * This runs BEFORE every request is sent.
 * We use it to automatically attach the JWT token to requests.
 * 
 * How it works:
 * 1. Check if a token exists in localStorage
 * 2. If yes, add it to the Authorization header
 * 3. The backend will verify this token to authenticate the user
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get the token from localStorage
    const token = localStorage.getItem('authToken');
    
    if (token && config.headers) {
      // Add the token to the Authorization header
      // Format: "Bearer <token>"
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Handle request errors (rare, usually network issues)
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * 
 * This runs AFTER every response is received.
 * We use it to handle common error scenarios.
 * 
 * Common HTTP Status Codes:
 * - 200-299: Success
 * - 400: Bad Request (validation error)
 * - 401: Unauthorized (not logged in or token expired)
 * - 403: Forbidden (logged in but don't have permission)
 * - 404: Not Found
 * - 500: Server Error
 */
apiClient.interceptors.response.use(
  // Success response - just pass it through
  (response) => response,
  
  // Error response - handle common scenarios
  (error: AxiosError) => {
    if (error.response) {
      // The server responded with an error status code
      const status = error.response.status;
      
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          // Clear the token and redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden:', error.response.data);
          break;
          
        case 404:
          // Not found - resource doesn't exist
          console.error('Resource not found:', error.response.data);
          break;
          
        case 500:
          // Server error - something went wrong on the backend
          console.error('Server error:', error.response.data);
          break;
      }
    } else if (error.request) {
      // Request was made but no response received
      // Usually a network error or server is down
      console.error('Network error - no response received');
    } else {
      // Something else went wrong
      console.error('Request error:', error.message);
    }
    
    // Always reject so the calling code can handle the error
    return Promise.reject(error);
  }
);

/**
 * Helper function to set the auth token
 * Call this after successful login
 */
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

/**
 * Helper function to remove the auth token
 * Call this on logout
 */
export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

/**
 * Helper function to check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};
