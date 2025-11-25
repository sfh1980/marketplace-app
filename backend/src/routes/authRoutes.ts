/**
 * Authentication Routes
 * 
 * Defines all authentication-related API endpoints.
 * 
 * Why separate route files?
 * - Organization: Group related endpoints together
 * - Maintainability: Easy to find and modify routes
 * - Scalability: Can add middleware per route group
 * - Testing: Can test routes independently
 */

import { Router } from 'express';
import {
  register,
  verifyEmailAddress,
  resendVerification,
  login,
  requestPasswordReset,
  completePasswordReset,
} from '../controllers/authController';

// Create a new router instance
// This router will be mounted at /api/auth in the main app
const router = Router();

/**
 * POST /api/auth/register
 * 
 * Register a new user account
 * 
 * Public endpoint (no authentication required)
 * 
 * Request body:
 * - email: string (required)
 * - username: string (required)
 * - password: string (required)
 * - location: string (optional)
 */
router.post('/register', register);

/**
 * GET /api/auth/verify-email/:token
 * 
 * Verify user's email address using token from email
 * 
 * Public endpoint (no authentication required)
 * 
 * URL parameter:
 * - token: Verification token (64-character hex string)
 * 
 * This endpoint is called when user clicks the verification link in their email.
 * The frontend will extract the token from the URL and send it to this endpoint.
 */
router.get('/verify-email/:token', verifyEmailAddress);

/**
 * POST /api/auth/resend-verification
 * 
 * Resend verification email to user
 * 
 * Public endpoint (no authentication required)
 * 
 * Request body:
 * - email: string (required)
 * 
 * Use cases:
 * - Original email was lost or deleted
 * - Verification token expired
 * - Email went to spam folder
 * 
 * Security: Rate limit this endpoint to prevent abuse
 */
router.post('/resend-verification', resendVerification);

/**
 * POST /api/auth/login
 * 
 * Authenticate user and return JWT token
 * 
 * Public endpoint (no authentication required)
 * 
 * Request body:
 * - email: string (required)
 * - password: string (required)
 * 
 * Returns:
 * - token: JWT token for authenticated requests
 * - user: User information (id, email, username, etc.)
 * 
 * Security:
 * - Rate limited to prevent brute force attacks
 * - Requires email verification
 * - Uses bcrypt for password verification
 * - Returns JWT token for stateless authentication
 * 
 * How to use the token:
 * Include it in the Authorization header for protected endpoints:
 * Authorization: Bearer <token>
 */
router.post('/login', login);

/**
 * POST /api/auth/reset-password
 * 
 * Request password reset email
 * 
 * Public endpoint (no authentication required)
 * 
 * Request body:
 * - email: string (required)
 * 
 * Returns:
 * - Generic success message (doesn't reveal if email exists)
 * 
 * Security:
 * - Rate limited to prevent abuse
 * - Only sends email to verified accounts
 * - Token expires after 1 hour
 * - Generic response prevents email enumeration
 * 
 * Use cases:
 * - User forgot their password
 * - User wants to change password for security reasons
 * 
 * Flow:
 * 1. User enters their email
 * 2. System generates secure reset token
 * 3. Email sent with reset link (if account exists and is verified)
 * 4. User clicks link and enters new password
 */
router.post('/reset-password', requestPasswordReset);

/**
 * POST /api/auth/reset-password/:token
 * 
 * Complete password reset with new password
 * 
 * Public endpoint (no authentication required)
 * 
 * URL parameter:
 * - token: Password reset token from email (64-character hex string)
 * 
 * Request body:
 * - password: string (required, must meet strength requirements)
 * 
 * Returns:
 * - Success message if password reset successful
 * 
 * Security:
 * - Token must be valid and not expired (1 hour expiration)
 * - Token is single-use (cleared after successful reset)
 * - Password must meet strength requirements
 * - New password is hashed before storage
 * 
 * Password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * Error cases:
 * - Invalid or expired token
 * - Weak password
 * - Missing required fields
 */
router.post('/reset-password/:token', completePasswordReset);

/**
 * Future authentication routes will be added here:
 * 
 * POST /api/auth/logout
 * - End user session (invalidate token)
 */

export default router;
