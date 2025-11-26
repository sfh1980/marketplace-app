/**
 * Email Verification Page Tests
 * 
 * These tests verify that the email verification page:
 * - Extracts the token from URL parameters correctly
 * - Calls the verification API with the token
 * - Shows appropriate UI for loading, success, and error states
 * - Redirects to login after successful verification
 * 
 * Testing Concepts:
 * - Mocking API calls with jest.mock()
 * - Testing async operations with waitFor()
 * - Testing URL parameters with MemoryRouter
 * - Testing navigation with useNavigate mock
 * - Testing conditional rendering based on state
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VerifyEmailPage from '../VerifyEmailPage';
import * as authService from '../../services/authService';

// Mock axios to avoid import.meta.env issues
jest.mock('../../lib/axios');

// Mock the auth service
jest.mock('../../services/authService');

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Test: Loading State
   * 
   * When the page first loads, it should show a loading spinner
   * while the verification is in progress.
   */
  it('shows loading state initially', () => {
    // Mock the verifyEmail function to return a pending promise
    (authService.verifyEmail as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <MemoryRouter initialEntries={['/verify-email?token=abc123']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading message
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
    expect(screen.getByText(/please wait/i)).toBeInTheDocument();
  });

  /**
   * Test: Successful Verification
   * 
   * When verification succeeds, the page should:
   * - Show a success message
   * - Display a checkmark icon
   * - Show redirect information
   * - Provide a manual login link
   */
  it('shows success state when verification succeeds', async () => {
    // Mock successful verification
    (authService.verifyEmail as jest.Mock).mockResolvedValue({
      message: 'Email verified successfully',
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=abc123']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the success state to appear
    await waitFor(() => {
      expect(screen.getByText(/email verified!/i)).toBeInTheDocument();
    });

    // Should show success message
    expect(screen.getByText(/successfully verified/i)).toBeInTheDocument();
    expect(screen.getByText(/redirecting to login/i)).toBeInTheDocument();

    // Should have a link to login
    const loginLink = screen.getByRole('link', { name: /go to login now/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  /**
   * Test: API Call with Token
   * 
   * The page should extract the token from URL parameters
   * and pass it to the verifyEmail API function.
   */
  it('calls verifyEmail API with token from URL', async () => {
    const testToken = 'test-token-123';
    
    (authService.verifyEmail as jest.Mock).mockResolvedValue({
      message: 'Email verified successfully',
    });

    render(
      <MemoryRouter initialEntries={[`/verify-email?token=${testToken}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for API call
    await waitFor(() => {
      expect(authService.verifyEmail).toHaveBeenCalledWith(testToken);
    });
  });

  /**
   * Test: Missing Token Error
   * 
   * If no token is provided in the URL, the page should
   * show an error message immediately without calling the API.
   */
  it('shows error when no token is provided', async () => {
    render(
      <MemoryRouter initialEntries={['/verify-email']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show error immediately
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/no verification token provided/i)).toBeInTheDocument();

    // Should NOT call the API
    expect(authService.verifyEmail).not.toHaveBeenCalled();
  });

  /**
   * Test: API Error Handling
   * 
   * When the API returns an error (expired token, invalid token, etc.),
   * the page should show an error message with helpful information.
   */
  it('shows error state when verification fails', async () => {
    // Mock API error
    const errorMessage = 'Verification token has expired';
    (authService.verifyEmail as jest.Mock).mockRejectedValue({
      response: {
        data: {
          error: {
            message: errorMessage,
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=expired-token']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });

    // Should show the error message from API
    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    // Should show help options
    expect(screen.getByText(/what you can do:/i)).toBeInTheDocument();

    // Should have links to registration and login
    expect(screen.getByRole('link', { name: /back to registration/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /try logging in/i })).toHaveAttribute('href', '/login');
  });

  /**
   * Test: Generic Error Message
   * 
   * If the API error doesn't include a specific message,
   * show a generic error message.
   */
  it('shows generic error message when API error has no message', async () => {
    // Mock API error without specific message
    (authService.verifyEmail as jest.Mock).mockRejectedValue({
      response: {},
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=bad-token']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for error state - use heading role to be more specific
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /verification failed/i })).toBeInTheDocument();
    });

    // Should show generic error message
    expect(screen.getByText(/the link may be expired or invalid/i)).toBeInTheDocument();
  });

  /**
   * Test: Automatic Redirect After Success
   * 
   * After successful verification, the page should automatically
   * redirect to the login page after 3 seconds.
   * 
   * Note: We use fake timers to test setTimeout without waiting 3 seconds.
   */
  it('redirects to login after successful verification', async () => {
    // Use fake timers to control setTimeout
    jest.useFakeTimers();

    (authService.verifyEmail as jest.Mock).mockResolvedValue({
      message: 'Email verified successfully',
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=abc123']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText(/email verified!/i)).toBeInTheDocument();
    });

    // Fast-forward time by 3 seconds
    jest.advanceTimersByTime(3000);

    // Should have called navigate to /login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    // Restore real timers
    jest.useRealTimers();
  });
});
