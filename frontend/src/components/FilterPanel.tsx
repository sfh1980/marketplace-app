/**
 * FilterPanel Component
 * 
 * A comprehensive filter panel for search results that allows users to filter by:
 * - Category
 * - Listing type (item or service)
 * - Price range (min and max)
 * - Location
 * 
 * Key Features:
 * - Updates URL parameters for shareable filtered searches
 * - Shows active filter count
 * - Clear all filters functionality
 * - Responsive design (collapsible on mobile)
 * - Fetches categories from API
 * 
 * Educational Focus:
 * - Form State Management: Managing multiple filter inputs
 * - URL State Synchronization: Keeping filters in sync with URL
 * - Controlled Components: React controls all input values
 * - API Integration: Fetching categories dynamically
 * 
 * Requirements: 4.3, 4.4, 4.5, 4.6
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from './Button';
import { Input } from './Input';
import type { ListingType, Category } from '../types/api';
import { getCategories } from '../services/searchService';
import styles from './FilterPanel.module.css';

/**
 * FilterPanel Component
 * 
 * This component demonstrates several important patterns:
 * 
 * 1. Controlled Components: React manages all input values
 *    - Each input's value comes from state
 *    - Changes update state via onChange handlers
 *    - Single source of truth for form data
 * 
 * 2. URL State Synchronization: Filters are stored in URL
 *    - Benefits: Shareable URLs, browser back/forward works
 *    - useSearchParams hook manages URL query parameters
 *    - Filters persist across page refreshes
 * 
 * 3. Form State Management: Managing multiple related inputs
 *    - Local state for immediate UI updates
 *    - URL updates on "Apply Filters" click
 *    - Prevents excessive URL updates while typing
 * 
 * 4. API Integration: Fetching categories dynamically
 *    - Categories loaded from backend
 *    - Loading and error states handled
 *    - Dropdown populated with real data
 */
const FilterPanel: React.FC = () => {
  /**
   * URL Query Parameters
   * 
   * useSearchParams gives us access to URL query parameters
   * Example: /search?category=electronics&minPrice=50
   */
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Local Filter State
   * 
   * We maintain local state for the filter form inputs.
   * This allows users to adjust filters without immediately updating the URL.
   * When they click "Apply Filters", we update the URL all at once.
   * 
   * Why local state + URL state?
   * - Local state: Immediate UI feedback, no URL spam while typing
   * - URL state: Shareable, bookmarkable, works with browser navigation
   */
  const [category, setCategory] = useState<string>('');
  const [listingType, setListingType] = useState<ListingType | ''>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  /**
   * Categories State
   * 
   * We fetch categories from the API and store them in state.
   * This allows us to populate the category dropdown dynamically.
   */
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  /**
   * Fetch Categories on Mount
   * 
   * When the component first renders, we fetch the list of categories
   * from the API to populate the category filter dropdown.
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await getCategories();
        setCategories(data);
        setCategoriesError(null);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setCategoriesError('Failed to load categories');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  /**
   * Initialize Filter State from URL
   * 
   * When the component mounts or URL changes, we read the current
   * filter values from the URL and populate our local state.
   * This ensures the form shows the current active filters.
   */
  useEffect(() => {
    setCategory(searchParams.get('category') || '');
    setListingType((searchParams.get('listingType') as ListingType) || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setLocation(searchParams.get('location') || '');
  }, [searchParams]);

  /**
   * Apply Filters
   * 
   * When user clicks "Apply Filters", we update the URL with all
   * current filter values. This triggers a new search with the filters.
   * 
   * Why update URL instead of calling API directly?
   * - Keeps URL in sync with displayed results
   * - Makes searches shareable and bookmarkable
   * - Works with browser back/forward buttons
   * - SearchPage component watches URL and fetches data automatically
   */
  const handleApplyFilters = () => {
    // Create new URLSearchParams object
    const newParams = new URLSearchParams(searchParams);

    // Update or remove each filter parameter
    // We remove empty values to keep URLs clean
    if (category) {
      newParams.set('category', category);
    } else {
      newParams.delete('category');
    }

    if (listingType) {
      newParams.set('listingType', listingType);
    } else {
      newParams.delete('listingType');
    }

    if (minPrice) {
      newParams.set('minPrice', minPrice);
    } else {
      newParams.delete('minPrice');
    }

    if (maxPrice) {
      newParams.set('maxPrice', maxPrice);
    } else {
      newParams.delete('maxPrice');
    }

    if (location) {
      newParams.set('location', location);
    } else {
      newParams.delete('location');
    }

    // Reset to page 1 when filters change
    // Otherwise, user might land on an empty page
    newParams.set('page', '1');

    // Update URL (this triggers SearchPage to refetch with new filters)
    setSearchParams(newParams);
  };

  /**
   * Clear All Filters
   * 
   * Reset all filter inputs and remove filter parameters from URL.
   * Keeps the search query if present.
   */
  const handleClearFilters = () => {
    // Clear local state
    setCategory('');
    setListingType('');
    setMinPrice('');
    setMaxPrice('');
    setLocation('');

    // Create new URLSearchParams, keeping only the search query
    const newParams = new URLSearchParams();
    const query = searchParams.get('query') || searchParams.get('q');
    if (query) {
      newParams.set('query', query);
    }
    newParams.set('page', '1');

    // Update URL
    setSearchParams(newParams);
  };

  /**
   * Count Active Filters
   * 
   * Calculate how many filters are currently active.
   * This is displayed in the UI to show users what's being filtered.
   */
  const activeFilterCount = [
    category,
    listingType,
    minPrice,
    maxPrice,
    location,
  ].filter(Boolean).length;

  /**
   * Render the filter panel
   */
  return (
    <div className={styles.filterPanel}>
      {/* Header with active filter count */}
      <div className={styles.header}>
        <h2 className={styles.title}>Filters</h2>
        {activeFilterCount > 0 && (
          <span className={styles.activeCount}>
            {activeFilterCount} active
          </span>
        )}
      </div>

      {/* Filter Form */}
      <div className={styles.filters}>
        {/* 
          Category Filter
          
          Dropdown to select a category. Categories are fetched from the API.
          
          Requirements: 4.3 (Category filter)
        */}
        <div className={styles.filterGroup}>
          <label htmlFor="category" className={styles.label}>
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={styles.select}
            disabled={categoriesLoading}
          >
            <option value="">All Categories</option>
            {categoriesError ? (
              <option disabled>Error loading categories</option>
            ) : (
              categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                  {cat.listingCount !== undefined && ` (${cat.listingCount})`}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 
          Listing Type Filter
          
          Radio buttons to filter between items and services.
          
          Requirements: 4.4 (Listing type filter)
        */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Listing Type</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="listingType"
                value=""
                checked={listingType === ''}
                onChange={(e) => setListingType(e.target.value as '')}
                className={styles.radio}
              />
              <span>All</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="listingType"
                value="item"
                checked={listingType === 'item'}
                onChange={(e) => setListingType(e.target.value as ListingType)}
                className={styles.radio}
              />
              <span>Items</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="listingType"
                value="service"
                checked={listingType === 'service'}
                onChange={(e) => setListingType(e.target.value as ListingType)}
                className={styles.radio}
              />
              <span>Services</span>
            </label>
          </div>
        </div>

        {/* 
          Price Range Filter
          
          Two number inputs for minimum and maximum price.
          
          Requirements: 4.5 (Price range filter)
        */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Price Range</label>
          <div className={styles.priceRange}>
            <Input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min="0"
              step="0.01"
            />
            <span className={styles.priceSeparator}>to</span>
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* 
          Location Filter
          
          Text input to filter by location.
          
          Requirements: 4.6 (Location filter)
        */}
        <div className={styles.filterGroup}>
          <label htmlFor="location" className={styles.label}>
            Location
          </label>
          <Input
            id="location"
            type="text"
            placeholder="Enter location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={handleApplyFilters}
          fullWidth
        >
          Apply Filters
        </Button>
        {activeFilterCount > 0 && (
          <Button
            variant="secondary"
            onClick={handleClearFilters}
            fullWidth
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Display name for debugging
 */
FilterPanel.displayName = 'FilterPanel';

export { FilterPanel };
