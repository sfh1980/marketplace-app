/**
 * Listing Edit Page
 * 
 * This page allows users to edit their existing listings.
 * 
 * Key Concepts Covered:
 * 
 * 1. Form Initialization:
 *    - Fetching existing data from API
 *    - Pre-filling form fields with current values
 *    - Handling loading state while data loads
 *    - Setting default values after data arrives
 * 
 * 2. PATCH vs POST Requests:
 *    - POST: Creates a new resource (used in CreateListingPage)
 *    - PUT: Replaces entire resource with new data
 *    - PATCH: Updates only specified fields (what we use here)
 *    - PATCH is more efficient - only sends changed fields
 * 
 * 3. Authorization:
 *    - Verify user owns the listing before allowing edits
 *    - Redirect if user doesn't own the listing
 *    - Show appropriate error messages
 * 
 * 4. Partial Updates:
 *    - Only send fields that changed
 *    - Keep unchanged fields as-is
 *    - More efficient than sending entire object
 * 
 * Educational Focus:
 * - How to initialize forms with existing data
 * - Understanding different HTTP methods (POST vs PUT vs PATCH)
 * - Handling authorization in the frontend
 * - Managing loading and error states
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getListingById, updateListing } from '../services/listingService';
import { getCategories } from '../services/searchService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { Category } from '../types/api';
import styles from './CreateListingPage.module.css'; // Reuse create page styles

/**
 * ListingEditPage Component
 * 
 * This component provides a form for editing existing listings.
 * It's similar to CreateListingPage but with key differences:
 * 
 * Similarities:
 * - Same form fields and validation
 * - Same styling and layout
 * - Same category dropdown
 * 
 * Differences:
 * - Fetches existing listing data first
 * - Pre-fills form with current values
 * - Uses PATCH instead of POST
 * - Doesn't allow image changes (images handled separately)
 * - Verifies user ownership
 * - Different submit button text
 */
export const ListingEditPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listingId } = useParams<{ listingId: string }>();
  
  /**
   * Form State
   * 
   * We initialize with empty strings, then populate with
   * existing data once it loads from the API.
   * 
   * Note: We don't allow changing listingType or images in edit mode.
   * Those are set when creating and can't be changed later.
   */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  
  /**
   * UI State
   */
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  /**
   * Fetch Existing Listing
   * 
   * We fetch the listing data to pre-fill the form.
   * 
   * React Query benefits:
   * - Automatic caching (if user navigates away and back)
   * - Loading state management
   * - Error handling
   * - Automatic refetching on window focus
   * 
   * Why fetch even though we might have the data?
   * - Ensures we have the latest data
   * - User might have navigated directly to edit URL
   * - Data might have changed since last view
   */
  const {
    data: listing,
    isLoading: isLoadingListing,
    error: listingError,
  } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => getListingById(listingId!),
    enabled: !!listingId, // Only fetch if we have a listingId
  });
  
  /**
   * Fetch Categories
   * 
   * Same as CreateListingPage - we need categories for the dropdown.
   */
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
  
  /**
   * Update Listing Mutation
   * 
   * useMutation for the PATCH request to update the listing.
   * 
   * Key differences from create mutation:
   * - Uses updateListing instead of createListing
   * - Sends listingId as parameter
   * - Only sends changed fields (partial update)
   * - Uses PATCH HTTP method (handled by updateListing function)
   */
  const updateListingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      updateListing(id, data),
    onSuccess: (updatedListing) => {
      // Redirect to the listing detail page
      navigate(`/listings/${updatedListing.id}`);
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.error?.message || 
        'Failed to update listing. Please try again.'
      );
    },
  });
  
  /**
   * Initialize Form with Existing Data
   * 
   * This effect runs when the listing data loads.
   * It populates all form fields with the current values.
   * 
   * Why useEffect instead of setting directly?
   * - Data loads asynchronously
   * - We need to wait for the query to complete
   * - Effect runs when 'listing' changes from undefined to data
   * 
   * The isInitialized flag prevents re-initializing if the
   * listing data refetches (e.g., on window focus).
   */
  useEffect(() => {
    if (listing && !isInitialized) {
      setTitle(listing.title);
      setDescription(listing.description);
      setPrice(listing.price.toString());
      setCategory(listing.category);
      setLocation(listing.location);
      setIsInitialized(true);
    }
  }, [listing, isInitialized]);
  
  /**
   * Authorization Check
   * 
   * Verify that the current user owns this listing.
   * Only the owner should be able to edit.
   * 
   * Why check on frontend?
   * - Better UX (immediate feedback)
   * - Prevents unnecessary API calls
   * - Shows appropriate error message
   * 
   * Why also check on backend?
   * - Frontend checks can be bypassed
   * - Security must be enforced server-side
   * - Backend is the source of truth
   */
  useEffect(() => {
    if (listing && user && listing.sellerId !== user.id) {
      setError('You do not have permission to edit this listing.');
      // Redirect after showing error
      setTimeout(() => {
        navigate(`/listings/${listingId}`);
      }, 2000);
    }
  }, [listing, user, listingId, navigate]);
  
  /**
   * Redirect if not logged in
   */
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  /**
   * Handle Form Submission
   * 
   * This function validates and submits the update.
   * 
   * Key differences from create:
   * - Only sends changed fields (more efficient)
   * - Uses PATCH instead of POST
   * - Doesn't handle images (images can't be changed in edit)
   * - Validates against existing data
   * 
   * PATCH Request Benefits:
   * - Smaller payload (only changed fields)
   * - Faster network transfer
   * - Less processing on server
   * - Clearer intent (partial update vs full replacement)
   * 
   * Example:
   * If user only changes price from $100 to $150:
   * - POST/PUT would send: { title, description, price: 150, category, location }
   * - PATCH sends: { price: 150 }
   * 
   * Much more efficient!
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!listing) {
      setError('Listing data not loaded');
      return;
    }
    
    // Clear previous errors
    setError(null);
    
    // Validate title
    if (title.trim().length < 5 || title.trim().length > 100) {
      setError('Title must be between 5 and 100 characters');
      return;
    }
    
    // Validate description
    if (description.trim().length < 20 || description.trim().length > 2000) {
      setError('Description must be between 20 and 2000 characters');
      return;
    }
    
    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price greater than 0');
      return;
    }
    
    // Validate category
    if (!category) {
      setError('Please select a category');
      return;
    }
    
    // Validate location
    if (location.trim().length === 0) {
      setError('Please enter a location');
      return;
    }
    
    /**
     * Build Update Object (Only Changed Fields)
     * 
     * We only include fields that have changed.
     * This is the key difference between PATCH and PUT.
     * 
     * Why only send changed fields?
     * - More efficient (smaller payload)
     * - Clearer intent (what actually changed)
     * - Reduces chance of conflicts
     * - Better for audit logs (know what changed)
     * 
     * How we detect changes:
     * - Compare current form values to original listing data
     * - Only include fields where value differs
     * - Trim strings before comparing (ignore whitespace changes)
     */
    const updates: any = {};
    
    if (title.trim() !== listing.title) {
      updates.title = title.trim();
    }
    
    if (description.trim() !== listing.description) {
      updates.description = description.trim();
    }
    
    if (priceNum !== listing.price) {
      updates.price = priceNum;
    }
    
    if (category !== listing.category) {
      updates.category = category;
    }
    
    if (location.trim() !== listing.location) {
      updates.location = location.trim();
    }
    
    /**
     * Check if anything changed
     * 
     * If no fields changed, don't make an API call.
     * This saves bandwidth and server resources.
     */
    if (Object.keys(updates).length === 0) {
      setError('No changes detected. Please modify at least one field.');
      return;
    }
    
    // Submit the update
    updateListingMutation.mutate({
      id: listingId!,
      data: updates,
    });
  };
  
  /**
   * Loading State
   * 
   * Show loading message while fetching listing data.
   * We can't show the form until we have the data to populate it.
   */
  if (isLoadingListing) {
    return (
      <div className={styles.container}>
        <Card variant="elevated" padding="large">
          <Card.Body>
            <p>Loading listing...</p>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  /**
   * Error State
   * 
   * Show error if listing couldn't be loaded.
   * This might happen if:
   * - Listing doesn't exist
   * - Network error
   * - User doesn't have permission
   */
  if (listingError || !listing) {
    return (
      <div className={styles.container}>
        <Card variant="elevated" padding="large">
          <Card.Body>
            <h1 className={styles.title}>Error</h1>
            <p className={styles.errorMessage}>
              {listingError 
                ? 'Failed to load listing. Please try again.'
                : 'Listing not found.'}
            </p>
            <Button onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  // Don't render if not logged in (will redirect)
  if (!user) {
    return null;
  }
  
  return (
    <div className={styles.container}>
      <Card variant="elevated" padding="large">
        <Card.Body>
          <h1 className={styles.title}>Edit Listing</h1>
          
          <p className={styles.subtitle}>
            Update your {listing.listingType === 'item' ? 'item' : 'service'} listing.
          </p>
          
          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {/**
             * Listing Type Display (Read-Only)
             * 
             * We show the listing type but don't allow changing it.
             * Listing type is set when creating and can't be changed.
             * 
             * Why not allow changing?
             * - Item and service have different fields (pricingType)
             * - Would require complex migration logic
             * - Better to create a new listing if type is wrong
             * - Simpler data model and validation
             */}
            <div className={styles.formSection}>
              <label className={styles.label}>Listing Type</label>
              <div className={styles.readOnlyField}>
                {listing.listingType === 'item' ? 'Item for Sale' : 'Service Offered'}
              </div>
              <p className={styles.fieldHint}>
                Listing type cannot be changed. Create a new listing to change type.
              </p>
            </div>
            
            {/**
             * Title Field
             * 
             * Pre-filled with current title.
             * User can edit and changes will be saved.
             */}
            <div className={styles.formSection}>
              <Input
                label="Title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  listing.listingType === 'item' 
                    ? 'e.g., Vintage Camera in Excellent Condition'
                    : 'e.g., Professional Web Development Services'
                }
                required
                minLength={5}
                maxLength={100}
              />
              <p className={styles.fieldHint}>
                {title.length}/100 characters. Be specific and descriptive.
              </p>
            </div>
            
            {/**
             * Description Field
             * 
             * Pre-filled with current description.
             */}
            <div className={styles.formSection}>
              <label htmlFor="description" className={styles.label}>
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  listing.listingType === 'item'
                    ? 'Describe the item\'s condition, features, and any relevant details...'
                    : 'Describe your service, experience, and what clients can expect...'
                }
                required
                minLength={20}
                maxLength={2000}
                rows={6}
                className={styles.textarea}
              />
              <p className={styles.fieldHint}>
                {description.length}/2000 characters. Include important details.
              </p>
            </div>
            
            {/**
             * Price Field
             * 
             * Pre-filled with current price.
             * 
             * Note: We show the pricing type but don't allow changing it.
             * For services, the pricing type (hourly/fixed) is set at creation.
             */}
            <div className={styles.formRow}>
              <div className={styles.formSection}>
                <Input
                  label={listing.listingType === 'service' ? 'Rate' : 'Price'}
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  min="0.01"
                  step="0.01"
                />
                <p className={styles.fieldHint}>
                  Enter amount in USD ($)
                </p>
              </div>
              
              {/**
               * Pricing Type Display (Services Only, Read-Only)
               * 
               * For services, show the pricing type but don't allow changing.
               * This is set at creation and can't be modified.
               */}
              {listing.listingType === 'service' && listing.pricingType && (
                <div className={styles.formSection}>
                  <label className={styles.label}>Pricing Type</label>
                  <div className={styles.readOnlyField}>
                    {listing.pricingType === 'hourly' ? 'Per Hour' : 'Fixed Price'}
                  </div>
                  <p className={styles.fieldHint}>
                    Pricing type cannot be changed
                  </p>
                </div>
              )}
            </div>
            
            {/**
             * Category Selection
             * 
             * Pre-filled with current category.
             * User can change to a different category.
             */}
            <div className={styles.formSection}>
              <label htmlFor="category" className={styles.label}>
                Category *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                disabled={isLoadingCategories}
                className={styles.select}
              >
                <option value="">
                  {isLoadingCategories ? 'Loading categories...' : 'Select a category'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className={styles.fieldHint}>
                Choose the category that best fits your listing
              </p>
            </div>
            
            {/**
             * Location Field
             * 
             * Pre-filled with current location.
             */}
            <div className={styles.formSection}>
              <Input
                label="Location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA"
                required
                maxLength={100}
              />
              <p className={styles.fieldHint}>
                Where is the item located or where do you provide the service?
              </p>
            </div>
            
            {/**
             * Images Display (Read-Only)
             * 
             * We show the current images but don't allow editing them here.
             * Image management could be a separate feature in the future.
             * 
             * Why not allow image editing?
             * - Complex to implement (add/remove/reorder)
             * - Requires separate API endpoints
             * - File uploads are tricky in edit forms
             * - Better as a separate "Manage Images" feature
             * - Keeps this form simple and focused
             */}
            <div className={styles.formSection}>
              <label className={styles.label}>Current Images</label>
              <div className={styles.imageGrid}>
                {listing.images.map((imageUrl, index) => (
                  <div key={index} className={styles.imagePreview}>
                    <img
                      src={imageUrl}
                      alt={`Listing image ${index + 1}`}
                      className={styles.previewImage}
                    />
                  </div>
                ))}
              </div>
              <p className={styles.fieldHint}>
                Image editing is not available yet. Contact support if you need to change images.
              </p>
            </div>
            
            {/**
             * Form Actions
             * 
             * Save button:
             * - Disabled while updating
             * - Shows loading state
             * - Only enabled if form is valid
             * 
             * Cancel button:
             * - Returns to listing detail page
             * - Discards all changes
             */}
            <div className={styles.formActions}>
              <Button
                type="submit"
                disabled={updateListingMutation.isPending}
              >
                {updateListingMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/listings/${listingId}`)}
                disabled={updateListingMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ListingEditPage;
