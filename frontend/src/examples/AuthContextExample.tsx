/**
 * AuthContext Usage Example
 * 
 * This component demonstrates how to use the AuthContext in your components.
 * It shows:
 * - How to access user data
 * - How to check if user is logged in
 * - How to call login/logout functions
 * - How to handle loading states
 * 
 * This is just an example - you'll build proper login/register pages later!
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthContextExample: React.FC = () => {
  // Get auth state and functions from context
  // This is the magic of Context - no props needed!
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  
  // Local state for the example login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /**
   * Handle login form submission
   * 
   * This shows how to use the login function from context.
   * The pattern is:
   * 1. Call the login function with credentials
   * 2. Handle success (user is now logged in!)
   * 3. Handle errors (show error message)
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Call the login function from context
      await login({ email, password });
      
      // Success! The user state in context is now updated
      // The component will re-render and show the logged-in view
      console.log('Login successful!');
      
      // Clear the form
      setEmail('');
      setPassword('');
    } catch (err: any) {
      // Handle error
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Handle logout
   * 
   * This is even simpler - just call logout()!
   */
  const handleLogout = () => {
    logout();
    console.log('Logged out!');
  };
  
  /**
   * Show loading state while checking if user is logged in
   * 
   * This happens on initial page load when we check localStorage
   */
  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-xl)' }}>
        <p>Loading authentication state...</p>
      </div>
    );
  }
  
  /**
   * Show logged-in view
   * 
   * If user is authenticated, show their info and a logout button
   */
  if (isAuthenticated && user) {
    return (
      <div style={{ padding: 'var(--space-xl)' }}>
        <h2>✅ You are logged in!</h2>
        
        <div style={{ 
          marginTop: 'var(--space-lg)',
          padding: 'var(--space-lg)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)'
        }}>
          <h3>User Information</h3>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
          <p><strong>Join Date:</strong> {new Date(user.joinDate).toLocaleDateString()}</p>
          <p><strong>Average Rating:</strong> {user.averageRating} ⭐</p>
        </div>
        
        <button
          onClick={handleLogout}
          style={{
            marginTop: 'var(--space-lg)',
            padding: 'var(--space-md) var(--space-xl)',
            backgroundColor: 'var(--color-error)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          Logout
        </button>
      </div>
    );
  }
  
  /**
   * Show login form
   * 
   * If user is not authenticated, show a login form
   */
  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      <h2>🔐 Login Example</h2>
      <p>This demonstrates how to use the AuthContext.</p>
      
      <form onSubmit={handleLogin} style={{ marginTop: 'var(--space-lg)', maxWidth: '400px' }}>
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 'var(--space-md)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-base)',
            }}
          />
        </div>
        
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 'var(--space-md)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-base)',
            }}
          />
        </div>
        
        {error && (
          <div style={{
            marginBottom: 'var(--space-md)',
            padding: 'var(--space-md)',
            backgroundColor: '#fee',
            color: 'var(--color-error)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-error)',
          }}>
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: 'var(--space-md) var(--space-xl)',
            backgroundColor: isSubmitting ? 'var(--color-border)' : 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div style={{
        marginTop: 'var(--space-xl)',
        padding: 'var(--space-lg)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
      }}>
        <h3>How This Works</h3>
        <ol style={{ paddingLeft: 'var(--space-lg)' }}>
          <li>The component uses <code>useAuth()</code> to access auth state</li>
          <li>It checks <code>isAuthenticated</code> to show different views</li>
          <li>The login form calls <code>login()</code> from context</li>
          <li>On success, the context updates and component re-renders</li>
          <li>The logout button calls <code>logout()</code> from context</li>
        </ol>
        
        <p style={{ marginTop: 'var(--space-md)' }}>
          <strong>Try it:</strong> If you have a user account in the backend, 
          enter your credentials above to see the context in action!
        </p>
      </div>
    </div>
  );
};

export default AuthContextExample;
