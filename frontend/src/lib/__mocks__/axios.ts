/**
 * Mock Axios Module for Tests
 * 
 * This mock replaces the real axios module in tests to avoid
 * issues with import.meta.env and to allow us to control API responses.
 */

// Mock axios instance
export const apiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
};

// Mock helper functions
export const setAuthToken = jest.fn();
export const removeAuthToken = jest.fn();
export const isAuthenticated = jest.fn();
