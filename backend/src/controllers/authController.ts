/**
 * Authentication Controller
 * 
 * Handles HTTP requests for authentication endpoints.
 * 
 * Controller responsibilities:
 * - Parse and validate HTTP requests
 * - Call service layer for business logic
 * - Format and send HTTP responses
 * - Handle errors and return appropriate status codes
 * 
 * Controllers should be thin - most logic belongs in services.
 */

import { Request, Response } from 'express';
import {
  registerUser,
  emailExists,
  usernameExists,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  requestPasswordReset as requestPasswordResetService,
  resetPassword as resetPasswordService,
} from '../services/authService';
import { validateRegistrationData } from '../utils/validation';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/emailService';

/**
 * Register a new user
 * 
 * POST /api/auth/register
 * 
 * Request body:
 * {
 *   email: string,
 *   username: string,
 *   password: string,
 *   location?: string
 * }
 * 
 * Success response (201 Created):
 * {
 *   message: string,
 *   user: {
 *     id: string,
 *     email: string,
 *     username: string,
 *     emailVerified: boolean,
 *     location: string | null,
 *     joinDate: Date
 *   }
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid input data
 * - 409 Conflict: Email or username already exists
 * - 500 Internal Server Error: Unexpected error
 * 
 * Flow:
 * 1. Validate input data
 * 2. Check if email/username already exists
 * 3. Call service to create user
 * 4. Send verification email (TODO: implement email service)
 * 5. Return success response
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Extract data from request body
    const { email, username, password, location } = req.body;

    // Step 1: Validate input data
    // This catches format errors before we hit the database
    const validation = validateRegistrationData(email, username, password);
    if (!validation.isValid) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration data',
          details: validation.errors,
        },
      });
      return;
    }

    // Step 2: Check if email already exists
    // We do this explicitly to provide a better error message
    // (Prisma would throw a generic unique constraint error)
    const emailTaken = await emailExists(email);
    if (emailTaken) {
      res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists',
        },
      });
      return;
    }

    // Step 3: Check if username already exists
    const usernameTaken = await usernameExists(username);
    if (usernameTaken) {
      res.status(409).json({
        error: {
          code: 'USERNAME_EXISTS',
          message: 'This username is already taken',
        },
      });
      return;
    }

    // Step 4: Create user
    // Service layer handles password hashing and token generation
    const result = await registerUser({
      email,
      username,
      password,
      location,
    });

    // Step 5: Send verification email
    // This happens asynchronously - we don't wait for it to complete
    // If email fails, user can request a new verification email later
    try {
      await sendVerificationEmail(
        result.email,
        result.username,
        result.verificationToken
      );
    } catch (emailError) {
      // Log error but don't fail registration
      // User can resend verification email later
      console.error('Failed to send verification email:', emailError);
    }

    // Step 6: Return success response
    // Note: We don't return the verification token in the response
    // It should only be sent via email for security
    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: result.id,
        email: result.email,
        username: result.username,
        emailVerified: result.emailVerified,
        location: result.location,
        joinDate: result.joinDate,
      },
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    console.error('Registration error:', error);

    // Return generic error to client (don't expose internal details)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during registration',
      },
    });
  }
}

/**
 * Verify user's email address
 * 
 * GET /api/auth/verify-email/:token
 * 
 * URL parameter:
 * - token: Verification token from email link
 * 
 * Success response (200 OK):
 * {
 *   message: string
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid or expired token
 * - 500 Internal Server Error: Unexpected error
 * 
 * Flow:
 * 1. Extract token from URL parameter
 * 2. Call service to verify token
 * 3. Return success or error response
 * 
 * Security notes:
 * - Tokens are single-use (cleared after verification)
 * - Tokens expire after 24 hours
 * - Already verified emails can't be re-verified
 */
export async function verifyEmailAddress(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Extract token from URL parameter
    const { token } = req.params;

    // Validate token exists
    if (!token) {
      res.status(400).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Verification token is required',
        },
      });
      return;
    }

    // Verify the email
    await verifyEmail(token);

    // Return success response
    res.status(200).json({
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      // Known error messages from service
      if (
        error.message.includes('Invalid or expired') ||
        error.message.includes('already verified') ||
        error.message.includes('expired')
      ) {
        res.status(400).json({
          error: {
            code: 'VERIFICATION_FAILED',
            message: error.message,
          },
        });
        return;
      }
    }

    // Log unexpected errors
    console.error('Email verification error:', error);

    // Return generic error
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during email verification',
      },
    });
  }
}

/**
 * Resend verification email
 * 
 * POST /api/auth/resend-verification
 * 
 * Request body:
 * {
 *   email: string
 * }
 * 
 * Success response (200 OK):
 * {
 *   message: string
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid email or already verified
 * - 404 Not Found: Email not found
 * - 500 Internal Server Error: Unexpected error
 * 
 * Security considerations:
 * - Rate limit this endpoint (prevent spam)
 * - Only works for unverified accounts
 * - Generates new token each time
 * 
 * Use cases:
 * - Original email was lost
 * - Token expired
 * - Email went to spam folder
 */
export async function resendVerification(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Extract email from request body
    const { email } = req.body;

    // Validate email exists
    if (!email) {
      res.status(400).json({
        error: {
          code: 'MISSING_EMAIL',
          message: 'Email address is required',
        },
      });
      return;
    }

    // Generate new verification token
    const verificationToken = await resendVerificationEmail(email);

    // Send new verification email
    try {
      await sendVerificationEmail(email, '', verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue anyway - token is stored in database
    }

    // Return success response
    // Don't reveal if email exists or not (security)
    res.status(200).json({
      message: 'If an unverified account exists with this email, a new verification email has been sent.',
    });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('already verified')) {
        res.status(400).json({
          error: {
            code: 'ALREADY_VERIFIED',
            message: 'This email address is already verified',
          },
        });
        return;
      }

      if (error.message.includes('No account found')) {
        // Don't reveal if account exists (security)
        res.status(200).json({
          message: 'If an unverified account exists with this email, a new verification email has been sent.',
        });
        return;
      }
    }

    // Log unexpected errors
    console.error('Resend verification error:', error);

    // Return generic error
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}

/**
 * Login user
 * 
 * POST /api/auth/login
 * 
 * Request body:
 * {
 *   email: string,
 *   password: string
 * }
 * 
 * Success response (200 OK):
 * {
 *   message: string,
 *   token: string,
 *   user: {
 *     id: string,
 *     email: string,
 *     username: string,
 *     emailVerified: boolean,
 *     location: string | null
 *   }
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Missing email or password
 * - 401 Unauthorized: Invalid credentials or email not verified
 * - 429 Too Many Requests: Rate limit exceeded
 * - 500 Internal Server Error: Unexpected error
 * 
 * Security features:
 * - Rate limiting (handled by middleware)
 * - Generic error messages (don't reveal if email exists)
 * - Email verification required
 * - Password verification using bcrypt
 * - JWT token generation for stateless authentication
 * 
 * Flow:
 * 1. Validate input data (email and password present)
 * 2. Call service to verify credentials
 * 3. Generate JWT token
 * 4. Return token and user information
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Extract credentials from request body
    const { email, password } = req.body;

    // Step 1: Validate input
    if (!email || !password) {
      res.status(400).json({
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required',
        },
      });
      return;
    }

    // Step 2: Attempt login
    // Service layer handles:
    // - Finding user by email
    // - Verifying password
    // - Checking email verification status
    // - Generating JWT token
    const result = await loginUser(email, password);

    // Step 3: Return success response with token
    // The client should store this token (usually in localStorage or httpOnly cookie)
    // and include it in the Authorization header for subsequent requests
    res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      // Invalid credentials or email not verified
      if (
        error.message.includes('Invalid email or password') ||
        error.message.includes('verify your email')
      ) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: error.message,
          },
        });
        return;
      }

      // JWT secret not configured
      if (error.message.includes('JWT_SECRET')) {
        console.error('JWT_SECRET environment variable not set');
        res.status(500).json({
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'Server configuration error',
          },
        });
        return;
      }
    }

    // Log unexpected errors
    console.error('Login error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during login',
      },
    });
  }
}

/**
 * Request password reset
 * 
 * POST /api/auth/reset-password
 * 
 * Request body:
 * {
 *   email: string
 * }
 * 
 * Success response (200 OK):
 * {
 *   message: string
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Missing email
 * - 500 Internal Server Error: Unexpected error
 * 
 * Security considerations:
 * - Always returns success message (doesn't reveal if email exists)
 * - Rate limit this endpoint to prevent abuse
 * - Only sends email to verified accounts
 * - Token expires after 1 hour
 * 
 * Flow:
 * 1. Validate email is provided
 * 2. Call service to generate reset token
 * 3. Send reset email (if account exists and is verified)
 * 4. Return generic success message
 * 
 * Why generic message?
 * - Prevents email enumeration attacks
 * - Attackers can't discover which emails have accounts
 * - User experience is the same regardless
 */
export async function requestPasswordReset(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Extract email from request body
    const { email } = req.body;

    // Step 1: Validate email is provided
    if (!email) {
      res.status(400).json({
        error: {
          code: 'MISSING_EMAIL',
          message: 'Email address is required',
        },
      });
      return;
    }

    // Step 2: Request password reset
    // Service returns token if user exists and is verified, null otherwise
    const resetToken = await requestPasswordResetService(email);

    // Step 3: Send reset email if token was generated
    if (resetToken) {
      try {
        await sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        // Log error but don't fail the request
        // Token is stored in database, user can try again
        console.error('Failed to send password reset email:', emailError);
      }
    }

    // Step 4: Return generic success message
    // We always return the same message regardless of whether:
    // - Email exists or not
    // - Account is verified or not
    // - Email was sent successfully or not
    // This prevents attackers from discovering valid email addresses
    res.status(200).json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    // Log unexpected errors
    console.error('Password reset request error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}

/**
 * Complete password reset
 * 
 * POST /api/auth/reset-password/:token
 * 
 * URL parameter:
 * - token: Password reset token from email
 * 
 * Request body:
 * {
 *   password: string
 * }
 * 
 * Success response (200 OK):
 * {
 *   message: string
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Missing token or password, invalid token, or weak password
 * - 500 Internal Server Error: Unexpected error
 * 
 * Security considerations:
 * - Token must be valid and not expired
 * - Token is single-use (cleared after successful reset)
 * - Password must meet strength requirements
 * - New password is hashed before storage
 * 
 * Flow:
 * 1. Extract token from URL and password from body
 * 2. Validate password meets requirements
 * 3. Call service to reset password
 * 4. Return success message
 * 
 * Password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export async function completePasswordReset(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Extract token from URL parameter
    const { token } = req.params;

    // Extract new password from request body
    const { password } = req.body;

    // Step 1: Validate token exists
    if (!token) {
      res.status(400).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Password reset token is required',
        },
      });
      return;
    }

    // Step 2: Validate password exists
    if (!password) {
      res.status(400).json({
        error: {
          code: 'MISSING_PASSWORD',
          message: 'New password is required',
        },
      });
      return;
    }

    // Step 3: Validate password strength
    // Use the password validation function directly
    const { validatePassword } = require('../utils/validation');
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password does not meet requirements',
          details: passwordValidation.error,
        },
      });
      return;
    }

    // Step 4: Reset password
    // Service will validate token and update password
    await resetPasswordService(token, password);

    // Step 5: Return success message
    res.status(200).json({
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      // Token validation errors
      if (
        error.message.includes('Invalid or expired') ||
        error.message.includes('expired')
      ) {
        res.status(400).json({
          error: {
            code: 'INVALID_TOKEN',
            message: error.message,
          },
        });
        return;
      }
    }

    // Log unexpected errors
    console.error('Password reset completion error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during password reset',
      },
    });
  }
}

/**
 * Additional authentication endpoints will be added here:
 * - logout
 */
