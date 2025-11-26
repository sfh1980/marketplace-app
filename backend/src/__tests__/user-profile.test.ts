/**
 * Property-Based Tests for User Profile
 * 
 * These tests verify the correctness property for user profile viewing:
 * - Property 6: Profile view contains required information
 * 
 * Why property-based testing for user profiles?
 * - Tests across many random users and listings
 * - Verifies profile data is complete for ALL users
 * - Catches edge cases (users with no listings, many listings, etc.)
 * - More confidence than testing a few specific examples
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { registerUser } from '../services/authService';
import { getUserProfile } from '../services/userService';

const prisma = new PrismaClient();

// ============================================
// CUSTOM GENERATORS
// ============================================

/**
 * Generate valid email addresses
 * Strategy: Create unique emails to avoid conflicts
 * Add timestamp to ensure uniqueness across test runs
 */
const validEmailArbitrary = fc.tuple(
  fc.stringMatching(/^[a-z0-9]{3,10}$/),
  fc.constantFrom('gmail.com', 'yahoo.com', 'test.com', 'example.com'),
  fc.integer({ min: 100000000, max: 999999999 }),
  fc.integer({ min: 100000000, max: 999999999 })
).map(([name, domain, random1, random2]) => 
  `${name}_${random1}_${random2}_${Date.now()}_${Math.random().toString(36).substring(7)}@${domain}`
);

/**
 * Generate valid usernames
 * Strategy: Create unique usernames to avoid conflicts
 * Add timestamp to ensure uniqueness across test runs
 */
const validUsernameArbitrary = fc.tuple(
  fc.stringMatching(/^[a-zA-Z0-9_]{3,10}$/),
  fc.integer({ min: 100000000, max: 999999999 }),
  fc.integer({ min: 100000000, max: 999999999 })
).map(([name, random1, random2]) => 
  `${name}_${random1}_${random2}_${Date.now()}`.substring(0, 20)
);

/**
 * Generate valid passwords
 * Strategy: Build passwords that meet all requirements
 */
const validPasswordArbitrary = fc.tuple(
  fc.stringMatching(/^[A-Z]{2,4}$/),
  fc.stringMatching(/^[a-z]{2,4}$/),
  fc.stringMatching(/^[0-9]{2,4}$/),
  fc.constantFrom('!', '@', '#', '$', '%'),
  fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/)
).map(([upper, lower, numbers, special, extra]) => 
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
    'Phoenix, AZ',
    'Seattle, WA',
    'Boston, MA'
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
 * Generate listing data
 * This creates realistic listing data for testing
 */
const listingDataArbitrary = fc.record({
  title: fc.stringMatching(/^[A-Za-z0-9 ]{10,50}$/),
  description: fc.stringMatching(/^[A-Za-z0-9 .,!?]{20,200}$/),
  price: fc.float({ min: 1, max: 10000, noNaN: true }),
  listingType: fc.constantFrom('item', 'service'),
  pricingType: fc.option(fc.constantFrom('fixed', 'hourly'), { nil: null }),
  images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 10 }),
  location: fc.constantFrom(
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX'
  ),
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
// HELPER FUNCTIONS
// ============================================

/**
 * Create a category for listings
 * Categories are required for listings
 */
async function createCategory() {
  return await prisma.category.create({
    data: {
      name: 'Test Category',
      slug: 'test-category',
      description: 'A test category for property tests',
    },
  });
}

/**
 * Create a user with listings
 * This helper creates a complete user profile with listings for testing
 */
async function createUserWithListings(
  registrationData: any,
  listingsData: any[]
) {
  // Create user
  const user = await registerUser(registrationData);

  // Create category for listings
  const category = await createCategory();

  // Create listings for this user
  const listings = await Promise.all(
    listingsData.map((listingData) =>
      prisma.listing.create({
        data: {
          sellerId: user.id,
          categoryId: category.id,
          title: listingData.title,
          description: listingData.description,
          price: listingData.price,
          listingType: listingData.listingType,
          pricingType: listingData.pricingType,
          images: listingData.images,
          location: listingData.location,
          status: 'active',
        },
      })
    )
  );

  return { user, listings };
}

// ============================================
// PROPERTY-BASED TESTS
// ============================================

describe('User Profile Properties', () => {
  /**
   * Feature: marketplace-platform, Property 6: Profile view contains required information
   * Validates: Requirements 2.3
   * 
   * For any user profile, viewing the profile should return all required fields
   * including username, profile picture, join date, and listing history.
   * 
   * What we're testing:
   * 1. Profile contains all required user fields
   * 2. Profile includes user's active listings
   * 3. Email is NOT exposed (privacy)
   * 4. Password hash is NOT exposed (security)
   * 5. Listings are sorted by creation date (newest first)
   * 6. Only active listings are shown (not sold/deleted)
   */
  test(
    'Property 6: Profile view contains required information',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validRegistrationDataArbitrary,
          fc.array(listingDataArbitrary, { minLength: 0, maxLength: 5 }),
          async (registrationData, listingsData) => {
            // Clean database before each property test run
            // This is necessary because fast-check runs multiple iterations
            // and shrinks failing cases, which can cause unique constraint violations
            await prisma.favorite.deleteMany();
            await prisma.rating.deleteMany();
            await prisma.message.deleteMany();
            await prisma.listing.deleteMany();
            await prisma.category.deleteMany();
            await prisma.user.deleteMany();

            // Create user with listings
            const { user } = await createUserWithListings(
              registrationData,
              listingsData
            );

            // Fetch user profile
            const profile = await getUserProfile(user.id);

            // Verify profile exists
            expect(profile).not.toBeNull();
            expect(profile).toBeDefined();

            // Verify all required user fields are present
            expect(profile!.id).toBe(user.id);
            expect(profile!.username).toBe(registrationData.username);
            expect(profile!.location).toBe(registrationData.location || null);
            expect(profile!.joinDate).toBeDefined();
            expect(profile!.averageRating).toBeDefined();
            expect(typeof profile!.averageRating).toBe('number');

            // Verify profile picture field exists (even if null)
            expect(profile).toHaveProperty('profilePicture');

            // Verify email is NOT exposed (privacy)
            expect(profile).not.toHaveProperty('email');

            // Verify password hash is NOT exposed (security)
            expect(profile).not.toHaveProperty('passwordHash');

            // Verify listings are included
            expect(profile!.listings).toBeDefined();
            expect(Array.isArray(profile!.listings)).toBe(true);
            expect(profile!.listings.length).toBe(listingsData.length);

            // Verify each listing contains required information
            profile!.listings.forEach((listing) => {
              expect(listing.id).toBeDefined();
              expect(listing.title).toBeDefined();
              expect(listing.description).toBeDefined();
              expect(listing.price).toBeDefined();
              expect(listing.listingType).toBeDefined();
              expect(listing.images).toBeDefined();
              expect(Array.isArray(listing.images)).toBe(true);
              expect(listing.status).toBe('active');
              expect(listing.location).toBeDefined();
              expect(listing.createdAt).toBeDefined();
            });

            // Verify listings are sorted by creation date (newest first)
            if (profile!.listings.length > 1) {
              for (let i = 0; i < profile!.listings.length - 1; i++) {
                const currentDate = new Date(profile!.listings[i].createdAt);
                const nextDate = new Date(profile!.listings[i + 1].createdAt);
                expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
              }
            }
          }
        ),
        { numRuns: 20 } // Reduced from 100 due to database operations
      );
    },
    60000 // 60 second timeout
  );

  /**
   * Additional test: Profile with no listings
   * 
   * Edge case: User has no listings yet
   * Profile should still contain all required user information
   */
  test(
    'Property 6a: Profile view works for users with no listings',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validRegistrationDataArbitrary,
          async (registrationData) => {
            // Clean database before each property test run
            await prisma.favorite.deleteMany();
            await prisma.rating.deleteMany();
            await prisma.message.deleteMany();
            await prisma.listing.deleteMany();
            await prisma.category.deleteMany();
            await prisma.user.deleteMany();

            // Create user without listings
            const user = await registerUser(registrationData);

            // Fetch user profile
            const profile = await getUserProfile(user.id);

            // Verify profile exists
            expect(profile).not.toBeNull();

            // Verify all required fields are present
            expect(profile!.id).toBe(user.id);
            expect(profile!.username).toBe(registrationData.username);
            expect(profile!.location).toBe(registrationData.location || null);
            expect(profile!.joinDate).toBeDefined();
            expect(profile!.averageRating).toBe(0); // No ratings yet

            // Verify listings array is empty but defined
            expect(profile!.listings).toBeDefined();
            expect(Array.isArray(profile!.listings)).toBe(true);
            expect(profile!.listings.length).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    },
    60000
  );

  /**
   * Additional test: Only active listings are shown
   * 
   * Edge case: User has sold/deleted listings
   * Only active listings should appear in profile
   */
  test(
    'Property 6b: Profile view only shows active listings',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validRegistrationDataArbitrary,
          fc.array(listingDataArbitrary, { minLength: 2, maxLength: 5 }),
          async (registrationData, listingsData) => {
            // Clean database before each property test run
            await prisma.favorite.deleteMany();
            await prisma.rating.deleteMany();
            await prisma.message.deleteMany();
            await prisma.listing.deleteMany();
            await prisma.category.deleteMany();
            await prisma.user.deleteMany();

            // Create user with listings
            const { user, listings } = await createUserWithListings(
              registrationData,
              listingsData
            );

            // Mark some listings as sold
            if (listings.length >= 2) {
              await prisma.listing.update({
                where: { id: listings[0].id },
                data: { status: 'sold' },
              });

              await prisma.listing.update({
                where: { id: listings[1].id },
                data: { status: 'deleted' },
              });
            }

            // Fetch user profile
            const profile = await getUserProfile(user.id);

            // Verify profile exists
            expect(profile).not.toBeNull();

            // Verify only active listings are shown
            expect(profile!.listings.length).toBe(listingsData.length - 2);

            // Verify all returned listings have status 'active'
            profile!.listings.forEach((listing) => {
              expect(listing.status).toBe('active');
            });
          }
        ),
        { numRuns: 20 }
      );
    },
    60000
  );

  /**
   * Additional test: Non-existent user returns null
   * 
   * Edge case: Requesting profile for user that doesn't exist
   * Should return null (controller will return 404)
   */
  test(
    'Property 6c: Profile view returns null for non-existent user',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (randomUserId) => {
            // Fetch profile for non-existent user
            const profile = await getUserProfile(randomUserId);

            // Verify profile is null
            expect(profile).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    },
    30000
  );
});
