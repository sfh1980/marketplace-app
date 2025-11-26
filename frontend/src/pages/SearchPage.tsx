/**
 * SearchPage Component
 * 
 * This page displays search results in a grid layout with pagination.
 * 
 * Key Features:
 * - Responsive grid layout that adapts to screen size
 * - Pagination controls for navigating through results
 * - URL query parameters for shareable search links
 * - Loading and empty states
 * - Integration with search service
 * 
 * Educational Focus:
 * - Grid Layouts: Using CSS Grid for responsive multi-column layouts
 * - Pagination UI: Implementing page navigation controls
 * - URL State Management: Using query parameters to maintain state
 * - React Query: Automatic caching and refetching
 * 
 * Requirements: 4.2 (Search listings with query)
 */

import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearchListings } from '../hooks/useSearch';
import { ListingCard } from '../components/ListingCard';
import { FilterPanel } from '../components/FilterPanel';
import { Button } from '../components/Button';
import type { SearchParams } from '../types/api';
import styles from './SearchPage.module.css';

/**
 * SearchPage Component
 * 
 * This component demonstrates several important patterns:
 * 
 * 1. URL State Management: We use URL query parameters to store search state
 *    - Benefits: Shareable URLs, browser back/forward works, refresh preserves state
 *    - useSearchParams hook from React Router manages this
 * 
 * 2. Pagination: We break results into pages for better performance and UX
 *    - Shows current page, total pages, and navigation controls
 *    - Disables buttons appropriately (can't go to page 0 or beyond last page)
 * 
 * 3. Grid Layout: CSS Grid creates a responsive multi-column layout
 *    - Automatically adjusts columns based on screen size
 *    - Maintains consistent spacing and alignment
 * 
 * 4. Loading States: We show appropriate UI while data is loading
 *    - Prevents layout shift and confusion
 *    - Provides feedback to the user
 */
const SearchPage: React.FC = () => {
  // URL query parameters management
  // useSearchParams gives us access to ?query=camera&page=2 etc.
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  /**
   * Extract search parameters from URL
   * 
   * We read the URL query parameters and convert them to our SearchParams type.
   * This allows users to bookmark searches or share search URLs.
   * 
   * Example URL: /search?query=camera&category=electronics&page=2
   */
  const getSearchParamsFromUrl = (): SearchParams => {
    const params: SearchParams = {};
    
    // Get query string (search text)
    // Support both 'query' and 'q' parameters for flexibility
    const query = searchParams.get('query') || searchParams.get('q');
    if (query) params.query = query;
    
    // Get category filter
    const category = searchParams.get('category');
    if (category) params.category = category;
    
    // Get listing type filter (item or service)
    const listingType = searchParams.get('listingType');
    if (listingType === 'item' || listingType === 'service') {
      params.listingType = listingType;
    }
    
    // Get price range filters
    const minPrice = searchParams.get('minPrice');
    if (minPrice) params.minPrice = parseFloat(minPrice);
    
    const maxPrice = searchParams.get('maxPrice');
    if (maxPrice) params.maxPrice = parseFloat(maxPrice);
    
    // Get location filter
    const location = searchParams.get('location');
    if (location) params.location = location;
    
    // Get pagination parameters
    const page = searchParams.get('page');
    params.page = page ? parseInt(page, 10) : 1;
    
    // Default to 20 items per page
    params.limit = 20;
    
    return params;
  };

  // Get current search parameters from URL
  const currentSearchParams = getSearchParamsFromUrl();

  /**
   * Fetch search results using React Query
   * 
   * useSearchListings hook:
   * - Automatically fetches data when params change
   * - Caches results to avoid unnecessary requests
   * - Provides loading and error states
   * - Keeps previous data while fetching new results (no flash of empty content)
   */
  const { data, isLoading, isError, error } = useSearchListings(currentSearchParams);

  /**
   * Handle page change
   * 
   * When user clicks pagination buttons, we update the URL query parameters.
   * This triggers a re-render and new data fetch.
   * 
   * @param newPage - The page number to navigate to
   */
  const handlePageChange = (newPage: number) => {
    // Create new URLSearchParams with updated page
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    
    // Update URL (this will trigger a re-render and new data fetch)
    setSearchParams(newParams);
    
    // Scroll to top of page for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handle listing click
   * 
   * Navigate to the listing detail page when a card is clicked
   */
  const handleListingClick = (listingId: string) => {
    navigate(`/listings/${listingId}`);
  };

  /**
   * Render loading state
   * 
   * Show a loading message while data is being fetched.
   * This prevents confusion and provides feedback to the user.
   */
  if (isLoading) {
    return (
      <div className={styles.searchPage}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <p>Searching...</p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   * 
   * If the API request fails, show an error message.
   * In a production app, you might want more sophisticated error handling.
   */
  if (isError) {
    return (
      <div className={styles.searchPage}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <h2>Oops! Something went wrong</h2>
            <p>We couldn't load the search results. Please try again.</p>
            {error && <p className={styles.errorDetails}>{error.message}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Extract listings and pagination info from response
  const listings = data?.data || [];
  const pagination = data?.pagination;

  /**
   * Render empty state
   * 
   * If search returns no results, show a helpful message.
   * This is better UX than showing a blank page.
   */
  if (listings.length === 0) {
    return (
      <div className={styles.searchPage}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Search Results</h1>
            {currentSearchParams.query && (
              <p className={styles.searchQuery}>
                Searching for: <strong>{currentSearchParams.query}</strong>
              </p>
            )}
          </div>
          
          <div className={styles.emptyState}>
            <h2>No listings found</h2>
            <p>Try adjusting your search terms or filters.</p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render search results
   * 
   * Main content: header, filter panel sidebar, grid of listings, and pagination controls
   * 
   * Layout Pattern: Two-column layout with sidebar
   * - Left sidebar: FilterPanel (sticky positioning)
   * - Right main area: Search results and pagination
   * - Responsive: Sidebar moves to top on mobile
   */
  return (
    <div className={styles.searchPage}>
      <div className={styles.container}>
        {/* 
          Header Section
          
          Shows the search query and result count
        */}
        <div className={styles.header}>
          <h1>Search Results</h1>
          {currentSearchParams.query && (
            <p className={styles.searchQuery}>
              Searching for: <strong>{currentSearchParams.query}</strong>
            </p>
          )}
          {pagination && (
            <p className={styles.resultCount}>
              Found {pagination.total} {pagination.total === 1 ? 'listing' : 'listings'}
            </p>
          )}
        </div>

        {/* 
          Two-Column Layout: Sidebar + Main Content
          
          This layout pattern is common in e-commerce and marketplace sites:
          - Sidebar: Filters (sticky, stays visible while scrolling)
          - Main: Results (scrollable content)
          
          CSS Grid creates this layout:
          - grid-template-columns: 280px 1fr
          - 280px: Fixed width sidebar
          - 1fr: Main content takes remaining space
          
          On mobile, we switch to single column (sidebar on top)
        */}
        <div className={styles.contentLayout}>
          {/* 
            Filter Sidebar
            
            FilterPanel component handles all filter logic:
            - Fetches categories from API
            - Manages filter state
            - Updates URL parameters
            - Shows active filter count
            
            Requirements: 4.3, 4.4, 4.5, 4.6
          */}
          <aside className={styles.sidebar}>
            <FilterPanel />
          </aside>

          {/* 
            Main Content Area
            
            Contains the listings grid and pagination
          */}
          <main className={styles.mainContent}>
            {/* 
              Listings Grid
              
              CSS Grid Layout:
              - Automatically creates columns based on available space
              - Responsive: Adjusts number of columns for different screen sizes
              - Consistent spacing between items
              - Equal height cards in each row
              
              The grid is defined in the CSS file using:
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              
              This means:
              - repeat: Create multiple columns
              - auto-fill: Create as many columns as will fit
              - minmax(280px, 1fr): Each column is at least 280px, but can grow to fill space
              - 1fr: Fraction of available space (equal width columns)
            */}
            <div className={styles.listingsGrid}>
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => handleListingClick(listing.id)}
                />
              ))}
            </div>

            {/* 
              Pagination Controls
              
              Pagination UI Pattern:
              - Shows current page and total pages
              - Previous/Next buttons for navigation
              - Buttons disabled when at boundaries (first/last page)
              - Page numbers for direct navigation (optional enhancement)
              
              Why Pagination?
              - Performance: Loading 1000 listings at once is slow
              - UX: Users can't scan 1000 items effectively
              - Bandwidth: Reduces data transfer
              - Server load: Reduces database queries
            */}
            {pagination && pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                {/* Previous Page Button */}
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  ← Previous
                </Button>

                {/* Page Info */}
                <span className={styles.pageInfo}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                {/* Next Page Button */}
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next →
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

/**
 * Display name for debugging
 */
SearchPage.displayName = 'SearchPage';

export default SearchPage;
