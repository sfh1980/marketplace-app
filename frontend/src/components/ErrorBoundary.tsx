/**
 * ErrorBoundary Component
 * 
 * A React error boundary that catches JavaScript errors in child components,
 * logs them, and displays a fallback UI instead of crashing the entire app.
 * 
 * Error boundaries are implemented as class components because they use
 * lifecycle methods that aren't available in functional components.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * Best Practices:
 * - Place error boundaries at strategic points in your component tree
 * - Use multiple boundaries to isolate errors to specific sections
 * - Always provide a way for users to recover (reload, go back, etc.)
 * - Log errors to an error tracking service in production (e.g., Sentry)
 */

// React import is required for JSX in class components, even with new JSX transform
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { Component, ReactNode, ErrorInfo } from 'react';
import styles from './ErrorBoundary.module.css';
import { Button } from './Button';

// Props interface - allows customization of fallback UI
interface ErrorBoundaryProps {
  children: ReactNode;
  // Optional custom fallback UI
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  // Optional callback when error occurs (for logging to external services)
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// State interface - tracks error state
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Class Component
 * 
 * This component wraps other components and catches any errors that occur
 * during rendering, in lifecycle methods, or in constructors of child components.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    // Initial state - no error
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Static lifecycle method called when an error is thrown
   * 
   * This method is called during the "render" phase, so side effects are not allowed.
   * It updates the state to trigger a re-render with the fallback UI.
   * 
   * @param error - The error that was thrown
   * @returns New state object
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle method called after an error is caught
   * 
   * This method is called during the "commit" phase, so side effects are allowed.
   * Use this for logging errors to error reporting services.
   * 
   * @param error - The error that was thrown
   * @param errorInfo - Object with componentStack showing where error occurred
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details to console in development
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Call optional error callback (useful for sending to error tracking services)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to an error tracking service like Sentry:
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  /**
   * Reset error state to allow user to try again
   * 
   * This is useful when the error might be transient (network issue, etc.)
   * or when the user has taken action that might fix the problem.
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  /**
   * Reload the entire page
   * 
   * This is a more aggressive recovery option that clears all state
   * and starts fresh. Useful when the error is severe or persistent.
   */
  handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Navigate back to home page
   * 
   * Provides an escape route when the current page is broken.
   */
  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    // If there's an error, show fallback UI
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default fallback UI
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContent}>
            {/* Error icon */}
            <div className={styles.errorIcon}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            {/* Error message */}
            <h1 className={styles.errorTitle}>Oops! Something went wrong</h1>
            <p className={styles.errorMessage}>
              We're sorry, but something unexpected happened. This error has been logged
              and we'll look into it.
            </p>

            {/* Show error details in development mode */}
            {process.env.NODE_ENV === 'development' && (
              <details className={styles.errorDetails}>
                <summary className={styles.errorDetailsSummary}>
                  Error Details (Development Only)
                </summary>
                <pre className={styles.errorDetailsContent}>
                  <code>{this.state.error.toString()}</code>
                  {this.state.error.stack && (
                    <>
                      {'\n\n'}
                      <code>{this.state.error.stack}</code>
                    </>
                  )}
                </pre>
              </details>
            )}

            {/* Recovery actions */}
            <div className={styles.errorActions}>
              <Button onClick={this.resetError} variant="primary">
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="secondary">
                Go to Home
              </Button>
              <Button onClick={this.handleReload} variant="secondary">
                Reload Page
              </Button>
            </div>

            {/* Help text */}
            <p className={styles.errorHelp}>
              If this problem persists, please contact support or try again later.
            </p>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
