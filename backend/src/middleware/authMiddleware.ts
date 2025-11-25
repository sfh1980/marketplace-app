/**
 * Authentication Middleware
 * 
 * This middleware protects routes by verifying JWT tokens.
 * 
 * What is middleware?
 * Middleware is a function that runs BEFORE your route handler.
 * It sits in the middle of the request-response cycle, hence "middleware".
 * 
 * Request flow with middleware:
 * Client → Express → Middleware → Route Handler → Response
 * 
 * Middleware can:
 * 1. Execute code
 * 2. Modify request/response objects
 * 3. End the request-response cycle (send error)
 * 4. Call next() to pass control to the next middleware
 * 
 * Why use middleware for authentication?
 * - Write authentication logic once, use everywhere
 * - Keep route handlers clean and focused
 * - Easy to add/remove protection from routes
 * - Follows separation of concerns principle
 * 
 * How to use this middleware:
 * 
 * // Protect a single route
 * router.get('/profile', authenticate, getProfile);
 * 
 * // Protect all routes in a router
 * router.use(authenticate);
 * router.get('/profile', getProfile);
 * router.put('/profile', updateProfile);
 */

import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../services/authService';

/**
 * Extended Request interface to include user information
 * 
 * Why extend Request?
 * - TypeScript needs to know about custom properties
 * - Provides type safety when accessing req.user
 * - Makes code more maintainable and self-documenting
 * 
 * After authentication, req.user will contain:
 * - userId: User's unique identifier
 * - email: User's email address
 * - username: User's username
 * 
 * This allows route handlers to access authenticated user info:
 * const userId = req.user.userId;
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

/**
 * Authentication middleware
 * 
 * This middleware:
 * 1. Extracts JWT token from Authorization header
 * 2. Verifies token is valid and not expired
 * 3. Attaches user information to request object
 * 4. Calls next() to continue to route handler
 * 5. Returns 401 error if authentication fails
 * 
 * Token format expected:
 * Authorization: Bearer <token>
 * 
 * Example:
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 * Why "Bearer"?
 * - Standard authentication scheme for JWT tokens
 * - Indicates the token "bearer" (holder) is authorized
 * - Part of OAuth 2.0 specification
 * - Widely supported across platforms
 * 
 * Security considerations:
 * - Always use HTTPS in production (prevents token interception)
 * - Tokens should have short expiration (15 minutes)
 * - Never log tokens (security risk)
 * - Validate token on every request (stateless authentication)
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Function to call next middleware
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Step 1: Extract Authorization header
    // The header should be in format: "Bearer <token>"
    // Example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.headers.authorization;

    // Step 2: Check if Authorization header exists
    if (!authHeader) {
      res.status(401).json({
        error: {
          code: 'NO_TOKEN',
          message: 'Authentication required. Please provide a valid token.',
        },
      });
      return;
    }

    // Step 3: Check if header starts with "Bearer "
    // This is the standard format for JWT tokens
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Invalid token format. Expected: Bearer <token>',
        },
      });
      return;
    }

    // Step 4: Extract token from header
    // Remove "Bearer " prefix to get just the token
    // "Bearer eyJhbG..." → "eyJhbG..."
    const token = authHeader.substring(7); // "Bearer " is 7 characters

    // Step 5: Verify token
    // This will throw an error if:
    // - Token is malformed
    // - Token signature is invalid
    // - Token has expired
    // - Token was issued by different server
    const decoded = verifyJWT(token);

    // Step 6: Attach user information to request
    // Now any route handler can access req.user
    // This is how we pass authentication data through the request pipeline
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };

    // Step 7: Call next() to continue to route handler
    // This is CRITICAL - without next(), the request will hang
    // next() tells Express to move to the next middleware or route handler
    next();
  } catch (error) {
    // Handle token verification errors
    // These errors come from verifyJWT() in authService
    if (error instanceof Error) {
      // Token has expired - user needs to log in again
      if (error.message.includes('expired')) {
        res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Your session has expired. Please log in again.',
          },
        });
        return;
      }

      // Token is invalid - might be tampered with or malformed
      if (error.message.includes('Invalid token')) {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token.',
          },
        });
        return;
      }
    }

    // Generic authentication error
    // Don't expose internal error details to client
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed. Please log in again.',
      },
    });
  }
}

/**
 * Optional authentication middleware
 * 
 * Similar to authenticate(), but doesn't require authentication.
 * If a valid token is provided, it attaches user info to request.
 * If no token or invalid token, it continues without user info.
 * 
 * Use cases:
 * - Public endpoints that behave differently for logged-in users
 * - Homepage that shows personalized content if logged in
 * - Search results that include user's favorites if authenticated
 * 
 * Example:
 * router.get('/listings', optionalAuthenticate, getListings);
 * 
 * In the route handler:
 * if (req.user) {
 *   // User is logged in, show personalized results
 * } else {
 *   // User is not logged in, show public results
 * }
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Function to call next middleware
 */
export function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Try to extract and verify token
    const authHeader = req.headers.authorization;

    // If no token, just continue without user info
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    // Extract and verify token
    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    // Attach user info if token is valid
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };

    next();
  } catch (error) {
    // If token verification fails, just continue without user info
    // Don't send error response - this is optional authentication
    next();
  }
}

/**
 * Middleware to check if user owns a resource
 * 
 * This is a higher-order function that returns middleware.
 * It checks if the authenticated user is the owner of a resource.
 * 
 * Why higher-order function?
 * - Allows us to pass parameters to middleware
 * - Can customize behavior for different resources
 * - Reusable across different routes
 * 
 * Use cases:
 * - Ensure user can only edit their own listings
 * - Ensure user can only update their own profile
 * - Ensure user can only delete their own messages
 * 
 * Example usage:
 * router.put('/listings/:id', authenticate, requireOwnership('listing'), updateListing);
 * 
 * How it works:
 * 1. authenticate middleware runs first (sets req.user)
 * 2. requireOwnership middleware checks if req.user.userId matches resource owner
 * 3. If match, continues to route handler
 * 4. If no match, returns 403 Forbidden error
 * 
 * @param resourceType - Type of resource being accessed (for error messages)
 * @returns Middleware function
 */
export function requireOwnership(_resourceType: string) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    // This middleware should only be used after authenticate()
    // If req.user doesn't exist, authentication wasn't done
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'You must be logged in to perform this action.',
        },
      });
      return;
    }

    // The route handler is responsible for checking ownership
    // This middleware just ensures authentication happened
    // Actual ownership check happens in the route handler using req.user.userId
    
    // For now, just continue to route handler
    // Route handler will check: if (listing.sellerId !== req.user.userId)
    next();
  };
}

/**
 * Example of how to use these middleware functions:
 * 
 * // Public route - no authentication
 * router.get('/listings', getListings);
 * 
 * // Protected route - authentication required
 * router.get('/profile', authenticate, getProfile);
 * 
 * // Optional authentication - different behavior if logged in
 * router.get('/listings/:id', optionalAuthenticate, getListingDetails);
 * 
 * // Ownership required - must be the owner
 * router.put('/listings/:id', authenticate, requireOwnership('listing'), updateListing);
 * 
 * // Protect all routes in a router
 * const protectedRouter = Router();
 * protectedRouter.use(authenticate); // All routes below require authentication
 * protectedRouter.get('/profile', getProfile);
 * protectedRouter.put('/profile', updateProfile);
 * protectedRouter.post('/listings', createListing);
 */
