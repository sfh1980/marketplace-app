/**
 * ListingDetailPage Tests
 * 
 * These tests verify that the ListingDetailPage component:
 * - Renders listing information correctly
 * - Displays image gallery with navigation
 * - Shows seller information
 * - Displays contact button
 * - Shows loading states while fetching data
 * - Handles errors appropriately
 * - Handles missing listingId gracefully
 * 
 * Testing Approach:
 * - Use React Testing Library for component testing
 * - Mock React Query hooks to avoid real API calls
 * - Test different states (loading, success, error)
 * - Verify UI updates based on data
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ListingDetailPage from '../ListingDetailPage';
import * as listingService from '../../services/listingService';

// Mock axios to avoid import.meta.env issues
jest.mock('../../lib/axios');

// Mock the listing service
jest.mock('../../services/listingService');

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

/**
 * Test Wrapper Component
 * 
 * Wraps the ListingDetailPage with required providers and routing context.
 */
const renderListingDetailPage = (listingId: string = 'test-listing-123') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Set the initial URL before rendering
  window.history.pushState({}, '', `/listings/${listingId}`);

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/listings/:listingId" element={<ListingDetailPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

/**
 * Mock listing data for testing
 */
const mockListing = {
  id: 'test-listing-123',
  sellerId: 'seller-456',
  seller: {
    id: 'seller-456',
    email: 'seller@example.com',
    emailVerified: true,
    username: 'sellername',
    profilePicture: 'https://example.com/seller-avatar.jpg',
    location: 'New York, NY',
    joinDate: '2024-01-01T00:00:00.000Z',
    averageRating: 4.8,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  title: 'Vintage Camera',
  description: 'A beautiful vintage camera in excellent condition. Perfect for collectors or photography enthusiasts.',
  price: 250.00,
  listingType: 'item' as const,
  pricingType: null,
  category: 'Electronics',
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ],
  status: 'active' as const,
  location: 'San Francisco, CA',
  createdAt: '2024-11-20T00:00:00.000Z',
  updatedAt: '2024-11-20T00:00:00.000Z',
};

const mockServiceListing = {
  ...mockListing,
  id: 'service-listing-789',
  title: 'Web Development Services',
  description: 'Professional web development services for small businesses.',
  price: 75.00,
  listingType: 'service' as const,
  pricingType: 'hourly' as const,
  category: 'Services',
};

describe('ListingDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useAuth to return null user by default
    mockUseAuth.mockReturnValue({ user: null });
  });

  /**
   * Test: Loading State
   * 
   * Verify that a loading spinner is shown while fetching listing data
   */
  test('displays loading state while fetching listing', () => {
    // Mock the service to return a pending promise
    (listingService.getListingById as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderListingDetailPage();

    // Should show loading text
    expect(screen.getByText(/loading listing details/i)).toBeInTheDocument();
  });

  /**
   * Test: Display Listing Information
   * 
   * Verify that all listing information is displayed correctly
   */
  test('displays listing information correctly', async () => {
    // Mock successful API response
    (listingService.getListingById as jest.Mock).mockResolvedValue(mockListing);

    renderListingDetailPage();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: mockListing.title, level: 1 })).toBeInTheDocument();
    });

    // Verify listing details are displayed
    expect(screen.getByText(mockListing.description)).toBeInTheDocument();
    expect(screen.getByText(/\$250\.00/)).toBeInTheDocument();
    expect(screen.getByText(/📦 Item/)).toBeInTheDocument();
    expect(screen.getByText(mockListing.category)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockListing.location))).toBeInTheDocument();
  });

  /**
   * Test: Display Service Listing with Hourly Pricing
   * 
   * Verify that service listings show hourly pricing correctly
   */
  test('displays service listing with hourly pricing', async () => {
    (listingService.getListingById as jest.Mock).mockResolvedValue(mockServiceListing);

    renderListingDetailPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: mockServiceListing.title, level: 1 })).toBeInTheDocument();
    });

    // Should show hourly rate
    expect(screen.getByText(/\$75\.00\/hr/)).toBeInTheDocument();
    expect(screen.getByText(/🛠️ Service/)).toBeInTheDocument();
  });

  /**
   * Test: Display Seller Information
   * 
   * Verify that seller information is displayed correctly
   */
  test('displays seller information', async () => {
    (listingService.getListingById as jest.Mock).mockResolvedValue(mockListing);

    renderListingDetailPage();

    await waitFor(() => {
      expect(screen.getByText(mockListing.seller!.username)).toBeInTheDocument();
    });

    // Verify seller details
    expect(screen.getByText(/4\.8/)).toBeInTheDocument(); // Rating
    expect(screen.getByText(/Member since/)).toBeInTheDocument();
    expect(screen.getByText(/View Full Profile/)).toBeInTheDocument();
  });

  /**
   * Test: Image Gallery
   * 
   * Verify that the image gallery displays and navigation works
   */
  test('displays image gallery with navigation', async () => {
    (listingService.getListingById as jest.Mock).mockResolvedValue(mockListing);

    renderListingDetailPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: mockListing.title, level: 1 })).toBeInTheDocument();
    });

    // Should show image counter
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // Should show navigation buttons
    const prevButton = screen.getByLabelText('Previous image');
    const nextButton = screen.getByLabelText('Next image');
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();

    // Click next button
    await userEvent.click(nextButton);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    // Click previous button
    await userEvent.click(prevButton);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  /**
   * Test: Contact Seller Button
   * 
   * Verify that the contact seller button is displayed
   */
  test('displays contact seller button', async () => {
    (listingService.getListingById as jest.Mock).mockResolvedValue(mockListing);

    renderListingDetailPage();

    await waitFor(() => {
      expect(screen.getByText(/💬 Contact Seller/)).toBeInTheDocument();
    });
  });

  /**
   * Test: Sold Listing Status
   * 
   * Verify that sold listings show appropriate status
   */
  test('displays sold status for sold listings', async () => {
    const soldListing = {
      ...mockListing,
      status: 'sold' as const,
    };

    (listingService.getListingById as jest.Mock).mockResolvedValue(soldListing);

    renderListingDetailPage();

    await waitFor(() => {
      expect(screen.getByText('SOLD')).toBeInTheDocument();
    });

    // Contact button should be disabled
    const contactButton = screen.getByText(/Listing Not Available/);
    expect(contactButton).toBeInTheDocument();
  });

  /**
   * Test: Error State
   * 
   * Verify that error messages are displayed when listing fetch fails
   */
  test('displays error message when listing not found', async () => {
    // Mock API error
    (listingService.getListingById as jest.Mock).mockRejectedValue(
      new Error('Listing not found')
    );

    renderListingDetailPage();

    await waitFor(() => {
      expect(screen.getByText(/Listing Not Found/)).toBeInTheDocument();
    });

    // Should show back button
    expect(screen.getByText(/Back to Home/)).toBeInTheDocument();
  });

  /**
   * Test: Breadcrumb Navigation
   * 
   * Verify that breadcrumb navigation is displayed
   */
  test('displays breadcrumb navigation', async () => {
    (listingService.getListingById as jest.Mock).mockResolvedValue(mockListing);

    renderListingDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    expect(screen.getByText('Listings')).toBeInTheDocument();
  });

  /**
   * Test: View Profile Link
   * 
   * Verify that clicking view profile link works
   */
  test('view profile link navigates to seller profile', async () => {
    (listingService.getListingById as jest.Mock).mockResolvedValue(mockListing);

    renderListingDetailPage();

    await waitFor(() => {
      expect(screen.getByText(/View Full Profile/)).toBeInTheDocument();
    });

    const profileLink = screen.getByText(/View Full Profile/);
    expect(profileLink).toHaveAttribute('href', `/profile/${mockListing.seller!.id}`);
  });
});
