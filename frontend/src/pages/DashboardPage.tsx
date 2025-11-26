/**
 * Dashboard Page (Example Protected Page)
 * 
 * This is a simple example of a protected page that requires authentication.
 * It demonstrates how ProtectedRoute works in practice.
 * 
 * In a real application, this would be replaced with actual dashboard content
 * like user stats, recent listings, messages, etc.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: 'var(--space-xl)',
    }}>
      <h1 style={{ marginBottom: 'var(--space-lg)' }}>Dashboard</h1>
      
      <div style={{
        backgroundColor: 'var(--color-surface)',
        padding: 'var(--space-xl)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 'var(--space-lg)',
      }}>
        <h2 style={{ marginBottom: 'var(--space-md)' }}>Welcome, {user?.username}!</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
          Email: {user?.email}
        </p>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          This is a protected page. Only authenticated users can see this content.
        </p>
      </div>

      <div style={{
        backgroundColor: 'var(--color-success-light)',
        padding: 'var(--space-lg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-success)',
        marginBottom: 'var(--space-lg)',
      }}>
        <h3 style={{ color: 'var(--color-success)', marginBottom: 'var(--space-sm)' }}>
          ✅ Protected Route Working!
        </h3>
        <p style={{ color: 'var(--color-text-primary)' }}>
          You successfully accessed a protected route. The ProtectedRoute component verified
          your authentication before rendering this page.
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: 'var(--space-md)',
      }}>
        <button
          onClick={handleLogout}
          style={{
            padding: 'var(--space-md) var(--space-xl)',
            backgroundColor: 'var(--color-error)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: 'pointer',
            transition: 'var(--transition-base)',
          }}
        >
          Logout
        </button>
        
        <button
          onClick={() => navigate('/')}
          style={{
            padding: 'var(--space-md) var(--space-xl)',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: 'pointer',
            transition: 'var(--transition-base)',
          }}
        >
          Back to Home
        </button>
      </div>

      <div style={{
        marginTop: 'var(--space-2xl)',
        padding: 'var(--space-lg)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
      }}>
        <h3 style={{ marginBottom: 'var(--space-md)' }}>How ProtectedRoute Works</h3>
        <ol style={{ 
          paddingLeft: 'var(--space-xl)',
          lineHeight: 'var(--line-height-relaxed)',
          color: 'var(--color-text-secondary)',
        }}>
          <li>User tries to access a protected route (like this dashboard)</li>
          <li>ProtectedRoute component checks authentication status</li>
          <li>If not authenticated → redirect to login page</li>
          <li>If authenticated → render the protected content (this page)</li>
          <li>After login, user is redirected back to the original destination</li>
        </ol>
        
        <p style={{ 
          marginTop: 'var(--space-md)',
          color: 'var(--color-text-secondary)',
        }}>
          Try logging out and accessing <code>/dashboard</code> directly - you'll be redirected to login!
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
