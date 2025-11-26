/**
 * Property-Based Tests for Listing Retrieval
 * 
 * These tests verify the correctness properties for listing retrieval:
 * - Property 14: Listing details include all required information
 * 
 * Why property-based testing for listing retrieval?
 * - Tests across many random listings (not just a few examples)
 * - Verifies eager loading works correctly
 * - Ensures all required fields are present
 * - Validates seller and category information is included
 * 
 * Educational Focus: Eager Loading and N+1 Query Problem
 * 
 * The N+1 Query Problem:
 * When fetching data with relationships, a naive approach would be:
 * 1. Query to get listing (1 query)
 * 2. Query to get seller (1 query)
 * 3. Query to get category (1 query)
 * Total: 3 queries per listing
 * 
 * For 100 listings: 1 + 100 + 100 = 201 queries!
 * 
 * Eager Loading Solution:
 * Fetch listing with seller and category in one query using SQL JOINs.
 * Total: 1 query per listing
 * 
 * For 100 listings: 1 query!
 * 
 * Prisma's `include` option automatically creates SQL JOINs to fetch
 * related data efficiently. This test verifies that eager loading works
 * and all required data is present.
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { createListing } from '../services/listingService';
import { getListingById } from '../services/listingService';

const prisma = new PrismaClient();

// ============================================
// TEST SETUP AND TEARDOWN
// ============================================

// Store created test data for cleanup
let testUserIds: string[] = [];
let testCategoryIds: string[] = [];
let testListingIds: string[] = [];

/**
 * Setup: Create test users and categories before tests
 */
beforeAll(async () => {
  // Create test categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Test Electronics Retrieval',
        slug: 'test-electronics-retrieval-' + Date.now(),
        description: 'Test category for electronics',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Services Retrieval',
        slug: 'test-services-retrieval-' + Date.now(),
        description: 'Test category for services',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Furniture Retrieval',
        slug: 'test-furniture-retrieval-' + Date.now(),
        description: 'Test category for furniture',
      },
    }),
  ]);

  testCategoryIds = categories.map((c) => c.id);

  // Create test users with various profiles
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: `test-seller-retrieval-1-${Date.now()}@example.com`,
        username: `test_seller_retrieval_1_${Date.now()}`,
        passwordHash: 'hashed_password',
        emailVerified: true,
        profilePicture: 'https://example.com/profile1.jpg',
        averageRating: 4.5,
        location: 'New York, NY',
      },
    }),
    prisma.user.create({
      data: {
        email: `test-seller-retrieval-2-${Date.now()}@example.com`,
        username: `test_seller_retrieval_2_${Date.now()}`,
        passwordHash: 'hashed_password',
        emailVerified: true,
        profilePicture: null, // Test with no profile picture
        averageRating: 3.8,
        location: 'Los Angeles, CA',
      },
    }),
    prisma.user.create({
      data: {
        email: `test-seller-retrieval-3-${Date.now()}@example.com`,
        username: `test_seller_retrieval_3_${Date.now()}`,
        passwordHash: 'hashed_password',
        emailVerified: true,
        profilePicture: 'https://example.com/profile3.jpg',
        averageRating: 5.0,
        location: 'Chicago, IL',
      },
    }),
  ]);

  testUserIds = users.map((u) => u.id);
});

/**
 * Cleanup: Delete all test data after tests
 */
afterAll(async () => {
  // Delete in correct order (respecting foreign keys)
  await prisma.listing.deleteMany({
    where: { id: { in: testListingIds } },
  });

  await prisma.user.deleteMany({
    where: { id: { in: testUserIds } },
  });

  await prisma.category.deleteMany({
    where: { id: { in: testCategoryIds } },
  });

  await prisma.$disconnect();
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
  // Clean up any listings created during the test
  if (testListingIds.length > 0) {
    await prisma.listing.deleteMany({
      where: { id: { in: testListingIds } },
    });
    testListingIds = [];
  }
});

// ============================================
// CUSTOM GENERATORS
// ============================================

/**
 * Generate valid listing titles
 */
const validTitleArbitrary = fc.stringMatching(/^[a-zA-Z0-9 ]{5,50}$/);

/**
 * Generate valid listing descriptions
 */
const validDescriptionArbitrary = fc.stringMatching(/^[a-zA-Z0-9 .,!?]{10,200}$/);

/**
 * Generate valid prices
 */
const validPriceArbitrary = fc.double({
  min: 0.01,
  max: 10000,
  noNaN: true,
}).map((price) => Math.round(price * 100) / 100);

/**
 * Generate valid image URLs
 */
const validImagesArbitrary = fc.array(
  fc.webUrl({ withFragments: false, withQueryParameters: false }),
  { minLength: 1, maxLength: 10 }
);

/**
 * Generate valid locations
 */
const validLocationArbitrary = fc.constantFrom(
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'Phoenix, AZ',
  'Remote'
);

/**
 * Generate valid item listing data
 */
const getValidItemListingArbitrary = () => fc.record({
  sellerId: fc.constantFrom(...testUserIds),
  title: validTitleArbitrary,
  description: validDescriptionArbitrary,
  price: validPriceArbitrary,
  listingType: fc.constant('item' as const),
  pricingType: fc.constant(undefined),
  categoryId: fc.constantFrom(...testCategoryIds),
  images: validImagesArbitrary,
  location: validLocationArbitrary,
});

/**
 * Generate valid service listing data
 */
const getValidServiceListingArbitrary = () => fc.record({
  sellerId: fc.constantFrom(...testUserIds),
  title: validTitleArbitrary,
  description: validDescriptionArbitrary,
  price: validPriceArbitrary,
  listingType: fc.constant('service' as const),
  pricingType: fc.constantFrom('fixed' as const, 'hourly' as const),
  categoryId: fc.constantFrom(...testCategoryIds),
  images: validImagesArbitrary,
  location: validLocationArbitrary,
});

/**
 * Generate any valid listing (item or service)
 */
const getValidListingArbitrary = () => fc.oneof(
  getValidItemListingArbitrary(),
  getValidServiceListingArbitrary()
);

// ============================================
// PROPERTY-BASED TESTS
// ============================================

/**
 * Feature: marketplace-platform, Property 14: Listing details include all required information
 * 
 * Property: For any listing, retrieving the listing details should return all
 * required fields including images, description, price, seller information,
 * posting date, and seller rating.
 * 
 * Validates: Requirements 5.1, 5.2
 * 
 * What this test verifies:
 * - Listing can be retrieved by ID
 * - All listing fields are present
 * - Seller information is included (eager loading)
 * - Category information is included (eager loading)
 * - Seller information includes: id, username, profilePicture, averageRating, joinDate
 * - Category information includes: id, name, slug
 * - Sensitive seller data is NOT included (email, passwordHash)
 * 
 * This test demonstrates the benefits of eager loading:
 * - One query fetches listing + seller + category
 * - No N+1 query problem
 * - All required data is present in one response
 */
describe('Property 14: Listing details include all required information', () => {
  it('should return all required listing fields including seller and category info', async () => {
    await fc.assert(
      fc.asyncProperty(getValidListingArbitrary(), async (listingData) => {
        // Step 1: Create a listing
        const createdListing = await createListing(listingData);
        testListingIds.push(createdListing.id);

        // Step 2: Retrieve the listing using the service function
        // This uses eager loading to fetch seller and category in one query
        const retrievedListing = await getListingById(createdListing.id);

        // Step 3: Verify listing was found
        expect(retrievedListing).not.toBeNull();
        expect(retrievedListing).toBeDefined();

        // Step 4: Verify all listing fields are present
        expect(retrievedListing!.id).toBe(createdListing.id);
        expect(retrievedListing!.sellerId).toBe(listingData.sellerId);
        expect(retrievedListing!.title).toBe(listingData.title);
        expect(retrievedListing!.description).toBe(listingData.description);
        expect(retrievedListing!.price).toBe(listingData.price);
        expect(retrievedListing!.listingType).toBe(listingData.listingType);
        expect(retrievedListing!.categoryId).toBe(listingData.categoryId);
        expect(retrievedListing!.images).toEqual(listingData.images);
        expect(retrievedListing!.location).toBe(listingData.location);
        expect(retrievedListing!.status).toBe('active');

        // Step 5: Verify timestamps are present
        expect(retrievedListing!.createdAt).toBeInstanceOf(Date);
        expect(retrievedListing!.updatedAt).toBeInstanceOf(Date);

        // Step 6: Verify seller information is included (eager loading)
        expect(retrievedListing!.seller).toBeDefined();
        expect(retrievedListing!.seller).not.toBeNull();

        // Step 7: Verify seller has all required fields
        expect(retrievedListing!.seller.id).toBe(listingData.sellerId);
        expect(retrievedListing!.seller.username).toBeDefined();
        expect(typeof retrievedListing!.seller.username).toBe('string');
        expect(retrievedListing!.seller.username.length).toBeGreaterThan(0);

        // profilePicture can be null, but the field should exist
        expect(retrievedListing!.seller).toHaveProperty('profilePicture');

        // averageRating should be a number
        expect(typeof retrievedListing!.seller.averageRating).toBe('number');
        expect(retrievedListing!.seller.averageRating).toBeGreaterThanOrEqual(0);
        expect(retrievedListing!.seller.averageRating).toBeLessThanOrEqual(5);

        // joinDate should be a Date
        expect(retrievedListing!.seller.joinDate).toBeInstanceOf(Date);

        // Step 8: Verify sensitive seller data is NOT included
        expect(retrievedListing!.seller).not.toHaveProperty('email');
        expect(retrievedListing!.seller).not.toHaveProperty('passwordHash');
        expect(retrievedListing!.seller).not.toHaveProperty('emailVerificationToken');
        expect(retrievedListing!.seller).not.toHaveProperty('passwordResetToken');

        // Step 9: Verify category information is included (eager loading)
        expect(retrievedListing!.category).toBeDefined();
        expect(retrievedListing!.category).not.toBeNull();

        // Step 10: Verify category has all required fields
        expect(retrievedListing!.category.id).toBe(listingData.categoryId);
        expect(retrievedListing!.category.name).toBeDefined();
        expect(typeof retrievedListing!.category.name).toBe('string');
        expect(retrievedListing!.category.name.length).toBeGreaterThan(0);
        expect(retrievedListing!.category.slug).toBeDefined();
        expect(typeof retrievedListing!.category.slug).toBe('string');
        expect(retrievedListing!.category.slug.length).toBeGreaterThan(0);

        // Step 11: Verify pricing type for services
        if (listingData.listingType === 'service') {
          expect(retrievedListing!.pricingType).toBe(listingData.pricingType);
          expect(['fixed', 'hourly']).toContain(retrievedListing!.pricingType);
        } else {
          expect(retrievedListing!.pricingType).toBeNull();
        }
      }),
      { numRuns: 100 } // Run 100 iterations with random data
    );
  });

  /**
   * Test that non-existent listings return null
   * 
   * This verifies the error handling path
   */
  it('should return null for non-existent listing IDs', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (randomId) => {
        // Ensure the random ID doesn't accidentally match a real listing
        const existingListing = await prisma.listing.findUnique({
          where: { id: randomId },
        });

        // Skip this test case if the random ID happens to exist
        if (existingListing) {
          return true;
        }

        // Attempt to retrieve non-existent listing
        const result = await getListingById(randomId);

        // Should return null
        expect(result).toBeNull();

        return true;
      }),
      { numRuns: 50 }
    );
  });
});

/**
 * Additional tests for specific scenarios
 */
describe('Listing retrieval edge cases', () => {
  it('should handle listings with no profile picture', async () => {
    // Create a listing from a user with no profile picture
    const userWithNoProfilePic = testUserIds[1]; // Second user has no profile picture

    const listingData = {
      sellerId: userWithNoProfilePic,
      title: 'Test Listing No Profile Pic',
      description: 'Testing listing with seller who has no profile picture',
      price: 25.0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: ['https://example.com/image.jpg'],
      location: 'New York, NY',
    };

    const createdListing = await createListing(listingData);
    testListingIds.push(createdListing.id);

    const retrievedListing = await getListingById(createdListing.id);

    expect(retrievedListing).not.toBeNull();
    expect(retrievedListing!.seller.profilePicture).toBeNull();
  });

  it('should handle listings with maximum images', async () => {
    const maxImages = Array(10).fill('https://example.com/image.jpg');

    const listingData = {
      sellerId: testUserIds[0],
      title: 'Test Listing Max Images',
      description: 'Testing listing with maximum number of images',
      price: 100.0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: maxImages,
      location: 'New York, NY',
    };

    const createdListing = await createListing(listingData);
    testListingIds.push(createdListing.id);

    const retrievedListing = await getListingById(createdListing.id);

    expect(retrievedListing).not.toBeNull();
    expect(retrievedListing!.images).toHaveLength(10);
    expect(retrievedListing!.images).toEqual(maxImages);
  });

  it('should handle service listings with hourly pricing', async () => {
    const serviceData = {
      sellerId: testUserIds[0],
      title: 'Hourly Service Test',
      description: 'Testing service with hourly pricing',
      price: 75.0,
      listingType: 'service' as const,
      pricingType: 'hourly' as const,
      categoryId: testCategoryIds[1],
      images: ['https://example.com/service.jpg'],
      location: 'Remote',
    };

    const createdListing = await createListing(serviceData);
    testListingIds.push(createdListing.id);

    const retrievedListing = await getListingById(createdListing.id);

    expect(retrievedListing).not.toBeNull();
    expect(retrievedListing!.listingType).toBe('service');
    expect(retrievedListing!.pricingType).toBe('hourly');
  });

  it('should handle service listings with fixed pricing', async () => {
    const serviceData = {
      sellerId: testUserIds[0],
      title: 'Fixed Service Test',
      description: 'Testing service with fixed pricing',
      price: 500.0,
      listingType: 'service' as const,
      pricingType: 'fixed' as const,
      categoryId: testCategoryIds[1],
      images: ['https://example.com/service.jpg'],
      location: 'Remote',
    };

    const createdListing = await createListing(serviceData);
    testListingIds.push(createdListing.id);

    const retrievedListing = await getListingById(createdListing.id);

    expect(retrievedListing).not.toBeNull();
    expect(retrievedListing!.listingType).toBe('service');
    expect(retrievedListing!.pricingType).toBe('fixed');
  });
});
