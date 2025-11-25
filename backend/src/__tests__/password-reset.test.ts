/**
 * Password Reset Tests
 * 
 * Tests the password reset flow:
 * 1. Request password reset
 * 2. Complete password reset with token
 * 
 * These tests verify:
 * - Token generation and storage
 * - Token expiration
 * - Password update
 * - Token clearing after use
 */

import request from 'supertest';
import app from '../index';
import prisma from '../utils/prisma';
import { hashPassword } from '../services/authService';

describe('Password Reset Flow', () => {
  // Test user data
  const testUser = {
    email: 'resettest@example.com',
    username: 'resetuser',
    password: 'Test123!@#',
  };

  // Clean up before and after tests
  beforeAll(async () => {
    // Delete test user if exists
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/reset-password', () => {
    it('should return success message for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If an account exists');
    });

    it('should return error if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_EMAIL');
    });

    it('should generate reset token for verified user', async () => {
      // Create verified user
      const passwordHash = await hashPassword(testUser.password);
      await prisma.user.create({
        data: {
          email: testUser.email,
          username: testUser.username,
          passwordHash,
          emailVerified: true,
        },
      });

      // Request password reset
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: testUser.email });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If an account exists');

      // Verify token was stored in database
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: {
          passwordResetToken: true,
          passwordResetExpires: true,
        },
      });

      expect(user?.passwordResetToken).toBeTruthy();
      expect(user?.passwordResetExpires).toBeTruthy();
      expect(user?.passwordResetExpires).toBeInstanceOf(Date);
      
      // Token should expire in approximately 1 hour
      const expiresIn = user?.passwordResetExpires
        ? user.passwordResetExpires.getTime() - Date.now()
        : 0;
      expect(expiresIn).toBeGreaterThan(55 * 60 * 1000); // At least 55 minutes
      expect(expiresIn).toBeLessThan(65 * 60 * 1000); // At most 65 minutes
    });

    it('should not generate token for unverified user', async () => {
      // Create unverified user
      const unverifiedEmail = 'unverified@example.com';
      const passwordHash = await hashPassword(testUser.password);
      await prisma.user.create({
        data: {
          email: unverifiedEmail,
          username: 'unverifieduser',
          passwordHash,
          emailVerified: false,
        },
      });

      // Request password reset
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: unverifiedEmail });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If an account exists');

      // Verify token was NOT stored
      const user = await prisma.user.findUnique({
        where: { email: unverifiedEmail },
        select: {
          passwordResetToken: true,
          passwordResetExpires: true,
        },
      });

      expect(user?.passwordResetToken).toBeNull();
      expect(user?.passwordResetExpires).toBeNull();

      // Clean up
      await prisma.user.delete({ where: { email: unverifiedEmail } });
    });
  });

  describe('POST /api/auth/reset-password/:token', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Get the reset token from the database
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: { passwordResetToken: true },
      });
      resetToken = user?.passwordResetToken || '';
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewPass123!@#';

      const response = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: newPassword });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Password reset successful');

      // Verify token was cleared
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: {
          passwordResetToken: true,
          passwordResetExpires: true,
          passwordHash: true,
        },
      });

      expect(user?.passwordResetToken).toBeNull();
      expect(user?.passwordResetExpires).toBeNull();
      expect(user?.passwordHash).toBeTruthy();

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBeTruthy();
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password/invalid-token-123')
        .send({ password: 'NewPass123!@#' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject missing password', async () => {
      // Generate new token first
      await request(app)
        .post('/api/auth/reset-password')
        .send({ email: testUser.email });

      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: { passwordResetToken: true },
      });
      const token = user?.passwordResetToken || '';

      const response = await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_PASSWORD');
    });

    it('should reject weak password', async () => {
      // Generate new token first
      await request(app)
        .post('/api/auth/reset-password')
        .send({ email: testUser.email });

      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: { passwordResetToken: true },
      });
      const token = user?.passwordResetToken || '';

      const response = await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ password: 'weak' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('WEAK_PASSWORD');
    });

    it('should reject expired token', async () => {
      // Create user with expired token
      const expiredEmail = 'expired@example.com';
      const passwordHash = await hashPassword(testUser.password);
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 2); // 2 hours ago

      await prisma.user.create({
        data: {
          email: expiredEmail,
          username: 'expireduser',
          passwordHash,
          emailVerified: true,
          passwordResetToken: 'expired-token-123',
          passwordResetExpires: expiredDate,
        },
      });

      const response = await request(app)
        .post('/api/auth/reset-password/expired-token-123')
        .send({ password: 'NewPass123!@#' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toContain('expired');

      // Clean up
      await prisma.user.delete({ where: { email: expiredEmail } });
    });

    it('should prevent token reuse', async () => {
      // Generate new token and reset password
      await request(app)
        .post('/api/auth/reset-password')
        .send({ email: testUser.email });

      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: { passwordResetToken: true },
      });
      const token = user?.passwordResetToken || '';

      // First reset should succeed
      const firstResponse = await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ password: 'FirstPass123!@#' });

      expect(firstResponse.status).toBe(200);

      // Second reset with same token should fail
      const secondResponse = await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ password: 'SecondPass123!@#' });

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.error.code).toBe('INVALID_TOKEN');
    });
  });
});
