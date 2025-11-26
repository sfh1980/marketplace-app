/**
 * ProtectedRoute Component
 * 
 * A route guard component that protects routes requiring authentication.
 * 
 * What is a Route Guard?
 * - A component that checks if a user is allowed to access a route
 * - If not allowed, redirects them to another page (usually login)
 * - If allowed, renders the protected content
 * 
 * How it works:
 * 1. Wraps protected content in your route definition
 * 2. Checks authentication status using AuthContext
 * 3. Shows loading state while checking
 * 4. Redirects to login if not authenticated
 * 5. Renders content if authenticated
 * 
 * Example usage:
 * ```tsx
 * <Route 
 *   path="/profile" 
 *   element={
 *     <ProtectedRoute>
 *       <ProfilePage />
 *     </ProtectedRoute>
 *   } 
 * />
 * ```
 * 
 * Benefits:
 * - Centralized authentication checking
 * - Reusable across all protected routes
 * - Automatic redirect to login
 * - Preserves intended destination (redirects back after login)
 * - Consistent loading state
 * 
 * Pattern: Higher-Order Component (HOC) Concept
 * While not technically an HOC, this follows similar principles:
 * - Wraps another component to add functionality
 * - Doesn't modify the wrapped component
 * - Adds authentication checking behavior
 * - Reusable and composable
 */

import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Props for ProtectedRoute
 * 
 * children: The component(s) to render if user is authenticated
 * redirectTo: Where to redirect if not authenticated (default: /login)
 */
interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * 
 * This component acts as a guard for routes that require authentication.
 * 
 * Flow:
 * 1. Get auth state from AuthContext (user, isLoading, isAuthenticated)
 * 2. If still loading → show loading indicator
 * 3. If not authenticated → redirect to login (with return URL)
 * 4. If authenticated → render the protected content
 * 
 * The "location.pathname" is passed to login so after successful login,
 * the user can be redirected back to where they were trying to go.
 * This is a better UX than always redirecting to home after login.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  // Get authentication state from context
  const { isAuthenticated, isLoading } = useAuth();
  
  // Get current location (the route user is trying to access)
  // We'll pass this to the login page so it can redirect back after login
  const location = useLocation();
  
  /**
   * Loading State
   * 
   * While checking authentication (on initial app load), show a loading indicator.
   * This prevents a flash of the login page before we know if user is logged in.
   * 
   * The isLoading state comes from AuthContext and is true while:
   * - Checking localStorage for existing session
   * - Validating the stored token
   * 
   * Once we know the auth state, isLoading becomes false.
   */
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: 'var(--font-size-lg)',
        color: 'var(--color-text-secondary)',
      }}>
        Loading...
      </div>
    );
  }
  
  /**
   * Not Authenticated - Redirect to Login
   * 
   * If user is not authenticated, redirect them to the login page.
   * 
   * The "state" prop passes the current location to the login page.
   * After successful login, the login page can read this and redirect
   * the user back to where they were trying to go.
   * 
   * Example flow:
   * 1. User tries to access /profile (not logged in)
   * 2. ProtectedRoute redirects to /login with state: { from: location }
   * 3. User logs in successfully
   * 4. Login page reads state.from.pathname and redirects to /profile
   * 5. User is now on the page they originally wanted!
   * 
   * This is much better UX than always redirecting to home after login.
   * 
   * We pass the full location object (not just pathname) so the login page
   * can also preserve query parameters and hash if needed.
   */
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }
  
  /**
   * Authenticated - Render Protected Content
   * 
   * User is authenticated, so render the children (the protected component).
   * 
   * The children could be any component:
   * - ProfilePage
   * - CreateListingPage
   * - MessagesPage
   * - etc.
   * 
   * This component doesn't care what the children are, it just ensures
   * the user is authenticated before rendering them.
   */
  return <>{children}</>;
};

/**
 * Alternative Pattern: withAuth HOC
 * 
 * Another common pattern is a Higher-Order Component (HOC) that wraps
 * a component to add authentication checking:
 * 
 * ```tsx
 * export const withAuth = <P extends object>(
 *   Component: React.ComponentType<P>
 * ) => {
 *   return (props: P) => {
 *     const { isAuthenticated, isLoading } = useAuth();
 *     
 *     if (isLoading) return <div>Loading...</div>;
 *     if (!isAuthenticated) return <Navigate to="/login" />;
 *     
 *     return <Component {...props} />;
 *   };
 * };
 * 
 * // Usage:
 * const ProtectedProfile = withAuth(ProfilePage);
 * <Route path="/profile" element={<ProtectedProfile />} />
 * ```
 * 
 * Both patterns work, but the ProtectedRoute wrapper is more explicit
 * and easier to understand for beginners. The HOC pattern is more
 * functional programming style and can be more flexible.
 * 
 * We chose ProtectedRoute because:
 * - More explicit in route definitions
 * - Easier to understand the flow
 * - Better TypeScript support
 * - Clearer in React DevTools
 */

export default ProtectedRoute;
