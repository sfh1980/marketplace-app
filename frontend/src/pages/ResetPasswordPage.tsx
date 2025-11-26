/**
 * Reset Password Page (Step 2 of Password Reset Flow)
 * 
 * This page allows users to set a new password using the token from their email.
 * 
 * Multi-Step Flow - Step 2:
 * 1. User clicks link in email (contains token in URL)
 * 2. This page extracts token from URL parameters
 * 3. User enters and confirms new password
 * 4. System validates token and updates password
 * 5. User is redirected to login page
 * 
 * Features:
 * - Token extraction from URL query parameters
 * - Password validation (strength requirements)
 * - Password confirmation matching
 * - Real-time validation feedback
 * - Loading state during API call
 * - Success/error handling
 * - Automatic redirect to login after success
 * 
 * URL Structure:
 * /reset-password?token=abc123xyz
 * 
 * We use React Router's useSearchParams to extract the token:
 * ```tsx
 * const [searchParams] = useSearchParams();
 * const token = searchParams.get('token');
 * ```
 * 
 * Security Considerations:
 * - Token is validated on backend
 * - Token expires after 1 hour
 * - Token can only be used once
 * - Password must meet strength requirements
 * - Old password is invalidated after reset
 * 
 * Why Multi-Step?
 * This is Step 2 of the password reset flow:
 * - Step 1 (ForgotPasswordPage): User requests reset
 * - Email sent with secure token
 * - Step 2 (This page): User sets new password with token
 * 
 * This separation ensures:
 * - User owns the email address
 * - Only email recipient can reset password
 * - Time-limited security window
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { resetPassword } from '../services/authService';
import styles from './ResetPasswordPage.module.css';

/**
 * Form Data Interface
 */
interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

/**
 * ResetPasswordPage Component
 * 
 * This demonstrates:
 * 1. URL parameter extraction
 * 2. Form validation with password matching
 * 3. Async API calls with error handling
 * 4. Success state with auto-redirect
 * 5. Multi-step flow completion
 */
export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  
  /**
   * Extract token from URL query parameters
   * 
   * Example URL: /reset-password?token=abc123xyz
   * searchParams.get('token') returns 'abc123xyz'
   */
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // State management
  const [resetSuccess, setResetSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);

  /**
   * React Hook Form Setup
   */
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    mode: 'onBlur',
  });

  // Watch password field for confirmation validation
  const password = watch('password');

  /**
   * Auto-redirect countdown after successful reset
   * 
   * After password is reset, we count down 5 seconds
   * then automatically redirect to login page.
   */
  useEffect(() => {
    if (resetSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resetSuccess && countdown === 0) {
      navigate('/login');
    }
  }, [resetSuccess, countdown, navigate]);

  /**
   * Form Submit Handler
   * 
   * Validates token and updates password.
   * 
   * @param data - Validated form data containing new password
   */
  const onSubmit = async (data: ResetPasswordFormData) => {
    // Check if token exists
    if (!token) {
      setApiError('Invalid or missing reset token. Please request a new password reset.');
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

      // Call the API to reset password
      await resetPassword(token, data.password);

      // Success! Show success message and start countdown
      setResetSuccess(true);
    } catch (error: any) {
      console.error('Password reset failed:', error);

      // Extract error message
      if (error?.response?.data?.error?.message) {
        setApiError(error.response.data.error.message);
      } else if (error?.message === 'Network Error') {
        setApiError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setApiError('Failed to reset password. The link may have expired. Please request a new reset.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Invalid Token View
   * 
   * Shown when no token is present in URL.
   */
  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Error Icon */}
          <div className={styles.errorIconLarge}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className={styles.header}>
            <h1 className={styles.title}>Invalid Reset Link</h1>
            <p className={styles.subtitle}>
              This password reset link is invalid or has expired.
            </p>
          </div>

          <div className={styles.actions}>
            <Link to="/forgot-password">
              <Button variant="primary" size="large" fullWidth>
                Request New Reset Link
              </Button>
            </Link>
            <Link to="/login" className={styles.backLink}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Success View
   * 
   * Shown after password is successfully reset.
   * Includes countdown timer before auto-redirect.
   */
  if (resetSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Success Icon */}
          <div className={styles.successIcon}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className={styles.header}>
            <h1 className={styles.title}>Password Reset Successful!</h1>
            <p className={styles.subtitle}>
              Your password has been updated. You can now log in with your new
              password.
            </p>
          </div>

          <div className={styles.countdown}>
            Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
          </div>

          <div className={styles.actions}>
            <Link to="/login">
              <Button variant="primary" size="large" fullWidth>
                Go to Login Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Reset Form View
   * 
   * Main view where user enters new password.
   */
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Set New Password</h1>
          <p className={styles.subtitle}>
            Enter your new password below. Make sure it's strong and secure.
          </p>
        </div>

        {/* API Error Message */}
        {apiError && (
          <div className={styles.errorAlert} role="alert">
            <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        {/* Reset Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* New Password Field */}
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            required
            autoComplete="new-password"
            autoFocus
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain uppercase, lowercase, and number',
              },
            })}
          />

          {/* Confirm Password Field */}
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            required
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            })}
          />

          {/* Password Requirements */}
          <div className={styles.requirements}>
            <p className={styles.requirementsTitle}>Password must contain:</p>
            <ul className={styles.requirementsList}>
              <li>At least 8 characters</li>
              <li>One uppercase letter</li>
              <li>One lowercase letter</li>
              <li>One number</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </form>

        {/* Back to Login Link */}
        <div className={styles.footer}>
          <Link to="/login" className={styles.backLink}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
