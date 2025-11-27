/**
 * ErrorMessage Component Tests
 * 
 * Tests for the ErrorMessage component to ensure it displays errors correctly
 * with proper styling and actions.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders with required message prop', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays default title for error variant', () => {
    render(<ErrorMessage message="Error occurred" />);
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
  });

  it('displays custom title when provided', () => {
    render(<ErrorMessage title="Custom Error" message="Error occurred" />);
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('displays details when provided', () => {
    render(<ErrorMessage message="Error" details="Technical error details" />);
    expect(screen.getByText('Technical Details')).toBeInTheDocument();
    expect(screen.getByText('Technical error details')).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    const handleRetry = jest.fn();
    render(<ErrorMessage message="Error" onRetry={handleRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders custom actions when provided', () => {
    render(
      <ErrorMessage 
        message="Error" 
        actions={<button>Custom Action</button>}
      />
    );
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });

  it('applies error variant styling by default', () => {
    const { container } = render(<ErrorMessage message="Error" />);
    const errorContainer = container.querySelector('[class*="error"]');
    expect(errorContainer).toBeInTheDocument();
  });

  it('applies warning variant styling', () => {
    const { container } = render(<ErrorMessage message="Warning" variant="warning" />);
    const warningContainer = container.querySelector('[class*="warning"]');
    expect(warningContainer).toBeInTheDocument();
  });

  it('applies info variant styling', () => {
    const { container } = render(<ErrorMessage message="Info" variant="info" />);
    const infoContainer = container.querySelector('[class*="info"]');
    expect(infoContainer).toBeInTheDocument();
  });

  it('shows icon by default', () => {
    const { container } = render(<ErrorMessage message="Error" />);
    const icon = container.querySelector('[class*="icon"]');
    expect(icon).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    const { container } = render(<ErrorMessage message="Error" showIcon={false} />);
    const icon = container.querySelector('[class*="icon"]');
    expect(icon).not.toBeInTheDocument();
  });

  it('has proper ARIA attributes for accessibility', () => {
    const { container } = render(<ErrorMessage message="Error" />);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorMessage message="Error" className="custom-error" />);
    const errorContainer = container.firstChild;
    expect(errorContainer).toHaveClass('custom-error');
  });
});
