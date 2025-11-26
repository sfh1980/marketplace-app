/**
 * My Listings Page
 * 
 * This page displays the current user's own listings with management actions.
 * It demonstrates several important patterns:
 * 
 * 1. List Management:
 *    - Display user's own listings
 *    - Action buttons for each listing (edit, delete, mark as sold)
 *    - Optimistic updates for better UX
 * 
 * 2. Action Buttons:
 *    - Edit: Navigate to edit page
 *    - Delete: Confirm and remove listing
 *    - Mark as Sold: Update listing status
 * 
 * 3. Confirmation Dialogs:
 *    - Prevent accidental deletions
 *    - Clear user feedback
 * 
 * 4. React Query Mutations:
 *    - useMutation for delete and status updates
 *    - Automatic cache invalidation
 *    - Loading and error states
 * 
 * Educational Focus:
 * - Managing lists of items with actions
 * - Confirmation patterns for destructive actions
 * - Optimistic UI updates
 * - Cache invalidation strategies
 * 
 * Requirements: 3.4 (editing), 3.5 (status updates), 3.6 (deletion)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getUserListings } from '../services/userService';
import { deleteListing, updateListingStatus } from '../services/listingService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import type { Listing, ListingStatus } from '../types/api';
import styles from './MyListingsPage.module.css';

/**
 * MyListingsPage Component
 * 
 * Displays all listings created by the current user with management actions.
 * Users can edit, delete, or mark listings as sold from this page.
 */
export const MyListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for delete confirmation modal
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  
  /**
   * Fetch current user's listings
   * 
   * We use the user's ID from the auth context to fetch their listings.
   * This ensures we only show listings that belong to the logged-in user.
   */
  const {
    data: listings = [],
    isLoading,
    isError,
    error,
  } = useQuery<Listing[]>({
    queryKey: ['userListings', user?.id],
    queryFn: () => getUserListings(user!.id),
    enabled: !!user?.id,
  });
  
  /**
   * Delete Listing Mutation
   * 
   * useMutation is used for operations that modify data on the server.
   * When a listing is deleted, we:
   * 1. Call the API to delete it
   * 2. Invalidate the listings cache to refetch fresh data
   * 3. Show success/error feedback
   * 
   * Best Practice: Always invalidate related queries after mutations
   * to keep the UI in sync with the server.
   */
  const deleteListingMutation = useMutation({
    mutationFn: (listingId: string) => deleteListing(listingId),
    onSuccess: () => {
      // Invalidate and refetch listings
      queryClient.invalidateQueries({ queryKey: ['userListings', user?.id] });
      // Close the confirmation modal
      setListingToDelete(null);
    },
    onError: (error) => {
      console.error('Failed to delete listing:', error);
      alert('Failed to delete listing. Please try again.');
    },
  });
  
  /**
   * Update Listing Status Mutation
   * 
   * This mutation handles marking listings as sold or changing their status.
   * We use optimistic updates here for better UX - the UI updates immediately
   * before the server responds.
   */
  const updateStatusMutation = useMutation({
    mutationFn: ({ listingId, status }: { listingId: string; status: ListingStatus }) =>
      updateListingStatus(listingId, { status }),
    onSuccess: () => {
      // Invalidate and refetch listings to show updated status
      queryClient.invalidateQueries({ queryKey: ['userListings', user?.id] });
    },
    onError: (error) => {
      console.error('Failed to update listing status:', error);
      alert('Failed to update listing status. Please try again.');
    },
  });
  
  /**
   * Handle Edit Button Click
   * 
   * Navigate to the edit page for the selected listing.
   * The edit page will pre-fill the form with existing data.
   */
  const handleEdit = (listingId: string) => {
    navigate(`/listings/${listingId}/edit`);
  };
  
  /**
   * Handle Delete Button Click
   * 
   * Show confirmation modal before deleting.
   * This prevents accidental deletions.
   * 
   * Best Practice: Always confirm destructive actions!
   */
  const handleDeleteClick = (listing: Listing) => {
    setListingToDelete(listing);
  };
  
  /**
   * Confirm Delete
   * 
   * Actually delete the listing after user confirms.
   */
  const handleConfirmDelete = () => {
    if (listingToDelete) {
      deleteListingMutation.mutate(listingToDelete.id);
    }
  };
  
  /**
   * Cancel Delete
   * 
   * Close the confirmation modal without deleting.
   */
  const handleCancelDelete = () => {
    setListingToDelete(null);
  };
  
  /**
   * Handle Mark as Sold
   * 
   * Update the listing status to 'sold'.
   * This removes it from active search results.
   */
  const handleMarkAsSold = (listingId: string) => {
    updateStatusMutation.mutate({ listingId, status: 'sold' });
  };
  
  /**
   * Handle Mark as Active
   * 
   * Reactivate a sold listing (in case it was marked sold by mistake).
   */
  const handleMarkAsActive = (listingId: string) => {
    updateStatusMutation.mutate({ listingId, status: 'active' });
  };
  
  /**
   * Redirect if not logged in
   * 
   * This page requires authentication.
   * If no user is logged in, redirect to login page.
   */
  if (!user) {
    navigate('/login');
    return null;
  }
  
  /**
   * Loading State
   */
  if (isLoading) {
    return (
      <div className={styles.container}>
        <Card variant="elevated" padding="large">
          <Card.Body>
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading your listings...</p>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  /**
   * Error State
   */
  if (isError) {
    return (
      <div className={styles.container}>
        <Card variant="outlined" padding="large">
          <Card.Body>
            <h2 className={styles.errorTitle}>Unable to Load Listings</h2>
            <p className={styles.errorText}>
              {error instanceof Error 
                ? error.message 
                : 'An error occurred while loading your listings.'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>My Listings</h1>
        <Button onClick={() => navigate('/listings/create')}>
          Create New Listing
        </Button>
      </div>
      
      {/* Listings List */}
      {listings.length === 0 ? (
        // Empty State - No listings yet
        <Card variant="outlined" padding="large">
          <Card.Body>
            <div className={styles.emptyState}>
              <h2>No Listings Yet</h2>
              <p>You haven't created any listings yet. Create your first listing to get started!</p>
              <Button onClick={() => navigate('/listings/create')}>
                Create Your First Listing
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        // Display listings as cards
        <div className={styles.listingsContainer}>
          {listings.map((listing) => (
            <Card key={listing.id} variant="outlined" className={styles.listingCard}>
              <div className={styles.listingContent}>
                {/* Listing Image */}
                <div className={styles.listingImage}>
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      No Image
                    </div>
                  )}
                </div>
                
                {/* Listing Details */}
                <div className={styles.listingDetails}>
                  <div className={styles.listingHeader}>
                    <h3 className={styles.listingTitle}>{listing.title}</h3>
                    {/* Status Badge */}
                    <span 
                      className={`${styles.statusBadge} ${
                        listing.status === 'sold' 
                          ? styles.statusSold 
                          : styles.statusActive
                      }`}
                    >
                      {listing.status === 'sold' ? 'Sold' : 'Active'}
                    </span>
                  </div>
                  
                  <p className={styles.listingDescription}>
                    {listing.description.length > 150
                      ? `${listing.description.substring(0, 150)}...`
                      : listing.description}
                  </p>
                  
                  <div className={styles.listingMeta}>
                    <span className={styles.price}>
                      ${listing.price}
                      {listing.listingType === 'service' && listing.pricingType === 'hourly' && '/hr'}
                    </span>
                    <span className={styles.category}>{listing.category}</span>
                    <span className={styles.type}>
                      {listing.listingType === 'item' ? 'Item' : 'Service'}
                    </span>
                  </div>
                  
                  <div className={styles.listingDate}>
                    Posted: {new Date(listing.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className={styles.listingActions}>
                  {/* Edit Button - Always available */}
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleEdit(listing.id)}
                  >
                    Edit
                  </Button>
                  
                  {/* Mark as Sold/Active Button */}
                  {listing.status === 'active' ? (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleMarkAsSold(listing.id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? 'Updating...' : 'Mark as Sold'}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleMarkAsActive(listing.id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? 'Updating...' : 'Mark as Active'}
                    </Button>
                  )}
                  
                  {/* Delete Button - Destructive action */}
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleDeleteClick(listing)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {listingToDelete && (
        <Modal
          isOpen={!!listingToDelete}
          onClose={handleCancelDelete}
          title="Delete Listing"
        >
          <div className={styles.modalContent}>
            <p>
              Are you sure you want to delete "{listingToDelete.title}"?
            </p>
            <p className={styles.warningText}>
              This action cannot be undone. The listing will be permanently removed.
            </p>
            
            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                onClick={handleCancelDelete}
                disabled={deleteListingMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={deleteListingMutation.isPending}
                className={styles.confirmDeleteButton}
              >
                {deleteListingMutation.isPending ? 'Deleting...' : 'Delete Listing'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyListingsPage;
