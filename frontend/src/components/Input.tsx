/**
 * Input Component
 * 
 * A reusable input component with validation states, labels, and helper text.
 * This component provides a consistent input experience across the app.
 * 
 * Features:
 * - Multiple input types (text, email, password, number, etc.)
 * - Label support
 * - Helper text for guidance
 * - Error state with error message
 * - Success state
 * - Disabled state
 * - Required field indicator
 * - Icon support (left or right)
 * - Full width by default
 * - Accessible (proper ARIA attributes, label association)
 * 
 * Usage:
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={emailError}
 *   required
 * />
 */

import React, { forwardRef } from 'react';
import styles from './Input.module.css';

/**
 * Input Props Interface
 * 
 * Extends native HTML input attributes and adds custom props
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  
  /** Helper text displayed below the input (guidance, hints) */
  helperText?: string;
  
  /** Error message to display (also sets error state) */
  error?: string;
  
  /** Success state (shows green border and checkmark) */
  success?: boolean;
  
  /** Icon to display on the left side of the input */
  leftIcon?: React.ReactNode;
  
  /** Icon to display on the right side of the input */
  rightIcon?: React.ReactNode;
  
  /** Custom class name for the wrapper */
  wrapperClassName?: string;
}

/**
 * Input Component
 * 
 * Using forwardRef allows parent components to access the input element directly.
 * This is useful for:
 * - Focus management (focusing the input programmatically)
 * - Form libraries that need direct DOM access
 * - Integrating with third-party libraries
 * 
 * Example: const inputRef = useRef(); <Input ref={inputRef} />
 * Then: inputRef.current.focus()
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      leftIcon,
      rightIcon,
      required,
      disabled,
      className = '',
      wrapperClassName = '',
      id,
      ...rest
    },
    ref
  ) => {
    /**
     * Generate unique ID for input-label association
     * 
     * If no ID is provided, we generate one to ensure proper accessibility.
     * The label's htmlFor attribute must match the input's id attribute.
     * This allows clicking the label to focus the input.
     */
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    /**
     * Determine the current state of the input
     * Priority: error > success > default
     */
    const hasError = Boolean(error);
    const hasSuccess = success && !hasError;
    
    /**
     * Build wrapper classes
     */
    const wrapperClasses = [
      styles.input__wrapper,
      wrapperClassName
    ].filter(Boolean).join(' ');
    
    /**
     * Build input container classes
     * The container holds the input and icons
     */
    const containerClasses = [
      styles.input__container,
      hasError && styles['input__container--error'],
      hasSuccess && styles['input__container--success'],
      disabled && styles['input__container--disabled'],
      leftIcon && styles['input__container--hasLeftIcon'],
      rightIcon && styles['input__container--hasRightIcon']
    ].filter(Boolean).join(' ');
    
    /**
     * Build input classes
     */
    const inputClasses = [
      styles.input,
      leftIcon && styles['input--hasLeftIcon'],
      rightIcon && styles['input--hasRightIcon'],
      className
    ].filter(Boolean).join(' ');

    return (
      <div className={wrapperClasses}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className={styles.input__label}>
            {label}
            {/* Required indicator */}
            {required && (
              <span className={styles.input__required} aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        {/* Input container (holds input and icons) */}
        <div className={containerClasses}>
          {/* Left icon */}
          {leftIcon && (
            <span className={styles.input__icon} aria-hidden="true">
              {leftIcon}
            </span>
          )}
          
          {/* Input element */}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : 
              helperText ? `${inputId}-helper` : 
              undefined
            }
            {...rest}
          />
          
          {/* Right icon or status icon */}
          {rightIcon && !hasError && !hasSuccess && (
            <span className={styles.input__icon} aria-hidden="true">
              {rightIcon}
            </span>
          )}
          
          {/* Success checkmark icon */}
          {hasSuccess && (
            <span className={styles.input__statusIcon} aria-hidden="true">
              <svg
                className={styles.input__successIcon}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
          
          {/* Error icon */}
          {hasError && (
            <span className={styles.input__statusIcon} aria-hidden="true">
              <svg
                className={styles.input__errorIcon}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className={styles.input__error}
            role="alert"
          >
            {error}
          </p>
        )}
        
        {/* Helper text (only show if no error) */}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className={styles.input__helper}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

// Display name for debugging (useful in React DevTools)
Input.displayName = 'Input';

export default Input;
