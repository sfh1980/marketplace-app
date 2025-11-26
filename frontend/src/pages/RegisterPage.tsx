/**
 * Registration Page
 * 
 * This page allows new users to create an account on the marketplace platform.
 * 
 * Features:
 * - Form validation (email format, password strength, required fields)
 * - Real-time validation feedback
 * - Loading state during registration
 * - Error handling with user-friendly messages
 * - Success state with redirect to email verification notice
 * - Link to login page for existing users
 * 
 * Form Handling Approach:
 * We use React Hook Form for efficient form management because:
 * - Minimal re-renders (better performance)
 * - Built-in validation
 * - Easy error handling
 * - Less boilerplate code compared to manual state management
 * 
 * Validation Rules:
 * - Email: Must be valid email format
 * - Username: 3-20 characters, alphanumeric and underscores only
 * - Password: Minimum 8 characters, must include uppercase, lowercase, and number
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useRegister } from '../hooks/useAuth';
import styles from './RegisterPage.module.css';

/**
 * Form Data Interface
 * 
 * Defines the shape of our registration form data.
 * This matches the RegisterRequest type from our API.
 */
interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string; // Not sent to API, just for validation
}

/**
 * RegisterPage Component
 * 
 * This component demonstrates several important patterns:
 * 1. Form handling with React Hook Form
 * 2. API integration with React Query mutations
 * 3. Error handling (validation errors and API errors)
 * 4. Loading states and disabled buttons
 * 5. Success states and navigation
 * 6. Responsive design with CSS Modules
 */
export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [showSuccess, setShowSuccess] = useState(false);

  /**
   * React Hook Form Setup
   * 
   * register: Function to register input fields
   * handleSubmit: Wraps our submit handler with validation
   * formState: Contains errors, isSubmitting, etc.
   * watch: Watch specific form fields (used for password confirmation)
   */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterFormData>({
    mode: 'onBlur', // Validate on blur (when user leaves field)
  });

  /**
   * Watch password field for confirmation validation
   * 
   * We need to compare confirmPassword with password,
   * so we "watch" the password field to get its current value.
   */
  const password = watch('password');

  /**
   * Form Submit Handler
   * 
   * This function is called when the form is submitted and passes validation.
   * 
   * @param data - Validated form data
   */
  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Call the registration API
      // We don't send confirmPassword to the API
      const { confirmPassword, ...registerData } = data;
      
      await registerMutation.mutateAsync(registerData);
      
      // Show success message
      setShowSuccess(true);
      
      // Redirect to email verification notice after 2 seconds
      setTimeout(() => {
        navigate('/verify-email-notice');
      }, 2000);
    } catch (error) {
      // Error is handled by React Query and displayed below
      console.error('Registration failed:', error);
    }
  };

  /**
   * Get API Error Message
   * 
   * Extract user-friendly error message from API error response.
   * The API returns errors in the format: { error: { message: string } }
   */
  const getErrorMessage = (): string | null => {
    if (!registerMutation.isError) return null;
    
    const error = registerMutation.error as any;
    
    // Check for specific error messages from the API
    if (error?.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    
    // Check for network errors
    if (error?.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    // Generic error message
    return 'Registration failed. Please try again.';
  };

  /**
   * Success State
   * 
   * Show success message after successful registration.
   * This provides immediate feedback before redirecting.
   */
  if (showSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h1 className={styles.successTitle}>Registration Successful!</h1>
          <p className={styles.successMessage}>
            We've sent a verification email to your inbox.
            Please check your email and click the verification link to activate your account.
          </p>
          <p className={styles.successSubtext}>
            Redirecting you to the verification notice...
          </p>
        </div>
      </div>
    );
  }

  /**
   * Registration Form
   */
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Create Your Account</h1>
          <p className={styles.subtitle}>
            Join our marketplace to buy and sell items and services
          </p>
        </div>

        {/* API Error Message */}
        {registerMutation.isError && (
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Email Field */}
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            required
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            })}
          />

          {/* Username Field */}
          <Input
            label="Username"
            type="text"
            placeholder="johndoe"
            helperText="3-20 characters, letters, numbers, and underscores only"
            error={errors.username?.message}
            required
            {...register('username', {
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters',
              },
              maxLength: {
                value: 20,
                message: 'Username must be no more than 20 characters',
              },
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: 'Username can only contain letters, numbers, and underscores',
              },
            })}
          />

          {/* Password Field */}
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            helperText="At least 8 characters with uppercase, lowercase, and number"
            error={errors.password?.message}
            required
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                message: 'Password must include uppercase, lowercase, and number',
              },
            })}
          />

          {/* Confirm Password Field */}
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            required
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            })}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={isSubmitting || registerMutation.isPending}
            disabled={isSubmitting || registerMutation.isPending}
          >
            {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Login Link */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Already have an account?{' '}
            <Link to="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Terms and Privacy Notice */}
      <p className={styles.legalNotice}>
        By creating an account, you agree to our{' '}
        <a href="/terms" className={styles.legalLink}>
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className={styles.legalLink}>
          Privacy Policy
        </a>
      </p>
    </div>
  );
};

export default RegisterPage;
