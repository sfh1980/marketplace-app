/**
 * ErrorMessage Component
 * 
 * A reusable error display component that shows user-friendly error messages
 * with optional retry functionality.
 * 
 * Key Features:
 * - Clear error messaging
 * - Optional retry button
 * - Optional custom actions
 * - Multiple severity levels (error, warning, info)
 * - Accessible with ARIA roles
 * 
 * Educational Focus:
 * - Error Handling: How to communicate errors to users
 * - User Experience: Making errors helpful, not frustrating
 * - Recovery Actions: Giving users ways to fix problems
 * - Accessibility: Ensuring errors are announced to screen readers
 * 
 * UX Best Practices:
 * 1. Use clear, non-technical language
 * 2. Explain what went wrong
 * 3. Provide actionable next steps
 * 4. Offer retry options when appropriate
 * 5. Don't blame the user
 * 6. Be specific but not overwhelming
 * 
 * Error Message Guidelines:
 * - Bad: "Error 500"
 * - Good: "We couldn't load your listings. Please try again."
 * 
 * - Bad: "Network request failed"
 * - Good: "Connection problem. Check your internet and try again."
 * 
 * - Bad: "Invalid input"
 * - Good: "Please enter a valid email address"
 * 
 * Usage Examples:
 * ```tsx
 * // Simple error
 * <ErrorMessage message="Failed to load data" />
 * 
 * // With retry button
 * <ErrorMessage 
 *   message="Failed to load listings"
 *   onRetry={() => refetch()}
 * />
 * 
 * // With custom actions
 * <ErrorMessage 
 *   title="Page Not Found"
 *   message="The page you're looking for doesn't exist."
 *   actions={
 *     <Button onClick={() => navigate('/')}>Go Home</Button>
 *   }
 * />
 * 
 * // Warning variant
 * <ErrorMessage 
 *   variant="warning"
 *   message="Your session is about to expire"
 * />
 * ```
 */

import React from 'react';
import { Button } from './Button';
import styles from './ErrorMessage.module.css';

/**
 * ErrorMessage Props
 */
export interface ErrorMessageProps {
  /** Error title (optional, defaults based on variant) */
  title?: string;
  
  /** Error message to display */
  message: string;
  
  /** Optional detailed error information */
  details?: string;
  
  /** Severity level of the error */
  variant?: 'error' | 'warning' | 'info';
  
  /** Optional retry callback */
  onRetry?: () => void;
  
  /** Optional custom action buttons */
  actions?: React.ReactNode;
  
  /** Whether to show the error icon */
  showIcon?: boolean;
  
  /** Additional CSS class name */
  className?: string;
}

/**
 * ErrorMessage Component
 * 
 * Displays error messages with appropriate styling and actions.
 * 
 * Why Good Error Messages Matter:
 * - Reduce user frustration
 * - Help users recover from errors
 * - Build trust (transparent about problems)
 * - Improve user experience
 * - Reduce support requests
 * 
 * Error Message Structure:
 * 1. Icon: Visual indicator of error type
 * 2. Title: Brief summary of the problem
 * 3. Message: Clear explanation of what happened
 * 4. Details: Technical details (optional, for debugging)
 * 5. Actions: Ways to recover (retry, go back, etc.)
 * 
 * @param props - Component props
 * @returns ErrorMessage component
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  details,
  variant = 'error',
  onRetry,
  actions,
  showIcon = true,
  className = '',
}) => {
  /**
   * Get default title based on variant
   * 
   * Provides sensible defaults while allowing customization.
   */
  const getDefaultTitle = (): string => {
    if (title) return title;
    
    switch (variant) {
      case 'error':
        return 'Something Went Wrong';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Notice';
    }
  };

  /**
   * Get icon based on variant
   * 
   * Visual indicators help users quickly understand the severity.
   */
  const getIcon = (): string => {
    switch (variant) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  /**
   * Build CSS class names
   */
  const containerClasses = [
    styles.container,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div 
      className={containerClasses}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      {showIcon && (
        <div className={styles.icon} aria-hidden="true">
          {getIcon()}
        </div>
      )}
      
      {/* Content */}
      <div className={styles.content}>
        {/* Title */}
        <h2 className={styles.title}>
          {getDefaultTitle()}
        </h2>
        
        {/* Message */}
        <p className={styles.message}>
          {message}
        </p>
        
        {/* Details (optional, for technical information) */}
        {details && (
          <details className={styles.details}>
            <summary className={styles.detailsSummary}>
              Technical Details
            </summary>
            <p className={styles.detailsContent}>
              {details}
            </p>
          </details>
        )}
        
        {/* Actions */}
        {(onRetry || actions) && (
          <div className={styles.actions}>
            {/* Retry Button */}
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="primary"
                size="small"
              >
                Try Again
              </Button>
            )}
            
            {/* Custom Actions */}
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Display name for debugging
 */
ErrorMessage.displayName = 'ErrorMessage';

export default ErrorMessage;
