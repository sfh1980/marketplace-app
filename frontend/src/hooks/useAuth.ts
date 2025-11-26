/**
 * Authentication Hooks
 * 
 * These custom hooks integrate our auth service with React Query.
 * 
 * Benefits of using React Query:
 * - Automatic caching: Data is cached and reused
 * - Loading states: Automatic loading/error/success states
 * - Refetching: Automatic background refetching
 * - Mutations: Easy handling of create/update/delete operations
 * - Optimistic updates: Update UI before server responds
 * 
 * Example usage:
 * ```
 * function LoginForm() {
 *   const loginMutation = useLogin();
 *   
 *   const handleSubmit = (data) => {
 *     loginMutation.mutate(data, {
 *       onSuccess: () => {
 *         navigate('/dashboard');
 *       },
 *       onError: (error) => {
 *         alert('Login failed');
 *       }
 *     });
 *   };
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {loginMutation.isPending && <p>Logging in...</p>}
 *       {loginMutation.isError && <p>Error: {loginMutation.error.message}</p>}
 *     </form>
 *   );
 * }
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import type { RegisterRequest, LoginRequest } from '../types/api';

/**
 * Hook for user registration
 * 
 * Returns a mutation object with:
 * - mutate: Function to call with registration data
 * - isPending: true while request is in progress
 * - isError: true if request failed
 * - isSuccess: true if request succeeded
 * - data: Response data (token and user)
 * - error: Error object if request failed
 */
export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: () => {
      // Invalidate and refetch any user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

/**
 * Hook for user login
 * 
 * Similar to useRegister, returns a mutation object.
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: () => {
      // Invalidate and refetch any user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

/**
 * Hook for user logout
 * 
 * This doesn't make an API call, just clears local data.
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: () => {
      authService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Redirect to home page
      navigate('/');
    },
  });
};

/**
 * Hook for password reset request
 */
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
  });
};

/**
 * Hook for completing password reset
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
  });
};

/**
 * Hook for email verification
 */
export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
  });
};
