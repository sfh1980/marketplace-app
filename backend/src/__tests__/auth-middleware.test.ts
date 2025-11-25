/**
 * Authentication Middleware Tests
 * 
 * These tests verify that the authentication middleware correctly:
 * 1. Accepts valid JWT tokens
 * 2. Rejects missing tokens
 * 3. Rejects invalid tokens
 * 4. Rejects expired tokens
 * 5. Attaches user information to request
 * 
 * Testing middleware is important because:
 * - Middleware is the gatekeeper for protected routes
 * - Security bugs in middleware affect all protected endpoints
 * - Middleware behavior should be consistent and predictable
 */

import { Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { registerUser } from '../services/authService';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Mock response object for testing
// We need to mock res.status() and res.json() to test middleware
function createMockResponse(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

// Mock next function for testing
// Middleware calls next() to continue to route handler
function createMockNext(): jest.Mock {
  return jest.fn();
}

describe('Authentication Middleware', () => {
  // Clean up database before each test
  beforeEach(async () => {
    await prisma.user.deleteMany({});
  });

  // Close database connection after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('authenticate middleware', () => {
    it('should reject requests without Authorization header', () => {
      // Arrange: Create mock request without Authorization header
      const req = {
        headers: {},
      } as Request;
      const res = createMockResponse();
      const next = createMockNext();

      // Act: Call middleware
      authenticate(req as AuthenticatedRequest, res, next);

      // Assert: Should return 401 error
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'NO_TOKEN',
          message: 'Authentication required. Please provide a valid token.',
        },
      });
      // Should NOT call next() - request should stop here
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token format', () => {
      // Arrange: Create mock request with invalid format (missing "Bearer ")
      const req = {
        headers: {
          authorization: 'InvalidFormat token123',
        },
      } as Request;
      const res = createMockResponse();
      const next = createMockNext();

      // Act: Call middleware
      authenticate(req as AuthenticatedRequest, res, next);

      // Assert: Should return 401 error
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Invalid token format. Expected: Bearer <token>',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid JWT token', () => {
      // Arrange: Create mock request with invalid token
      const req = {
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
      } as Request;
      const res = createMockResponse();
      const next = createMockNext();

      // Act: Call middleware
      authenticate(req as AuthenticatedRequest, res, next);

      // Assert: Should return 401 error
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token.',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired JWT tokens', () => {
      // Arrange: Create an expired token
      const secret = process.env.JWT_SECRET || 'test-secret';
      const expiredToken = jwt.sign(
        {
          userId: 'test-user-id',
          email: 'test@example.com',
          username: 'testuser',
        },
        secret,
        {
          expiresIn: '-1h', // Expired 1 hour ago
          issuer: 'marketplace-platform',
          audience: 'marketplace-users',
        }
      );

      const req = {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      } as Request;
      const res = createMockResponse();
      const next = createMockNext();

      // Act: Call middleware
      authenticate(req as AuthenticatedRequest, res, next);

      // Assert: Should return 401 error for expired token
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please log in again.',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept valid JWT token and attach user to request', () => {
      // Arrange: Create a valid token
      const secret = process.env.JWT_SECRET || 'test-secret';
      const validToken = jwt.sign(
        {
          userId: 'test-user-id',
          email: 'test@example.com',
          username: 'testuser',
        },
        secret,
        {
          expiresIn: '15m',
          issuer: 'marketplace-platform',
          audience: 'marketplace-users',
        }
      );

      const req = {
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      // Act: Call middleware
      authenticate(req, res, next);

      // Assert: Should attach user to request and call next()
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe('test-user-id');
      expect(req.user?.email).toBe('test@example.com');
      expect(req.user?.username).toBe('testuser');
      expect(next).toHaveBeenCalled();
      // Should NOT send error response
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should work with real user token from login', async () => {
      // Arrange: Create a real user and get their token
      const userData = {
        email: 'middleware-test@example.com',
        username: 'middlewaretest',
        password: 'SecurePass123!',
      };

      // Register user
      const result = await registerUser(userData);

      // Verify email (required for login)
      await prisma.user.update({
        where: { id: result.id },
        data: { emailVerified: true },
      });

      // Generate token (simulating login)
      const secret = process.env.JWT_SECRET || 'test-secret';
      const token = jwt.sign(
        {
          userId: result.id,
          email: result.email,
          username: result.username,
        },
        secret,
        {
          expiresIn: '15m',
          issuer: 'marketplace-platform',
          audience: 'marketplace-users',
        }
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      // Act: Call middleware
      authenticate(req, res, next);

      // Assert: Should work with real user data
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(result.id);
      expect(req.user?.email).toBe(userData.email);
      expect(req.user?.username).toBe(userData.username);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Token expiration handling', () => {
    it('should handle token expiration gracefully', (done) => {
      // This test verifies that expired tokens are properly rejected
      // and users are prompted to log in again
      
      const secret = process.env.JWT_SECRET || 'test-secret';
      const expiredToken = jwt.sign(
        {
          userId: 'test-user',
          email: 'test@example.com',
          username: 'testuser',
        },
        secret,
        {
          expiresIn: '-1s', // Already expired (1 second ago)
          issuer: 'marketplace-platform',
          audience: 'marketplace-users',
        }
      );

      const req = {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      } as Request;
      const res = createMockResponse();
      const next = createMockNext();

      // Call middleware immediately - token is already expired
      authenticate(req as AuthenticatedRequest, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please log in again.',
        },
      });
      done();
    });
  });
});

/**
 * What these tests validate:
 * 
 * 1. Security: Unauthorized requests are rejected
 * 2. Format validation: Token format is checked
 * 3. Token verification: Invalid tokens are rejected
 * 4. Expiration: Expired tokens are rejected
 * 5. Success case: Valid tokens work correctly
 * 6. User attachment: User info is attached to request
 * 7. Integration: Works with real user data
 * 
 * Why these tests matter:
 * - Authentication is critical for security
 * - Bugs in middleware affect all protected routes
 * - Tests document expected behavior
 * - Tests catch regressions when code changes
 */
