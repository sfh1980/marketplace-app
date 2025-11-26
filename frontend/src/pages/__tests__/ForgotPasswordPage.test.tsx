/**
 * ForgotPasswordPage Tests
 * 
 * These tests verify that the ForgotPasswordPage component:
 * - Renders correctly with all required elements
 * - Handles form validation
 * - Calls the password reset API when form is submitted
 * - Displays success message after email is sent
 * - Handles API errors appropriately
 * 
 * Testing Multi-Step Flows:
 * This is Step 1 of the password reset flow. We test:
 * - Initial form rendering
 * - Form submission and API call
 * - Success state transition
 * - Error handling
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ForgotPasswordPage } from '../ForgotPasswordPage';
import * as authService from '../../services/authService';

// Mock axios to avoid import.meta.env issues
jest.mock('../../lib/axios');

// Mock the auth service
jest.mock('../../services/authService');

/**
 * Test Wrapper Component
 */
const renderForgotPasswordPage = () => {
  return render(
    <BrowserRouter>
      <ForgotPasswordPage />
    </BrowserRouter>
  );
};

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Page renders with all required elements
   */
  it('renders forgot password form with all fields', () => {
    renderForgotPasswordPage();

    // Check for heading
    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();

    // Check for form field
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

    // Check for submit button
    expect(screen.getByRole('button', { name: /send reset instructions/i })).toBeInTheDocument();

    // Check for back to login link
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  /**
   * Test: Form validation for invalid email
   */
  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderForgotPasswordPage();

    // Enter invalid email
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur event

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Successful password reset request shows success message
   */
  it('shows success message after email is sent', async () => {
    const user = userEvent.setup();
    const mockRequestPasswordReset = jest.fn().mockResolvedValue({
      message: 'Password reset email sent',
    });
    (authService.requestPasswordReset as jest.Mock) = mockRequestPasswordReset;

    renderForgotPasswordPage();

    // Fill in the form
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send reset instructions/i }));

    // Wait for API call
    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });

    // Verify success message is displayed
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Display error message on API failure
   */
  it('displays error message when API call fails', async () => {
    const user = userEvent.setup();
    const mockRequestPasswordReset = jest.fn().mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Email not found',
          },
        },
      },
    });
    (authService.requestPasswordReset as jest.Mock) = mockRequestPasswordReset;

    renderForgotPasswordPage();

    // Fill in the form
    await user.type(screen.getByLabelText(/email address/i), 'nonexistent@example.com');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send reset instructions/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Button shows loading state during API call
   */
  it('shows loading state while request is in progress', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const mockRequestPasswordReset = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );
    (authService.requestPasswordReset as jest.Mock) = mockRequestPasswordReset;

    renderForgotPasswordPage();

    // Fill in the form
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send reset instructions/i }));

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    });

    // Resolve the promise to clean up
    resolvePromise!({ message: 'Success' });
  });

  /**
   * Test: Can send another email from success screen
   */
  it('allows sending another email from success screen', async () => {
    const user = userEvent.setup();
    const mockRequestPasswordReset = jest.fn().mockResolvedValue({
      message: 'Password reset email sent',
    });
    (authService.requestPasswordReset as jest.Mock) = mockRequestPasswordReset;

    renderForgotPasswordPage();

    // Submit the form
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset instructions/i }));

    // Wait for success screen
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    });

    // Click "Send Another Email" button
    await user.click(screen.getByRole('button', { name: /send another email/i }));

    // Should return to form
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
  });
});
