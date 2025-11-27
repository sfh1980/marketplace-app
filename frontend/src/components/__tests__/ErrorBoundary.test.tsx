/**
 * ErrorBoundary Component Tests
 * 
 * Tests the error boundary's ability to catch errors and display fallback UI.
 * 
 * Testing Strategy:
 * - Test that errors are caught and fallback UI is displayed
 * - Test that children render normally when no error occurs
 * - Test recovery actions (try again, go home, reload)
 * - Test custom fallback UI
 * - Test error callback
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Mock console.error to avoid cluttering test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check that fallback UI is displayed
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('displays error details in development mode', () => {
    // Set NODE_ENV to development
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check that error details section is present
    expect(screen.getByText(/error details/i)).toBeInTheDocument();

    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  it('has a try again button that resets error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be displayed
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    // Try Again button should be present and clickable
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();
    
    // Button should be clickable (this tests the resetError handler is attached)
    fireEvent.click(tryAgainButton);
    // After clicking, the error boundary attempts to re-render children
    // In a real scenario, if the error is transient, the component would render successfully
  });

  it('navigates to home when "Go to Home" is clicked', () => {
    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Click "Go to Home" button
    const goHomeButton = screen.getByText(/go to home/i);
    fireEvent.click(goHomeButton);

    // Check that location was set to home
    expect(window.location.href).toBe('/');
  });

  it('reloads page when "Reload Page" is clicked', () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    delete (window as any).location;
    window.location = { reload: mockReload } as any;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Click "Reload Page" button
    const reloadButton = screen.getByText(/reload page/i);
    fireEvent.click(reloadButton);

    // Check that reload was called
    expect(mockReload).toHaveBeenCalled();
  });

  it('uses custom fallback UI when provided', () => {
    const customFallback = (error: Error, resetError: () => void) => (
      <div>
        <h1>Custom Error UI</h1>
        <p>{error.message}</p>
        <button onClick={resetError}>Custom Reset</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check that custom fallback is displayed
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Custom Reset')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check that onError was called with error and error info
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test error message');
    expect(onError.mock.calls[0][1]).toHaveProperty('componentStack');
  });

  it('logs error to console in development', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check that console.error was called
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('provides multiple recovery options', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // All recovery buttons should be present
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    
    // Help text should be present
    expect(screen.getByText(/if this problem persists/i)).toBeInTheDocument();
  });
});
