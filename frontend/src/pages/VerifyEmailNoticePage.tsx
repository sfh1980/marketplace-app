/**
 * Email Verification Notice Page
 * 
 * This page is shown after successful registration to inform users
 * that they need to verify their email address.
 * 
 * Features:
 * - Clear instructions for email verification
 * - Link to resend verification email (future enhancement)
 * - Link to login page
 * - Helpful tips about checking spam folder
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import styles from './VerifyEmailNoticePage.module.css';

export const VerifyEmailNoticePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Email Icon */}
        <div className={styles.iconWrapper}>
          <svg
            className={styles.icon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Header */}
        <h1 className={styles.title}>Check Your Email</h1>
        <p className={styles.message}>
          We've sent a verification link to your email address.
          Please click the link in the email to verify your account and complete registration.
        </p>

        {/* Instructions */}
        <div className={styles.instructions}>
          <h2 className={styles.instructionsTitle}>What to do next:</h2>
          <ol className={styles.instructionsList}>
            <li>Check your email inbox for a message from us</li>
            <li>Click the verification link in the email</li>
            <li>You'll be redirected to log in to your account</li>
          </ol>
        </div>

        {/* Tips */}
        <div className={styles.tips}>
          <p className={styles.tipsTitle}>
            <strong>Didn't receive the email?</strong>
          </p>
          <ul className={styles.tipsList}>
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes - emails can sometimes be delayed</li>
          </ul>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Link to="/login">
            <Button variant="primary" size="large" fullWidth>
              Go to Login
            </Button>
          </Link>
          
          {/* Future enhancement: Resend verification email */}
          {/* <Button variant="outline" size="large" fullWidth>
            Resend Verification Email
          </Button> */}
        </div>

        {/* Help Link */}
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

export default VerifyEmailNoticePage;
