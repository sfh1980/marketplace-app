/**
 * ProtectedRoute Component Tests
 * 
 * These tests verify that the ProtectedRoute component correctly:
 * 1. Shows loading state while checking authentication
 * 2. Redirects unauthenticated users to login
 * 3. Renders protected content for authenticated users
 * 4. Passes the intended destination to login page
 * 
 * Testing Strategy:
 * - Mock the AuthContext to control authentication state
 * - Mock React Router's Navigate component to verify redirects
 * - Test all three states: loading, unauthenticated, authenticated
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

// Mock the AuthContext
// This allows us to control what useAuth returns in our tests
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock React Router's Navigate component
// This allows us to verify redirect behavior without actually navigating
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, state }: { to: string; state?: any }) => (
    <div data-testid="navigate" data-to={to} data-state={JSON.stringify(state)}>
      Navigate to {to}
    </div>
  ),
  useLocation: jest.fn(),
}));

// Helper to render ProtectedRoute with Router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('ProtectedRoute', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for useLocation
    (useLocation as jest.Mock).mockReturnValue({
      pathname: '/protected-page',
      search: '',
      hash: '',
      state: null,
    });
  });

  /**
   * Test 1: Loading State
   * 
   * When authentication is still being checked (isLoading = true),
   * the component should show a loading indicator.
   * 
   * This prevents a flash of the login page before we know if the
   * user is authenticated.
   */
  it('shows loading state while checking authentication', () => {
    // Mock AuthContext to return loading state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should show loading text
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Should NOT show protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    
    // Should NOT redirect
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  /**
   * Test 2: Redirect Unauthenticated Users
   * 
   * When user is not authenticated (isAuthenticated = false, isLoading = false),
   * the component should redirect to the login page.
   * 
   * It should also pass the current location so the user can be redirected
   * back after successful login.
   */
  it('redirects unauthenticated users to login page', () => {
    // Mock AuthContext to return unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should show Navigate component (redirect)
    const navigate = screen.getByTestId('navigate');
    expect(navigate).toBeInTheDocument();
    
    // Should redirect to /login
    expect(navigate).toHaveAttribute('data-to', '/login');
    
    // Should pass current location object in state
    const state = JSON.parse(navigate.getAttribute('data-state') || '{}');
    expect(state.from).toBeDefined();
    expect(state.from.pathname).toBe('/protected-page');
    
    // Should NOT show protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  /**
   * Test 3: Custom Redirect Path
   * 
   * The component should support a custom redirect path via the
   * redirectTo prop.
   */
  it('redirects to custom path when specified', () => {
    // Mock AuthContext to return unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    renderWithRouter(
      <ProtectedRoute redirectTo="/custom-login">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should redirect to custom path
    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/custom-login');
  });

  /**
   * Test 4: Render Protected Content for Authenticated Users
   * 
   * When user is authenticated (isAuthenticated = true, isLoading = false),
   * the component should render the protected content (children).
   */
  it('renders protected content for authenticated users', () => {
    // Mock AuthContext to return authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      },
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should show protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    
    // Should NOT show loading
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    
    // Should NOT redirect
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  /**
   * Test 5: Render Multiple Children
   * 
   * The component should support rendering multiple children or
   * complex component trees.
   */
  it('renders multiple children for authenticated users', () => {
    // Mock AuthContext to return authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      },
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>
          <h1>Protected Page</h1>
          <p>This is protected content</p>
          <button>Action Button</button>
        </div>
      </ProtectedRoute>
    );

    // Should render all children
    expect(screen.getByText('Protected Page')).toBeInTheDocument();
    expect(screen.getByText('This is protected content')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  /**
   * Test 6: Preserve Location State
   * 
   * When redirecting to login, the component should preserve the
   * full location object (pathname, search, hash) of the page the user
   * was trying to access.
   * 
   * This allows the login page to redirect back after successful login,
   * preserving query parameters and hash fragments.
   */
  it('preserves intended destination in redirect state', () => {
    // Mock different location with query params and hash
    const mockLocation = {
      pathname: '/profile/edit',
      search: '?tab=settings',
      hash: '#section',
      state: null,
    };
    
    (useLocation as jest.Mock).mockReturnValue(mockLocation);

    // Mock AuthContext to return unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should pass the full location object in state
    const navigate = screen.getByTestId('navigate');
    const state = JSON.parse(navigate.getAttribute('data-state') || '{}');
    expect(state.from).toBeDefined();
    expect(state.from.pathname).toBe('/profile/edit');
    expect(state.from.search).toBe('?tab=settings');
    expect(state.from.hash).toBe('#section');
  });
});

/**
 * What These Tests Validate:
 * 
 * 1. Loading State: Prevents flash of login page during auth check
 * 2. Redirect Logic: Unauthenticated users are sent to login
 * 3. Custom Redirect: Supports different login paths
 * 4. Protected Content: Authenticated users see the content
 * 5. Multiple Children: Supports complex component trees
 * 6. Location Preservation: Remembers where user was trying to go
 * 
 * Why These Tests Matter:
 * 
 * - Security: Ensures unauthenticated users can't access protected routes
 * - UX: Verifies loading states and redirect behavior work correctly
 * - Flexibility: Tests custom redirect paths and complex children
 * - Integration: Validates interaction with AuthContext and React Router
 * 
 * Testing Best Practices Demonstrated:
 * 
 * - Mock external dependencies (AuthContext, Router)
 * - Test all code paths (loading, authenticated, unauthenticated)
 * - Verify both positive and negative cases
 * - Test edge cases (custom paths, multiple children)
 * - Clear test descriptions that explain what's being tested
 */
