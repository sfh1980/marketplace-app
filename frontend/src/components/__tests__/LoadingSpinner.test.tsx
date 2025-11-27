/**
 * LoadingSpinner Component Tests
 * 
 * Tests for the LoadingSpinner component to ensure it renders correctly
 * with different props and provides proper accessibility.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays custom message when provided', () => {
    render(<LoadingSpinner message="Loading your data..." />);
    expect(screen.getByText('Loading your data...')).toBeInTheDocument();
  });

  it('renders with small size variant', () => {
    const { container } = render(<LoadingSpinner size="small" />);
    const spinner = container.querySelector('[class*="spinnerSmall"]');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with medium size variant (default)', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[class*="spinnerMedium"]');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with large size variant', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    const spinner = container.querySelector('[class*="spinnerLarge"]');
    expect(spinner).toBeInTheDocument();
  });

  it('applies centered class when centered prop is true', () => {
    const { container } = render(<LoadingSpinner centered />);
    const containerDiv = container.querySelector('[class*="centered"]');
    expect(containerDiv).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const containerDiv = container.firstChild;
    expect(containerDiv).toHaveClass('custom-class');
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(<LoadingSpinner message="Loading..." />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('shows screen reader text when no message provided', () => {
    const { container } = render(<LoadingSpinner />);
    const srText = container.querySelector('[class*="srOnly"]');
    expect(srText).toBeInTheDocument();
    expect(srText).toHaveTextContent('Loading...');
  });
});
