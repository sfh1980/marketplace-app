/**
 * Profile Edit Page
 * 
 * This page allows users to edit their profile information and upload a profile picture.
 * 
 * Key Concepts Covered:
 * 
 * 1. File Uploads in React:
 *    - Using <input type="file"> for file selection
 *    - Reading files with FileReader API
 *    - Previewing images before upload
 *    - Sending files with FormData
 * 
 * 2. Form State Management:
 *    - Controlled inputs (React manages the value)
 *    - Handling multiple form fields
 *    - Validation before submission
 *    - Dirty state tracking (has form changed?)
 * 
 * 3. Image Preview:
 *    - FileReader.readAsDataURL() to convert file to data URL
 *    - Displaying preview before upload
 *    - Cleanup to prevent memory leaks
 * 
 * 4. Optimistic Updates:
 *    - Update UI immediately (don't wait for server)
 *    - Revert if server request fails
 *    - Better perceived performance
 * 
 * Educational Focus:
 * - How file uploads work in web applications
 * - FormData API for multipart/form-data requests
 * - Image preview techniques
 * - Form validation patterns
 * - Error handling and user feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadProfilePicture } from '../services/userService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import styles from './ProfileEditPage.module.css';

/**
 * ProfileEditPage Component
 * 
 * This component provides a form for users to edit their profile.
 * It handles both text fields (username, location) and file uploads (profile picture).
 */
export const ProfileEditPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  /**
   * Form State
   * 
   * We use controlled components - React manages the input values.
   * This gives us full control over the form data.
   */
  const [username, setUsername] = useState(user?.username || '');
  const [location, setLocation] = useState(user?.location || '');
  
  /**
   * File Upload State
   * 
   * selectedFile: The File object from the file input
   * previewUrl: Data URL for displaying image preview
   * 
   * Why separate state for file and preview?
   * - File object is for uploading to server
   * - Preview URL is for displaying to user
   * - They serve different purposes
   */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.profilePicture || null
  );
  
  /**
   * UI State
   * 
   * isSubmitting: True while saving changes (prevents double-submit)
   * error: Error message to display to user
   * success: Success message to display to user
   */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  /**
   * File Input Ref
   * 
   * We use a ref to access the file input element directly.
   * This allows us to trigger the file picker programmatically.
   * 
   * Why? Better UX - we can style a button and click the hidden input.
   */
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  /**
   * Redirect if not logged in
   * 
   * This page requires authentication.
   * If no user, redirect to login page.
   */
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  /**
   * Handle File Selection
   * 
   * This function runs when the user selects a file from the file picker.
   * 
   * Steps:
   * 1. Get the selected file from the input
   * 2. Validate file type (images only)
   * 3. Validate file size (max 5MB)
   * 4. Create a preview URL using FileReader
   * 5. Store the file for later upload
   * 
   * FileReader API:
   * - Reads file contents in the browser
   * - readAsDataURL() converts file to base64 data URL
   * - Data URL can be used as img src for preview
   * - Format: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
   * 
   * Why validate on frontend?
   * - Immediate feedback (don't wait for server)
   * - Save bandwidth (don't upload invalid files)
   * - Better UX (clear error messages)
   * 
   * Note: Always validate on backend too! Frontend validation can be bypassed.
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    // Validate file type
    // Accept common image formats
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }
    
    // Validate file size (5MB max)
    // file.size is in bytes, so 5MB = 5 * 1024 * 1024 bytes
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('Image must be smaller than 5MB');
      return;
    }
    
    // Clear any previous errors
    setError(null);
    
    // Store the file for upload
    setSelectedFile(file);
    
    /**
     * Create Preview URL
     * 
     * FileReader is an async API for reading files in the browser.
     * We use readAsDataURL() to convert the image to a data URL.
     * 
     * The onload callback fires when reading is complete.
     * reader.result contains the data URL we can use for preview.
     */
    const reader = new FileReader();
    reader.onload = (e) => {
      // e.target.result is the data URL
      // Type assertion because TypeScript doesn't know the result type
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  /**
   * Trigger File Picker
   * 
   * This function programmatically clicks the hidden file input.
   * This allows us to use a styled button instead of the default file input.
   * 
   * Better UX:
   * - Custom styled button
   * - Consistent with design system
   * - More accessible
   */
  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };
  
  /**
   * Remove Selected Image
   * 
   * Clears the selected file and preview.
   * Reverts to the user's current profile picture (if any).
   */
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(user?.profilePicture || null);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  /**
   * Handle Form Submission
   * 
   * This function handles saving profile changes.
   * 
   * Steps:
   * 1. Validate form data
   * 2. Upload profile picture (if changed)
   * 3. Update profile text fields (if changed)
   * 4. Update AuthContext with new user data
   * 5. Show success message
   * 6. Redirect to profile page
   * 
   * Error Handling:
   * - Catch and display any errors
   * - Don't redirect if there's an error
   * - Allow user to fix and retry
   * 
   * Why separate requests for image and profile?
   * - Image upload uses multipart/form-data
   * - Profile update uses application/json
   * - Different endpoints, different formats
   * - Could be combined, but this is simpler
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      return;
    }
    
    // Clear previous messages
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    
    try {
      let updatedUser = user;
      
      /**
       * Step 1: Upload Profile Picture (if changed)
       * 
       * If user selected a new image, upload it first.
       * The backend will return the updated user with new profilePicture URL.
       */
      if (selectedFile) {
        try {
          updatedUser = await uploadProfilePicture(user.id, selectedFile);
        } catch (err: any) {
          throw new Error(
            err.response?.data?.error?.message || 
            'Failed to upload profile picture'
          );
        }
      }
      
      /**
       * Step 2: Update Profile Fields (if changed)
       * 
       * Check if username or location changed.
       * Only send update request if something changed.
       * 
       * Why check for changes?
       * - Avoid unnecessary API calls
       * - Better performance
       * - Cleaner audit logs
       */
      const hasTextChanges = 
        username !== user.username || 
        location !== (user.location || '');
      
      if (hasTextChanges) {
        try {
          updatedUser = await updateProfile(user.id, {
            username: username.trim(),
            location: location.trim() || undefined,
          });
        } catch (err: any) {
          throw new Error(
            err.response?.data?.error?.message || 
            'Failed to update profile'
          );
        }
      }
      
      /**
       * Step 3: Update AuthContext
       * 
       * Update the global auth state with new user data.
       * This ensures the new data is reflected throughout the app.
       * 
       * The updateUser function also updates localStorage,
       * so the changes persist across page refreshes.
       */
      updateUser(updatedUser);
      
      // Show success message
      setSuccess('Profile updated successfully!');
      
      // Redirect to profile page after a short delay
      setTimeout(() => {
        navigate(`/profile/${user.id}`);
      }, 1500);
      
    } catch (err: any) {
      // Display error message
      setError(err.message || 'An error occurred while updating your profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Check if form has changes
   * 
   * Used to enable/disable the save button.
   * Only allow saving if something changed.
   */
  const hasChanges = 
    username !== user?.username ||
    location !== (user?.location || '') ||
    selectedFile !== null;
  
  // Don't render if not logged in (will redirect)
  if (!user) {
    return null;
  }
  
  return (
    <div className={styles.container}>
      <Card variant="elevated" padding="large">
        <Card.Body>
          <h1 className={styles.title}>Edit Profile</h1>
          
          {/* Success Message */}
          {success && (
            <div className={styles.successMessage}>
              {success}
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {/**
             * Profile Picture Section
             * 
             * This section handles image upload and preview.
             * 
             * Components:
             * - Hidden file input (actual file picker)
             * - Preview image (shows current or selected image)
             * - Select button (triggers file picker)
             * - Remove button (clears selection)
             * 
             * Why hide the file input?
             * - Default file input is ugly and hard to style
             * - We use a styled button instead
             * - Click the button -> trigger the hidden input
             */}
            <div className={styles.formSection}>
              <label className={styles.label}>Profile Picture</label>
              
              <div className={styles.imageUploadSection}>
                {/* Image Preview */}
                <div className={styles.imagePreview}>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className={styles.previewImage}
                    />
                  ) : (
                    <div className={styles.previewPlaceholder}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Image Upload Controls */}
                <div className={styles.imageControls}>
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className={styles.fileInput}
                    aria-label="Select profile picture"
                  />
                  
                  {/* Select Image Button */}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSelectImage}
                  >
                    {previewUrl ? 'Change Image' : 'Select Image'}
                  </Button>
                  
                  {/* Remove Image Button (only show if image selected) */}
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </Button>
                  )}
                  
                  <p className={styles.imageHint}>
                    JPEG, PNG, GIF, or WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>
            
            {/**
             * Username Field
             * 
             * Controlled input - React manages the value.
             * onChange updates state, which updates the input.
             * 
             * This creates a "single source of truth" - the state.
             */}
            <div className={styles.formSection}>
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                minLength={3}
                maxLength={20}
              />
              <p className={styles.fieldHint}>
                3-20 characters. Letters, numbers, and underscores only.
              </p>
            </div>
            
            {/**
             * Location Field
             * 
             * Optional field - user can leave it empty.
             * We use || '' to handle null values from the database.
             */}
            <div className={styles.formSection}>
              <Input
                label="Location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA"
                maxLength={100}
              />
              <p className={styles.fieldHint}>
                Optional. Your general location (city, state).
              </p>
            </div>
            
            {/**
             * Form Actions
             * 
             * Save button:
             * - Disabled if no changes or submitting
             * - Shows loading state while submitting
             * 
             * Cancel button:
             * - Returns to profile page
             * - Discards any changes
             */}
            <div className={styles.formActions}>
              <Button
                type="submit"
                disabled={!hasChanges || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/profile/${user.id}`)}
                disabled={isSubmitting}
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

export default ProfileEditPage;
