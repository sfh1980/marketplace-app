/**
 * Property-Based Tests for User Login
 * 
 * These tests verify the correctness properties for user login:
 * - Property 3: Valid credentials authenticate successfully
 * - Property 4: Invalid credentials are rejected
 * 
 * Why property-based testing for login?
 * - Tests across many random credentials (not just a few examples)
 * - Catches edge cases in authentication logic
 * - Verifies properties hold for ALL valid/invalid inputs
 * - More confidence in security than example-based tests
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { registerUser, loginUser, verifyJWT } from '../services/authService';

const prisma = new PrismaClient();

// ============================================
// CUSTOM GENERATORS
// ============================================

/**
 * Generate valid email addresses
 * 
 * Strategy: Create emails that pass our validation rules
 * - Valid format: name@domain.tld
 * - Unique: Add random numbers to ensure uniqueness
 */
const validEmailArbitrary = fc.tuple(
  fc.stringMatching(/^[a-z0-9]{3,10}$/),
  fc.constantFrom('gmail.com', 'yahoo.com', 'test.com', 'example.com'),
  fc.integer({ min: 100000000, max: 999999999 }),
  fc.integer({ min: 100000000, max: 999999999 })
).map(([name, domain, random1, random2]) => 
  `${name}_${random1}_${random2}@${domain}`
);

/**
 * Generate valid usernames
 * 
 * Strategy: Create usernames that pass our validation rules
 * - 3-20 characters
 * - Alphanumeric and underscores only
 * - Unique: Add random numbers
 */
const validUsernameArbitrary = fc.tuple(
  fc.stringMatching(/^[a-zA-Z0-9_]{3,10}$/),
  fc.integer({ min: 100000000, max: 999999999 }),
  fc.integer({ min: 100000000, max: 999999999 })
).map(([name, random1, random2]) => 
  `${name}_${random1}_${random2}`.substring(0, 20)
);

/**
 * Generate valid passwords
 * 
 * Strategy: Create passwords that pass our validation rules
 * - At least 8 characters
 * - Contains uppercase, lowercase, number, special character
 * 
 * We build passwords from components to ensure they meet requirements
 */
const validPasswordArbitrary = fc.tuple(
  fc.stringMatching(/^[A-Z]{2,4}$/),        // Uppercase letters (at least 2)
  fc.stringMatching(/^[a-z]{2,4}$/),        // Lowercase letters (at least 2)
  fc.stringMatching(/^[0-9]{2,4}$/),        // Numbers (at least 2)
  fc.constantFrom('!', '@', '#', '$', '%'), // Special character
  fc.stringMatching(/^[a-zA-Z0-9]{0,10}$/)  // Additional characters
).map(([upper, lower, numbers, special, extra]) => 
  // Shuffle components to create varied passwords (at least 8 chars total)
  `${upper}${lower}${numbers}${special}${extra}`.split('').sort(() => Math.random() - 0.5).join('')
);

/**
 * Generate optional location strings
 */
const locationArbitrary = fc.option(
  fc.constantFrom(
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ'
  ),
  { nil: undefined }
);

/**
 * Generate complete valid registration data
 */
const validRegistrationDataArbitrary = fc.record({
  email: validEmailArbitrary,
  username: validUsernameArbitrary,
  password: validPasswordArbitrary,
  location: locationArbitrary,
});

/**
 * Generate invalid passwords (for testing rejection)
 */
const invalidPasswordArbitrary = fc.constantFrom(
  'wrongpassword',
  'WrongPassword123!',
  'DifferentPass456@',
  'NotTheRightOne789#',
  'IncorrectCredentials!',
);

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
// PROPERTY-BASED TESTS
// ============================================

describe('User Login Properties', () => {
  /**
   * Feature: marketplace-platform, Property 3: Valid credentials authenticate successfully
   * Validates: Requirements 1.3
   * 
   * For any registered user, submitting their correct email and password should
   * result in successful authentication and return a valid authentication token.
   * 
   * What we're testing:
   * 1. Login succeeds with correct credentials
   * 2. JWT token is returned
   * 3. Token is valid and can be verified
   * 4. Token contains correct user information
   * 5. User information is returned in response
   * 6. Email must be verified to login
   */
  test(
    'Property 3: Valid credentials authenticate successfully',
    async () => {
      await fc.assert(
        fc.asyncProperty(validRegistrationDataArbitrary, async (registrationData) => {
          // Step 1: Register a user
          const registeredUser = await registerUser(registrationData);
          expect(registeredUser.id).toBeDefined();

          // Step 2: Verify the user's email (required for login)
          // In a real scenario, user would click link in email
          // For testing, we directly update the database
          await prisma.user.update({
            where: { id: registeredUser.id },
            data: { emailVerified: true },
          });

          // Step 3: Attempt login with correct credentials
          const loginResult = await loginUser(
            registrationData.email,
            registrationData.password
          );

          // Step 4: Verify login was successful
          expect(loginResult).toBeDefined();
          expect(loginResult.token).toBeDefined();
          expect(typeof loginResult.token).toBe('string');
          expect(loginResult.token.length).toBeGreaterThan(0);

          // Step 5: Verify user information is returned
          expect(loginResult.user).toBeDefined();
          expect(loginResult.user.id).toBe(registeredUser.id);
          expect(loginResult.user.email).toBe(registrationData.email);
          expect(loginResult.user.username).toBe(registrationData.username);
          expect(loginResult.user.emailVerified).toBe(true);
          expect(loginResult.user.location).toBe(registrationData.location || null);

          // Step 6: Verify JWT token is valid
          const decodedToken = verifyJWT(loginResult.token);
          expect(decodedToken).toBeDefined();
          expect(decodedToken.userId).toBe(registeredUser.id);
          expect(decodedToken.email).toBe(registrationData.email);
          expect(decodedToken.username).toBe(registrationData.username);

          // Step 7: Verify token structure (JWT has 3 parts separated by dots)
          const tokenParts = loginResult.token.split('.');
          expect(tokenParts.length).toBe(3); // header.payload.signature
        }),
        { numRuns: 20 } // Reduced from 100 due to bcrypt being slow
      );
    },
    120000 // 120 second timeout (registration + login with bcrypt)
  );

  /**
   * Feature: marketplace-platform, Property 4: Invalid credentials are rejected
   * Validates: Requirements 1.4
   * 
   * For any login attempt with incorrect credentials (wrong password or
   * non-existent email), the authentication should fail and return an
   * appropriate error without granting access.
   * 
   * What we're testing:
   * 1. Login fails with wrong password
   * 2. Login fails with non-existent email
   * 3. Login fails if email is not verified
   * 4. Error is thrown (no token returned)
   * 5. Error message is generic (security)
   */
  test(
    'Property 4: Invalid credentials are rejected',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validRegistrationDataArbitrary,
          invalidPasswordArbitrary,
          async (registrationData, wrongPassword) => {
            // Step 1: Register a user
            const registeredUser = await registerUser(registrationData);
            expect(registeredUser.id).toBeDefined();

            // Step 2: Verify the user's email
            await prisma.user.update({
              where: { id: registeredUser.id },
              data: { emailVerified: true },
            });

            // Step 3: Attempt login with wrong password
            // This should throw an error
            await expect(
              loginUser(registrationData.email, wrongPassword)
            ).rejects.toThrow('Invalid email or password');

            // Step 4: Attempt login with non-existent email
            const fakeEmail = `nonexistent_${Date.now()}@test.com`;
            await expect(
              loginUser(fakeEmail, registrationData.password)
            ).rejects.toThrow('Invalid email or password');
          }
        ),
        { numRuns: 20 } // Reduced from 100 due to bcrypt being slow
      );
    },
    120000 // 120 second timeout
  );

  /**
   * Property 4b: Unverified email prevents login
   * 
   * For any registered user with unverified email, attempting to login
   * should fail with an appropriate error message.
   * 
   * This is a security feature to ensure users have access to the email
   * they registered with.
   */
  test(
    'Property 4b: Unverified email prevents login',
    async () => {
      await fc.assert(
        fc.asyncProperty(validRegistrationDataArbitrary, async (registrationData) => {
          // Step 1: Register a user
          const registeredUser = await registerUser(registrationData);
          expect(registeredUser.id).toBeDefined();

          // Step 2: Attempt login WITHOUT verifying email
          // This should throw an error
          await expect(
            loginUser(registrationData.email, registrationData.password)
          ).rejects.toThrow('Please verify your email before logging in');

          // Verify user still exists but cannot login
          const user = await prisma.user.findUnique({
            where: { id: registeredUser.id },
          });
          expect(user).not.toBeNull();
          expect(user!.emailVerified).toBe(false);
        }),
        { numRuns: 20 } // Reduced from 100 due to bcrypt being slow
      );
    },
    60000 // 60 second timeout
  );

  /**
   * Property 4c: Empty credentials are rejected
   * 
   * For any login attempt with empty email or password, the authentication
   * should fail immediately without hitting the database.
   * 
   * This is handled at the controller level, but we test the service layer
   * behavior here as well.
   */
  test(
    'Property 4c: Empty or missing credentials are rejected',
    async () => {
      await fc.assert(
        fc.asyncProperty(validEmailArbitrary, async (email) => {
          // Attempt login with empty password
          await expect(
            loginUser(email, '')
          ).rejects.toThrow();

          // Attempt login with empty email
          await expect(
            loginUser('', 'SomePassword123!')
          ).rejects.toThrow();
        }),
        { numRuns: 50 } // Fast test (no bcrypt)
      );
    },
    30000 // 30 second timeout
  );

  /**
   * Additional test: Token expiration is set correctly
   * 
   * Verify that generated tokens have the correct expiration time (15 minutes).
   * This is important for security - tokens shouldn't last forever.
   */
  test(
    'Property 3b: Generated tokens have correct expiration',
    async () => {
      await fc.assert(
        fc.asyncProperty(validRegistrationDataArbitrary, async (registrationData) => {
          // Register and verify user
          const registeredUser = await registerUser(registrationData);
          await prisma.user.update({
            where: { id: registeredUser.id },
            data: { emailVerified: true },
          });

          // Login to get token
          const loginResult = await loginUser(
            registrationData.email,
            registrationData.password
          );

          // Decode token to check expiration
          const jwt = require('jsonwebtoken');
          const decoded = jwt.decode(loginResult.token);

          expect(decoded).toBeDefined();
          expect(decoded.exp).toBeDefined();
          expect(decoded.iat).toBeDefined();

          // Calculate token lifetime (exp - iat should be 15 minutes = 900 seconds)
          const lifetime = decoded.exp - decoded.iat;
          expect(lifetime).toBe(900); // 15 minutes in seconds
        }),
        { numRuns: 10 } // Reduced due to bcrypt
      );
    },
    60000 // 60 second timeout
  );
});

// ============================================
// JWT TOKEN TESTS
// ============================================

describe('JWT Token Properties', () => {
  /**
   * Test that JWT tokens are properly formatted
   * 
   * JWT tokens should have three parts separated by dots:
   * - Header (algorithm and type)
   * - Payload (user data)
   * - Signature (verification)
   */
  test('JWT tokens have correct structure', async () => {
    await fc.assert(
      fc.asyncProperty(validRegistrationDataArbitrary, async (registrationData) => {
        // Register and verify user
        const registeredUser = await registerUser(registrationData);
        await prisma.user.update({
          where: { id: registeredUser.id },
          data: { emailVerified: true },
        });

        // Login to get token
        const loginResult = await loginUser(
          registrationData.email,
          registrationData.password
        );

        // Verify token structure
        const tokenParts = loginResult.token.split('.');
        expect(tokenParts.length).toBe(3);

        // Each part should be base64-encoded (non-empty strings)
        expect(tokenParts[0].length).toBeGreaterThan(0); // Header
        expect(tokenParts[1].length).toBeGreaterThan(0); // Payload
        expect(tokenParts[2].length).toBeGreaterThan(0); // Signature
      }),
      { numRuns: 10 }
    );
  }, 60000);

  /**
   * Test that tokens contain correct user information
   * 
   * The token payload should include userId, email, and username
   * but NOT sensitive information like password hash.
   */
  test('JWT tokens contain correct user information', async () => {
    await fc.assert(
      fc.asyncProperty(validRegistrationDataArbitrary, async (registrationData) => {
        // Register and verify user
        const registeredUser = await registerUser(registrationData);
        await prisma.user.update({
          where: { id: registeredUser.id },
          data: { emailVerified: true },
        });

        // Login to get token
        const loginResult = await loginUser(
          registrationData.email,
          registrationData.password
        );

        // Decode token (without verification, just to inspect payload)
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(loginResult.token);

        // Verify payload contains correct information
        expect(decoded.userId).toBe(registeredUser.id);
        expect(decoded.email).toBe(registrationData.email);
        expect(decoded.username).toBe(registrationData.username);

        // Verify payload does NOT contain sensitive information
        expect(decoded.passwordHash).toBeUndefined();
        expect(decoded.password).toBeUndefined();
      }),
      { numRuns: 10 }
    );
  }, 60000);
});
