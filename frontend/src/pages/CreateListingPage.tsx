/**
 * Create Listing Page
 * 
 * This page allows users to create new listings for items or services.
 * 
 * Key Concepts Covered:
 * 
 * 1. Dynamic Forms:
 *    - Form fields change based on listing type (item vs service)
 *    - Conditional rendering of form sections
 *    - Different validation rules for different types
 * 
 * 2. Multiple File Uploads:
 *    - Handling multiple file selection
 *    - Preview images before upload
 *    - Limit to 10 images maximum
 *    - Remove individual images from selection
 * 
 * 3. Form State Management:
 *    - Managing complex form state with multiple fields
 *    - Validation before submission
 *    - Error handling and display
 * 
 * 4. Category Selection:
 *    - Fetch categories from API
 *    - Populate dropdown dynamically
 *    - Handle loading state
 * 
 * Educational Focus:
 * - How to build dynamic forms that change based on user input
 * - Multiple file upload patterns and best practices
 * - Image preview techniques with FileReader API
 * - Form validation strategies
 * - Handling complex form submissions with files
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { createListing } from '../services/listingService';
import { getCategories } from '../services/searchService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { ListingType, PricingType, Category } from '../types/api';
import styles from './CreateListingPage.module.css';

/**
 * Image Preview Interface
 * 
 * We store both the File object (for upload) and a preview URL (for display).
 * The id helps us identify which image to remove.
 */
interface ImagePreview {
  id: string;
  file: File;
  previewUrl: string;
}

/**
 * CreateListingPage Component
 * 
 * This component provides a comprehensive form for creating listings.
 * It handles both item and service listings with different fields for each.
 */
export const CreateListingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  /**
   * Form State
   * 
   * We manage form state with individual useState hooks.
   * This gives us fine-grained control over each field.
   * 
   * Alternative: Could use React Hook Form library for complex forms,
   * but for educational purposes, we'll manage state manually.
   */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [listingType, setListingType] = useState<ListingType>('item');
  const [pricingType, setPricingType] = useState<PricingType>('fixed');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState(user?.location || '');
  
  /**
   * Image Upload State
   * 
   * selectedImages: Array of image previews (file + preview URL)
   * 
   * Why an array of objects instead of just files?
   * - We need the File for upload
   * - We need the preview URL for display
   * - We need an ID to identify which image to remove
   */
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  
  /**
   * UI State
   * 
   * error: Error message to display
   * isSubmitting: True while creating listing (prevents double-submit)
   */
  const [error, setError] = useState<string | null>(null);
  
  /**
   * File Input Ref
   * 
   * We use a ref to access the file input element.
   * This allows us to:
   * 1. Trigger the file picker programmatically
   * 2. Reset the input after selecting files
   */
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  /**
   * Fetch Categories
   * 
   * We fetch categories from the API to populate the dropdown.
   * React Query handles caching, so this only fetches once.
   * 
   * Benefits of React Query:
   * - Automatic caching (fast subsequent loads)
   * - Loading and error states
   * - Background refetching
   * - No need to manage state manually
   */
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
  
  /**
   * Create Listing Mutation
   * 
   * useMutation is for operations that change data (POST, PUT, DELETE).
   * It provides:
   * - Loading state (isPending)
   * - Error handling
   * - Success callbacks
   * 
   * We'll call mutate() when the form is submitted.
   */
  const createListingMutation = useMutation({
    mutationFn: createListing,
    onSuccess: (newListing) => {
      // Redirect to the new listing's detail page
      navigate(`/listings/${newListing.id}`);
    },
    onError: (err: any) => {
      // Display error message
      setError(
        err.response?.data?.error?.message || 
        'Failed to create listing. Please try again.'
      );
    },
  });
  
  /**
   * Redirect if not logged in
   * 
   * Only authenticated users can create listings.
   */
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  /**
   * Handle Image Selection
   * 
   * This function runs when the user selects images from the file picker.
   * 
   * Steps:
   * 1. Get selected files from input
   * 2. Validate file types (images only)
   * 3. Validate file sizes (5MB max per image)
   * 4. Check total count (10 images max)
   * 5. Create preview URLs using FileReader
   * 6. Add to selectedImages array
   * 
   * FileReader API:
   * - Reads file contents in the browser
 * - readAsDataURL() converts file to base64 data URL
   * - Data URL can be used as img src for preview
   * 
   * Why validate on frontend?
   * - Immediate feedback (don't wait for server)
   * - Save bandwidth (don't upload invalid files)
   * - Better UX (clear error messages)
   * 
   * Note: Always validate on backend too! Frontend validation can be bypassed.
   */
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) {
      return;
    }
    
    // Check if adding these files would exceed the limit
    const totalImages = selectedImages.length + files.length;
    if (totalImages > 10) {
      setError(`You can only upload up to 10 images. You have ${selectedImages.length} selected.`);
      return;
    }
    
    // Validate each file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    
    for (const file of files) {
      // Check file type
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Please select JPEG, PNG, GIF, or WebP images.`);
        return;
      }
      
      // Check file size
      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size is 5MB.`);
        return;
      }
    }
    
    // Clear any previous errors
    setError(null);
    
    /**
     * Create Preview URLs
     * 
     * For each file, we:
     * 1. Generate a unique ID
     * 2. Create a FileReader to read the file
     * 3. Convert to data URL for preview
     * 4. Add to selectedImages array
     * 
     * FileReader is async, so we use Promise.all to wait for all files.
     */
    const newImagePreviews: ImagePreview[] = [];
    
    // Process each file
    files.forEach((file) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const preview: ImagePreview = {
          id: `${Date.now()}-${Math.random()}`, // Unique ID
          file: file,
          previewUrl: e.target?.result as string,
        };
        
        newImagePreviews.push(preview);
        
        // When all files are processed, update state
        if (newImagePreviews.length === files.length) {
          setSelectedImages((prev) => [...prev, ...newImagePreviews]);
        }
      };
      
      reader.readAsDataURL(file);
    });
    
    // Reset the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  /**
   * Remove Image
   * 
   * Remove an image from the selection by its ID.
   * We filter out the image with the matching ID.
   */
  const handleRemoveImage = (imageId: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== imageId));
  };
  
  /**
   * Trigger File Picker
   * 
   * Programmatically click the hidden file input.
   * This allows us to use a styled button instead of the default file input.
   */
  const handleSelectImages = () => {
    fileInputRef.current?.click();
  };
  
  /**
   * Validate Form
   * 
   * Validates all form fields and returns validation errors.
   * This allows us to check if the form is valid before submission
   * and disable the submit button accordingly.
   * 
   * @returns Object containing validation errors for each field
   */
  const validateForm = () => {
    const errors: Record<string, string | null> = {};
    
    // Validate title
    if (title.trim().length === 0) {
      errors.title = 'Title is required';
    } else if (title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters';
    } else if (title.trim().length > 100) {
      errors.title = 'Title must be no more than 100 characters';
    } else {
      errors.title = null;
    }
    
    // Validate description
    if (description.trim().length === 0) {
      errors.description = 'Description is required';
    } else if (description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    } else if (description.trim().length > 2000) {
      errors.description = 'Description must be no more than 2000 characters';
    } else {
      errors.description = null;
    }
    
    // Validate price
    if (price.trim().length === 0) {
      errors.price = 'Price is required';
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        errors.price = 'Please enter a valid price greater than 0';
      } else {
        errors.price = null;
      }
    }
    
    // Validate category
    if (!category) {
      errors.category = 'Please select a category';
    } else {
      errors.category = null;
    }
    
    // Validate location
    if (location.trim().length === 0) {
      errors.location = 'Location is required';
    } else {
      errors.location = null;
    }
    
    // Validate images
    if (selectedImages.length === 0) {
      errors.images = 'Please upload at least one image';
    } else {
      errors.images = null;
    }
    
    return errors;
  };
  
  /**
   * Check if Form is Valid
   * 
   * Returns true if all fields are valid (no errors).
   * Used to enable/disable the submit button.
   */
  const isFormValid = () => {
    const errors = validateForm();
    return Object.values(errors).every((error) => error === null);
  };

  /**
   * Handle Form Submission
   * 
   * This function validates and submits the form.
   * 
   * Steps:
   * 1. Prevent default form submission
   * 2. Validate all required fields
   * 3. Validate at least one image
   * 4. Create request object
   * 5. Call mutation to create listing
   * 6. Handle success/error (mutation handles this)
   * 
   * Validation:
   * - Title: Required, 5-100 characters
   * - Description: Required, 20-2000 characters
   * - Price: Required, positive number
   * - Category: Required
   * - Location: Required
   * - Images: At least 1, max 10
   * - Pricing Type: Required for services
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validate all fields
    const errors = validateForm();
    
    // Find first error and display it
    const firstError = Object.values(errors).find((error) => error !== null);
    if (firstError) {
      setError(firstError);
      return;
    }
    
    /**
     * Create Request Object
     * 
     * We build the request object with all form data.
     * For services, we include the pricingType.
     * 
     * The images are File objects, which will be sent as multipart/form-data.
     */
    const priceNum = parseFloat(price);
    const listingData = {
      title: title.trim(),
      description: description.trim(),
      price: priceNum,
      listingType,
      category,
      location: location.trim(),
      images: selectedImages.map((img) => img.file),
      // Only include pricingType for services
      ...(listingType === 'service' && { pricingType }),
    };
    
    // Submit the form
    createListingMutation.mutate(listingData);
  };
  
  // Don't render if not logged in (will redirect)
  if (!user) {
    return null;
  }
  
  return (
    <div className={styles.container}>
      <Card variant="elevated" padding="large">
        <Card.Body>
          <h1 className={styles.title}>Create New Listing</h1>
          
          <p className={styles.subtitle}>
            List an item for sale or offer a service to the community.
          </p>
          
          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {/**
             * Listing Type Selection
             * 
             * Radio buttons to choose between item and service.
             * This determines which fields are shown.
             * 
             * Why radio buttons instead of dropdown?
             * - Only 2 options (item vs service)
             * - More visible and easier to understand
             * - Better UX for binary choices
             */}
            <div className={styles.formSection}>
              <label className={styles.label}>Listing Type *</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="listingType"
                    value="item"
                    checked={listingType === 'item'}
                    onChange={(e) => setListingType(e.target.value as ListingType)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioText}>Item for Sale</span>
                </label>
                
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="listingType"
                    value="service"
                    checked={listingType === 'service'}
                    onChange={(e) => setListingType(e.target.value as ListingType)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioText}>Service Offered</span>
                </label>
              </div>
            </div>
            
            {/**
             * Title Field
             * 
             * Required field for listing title.
             * 5-100 characters.
             */}
            <div className={styles.formSection}>
              <Input
                label="Title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  listingType === 'item' 
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
             * Textarea for detailed description.
             * 20-2000 characters.
             * 
             * Why textarea instead of input?
             * - Allows multiple lines
             * - Better for longer text
             * - Shows more content at once
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
                  listingType === 'item'
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
             * Price and Pricing Type
             * 
             * For items: Just price
             * For services: Price + pricing type (hourly or fixed)
             * 
             * This is an example of dynamic forms - the form changes
             * based on the listing type selection.
             */}
            <div className={styles.formRow}>
              <div className={styles.formSection}>
                <Input
                  label={listingType === 'service' ? 'Rate' : 'Price'}
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
               * Pricing Type (Services Only)
               * 
               * This field only appears for services.
               * Conditional rendering based on listingType.
               * 
               * Why show/hide instead of disable?
               * - Cleaner UI (don't show irrelevant fields)
               * - Less confusing for users
               * - Reduces form clutter
               */}
              {listingType === 'service' && (
                <div className={styles.formSection}>
                  <label htmlFor="pricingType" className={styles.label}>
                    Pricing Type *
                  </label>
                  <select
                    id="pricingType"
                    value={pricingType}
                    onChange={(e) => setPricingType(e.target.value as PricingType)}
                    required
                    className={styles.select}
                  >
                    <option value="hourly">Per Hour</option>
                    <option value="fixed">Fixed Price</option>
                  </select>
                  <p className={styles.fieldHint}>
                    How you charge for your service
                  </p>
                </div>
              )}
            </div>
            
            {/**
             * Category Selection
             * 
             * Dropdown populated from database categories.
             * Shows loading state while fetching.
             * 
             * Why fetch categories instead of hardcoding?
             * - Categories can be added/removed without code changes
             * - Centralized category management
             * - Consistent across the app
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
             * Pre-filled with user's location if available.
             * Users can change it for this specific listing.
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
             * Image Upload Section
             * 
             * This is the most complex part of the form.
             * 
             * Features:
             * - Multiple file selection
             * - Image previews
             * - Remove individual images
             * - Visual feedback (thumbnails)
             * - Limit to 10 images
             * 
             * Components:
             * - Hidden file input (actual file picker)
             * - Preview grid (shows selected images)
             * - Add button (triggers file picker)
             * - Remove buttons (on each preview)
             */}
            <div className={styles.formSection}>
              <label className={styles.label}>Images * (Max 10)</label>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className={styles.fileInput}
                aria-label="Select images"
              />
              
              {/* Image Preview Grid */}
              {selectedImages.length > 0 && (
                <div className={styles.imageGrid}>
                  {selectedImages.map((image) => (
                    <div key={image.id} className={styles.imagePreview}>
                      <img
                        src={image.previewUrl}
                        alt="Preview"
                        className={styles.previewImage}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(image.id)}
                        className={styles.removeButton}
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add Images Button */}
              <Button
                type="button"
                variant="secondary"
                onClick={handleSelectImages}
                disabled={selectedImages.length >= 10}
              >
                {selectedImages.length === 0 
                  ? 'Add Images' 
                  : `Add More Images (${selectedImages.length}/10)`}
              </Button>
              
              <p className={styles.fieldHint}>
                Upload 1-10 images. JPEG, PNG, GIF, or WebP. Max 5MB each.
              </p>
            </div>
            
            {/**
             * Form Actions
             * 
             * Submit button:
             * - Disabled while submitting (prevents double-submit)
             * - Disabled when form is invalid (prevents invalid submission)
             * - Shows loading state
             * 
             * Cancel button:
             * - Returns to previous page
             * - Discards all changes
             * 
             * Why disable submit on invalid form?
             * - Prevents frustration (user clicks submit, sees error, fixes, repeats)
             * - Clear feedback (button disabled = something needs fixing)
             * - Better UX (user knows form state at a glance)
             */}
            <div className={styles.formActions}>
              <Button
                type="submit"
                disabled={!isFormValid() || createListingMutation.isPending}
              >
                {createListingMutation.isPending ? 'Creating...' : 'Create Listing'}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                disabled={createListingMutation.isPending}
              >
                Cancel
              </Button>
            </div>
            
            {/* Form Validation Hint */}
            {!isFormValid() && !error && (
              <p className={styles.validationHint}>
                Please fill in all required fields to create your listing
              </p>
            )}
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CreateListingPage;
