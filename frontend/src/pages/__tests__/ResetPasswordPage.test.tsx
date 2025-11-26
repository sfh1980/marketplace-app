/**
 * ResetPasswordPage Tests
 * 
 * These tests verify that the ResetPasswordPage component:
 * - Extracts token from URL parameters
 * - Renders correctly with all required elements
 * - Handles form validation (password strength, matching)
 * - Calls the reset password API when form is submitted
 * - Displays success message and redirects after reset
 * - Handles invalid/missing tokens appropriately
 * 
 * Testing Multi-Step Flows:
 * This is Step 2 of the password reset flow. We test:
 * - Token extraction from URL
 * - Form validation
 * - API call with token
 * - Success state with countdown
 * - Error handling
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ResetPasswordPage } from '../ResetPasswordPage';
import * as authService from '../../services/authService';

// Mock axios to avoid import.meta.env issues
jest.mock('../../lib/axios');

// Mock the auth service
jest.mock('../../services/authService');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

/**
 * Test Wrapper Component with URL parameters
 */
const renderResetPasswordPage = (token?: string) => {
  const url = token ? `/reset-password?token=${token}` : '/reset-password';
  
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ResetPasswordPage />
    </MemoryRouter>
  );
};

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing timers
    jest.clearAllTimers();
  });

  /**
   * Test: Shows error when token is missing
   */
  it('shows error message when token is missing from URL', () => {
    renderResetPasswordPage(); // No token

    // Check for error message
    expect(screen.getByRole('heading', { name: /invalid reset link/i })).toBeInTheDocument();
    expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();

    // Check for action button
    expect(screen.getByRole('button', { name: /request new reset link/i })).toBeInTheDocument();
  });

  /**
   * Test: Page renders with all required elements when token is present
   */
  it('renders reset password form with all fields when token is present', () => {
    renderResetPasswordPage('valid-token-123');

    // Check for heading
    expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByLabelText(/^New Password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm New Password/)).toBeInTheDocument();

    // Check for submit button
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();

    // Check for password requirements
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
  });

  /**
   * Test: Form validation for weak password
   */
  it('shows validation error for weak password', async () => {
    const user = userEvent.setup();
    renderResetPasswordPage('valid-token-123');

    // Enter weak password
    const passwordInput = screen.getByLabelText(/^New Password/);
    await user.type(passwordInput, 'weak');
    await user.tab(); // Trigger blur event

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Form validation for password without required characters
   */
  it('shows validation error for password without uppercase/lowercase/number', async () => {
    const user = userEvent.setup();
    renderResetPasswordPage('valid-token-123');

    // Enter password without required characters
    const passwordInput = screen.getByLabelText(/^New Password/);
    await user.type(passwordInput, 'alllowercase');
    await user.tab(); // Trigger blur event

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/password must contain uppercase, lowercase, and number/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Form validation for non-matching passwords
   */
  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderResetPasswordPage('valid-token-123');

    // Enter different passwords
    await user.type(screen.getByLabelText(/^New Password/), 'Password123');
    await user.type(screen.getByLabelText(/^Confirm New Password/), 'Different123');
    await user.tab(); // Trigger blur event

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Successful password reset shows success message
   */
  it('shows success message after password is reset', async () => {
    const user = userEvent.setup();
    const mockResetPassword = jest.fn().mockResolvedValue({
      message: 'Password reset successful',
    });
    (authService.resetPassword as jest.Mock) = mockResetPassword;

    renderResetPasswordPage('valid-token-123');

    // Fill in the form with valid passwords
    await user.type(screen.getByLabelText(/^New Password/), 'NewPassword123');
    await user.type(screen.getByLabelText(/^Confirm New Password/), 'NewPassword123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    // Wait for API call
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('valid-token-123', 'NewPassword123');
    });

    // Verify success message is displayed
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /password reset successful/i })).toBeInTheDocument();
    });
  });

  /**
   * Test: Display error message on API failure
   */
  it('displays error message when API call fails', async () => {
    const user = userEvent.setup();
    const mockResetPassword = jest.fn().mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Invalid or expired token',
          },
        },
      },
    });
    (authService.resetPassword as jest.Mock) = mockResetPassword;

    renderResetPasswordPage('invalid-token');

    // Fill in the form
    await user.type(screen.getByLabelText(/^New Password/), 'NewPassword123');
    await user.type(screen.getByLabelText(/^Confirm New Password/), 'NewPassword123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Button shows loading state during API call
   */
  it('shows loading state while reset is in progress', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const mockResetPassword = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );
    (authService.resetPassword as jest.Mock) = mockResetPassword;

    renderResetPasswordPage('valid-token-123');

    // Fill in the form
    await user.type(screen.getByLabelText(/^New Password/), 'NewPassword123');
    await user.type(screen.getByLabelText(/^Confirm New Password/), 'NewPassword123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resetting password/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resetting password/i })).toBeDisabled();
    });

    // Resolve the promise to clean up
    resolvePromise!({ message: 'Success' });
  });

  /**
   * Test: Success screen shows countdown
   * 
   * Note: We use fake timers to test the countdown without waiting
   */
  it('shows countdown timer on success screen', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null }); // Disable delay with fake timers
    
    const mockResetPassword = jest.fn().mockResolvedValue({
      message: 'Password reset successful',
    });
    (authService.resetPassword as jest.Mock) = mockResetPassword;

    renderResetPasswordPage('valid-token-123');

    // Fill in and submit the form
    await user.type(screen.getByLabelText(/^New Password/), 'NewPassword123');
    await user.type(screen.getByLabelText(/^Confirm New Password/), 'NewPassword123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    // Wait for success screen
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /password reset successful/i })).toBeInTheDocument();
    });

    // Check initial countdown
    expect(screen.getByText(/redirecting to login in 5 seconds/i)).toBeInTheDocument();

    // Advance timer by 1 second
    jest.advanceTimersByTime(1000);

    // Check countdown updated
    await waitFor(() => {
      expect(screen.getByText(/redirecting to login in 4 seconds/i)).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
