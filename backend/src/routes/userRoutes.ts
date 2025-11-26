/**
 * User Routes
 * 
 * Defines user-related API endpoints.
 * These routes demonstrate how to use authentication middleware.
 */

import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { Response } from 'express';
import { getProfile, updateProfile, uploadProfilePicture } from '../controllers/userController';
import { uploadProfilePicture as multerUpload } from '../config/upload';

const router = Router();

/**
 * GET /api/users/profile
 * 
 * Get current user's profile
 * 
 * Protected endpoint - requires authentication
 * 
 * This is a simple example to demonstrate the authenticate middleware.
 * The middleware will:
 * 1. Verify the JWT token
 * 2. Attach user info to req.user
 * 3. Allow this handler to run
 * 
 * If authentication fails, the middleware will send an error response
 * and this handler will never run.
 */
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // At this point, we know req.user exists because authenticate middleware
    // would have returned an error if authentication failed
    
    // TypeScript knows req.user might be undefined, so we check
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // In a real application, we would fetch full user data from database
    // For now, we just return the data from the JWT token
    res.status(200).json({
      message: 'Profile retrieved successfully',
      user: {
        userId: req.user.userId,
        email: req.user.email,
        username: req.user.username,
      },
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * GET /api/users/me
 * 
 * Another example of a protected route
 * Same as /profile but different endpoint name
 * 
 * This demonstrates that you can easily protect any route
 * by adding the authenticate middleware
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        },
      });
      return;
    }

    res.status(200).json({
      userId: req.user.userId,
      email: req.user.email,
      username: req.user.username,
    });
  } catch (error) {
    console.error('User info retrieval error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * GET /api/users/:id
 * 
 * Get public profile for any user by ID
 * 
 * This is a PUBLIC endpoint - no authentication required
 * Anyone can view user profiles to build trust in the marketplace
 * 
 * REST API Design:
 * - Resource-based URL: /api/users/:id represents a specific user
 * - GET method: Retrieve data (read-only, safe operation)
 * - Stateless: No server-side session state needed
 * - Standard status codes: 200 (success), 404 (not found), 500 (error)
 * 
 * Resource Relationships:
 * - User has many Listings (one-to-many relationship)
 * - We fetch related listings in one query (eager loading)
 * - This prevents N+1 query problem
 * 
 * Privacy:
 * - Email is NOT exposed (private)
 * - Only active listings are shown
 * - Password hash is never included
 */
router.get('/:id', getProfile);

/**
 * PATCH /api/users/:id
 * 
 * Update user profile (partial update)
 * 
 * This is a PROTECTED endpoint - authentication required
 * Users can only update their own profile
 * 
 * HTTP Method: PATCH (not PUT)
 * - PATCH = Partial update (only changed fields)
 * - PUT = Full replacement (all fields required)
 * 
 * Why PATCH?
 * - More efficient (less data transfer)
 * - Better UX (update one field at a time)
 * - Follows REST best practices
 * - Industry standard for partial updates
 * 
 * Authorization:
 * - authenticate middleware verifies JWT token
 * - Controller verifies user owns the profile (req.user.userId === :id)
 * - Returns 403 Forbidden if trying to update someone else's profile
 * 
 * Request body (all fields optional):
 * {
 *   username?: string,
 *   location?: string | null,
 *   profilePicture?: string | null
 * }
 * 
 * Validation:
 * - Username: 3-20 chars, alphanumeric and underscores, must be unique
 * - Location: Optional, max 100 chars
 * - Profile picture: Optional, valid URL
 * 
 * Example usage:
 * PATCH /api/users/123e4567-e89b-12d3-a456-426614174000
 * Authorization: Bearer <token>
 * { "location": "Seattle, WA" }
 * 
 * Response: Updated user profile (same format as GET /api/users/:id)
 */
router.patch('/:id', authenticate, updateProfile);

/**
 * POST /api/users/:id/avatar
 * 
 * Upload profile picture
 * 
 * This is a PROTECTED endpoint - authentication required
 * Users can only upload profile pictures for their own account
 * 
 * File Upload Explained:
 * - Uses multipart/form-data encoding (required for files)
 * - Multer middleware handles file parsing and validation
 * - File is saved to disk with unique filename
 * - Database stores URL to access the file
 * 
 * Middleware chain:
 * 1. authenticate - Verify JWT token, add user to req.user
 * 2. multerUpload.single('profilePicture') - Parse file upload
 *    - Validates file type (only images)
 *    - Validates file size (max 5MB)
 *    - Saves file to uploads/profile-pictures/
 *    - Adds file info to req.file
 * 3. uploadProfilePicture - Update database with new URL
 * 
 * What is .single('profilePicture')?
 * - Tells Multer to expect ONE file
 * - Field name must be 'profilePicture'
 * - File will be available at req.file
 * - If multiple files sent, only first is processed
 * 
 * Request format:
 * - Content-Type: multipart/form-data
 * - Field name: profilePicture
 * - File: Image file (JPEG, PNG, GIF, WebP)
 * - Max size: 5MB
 * 
 * Example using curl:
 * curl -X POST http://localhost:5000/api/users/123/avatar \
 *   -H "Authorization: Bearer <token>" \
 *   -F "profilePicture=@/path/to/image.jpg"
 * 
 * Example using JavaScript Fetch API:
 * const formData = new FormData();
 * formData.append('profilePicture', fileInput.files[0]);
 * 
 * fetch('/api/users/123/avatar', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${token}`
 *   },
 *   body: formData
 * });
 * 
 * Success response (200 OK):
 * {
 *   message: "Profile picture uploaded successfully",
 *   profilePictureUrl: "/uploads/profile-pictures/user123-1234567890-abc.jpg",
 *   user: { ...updated user profile... }
 * }
 * 
 * Error responses:
 * - 400 Bad Request: No file uploaded or invalid file type
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Trying to upload for another user
 * - 413 Payload Too Large: File exceeds 5MB
 * - 500 Internal Server Error: Unexpected error
 * 
 * Security features:
 * - Authentication required (JWT token)
 * - Authorization check (can only upload to own profile)
 * - File type validation (only images allowed)
 * - File size limit (5MB max)
 * - Unique filenames (prevents overwrites and collisions)
 * - Old pictures deleted automatically (saves storage)
 * 
 * Storage (MVP):
 * - Files stored in backend/uploads/profile-pictures/
 * - Served through Express static middleware
 * - Simple and works for development
 * 
 * Future improvements:
 * - Cloud storage (AWS S3, Cloudinary)
 * - Image optimization (resize, compress)
 * - Multiple sizes (thumbnail, medium, full)
 * - CDN for faster delivery
 */
router.post(
  '/:id/avatar',
  authenticate,
  multerUpload.single('profilePicture'),
  uploadProfilePicture
);

export default router;
