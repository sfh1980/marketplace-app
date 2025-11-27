/**
 * Validation Utilities Tests
 * 
 * These tests verify that our validation functions work correctly.
 * We test both valid and invalid inputs to ensure proper error handling.
 */

import {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
  validateLength,
  validatePrice,
  validateFileSize,
  validateImageType,
  validateImageFile,
  isFormValid,
  EMAIL_REGEX,
  USERNAME_REGEX,
  PASSWORD_REGEX,
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should return null for valid email', () => {
      expect(validateEmail('user@example.com')).toBeNull();
      expect(validateEmail('test.user@domain.co.uk')).toBeNull();
      expect(validateEmail('user+tag@example.com')).toBeNull();
    });

    it('should return error for empty email', () => {
      expect(validateEmail('')).toBe('Email is required');
      expect(validateEmail('   ')).toBe('Email is required');
    });

    it('should return error for invalid email format', () => {
      expect(validateEmail('invalid')).toBe('Please enter a valid email address');
      expect(validateEmail('user@')).toBe('Please enter a valid email address');
      expect(validateEmail('@example.com')).toBe('Please enter a valid email address');
      expect(validateEmail('user@domain')).toBe('Please enter a valid email address');
    });
  });

  describe('validateUsername', () => {
    it('should return null for valid username', () => {
      expect(validateUsername('user123')).toBeNull();
      expect(validateUsername('test_user')).toBeNull();
      expect(validateUsername('abc')).toBeNull(); // Minimum 3 chars
    });

    it('should return error for empty username', () => {
      expect(validateUsername('')).toBe('Username is required');
      expect(validateUsername('   ')).toBe('Username is required');
    });

    it('should return error for too short username', () => {
      expect(validateUsername('ab')).toBe('Username must be at least 3 characters');
    });

    it('should return error for too long username', () => {
      expect(validateUsername('a'.repeat(21))).toBe('Username must be no more than 20 characters');
    });

    it('should return error for invalid characters', () => {
      expect(validateUsername('user-name')).toBe('Username can only contain letters, numbers, and underscores');
      expect(validateUsername('user name')).toBe('Username can only contain letters, numbers, and underscores');
      expect(validateUsername('user@name')).toBe('Username can only contain letters, numbers, and underscores');
    });
  });

  describe('validatePassword', () => {
    it('should return null for valid password', () => {
      expect(validatePassword('Password123')).toBeNull();
      expect(validatePassword('MyP@ssw0rd')).toBeNull();
      expect(validatePassword('Abcdefg1')).toBeNull(); // Minimum 8 chars
    });

    it('should return error for empty password', () => {
      expect(validatePassword('')).toBe('Password is required');
    });

    it('should return error for too short password', () => {
      expect(validatePassword('Pass1')).toBe('Password must be at least 8 characters');
    });

    it('should return error for weak password', () => {
      expect(validatePassword('password')).toBe('Password must include uppercase, lowercase, and number');
      expect(validatePassword('PASSWORD123')).toBe('Password must include uppercase, lowercase, and number');
      expect(validatePassword('Password')).toBe('Password must include uppercase, lowercase, and number');
    });
  });

  describe('validatePasswordMatch', () => {
    it('should return null when passwords match', () => {
      expect(validatePasswordMatch('Password123', 'Password123')).toBeNull();
    });

    it('should return error for empty confirmation', () => {
      expect(validatePasswordMatch('Password123', '')).toBe('Please confirm your password');
    });

    it('should return error when passwords do not match', () => {
      expect(validatePasswordMatch('Password123', 'Password456')).toBe('Passwords do not match');
    });
  });

  describe('validateRequired', () => {
    it('should return null for non-empty value', () => {
      expect(validateRequired('value')).toBeNull();
      expect(validateRequired('test', 'Field')).toBeNull();
    });

    it('should return error for empty value', () => {
      expect(validateRequired('')).toBe('This field is required');
      expect(validateRequired('   ')).toBe('This field is required');
      expect(validateRequired(null)).toBe('This field is required');
      expect(validateRequired(undefined)).toBe('This field is required');
    });

    it('should use custom field name in error', () => {
      expect(validateRequired('', 'Email')).toBe('Email is required');
    });
  });

  describe('validateLength', () => {
    it('should return null for valid length', () => {
      expect(validateLength('test', 2, 10)).toBeNull();
      expect(validateLength('test', 4, 4)).toBeNull();
    });

    it('should return error for too short', () => {
      expect(validateLength('ab', 3)).toBe('This field must be at least 3 characters');
      expect(validateLength('ab', 3, undefined, 'Title')).toBe('Title must be at least 3 characters');
    });

    it('should return error for too long', () => {
      expect(validateLength('abcdef', undefined, 5)).toBe('This field must be no more than 5 characters');
      expect(validateLength('abcdef', undefined, 5, 'Description')).toBe('Description must be no more than 5 characters');
    });
  });

  describe('validatePrice', () => {
    it('should return null for valid price', () => {
      expect(validatePrice('10')).toBeNull();
      expect(validatePrice('10.50')).toBeNull();
      expect(validatePrice('0.01')).toBeNull();
    });

    it('should return error for empty price', () => {
      expect(validatePrice('')).toBe('Price is required');
      expect(validatePrice('   ')).toBe('Price is required');
    });

    it('should return error for invalid price', () => {
      expect(validatePrice('0')).toBe('Please enter a valid price greater than 0');
      expect(validatePrice('-10')).toBe('Please enter a valid price greater than 0');
      expect(validatePrice('abc')).toBe('Please enter a valid price greater than 0');
    });
  });

  describe('validateFileSize', () => {
    it('should return null for valid file size', () => {
      const file = new File(['a'.repeat(1024 * 1024)], 'test.jpg', { type: 'image/jpeg' }); // 1MB
      expect(validateFileSize(file, 5)).toBeNull();
    });

    it('should return error for too large file', () => {
      const file = new File(['a'.repeat(6 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' }); // 6MB
      expect(validateFileSize(file, 5)).toBe('File is too large. Maximum size is 5MB');
    });
  });

  describe('validateImageType', () => {
    it('should return null for valid image types', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      const gifFile = new File([''], 'test.gif', { type: 'image/gif' });
      const webpFile = new File([''], 'test.webp', { type: 'image/webp' });

      expect(validateImageType(jpegFile)).toBeNull();
      expect(validateImageType(pngFile)).toBeNull();
      expect(validateImageType(gifFile)).toBeNull();
      expect(validateImageType(webpFile)).toBeNull();
    });

    it('should return error for invalid file types', () => {
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      const txtFile = new File([''], 'test.txt', { type: 'text/plain' });

      expect(validateImageType(pdfFile)).toBe('Invalid file type. Please select an image (JPEG, PNG, GIF, or WebP)');
      expect(validateImageType(txtFile)).toBe('Invalid file type. Please select an image (JPEG, PNG, GIF, or WebP)');
    });
  });

  describe('validateImageFile', () => {
    it('should return null for valid image file', () => {
      const file = new File(['a'.repeat(1024 * 1024)], 'test.jpg', { type: 'image/jpeg' }); // 1MB JPEG
      expect(validateImageFile(file, 5)).toBeNull();
    });

    it('should return error for invalid type', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(validateImageFile(file, 5)).toBe('Invalid file type. Please select an image (JPEG, PNG, GIF, or WebP)');
    });

    it('should return error for too large file', () => {
      const file = new File(['a'.repeat(6 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' }); // 6MB
      expect(validateImageFile(file, 5)).toBe('File is too large. Maximum size is 5MB');
    });
  });

  describe('isFormValid', () => {
    it('should return true when all errors are null', () => {
      const errors = {
        email: null,
        password: null,
        username: null,
      };
      expect(isFormValid(errors)).toBe(true);
    });

    it('should return false when any error exists', () => {
      const errors = {
        email: null,
        password: 'Password is required',
        username: null,
      };
      expect(isFormValid(errors)).toBe(false);
    });

    it('should return true for empty errors object', () => {
      expect(isFormValid({})).toBe(true);
    });
  });

  describe('Regex Patterns', () => {
    describe('EMAIL_REGEX', () => {
      it('should match valid emails', () => {
        expect(EMAIL_REGEX.test('user@example.com')).toBe(true);
        expect(EMAIL_REGEX.test('test.user@domain.co.uk')).toBe(true);
        expect(EMAIL_REGEX.test('user+tag@example.com')).toBe(true);
      });

      it('should not match invalid emails', () => {
        expect(EMAIL_REGEX.test('invalid')).toBe(false);
        expect(EMAIL_REGEX.test('user@')).toBe(false);
        expect(EMAIL_REGEX.test('@example.com')).toBe(false);
      });
    });

    describe('USERNAME_REGEX', () => {
      it('should match valid usernames', () => {
        expect(USERNAME_REGEX.test('user123')).toBe(true);
        expect(USERNAME_REGEX.test('test_user')).toBe(true);
        expect(USERNAME_REGEX.test('abc')).toBe(true);
      });

      it('should not match invalid usernames', () => {
        expect(USERNAME_REGEX.test('ab')).toBe(false); // Too short
        expect(USERNAME_REGEX.test('a'.repeat(21))).toBe(false); // Too long
        expect(USERNAME_REGEX.test('user-name')).toBe(false); // Invalid char
      });
    });

    describe('PASSWORD_REGEX', () => {
      it('should match valid passwords', () => {
        expect(PASSWORD_REGEX.test('Password123')).toBe(true);
        expect(PASSWORD_REGEX.test('MyP@ssw0rd')).toBe(true);
        expect(PASSWORD_REGEX.test('Abcdefg1')).toBe(true);
      });

      it('should not match invalid passwords', () => {
        expect(PASSWORD_REGEX.test('password')).toBe(false); // No uppercase or number
        expect(PASSWORD_REGEX.test('PASSWORD123')).toBe(false); // No lowercase
        expect(PASSWORD_REGEX.test('Password')).toBe(false); // No number
        expect(PASSWORD_REGEX.test('Pass1')).toBe(false); // Too short
      });
    });
  });
});
