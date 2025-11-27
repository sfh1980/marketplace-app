/**
 * EmptyState Component Tests
 * 
 * Tests for the EmptyState component to ensure it displays empty states correctly
 * with proper messaging and actions.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders with required props', () => {
    render(<EmptyState title="No Data" message="There is no data to display" />);
    expect(screen.getByText('No Data')).toBeInTheDocument();
    expect(screen.getByText('There is no data to display')).toBeInTheDocument();
  });

  it('displays icon when provided as string', () => {
    const { container } = render(
      <EmptyState icon="📦" title="No Items" message="No items found" />
    );
    const emoji = container.querySelector('[class*="emoji"]');
    expect(emoji).toBeInTheDocument();
    expect(emoji).toHaveTextContent('📦');
  });

  it('displays icon when provided as React node', () => {
    render(
      <EmptyState 
        icon={<div data-testid="custom-icon">Icon</div>} 
        title="No Items" 
        message="No items found" 
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders without icon when not provided', () => {
    const { container } = render(
      <EmptyState title="No Items" message="No items found" />
    );
    const icon = container.querySelector('[class*="icon"]');
    expect(icon).not.toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    render(
      <EmptyState 
        title="No Items" 
        message="No items found"
        action={<button>Create Item</button>}
      />
    );
    expect(screen.getByText('Create Item')).toBeInTheDocument();
  });

  it('applies small size variant', () => {
    const { container } = render(
      <EmptyState title="No Items" message="No items found" size="small" />
    );
    const emptyContainer = container.querySelector('[class*="small"]');
    expect(emptyContainer).toBeInTheDocument();
  });

  it('applies medium size variant (default)', () => {
    const { container } = render(
      <EmptyState title="No Items" message="No items found" />
    );
    const emptyContainer = container.querySelector('[class*="medium"]');
    expect(emptyContainer).toBeInTheDocument();
  });

  it('applies large size variant', () => {
    const { container } = render(
      <EmptyState title="No Items" message="No items found" size="large" />
    );
    const emptyContainer = container.querySelector('[class*="large"]');
    expect(emptyContainer).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState 
        title="No Items" 
        message="No items found" 
        className="custom-empty"
      />
    );
    const emptyContainer = container.firstChild;
    expect(emptyContainer).toHaveClass('custom-empty');
  });

  it('renders with all props combined', () => {
    render(
      <EmptyState 
        icon="🔍"
        title="No Results"
        message="Try adjusting your search"
        action={<button>Clear Filters</button>}
        size="large"
        className="search-empty"
      />
    );
    
    expect(screen.getByText('No Results')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search')).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });
});
