/**
 * Property-Based Tests for Listing Deletion
 * 
 * These tests verify the correctness property for listing deletion:
 * - Property 11: Deleted listings are permanently removed
 * 
 * Why property-based testing for deletion?
 * - Tests across many random listings (not just a few examples)
 * - Verifies deletion works for all listing types (items and services)
 * - Ensures authorization works correctly
 * - Confirms listings are truly removed from database
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { createListing, deleteListing, getListingById, getAllListings } from '../services/listingService';

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
        name: 'Test Electronics Delete',
        slug: 'test-electronics-delete-' + Date.now(),
        description: 'Test category for electronics',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Services Delete',
        slug: 'test-services-delete-' + Date.now(),
        description: 'Test category for services',
      },
    }),
  ]);

  testCategoryIds = categories.map((c) => c.id);

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: `test-delete-seller-1-${Date.now()}@example.com`,
        username: `test_delete_seller_1_${Date.now()}`,
        passwordHash: 'hashed_password',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: `test-delete-seller-2-${Date.now()}@example.com`,
        username: `test_delete_seller_2_${Date.now()}`,
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

// ============================================
// PROPERTY-BASED TESTS
// ============================================

/**
 * Feature: marketplace-platform, Property 11: Deleted listings are permanently removed
 * 
 * Property: For any listing that is deleted, attempting to retrieve that listing
 * by ID should fail, and the listing should not appear in any search results or
 * user listing history.
 * 
 * Validates: Requirements 3.6
 * 
 * What this test verifies:
 * - Deleted listings cannot be retrieved by ID
 * - Deleted listings don't appear in search results
 * - Deletion is permanent (hard delete, not soft delete)
 * - Only the owner can delete their listing
 * - Database record is completely removed
 */
describe('Property 11: Deleted listings are permanently removed', () => {
  it('should permanently remove listing when deleted by owner', async () => {
    await fc.assert(
      fc.asyncProperty(getValidListingArbitrary(), async (listingData) => {
        // Step 1: Create a listing
        const createdListing = await createListing(listingData);
        testListingIds.push(createdListing.id);

        // Verify listing exists before deletion
        const listingBeforeDelete = await getListingById(createdListing.id);
        expect(listingBeforeDelete).not.toBeNull();
        expect(listingBeforeDelete!.id).toBe(createdListing.id);

        // Step 2: Delete the listing (as the owner)
        await deleteListing(createdListing.id, listingData.sellerId);

        // Remove from cleanup array since it's already deleted
        testListingIds = testListingIds.filter(id => id !== createdListing.id);

        // Step 3: Verify listing cannot be retrieved by ID
        const listingAfterDelete = await getListingById(createdListing.id);
        expect(listingAfterDelete).toBeNull();

        // Step 4: Verify listing doesn't appear in search results
        const allListings = await getAllListings(100, 0);
        const deletedListingInResults = allListings.listings.find(
          (listing) => listing.id === createdListing.id
        );
        expect(deletedListingInResults).toBeUndefined();

        // Step 5: Verify listing is completely removed from database
        const dbListing = await prisma.listing.findUnique({
          where: { id: createdListing.id },
        });
        expect(dbListing).toBeNull();

        return true;
      }),
      { numRuns: 100 } // Run 100 iterations with random data
    );
  });

  it('should prevent non-owners from deleting listings', async () => {
    await fc.assert(
      fc.asyncProperty(getValidListingArbitrary(), async (listingData) => {
        // Step 1: Create a listing
        const createdListing = await createListing(listingData);
        testListingIds.push(createdListing.id);

        // Step 2: Try to delete as a different user
        // Find a user ID that's not the owner
        const otherUserId = testUserIds.find(id => id !== listingData.sellerId);
        
        if (!otherUserId) {
          // Skip if we don't have another user (shouldn't happen with our setup)
          return true;
        }

        // Step 3: Attempt deletion should fail with authorization error
        await expect(
          deleteListing(createdListing.id, otherUserId)
        ).rejects.toThrow('Unauthorized');

        // Step 4: Verify listing still exists after failed deletion attempt
        const listingAfterFailedDelete = await getListingById(createdListing.id);
        expect(listingAfterFailedDelete).not.toBeNull();
        expect(listingAfterFailedDelete!.id).toBe(createdListing.id);

        // Step 5: Verify listing still in database
        const dbListing = await prisma.listing.findUnique({
          where: { id: createdListing.id },
        });
        expect(dbListing).not.toBeNull();

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should fail gracefully when deleting non-existent listing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // Generate random UUID that doesn't exist
        fc.constantFrom(...testUserIds), // Use valid user ID
        async (nonExistentId, userId) => {
          // Ensure the ID doesn't accidentally exist
          const existingListing = await prisma.listing.findUnique({
            where: { id: nonExistentId },
          });

          // Skip if the random ID happens to exist
          if (existingListing) {
            return true;
          }

          // Attempt to delete non-existent listing should fail
          await expect(
            deleteListing(nonExistentId, userId)
          ).rejects.toThrow('Listing not found');

          return true;
        }
      ),
      { numRuns: 50 } // Fewer runs since we're testing error cases
    );
  });
});

/**
 * Additional edge case tests
 * 
 * These tests verify specific deletion scenarios
 */
describe('Listing deletion edge cases', () => {
  it('should handle deletion of item listings', async () => {
    // Create an item listing
    const itemData = {
      sellerId: testUserIds[0],
      title: 'Test Item for Deletion',
      description: 'This item will be deleted',
      price: 50.0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: ['https://example.com/image.jpg'],
      location: 'New York, NY',
    };

    const createdItem = await createListing(itemData);
    testListingIds.push(createdItem.id);

    // Delete the item
    await deleteListing(createdItem.id, testUserIds[0]);
    testListingIds = testListingIds.filter(id => id !== createdItem.id);

    // Verify it's gone
    const deletedItem = await getListingById(createdItem.id);
    expect(deletedItem).toBeNull();
  });

  it('should handle deletion of service listings', async () => {
    // Create a service listing
    const serviceData = {
      sellerId: testUserIds[0],
      title: 'Test Service for Deletion',
      description: 'This service will be deleted',
      price: 75.0,
      listingType: 'service' as const,
      pricingType: 'hourly' as const,
      categoryId: testCategoryIds[1],
      images: ['https://example.com/service.jpg'],
      location: 'Remote',
    };

    const createdService = await createListing(serviceData);
    testListingIds.push(createdService.id);

    // Delete the service
    await deleteListing(createdService.id, testUserIds[0]);
    testListingIds = testListingIds.filter(id => id !== createdService.id);

    // Verify it's gone
    const deletedService = await getListingById(createdService.id);
    expect(deletedService).toBeNull();
  });

  it('should handle deletion of listings with multiple images', async () => {
    // Create a listing with multiple images
    const multiImageData = {
      sellerId: testUserIds[0],
      title: 'Multi Image Listing',
      description: 'Listing with many images',
      price: 100.0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
        'https://example.com/image4.jpg',
        'https://example.com/image5.jpg',
      ],
      location: 'Los Angeles, CA',
    };

    const createdListing = await createListing(multiImageData);
    testListingIds.push(createdListing.id);

    // Delete the listing
    await deleteListing(createdListing.id, testUserIds[0]);
    testListingIds = testListingIds.filter(id => id !== createdListing.id);

    // Verify it's gone
    const deletedListing = await getListingById(createdListing.id);
    expect(deletedListing).toBeNull();
  });

  it('should not affect other listings when one is deleted', async () => {
    // Create two listings
    const listing1Data = {
      sellerId: testUserIds[0],
      title: 'Listing 1',
      description: 'First listing',
      price: 50.0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: ['https://example.com/image1.jpg'],
      location: 'New York, NY',
    };

    const listing2Data = {
      sellerId: testUserIds[0],
      title: 'Listing 2',
      description: 'Second listing',
      price: 75.0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: ['https://example.com/image2.jpg'],
      location: 'Los Angeles, CA',
    };

    const listing1 = await createListing(listing1Data);
    const listing2 = await createListing(listing2Data);
    testListingIds.push(listing1.id, listing2.id);

    // Delete only listing1
    await deleteListing(listing1.id, testUserIds[0]);
    testListingIds = testListingIds.filter(id => id !== listing1.id);

    // Verify listing1 is gone
    const deletedListing = await getListingById(listing1.id);
    expect(deletedListing).toBeNull();

    // Verify listing2 still exists
    const remainingListing = await getListingById(listing2.id);
    expect(remainingListing).not.toBeNull();
    expect(remainingListing!.id).toBe(listing2.id);
    expect(remainingListing!.title).toBe('Listing 2');
  });
});
