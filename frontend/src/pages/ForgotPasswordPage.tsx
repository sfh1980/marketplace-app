/**
 * Forgot Password Page (Step 1 of Password Reset Flow)
 * 
 * This page allows users to request a password reset by entering their email address.
 * 
 * Multi-Step Flow - Step 1:
 * 1. User enters their email address
 * 2. System sends password reset email with a secure token
 * 3. User receives email with link to reset password page
 * 4. User clicks link and proceeds to Step 2 (ResetPasswordPage)
 * 
 * Features:
 * - Email validation
 * - Loading state during API call
 * - Success message after email is sent
 * - Error handling for invalid emails or API failures
 * - Link back to login page
 * 
 * Security Considerations:
 * - We don't reveal whether an email exists in our system (prevents email enumeration)
 * - Token is time-limited (expires after 1 hour)
 * - Token can only be used once
 * - Rate limiting prevents abuse
 * 
 * Why Multi-Step?
 * Separating the request and reset into two steps provides security:
 * - Verifies user owns the email address
 * - Prevents unauthorized password changes
 * - Gives user time to access their email
 * - Token in URL ensures only email recipient can reset password
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { requestPasswordReset } from '../services/authService';
import styles from './ForgotPasswordPage.module.css';

/**
 * Form Data Interface
 */
interface ForgotPasswordFormData {
  email: string;
}

/**
 * ForgotPasswordPage Component
 * 
 * This demonstrates:
 * 1. Form handling with validation
 * 2. Async API calls with loading states
 * 3. Success/error state management
 * 4. User feedback and messaging
 * 5. Multi-step flow initiation
 */
export const ForgotPasswordPage: React.FC = () => {
  // State to track if email was sent successfully
  const [emailSent, setEmailSent] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * React Hook Form Setup
   */
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    mode: 'onBlur',
  });

  /**
   * Form Submit Handler
   * 
   * Calls the password reset API and handles the response.
   * 
   * @param data - Validated form data containing email
   */
  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setApiError(null);

      // Call the API to request password reset
      await requestPasswordReset(data.email);

      // Success! Show success message
      setEmailSent(true);
    } catch (error: any) {
      console.error('Password reset request failed:', error);

      // Extract error message
      if (error?.response?.data?.error?.message) {
        setApiError(error.response.data.error.message);
      } else if (error?.message === 'Network Error') {
        setApiError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setApiError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Success View
   * 
   * Shown after email is successfully sent.
   * Provides clear instructions for next steps.
   */
  if (emailSent) {
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

          {/* Success Message */}
          <div className={styles.header}>
            <h1 className={styles.title}>Check Your Email</h1>
            <p className={styles.subtitle}>
              We've sent password reset instructions to{' '}
              <strong>{getValues('email')}</strong>
            </p>
          </div>

          {/* Instructions */}
          <div className={styles.instructions}>
            <p>
              Click the link in the email to reset your password. The link will
              expire in 1 hour for security reasons.
            </p>
            <p className={styles.instructionsNote}>
              <strong>Didn't receive the email?</strong> Check your spam folder
              or try requesting another reset.
            </p>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              variant="secondary"
              size="large"
              fullWidth
              onClick={() => setEmailSent(false)}
            >
              Send Another Email
            </Button>
            <Link to="/login" className={styles.backLink}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Request Form View
   * 
   * Initial view where user enters their email.
   */
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Forgot Password?</h1>
          <p className={styles.subtitle}>
            No worries! Enter your email address and we'll send you instructions
            to reset your password.
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

        {/* Request Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Email Field */}
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            required
            autoComplete="email"
            autoFocus
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            })}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Instructions'}
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

export default ForgotPasswordPage;
