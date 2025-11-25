/**
 * Property-Based Tests for User Registration
 * 
 * These tests verify the correctness properties for user registration:
 * - Property 1: Valid registration creates unique user accounts
 * - Property 2: Duplicate email registration is rejected
 * - Property 30: Passwords are hashed before storage
 * 
 * Why property-based testing for authentication?
 * - Tests across many random inputs (not just a few examples)
 * - Catches edge cases we might not think of
 * - Verifies properties hold for ALL valid inputs
 * - More confidence in correctness than example-based tests
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { registerUser, hashPassword, verifyPassword } from '../services/authService';
import { validateEmail, validateUsername, validatePassword } from '../utils/validation';

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
  fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/)  // Additional characters (at least 1 to ensure 8+ total)
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

describe('User Registration Properties', () => {
  /**
   * Feature: marketplace-platform, Property 1: Valid registration creates unique user accounts
   * Validates: Requirements 1.1
   * 
   * For any valid registration data (email, password, username), submitting the
   * registration should create a new user account with a unique identifier that
   * can be retrieved from the database.
   * 
   * What we're testing:
   * 1. User is created in database
   * 2. User has a unique ID
   * 3. All provided data is stored correctly
   * 4. User can be retrieved by ID
   * 5. Email verification token is generated
   */
  test(
    'Property 1: Valid registration creates unique user accounts',
    async () => {
      await fc.assert(
        fc.asyncProperty(validRegistrationDataArbitrary, async (registrationData) => {
          // Register the user
          const result = await registerUser(registrationData);

          // Verify user was created with unique ID
          expect(result.id).toBeDefined();
          expect(typeof result.id).toBe('string');
          expect(result.id.length).toBeGreaterThan(0);

          // Verify all data was stored correctly
          expect(result.email).toBe(registrationData.email);
          expect(result.username).toBe(registrationData.username);
          expect(result.location).toBe(registrationData.location || null);
          expect(result.emailVerified).toBe(false); // Should start unverified

          // Verify verification token was generated
          expect(result.verificationToken).toBeDefined();
          expect(typeof result.verificationToken).toBe('string');
          expect(result.verificationToken.length).toBe(64); // 32 bytes = 64 hex chars

          // Verify user can be retrieved from database
          const retrievedUser = await prisma.user.findUnique({
            where: { id: result.id },
          });

          expect(retrievedUser).not.toBeNull();
          expect(retrievedUser!.email).toBe(registrationData.email);
          expect(retrievedUser!.username).toBe(registrationData.username);
          expect(retrievedUser!.emailVerified).toBe(false);

          // Verify password is NOT stored in plain text
          expect(retrievedUser!.passwordHash).not.toBe(registrationData.password);
          expect(retrievedUser!.passwordHash).toBeDefined();
        }),
        { numRuns: 20 } // Reduced from 100 due to bcrypt being slow
      );
    },
    60000 // 60 second timeout for bcrypt operations
  );

  /**
   * Feature: marketplace-platform, Property 2: Duplicate email registration is rejected
   * Validates: Requirements 1.2
   * 
   * For any existing user account, attempting to register a new account with
   * the same email address should be rejected with an appropriate error, and
   * no new account should be created.
   * 
   * What we're testing:
   * 1. First registration succeeds
   * 2. Second registration with same email fails
   * 3. Error is thrown (Prisma unique constraint)
   * 4. Only one user exists in database
   */
  test(
    'Property 2: Duplicate email registration is rejected',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validRegistrationDataArbitrary,
          validUsernameArbitrary,
          validPasswordArbitrary,
          async (firstUserData, secondUsername, secondPassword) => {
            // Register first user
            const firstUser = await registerUser(firstUserData);
            expect(firstUser.id).toBeDefined();

            // Attempt to register second user with same email but different username
            const secondUserData = {
              email: firstUserData.email, // Same email!
              username: secondUsername,   // Different username
              password: secondPassword,   // Different password
              location: 'Different Location',
            };

            // This should throw an error due to unique constraint on email
            await expect(registerUser(secondUserData)).rejects.toThrow();

            // Verify only one user exists with this email
            const users = await prisma.user.findMany({
              where: { email: firstUserData.email },
            });
            expect(users.length).toBe(1);
            expect(users[0].id).toBe(firstUser.id);
            expect(users[0].username).toBe(firstUserData.username);
          }
        ),
        { numRuns: 20 } // Reduced from 100 due to bcrypt being slow
      );
    },
    120000 // 120 second timeout (2 registrations per test)
  );

  /**
   * Feature: marketplace-platform, Property 30: Passwords are hashed before storage
   * Validates: Requirements 10.2
   * 
   * For any user registration or password change, the password stored in the
   * database should be a hash, not the plaintext password, and should be
   * verifiable using the hashing algorithm.
   * 
   * What we're testing:
   * 1. Password is hashed (not stored as plain text)
   * 2. Hash is different from original password
   * 3. Hash can be verified against original password
   * 4. Hash cannot be verified against wrong password
   * 5. Same password produces different hashes (salt is random)
   */
  test(
    'Property 30: Passwords are hashed before storage',
    async () => {
      await fc.assert(
        fc.asyncProperty(validRegistrationDataArbitrary, async (registrationData) => {
          // Register user
          const result = await registerUser(registrationData);

          // Retrieve user from database
          const user = await prisma.user.findUnique({
            where: { id: result.id },
          });

          expect(user).not.toBeNull();
          expect(user!.passwordHash).toBeDefined();

          // Verify password is hashed (not plain text)
          expect(user!.passwordHash).not.toBe(registrationData.password);

          // Verify hash starts with bcrypt identifier
          // bcrypt hashes start with $2a$, $2b$, or $2y$
          expect(user!.passwordHash).toMatch(/^\$2[aby]\$/);

          // Verify hash can be verified with correct password
          const isValidPassword = await verifyPassword(
            registrationData.password,
            user!.passwordHash!
          );
          expect(isValidPassword).toBe(true);

          // Verify hash cannot be verified with wrong password
          const isInvalidPassword = await verifyPassword(
            'WrongPassword123!',
            user!.passwordHash!
          );
          expect(isInvalidPassword).toBe(false);
        }),
        { numRuns: 20 } // Reduced from 100 due to bcrypt being slow
      );
    },
    120000 // 120 second timeout (multiple bcrypt operations per test)
  );

  /**
   * Additional test: Verify same password produces different hashes
   * 
   * This tests that bcrypt's salt is working correctly.
   * Even with the same password, each hash should be unique.
   */
  test(
    'Property 30b: Same password produces different hashes (salt randomness)',
    async () => {
      await fc.assert(
        fc.asyncProperty(validPasswordArbitrary, async (password) => {
          // Hash the same password twice
          const hash1 = await hashPassword(password);
          const hash2 = await hashPassword(password);

          // Hashes should be different (due to random salt)
          expect(hash1).not.toBe(hash2);

          // But both should verify against the original password
          const verify1 = await verifyPassword(password, hash1);
          const verify2 = await verifyPassword(password, hash2);
          expect(verify1).toBe(true);
          expect(verify2).toBe(true);
        }),
        { numRuns: 10 } // Reduced from 50 due to bcrypt being slow
      );
    },
    60000 // 60 second timeout
  );
});

// ============================================
// VALIDATION TESTS
// ============================================

describe('Input Validation Properties', () => {
  /**
   * Test that our generators actually produce valid data
   * 
   * This is a sanity check to ensure our custom generators
   * are creating data that passes our validation rules.
   */
  test('Generated emails pass validation', async () => {
    await fc.assert(
      fc.property(validEmailArbitrary, (email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  test('Generated usernames pass validation', async () => {
    await fc.assert(
      fc.property(validUsernameArbitrary, (username) => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  test('Generated passwords pass validation', async () => {
    await fc.assert(
      fc.property(validPasswordArbitrary, (password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
