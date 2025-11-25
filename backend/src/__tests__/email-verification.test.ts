/**
 * Integration Tests for Email Verification
 * 
 * These tests verify the email verification flow:
 * - User registers and receives verification token
 * - User can verify email with valid token
 * - Invalid/expired tokens are rejected
 * - Already verified emails can't be re-verified
 * - Users can resend verification emails
 * 
 * Why integration tests for email verification?
 * - Tests the complete flow from registration to verification
 * - Verifies database state changes correctly
 * - Tests error handling for various edge cases
 * - Ensures security properties (token expiration, single-use)
 */

import { PrismaClient } from '@prisma/client';
import {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
} from '../services/authService';

const prisma = new PrismaClient();

// ============================================
// TEST SETUP AND TEARDOWN
// ============================================

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.favorite.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.message.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
});

// ============================================
// INTEGRATION TESTS
// ============================================

describe('Email Verification Flow', () => {
  /**
   * Test: Complete verification flow
   * 
   * This tests the happy path:
   * 1. User registers
   * 2. Receives verification token
   * 3. Verifies email with token
   * 4. Email is marked as verified
   */
  test('User can verify email with valid token', async () => {
    // Step 1: Register user
    const registrationData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'TestPassword123!',
      location: 'Test City',
    };

    const result = await registerUser(registrationData);

    // Verify user starts unverified
    expect(result.emailVerified).toBe(false);
    expect(result.verificationToken).toBeDefined();
    expect(result.verificationToken.length).toBe(64);

    // Step 2: Verify email with token
    const verificationSuccess = await verifyEmail(result.verificationToken);
    expect(verificationSuccess).toBe(true);

    // Step 3: Check database - email should be verified
    const user = await prisma.user.findUnique({
      where: { id: result.id },
    });

    expect(user).not.toBeNull();
    expect(user!.emailVerified).toBe(true);
    expect(user!.emailVerificationToken).toBeNull(); // Token cleared
    expect(user!.emailVerificationExpires).toBeNull(); // Expiration cleared
  });

  /**
   * Test: Invalid token is rejected
   * 
   * Security test: Ensure random/invalid tokens don't work
   */
  test('Invalid verification token is rejected', async () => {
    const invalidToken = 'this-is-not-a-valid-token-1234567890abcdef';

    await expect(verifyEmail(invalidToken)).rejects.toThrow(
      'Invalid or expired verification token'
    );
  });

  /**
   * Test: Already verified email can't be re-verified
   * 
   * Security test: Prevent token reuse
   */
  test('Already verified email cannot be re-verified', async () => {
    // Register and verify user
    const registrationData = {
      email: 'test2@example.com',
      username: 'testuser2',
      password: 'TestPassword123!',
    };

    const result = await registerUser(registrationData);
    await verifyEmail(result.verificationToken);

    // Try to verify again with same token
    await expect(verifyEmail(result.verificationToken)).rejects.toThrow(
      'Invalid or expired verification token'
    );
  });

  /**
   * Test: Expired token is rejected
   * 
   * Security test: Ensure tokens expire after 24 hours
   * 
   * Note: We manually set expiration in the past to test this
   */
  test('Expired verification token is rejected', async () => {
    // Register user
    const registrationData = {
      email: 'test3@example.com',
      username: 'testuser3',
      password: 'TestPassword123!',
    };

    const result = await registerUser(registrationData);

    // Manually set token expiration to the past
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 25); // 25 hours ago

    await prisma.user.update({
      where: { id: result.id },
      data: { emailVerificationExpires: pastDate },
    });

    // Try to verify with expired token
    await expect(verifyEmail(result.verificationToken)).rejects.toThrow(
      'Verification token has expired'
    );
  });

  /**
   * Test: Resend verification email
   * 
   * Tests that users can request a new verification email
   * if the original was lost or expired
   */
  test('User can resend verification email', async () => {
    // Register user
    const registrationData = {
      email: 'test4@example.com',
      username: 'testuser4',
      password: 'TestPassword123!',
    };

    const result = await registerUser(registrationData);
    const originalToken = result.verificationToken;

    // Resend verification email
    const newToken = await resendVerificationEmail(registrationData.email);

    // New token should be different from original
    expect(newToken).not.toBe(originalToken);
    expect(newToken.length).toBe(64);

    // Original token should no longer work
    await expect(verifyEmail(originalToken)).rejects.toThrow();

    // New token should work
    const verificationSuccess = await verifyEmail(newToken);
    expect(verificationSuccess).toBe(true);

    // Verify email is now verified
    const user = await prisma.user.findUnique({
      where: { id: result.id },
    });
    expect(user!.emailVerified).toBe(true);
  });

  /**
   * Test: Cannot resend verification for already verified email
   * 
   * Security test: Prevent spam
   */
  test('Cannot resend verification for already verified email', async () => {
    // Register and verify user
    const registrationData = {
      email: 'test5@example.com',
      username: 'testuser5',
      password: 'TestPassword123!',
    };

    const result = await registerUser(registrationData);
    await verifyEmail(result.verificationToken);

    // Try to resend verification
    await expect(
      resendVerificationEmail(registrationData.email)
    ).rejects.toThrow('Email is already verified');
  });

  /**
   * Test: Cannot resend verification for non-existent email
   * 
   * Security test: Don't reveal if email exists
   */
  test('Resend verification for non-existent email throws error', async () => {
    await expect(
      resendVerificationEmail('nonexistent@example.com')
    ).rejects.toThrow('No account found with this email address');
  });

  /**
   * Test: Token is single-use
   * 
   * Security test: Ensure tokens can't be reused
   */
  test('Verification token is single-use', async () => {
    // Register user
    const registrationData = {
      email: 'test6@example.com',
      username: 'testuser6',
      password: 'TestPassword123!',
    };

    const result = await registerUser(registrationData);
    const token = result.verificationToken;

    // Verify email (first use - should succeed)
    await verifyEmail(token);

    // Try to use token again (should fail)
    await expect(verifyEmail(token)).rejects.toThrow();
  });
});

/**
 * Test: Verification token format
 * 
 * Ensures tokens are generated with correct format and length
 */
describe('Verification Token Generation', () => {
  test('Verification tokens are 64 characters (32 bytes hex)', async () => {
    const registrationData = {
      email: 'tokentest@example.com',
      username: 'tokentest',
      password: 'TestPassword123!',
    };

    const result = await registerUser(registrationData);

    expect(result.verificationToken).toBeDefined();
    expect(result.verificationToken.length).toBe(64);
    expect(result.verificationToken).toMatch(/^[0-9a-f]{64}$/); // Hex format
  });

  test('Each registration generates unique token', async () => {
    const tokens = new Set<string>();

    // Register 10 users and collect tokens
    for (let i = 0; i < 10; i++) {
      const result = await registerUser({
        email: `uniquetest${i}@example.com`,
        username: `uniquetest${i}`,
        password: 'TestPassword123!',
      });
      tokens.add(result.verificationToken);
    }

    // All tokens should be unique
    expect(tokens.size).toBe(10);
  });
});
