/**
 * HomePage Component
 * 
 * The main landing page for the marketplace platform.
 * This is the first page users see and serves as the primary entry point.
 * 
 * Key Features:
 * - Hero section with search bar (primary call-to-action)
 * - Recent listings display (shows marketplace activity)
 * - Category navigation (helps users browse by interest)
 * - Responsive design (mobile-first approach)
 * 
 * Educational Focus:
 * - Homepage Design: How to structure an effective landing page
 * - Call-to-Action Placement: Search bar prominently featured
 * - Data Fetching: Using React Query hooks for listings and categories
 * - Loading States: Showing skeletons while data loads
 * - Error Handling: Graceful degradation when API fails
 * - Component Composition: Reusing ListingCard component
 * 
 * Design Principles Applied:
 * 1. F-Pattern Layout: Users scan in an F-shape, so we place important content accordingly
 * 2. Visual Hierarchy: Larger elements (hero) draw attention first
 * 3. Progressive Disclosure: Show overview first, details on click
 * 4. Scannability: Clear sections with headings
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListings } from '../hooks/useListings';
import { useCategories } from '../hooks/useSearch';
import { ListingCard } from '../components/ListingCard';
import styles from './HomePage.module.css';

/**
 * HomePage Component
 * 
 * This component demonstrates several important concepts:
 * 
 * 1. Data Fetching with React Query:
 *    - useListings() fetches recent listings
 *    - useCategories() fetches category list
 *    - Both hooks handle loading, error, and success states automatically
 * 
 * 2. State Management:
 *    - Local state for search query (useState)
 *    - Server state managed by React Query (listings, categories)
 * 
 * 3. Navigation:
 *    - useNavigate hook for programmatic navigation
 *    - Navigate to search page when user submits search
 * 
 * 4. Conditional Rendering:
 *    - Show loading skeletons while data fetches
 *    - Show error messages if fetch fails
 *    - Show content when data is ready
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Local state for search input
  const [searchQuery, setSearchQuery] = useState('');
  
  /**
   * Fetch recent listings (first page, 12 items)
   * 
   * React Query automatically:
   * - Fetches data on component mount
   * - Caches the result
   * - Provides loading and error states
   * - Refetches when data becomes stale
   */
  const { 
    data: listingsData, 
    isLoading: listingsLoading, 
    isError: listingsError,
    error: listingsErrorDetails
  } = useListings(1, 12);
  
  // Debug logging (remove in production)
  if (listingsData) {
    console.log('Listings data:', listingsData);
  }
  if (listingsError) {
    console.error('Listings error:', listingsErrorDetails);
  }
  
  /**
   * Fetch all categories
   * 
   * Categories are cached for 1 hour (configured in useCategories hook)
   * because they don't change frequently
   */
  const { 
    data: categories, 
    isLoading: categoriesLoading, 
    isError: categoriesError,
    error: categoriesErrorDetails
  } = useCategories();
  
  // Debug logging (remove in production)
  if (categories) {
    console.log('Categories data:', categories);
  }
  if (categoriesError) {
    console.error('Categories error:', categoriesErrorDetails);
  }
  
  /**
   * Handle search form submission
   * 
   * When user submits search:
   * 1. Prevent default form submission (no page reload)
   * 2. Navigate to search page with query parameter
   * 
   * The search page will read the query from URL and perform the search
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      // Navigate to search page with query parameter
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  /**
   * Handle category click
   * 
   * Navigate to category browse page
   * 
   * Why use a dedicated category page instead of search with filter?
   * - Better SEO: /categories/electronics is more meaningful than /search?category=electronics
   * - Clearer user intent: User is browsing a category, not searching
   * - Better UX: Category page can show category-specific information
   * - Bookmarkable: Users can bookmark specific categories
   */
  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/categories/${categorySlug}`);
  };
  
  /**
   * Handle listing click
   * 
   * Navigate to listing detail page
   */
  const handleListingClick = (listingId: string) => {
    navigate(`/listings/${listingId}`);
  };

  return (
    <div className={styles.homePage}>
      {/* 
        Hero Section
        
        The hero is the first thing users see. It should:
        - Communicate what the site does
        - Provide the primary call-to-action (search)
        - Be visually appealing
        
        Design Pattern: Hero with Search
        - Common on marketplace sites (Airbnb, eBay, Etsy)
        - Puts the most important action front and center
      */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Find What You Need, Sell What You Don't
          </h1>
          <p className={styles.heroSubtitle}>
            Buy and sell items and services in your local community
          </p>
          
          {/* 
            Search Form
            
            Primary call-to-action on the homepage.
            
            UX Considerations:
            - Large, prominent input field
            - Clear placeholder text
            - Obvious submit button
            - Keyboard accessible (Enter key submits)
          */}
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Search for items or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search listings"
            />
            <button 
              type="submit" 
              className={styles.searchButton}
              aria-label="Submit search"
            >
              🔍 Search
            </button>
          </form>
        </div>
      </section>

      {/* 
        Categories Section
        
        Provides structured navigation for browsing.
        
        Why Categories Matter:
        - Users often browse by category when they don't have a specific search
        - Categories help organize the marketplace
        - Shows the breadth of offerings
        
        Design Pattern: Category Grid
        - Visual cards make categories scannable
        - Icons/emojis add visual interest
        - Listing counts show activity
      */}
      <section className={styles.categoriesSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Browse by Category</h2>
          
          {/* Loading State */}
          {categoriesLoading && (
            <div className={styles.categoriesGrid}>
              {/* Show skeleton loaders while categories load */}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.categorySkeleton} />
              ))}
            </div>
          )}
          
          {/* Error State */}
          {categoriesError && (
            <div className={styles.errorMessage}>
              <p>Unable to load categories. Please try again later.</p>
            </div>
          )}
          
          {/* Success State - Show Categories */}
          {categories && Array.isArray(categories) && categories.length > 0 && (
            <div className={styles.categoriesGrid}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.slug)}
                  className={styles.categoryCard}
                  aria-label={`Browse ${category.name} category`}
                >
                  <div className={styles.categoryIcon}>
                    {getCategoryIcon(category.slug)}
                  </div>
                  <h3 className={styles.categoryName}>{category.name}</h3>
                  {category.listingCount !== undefined && (
                    <p className={styles.categoryCount}>
                      {category.listingCount} {category.listingCount === 1 ? 'listing' : 'listings'}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 
        Recent Listings Section
        
        Shows marketplace activity and gives users something to browse.
        
        Why Show Recent Listings:
        - Demonstrates active marketplace
        - Gives users immediate browsing options
        - Shows variety of offerings
        - Encourages engagement
        
        Design Pattern: Card Grid
        - Responsive grid layout
        - Consistent card design (using ListingCard component)
        - Shows key information at a glance
      */}
      <section className={styles.listingsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Listings</h2>
            <button 
              onClick={() => navigate('/search')}
              className={styles.viewAllButton}
            >
              View All →
            </button>
          </div>
          
          {/* Loading State */}
          {listingsLoading && (
            <div className={styles.listingsGrid}>
              {/* Show skeleton loaders while listings load */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className={styles.listingSkeleton} />
              ))}
            </div>
          )}
          
          {/* Error State */}
          {listingsError && (
            <div className={styles.errorMessage}>
              <p>Unable to load listings. Please try again later.</p>
            </div>
          )}
          
          {/* Success State - Show Listings */}
          {listingsData && listingsData.data && listingsData.data.length > 0 && (
            <div className={styles.listingsGrid}>
              {listingsData.data.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => handleListingClick(listing.id)}
                />
              ))}
            </div>
          )}
          
          {/* Empty State */}
          {listingsData && listingsData.data && listingsData.data.length === 0 && (
            <div className={styles.emptyState}>
              <p>No listings yet. Be the first to post!</p>
              <button 
                onClick={() => navigate('/listings/create')}
                className={styles.createListingButton}
              >
                Create Listing
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

/**
 * Helper function to get emoji icon for category
 * 
 * This adds visual interest to category cards.
 * In a production app, you might use actual icon libraries or images.
 * 
 * @param slug - Category slug
 * @returns Emoji icon
 */
function getCategoryIcon(slug: string): string {
  const icons: Record<string, string> = {
    electronics: '💻',
    furniture: '🛋️',
    clothing: '👕',
    books: '📚',
    sports: '⚽',
    toys: '🧸',
    tools: '🔧',
    services: '🛠️',
    vehicles: '🚗',
    'home-garden': '🏡',
    art: '🎨',
    music: '🎵',
    other: '📦',
  };
  
  return icons[slug] || '📦';
}

export default HomePage;
