/**
 * Listing Detail Page
 * 
 * This page displays the complete information about a single listing.
 * It's the destination when users click on a listing card to learn more.
 * 
 * Key Features:
 * - Displays all listing information (title, description, price, category, location)
 * - Image gallery with navigation to view all photos
 * - Seller information card with profile link
 * - Contact seller button (opens messaging)
 * - Handles loading and error states
 * - Responsive design for mobile and desktop
 * 
 * Educational Focus:
 * - URL Parameters: Getting the listing ID from the route
 * - Data Fetching: Using React Query hooks for server data
 * - Loading States: Showing spinners while data loads
 * - Error Handling: Graceful error messages
 * - Image Galleries: Navigating through multiple images
 * - Component Composition: Building complex UIs from simple components
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useListing } from '../hooks/useListings';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import styles from './ListingDetailPage.module.css';

/**
 * ListingDetailPage Component
 * 
 * This component demonstrates several important patterns:
 * 
 * 1. URL Parameters: We use useParams() to get the listing ID from the URL
 *    Example URL: /listings/abc-123 → listingId = "abc-123"
 * 
 * 2. Data Fetching: We use our custom useListing hook which wraps React Query
 *    This gives us automatic caching, loading states, and error handling
 * 
 * 3. State Management: We use useState for the image gallery's current index
 *    This is local UI state that doesn't need to be global
 * 
 * 4. Conditional Rendering: Different UI based on loading/error/success states
 *    This provides good UX by showing appropriate feedback
 */
const ListingDetailPage: React.FC = () => {
  // Get the listing ID from the URL
  // useParams() returns an object with all URL parameters
  const { listingId } = useParams<{ listingId: string }>();
  
  // Get navigation function to programmatically navigate
  const navigate = useNavigate();
  
  // Get current user from auth context
  const { user } = useAuth();
  
  // Fetch listing data using our custom hook
  // This hook uses React Query under the hood for caching and state management
  const { data: listing, isLoading, isError, error } = useListing(listingId || '');
  
  // Local state for image gallery
  // Tracks which image is currently being displayed
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  /**
   * Handle Contact Seller Button Click
   * 
   * This will navigate to the messaging page with the seller and listing pre-selected
   * In a future task, we'll implement the actual messaging functionality
   */
  const handleContactSeller = () => {
    if (!user) {
      // If not logged in, redirect to login page
      // After login, they'll be redirected back here
      navigate('/login', { state: { from: `/listings/${listingId}` } });
      return;
    }
    
    // Navigate to messaging page (to be implemented in Phase 12)
    // For now, we'll show an alert
    alert('Messaging feature coming soon! This will open a conversation with the seller.');
  };

  /**
   * Navigate to Previous Image
   * 
   * Wraps around to the last image if at the beginning
   */
  const handlePreviousImage = () => {
    if (!listing?.images || listing.images.length === 0) return;
    
    setCurrentImageIndex((prev) => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

  /**
   * Navigate to Next Image
   * 
   * Wraps around to the first image if at the end
   */
  const handleNextImage = () => {
    if (!listing?.images || listing.images.length === 0) return;
    
    setCurrentImageIndex((prev) => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  /**
   * Format Price for Display
   * 
   * Adds currency symbol and handles hourly pricing for services
   */
  const formatPrice = (price: number, listingType: string, pricingType: string | null) => {
    const basePrice = `$${price.toFixed(2)}`;
    
    if (listingType === 'service' && pricingType === 'hourly') {
      return `${basePrice}/hr`;
    }
    
    return basePrice;
  };

  /**
   * Format Date for Display
   * 
   * Converts ISO date string to readable format
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Loading State
   * 
   * Show a loading spinner while fetching data
   * This provides feedback that something is happening
   */
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading listing details...</p>
        </div>
      </div>
    );
  }

  /**
   * Error State
   * 
   * Show an error message if the fetch failed
   * This could be because:
   * - Listing doesn't exist
   * - Network error
   * - Server error
   */
  if (isError || !listing) {
    return (
      <div className={styles.container}>
        <Card variant="outlined" className={styles.errorCard}>
          <Card.Body>
            <h2>❌ Listing Not Found</h2>
            <p>
              {error instanceof Error 
                ? error.message 
                : 'The listing you\'re looking for doesn\'t exist or has been removed.'}
            </p>
            <Button onClick={() => navigate('/')} variant="primary">
              Back to Home
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  /**
   * Success State - Display Listing
   * 
   * This is the main content when data loads successfully
   */
  return (
    <div className={styles.container}>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumb}>
        <Link to="/">Home</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <Link to="/search">Listings</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>{listing.title}</span>
      </nav>

      <div className={styles.content}>
        {/* Left Column - Images and Description */}
        <div className={styles.mainColumn}>
          {/* Image Gallery */}
          {listing.images && listing.images.length > 0 && (
            <Card variant="outlined" padding="none" className={styles.imageGallery}>
              {/* Main Image Display */}
              <div className={styles.mainImageContainer}>
                <img
                  src={listing.images[currentImageIndex]}
                  alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                  className={styles.mainImage}
                />
                
                {/* Navigation Arrows (only show if multiple images) */}
                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePreviousImage}
                      className={`${styles.imageNavButton} ${styles.imageNavButtonPrev}`}
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      onClick={handleNextImage}
                      className={`${styles.imageNavButton} ${styles.imageNavButtonNext}`}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                {listing.images.length > 1 && (
                  <div className={styles.imageCounter}>
                    {currentImageIndex + 1} / {listing.images.length}
                  </div>
                )}
              </div>
              
              {/* Thumbnail Strip (only show if multiple images) */}
              {listing.images.length > 1 && (
                <div className={styles.thumbnailStrip}>
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`${styles.thumbnail} ${
                        index === currentImageIndex ? styles.thumbnailActive : ''
                      }`}
                    >
                      <img src={image} alt={`Thumbnail ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Listing Details Card */}
          <Card variant="outlined" className={styles.detailsCard}>
            <Card.Body>
              {/* Status Badge (if not active) */}
              {listing.status !== 'active' && (
                <div className={`${styles.statusBadge} ${styles[`status${listing.status}`]}`}>
                  {listing.status.toUpperCase()}
                </div>
              )}

              {/* Title */}
              <h1 className={styles.title}>{listing.title}</h1>

              {/* Price */}
              <div className={styles.priceSection}>
                <span className={styles.price}>
                  {formatPrice(listing.price, listing.listingType, listing.pricingType)}
                </span>
                <span className={styles.listingType}>
                  {listing.listingType === 'item' ? '📦 Item' : '🛠️ Service'}
                </span>
              </div>

              {/* Metadata */}
              <div className={styles.metadata}>
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Category:</span>
                  <span className={styles.metadataValue}>{listing.category}</span>
                </div>
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Location:</span>
                  <span className={styles.metadataValue}>📍 {listing.location}</span>
                </div>
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Posted:</span>
                  <span className={styles.metadataValue}>{formatDate(listing.createdAt)}</span>
                </div>
              </div>

              {/* Description */}
              <div className={styles.descriptionSection}>
                <h2 className={styles.sectionTitle}>Description</h2>
                <p className={styles.description}>{listing.description}</p>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Right Column - Seller Info and Actions */}
        <div className={styles.sideColumn}>
          {/* Seller Information Card */}
          {listing.seller && (
            <Card variant="outlined" className={styles.sellerCard}>
              <Card.Body>
                <h2 className={styles.sectionTitle}>Seller Information</h2>
                
                <div className={styles.sellerInfo}>
                  {/* Profile Picture */}
                  <div className={styles.sellerAvatar}>
                    {listing.seller.profilePicture ? (
                      <img
                        src={listing.seller.profilePicture}
                        alt={listing.seller.username}
                        className={styles.avatarImage}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {listing.seller.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Seller Details */}
                  <div className={styles.sellerDetails}>
                    <h3 className={styles.sellerName}>{listing.seller.username}</h3>
                    
                    {/* Rating */}
                    <div className={styles.sellerRating}>
                      <span className={styles.stars}>
                        {'⭐'.repeat(Math.round(listing.seller.averageRating))}
                      </span>
                      <span className={styles.ratingValue}>
                        {listing.seller.averageRating.toFixed(1)}
                      </span>
                    </div>
                    
                    {/* Member Since */}
                    <p className={styles.memberSince}>
                      Member since {formatDate(listing.seller.joinDate)}
                    </p>
                    
                    {/* Location */}
                    {listing.seller.location && (
                      <p className={styles.sellerLocation}>
                        📍 {listing.seller.location}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* View Profile Link */}
                <Link
                  to={`/profile/${listing.seller.id}`}
                  className={styles.viewProfileLink}
                >
                  View Full Profile →
                </Link>
              </Card.Body>
            </Card>
          )}

          {/* Contact Seller Card */}
          <Card variant="outlined" className={styles.contactCard}>
            <Card.Body>
              <h2 className={styles.sectionTitle}>Interested?</h2>
              <p className={styles.contactDescription}>
                Send a message to the seller to ask questions or make an offer.
              </p>
              <Button
                onClick={handleContactSeller}
                variant="primary"
                fullWidth
                disabled={listing.status !== 'active'}
              >
                {listing.status === 'active' ? '💬 Contact Seller' : 'Listing Not Available'}
              </Button>
              
              {!user && (
                <p className={styles.loginNote}>
                  You'll need to log in to contact the seller
                </p>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage;
