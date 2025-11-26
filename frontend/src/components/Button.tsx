/**
 * Button Component
 * 
 * A reusable button component that supports different variants, sizes, and states.
 * This component follows the design system and provides consistent button styling across the app.
 * 
 * Features:
 * - Multiple variants (primary, secondary, outline, ghost, danger)
 * - Multiple sizes (small, medium, large)
 * - Loading state with spinner
 * - Disabled state
 * - Full width option
 * - Icon support (left or right)
 * - Accessible (proper ARIA attributes, keyboard navigation)
 * 
 * Usage:
 * <Button variant="primary" size="medium" onClick={handleClick}>
 *   Click Me
 * </Button>
 * 
 * <Button variant="outline" loading={isLoading}>
 *   Submit
 * </Button>
 */

import React from 'react';
import styles from './Button.module.css';

/**
 * Button Props Interface
 * 
 * TypeScript interface defines all props the Button component accepts.
 * This provides type safety and autocomplete in your IDE.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  
  /** Size of the button */
  size?: 'small' | 'medium' | 'large';
  
  /** Whether the button should take full width of its container */
  fullWidth?: boolean;
  
  /** Show loading spinner and disable interaction */
  loading?: boolean;
  
  /** Icon to display before the button text */
  leftIcon?: React.ReactNode;
  
  /** Icon to display after the button text */
  rightIcon?: React.ReactNode;
  
  /** Button content (text, icons, etc.) */
  children: React.ReactNode;
}

/**
 * Button Component
 * 
 * This component demonstrates several React and CSS best practices:
 * 1. TypeScript for type safety
 * 2. CSS Modules for scoped styling
 * 3. Composition of className using template literals
 * 4. Spreading props for flexibility (...rest)
 * 5. Conditional rendering (loading spinner)
 * 6. Accessibility (disabled state, aria-busy)
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  children,
  ...rest // Spread operator captures all other props (onClick, type, etc.)
}) => {
  /**
   * Build className string by combining multiple CSS Module classes
   * 
   * This technique allows us to:
   * - Apply base button styles (styles.button)
   * - Apply variant styles (styles[`button--${variant}`])
   * - Apply size styles (styles[`button--${size}`])
   * - Apply conditional styles (fullWidth, loading)
   * - Allow custom classes from parent (className prop)
   * 
   * The filter(Boolean) removes any undefined/null values
   * The join(' ') combines all classes into a single string
   */
  const buttonClasses = [
    styles.button,                          // Base button styles
    styles[`button--${variant}`],           // Variant styles (primary, secondary, etc.)
    styles[`button--${size}`],              // Size styles (small, medium, large)
    fullWidth && styles['button--fullWidth'], // Full width modifier
    loading && styles['button--loading'],   // Loading state modifier
    className                               // Custom classes from parent
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading} // Disable button when loading or explicitly disabled
      aria-busy={loading}            // Accessibility: Announce loading state to screen readers
      {...rest}                      // Spread remaining props (onClick, type, etc.)
    >
      {/* Show loading spinner when loading prop is true */}
      {loading && (
        <span className={styles.button__spinner} aria-hidden="true">
          {/* Simple CSS-animated spinner */}
          <svg className={styles.spinner} viewBox="0 0 24 24">
            <circle
              className={styles.spinner__circle}
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            />
          </svg>
        </span>
      )}
      
      {/* Left icon (if provided) */}
      {leftIcon && !loading && (
        <span className={styles.button__icon} aria-hidden="true">
          {leftIcon}
        </span>
      )}
      
      {/* Button content (text, elements, etc.) */}
      <span className={styles.button__content}>
        {children}
      </span>
      
      {/* Right icon (if provided) */}
      {rightIcon && !loading && (
        <span className={styles.button__icon} aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

export default Button;
