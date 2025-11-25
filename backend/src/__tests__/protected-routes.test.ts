/**
 * Protected Routes Integration Tests
 * 
 * These tests verify that authentication middleware works correctly
 * with actual HTTP requests to protected endpoints.
 * 
 * This demonstrates:
 * 1. How to protect routes with middleware
 * 2. How clients should send authentication tokens
 * 3. What happens when authentication fails
 * 4. How authenticated requests work end-to-end
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../index';
import { registerUser } from '../services/authService';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Protected Routes Integration', () => {
  let authToken: string;
  let userId: string;

  // Set up test user before tests
  beforeAll(async () => {
    // Clean database
    await prisma.user.deleteMany({});

    // Create test user
    const userData = {
      email: 'protected-test@example.com',
      username: 'protectedtest',
      password: 'SecurePass123!',
    };

    const result = await registerUser(userData);
    userId = result.id;

    // Verify email (required for login)
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    // Generate auth token
    const secret = process.env.JWT_SECRET || 'test-secret';
    authToken = jwt.sign(
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
  });

  // Clean up after tests
  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /api/users/profile', () => {
    it('should reject requests without authentication token', async () => {
      // Act: Make request without Authorization header
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      // Assert: Should return authentication error
      expect(response.body).toEqual({
        error: {
          code: 'NO_TOKEN',
          message: 'Authentication required. Please provide a valid token.',
        },
      });
    });

    it('should reject requests with invalid token format', async () => {
      // Act: Make request with invalid token format
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      // Assert: Should return format error
      expect(response.body).toEqual({
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Invalid token format. Expected: Bearer <token>',
        },
      });
    });

    it('should reject requests with invalid token', async () => {
      // Act: Make request with invalid token
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      // Assert: Should return invalid token error
      expect(response.body).toEqual({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token.',
        },
      });
    });

    it('should accept requests with valid authentication token', async () => {
      // Act: Make request with valid token
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert: Should return user profile
      expect(response.body).toEqual({
        message: 'Profile retrieved successfully',
        user: {
          userId: userId,
          email: 'protected-test@example.com',
          username: 'protectedtest',
        },
      });
    });

    it('should work with token from actual login', async () => {
      // Arrange: Login to get real token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'protected-test@example.com',
          password: 'SecurePass123!',
        })
        .expect(200);

      const loginToken = loginResponse.body.token;

      // Act: Use login token to access protected route
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      // Assert: Should work with real login token
      expect(response.body.user.email).toBe('protected-test@example.com');
      expect(response.body.user.username).toBe('protectedtest');
    });
  });

  describe('GET /api/users/me', () => {
    it('should require authentication', async () => {
      // Act: Make request without token
      await request(app)
        .get('/api/users/me')
        .expect(401);
    });

    it('should return user info when authenticated', async () => {
      // Act: Make request with valid token
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert: Should return user info
      expect(response.body).toEqual({
        userId: userId,
        email: 'protected-test@example.com',
        username: 'protectedtest',
      });
    });
  });

  describe('Token expiration', () => {
    it('should reject expired tokens', async () => {
      // Arrange: Create expired token
      const secret = process.env.JWT_SECRET || 'test-secret';
      const expiredToken = jwt.sign(
        {
          userId: 'test-user',
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

      // Act: Make request with expired token
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // Assert: Should return expiration error
      expect(response.body).toEqual({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please log in again.',
        },
      });
    });
  });
});

/**
 * What these integration tests demonstrate:
 * 
 * 1. End-to-end authentication flow
 * 2. How to send tokens in HTTP requests
 * 3. Different authentication failure scenarios
 * 4. How middleware protects routes
 * 5. Integration with real login flow
 * 
 * Why integration tests matter:
 * - Test the full request-response cycle
 * - Verify middleware works with Express
 * - Catch issues that unit tests might miss
 * - Document how to use the API
 * - Provide examples for frontend developers
 */
