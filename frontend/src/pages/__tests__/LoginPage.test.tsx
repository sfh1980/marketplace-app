/**
 * LoginPage Tests
 * 
 * These tests verify that the LoginPage component:
 * - Renders correctly with all required elements
 * - Handles form validation
 * - Displays error messages appropriately
 * - Calls the login API when form is submitted
 * - Redirects after successful login
 * 
 * Testing Approach:
 * - Use React Testing Library for component testing
 * - Mock the useLogin hook to avoid real API calls
 * - Test user interactions (typing, clicking)
 * - Verify UI updates based on state changes
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from '../LoginPage';
import * as useAuthHooks from '../../hooks/useAuth';

// Mock axios to avoid import.meta.env issues
jest.mock('../../lib/axios');

// Mock the useLogin hook
jest.mock('../../hooks/useAuth');

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}));

/**
 * Test Wrapper Component
 * 
 * Wraps the LoginPage with required providers:
 * - QueryClientProvider for React Query
 * - BrowserRouter for routing
 */
const renderLoginPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Test: Page renders with all required elements
   */
  it('renders login form with all fields', () => {
    // Mock the useLogin hook to return a mutation object
    (useAuthHooks.useLogin as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    });

    renderLoginPage();

    // Check for heading
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Check for submit button
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

    // Check for links
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    expect(screen.getByText(/create one/i)).toBeInTheDocument();
  });

  /**
   * Test: Form has required fields
   * 
   * Note: We don't test empty field validation because HTML5 required
   * attribute prevents form submission, which is browser behavior.
   * The invalid email test below covers React Hook Form validation.
   */
  it('has required attributes on form fields', () => {
    (useAuthHooks.useLogin as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    });

    renderLoginPage();

    // Check that fields have required attribute
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
  });

  /**
   * Test: Form validation for invalid email
   */
  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();

    (useAuthHooks.useLogin as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    });

    renderLoginPage();

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
   * Test: Successful login calls API and redirects
   */
  it('calls login API and redirects on successful login', async () => {
    const user = userEvent.setup();
    const mockMutateAsync = jest.fn().mockResolvedValue({
      token: 'fake-token',
      user: { id: '1', email: 'test@example.com', username: 'testuser' },
    });

    (useAuthHooks.useLogin as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });

    renderLoginPage();

    // Fill in the form
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for API call
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
    });

    // Verify redirect was called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  /**
   * Test: Display error message on login failure
   */
  it('displays error message when login fails', async () => {
    const user = userEvent.setup();
    const mockMutateAsync = jest.fn().mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Invalid credentials',
          },
        },
      },
    });

    (useAuthHooks.useLogin as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: true,
      error: {
        response: {
          data: {
            error: {
              message: 'Invalid credentials',
            },
          },
        },
      },
    });

    renderLoginPage();

    // Fill in the form
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Button shows loading state during login
   */
  it('shows loading state while login is in progress', () => {
    (useAuthHooks.useLogin as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
      isError: false,
      error: null,
    });

    renderLoginPage();

    // Check for loading text
    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    
    // Button should be disabled
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});
