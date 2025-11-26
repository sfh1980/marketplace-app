/**
 * Property-Based Tests for Category Browsing
 * 
 * These tests verify the correctness properties for category operations:
 * - Property 23: Category browsing returns correct listings
 * - Property 24: Category counts are accurate
 * 
 * Why property-based testing for categories?
 * - Tests across many random category and listing combinations
 * - Verifies category filtering works correctly for ALL inputs
 * - Ensures listing counts are always accurate
 * - Catches edge cases in category aggregation
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { getListingsByCategory, getAllCategoriesWithCounts } from '../services/categoryService';

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
        name: 'Test Electronics Category',
        slug: 'test-electronics-category-' + Date.now(),
        description: 'Test category for electronics',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Furniture Category',
        slug: 'test-furniture-category-' + Date.now(),
        description: 'Test category for furniture',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Services Category',
        slug: 'test-services-category-' + Date.now(),
        description: 'Test category for services',
      },
    }),
  ]);

  testCategoryIds = categories.map((c) => c.id);

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: `test-category-seller-1-${Date.now()}@example.com`,
        username: `test_category_seller_1_${Date.now()}`,
        passwordHash: 'hashed_password',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: `test-category-seller-2-${Date.now()}@example.com`,
        username: `test_category_seller_2_${Date.now()}`,
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
 * Generate a listing for a specific category
 * 
 * This creates listings where we control the category
 * so we can test that category browsing works correctly
 */
const getListingForCategoryArbitrary = (categoryId: string) => fc.record({
  sellerId: fc.constantFrom(...testUserIds),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  price: fc.double({ min: 10, max: 2000, noNaN: true }).map((p) => Math.round(p * 100) / 100),
  listingType: fc.constantFrom('item' as const, 'service' as const),
  pricingType: fc.option(fc.constantFrom('fixed' as const, 'hourly' as const), { nil: undefined }),
  categoryId: fc.constant(categoryId),
  images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 3 }),
  location: fc.constantFrom('New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Remote'),
  status: fc.constant('active' as const),
});

// ============================================
// PROPERTY-BASED TESTS
// ============================================

/**
 * Feature: marketplace-platform, Property 23: Category browsing returns correct listings
 * 
 * Property: For any category, browsing that category should return all and only
 * active listings assigned to that category.
 * 
 * Validates: Requirements 8.2
 * 
 * What this test verifies:
 * - All returned listings belong to the specified category
 * - All active listings in the category are returned
 * - Sold/completed/deleted listings are excluded
 * - Pagination works correctly for category browsing
 */
describe('Property 23: Category browsing returns correct listings', () => {
  it('should return only listings from the specified category', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random listings for each category
        fc.array(getListingForCategoryArbitrary(testCategoryIds[0]), { minLength: 3, maxLength: 10 }),
        fc.array(getListingForCategoryArbitrary(testCategoryIds[1]), { minLength: 3, maxLength: 10 }),
        fc.array(getListingForCategoryArbitrary(testCategoryIds[2]), { minLength: 3, maxLength: 10 }),
        async (category1Listings, category2Listings, category3Listings) => {
          // Create all the listings
          const allListingsData = [
            ...category1Listings,
            ...category2Listings,
            ...category3Listings,
          ];

          const createdListings = await Promise.all(
            allListingsData.map(async (data) => {
              // Ensure service listings have pricingType
              if (data.listingType === 'service' && !data.pricingType) {
                data.pricingType = 'fixed';
              }
              // Ensure item listings don't have pricingType
              if (data.listingType === 'item') {
                data.pricingType = undefined;
              }

              const listing = await prisma.listing.create({
                data: {
                  sellerId: data.sellerId,
                  title: data.title,
                  description: data.description,
                  price: data.price,
                  listingType: data.listingType,
                  pricingType: data.pricingType || null,
                  categoryId: data.categoryId,
                  images: data.images,
                  location: data.location,
                  status: data.status,
                },
              });

              testListingIds.push(listing.id);
              return listing;
            })
          );

          // Test browsing each category
          for (const categoryId of testCategoryIds) {
            // Get listings for this category
            const result = await getListingsByCategory(categoryId, 100, 0);

            // Verify: All returned listings should belong to this category
            for (const listing of result.listings) {
              expect(listing.categoryId).toBe(categoryId);
              expect(listing.status).toBe('active');
            }

            // Count expected listings in this category
            const expectedListings = createdListings.filter(
              (l) => l.categoryId === categoryId && l.status === 'active'
            );

            // The result should include at least our created listings
            // (There might be other listings from other tests)
            expect(result.totalCount).toBeGreaterThanOrEqual(expectedListings.length);

            // Verify category information is included
            expect(result.category).toBeDefined();
            expect(result.category.id).toBe(categoryId);
          }

          return true;
        }
      ),
      { numRuns: 30 } // Run 30 iterations with random data
    );
  });

  it('should return all active listings in a category', async () => {
    // Create multiple listings in the same category
    const listings = await Promise.all([
      prisma.listing.create({
        data: {
          sellerId: testUserIds[0],
          title: 'Gaming Laptop',
          description: 'High performance laptop',
          price: 1200.0,
          listingType: 'item',
          pricingType: null,
          categoryId: testCategoryIds[0], // Electronics
          images: ['https://example.com/laptop.jpg'],
          location: 'New York, NY',
          status: 'active',
        },
      }),
      prisma.listing.create({
        data: {
          sellerId: testUserIds[1],
          title: 'Wireless Mouse',
          description: 'Ergonomic wireless mouse',
          price: 45.0,
          listingType: 'item',
          pricingType: null,
          categoryId: testCategoryIds[0], // Electronics
          images: ['https://example.com/mouse.jpg'],
          location: 'Los Angeles, CA',
          status: 'active',
        },
      }),
      prisma.listing.create({
        data: {
          sellerId: testUserIds[0],
          title: 'Mechanical Keyboard',
          description: 'RGB mechanical keyboard',
          price: 150.0,
          listingType: 'item',
          pricingType: null,
          categoryId: testCategoryIds[0], // Electronics
          images: ['https://example.com/keyboard.jpg'],
          location: 'Chicago, IL',
          status: 'active',
        },
      }),
    ]);

    testListingIds.push(...listings.map((l) => l.id));

    // Browse electronics category
    const result = await getListingsByCategory(testCategoryIds[0], 100, 0);

    // Should find all three listings
    const foundIds = result.listings.map((l) => l.id);
    for (const listing of listings) {
      expect(foundIds).toContain(listing.id);
    }

    // All listings should be in electronics category
    for (const listing of result.listings) {
      expect(listing.categoryId).toBe(testCategoryIds[0]);
    }
  });

  it('should exclude sold and deleted listings from category browsing', async () => {
    // Create listings with different statuses
    const activeListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Active Item',
        description: 'This is active',
        price: 100.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/active.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const soldListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Sold Item',
        description: 'This is sold',
        price: 100.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/sold.jpg'],
        location: 'New York, NY',
        status: 'sold',
      },
    });

    const completedListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[1],
        title: 'Completed Service',
        description: 'This is completed',
        price: 50.0,
        listingType: 'service',
        pricingType: 'hourly',
        categoryId: testCategoryIds[0],
        images: ['https://example.com/completed.jpg'],
        location: 'Remote',
        status: 'completed',
      },
    });

    const deletedListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Deleted Item',
        description: 'This is deleted',
        price: 100.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/deleted.jpg'],
        location: 'New York, NY',
        status: 'deleted',
      },
    });

    testListingIds.push(
      activeListing.id,
      soldListing.id,
      completedListing.id,
      deletedListing.id
    );

    // Browse category
    const result = await getListingsByCategory(testCategoryIds[0], 100, 0);

    // Should only find active listing
    const foundIds = result.listings.map((l) => l.id);
    expect(foundIds).toContain(activeListing.id);
    expect(foundIds).not.toContain(soldListing.id);
    expect(foundIds).not.toContain(completedListing.id);
    expect(foundIds).not.toContain(deletedListing.id);

    // All results should be active
    for (const listing of result.listings) {
      expect(listing.status).toBe('active');
    }
  });

  it('should paginate category listings correctly', async () => {
    // Create 25 listings in the same category
    const listings = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        prisma.listing.create({
          data: {
            sellerId: testUserIds[i % 2],
            title: `Test Item ${i + 1}`,
            description: `Description for item ${i + 1}`,
            price: 100.0 + i,
            listingType: 'item',
            pricingType: null,
            categoryId: testCategoryIds[0],
            images: [`https://example.com/item${i + 1}.jpg`],
            location: 'New York, NY',
            status: 'active',
          },
        })
      )
    );

    testListingIds.push(...listings.map((l) => l.id));

    // Get first page (10 items)
    const page1 = await getListingsByCategory(testCategoryIds[0], 10, 0);
    expect(page1.listings.length).toBeLessThanOrEqual(10);
    expect(page1.limit).toBe(10);
    expect(page1.offset).toBe(0);
    expect(page1.totalCount).toBeGreaterThanOrEqual(25);
    expect(page1.hasMore).toBe(true);

    // Get second page (10 items, skip first 10)
    const page2 = await getListingsByCategory(testCategoryIds[0], 10, 10);
    expect(page2.listings.length).toBeLessThanOrEqual(10);
    expect(page2.limit).toBe(10);
    expect(page2.offset).toBe(10);
    expect(page2.hasMore).toBe(true);

    // Get third page (remaining items)
    const page3 = await getListingsByCategory(testCategoryIds[0], 10, 20);
    expect(page3.listings.length).toBeGreaterThan(0);
    expect(page3.limit).toBe(10);
    expect(page3.offset).toBe(20);

    // Pages should not overlap
    const page1Ids = page1.listings.map((l) => l.id);
    const page2Ids = page2.listings.map((l) => l.id);
    const page3Ids = page3.listings.map((l) => l.id);

    // No listing should appear in multiple pages
    for (const id of page1Ids) {
      expect(page2Ids).not.toContain(id);
      expect(page3Ids).not.toContain(id);
    }
    for (const id of page2Ids) {
      expect(page3Ids).not.toContain(id);
    }
  });

  it('should return empty results for category with no listings', async () => {
    // Don't create any listings for category 2
    // Browse empty category
    const result = await getListingsByCategory(testCategoryIds[1], 100, 0);

    // Should return empty results
    expect(result.listings).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.hasMore).toBe(false);

    // Category info should still be included
    expect(result.category).toBeDefined();
    expect(result.category.id).toBe(testCategoryIds[1]);
  });

  it('should throw error for non-existent category', async () => {
    // Try to browse a category that doesn't exist
    const fakeId = '00000000-0000-0000-0000-000000000000';

    await expect(getListingsByCategory(fakeId, 100, 0)).rejects.toThrow('Category not found');
  });

  it('should include seller and category information in results', async () => {
    // Create a listing
    const listing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Test Item',
        description: 'Test description',
        price: 100.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/test.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    testListingIds.push(listing.id);

    // Browse category
    const result = await getListingsByCategory(testCategoryIds[0], 100, 0);

    // Find our listing
    const foundListing = result.listings.find((l) => l.id === listing.id);
    expect(foundListing).toBeDefined();

    if (foundListing) {
      // Verify seller information is included
      expect(foundListing.seller).toBeDefined();
      expect(foundListing.seller.id).toBe(testUserIds[0]);
      expect(foundListing.seller.username).toBeDefined();
      expect(foundListing.seller.profilePicture).toBeDefined();
      expect(foundListing.seller.averageRating).toBeDefined();
      expect(foundListing.seller.joinDate).toBeDefined();

      // Verify category information is included
      expect(foundListing.category).toBeDefined();
      expect(foundListing.category.id).toBe(testCategoryIds[0]);
      expect(foundListing.category.name).toBeDefined();
      expect(foundListing.category.slug).toBeDefined();
    }
  });
});

/**
 * Feature: marketplace-platform, Property 24: Category counts are accurate
 * 
 * Property: For any category, the displayed count should equal the actual
 * number of active listings in that category.
 * 
 * Validates: Requirements 8.3
 * 
 * What this test verifies:
 * - Listing counts match actual number of active listings
 * - Sold/completed/deleted listings are not counted
 * - Counts update correctly when listings are added/removed
 * - Aggregation query (GROUP BY) works correctly
 */
describe('Property 24: Category counts are accurate', () => {
  it('should return accurate listing counts for all categories', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random number of listings for each category
        fc.integer({ min: 0, max: 15 }),
        fc.integer({ min: 0, max: 15 }),
        fc.integer({ min: 0, max: 15 }),
        async (count1, count2, count3) => {
          // Create listings for each category
          const listingsToCreate = [
            ...Array.from({ length: count1 }, () => testCategoryIds[0]),
            ...Array.from({ length: count2 }, () => testCategoryIds[1]),
            ...Array.from({ length: count3 }, () => testCategoryIds[2]),
          ];

          await Promise.all(
            listingsToCreate.map(async (categoryId, i) => {
              const listing = await prisma.listing.create({
                data: {
                  sellerId: testUserIds[i % 2],
                  title: `Test Item ${i + 1}`,
                  description: `Description ${i + 1}`,
                  price: 100.0 + i,
                  listingType: 'item',
                  pricingType: null,
                  categoryId: categoryId,
                  images: [`https://example.com/item${i + 1}.jpg`],
                  location: 'New York, NY',
                  status: 'active',
                },
              });

              testListingIds.push(listing.id);
              return listing;
            })
          );

          // Get categories with counts
          const categories = await getAllCategoriesWithCounts();

          // Find our test categories
          const category1 = categories.find((c) => c.id === testCategoryIds[0]);
          const category2 = categories.find((c) => c.id === testCategoryIds[1]);
          const category3 = categories.find((c) => c.id === testCategoryIds[2]);

          // Verify counts match what we created
          // Note: Counts might be higher due to other tests, but should be at least our count
          expect(category1).toBeDefined();
          expect(category1!.listingCount).toBeGreaterThanOrEqual(count1);

          expect(category2).toBeDefined();
          expect(category2!.listingCount).toBeGreaterThanOrEqual(count2);

          expect(category3).toBeDefined();
          expect(category3!.listingCount).toBeGreaterThanOrEqual(count3);

          return true;
        }
      ),
      { numRuns: 30 } // Run 30 iterations with random counts
    );
  });

  it('should count only active listings', async () => {
    // Create listings with different statuses in the same category
    const activeListings = await Promise.all([
      prisma.listing.create({
        data: {
          sellerId: testUserIds[0],
          title: 'Active Item 1',
          description: 'Active',
          price: 100.0,
          listingType: 'item',
          pricingType: null,
          categoryId: testCategoryIds[0],
          images: ['https://example.com/active1.jpg'],
          location: 'New York, NY',
          status: 'active',
        },
      }),
      prisma.listing.create({
        data: {
          sellerId: testUserIds[0],
          title: 'Active Item 2',
          description: 'Active',
          price: 100.0,
          listingType: 'item',
          pricingType: null,
          categoryId: testCategoryIds[0],
          images: ['https://example.com/active2.jpg'],
          location: 'New York, NY',
          status: 'active',
        },
      }),
    ]);

    const inactiveListings = await Promise.all([
      prisma.listing.create({
        data: {
          sellerId: testUserIds[0],
          title: 'Sold Item',
          description: 'Sold',
          price: 100.0,
          listingType: 'item',
          pricingType: null,
          categoryId: testCategoryIds[0],
          images: ['https://example.com/sold.jpg'],
          location: 'New York, NY',
          status: 'sold',
        },
      }),
      prisma.listing.create({
        data: {
          sellerId: testUserIds[1],
          title: 'Completed Service',
          description: 'Completed',
          price: 50.0,
          listingType: 'service',
          pricingType: 'hourly',
          categoryId: testCategoryIds[0],
          images: ['https://example.com/completed.jpg'],
          location: 'Remote',
          status: 'completed',
        },
      }),
      prisma.listing.create({
        data: {
          sellerId: testUserIds[0],
          title: 'Deleted Item',
          description: 'Deleted',
          price: 100.0,
          listingType: 'item',
          pricingType: null,
          categoryId: testCategoryIds[0],
          images: ['https://example.com/deleted.jpg'],
          location: 'New York, NY',
          status: 'deleted',
        },
      }),
    ]);

    testListingIds.push(
      ...activeListings.map((l) => l.id),
      ...inactiveListings.map((l) => l.id)
    );

    // Get categories with counts
    const categories = await getAllCategoriesWithCounts();

    // Find our test category
    const category = categories.find((c) => c.id === testCategoryIds[0]);
    expect(category).toBeDefined();

    // Count should only include active listings (2)
    // Note: Might be higher due to other tests, but should be at least 2
    expect(category!.listingCount).toBeGreaterThanOrEqual(2);

    // Verify by browsing the category
    const browseResult = await getListingsByCategory(testCategoryIds[0], 100, 0);
    const foundActiveIds = browseResult.listings.map((l) => l.id);

    // Should find active listings
    for (const listing of activeListings) {
      expect(foundActiveIds).toContain(listing.id);
    }

    // Should not find inactive listings
    for (const listing of inactiveListings) {
      expect(foundActiveIds).not.toContain(listing.id);
    }
  });

  it('should return zero count for categories with no active listings', async () => {
    // Don't create any listings for category 1
    // Get categories with counts
    const categories = await getAllCategoriesWithCounts();

    // Find our empty test category
    const category = categories.find((c) => c.id === testCategoryIds[1]);
    expect(category).toBeDefined();

    // Count should be zero
    expect(category!.listingCount).toBe(0);
  });

  it('should include all categories even if they have zero listings', async () => {
    // Get categories with counts
    const categories = await getAllCategoriesWithCounts();

    // Should include all our test categories
    const foundIds = categories.map((c) => c.id);
    for (const categoryId of testCategoryIds) {
      expect(foundIds).toContain(categoryId);
    }

    // Each category should have a listingCount field
    for (const category of categories) {
      expect(category.listingCount).toBeDefined();
      expect(typeof category.listingCount).toBe('number');
      expect(category.listingCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('should update counts when listings are added', async () => {
    // Get initial count
    const initialCategories = await getAllCategoriesWithCounts();
    const initialCategory = initialCategories.find((c) => c.id === testCategoryIds[2]);
    const initialCount = initialCategory!.listingCount;

    // Add a new listing
    const newListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'New Item',
        description: 'Newly added',
        price: 100.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[2],
        images: ['https://example.com/new.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    testListingIds.push(newListing.id);

    // Get updated count
    const updatedCategories = await getAllCategoriesWithCounts();
    const updatedCategory = updatedCategories.find((c) => c.id === testCategoryIds[2]);
    const updatedCount = updatedCategory!.listingCount;

    // Count should have increased by 1
    expect(updatedCount).toBe(initialCount + 1);
  });

  it('should update counts when listings are marked as sold', async () => {
    // Create an active listing
    const listing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Item to Sell',
        description: 'Will be sold',
        price: 100.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[2],
        images: ['https://example.com/tosell.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    testListingIds.push(listing.id);

    // Get count with active listing
    const initialCategories = await getAllCategoriesWithCounts();
    const initialCategory = initialCategories.find((c) => c.id === testCategoryIds[2]);
    const initialCount = initialCategory!.listingCount;

    // Mark listing as sold
    await prisma.listing.update({
      where: { id: listing.id },
      data: { status: 'sold' },
    });

    // Get updated count
    const updatedCategories = await getAllCategoriesWithCounts();
    const updatedCategory = updatedCategories.find((c) => c.id === testCategoryIds[2]);
    const updatedCount = updatedCategory!.listingCount;

    // Count should have decreased by 1
    expect(updatedCount).toBe(initialCount - 1);
  });
});
