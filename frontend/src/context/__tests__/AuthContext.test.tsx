/**
 * AuthContext Tests
 * 
 * These tests verify that the AuthContext works correctly:
 * - Provides auth state to components
 * - Handles login/logout operations
 * - Persists session to localStorage
 * - Restores session on mount
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import * as authService from '../../services/authService';

// Mock the axios module to avoid import.meta issues
jest.mock('../../lib/axios');

// Mock the auth service
jest.mock('../../services/authService');

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      {user && (
        <div data-testid="user-info">
          <div data-testid="user-email">{user.email}</div>
          <div data-testid="user-username">{user.username}</div>
        </div>
      )}
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

// Helper to render component with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  it('provides initial unauthenticated state', async () => {
    renderWithProviders(<TestComponent />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should show not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });
  
  it('restores user session from localStorage', async () => {
    // Set up localStorage with existing session
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      username: 'testuser',
      emailVerified: true,
      profilePicture: null,
      location: null,
      joinDate: '2024-01-01',
      averageRating: 5,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    
    localStorage.setItem('authToken', 'fake-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Mock getCurrentUser to return the user
    (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    
    renderWithProviders(<TestComponent />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should show authenticated with user info
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('user-username')).toHaveTextContent('testuser');
  });
  
  it('handles login successfully', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      username: 'testuser',
      emailVerified: true,
      profilePicture: null,
      location: null,
      joinDate: '2024-01-01',
      averageRating: 5,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    
    // Mock login to return user data
    (authService.login as jest.Mock).mockResolvedValue({
      token: 'fake-token',
      user: mockUser,
    });
    
    renderWithProviders(<TestComponent />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Click login button
    const loginButton = screen.getByText('Login');
    loginButton.click();
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Should show user info
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('user-username')).toHaveTextContent('testuser');
  });
  
  it('handles logout successfully', async () => {
    // Set up initial authenticated state
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      username: 'testuser',
      emailVerified: true,
      profilePicture: null,
      location: null,
      joinDate: '2024-01-01',
      averageRating: 5,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    
    localStorage.setItem('authToken', 'fake-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    
    renderWithProviders(<TestComponent />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should be authenticated initially
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    
    // Click logout button
    const logoutButton = screen.getByText('Logout');
    logoutButton.click();
    
    // Wait for logout to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    
    // User info should be gone
    expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
  });
  
  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Component that tries to use useAuth without provider
    const BadComponent = () => {
      useAuth();
      return <div>Bad</div>;
    };
    
    // Should throw error
    expect(() => render(<BadComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    
    consoleSpy.mockRestore();
  });
});
