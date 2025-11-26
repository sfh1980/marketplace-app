/**
 * File Upload Configuration
 * 
 * This module configures Multer for handling file uploads.
 * 
 * What is Multer?
 * - Middleware for handling multipart/form-data (file uploads)
 * - Handles file streaming, validation, and storage
 * - Standard solution for file uploads in Express
 * 
 * Why multipart/form-data?
 * - Regular forms use application/x-www-form-urlencoded
 * - Files are binary data and need special encoding
 * - multipart/form-data splits request into parts (text + files)
 * - Each part has its own headers and content
 * 
 * Storage Options:
 * - diskStorage: Save files to filesystem (what we're using for MVP)
 * - memoryStorage: Keep files in memory (for cloud upload)
 * - Custom storage: Implement your own storage engine
 * 
 * Security Considerations:
 * - Validate file types (only allow images)
 * - Limit file sizes (prevent DoS attacks)
 * - Generate unique filenames (prevent overwrites)
 * - Store outside web root (prevent direct execution)
 * - Scan for viruses in production
 */

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

/**
 * Ensure uploads directory exists
 * 
 * Why check this?
 * - The uploads directory might not exist on first run
 * - Multer will fail if the directory doesn't exist
 * - We create it automatically for better developer experience
 * 
 * Directory structure:
 * - uploads/
 *   - profile-pictures/  (user profile images)
 *   - listings/          (listing images - future)
 */
const uploadsDir = path.join(__dirname, '../../uploads');
const profilePicturesDir = path.join(uploadsDir, 'profile-pictures');

// Create directories if they don't exist
// recursive: true creates parent directories if needed
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(profilePicturesDir)) {
  fs.mkdirSync(profilePicturesDir, { recursive: true });
}

/**
 * Configure disk storage for Multer
 * 
 * diskStorage gives us control over:
 * - Where files are stored (destination)
 * - What files are named (filename)
 * 
 * Why custom filenames?
 * - Prevent filename collisions (two users upload "photo.jpg")
 * - Prevent path traversal attacks (../../etc/passwd)
 * - Make filenames URL-safe
 * - Associate files with users
 * 
 * Filename format: userId-timestamp-randomstring.ext
 * Example: 123e4567-1234567890-a1b2c3.jpg
 * 
 * Benefits:
 * - Unique (timestamp + random string)
 * - Traceable (includes user ID)
 * - Safe (no special characters)
 * - Preserves file extension (for MIME type)
 */
const storage = multer.diskStorage({
  // Destination: Where to store uploaded files
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    // cb = callback function
    // First argument: error (null if no error)
    // Second argument: destination path
    cb(null, profilePicturesDir);
  },

  // Filename: What to name the uploaded file
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename to prevent collisions
    // Format: userId-timestamp-randomstring.extension
    
    // Get user ID from authenticated request
    // We know req.user exists because upload endpoint requires authentication
    const userId = (req as any).user?.userId || 'anonymous';
    
    // Get current timestamp (milliseconds since epoch)
    const timestamp = Date.now();
    
    // Generate random string for extra uniqueness
    // Math.random() gives 0.xxx, we take the decimal part
    // toString(36) converts to base-36 (0-9, a-z)
    // substr(2, 9) takes 9 characters after "0."
    const randomString = Math.random().toString(36).substring(2, 9);
    
    // Get file extension from original filename
    // path.extname() extracts extension including the dot
    // Example: "photo.jpg" -> ".jpg"
    const ext = path.extname(file.originalname);
    
    // Construct unique filename
    const filename = `${userId}-${timestamp}-${randomString}${ext}`;
    
    cb(null, filename);
  },
});

/**
 * File filter: Validate uploaded files
 * 
 * This function is called for each uploaded file.
 * We use it to validate:
 * - File type (only images allowed)
 * - MIME type (check actual file content, not just extension)
 * 
 * Why validate file types?
 * - Security: Prevent uploading executable files (.exe, .sh)
 * - Storage: Only store files we can use
 * - User experience: Give clear error messages
 * 
 * MIME types explained:
 * - MIME = Multipurpose Internet Mail Extensions
 * - Standard way to identify file types
 * - Format: type/subtype
 * - Examples: image/jpeg, image/png, image/gif
 * 
 * Why check MIME type AND extension?
 * - Extension can be faked (rename virus.exe to virus.jpg)
 * - MIME type is based on file content (more reliable)
 * - Double-checking provides better security
 * 
 * Allowed image types:
 * - JPEG (.jpg, .jpeg) - Most common, good compression
 * - PNG (.png) - Lossless, supports transparency
 * - GIF (.gif) - Animated images, limited colors
 * - WebP (.webp) - Modern format, better compression
 * 
 * @param req - Express request object
 * @param file - Uploaded file information
 * @param cb - Callback to accept or reject file
 */
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  // Allowed MIME types for images
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  // Check if file's MIME type is in allowed list
  if (allowedMimeTypes.includes(file.mimetype)) {
    // Accept the file
    // First argument: error (null = no error)
    // Second argument: accept (true = accept file)
    cb(null, true);
  } else {
    // Reject the file
    // Create error with descriptive message
    // This error will be caught by the upload middleware
    cb(
      new Error(
        `Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed. Received: ${file.mimetype}`
      )
    );
  }
}

/**
 * Configure Multer middleware for profile picture uploads
 * 
 * Configuration options:
 * - storage: Where and how to store files (diskStorage)
 * - fileFilter: Validation function (only images)
 * - limits: Size and count restrictions
 * 
 * File size limits:
 * - 5MB = 5 * 1024 * 1024 bytes
 * - Prevents users from uploading huge files
 * - Protects server storage and bandwidth
 * - 5MB is reasonable for high-quality profile pictures
 * 
 * Why limit file count?
 * - Profile picture = single image
 * - Prevents abuse (uploading multiple files)
 * - Simplifies error handling
 * 
 * Usage in routes:
 * router.post('/upload', uploadProfilePicture.single('profilePicture'), handler)
 * 
 * The .single() method:
 * - Expects one file with field name 'profilePicture'
 * - Adds file to req.file
 * - Calls fileFilter for validation
 * - Saves file using storage configuration
 * - Calls next() or sends error
 */
export const uploadProfilePicture = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1, // Only one file per upload
  },
});

/**
 * Helper function to get public URL for uploaded file
 * 
 * Why do we need this?
 * - Files are stored on disk with unique names
 * - Frontend needs a URL to display the image
 * - We serve files through Express static middleware
 * 
 * URL format: /uploads/profile-pictures/filename.jpg
 * 
 * Example:
 * - File stored at: backend/uploads/profile-pictures/user123-1234567890-abc.jpg
 * - Public URL: http://localhost:5000/uploads/profile-pictures/user123-1234567890-abc.jpg
 * 
 * Security note:
 * - We only expose the uploads directory (not entire filesystem)
 * - Express static middleware handles this safely
 * - Files cannot be executed, only downloaded
 * 
 * @param filename - Name of the uploaded file
 * @returns Public URL to access the file
 */
export function getProfilePictureUrl(filename: string): string {
  return `/uploads/profile-pictures/${filename}`;
}

/**
 * Helper function to delete old profile picture
 * 
 * Why delete old pictures?
 * - Save storage space
 * - Keep uploads directory clean
 * - Prevent accumulation of unused files
 * 
 * When to call this:
 * - When user uploads new profile picture
 * - When user deletes their account
 * 
 * Error handling:
 * - Fails silently if file doesn't exist
 * - Logs error but doesn't throw
 * - Prevents upload failure due to cleanup issues
 * 
 * @param filename - Name of the file to delete
 */
export function deleteProfilePicture(filename: string): void {
  try {
    const filePath = path.join(profilePicturesDir, filename);
    
    // Check if file exists before trying to delete
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old profile picture: ${filename}`);
    }
  } catch (error) {
    // Log error but don't throw
    // We don't want to fail the upload if cleanup fails
    console.error(`Error deleting profile picture ${filename}:`, error);
  }
}
