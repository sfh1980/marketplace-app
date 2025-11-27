/**
 * LoadingSpinner Component
 * 
 * A reusable loading indicator that provides visual feedback during async operations.
 * 
 * Key Features:
 * - Animated spinner for visual feedback
 * - Optional loading message
 * - Multiple size variants (small, medium, large)
 * - Accessible with ARIA labels
 * - Centered layout option
 * 
 * Educational Focus:
 * - Loading States: Why they matter for UX
 * - CSS Animations: Creating smooth, performant animations
 * - Component Variants: Flexible, reusable design
 * - Accessibility: Screen reader support
 * 
 * UX Best Practices:
 * 1. Always show loading states for async operations
 * 2. Provide context with loading messages
 * 3. Use appropriate size for the context
 * 4. Ensure animations are smooth and not distracting
 * 5. Make loading states accessible to screen readers
 * 
 * Usage Examples:
 * ```tsx
 * // Simple spinner
 * <LoadingSpinner />
 * 
 * // With message
 * <LoadingSpinner message="Loading your listings..." />
 * 
 * // Small size for inline use
 * <LoadingSpinner size="small" />
 * 
 * // Centered in container
 * <LoadingSpinner centered message="Please wait..." />
 * ```
 */

import React from 'react';
import styles from './LoadingSpinner.module.css';

/**
 * LoadingSpinner Props
 */
export interface LoadingSpinnerProps {
  /** Optional loading message to display below spinner */
  message?: string;
  
  /** Size variant of the spinner */
  size?: 'small' | 'medium' | 'large';
  
  /** Whether to center the spinner in its container */
  centered?: boolean;
  
  /** Additional CSS class name */
  className?: string;
}

/**
 * LoadingSpinner Component
 * 
 * Displays an animated spinner with optional message.
 * 
 * Why Spinners?
 * - Indicate that something is happening (prevents user confusion)
 * - Show that the app is working, not frozen
 * - Reduce perceived wait time (users are more patient when they see progress)
 * - Provide visual feedback for async operations
 * 
 * Animation Considerations:
 * - Use CSS animations (GPU-accelerated, performant)
 * - Keep animations smooth (60fps)
 * - Don't make animations too fast or too slow
 * - Consider reduced motion preferences for accessibility
 * 
 * @param props - Component props
 * @returns LoadingSpinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'medium',
  centered = false,
  className = '',
}) => {
  /**
   * Build CSS class names based on props
   * 
   * This pattern allows flexible styling while maintaining consistency.
   * Each variant has its own CSS class for size-specific styles.
   */
  const containerClasses = [
    styles.container,
    centered && styles.centered,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const spinnerClasses = [
    styles.spinner,
    styles[`spinner${size.charAt(0).toUpperCase()}${size.slice(1)}`],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      {/* 
        Spinner Element
        
        The spinner is a simple div with CSS animation.
        We use a border-based spinner (common pattern):
        - Circular border with one section colored
        - Rotate animation creates spinning effect
        - GPU-accelerated for smooth performance
        
        Accessibility:
        - role="status" indicates dynamic content
        - aria-live="polite" announces changes to screen readers
        - aria-label provides context for screen readers
      */}
      <div 
        className={spinnerClasses}
        aria-label={message || 'Loading'}
      />
      
      {/* 
        Loading Message
        
        Optional text message provides context about what's loading.
        Examples:
        - "Loading your listings..."
        - "Sending message..."
        - "Updating profile..."
        
        Why Messages Matter:
        - Give users context about what's happening
        - Reduce anxiety during long operations
        - Make the app feel more responsive
        - Help users understand if something is taking too long
      */}
      {message && (
        <p className={styles.message}>
          {message}
        </p>
      )}
      
      {/* 
        Screen Reader Text
        
        Hidden text for screen readers when no message is provided.
        This ensures all users get feedback about loading state.
      */}
      {!message && (
        <span className={styles.srOnly}>
          Loading...
        </span>
      )}
    </div>
  );
};

/**
 * Display name for debugging
 */
LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
