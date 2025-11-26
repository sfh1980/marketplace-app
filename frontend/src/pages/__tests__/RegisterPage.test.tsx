/**
 * RegisterPage Tests
 * 
 * These tests verify that the registration page:
 * - Renders correctly with all form fields
 * - Validates user input
 * - Handles form submission
 * - Displays error messages
 * - Shows success state after registration
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegisterPage } from '../RegisterPage';
import * as authService from '../../services/authService';

// Mock the axios module to avoid import.meta.env issues in tests
jest.mock('../../lib/axios', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
  setAuthToken: jest.fn(),
  removeAuthToken: jest.fn(),
}));

// Mock the auth service
jest.mock('../../services/authService');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper to render component with providers
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Page renders with all required elements
   */
  it('renders registration form with all fields', () => {
    renderWithProviders(<RegisterPage />);

    // Check for title and subtitle
    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    expect(
      screen.getByText(/Join our marketplace to buy and sell items and services/i)
    ).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

    // Check for submit button
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();

    // Check for login link
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  /**
   * Test: Form validation - required fields
   */
  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Try to submit empty form
    await user.click(submitButton);

    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  /**
   * Test: Form validation - email format
   */
  it('validates email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email address/i);

    // Enter invalid email
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur event

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Form validation - username requirements
   */
  it('validates username requirements', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/username/i);

    // Test too short
    await user.type(usernameInput, 'ab');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    });

    // Clear and test invalid characters
    await user.clear(usernameInput);
    await user.type(usernameInput, 'user@name');
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText(/username can only contain letters, numbers, and underscores/i)
      ).toBeInTheDocument();
    });
  });

  /**
   * Test: Form validation - password requirements
   */
  it('validates password requirements', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const passwordInput = passwordInputs[0]; // First password field

    // Test too short
    await user.type(passwordInput, 'short');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    // Clear and test missing requirements
    await user.clear(passwordInput);
    await user.type(passwordInput, 'alllowercase');
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText(/password must include uppercase, lowercase, and number/i)
      ).toBeInTheDocument();
    });
  });

  /**
   * Test: Form validation - password confirmation
   */
  it('validates password confirmation matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const passwordInput = passwordInputs[0]; // First password field
    const confirmPasswordInput = passwordInputs[1]; // Confirm password field

    // Enter different passwords
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'DifferentPassword123');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Successful registration
   */
  it('submits form with valid data and shows success message', async () => {
    const user = userEvent.setup();
    const mockRegister = authService.register as jest.MockedFunction<typeof authService.register>;

    // Mock successful registration
    mockRegister.mockResolvedValueOnce({
      token: 'fake-token',
      user: {
        id: '1',
        email: 'test@example.com',
        emailVerified: false,
        username: 'testuser',
        profilePicture: null,
        location: null,
        joinDate: new Date().toISOString(),
        averageRating: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    renderWithProviders(<RegisterPage />);

    // Fill out form with valid data
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'Password123');
    await user.type(passwordInputs[1], 'Password123');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/we've sent a verification email to your inbox/i)
    ).toBeInTheDocument();

    // Verify API was called with correct data
    expect(mockRegister).toHaveBeenCalledWith({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123',
    });
  });

  /**
   * Test: API error handling
   */
  it('displays error message when registration fails', async () => {
    const user = userEvent.setup();
    const mockRegister = authService.register as jest.MockedFunction<typeof authService.register>;

    // Mock failed registration
    mockRegister.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            message: 'Email already exists',
          },
        },
      },
    });

    renderWithProviders(<RegisterPage />);

    // Fill out form
    await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'Password123');
    await user.type(passwordInputs[1], 'Password123');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Loading state during submission
   */
  it('shows loading state during form submission', async () => {
    const user = userEvent.setup();
    const mockRegister = authService.register as jest.MockedFunction<typeof authService.register>;

    // Mock slow registration
    mockRegister.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    renderWithProviders(<RegisterPage />);

    // Fill out form
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'Password123');
    await user.type(passwordInputs[1], 'Password123');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument();
    });
  });
});
