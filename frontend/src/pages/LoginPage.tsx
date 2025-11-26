/**
 * Login Page
 * 
 * This page allows existing users to authenticate and access the marketplace platform.
 * 
 * Features:
 * - Form validation (email format, required fields)
 * - Real-time validation feedback
 * - Loading state during authentication
 * - Error handling with user-friendly messages
 * - Redirect to homepage after successful login
 * - Link to registration page for new users
 * - Link to password reset for forgotten passwords
 * 
 * Authentication Flow:
 * 1. User enters email and password
 * 2. Form validates input
 * 3. API call to /auth/login endpoint
 * 4. Backend verifies credentials and returns JWT token
 * 5. Token stored in localStorage via authService
 * 6. User data stored in AuthContext
 * 7. User redirected to homepage
 * 
 * Protected Routes:
 * After login, users can access protected routes that require authentication.
 * Protected routes check if user is authenticated before rendering.
 * If not authenticated, user is redirected to login page.
 * 
 * Example of a protected route:
 * ```tsx
 * function ProtectedRoute({ children }) {
 *   const { isAuthenticated, isLoading } = useAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <Navigate to="/login" />;
 *   
 *   return children;
 * }
 * ```
 * 
 * Redirects:
 * React Router's useNavigate hook allows programmatic navigation.
 * After successful login, we redirect to the homepage:
 * ```tsx
 * navigate('/'); // Redirect to homepage
 * ```
 * 
 * We can also redirect to a specific page the user was trying to access:
 * ```tsx
 * const location = useLocation();
 * const from = location.state?.from?.pathname || '/';
 * navigate(from, { replace: true });
 * ```
 */

import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useLogin } from '../hooks/useAuth';
import styles from './LoginPage.module.css';

/**
 * Form Data Interface
 * 
 * Defines the shape of our login form data.
 * This matches the LoginRequest type from our API.
 */
interface LoginFormData {
  email: string;
  password: string;
}

/**
 * LoginPage Component
 * 
 * This component demonstrates several important patterns:
 * 1. Form handling with React Hook Form
 * 2. API integration with React Query mutations
 * 3. Error handling (validation errors and API errors)
 * 4. Loading states and disabled buttons
 * 5. Navigation and redirects after successful login
 * 6. Responsive design with CSS Modules
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  /**
   * Get the page user was trying to access before being redirected to login
   * This allows us to redirect them back after successful login
   * 
   * Example: User tries to access /profile but isn't logged in
   * - They get redirected to /login with state: { from: '/profile' }
   * - After login, we redirect them to /profile instead of homepage
   */
  const from = (location.state as any)?.from?.pathname || '/';

  /**
   * React Hook Form Setup
   * 
   * register: Function to register input fields
   * handleSubmit: Wraps our submit handler with validation
   * formState: Contains errors, isSubmitting, etc.
   */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    mode: 'onBlur', // Validate on blur (when user leaves field)
  });

  /**
   * Form Submit Handler
   * 
   * This function is called when the form is submitted and passes validation.
   * 
   * @param data - Validated form data
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      // Call the login API
      await loginMutation.mutateAsync(data);
      
      // Success! Redirect to the page they were trying to access
      // or to homepage if they came directly to login
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by React Query and displayed below
      console.error('Login failed:', error);
    }
  };

  /**
   * Get API Error Message
   * 
   * Extract user-friendly error message from API error response.
   * The API returns errors in the format: { error: { message: string } }
   */
  const getErrorMessage = (): string | null => {
    if (!loginMutation.isError) return null;
    
    const error = loginMutation.error as any;
    
    // Check for specific error messages from the API
    if (error?.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    
    // Check for network errors
    if (error?.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    // Generic error message
    return 'Login failed. Please check your credentials and try again.';
  };

  /**
   * Login Form
   */
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>
            Sign in to your account to continue
          </p>
        </div>

        {/* API Error Message */}
        {loginMutation.isError && (
          <div className={styles.errorAlert} role="alert">
            <svg
              className={styles.errorIcon}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{getErrorMessage()}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Email Field */}
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            required
            autoComplete="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            })}
          />

          {/* Password Field */}
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            required
            autoComplete="current-password"
            {...register('password', {
              required: 'Password is required',
            })}
          />

          {/* Forgot Password Link */}
          <div className={styles.forgotPassword}>
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={isSubmitting || loginMutation.isPending}
            disabled={isSubmitting || loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Registration Link */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Don't have an account?{' '}
            <Link to="/register" className={styles.link}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
