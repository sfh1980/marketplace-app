/**
 * Email Verification Page
 * 
 * This page handles email verification when users click the link in their email.
 * It extracts the verification token from the URL, sends it to the backend,
 * and displays the verification result.
 * 
 * Educational Concepts:
 * - URL Parameters: Reading query parameters from the URL
 * - useEffect: Running side effects when component mounts
 * - Async/Await: Handling asynchronous API calls
 * - State Management: Managing loading, success, and error states
 * - Conditional Rendering: Showing different UI based on state
 * 
 * URL Format: /verify-email?token=abc123xyz
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../services/authService';
import { Button } from '../components/Button';
import styles from './VerifyEmailPage.module.css';

/**
 * Verification states the page can be in
 */
type VerificationState = 'verifying' | 'success' | 'error';

export const VerifyEmailPage: React.FC = () => {
  // useSearchParams hook gives us access to URL query parameters
  // Example: /verify-email?token=abc123 -> searchParams.get('token') returns 'abc123'
  const [searchParams] = useSearchParams();
  
  // useNavigate hook allows us to programmatically navigate to other pages
  const navigate = useNavigate();
  
  // State to track the verification process
  const [state, setState] = useState<VerificationState>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  /**
   * useEffect runs when the component mounts (and when dependencies change)
   * 
   * Why we use it here:
   * - We need to verify the email as soon as the page loads
   * - We only want to do this once, not on every render
   * - The empty dependency array [] means "run once on mount"
   */
  useEffect(() => {
    const verifyUserEmail = async () => {
      // Extract the token from URL parameters
      const token = searchParams.get('token');
      
      // If no token in URL, show error immediately
      if (!token) {
        setState('error');
        setErrorMessage('No verification token provided. Please check your email link.');
        return;
      }
      
      try {
        // Call the backend API to verify the email
        // This is an async operation, so we use await
        await verifyEmail(token);
        
        // If successful, update state to show success message
        setState('success');
        
        // After 3 seconds, automatically redirect to login page
        // This gives users time to read the success message
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        
      } catch (error: any) {
        // If verification fails, show error message
        setState('error');
        
        // Extract error message from API response
        // The backend sends error messages in error.response.data.error.message
        const message = error.response?.data?.error?.message || 
                       'Verification failed. The link may be expired or invalid.';
        setErrorMessage(message);
      }
    };
    
    // Call the verification function
    verifyUserEmail();
  }, [searchParams, navigate]); // Dependencies: re-run if these change
  
  /**
   * Conditional Rendering: Show different UI based on current state
   * 
   * This is a common pattern in React:
   * - Check the state
   * - Return different JSX based on that state
   * - Provides clear user feedback for each scenario
   */
  
  // Loading state: Show spinner while verifying
  if (state === 'verifying') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Loading Spinner */}
          <div className={styles.iconWrapper}>
            <div className={styles.spinner}></div>
          </div>
          
          <h1 className={styles.title}>Verifying Your Email</h1>
          <p className={styles.message}>
            Please wait while we verify your email address...
          </p>
        </div>
      </div>
    );
  }
  
  // Success state: Show success message and redirect info
  if (state === 'success') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Success Icon (Checkmark) */}
          <div className={styles.iconWrapper}>
            <svg
              className={`${styles.icon} ${styles.iconSuccess}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          
          <h1 className={styles.title}>Email Verified!</h1>
          <p className={styles.message}>
            Your email has been successfully verified. You can now log in to your account.
          </p>
          
          <p className={styles.redirectMessage}>
            Redirecting to login page in 3 seconds...
          </p>
          
          {/* Manual navigation option */}
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
  
  // Error state: Show error message and help options
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Error Icon (X in circle) */}
        <div className={styles.iconWrapper}>
          <svg
            className={`${styles.icon} ${styles.iconError}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h1 className={styles.title}>Verification Failed</h1>
        <p className={styles.message}>
          {errorMessage}
        </p>
        
        {/* Help section */}
        <div className={styles.helpSection}>
          <h2 className={styles.helpTitle}>What you can do:</h2>
          <ul className={styles.helpList}>
            <li>Request a new verification email from the registration page</li>
            <li>Check that you clicked the most recent verification link</li>
            <li>Make sure the entire link was copied if you pasted it manually</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>
        
        {/* Actions */}
        <div className={styles.actions}>
          <Link to="/register">
            <Button variant="primary" size="large" fullWidth>
              Back to Registration
            </Button>
          </Link>
          
          <Link to="/login">
            <Button variant="outline" size="large" fullWidth>
              Try Logging In
            </Button>
          </Link>
        </div>
        
        {/* Support link */}
        <p className={styles.helpText}>
          Need help?{' '}
          <a href="/support" className={styles.link}>
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
