/**
 * User Controller
 * 
 * Handles HTTP requests for user-related endpoints.
 * 
 * Controller responsibilities:
 * - Parse and validate HTTP requests
 * - Call service layer for business logic
 * - Format and send HTTP responses
 * - Handle errors and return appropriate status codes
 * 
 * REST API Design:
 * - Resource-based URLs (/api/users/:id)
 * - HTTP methods match actions (GET = retrieve)
 * - Stateless (no server-side session state)
 * - Standard status codes (200, 404, 500)
 */

import { Request, Response } from 'express';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { validateProfileUpdateData } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { deleteProfilePicture } from '../config/upload';

/**
 * Get user profile by ID
 * 
 * GET /api/users/:id
 * 
 * URL parameter:
 * - id: User's unique identifier (UUID)
 * 
 * Success response (200 OK):
 * {
 *   user: {
 *     id: string,
 *     username: string,
 *     profilePicture: string | null,
 *     location: string | null,
 *     joinDate: Date,
 *     averageRating: number,
 *     listings: Array<{
 *       id: string,
 *       title: string,
 *       description: string,
 *       price: number,
 *       listingType: string,
 *       images: string[],
 *       status: string,
 *       createdAt: Date
 *     }>
 *   }
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid user ID format
 * - 404 Not Found: User doesn't exist
 * - 500 Internal Server Error: Unexpected error
 * 
 * Resource Relationships:
 * - User has many Listings (one-to-many)
 * - We use Prisma's include to fetch related data efficiently
 * - This prevents N+1 query problem (separate query for each listing)
 * 
 * Privacy Considerations:
 * - Email is NOT included (private information)
 * - Only active listings are shown (not sold/deleted)
 * - Password hash is never exposed
 * 
 * Use Cases:
 * - Buyer viewing seller's profile before purchase
 * - Checking seller's reputation and history
 * - Browsing all listings from a specific seller
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    // Extract user ID from URL parameter
    // Example: /api/users/123e4567-e89b-12d3-a456-426614174000
    const { id } = req.params;

    // Step 1: Validate user ID is provided
    if (!id) {
      res.status(400).json({
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required',
        },
      });
      return;
    }

    // Step 2: Validate user ID format (UUID)
    // UUIDs have a specific format: 8-4-4-4-12 hex digits
    // Example: 123e4567-e89b-12d3-a456-426614174000
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user ID format',
        },
      });
      return;
    }

    // Step 3: Fetch user profile from service layer
    // Service handles database query and business logic
    const userProfile = await getUserProfile(id);

    // Step 4: Check if user exists
    if (!userProfile) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // Step 5: Return success response
    // Note: We don't include email or password hash for privacy
    res.status(200).json({
      user: userProfile,
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    console.error('Get profile error:', error);

    // Return generic error to client (don't expose internal details)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while retrieving user profile',
      },
    });
  }
}

/**
 * Update user profile
 * 
 * PATCH /api/users/:id
 * 
 * HTTP Method: PATCH (not PUT)
 * - PATCH = Partial update (only send fields that changed)
 * - PUT = Full replacement (send entire resource)
 * 
 * Why PATCH?
 * - More efficient (less data transfer)
 * - Better UX (update one field at a time)
 * - Follows REST best practices
 * - Reduces risk of accidentally clearing fields
 * 
 * Example: Update just location
 * PATCH /api/users/123
 * { "location": "Seattle, WA" }
 * 
 * Example: Update username and location
 * PATCH /api/users/123
 * { "username": "newname", "location": "Portland, OR" }
 * 
 * Request body (all fields optional):
 * {
 *   username?: string,
 *   location?: string | null,
 *   profilePicture?: string | null
 * }
 * 
 * Success response (200 OK):
 * {
 *   user: {
 *     id: string,
 *     username: string,
 *     profilePicture: string | null,
 *     location: string | null,
 *     joinDate: Date,
 *     averageRating: number,
 *     listings: Array<Listing>
 *   }
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid input data
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Trying to update someone else's profile
 * - 404 Not Found: User doesn't exist
 * - 409 Conflict: Username already taken
 * - 500 Internal Server Error: Unexpected error
 * 
 * Authorization:
 * - Users can only update their own profile
 * - Must be authenticated (JWT token required)
 * - req.user.userId must match :id parameter
 * 
 * Data Validation:
 * - Username: 3-20 chars, alphanumeric and underscores
 * - Location: Optional, max 100 chars
 * - Profile picture: Optional, valid URL
 * 
 * What can be updated:
 * - username (must be unique)
 * - location (general area)
 * - profilePicture (URL to image)
 * 
 * What CANNOT be updated here:
 * - email (requires verification flow)
 * - password (requires current password)
 * - joinDate (immutable)
 * - averageRating (calculated from ratings)
 * 
 * Security considerations:
 * - Validate user owns the profile (authorization)
 * - Validate all input data (prevent injection)
 * - Check username uniqueness (prevent conflicts)
 * - Rate limit to prevent abuse
 * 
 * @param req - Express request with authenticated user
 * @param res - Express response
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // Step 1: Extract user ID from URL parameter
    const { id } = req.params;

    // Step 2: Validate user ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      res.status(400).json({
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user ID format',
        },
      });
      return;
    }

    // Step 3: Check authentication
    // This should be enforced by middleware, but double-check for safety
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'You must be logged in to update a profile',
        },
      });
      return;
    }

    // Step 4: Check authorization - users can only update their own profile
    // This is a critical security check!
    // Without this, any authenticated user could update any profile
    if (req.user.userId !== id) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own profile',
        },
      });
      return;
    }

    // Step 5: Extract update data from request body
    const { username, location, profilePicture } = req.body;

    // Step 6: Check that at least one field is provided
    // PATCH requires at least one field to update
    if (username === undefined && location === undefined && profilePicture === undefined) {
      res.status(400).json({
        error: {
          code: 'NO_UPDATE_DATA',
          message: 'At least one field must be provided for update',
        },
      });
      return;
    }

    // Step 7: Validate input data
    // Only validates fields that are provided (partial validation)
    const validation = validateProfileUpdateData(username, location, profilePicture);
    if (!validation.isValid) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid profile data',
          details: validation.errors,
        },
      });
      return;
    }

    // Step 8: Update profile in database
    // Service layer handles the actual update logic
    const updatedProfile = await updateUserProfile(id, {
      username,
      location,
      profilePicture,
    });

    // Step 9: Check if user exists
    if (!updatedProfile) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // Step 10: Return success response with updated profile
    // Return full profile (same format as GET /api/users/:id)
    // This allows frontend to update its state without additional request
    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedProfile,
    });
  } catch (error: any) {
    // Handle specific errors
    if (error.message === 'Username already taken') {
      res.status(409).json({
        error: {
          code: 'USERNAME_TAKEN',
          message: 'Username is already taken',
        },
      });
      return;
    }

    // Log error for debugging
    console.error('Update profile error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while updating profile',
      },
    });
  }
}

/**
 * Upload profile picture
 * 
 * POST /api/users/:id/avatar
 * 
 * This endpoint handles profile picture uploads using multipart/form-data.
 * 
 * What is multipart/form-data?
 * - Standard encoding for file uploads
 * - Splits request into multiple parts (text fields + binary files)
 * - Each part has its own headers and content type
 * - Required for sending files from browser to server
 * 
 * How file uploads work:
 * 1. Browser creates multipart/form-data request
 * 2. Multer middleware intercepts the request
 * 3. Multer validates file type and size
 * 4. Multer saves file to disk with unique name
 * 5. Multer adds file info to req.file
 * 6. Our controller updates user's profilePicture URL
 * 7. Response includes new profile picture URL
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
 * Example using HTML form:
 * <form action="/api/users/123/avatar" method="POST" enctype="multipart/form-data">
 *   <input type="file" name="profilePicture" accept="image/*">
 *   <button type="submit">Upload</button>
 * </form>
 * 
 * Success response (200 OK):
 * {
 *   message: "Profile picture uploaded successfully",
 *   profilePictureUrl: "/uploads/profile-pictures/user123-1234567890-abc.jpg"
 * }
 * 
 * Error responses:
 * - 400 Bad Request: No file uploaded or invalid file type
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Trying to upload for another user
 * - 413 Payload Too Large: File exceeds 5MB
 * - 500 Internal Server Error: Unexpected error
 * 
 * Security considerations:
 * - Only authenticated users can upload
 * - Users can only upload to their own profile
 * - File type validation (only images)
 * - File size limit (5MB max)
 * - Unique filenames prevent overwrites
 * - Old profile pictures are deleted to save space
 * 
 * Storage approach (MVP):
 * - Files stored in backend/uploads/profile-pictures/
 * - Served through Express static middleware
 * - Simple and works for development/small scale
 * 
 * Future improvements (Post-MVP):
 * - Upload to cloud storage (AWS S3, Cloudinary)
 * - Image optimization (resize, compress)
 * - Multiple image sizes (thumbnail, medium, full)
 * - CDN for faster delivery
 * - Virus scanning
 * 
 * @param req - Express request with authenticated user and uploaded file
 * @param res - Express response
 */
export async function uploadProfilePicture(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Step 1: Extract user ID from URL parameter
    const { id } = req.params;

    // Step 2: Validate user ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      res.status(400).json({
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user ID format',
        },
      });
      return;
    }

    // Step 3: Check authentication
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'You must be logged in to upload a profile picture',
        },
      });
      return;
    }

    // Step 4: Check authorization - users can only upload to their own profile
    // This is critical for security!
    if (req.user.userId !== id) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only upload a profile picture for your own account',
        },
      });
      return;
    }

    // Step 5: Check if file was uploaded
    // Multer adds the file to req.file if upload was successful
    // If no file or Multer validation failed, req.file will be undefined
    if (!req.file) {
      res.status(400).json({
        error: {
          code: 'NO_FILE_UPLOADED',
          message: 'Please upload an image file',
        },
      });
      return;
    }

    // Step 6: Get the uploaded file information
    // Multer provides:
    // - filename: Unique name we generated
    // - originalname: Original filename from user
    // - mimetype: File's MIME type
    // - size: File size in bytes
    // - path: Full path where file is stored
    const { filename } = req.file;

    // Step 7: Generate public URL for the uploaded file
    // This URL will be stored in the database and used by frontend
    // Format: /uploads/profile-pictures/filename.jpg
    const profilePictureUrl = `/uploads/profile-pictures/${filename}`;

    // Step 8: Get old profile picture URL before updating
    // We need this to delete the old file after successful update
    const currentProfile = await getUserProfile(id);
    const oldProfilePictureUrl = currentProfile?.profilePicture;

    // Step 9: Update user's profile picture in database
    // We use the updateUserProfile service function
    const updatedProfile = await updateUserProfile(id, {
      profilePicture: profilePictureUrl,
    });

    // Step 10: Check if user exists
    if (!updatedProfile) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // Step 11: Delete old profile picture if it exists
    // This saves storage space and keeps uploads directory clean
    // We extract the filename from the old URL and delete the file
    // Note: This happens after successful database update
    // If database update fails, we don't delete the old picture
    if (oldProfilePictureUrl && oldProfilePictureUrl !== profilePictureUrl) {
      // Extract filename from old URL
      // Example: "/uploads/profile-pictures/old-file.jpg" -> "old-file.jpg"
      const oldFilename = oldProfilePictureUrl.split('/').pop();
      if (oldFilename) {
        deleteProfilePicture(oldFilename);
      }
    }

    // Step 12: Return success response
    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePictureUrl: profilePictureUrl,
      user: updatedProfile,
    });
  } catch (error: any) {
    // Handle Multer errors
    // Multer throws specific errors for validation failures
    if (error.message && error.message.includes('Invalid file type')) {
      res.status(400).json({
        error: {
          code: 'INVALID_FILE_TYPE',
          message: error.message,
        },
      });
      return;
    }

    if (error.message && error.message.includes('File too large')) {
      res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 5MB limit',
        },
      });
      return;
    }

    // Log error for debugging
    console.error('Upload profile picture error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while uploading profile picture',
      },
    });
  }
}
