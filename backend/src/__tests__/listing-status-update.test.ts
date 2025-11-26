/**
 * Property-Based Tests for Listing Status Updates
 * 
 * These tests verify the correctness properties for listing status management:
 * - Property 10: Sold listings are excluded from active searches
 * 
 * Why property-based testing for status updates?
 * - Tests state transitions across many random listings
 * - Verifies status changes work correctly for all listing types
 * - Ensures sold/completed listings are properly excluded from searches
 * - Catches edge cases in status management logic
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { createListing, getAllListings, updateListingStatus } from '../services/listingService';

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
        name: 'Test Status Electronics',
        slug: 'test-status-electronics-' + Date.now(),
        description: 'Test category for status tests',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Status Services',
        slug: 'test-status-services-' + Date.now(),
        description: 'Test category for status tests',
      },
    }),
  ]);

  testCategoryIds = categories.map((c) => c.id);

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: `test-status-seller-1-${Date.now()}@example.com`,
        username: `test_status_seller_1_${Date.now()}`,
        passwordHash: 'hashed_password',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: `test-status-seller-2-${Date.now()}@example.com`,
        username: `test_status_seller_2_${Date.now()}`,
        passwordHash: 'hashed_password',
        emailVerified: true,
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

/**
 * Generate non-active status values
 * These are statuses that should exclude listings from active searches
 */
const getNonActiveStatusArbitrary = () => fc.constantFrom(
  'sold',
  'completed',
  'deleted'
);

// ============================================
// PROPERTY-BASED TESTS
// ============================================

/**
 * Feature: marketplace-platform, Property 10: Sold listings are excluded from active searches
 * 
 * Property: For any listing marked as sold, that listing should not appear in
 * search results for active listings, but should still be retrievable by direct
 * ID lookup.
 * 
 * Validates: Requirements 3.5
 * 
 * What this test verifies:
 * - Listings with status 'sold', 'completed', or 'deleted' are excluded from getAllListings
 * - Status updates work correctly for all listing types (items and services)
 * - Only 'active' listings appear in search results
 * - Non-active listings can still be retrieved by ID (for historical purposes)
 * - Status transitions preserve all other listing data
 * 
 * Test Strategy:
 * 1. Create a random listing (starts as 'active')
 * 2. Verify it appears in active search results
 * 3. Update status to non-active (sold/completed/deleted)
 * 4. Verify it no longer appears in active search results
 * 5. Verify it can still be retrieved by ID
 * 6. Verify all other listing data is preserved
 */
describe('Property 10: Sold listings are excluded from active searches', () => {
  it('should exclude non-active listings from getAllListings results', async () => {
    await fc.assert(
      fc.asyncProperty(
        getValidListingArbitrary(),
        getNonActiveStatusArbitrary(),
        async (listingData, nonActiveStatus) => {
          // Step 1: Create a listing (starts as 'active')
          const createdListing = await createListing(listingData);
          testListingIds.push(createdListing.id);

          // Verify listing starts with 'active' status
          expect(createdListing.status).toBe('active');

          // Step 2: Verify listing appears in active search results
          const activeResults = await getAllListings(100, 0);
          const foundInActive = activeResults.listings.some(
            (listing) => listing.id === createdListing.id
          );
          expect(foundInActive).toBe(true);

          // Step 3: Update listing status to non-active
          const updatedListing = await updateListingStatus(
            createdListing.id,
            listingData.sellerId,
            nonActiveStatus
          );

          // Verify status was updated
          expect(updatedListing.status).toBe(nonActiveStatus);

          // Step 4: Verify listing no longer appears in active search results
          const resultsAfterUpdate = await getAllListings(100, 0);
          const foundAfterUpdate = resultsAfterUpdate.listings.some(
            (listing) => listing.id === createdListing.id
          );
          expect(foundAfterUpdate).toBe(false);

          // Step 5: Verify listing can still be retrieved by ID
          const retrievedById = await prisma.listing.findUnique({
            where: { id: createdListing.id },
          });
          expect(retrievedById).not.toBeNull();
          expect(retrievedById!.status).toBe(nonActiveStatus);

          // Step 6: Verify all other listing data is preserved
          expect(retrievedById!.title).toBe(listingData.title);
          expect(retrievedById!.description).toBe(listingData.description);
          expect(retrievedById!.price).toBe(listingData.price);
          expect(retrievedById!.listingType).toBe(listingData.listingType);
          expect(retrievedById!.categoryId).toBe(listingData.categoryId);
          expect(retrievedById!.images).toEqual(listingData.images);
          expect(retrievedById!.location).toBe(listingData.location);

          // Verify createdAt is preserved (immutable)
          expect(retrievedById!.createdAt).toEqual(createdListing.createdAt);

          // Verify updatedAt was changed (reflects status update)
          expect(retrievedById!.updatedAt.getTime()).toBeGreaterThanOrEqual(
            createdListing.updatedAt.getTime()
          );

          return true;
        }
      ),
      { numRuns: 100 } // Run 100 iterations with random data
    );
  });

  it('should allow re-activating listings by changing status back to active', async () => {
    await fc.assert(
      fc.asyncProperty(
        getValidListingArbitrary(),
        getNonActiveStatusArbitrary(),
        async (listingData, nonActiveStatus) => {
          // Step 1: Create a listing
          const createdListing = await createListing(listingData);
          testListingIds.push(createdListing.id);

          // Step 2: Mark as non-active
          await updateListingStatus(
            createdListing.id,
            listingData.sellerId,
            nonActiveStatus
          );

          // Verify it's excluded from active searches
          const resultsWhileInactive = await getAllListings(100, 0);
          const foundWhileInactive = resultsWhileInactive.listings.some(
            (listing) => listing.id === createdListing.id
          );
          expect(foundWhileInactive).toBe(false);

          // Step 3: Re-activate the listing
          const reactivatedListing = await updateListingStatus(
            createdListing.id,
            listingData.sellerId,
            'active'
          );

          expect(reactivatedListing.status).toBe('active');

          // Step 4: Verify it appears in active searches again
          const resultsAfterReactivation = await getAllListings(100, 0);
          const foundAfterReactivation = resultsAfterReactivation.listings.some(
            (listing) => listing.id === createdListing.id
          );
          expect(foundAfterReactivation).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 } // Fewer runs since this tests a specific transition
    );
  });
});

/**
 * Additional tests for status update validation
 */
describe('Status update validation', () => {
  it('should reject invalid status values', async () => {
    // Create a test listing
    const listingData = {
      sellerId: testUserIds[0],
      title: 'Test Listing for Status',
      description: 'Test description for status validation',
      price: 50.0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: ['https://example.com/image.jpg'],
      location: 'New York, NY',
    };

    const createdListing = await createListing(listingData);
    testListingIds.push(createdListing.id);

    // Attempt to set invalid status
    await expect(
      updateListingStatus(createdListing.id, testUserIds[0], 'invalid_status')
    ).rejects.toThrow('Invalid status');
  });

  it('should reject status updates from non-owners', async () => {
    // Create a listing owned by user 0
    const listingData = {
      sellerId: testUserIds[0],
      title: 'Test Listing for Authorization',
      description: 'Test description for authorization',
      price: 50.0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: ['https://example.com/image.jpg'],
      location: 'New York, NY',
    };

    const createdListing = await createListing(listingData);
    testListingIds.push(createdListing.id);

    // Attempt to update status as user 1 (not the owner)
    await expect(
      updateListingStatus(createdListing.id, testUserIds[1], 'sold')
    ).rejects.toThrow('Unauthorized');
  });

  it('should allow all valid status transitions', async () => {
    const validStatuses = ['active', 'sold', 'completed', 'deleted'];

    for (const status of validStatuses) {
      // Create a listing
      const listingData = {
        sellerId: testUserIds[0],
        title: `Test Listing for ${status}`,
        description: 'Test description',
        price: 50.0,
        listingType: 'item' as const,
        pricingType: undefined,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/image.jpg'],
        location: 'New York, NY',
      };

      const createdListing = await createListing(listingData);
      testListingIds.push(createdListing.id);

      // Update to the status
      const updatedListing = await updateListingStatus(
        createdListing.id,
        testUserIds[0],
        status
      );

      expect(updatedListing.status).toBe(status);
    }
  });

  it('should preserve createdAt timestamp when updating status', async () => {
    // Create a listing
    const listingData = {
      sellerId: testUserIds[0],
      title: 'Test Listing for Timestamp',
      description: 'Test description for timestamp preservation',
      price: 50.0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: ['https://example.com/image.jpg'],
      location: 'New York, NY',
    };

    const createdListing = await createListing(listingData);
    testListingIds.push(createdListing.id);

    const originalCreatedAt = createdListing.createdAt;

    // Wait a bit to ensure timestamps would differ
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update status
    await updateListingStatus(createdListing.id, testUserIds[0], 'sold');

    // Retrieve and verify createdAt is unchanged
    const retrievedListing = await prisma.listing.findUnique({
      where: { id: createdListing.id },
    });

    expect(retrievedListing!.createdAt).toEqual(originalCreatedAt);
  });

  it('should update updatedAt timestamp when updating status', async () => {
    // Create a listing
    const listingData = {
      sellerId: testUserIds[0],
      title: 'Test Listing for UpdatedAt',
      description: 'Test description for updatedAt',
      price: 50.0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: ['https://example.com/image.jpg'],
      location: 'New York, NY',
    };

    const createdListing = await createListing(listingData);
    testListingIds.push(createdListing.id);

    const originalUpdatedAt = createdListing.updatedAt;

    // Wait a bit to ensure timestamps differ
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update status
    const updatedListing = await updateListingStatus(
      createdListing.id,
      testUserIds[0],
      'sold'
    );

    // Verify updatedAt changed
    expect(updatedListing.updatedAt.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    );
  });
});
