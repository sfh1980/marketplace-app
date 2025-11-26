/**
 * Property-Based Tests for Listing Updates
 * 
 * These tests verify the correctness properties for listing updates:
 * - Property 9: Listing edits preserve creation timestamp
 * 
 * Why property-based testing for updates?
 * - Tests across many random update scenarios
 * - Verifies immutable fields are truly immutable
 * - Ensures authorization works correctly
 * - Catches edge cases in update logic
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { createListing, updateListing } from '../services/listingService';

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
        name: 'Test Electronics Update',
        slug: 'test-electronics-update-' + Date.now(),
        description: 'Test category for electronics',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Services Update',
        slug: 'test-services-update-' + Date.now(),
        description: 'Test category for services',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Furniture Update',
        slug: 'test-furniture-update-' + Date.now(),
        description: 'Test category for furniture',
      },
    }),
  ]);

  testCategoryIds = categories.map((c) => c.id);

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: `test-seller-update-1-${Date.now()}@example.com`,
        username: `test_seller_update_1_${Date.now()}`,
        passwordHash: 'hashed_password',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: `test-seller-update-2-${Date.now()}@example.com`,
        username: `test_seller_update_2_${Date.now()}`,
        passwordHash: 'hashed_password',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: `test-other-user-${Date.now()}@example.com`,
        username: `test_other_user_${Date.now()}`,
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
 * Generate valid item listing data for creation
 */
const getValidItemListingArbitrary = () => fc.record({
  sellerId: fc.constantFrom(...testUserIds.slice(0, 2)), // First two users
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
 * Generate valid service listing data for creation
 */
const getValidServiceListingArbitrary = () => fc.record({
  sellerId: fc.constantFrom(...testUserIds.slice(0, 2)), // First two users
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
 * Generate valid update data for a listing
 * 
 * This generates partial updates - only some fields are updated
 * This tests that partial updates work correctly
 */
const getValidUpdateDataArbitrary = () => fc.record({
  title: fc.option(validTitleArbitrary, { nil: undefined }),
  description: fc.option(validDescriptionArbitrary, { nil: undefined }),
  price: fc.option(validPriceArbitrary, { nil: undefined }),
  location: fc.option(validLocationArbitrary, { nil: undefined }),
  // Note: We don't update listingType or pricingType in these tests
  // to keep the tests focused on timestamp preservation
  // Those fields have their own validation tests
}, { requiredKeys: [] }); // All fields are optional

// ============================================
// PROPERTY-BASED TESTS
// ============================================

/**
 * Feature: marketplace-platform, Property 9: Listing edits preserve creation timestamp
 * 
 * Property: For any existing listing, editing any listing fields (title, description,
 * price) should update those fields while maintaining the original creation timestamp
 * unchanged.
 * 
 * Validates: Requirements 3.4
 * 
 * What this test verifies:
 * - Updates modify the specified fields
 * - createdAt timestamp is never changed
 * - updatedAt timestamp is updated to reflect the edit
 * - Authorization works (only owner can update)
 * - Partial updates work correctly
 * 
 * Why is this important?
 * - Users want to know when a listing was originally posted
 * - "Posted 3 days ago" should reflect original date, not last edit
 * - Prevents gaming "newest first" sorting by editing
 * - Maintains data integrity and historical accuracy
 */
describe('Property 9: Listing edits preserve creation timestamp', () => {
  it('should preserve createdAt timestamp when updating any fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        getValidListingArbitrary(),
        getValidUpdateDataArbitrary(),
        async (listingData, updateData) => {
          // Step 1: Create a listing
          const createdListing = await createListing(listingData);
          testListingIds.push(createdListing.id);

          // Store the original createdAt timestamp
          const originalCreatedAt = createdListing.createdAt;

          // Wait a small amount of time to ensure timestamps would differ
          // if createdAt was being updated
          await new Promise(resolve => setTimeout(resolve, 10));

          // Step 2: Update the listing
          const updatedListing = await updateListing(
            createdListing.id,
            listingData.sellerId, // Same user who created it
            updateData
          );

          // Step 3: Verify createdAt is preserved
          expect(updatedListing.createdAt).toEqual(originalCreatedAt);
          expect(updatedListing.createdAt.getTime()).toBe(originalCreatedAt.getTime());

          // Step 4: Verify updatedAt is different (it should be updated)
          // Note: updatedAt might be the same if the update happens very quickly,
          // but it should never be earlier than createdAt
          expect(updatedListing.updatedAt.getTime()).toBeGreaterThanOrEqual(
            originalCreatedAt.getTime()
          );

          // Step 5: Verify the update data was applied
          if (updateData.title !== undefined) {
            expect(updatedListing.title).toBe(updateData.title);
          }
          if (updateData.description !== undefined) {
            expect(updatedListing.description).toBe(updateData.description);
          }
          if (updateData.price !== undefined) {
            expect(updatedListing.price).toBe(updateData.price);
          }
          if (updateData.location !== undefined) {
            expect(updatedListing.location).toBe(updateData.location);
          }

          // Step 6: Verify immutable fields are unchanged
          expect(updatedListing.id).toBe(createdListing.id);
          expect(updatedListing.sellerId).toBe(createdListing.sellerId);

          // Step 7: Retrieve from database and verify again
          const retrievedListing = await prisma.listing.findUnique({
            where: { id: createdListing.id },
          });

          expect(retrievedListing).not.toBeNull();
          expect(retrievedListing!.createdAt).toEqual(originalCreatedAt);
          expect(retrievedListing!.createdAt.getTime()).toBe(originalCreatedAt.getTime());
        }
      ),
      { numRuns: 100 } // Run 100 iterations with random data
    );
  });

  it('should preserve createdAt even with multiple sequential updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        getValidListingArbitrary(),
        fc.array(getValidUpdateDataArbitrary(), { minLength: 2, maxLength: 5 }),
        async (listingData, updateSequence) => {
          // Step 1: Create a listing
          const createdListing = await createListing(listingData);
          testListingIds.push(createdListing.id);

          // Store the original createdAt timestamp
          const originalCreatedAt = createdListing.createdAt;

          // Step 2: Apply multiple updates in sequence
          let currentListing = createdListing;
          for (const updateData of updateSequence) {
            // Wait a bit between updates
            await new Promise(resolve => setTimeout(resolve, 10));

            currentListing = await updateListing(
              currentListing.id,
              listingData.sellerId,
              updateData
            );

            // Verify createdAt is still preserved after each update
            expect(currentListing.createdAt).toEqual(originalCreatedAt);
            expect(currentListing.createdAt.getTime()).toBe(originalCreatedAt.getTime());
          }

          // Step 3: Final verification from database
          const retrievedListing = await prisma.listing.findUnique({
            where: { id: createdListing.id },
          });

          expect(retrievedListing).not.toBeNull();
          expect(retrievedListing!.createdAt).toEqual(originalCreatedAt);
          expect(retrievedListing!.createdAt.getTime()).toBe(originalCreatedAt.getTime());
        }
      ),
      { numRuns: 50 } // Fewer runs since this test does multiple updates
    );
  });
});

/**
 * Authorization Tests
 * 
 * These tests verify that authorization works correctly:
 * - Only the owner can update their listing
 * - Other users cannot update listings they don't own
 */
describe('Listing update authorization', () => {
  it('should allow owner to update their listing', async () => {
    await fc.assert(
      fc.asyncProperty(
        getValidListingArbitrary(),
        getValidUpdateDataArbitrary(),
        async (listingData, updateData) => {
          // Create a listing
          const createdListing = await createListing(listingData);
          testListingIds.push(createdListing.id);

          // Owner should be able to update
          const updatedListing = await updateListing(
            createdListing.id,
            listingData.sellerId, // Same user who created it
            updateData
          );

          expect(updatedListing).toBeDefined();
          expect(updatedListing.id).toBe(createdListing.id);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject updates from non-owners', async () => {
    await fc.assert(
      fc.asyncProperty(
        getValidListingArbitrary(),
        getValidUpdateDataArbitrary(),
        async (listingData, updateData) => {
          // Create a listing
          const createdListing = await createListing(listingData);
          testListingIds.push(createdListing.id);

          // Try to update with a different user (third user in testUserIds)
          const otherUserId = testUserIds[2];

          // Should throw authorization error
          await expect(
            updateListing(createdListing.id, otherUserId, updateData)
          ).rejects.toThrow('Unauthorized');
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Edge case tests for update validation
 */
describe('Listing update validation', () => {
  it('should reject updates to non-existent listings', async () => {
    const fakeListingId = '00000000-0000-0000-0000-000000000000';
    const updateData = { title: 'New Title' };

    await expect(
      updateListing(fakeListingId, testUserIds[0], updateData)
    ).rejects.toThrow('not found');
  });

  it('should reject updates with invalid price', async () => {
    // Create a listing
    const listingData = {
      sellerId: testUserIds[0],
      title: 'Test Listing',
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

    // Try to update with invalid price
    await expect(
      updateListing(createdListing.id, testUserIds[0], { price: 0 })
    ).rejects.toThrow('Price must be greater than 0');

    await expect(
      updateListing(createdListing.id, testUserIds[0], { price: -10 })
    ).rejects.toThrow('Price must be greater than 0');
  });

  it('should reject updates with too many images', async () => {
    // Create a listing
    const listingData = {
      sellerId: testUserIds[0],
      title: 'Test Listing',
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

    // Try to update with too many images
    const tooManyImages = Array(11).fill('https://example.com/image.jpg');

    await expect(
      updateListing(createdListing.id, testUserIds[0], { images: tooManyImages })
    ).rejects.toThrow('Maximum 10 images allowed');
  });

  it('should reject updates with no images', async () => {
    // Create a listing
    const listingData = {
      sellerId: testUserIds[0],
      title: 'Test Listing',
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

    // Try to update with no images
    await expect(
      updateListing(createdListing.id, testUserIds[0], { images: [] })
    ).rejects.toThrow('At least one image is required');
  });

  it('should reject updates with invalid category', async () => {
    // Create a listing
    const listingData = {
      sellerId: testUserIds[0],
      title: 'Test Listing',
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

    // Try to update with invalid category
    const invalidCategoryId = '00000000-0000-0000-0000-000000000000';

    await expect(
      updateListing(createdListing.id, testUserIds[0], { categoryId: invalidCategoryId })
    ).rejects.toThrow('Invalid category ID');
  });
});
