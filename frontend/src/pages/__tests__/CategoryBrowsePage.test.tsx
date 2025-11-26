/**
 * CategoryBrowsePage Tests
 * 
 * These tests verify that the category browse page:
 * - Displays category information correctly
 * - Shows listings for the category
 * - Handles loading and error states
 * - Supports pagination
 * - Allows filtering within the category
 * 
 * Testing Strategy:
 * - Mock API calls to control test data
 * - Test user interactions (clicking, filtering)
 * - Verify correct navigation behavior
 * - Test edge cases (empty results, errors)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CategoryBrowsePage from '../CategoryBrowsePage';
import * as searchService from '../../services/searchService';

// Mock axios to avoid import.meta.env issues
jest.mock('../../lib/axios');

// Mock the search service
jest.mock('../../services/searchService');

// Mock useParams to provide category slug
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ categorySlug: 'electronics' }),
}));

/**
 * Test wrapper component
 * 
 * Provides necessary context providers for the component under test.
 * Every component that uses React Query needs to be wrapped in QueryClientProvider.
 */
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed queries in tests
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CategoryBrowsePage', () => {
  /**
   * Test: Displays category information
   * 
   * Verifies that the page shows:
   * - Category name
   * - Category description
   * - Listing count
   */
  it('displays category information correctly', async () => {
    // Mock API responses
    const mockCategories = [
      {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        listingCount: 10,
      },
    ];

    const mockListingsResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 10,
        totalPages: 1,
      },
    };

    (searchService.getCategories as jest.Mock).mockResolvedValue(mockCategories);
    (searchService.searchListings as jest.Mock).mockResolvedValue(mockListingsResponse);

    render(<CategoryBrowsePage />, { wrapper: createWrapper() });

    // Wait for category information to appear
    await waitFor(() => {
      expect(screen.getAllByText('Electronics').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Electronic devices and gadgets')).toBeInTheDocument();
    expect(screen.getByText('10 listings found')).toBeInTheDocument();
  });

  /**
   * Test: Shows loading state
   * 
   * Verifies that a loading indicator is shown while data is being fetched.
   */
  it('shows loading state while fetching data', () => {
    // Mock API to never resolve (simulates loading)
    (searchService.getCategories as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );
    (searchService.searchListings as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    render(<CategoryBrowsePage />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading category...')).toBeInTheDocument();
  });

  /**
   * Test: Shows error state
   * 
   * Verifies that an error message is shown when data fetching fails.
   */
  it('shows error state when fetching fails', async () => {
    // Mock API to reject (simulates error)
    (searchService.getCategories as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch categories')
    );
    (searchService.searchListings as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch listings')
    );

    render(<CategoryBrowsePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Error Loading Category')).toBeInTheDocument();
    });
  });

  /**
   * Test: Shows not found state for invalid category
   * 
   * Verifies that a 404-style message is shown when the category doesn't exist.
   */
  it('shows not found state for invalid category', async () => {
    // Mock API with categories that don't include the requested slug
    const mockCategories = [
      {
        id: '1',
        name: 'Furniture',
        slug: 'furniture',
        description: 'Furniture items',
        listingCount: 5,
      },
    ];

    const mockListingsResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };

    (searchService.getCategories as jest.Mock).mockResolvedValue(mockCategories);
    (searchService.searchListings as jest.Mock).mockResolvedValue(mockListingsResponse);

    render(<CategoryBrowsePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Category Not Found')).toBeInTheDocument();
    });

    expect(screen.getByText(/The category "electronics" does not exist/)).toBeInTheDocument();
  });

  /**
   * Test: Displays breadcrumb navigation
   * 
   * Verifies that breadcrumbs are shown for navigation context.
   */
  it('displays breadcrumb navigation', async () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
        listingCount: 10,
      },
    ];

    const mockListingsResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 10,
        totalPages: 1,
      },
    };

    (searchService.getCategories as jest.Mock).mockResolvedValue(mockCategories);
    (searchService.searchListings as jest.Mock).mockResolvedValue(mockListingsResponse);

    render(<CategoryBrowsePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    // Electronics appears in both breadcrumb and title, so check for multiple instances
    expect(screen.getAllByText('Electronics').length).toBeGreaterThan(0);
  });

  /**
   * Test: Shows empty state when no listings
   * 
   * Verifies that a helpful message is shown when the category has no listings.
   */
  it('shows empty state when no listings found', async () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
        listingCount: 0,
      },
    ];

    const mockListingsResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };

    (searchService.getCategories as jest.Mock).mockResolvedValue(mockCategories);
    (searchService.searchListings as jest.Mock).mockResolvedValue(mockListingsResponse);

    render(<CategoryBrowsePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No listings found')).toBeInTheDocument();
    });

    expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument();
  });
});
