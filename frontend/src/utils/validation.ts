/**
 * Form Validation Utilities
 * 
 * This file contains reusable validation functions and patterns
 * for consistent form validation across the application.
 * 
 * Why Centralize Validation?
 * - Consistency: Same rules applied everywhere
 * - Reusability: Write once, use many times
 * - Maintainability: Update rules in one place
 * - Testing: Easy to unit test validation logic
 * 
 * Validation Patterns:
 * 1. Regex patterns for format validation (email, username, etc.)
 * 2. Length validators (min/max characters)
 * 3. Strength validators (password complexity)
 * 4. Custom validators (password match, etc.)
 */

/**
 * Email Validation
 * 
 * RFC 5322 compliant email regex (simplified version)
 * Validates: user@domain.tld
 */
export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Username Validation
 * 
 * Allows: letters, numbers, underscores
 * Length: 3-20 characters
 */
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

/**
 * Password Strength Validation
 * 
 * Requires:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * 
 * Why these requirements?
 * - Length: Longer passwords are exponentially harder to crack
 * - Mixed case: Increases character space (harder to brute force)
 * - Numbers: Further increases complexity
 * 
 * Note: This is a basic strength check. For production, consider:
 * - Checking against common password lists
 * - Preventing personal information in passwords
 * - Using a password strength library (zxcvbn)
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Validation Error Messages
 * 
 * Centralized error messages for consistency.
 * These can be customized or internationalized.
 */
export const VALIDATION_MESSAGES = {
  // Required fields
  REQUIRED: 'This field is required',
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_REQUIRED: 'Password is required',
  USERNAME_REQUIRED: 'Username is required',
  
  // Format validation
  EMAIL_INVALID: 'Please enter a valid email address',
  USERNAME_INVALID: 'Username can only contain letters, numbers, and underscores',
  
  // Length validation
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters',
  USERNAME_TOO_LONG: 'Username must be no more than 20 characters',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  TITLE_TOO_SHORT: 'Title must be at least 5 characters',
  TITLE_TOO_LONG: 'Title must be no more than 100 characters',
  DESCRIPTION_TOO_SHORT: 'Description must be at least 20 characters',
  DESCRIPTION_TOO_LONG: 'Description must be no more than 2000 characters',
  
  // Strength validation
  PASSWORD_WEAK: 'Password must include uppercase, lowercase, and number',
  
  // Matching validation
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  
  // Numeric validation
  PRICE_INVALID: 'Please enter a valid price greater than 0',
  
  // File validation
  FILE_TOO_LARGE: 'File is too large. Maximum size is 5MB',
  FILE_INVALID_TYPE: 'Invalid file type. Please select an image (JPEG, PNG, GIF, or WebP)',
  TOO_MANY_IMAGES: 'You can only upload up to 10 images',
  NO_IMAGES: 'Please upload at least one image',
};

/**
 * Validate Email
 * 
 * @param email - Email address to validate
 * @returns Error message or null if valid
 */
export const validateEmail = (email: string): string | null => {
  if (!email || email.trim().length === 0) {
    return VALIDATION_MESSAGES.EMAIL_REQUIRED;
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return VALIDATION_MESSAGES.EMAIL_INVALID;
  }
  
  return null;
};

/**
 * Validate Username
 * 
 * @param username - Username to validate
 * @returns Error message or null if valid
 */
export const validateUsername = (username: string): string | null => {
  if (!username || username.trim().length === 0) {
    return VALIDATION_MESSAGES.USERNAME_REQUIRED;
  }
  
  if (username.length < 3) {
    return VALIDATION_MESSAGES.USERNAME_TOO_SHORT;
  }
  
  if (username.length > 20) {
    return VALIDATION_MESSAGES.USERNAME_TOO_LONG;
  }
  
  if (!USERNAME_REGEX.test(username)) {
    return VALIDATION_MESSAGES.USERNAME_INVALID;
  }
  
  return null;
};

/**
 * Validate Password
 * 
 * @param password - Password to validate
 * @returns Error message or null if valid
 */
export const validatePassword = (password: string): string | null => {
  if (!password || password.length === 0) {
    return VALIDATION_MESSAGES.PASSWORD_REQUIRED;
  }
  
  if (password.length < 8) {
    return VALIDATION_MESSAGES.PASSWORD_TOO_SHORT;
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    return VALIDATION_MESSAGES.PASSWORD_WEAK;
  }
  
  return null;
};

/**
 * Validate Password Confirmation
 * 
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Error message or null if valid
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return 'Please confirm your password';
  }
  
  if (password !== confirmPassword) {
    return VALIDATION_MESSAGES.PASSWORDS_DONT_MATCH;
  }
  
  return null;
};

/**
 * Validate Required Field
 * 
 * Generic validator for any required field.
 * 
 * @param value - Value to validate
 * @param fieldName - Name of the field (for error message)
 * @returns Error message or null if valid
 */
export const validateRequired = (
  value: string | null | undefined,
  fieldName: string = 'This field'
): string | null => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  
  return null;
};

/**
 * Validate String Length
 * 
 * Generic validator for string length constraints.
 * 
 * @param value - String to validate
 * @param min - Minimum length (optional)
 * @param max - Maximum length (optional)
 * @param fieldName - Name of the field (for error message)
 * @returns Error message or null if valid
 */
export const validateLength = (
  value: string,
  min?: number,
  max?: number,
  fieldName: string = 'This field'
): string | null => {
  if (min !== undefined && value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  
  if (max !== undefined && value.length > max) {
    return `${fieldName} must be no more than ${max} characters`;
  }
  
  return null;
};

/**
 * Validate Price
 * 
 * Validates that a price is a positive number.
 * 
 * @param price - Price string to validate
 * @returns Error message or null if valid
 */
export const validatePrice = (price: string): string | null => {
  if (!price || price.trim().length === 0) {
    return 'Price is required';
  }
  
  const priceNum = parseFloat(price);
  
  if (isNaN(priceNum) || priceNum <= 0) {
    return VALIDATION_MESSAGES.PRICE_INVALID;
  }
  
  return null;
};

/**
 * Validate File Size
 * 
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in megabytes
 * @returns Error message or null if valid
 */
export const validateFileSize = (
  file: File,
  maxSizeMB: number = 5
): string | null => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return `File is too large. Maximum size is ${maxSizeMB}MB`;
  }
  
  return null;
};

/**
 * Validate Image File Type
 * 
 * @param file - File to validate
 * @returns Error message or null if valid
 */
export const validateImageType = (file: File): string | null => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    return VALIDATION_MESSAGES.FILE_INVALID_TYPE;
  }
  
  return null;
};

/**
 * Validate Image File
 * 
 * Combines size and type validation for images.
 * 
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in megabytes
 * @returns Error message or null if valid
 */
export const validateImageFile = (
  file: File,
  maxSizeMB: number = 5
): string | null => {
  // Check type first
  const typeError = validateImageType(file);
  if (typeError) {
    return typeError;
  }
  
  // Then check size
  const sizeError = validateFileSize(file, maxSizeMB);
  if (sizeError) {
    return sizeError;
  }
  
  return null;
};

/**
 * Check if Form is Valid
 * 
 * Helper function to check if a form has any validation errors.
 * Useful for disabling submit buttons.
 * 
 * @param errors - Object containing validation errors
 * @returns True if form is valid (no errors)
 * 
 * Example:
 * const errors = {
 *   email: validateEmail(email),
 *   password: validatePassword(password),
 * };
 * const isValid = isFormValid(errors);
 */
export const isFormValid = (
  errors: Record<string, string | null>
): boolean => {
  return Object.values(errors).every((error) => error === null);
};

/**
 * Debounce Function
 * 
 * Creates a debounced version of a function that delays execution
 * until after a specified wait time has elapsed since the last call.
 * 
 * Useful for:
 * - Real-time validation (don't validate on every keystroke)
 * - Search input (don't search on every character)
 * - Resize handlers (don't recalculate on every pixel)
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 * 
 * Example:
 * const debouncedValidate = debounce((value) => {
 *   setError(validateEmail(value));
 * }, 300);
 * 
 * <input onChange={(e) => debouncedValidate(e.target.value)} />
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};
