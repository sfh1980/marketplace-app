/**
 * Authentication Service
 * 
 * This file contains all API calls related to user authentication.
 * Each function is a wrapper around an API endpoint.
 * 
 * Benefits of this pattern:
 * - All auth-related API calls in one place
 * - Easy to test (can mock this service)
 * - Easy to update if API changes
 * - Type-safe with TypeScript
 */

import { apiClient, setAuthToken, removeAuthToken } from '../lib/axios';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  User,
} from '../types/api';

/**
 * Register a new user
 * 
 * @param data - User registration data (email, password, username)
 * @returns Promise with auth token and user data
 * 
 * Example usage:
 * ```
 * const { token, user } = await authService.register({
 *   email: 'user@example.com',
 *   password: 'securePassword123',
 *   username: 'johndoe'
 * });
 * ```
 */
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  
  // Store the token for future requests
  if (response.data.token) {
    setAuthToken(response.data.token);
    // Also store user data for easy access
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response.data;
};

/**
 * Verify email address
 * 
 * @param token - Email verification token from the email link
 * @returns Promise with success message
 * 
 * This is called when user clicks the verification link in their email
 */
export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  const response = await apiClient.post(`/auth/verify-email/${token}`);
  return response.data;
};

/**
 * Login an existing user
 * 
 * @param data - Login credentials (email, password)
 * @returns Promise with auth token and user data
 * 
 * Example usage:
 * ```
 * const { token, user } = await authService.login({
 *   email: 'user@example.com',
 *   password: 'securePassword123'
 * });
 * ```
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  
  // Store the token for future requests
  if (response.data.token) {
    setAuthToken(response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response.data;
};

/**
 * Logout the current user
 * 
 * This clears the auth token and user data from localStorage.
 * Note: JWT tokens are stateless, so we don't need to call the backend.
 * The token will simply expire on its own.
 */
export const logout = (): void => {
  removeAuthToken();
};

/**
 * Request a password reset
 * 
 * @param email - User's email address
 * @returns Promise with success message
 * 
 * This sends a password reset email to the user
 */
export const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/reset-password', { email });
  return response.data;
};

/**
 * Complete password reset
 * 
 * @param token - Password reset token from the email link
 * @param newPassword - The new password
 * @returns Promise with success message
 * 
 * This is called when user submits the new password form
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<{ message: string }> => {
  const response = await apiClient.post(`/auth/reset-password/${token}`, {
    password: newPassword,
  });
  return response.data;
};

/**
 * Get the current user from localStorage
 * 
 * This is a helper function to get the cached user data.
 * For fresh data, use the userService.getCurrentUser() function.
 */
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated
 * 
 * @returns true if user has a valid token
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};
