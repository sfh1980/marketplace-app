/**
 * User Routes
 * 
 * Defines user-related API endpoints.
 * These routes demonstrate how to use authentication middleware.
 */

import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { Response } from 'express';

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

export default router;
