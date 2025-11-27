/**
 * ListingCard Component
 * 
 * A reusable component for displaying listing previews in a card format.
 * This component is used throughout the application wherever listings are displayed:
 * - Search results page
 * - Homepage featured listings
 * - User profile listings
 * - Category browse pages
 * 
 * Key Features:
 * - Displays listing image, title, price, and location
 * - Handles both item and service listing types
 * - Shows pricing type for services (hourly vs fixed)
 * - Displays status badges for sold/completed listings
 * - Clickable with hover effects
 * - Responsive design
 * 
 * Educational Focus:
 * - Component Props: How to pass data to components
 * - Conditional Rendering: Showing different UI based on data
 * - TypeScript: Type-safe props with interfaces
 * - Component Composition: Building on existing Card component
 */

import React from 'react';
import { Listing } from '../types/api';
import { Card } from './Card';
import styles from './ListingCard.module.css';

/**
 * ListingCard Props Interface
 * 
 * TypeScript interface defines what props this component accepts.
 * This provides:
 * - Type safety: TypeScript will catch errors at compile time
 * - Autocomplete: Your IDE will suggest available props
 * - Documentation: Props are self-documenting
 */
interface ListingCardProps {
  /** The listing data to display */
  listing: Listing;
  
  /** 
   * Click handler for when the card is clicked
   * Optional - if not provided, card won't be clickable
   */
  onClick?: () => void;
  
  /**
   * Whether to show the location
   * Default: true
   */
  showLocation?: boolean;
  
  /**
   * Custom class name for additional styling
   * Optional - allows parent components to add custom styles
   */
  className?: string;
}

/**
 * ListingCard Component
 * 
 * This component demonstrates several important React patterns:
 * 
 * 1. Props Destructuring: We extract props in the function parameters
 *    This makes the code cleaner and easier to read
 * 
 * 2. Default Props: showLocation defaults to true if not provided
 *    This is done using JavaScript default parameters
 * 
 * 3. Conditional Rendering: Different UI based on data
 *    - Show image if available
 *    - Show pricing type for services
 *    - Show status badge for non-active listings
 * 
 * 4. Component Composition: We use the existing Card component
 *    This promotes code reuse and consistency
 */
export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onClick,
  showLocation = true,
  className = '',
}) => {
  /**
   * Format price for display
   * 
   * This helper function formats the price with 2 decimal places
   * and adds "/hr" suffix for hourly services
   */
  const formatPrice = () => {
    const basePrice = `$${listing.price.toFixed(2)}`;
    
    // Add hourly indicator for service listings with hourly pricing
    if (listing.listingType === 'service' && listing.pricingType === 'hourly') {
      return `${basePrice}/hr`;
    }
    
    return basePrice;
  };

  /**
   * Get listing type display text and emoji
   * 
   * Conditional rendering: Different display based on listing type
   * This makes it immediately clear whether it's an item or service
   */
  const getListingTypeDisplay = () => {
    if (listing.listingType === 'item') {
      return '📦 Item';
    }
    return '🛠️ Service';
  };

  /**
   * Get status badge color class
   * 
   * Different statuses get different colors for visual distinction
   */
  const getStatusBadgeClass = () => {
    switch (listing.status) {
      case 'sold':
        return styles.statusBadgeSold;
      case 'completed':
        return styles.statusBadgeCompleted;
      default:
        return styles.statusBadge;
    }
  };

  /**
   * Handle keyboard interaction
   * 
   * Allow Enter and Space keys to activate the card, just like a button.
   * This ensures keyboard users can interact with the card.
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Only handle if onClick is provided
    if (!onClick) return;
    
    // Enter or Space key activates the card
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent page scroll on Space
      onClick();
    }
  };

  /**
   * Generate accessible label for the card
   * 
   * Screen readers will announce this complete description
   */
  const getAriaLabel = () => {
    const parts = [
      listing.title,
      `Price: $${formatPrice()}`,
      `Type: ${listing.listingType}`,
    ];
    
    if (listing.location) {
      parts.push(`Location: ${listing.location}`);
    }
    
    if (listing.status !== 'active') {
      parts.push(`Status: ${listing.status}`);
    }
    
    return parts.join(', ');
  };

  return (
    <Card
      variant="outlined"
      padding="none"
      hoverable
      onClick={onClick}
      className={`${styles.listingCard} ${className}`}
      // Accessibility: Make card keyboard accessible
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? getAriaLabel() : undefined}
    >
      {/* 
        Listing Image
        
        Conditional Rendering: Only show image section if listing has images
        The && operator is a common React pattern for conditional rendering
        If listing.images exists AND has length > 0, render the image
      */}
      {listing.images && listing.images.length > 0 && (
        <div className={styles.imageContainer}>
          <img
            src={listing.images[0]}
            alt={`${listing.title} - ${listing.listingType}`}
            className={styles.image}
          />
          
          {/* 
            Status Badge Overlay
            
            Show status badge on the image for non-active listings
            This makes the status immediately visible
          */}
          {listing.status !== 'active' && (
            <div 
              className={`${styles.statusBadgeOverlay} ${getStatusBadgeClass()}`}
              aria-label={`Listing status: ${listing.status}`}
            >
              {listing.status.toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* 
        Card Body - Main Content
        
        Contains title, price, type, and location
      */}
      <Card.Body>
        {/* 
          Listing Title
          
          Truncated with CSS if too long (see CSS file)
        */}
        <h3 className={styles.title}>{listing.title}</h3>

        {/* 
          Price Display
          
          Prominent display with conditional hourly indicator
        */}
        <p className={styles.price}>{formatPrice()}</p>

        {/* 
          Metadata Row
          
          Contains listing type badge and location
          Flexbox layout for horizontal arrangement
        */}
        <div className={styles.metadata}>
          {/* 
            Listing Type Badge
            
            Shows whether this is an item or service
            Uses emoji for visual interest
          */}
          <span className={styles.typeBadge}>
            {getListingTypeDisplay()}
          </span>

          {/* 
            Location Display
            
            Conditional Rendering: Only show if showLocation prop is true
            Uses && operator for conditional rendering
          */}
          {showLocation && listing.location && (
            <span className={styles.location}>
              📍 {listing.location}
            </span>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

/**
 * Display name for debugging
 * 
 * This helps with React DevTools and error messages
 */
ListingCard.displayName = 'ListingCard';

export default ListingCard;
