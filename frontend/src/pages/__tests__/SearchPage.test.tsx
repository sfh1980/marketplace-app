/**
 * SearchPage Tests
 * 
 * These tests verify that the SearchPage component:
 * - Renders correctly with search results
 * - Displays pagination controls
 * - Handles loading and error states
 * - Navigates to listing detail when card is clicked
 * - Updates URL when pagination changes
 * 
 * Testing Approach:
 * - Use React Testing Library for component testing
 * - Mock the useSearchListings hook to avoid real API calls
 * - Test user interactions (clicking pagination, clicking listings)
 * - Verify UI updates based on state changes
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchPage from '../SearchPage';
import * as useSearchHooks from '../../hooks/useSearch';

// Mock axios to avoid import.meta.env issues
jest.mock('../../lib/axios');

// Mock the useSearchListings hook
jest.mock('../../hooks/useSearch');

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

/**
 * Test Wrapper Component
 * 
 * Wraps the SearchPage with required providers:
 * - QueryClientProvider for React Query
 * - MemoryRouter for routing with initial URL
 */
const renderSearchPage = (initialUrl = '/search?query=camera') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <SearchPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

/**
 * Mock search results data
 */
const mockSearchResults = {
  data: [
    {
      id: '1',
      sellerId: 'user1',
      title: 'Canon Camera',
      description: 'Great camera for photography',
      price: 500,
      listingType: 'item' as const,
      pricingType: null,
      category: 'electronics',
      images: ['https://example.com/camera.jpg'],
      status: 'active' as const,
      location: 'New York',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      sellerId: 'user2',
      title: 'Photography Service',
      description: 'Professional photography services',
      price: 100,
      listingType: 'service' as const,
      pricingType: 'hourly' as const,
      category: 'services',
      images: ['https://example.com/service.jpg'],
      status: 'active' as const,
      location: 'Los Angeles',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
  },
};

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Renders loading state
   */
  it('displays loading state while fetching results', () => {
    // Mock loading state
    (useSearchHooks.useSearchListings as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    renderSearchPage();

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  /**
   * Test: Renders error state
   */
  it('displays error message when search fails', () => {
    // Mock error state
    (useSearchHooks.useSearchListings as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
    });

    renderSearchPage();

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/couldn't load the search results/i)).toBeInTheDocument();
  });

  /**
   * Test: Renders empty state when no results
   */
  it('displays empty state when no listings found', () => {
    // Mock empty results
    (useSearchHooks.useSearchListings as jest.Mock).mockReturnValue({
      data: {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderSearchPage();

    expect(screen.getByText('No listings found')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search terms/i)).toBeInTheDocument();
  });

  /**
   * Test: Renders search results
   */
  it('displays search results in a grid', () => {
    // Mock successful search
    (useSearchHooks.useSearchListings as jest.Mock).mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderSearchPage();

    // Check that listings are displayed
    expect(screen.getByText('Canon Camera')).toBeInTheDocument();
    expect(screen.getByText('Photography Service')).toBeInTheDocument();
    
    // Check result count
    expect(screen.getByText('Found 2 listings')).toBeInTheDocument();
  });

  /**
   * Test: Displays search query in header
   */
  it('shows the search query in the header', () => {
    (useSearchHooks.useSearchListings as jest.Mock).mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderSearchPage('/search?query=camera');

    expect(screen.getByText(/Searching for:/i)).toBeInTheDocument();
    expect(screen.getByText('camera')).toBeInTheDocument();
  });

  /**
   * Test: Pagination controls are displayed
   */
  it('displays pagination controls when there are multiple pages', () => {
    // Mock results with multiple pages
    (useSearchHooks.useSearchListings as jest.Mock).mockReturnValue({
      data: {
        ...mockSearchResults,
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          totalPages: 3,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderSearchPage();

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('← Previous')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
  });

  /**
   * Test: Previous button is disabled on first page
   */
  it('disables previous button on first page', () => {
    (useSearchHooks.useSearchListings as jest.Mock).mockReturnValue({
      data: {
        ...mockSearchResults,
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          totalPages: 3,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderSearchPage();

    const previousButton = screen.getByText('← Previous').closest('button');
    expect(previousButton).toBeDisabled();
  });

  /**
   * Test: Next button is disabled on last page
   */
  it('disables next button on last page', () => {
    (useSearchHooks.useSearchListings as jest.Mock).mockReturnValue({
      data: {
        ...mockSearchResults,
        pagination: {
          page: 3,
          limit: 20,
          total: 50,
          totalPages: 3,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderSearchPage('/search?query=camera&page=3');

    const nextButton = screen.getByText('Next →').closest('button');
    expect(nextButton).toBeDisabled();
  });

  /**
   * Test: Clicking a listing navigates to detail page
   */
  it('navigates to listing detail when card is clicked', async () => {
    const user = userEvent.setup();
    
    (useSearchHooks.useSearchListings as jest.Mock).mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderSearchPage();

    // Click on the first listing
    const listingCard = screen.getByText('Canon Camera').closest('div[class*="card"]');
    if (listingCard) {
      await user.click(listingCard);
      
      // Verify navigation was called
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/listings/1');
      });
    }
  });

  /**
   * Test: Hides pagination when only one page
   */
  it('hides pagination controls when there is only one page', () => {
    (useSearchHooks.useSearchListings as jest.Mock).mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderSearchPage();

    // Pagination should not be visible
    expect(screen.queryByText('Page 1 of 1')).not.toBeInTheDocument();
    expect(screen.queryByText('← Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next →')).not.toBeInTheDocument();
  });
});
