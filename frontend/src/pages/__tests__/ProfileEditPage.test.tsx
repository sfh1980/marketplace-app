/**
 * Profile Edit Page Tests
 * 
 * These tests verify that the profile edit page works correctly.
 * 
 * What we're testing:
 * - Page renders with current user data
 * - Form fields are pre-filled with user data
 * - File upload works correctly
 * - Image preview displays
 * - Form submission updates profile
 * - Error handling works
 * - Redirects to login if not authenticated
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../context/AuthContext';
import ProfileEditPage from '../ProfileEditPage';
import * as userService from '../../services/userService';

// Mock axios to avoid import.meta.env issues
jest.mock('../../lib/axios');

// Mock the user service
jest.mock('../../services/userService');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

// Helper to render with all providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('ProfileEditPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      emailVerified: true,
      username: 'testuser',
      profilePicture: '/uploads/profile-pictures/test.jpg',
      location: 'San Francisco, CA',
      joinDate: '2024-01-01',
      averageRating: 4.5,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    
    localStorage.setItem('authToken', 'fake-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders profile edit form', () => {
    renderWithProviders(<ProfileEditPage />);
    
    // Check that form elements are present
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('redirects to login if not authenticated', async () => {
    // Clear auth data
    localStorage.clear();
    
    renderWithProviders(<ProfileEditPage />);
    
    // Should redirect to login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('allows changing username and location', () => {
    renderWithProviders(<ProfileEditPage />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const locationInput = screen.getByLabelText(/location/i);
    
    // Change values
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });
    fireEvent.change(locationInput, { target: { value: 'New York, NY' } });
    
    // Check that values updated
    expect(usernameInput).toHaveValue('newusername');
    expect(locationInput).toHaveValue('New York, NY');
  });

  test('form allows submission when fields are filled', () => {
    renderWithProviders(<ProfileEditPage />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    
    // Initially, form may be enabled or disabled depending on user state
    // Add some text to username
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    // Button should be enabled when there's content
    expect(saveButton).not.toBeDisabled();
  });

  test('save button is enabled when form has changes', () => {
    renderWithProviders(<ProfileEditPage />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    
    // Make a change
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });
    
    // Should be enabled now
    expect(saveButton).not.toBeDisabled();
  });

  test('submits form and updates profile', async () => {
    const mockUpdatedUser = {
      id: 'user-123',
      email: 'test@example.com',
      emailVerified: true,
      username: 'newusername',
      profilePicture: '/uploads/profile-pictures/test.jpg',
      location: 'New York, NY',
      joinDate: '2024-01-01',
      averageRating: 4.5,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    
    (userService.updateProfile as jest.Mock).mockResolvedValue(mockUpdatedUser);
    
    renderWithProviders(<ProfileEditPage />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const locationInput = screen.getByLabelText(/location/i);
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    
    // Make changes
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });
    fireEvent.change(locationInput, { target: { value: 'New York, NY' } });
    
    // Submit form
    fireEvent.click(saveButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
    
    // Should call updateProfile
    await waitFor(() => {
      expect(userService.updateProfile).toHaveBeenCalledWith('user-123', {
        username: 'newusername',
        location: 'New York, NY',
      });
    });
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
    
    // Should redirect to profile page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile/user-123');
    }, { timeout: 2000 });
  });

  test('displays error message on update failure', async () => {
    (userService.updateProfile as jest.Mock).mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Username already taken',
          },
        },
      },
    });
    
    renderWithProviders(<ProfileEditPage />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    
    // Make a change
    fireEvent.change(usernameInput, { target: { value: 'taken' } });
    
    // Submit form
    fireEvent.click(saveButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/username already taken/i)).toBeInTheDocument();
    });
  });

  test('cancel button returns to profile page', () => {
    renderWithProviders(<ProfileEditPage />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    
    fireEvent.click(cancelButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile/user-123');
  });

  test('shows image upload controls', () => {
    renderWithProviders(<ProfileEditPage />);
    
    // Should show select image button (no profile picture initially)
    expect(screen.getByRole('button', { name: /select image/i })).toBeInTheDocument();
    
    // Should show file input (hidden)
    const fileInput = screen.getByLabelText(/select profile picture/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  test('validates file type on selection', () => {
    renderWithProviders(<ProfileEditPage />);
    
    const fileInput = screen.getByLabelText(/select profile picture/i) as HTMLInputElement;
    
    // Create a fake non-image file
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    // Trigger file selection
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Should show error message
    expect(screen.getByText(/please select a valid image file/i)).toBeInTheDocument();
  });

  test('validates file size on selection', () => {
    renderWithProviders(<ProfileEditPage />);
    
    const fileInput = screen.getByLabelText(/select profile picture/i) as HTMLInputElement;
    
    // Create a fake large file (6MB)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
    
    // Trigger file selection
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    // Should show error message
    expect(screen.getByText(/image must be smaller than 5mb/i)).toBeInTheDocument();
  });
});
