/**
 * Category Browse Page
 * 
 * This page displays all listings within a specific category.
 * Users arrive here by clicking on a category from the homepage or navigation.
 * 
 * Key Features:
 * - Display category name and description
 * - Show all active listings in the category
 * - Support pagination for large result sets
 * - Allow filtering within the category
 * - Responsive grid layout
 * 
 * URL Structure:
 * /categories/:categorySlug
 * 
 * Example URLs:
 * - /categories/electronics
 * - /categories/furniture
 * - /categories/services
 * 
 * Why use slug instead of ID?
 * - SEO friendly: /categories/electronics is better than /categories/abc-123
 * - Human readable: Users can understand the URL
 * - Shareable: Easy to remember and share
 * - Bookmarkable: Users can bookmark category pages
 * 
 * Component Architecture:
 * This page reuses existing components:
 * - ListingCard: Display individual listings
 * - FilterPanel: Allow filtering within category
 * - Pagination controls (to be added)
 * 
 * Data Flow:
 * 1. Extract category slug from URL params
 * 2. Fetch category details and listings from API
 * 3. Display category info and listings
 * 4. Handle pagination and filtering
 * 
 * Educational Focus: Category Navigation
 * 
 * Category navigation is a fundamental pattern in e-commerce and marketplace apps.
 * It provides a hierarchical way to organize and discover content.
 * 
 * Navigation Hierarchy:
 * Home → Categories → Specific Category → Listing Detail
 * 
 * This creates a clear information architecture that helps users:
 * - Understand where they are in the site
 * - Navigate back to broader views
 * - Explore related items
 * - Find what they're looking for
 * 
 * Breadcrumbs Example:
 * Home > Categories > Electronics > Laptops
 * 
 * Each level provides context and navigation options.
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchListings, getCategories } from '../services/searchService';
import { ListingCard } from '../components/ListingCard';
import { FilterPanel } from '../components/FilterPanel';
import type { SearchParams } from '../types/api';
import styles from './CategoryBrowsePage.module.css';

/**
 * CategoryBrowsePage Component
 * 
 * This component handles the category browsing experience.
 * It combines category information display with filtered listing results.
 */
export default function CategoryBrowsePage() {
  // Extract category slug from URL parameters
  // useParams is a React Router hook that gives us access to URL parameters
  // For URL /categories/electronics, categorySlug will be 'electronics'
  const { categorySlug } = useParams<{ categorySlug: string }>();
  
  // useNavigate hook for programmatic navigation
  const navigate = useNavigate();

  // State for search filters
  // We start with the category filter pre-set from the URL
  const [filters, setFilters] = useState<SearchParams>({
    category: categorySlug,
    page: 1,
    limit: 20,
  });

  /**
   * Fetch all categories to find the current category details
   * 
   * Why fetch all categories?
   * - We need the category name and description to display
   * - The URL only gives us the slug
   * - We could create a separate API endpoint for single category,
   *   but fetching all categories is fast and we can cache it
   * 
   * React Query Benefits:
   * - Automatic caching: Categories are fetched once and cached
   * - Background refetching: Keeps data fresh
   * - Loading and error states: Handled automatically
   * - Deduplication: Multiple components can use same query
   */
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (categories don't change often)
  });

  /**
   * Find the current category from the categories list
   * 
   * Array.find() searches for the first element that matches the condition
   * Returns undefined if no match is found
   */
  const currentCategory = categories.find(cat => cat.slug === categorySlug);

  /**
   * Fetch listings for this category
   * 
   * React Query automatically:
   * - Fetches data when component mounts
   * - Refetches when filters change (queryKey includes filters)
   * - Caches results for fast navigation
   * - Handles loading and error states
   * 
   * queryKey: ['listings', filters]
   * - First element: Query identifier
   * - Second element: Dependencies (refetch when filters change)
   * 
   * When filters change, React Query sees the queryKey changed
   * and automatically refetches the data.
   */
  const {
    data: listingsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['listings', 'category', filters],
    queryFn: () => searchListings(filters),
    // Only fetch if we have a category slug
    enabled: !!categorySlug,
  });

  /**
   * Handle filter changes from FilterPanel
   * 
   * When user changes filters (price range, listing type, etc.),
   * we update the filters state. This triggers a refetch via React Query.
   * 
   * We preserve the category filter and reset to page 1.
   */
  const handleFilterChange = (newFilters: SearchParams) => {
    setFilters({
      ...newFilters,
      category: categorySlug, // Always keep category filter
      page: 1, // Reset to first page when filters change
    });
  };

  /**
   * Handle pagination
   * 
   * When user clicks next/previous page, update the page number.
   * React Query will automatically refetch with the new page.
   */
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
    
    // Scroll to top when page changes for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handle listing click
   * 
   * Navigate to the listing detail page when user clicks a listing card.
   */
  const handleListingClick = (listingId: string) => {
    navigate(`/listings/${listingId}`);
  };

  /**
   * Loading State
   * 
   * Show loading indicator while fetching data.
   * This provides feedback to the user that something is happening.
   */
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading category...</p>
        </div>
      </div>
    );
  }

  /**
   * Error State
   * 
   * Show error message if data fetching fails.
   * Provides user-friendly error message and option to retry.
   */
  if (isError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Category</h2>
          <p>{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
          <button onClick={() => navigate('/')} className={styles.homeButton}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  /**
   * Category Not Found
   * 
   * If the category slug doesn't match any category, show 404-style message.
   */
  if (!currentCategory) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Category Not Found</h2>
          <p>The category "{categorySlug}" does not exist.</p>
          <Link to="/" className={styles.homeLink}>
            Browse all categories
          </Link>
        </div>
      </div>
    );
  }

  // Extract listings and pagination from response
  const listings = listingsData?.data || [];
  const pagination = listingsData?.pagination;

  return (
    <div className={styles.container}>
      {/* Breadcrumb Navigation */}
      {/* 
        Breadcrumbs help users understand where they are in the site hierarchy
        and provide easy navigation back to parent pages.
        
        Example: Home > Categories > Electronics
        
        Benefits:
        - Shows current location in site structure
        - Provides quick navigation to parent pages
        - Improves SEO (search engines understand site structure)
        - Enhances user experience
      */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>{currentCategory.name}</span>
      </nav>

      {/* Category Header */}
      {/*
        Display category information to give context to the user.
        Shows the category name, description, and listing count.
      */}
      <header className={styles.header}>
        <h1 className={styles.title}>{currentCategory.name}</h1>
        {currentCategory.description && (
          <p className={styles.description}>{currentCategory.description}</p>
        )}
        <p className={styles.count}>
          {pagination?.total || 0} {pagination?.total === 1 ? 'listing' : 'listings'} found
        </p>
      </header>

      {/* Main Content Area */}
      <div className={styles.content}>
        {/* Filter Sidebar */}
        {/*
          FilterPanel allows users to refine results within the category.
          For example, in Electronics category, filter by price range or item type.
          
          We hide the category filter since we're already in a specific category.
        */}
        <aside className={styles.sidebar}>
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            hideCategory={true} // Hide category filter since we're in a category page
          />
        </aside>

        {/* Listings Grid */}
        <div className={styles.main}>
          {listings.length === 0 ? (
            // Empty State
            // Show helpful message when no listings match the filters
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No listings found</p>
              <p className={styles.emptyText}>
                Try adjusting your filters or check back later for new listings.
              </p>
            </div>
          ) : (
            <>
              {/* Listings Grid */}
              {/*
                Display listings in a responsive grid.
                Grid automatically adjusts columns based on screen size.
                
                CSS Grid Benefits:
                - Responsive without media queries (using auto-fit)
                - Equal height cards
                - Automatic spacing
                - Clean, maintainable code
              */}
              <div className={styles.grid}>
                {listings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => handleListingClick(listing.id)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {/*
                Show pagination when there are multiple pages.
                Allows users to navigate through large result sets.
                
                Pagination Benefits:
                - Improves performance (load fewer items at once)
                - Better user experience (faster page loads)
                - Easier to scan results
                - Reduces server load
              */}
              {pagination && pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={styles.paginationButton}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  
                  <span className={styles.paginationInfo}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={styles.paginationButton}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
