/**
 * Validation Utilities
 * 
 * Centralized validation functions for user input.
 * 
 * Why validate?
 * 1. Security: Prevent malicious input
 * 2. Data Quality: Ensure data meets requirements
 * 3. User Experience: Provide clear error messages
 * 4. Database Integrity: Prevent invalid data from being stored
 * 
 * Validation happens at multiple layers:
 * - Client-side: Immediate feedback (can be bypassed)
 * - Server-side: Security boundary (MUST validate here)
 * - Database: Final constraint enforcement
 */

/**
 * Validation result interface
 * Contains both validity status and error message
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 * 
 * Uses a regex pattern to check for valid email structure.
 * 
 * Pattern breakdown:
 * ^[^\s@]+  - Start with one or more non-whitespace, non-@ characters
 * @         - Literal @ symbol
 * [^\s@]+   - One or more non-whitespace, non-@ characters
 * \.        - Literal dot
 * [^\s@]+$  - End with one or more non-whitespace, non-@ characters
 * 
 * This is a simple pattern. For production, consider:
 * - More comprehensive regex
 * - Email verification service (SendGrid, AWS SES)
 * - Disposable email detection
 * 
 * @param email - Email address to validate
 * @returns Validation result with error message if invalid
 */
export function validateEmail(email: string): ValidationResult {
  // Check if email is provided
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      error: 'Email is required',
    };
  }

  // Check email format using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }

  // Check email length (reasonable limits)
  if (email.length > 255) {
    return {
      isValid: false,
      error: 'Email is too long (max 255 characters)',
    };
  }

  return { isValid: true };
}

/**
 * Validate username
 * 
 * Requirements:
 * - 3-20 characters
 * - Alphanumeric and underscores only
 * - No spaces
 * 
 * Why these rules?
 * - Length: Long enough to be unique, short enough for display
 * - Characters: Prevents special characters that could cause issues in URLs
 * - No spaces: Easier to mention users (@username)
 * 
 * @param username - Username to validate
 * @returns Validation result with error message if invalid
 */
export function validateUsername(username: string): ValidationResult {
  // Check if username is provided
  if (!username || username.trim().length === 0) {
    return {
      isValid: false,
      error: 'Username is required',
    };
  }

  // Check length
  if (username.length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters',
    };
  }

  if (username.length > 20) {
    return {
      isValid: false,
      error: 'Username must be at most 20 characters',
    };
  }

  // Check format (alphanumeric and underscores only)
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    };
  }

  return { isValid: true };
}

/**
 * Validate password strength
 * 
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * Why these rules?
 * - Length: Longer passwords are exponentially harder to crack
 * - Character variety: Increases possible combinations
 * - Industry standard: Meets most security compliance requirements
 * 
 * Password strength calculation:
 * - 8 chars, 4 character types (upper, lower, number, special)
 * - ~95 possible characters per position
 * - 95^8 = 6.6 quadrillion possible passwords
 * - With bcrypt's slow hashing, this is very secure
 * 
 * @param password - Password to validate
 * @returns Validation result with error message if invalid
 */
export function validatePassword(password: string): ValidationResult {
  // Check if password is provided
  if (!password || password.length === 0) {
    return {
      isValid: false,
      error: 'Password is required',
    };
  }

  // Check minimum length
  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters',
    };
  }

  // Check maximum length (bcrypt has a 72 character limit)
  if (password.length > 72) {
    return {
      isValid: false,
      error: 'Password must be at most 72 characters',
    };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number',
    };
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one special character',
    };
  }

  return { isValid: true };
}

/**
 * Validate all registration data at once
 * 
 * This is a convenience function that validates all fields
 * and returns all errors at once (better UX than one error at a time)
 * 
 * @param email - Email address
 * @param username - Username
 * @param password - Password
 * @returns Object with validity status and array of error messages
 */
export function validateRegistrationData(
  email: string,
  username: string,
  password: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate email
  const emailResult = validateEmail(email);
  if (!emailResult.isValid && emailResult.error) {
    errors.push(emailResult.error);
  }

  // Validate username
  const usernameResult = validateUsername(username);
  if (!usernameResult.isValid && usernameResult.error) {
    errors.push(usernameResult.error);
  }

  // Validate password
  const passwordResult = validatePassword(password);
  if (!passwordResult.isValid && passwordResult.error) {
    errors.push(passwordResult.error);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
