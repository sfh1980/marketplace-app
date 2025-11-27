/**
 * ListingCard Component Tests
 * 
 * These tests verify that the ListingCard component:
 * - Renders listing information correctly
 * - Handles different listing types (item vs service)
 * - Shows pricing correctly (fixed vs hourly)
 * - Displays status badges for non-active listings
 * - Handles click events
 * - Shows/hides location based on props
 * 
 * Educational Focus:
 * - Component testing with React Testing Library
 * - Testing conditional rendering
 * - Testing user interactions
 * - Testing with different prop combinations
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListingCard } from '../ListingCard';
import type { Listing } from '../../types/api';

/**
 * Helper function to create mock listing data
 * 
 * This makes tests more readable and maintainable.
 * We can override specific properties for each test.
 */
const createMockListing = (overrides?: Partial<Listing>): Listing => ({
  id: '1',
  sellerId: 'seller-1',
  title: 'Test Listing',
  description: 'Test description',
  price: 99.99,
  listingType: 'item',
  pricingType: null,
  category: 'Electronics',
  images: ['https://example.com/image.jpg'],
  status: 'active',
  location: 'New York, NY',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('ListingCard', () => {
  /**
   * Test: Basic rendering
   * 
   * Verifies that the component renders all essential information
   */
  it('renders listing information correctly', () => {
    const listing = createMockListing();
    
    render(<ListingCard listing={listing} />);
    
    // Check that title is displayed
    expect(screen.getByText('Test Listing')).toBeInTheDocument();
    
    // Check that price is displayed with correct formatting
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    
    // Check that location is displayed
    expect(screen.getByText(/New York, NY/)).toBeInTheDocument();
    
    // Check that listing type badge is displayed
    expect(screen.getByText('📦 Item')).toBeInTheDocument();
  });

  /**
   * Test: Item listing type
   * 
   * Verifies that item listings show the correct badge
   */
  it('displays item badge for item listings', () => {
    const listing = createMockListing({ listingType: 'item' });
    
    render(<ListingCard listing={listing} />);
    
    expect(screen.getByText('📦 Item')).toBeInTheDocument();
  });

  /**
   * Test: Service listing type
   * 
   * Verifies that service listings show the correct badge
   */
  it('displays service badge for service listings', () => {
    const listing = createMockListing({ listingType: 'service' });
    
    render(<ListingCard listing={listing} />);
    
    expect(screen.getByText('🛠️ Service')).toBeInTheDocument();
  });

  /**
   * Test: Hourly pricing
   * 
   * Verifies that hourly services show "/hr" suffix
   */
  it('displays hourly rate for service listings with hourly pricing', () => {
    const listing = createMockListing({
      listingType: 'service',
      pricingType: 'hourly',
      price: 50,
    });
    
    render(<ListingCard listing={listing} />);
    
    expect(screen.getByText('$50.00/hr')).toBeInTheDocument();
  });

  /**
   * Test: Fixed pricing
   * 
   * Verifies that fixed price services don't show "/hr" suffix
   */
  it('displays fixed price without hourly indicator', () => {
    const listing = createMockListing({
      listingType: 'service',
      pricingType: 'fixed',
      price: 100,
    });
    
    render(<ListingCard listing={listing} />);
    
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.queryByText(/\/hr/)).not.toBeInTheDocument();
  });

  /**
   * Test: Status badge for sold listings
   * 
   * Verifies that sold listings show a status badge
   */
  it('displays status badge for sold listings', () => {
    const listing = createMockListing({ status: 'sold' });
    
    render(<ListingCard listing={listing} />);
    
    expect(screen.getByText('SOLD')).toBeInTheDocument();
  });

  /**
   * Test: Status badge for completed listings
   * 
   * Verifies that completed listings show a status badge
   */
  it('displays status badge for completed listings', () => {
    const listing = createMockListing({ status: 'completed' });
    
    render(<ListingCard listing={listing} />);
    
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  /**
   * Test: No status badge for active listings
   * 
   * Verifies that active listings don't show a status badge
   */
  it('does not display status badge for active listings', () => {
    const listing = createMockListing({ status: 'active' });
    
    render(<ListingCard listing={listing} />);
    
    expect(screen.queryByText('SOLD')).not.toBeInTheDocument();
    expect(screen.queryByText('COMPLETED')).not.toBeInTheDocument();
  });

  /**
   * Test: Click handler
   * 
   * Verifies that clicking the card calls the onClick handler
   */
  it('calls onClick handler when clicked', async () => {
    const listing = createMockListing();
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<ListingCard listing={listing} onClick={handleClick} />);
    
    // Find the card (it's rendered as a button when onClick is provided)
    const card = screen.getByRole('button');
    
    // Click the card
    await user.click(card);
    
    // Verify onClick was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Hide location
   * 
   * Verifies that location can be hidden with showLocation prop
   */
  it('hides location when showLocation is false', () => {
    const listing = createMockListing();
    
    render(<ListingCard listing={listing} showLocation={false} />);
    
    expect(screen.queryByText(/New York, NY/)).not.toBeInTheDocument();
  });

  /**
   * Test: Show location by default
   * 
   * Verifies that location is shown by default
   */
  it('shows location by default', () => {
    const listing = createMockListing();
    
    render(<ListingCard listing={listing} />);
    
    expect(screen.getByText(/New York, NY/)).toBeInTheDocument();
  });

  /**
   * Test: Image rendering
   * 
   * Verifies that the listing image is rendered with correct alt text
   */
  it('renders listing image with correct alt text', () => {
    const listing = createMockListing();
    
    render(<ListingCard listing={listing} />);
    
    // Updated to match new alt text format that includes listing type
    const image = screen.getByAltText('Test Listing - item');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  /**
   * Test: No image
   * 
   * Verifies that the component handles listings without images
   */
  it('handles listings without images gracefully', () => {
    const listing = createMockListing({ images: [] });
    
    render(<ListingCard listing={listing} />);
    
    // Should still render title and price
    expect(screen.getByText('Test Listing')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    
    // Should not render an image
    expect(screen.queryByAltText('Test Listing')).not.toBeInTheDocument();
  });

  /**
   * Test: Custom className
   * 
   * Verifies that custom className is applied
   */
  it('applies custom className', () => {
    const listing = createMockListing();
    
    const { container } = render(
      <ListingCard listing={listing} className="custom-class" />
    );
    
    // The custom class should be applied to the card
    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });
});
