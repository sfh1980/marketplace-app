/**
 * User Profile Page
 * 
 * This page displays a user's public profile information and their listings.
 * It demonstrates several important React patterns:
 * 
 * 1. Data Fetching with React Query:
 *    - useQuery hook for fetching user data and listings
 *    - Automatic loading and error states
 *    - Caching and background refetching
 * 
 * 2. Loading States:
 *    - Show loading indicators while data is being fetched
 *    - Provide feedback to users (better UX than blank screen)
 *    - Skeleton loaders for perceived performance
 * 
 * 3. Error Handling:
 *    - Display user-friendly error messages
 *    - Provide retry options
 *    - Graceful degradation
 * 
 * 4. Responsive Design:
 *    - Grid layout for listings
 *    - Mobile-friendly layout
 *    - Flexible content areas
 * 
 * Educational Focus:
 * - How to fetch data in React with React Query
 * - Managing loading and error states
 * - Component composition with Card components
 * - URL parameters with React Router
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, getUserListings } from '../services/userService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import type { User, Listing } from '../types/api';
import styles from './ProfilePage.module.css';

/**
 * ProfilePage Component
 * 
 * This component fetches and displays a user's profile and their listings.
 * It uses React Router's useParams to get the userId from the URL.
 * 
 * URL structure: /profile/:userId
 * Example: /profile/abc-123-def-456
 */
export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  /**
   * Fetch user profile data
   * 
   * useQuery automatically:
   * - Fetches data when component mounts
   * - Provides loading and error states
   * - Caches the result (subsequent visits are instant)
   * - Refetches in the background to keep data fresh
   * 
   * The queryKey ['user', userId] uniquely identifies this query.
   * If userId changes, React Query will fetch the new user's data.
   */
  const {
    data: user,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    error: userError,
  } = useQuery<User>({
    queryKey: ['user', userId],
    queryFn: () => getUserProfile(userId!),
    // Only fetch if we have a userId
    enabled: !!userId,
  });
  
  /**
   * Fetch user's listings
   * 
   * We fetch listings separately from the user profile.
   * This allows us to show the profile immediately while listings load.
   * 
   * Benefits of separate queries:
   * - Faster initial render (show profile before listings)
   * - Independent error handling
   * - Can refetch listings without refetching profile
   */
  const {
    data: listings = [],
    isLoading: isLoadingListings,
    isError: isErrorListings,
  } = useQuery<Listing[]>({
    queryKey: ['userListings', userId],
    queryFn: () => getUserListings(userId!),
    enabled: !!userId,
  });
  
  /**
   * Handle missing userId
   * 
   * If there's no userId in the URL, we can't fetch anything.
   * This shouldn't happen in normal usage, but we handle it gracefully.
   */
  if (!userId) {
    return (
      <div className={styles.container}>
        <Card variant="outlined" padding="large">
          <Card.Body>
            <p className={styles.errorText}>Invalid profile URL</p>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  /**
   * Loading State
   * 
   * While the user profile is loading, show a loading message.
   * This provides feedback to the user that something is happening.
   * 
   * Best Practice: Always show loading states for async operations.
   * Users should never see a blank screen without knowing why.
   */
  if (isLoadingUser) {
    return (
      <div className={styles.container}>
        <Card variant="elevated" padding="large">
          <Card.Body>
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading profile...</p>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  /**
   * Error State
   * 
   * If fetching the user profile fails, show an error message.
   * We provide a retry button so users can try again.
   * 
   * Common causes of errors:
   * - Network issues
   * - User doesn't exist (404)
   * - Server errors (500)
   * - Authentication issues (401)
   */
  if (isErrorUser) {
    return (
      <div className={styles.container}>
        <Card variant="outlined" padding="large">
          <Card.Body>
            <h2 className={styles.errorTitle}>Unable to Load Profile</h2>
            <p className={styles.errorText}>
              {userError instanceof Error 
                ? userError.message 
                : 'An error occurred while loading the profile.'}
            </p>
            <div className={styles.errorActions}>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="secondary" onClick={() => navigate('/')}>
                Go to Home
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  /**
   * Success State - Display Profile
   * 
   * If we have user data, display the profile.
   * We use optional chaining (?.) to safely access nested properties.
   */
  if (!user) {
    return null;
  }
  
  /**
   * Format join date for display
   * 
   * Convert ISO date string to readable format.
   * Example: "2024-01-15" -> "January 2024"
   */
  const joinDate = new Date(user.joinDate);
  const formattedJoinDate = joinDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  
  // Check if this is the current user's own profile
  const isOwnProfile = currentUser?.id === userId;
  
  return (
    <div className={styles.container}>
      {/* Profile Header Section */}
      <Card variant="elevated" padding="large" className={styles.profileCard}>
        <div className={styles.profileHeader}>
          {/* Profile Picture */}
          <div className={styles.avatarContainer}>
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={`${user.username}'s profile`}
                className={styles.avatar}
              />
            ) : (
              // Default avatar if no profile picture
              <div className={styles.avatarPlaceholder}>
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* User Information */}
          <div className={styles.profileInfo}>
            <h1 className={styles.username}>{user.username}</h1>
            
            <div className={styles.metadata}>
              {/* Join Date */}
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Member since:</span>
                <span className={styles.metadataValue}>{formattedJoinDate}</span>
              </div>
              
              {/* Location (if available) */}
              {user.location && (
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Location:</span>
                  <span className={styles.metadataValue}>{user.location}</span>
                </div>
              )}
              
              {/* Rating */}
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Rating:</span>
                <span className={styles.metadataValue}>
                  {user.averageRating > 0 
                    ? `⭐ ${user.averageRating.toFixed(1)}` 
                    : 'No ratings yet'}
                </span>
              </div>
              
              {/* Email Verification Badge */}
              {user.emailVerified && (
                <div className={styles.verifiedBadge}>
                  ✓ Email Verified
                </div>
              )}
            </div>
          </div>
          
          {/* Edit Profile Button (only show on own profile) */}
          {isOwnProfile && (
            <div className={styles.profileActions}>
              <Button
                variant="secondary"
                onClick={() => navigate(`/profile/${userId}/edit`)}
              >
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {/* Listings Section */}
      <section className={styles.listingsSection}>
        <h2 className={styles.sectionTitle}>
          {user.username}'s Listings
        </h2>
        
        {/* Loading state for listings */}
        {isLoadingListings && (
          <Card variant="outlined" padding="large">
            <Card.Body>
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Loading listings...</p>
              </div>
            </Card.Body>
          </Card>
        )}
        
        {/* Error state for listings */}
        {isErrorListings && (
          <Card variant="outlined" padding="large">
            <Card.Body>
              <p className={styles.errorText}>
                Unable to load listings. Please try again later.
              </p>
            </Card.Body>
          </Card>
        )}
        
        {/* Display listings */}
        {!isLoadingListings && !isErrorListings && (
          <>
            {listings.length === 0 ? (
              // Empty state - no listings
              <Card variant="outlined" padding="large">
                <Card.Body>
                  <p className={styles.emptyState}>
                    {user.username} hasn't posted any listings yet.
                  </p>
                </Card.Body>
              </Card>
            ) : (
              // Grid of listing cards
              <div className={styles.listingsGrid}>
                {listings.map((listing) => (
                  <Card
                    key={listing.id}
                    variant="outlined"
                    hoverable
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    className={styles.listingCard}
                  >
                    {/* Listing Image */}
                    {listing.images && listing.images.length > 0 && (
                      <div className={styles.listingImage}>
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                        />
                      </div>
                    )}
                    
                    <Card.Body>
                      {/* Listing Title */}
                      <h3 className={styles.listingTitle}>{listing.title}</h3>
                      
                      {/* Listing Price */}
                      <p className={styles.listingPrice}>
                        ${listing.price.toFixed(2)}
                        {listing.pricingType === 'hourly' && '/hr'}
                      </p>
                      
                      {/* Listing Type Badge */}
                      <span className={styles.listingTypeBadge}>
                        {listing.listingType === 'item' ? '📦 Item' : '🛠️ Service'}
                      </span>
                      
                      {/* Listing Status */}
                      {listing.status !== 'active' && (
                        <span className={styles.statusBadge}>
                          {listing.status.toUpperCase()}
                        </span>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
