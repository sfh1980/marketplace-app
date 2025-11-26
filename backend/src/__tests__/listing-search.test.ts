/**
 * Property-Based Tests for Listing Search
 * 
 * These tests verify the correctness property for search functionality:
 * - Property 12: Search returns matching listings
 * 
 * Why property-based testing for search?
 * - Tests across many random queries and listings
 * - Verifies search logic works correctly for ALL inputs
 * - Catches edge cases in search matching
 * - Ensures case-insensitive matching works properly
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { searchListings } from '../services/listingService';

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
        name: 'Test Electronics',
        slug: 'test-electronics-search-' + Date.now(),
        description: 'Test category for electronics',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Services',
        slug: 'test-services-search-' + Date.now(),
        description: 'Test category for services',
      },
    }),
  ]);

  testCategoryIds = categories.map((c) => c.id);

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: `test-search-seller-1-${Date.now()}@example.com`,
        username: `test_search_seller_1_${Date.now()}`,
        passwordHash: 'hashed_password',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: `test-search-seller-2-${Date.now()}@example.com`,
        username: `test_search_seller_2_${Date.now()}`,
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
 * Generate search-friendly words
 * 
 * Strategy: Create a pool of common words that we can use in both
 * listings and search queries to ensure matches
 */
const searchWords = [
  'laptop',
  'vintage',
  'desk',
  'lamp',
  'gaming',
  'professional',
  'service',
  'development',
  'design',
  'furniture',
  'electronics',
  'modern',
  'antique',
  'handmade',
  'custom',
  'quality',
  'premium',
  'affordable',
  'excellent',
  'condition',
];

/**
 * Generate a title containing specific words
 * 
 * This ensures we can create listings with known content
 * and then search for those words
 */
const titleWithWordsArbitrary = (words: string[]) =>
  fc.array(fc.constantFrom(...words), { minLength: 2, maxLength: 4 }).map((selectedWords) => {
    return selectedWords.join(' ');
  });

/**
 * Generate a description containing specific words
 */
const descriptionWithWordsArbitrary = (words: string[]) =>
  fc
    .array(fc.constantFrom(...words), { minLength: 3, maxLength: 8 })
    .map((selectedWords) => {
      return selectedWords.join(' ') + ' for sale';
    });

/**
 * Generate a listing with searchable content
 * 
 * This creates listings where we know what words are in the title/description
 * so we can test that searching for those words finds the listing
 * 
 * Note: This is a function that returns an arbitrary, so it can access
 * testUserIds and testCategoryIds after they're initialized
 */
const getSearchableListingArbitrary = () => fc.record({
  sellerId: fc.constantFrom(...testUserIds),
  title: titleWithWordsArbitrary(searchWords),
  description: descriptionWithWordsArbitrary(searchWords),
  price: fc.double({ min: 0.01, max: 1000, noNaN: true }).map((p) => Math.round(p * 100) / 100),
  listingType: fc.constantFrom('item' as const, 'service' as const),
  pricingType: fc.option(fc.constantFrom('fixed' as const, 'hourly' as const), { nil: undefined }),
  categoryId: fc.constantFrom(...testCategoryIds),
  images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 3 }),
  location: fc.constantFrom('New York, NY', 'Los Angeles, CA', 'Remote'),
  status: fc.constant('active' as const),
});

// ============================================
// PROPERTY-BASED TESTS
// ============================================

/**
 * Feature: marketplace-platform, Property 12: Search returns matching listings
 * 
 * Property: For any search query, all returned listings should contain the
 * query text in either their title or description (case-insensitive).
 * 
 * Validates: Requirements 4.2
 * 
 * What this test verifies:
 * - Search finds listings with query in title
 * - Search finds listings with query in description
 * - Search is case-insensitive
 * - Search only returns active listings
 * - All returned listings actually match the query
 */
describe('Property 12: Search returns matching listings', () => {
  it('should return only listings that contain the search query in title or description', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(getSearchableListingArbitrary(), { minLength: 5, maxLength: 10 }),
        fc.constantFrom(...searchWords), // Pick a word to search for
        async (listingsData, searchQuery) => {
          // Create all the listings
          const createdListings = await Promise.all(
            listingsData.map(async (data) => {
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

          // Perform the search
          const searchResult = await searchListings(searchQuery, {}, 100, 0);

          // Verify: All returned listings should contain the search query
          // in either title or description (case-insensitive)
          const queryLower = searchQuery.toLowerCase();

          for (const listing of searchResult.listings) {
            const titleLower = listing.title.toLowerCase();
            const descriptionLower = listing.description.toLowerCase();

            const matchesTitle = titleLower.includes(queryLower);
            const matchesDescription = descriptionLower.includes(queryLower);

            // At least one should match
            expect(matchesTitle || matchesDescription).toBe(true);
          }

          // Verify: Count the expected matches from our created listings
          const expectedMatches = createdListings.filter((listing) => {
            const titleLower = listing.title.toLowerCase();
            const descriptionLower = listing.description.toLowerCase();
            return (
              titleLower.includes(queryLower) || descriptionLower.includes(queryLower)
            );
          });

          // The search should find all matching listings we created
          // (Note: There might be other listings in the database from other tests,
          // so we check that our expected matches are a subset of the results)
          expect(searchResult.totalCount).toBeGreaterThanOrEqual(expectedMatches.length);

          // Verify: All results should have status 'active'
          for (const listing of searchResult.listings) {
            expect(listing.status).toBe('active');
          }

          return true;
        }
      ),
      { numRuns: 50 } // Run 50 iterations with random data
    );
  });

  it('should perform case-insensitive search', async () => {
    // Create a listing with known content
    const testListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Gaming Laptop',
        description: 'High performance gaming laptop with RGB keyboard',
        price: 1200.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/laptop.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    testListingIds.push(testListing.id);

    // Test different case variations
    const queries = ['laptop', 'LAPTOP', 'Laptop', 'LaPtOp', 'gaming', 'GAMING', 'Gaming'];

    for (const query of queries) {
      const result = await searchListings(query, {}, 100, 0);

      // Should find the listing regardless of case
      const found = result.listings.some((listing) => listing.id === testListing.id);
      expect(found).toBe(true);
    }
  });

  it('should search in both title and description', async () => {
    // Create listings with query in different fields
    const listingWithTitleMatch = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Vintage Desk Lamp',
        description: 'Beautiful brass lamp from the 1960s',
        price: 45.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/lamp.jpg'],
        location: 'Los Angeles, CA',
        status: 'active',
      },
    });

    const listingWithDescriptionMatch = await prisma.listing.create({
      data: {
        sellerId: testUserIds[1],
        title: 'Antique Furniture',
        description: 'Vintage desk from the Victorian era',
        price: 350.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/desk.jpg'],
        location: 'Chicago, IL',
        status: 'active',
      },
    });

    testListingIds.push(listingWithTitleMatch.id, listingWithDescriptionMatch.id);

    // Search for "vintage"
    const result = await searchListings('vintage', {}, 100, 0);

    // Should find both listings
    const foundIds = result.listings.map((l) => l.id);
    expect(foundIds).toContain(listingWithTitleMatch.id);
    expect(foundIds).toContain(listingWithDescriptionMatch.id);
  });

  it('should only return active listings', async () => {
    // Create listings with different statuses
    const activeListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Active Laptop',
        description: 'This laptop is available',
        price: 500.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/laptop1.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const soldListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Sold Laptop',
        description: 'This laptop has been sold',
        price: 500.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/laptop2.jpg'],
        location: 'New York, NY',
        status: 'sold',
      },
    });

    const deletedListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Deleted Laptop',
        description: 'This laptop was deleted',
        price: 500.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/laptop3.jpg'],
        location: 'New York, NY',
        status: 'deleted',
      },
    });

    testListingIds.push(activeListing.id, soldListing.id, deletedListing.id);

    // Search for "laptop"
    const result = await searchListings('laptop', {}, 100, 0);

    // Should only find the active listing
    const foundIds = result.listings.map((l) => l.id);
    expect(foundIds).toContain(activeListing.id);
    expect(foundIds).not.toContain(soldListing.id);
    expect(foundIds).not.toContain(deletedListing.id);

    // All results should have status 'active'
    for (const listing of result.listings) {
      expect(listing.status).toBe('active');
    }
  });

  it('should return empty results for non-matching queries', async () => {
    // Create a listing
    const listing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Gaming Laptop',
        description: 'High performance laptop',
        price: 1000.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/laptop.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    testListingIds.push(listing.id);

    // Search for something that doesn't exist
    const result = await searchListings('xyzabc123nonexistent', {}, 100, 0);

    // Should return empty results
    expect(result.listings).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('should handle pagination correctly', async () => {
    // Use a unique keyword to avoid interference from other tests
    const uniqueKeyword = `pagination-test-${Date.now()}`;
    
    // Create multiple listings with the unique keyword sequentially to avoid race conditions
    const createdListings = [];
    for (let i = 0; i < 25; i++) {
      const listing = await prisma.listing.create({
        data: {
          sellerId: testUserIds[i % 2],
          title: `${uniqueKeyword} Laptop ${i}`,
          description: `Description for laptop ${i}`,
          price: 100.0 + i,
          listingType: 'item',
          pricingType: null,
          categoryId: testCategoryIds[0],
          images: [`https://example.com/laptop${i}.jpg`],
          location: 'New York, NY',
          status: 'active',
        },
      });

      testListingIds.push(listing.id);
      createdListings.push(listing);
    }

    // Search with pagination using the unique keyword
    const page1 = await searchListings(uniqueKeyword, {}, 10, 0);
    const page2 = await searchListings(uniqueKeyword, {}, 10, 10);
    const page3 = await searchListings(uniqueKeyword, {}, 10, 20);

    // Verify pagination metadata
    expect(page1.limit).toBe(10);
    expect(page1.offset).toBe(0);
    expect(page1.listings.length).toBe(10); // Should have exactly 10
    expect(page1.totalCount).toBe(25); // Should have exactly 25 total
    expect(page1.hasMore).toBe(true);

    expect(page2.limit).toBe(10);
    expect(page2.offset).toBe(10);
    expect(page2.listings.length).toBe(10); // Should have exactly 10

    expect(page3.limit).toBe(10);
    expect(page3.offset).toBe(20);
    expect(page3.listings.length).toBe(5); // Should have remaining 5

    // Verify no duplicate listings across pages
    const page1Ids = page1.listings.map((l) => l.id);
    const page2Ids = page2.listings.map((l) => l.id);
    const page3Ids = page3.listings.map((l) => l.id);

    const allIds = [...page1Ids, ...page2Ids, ...page3Ids];
    const uniqueIds = new Set(allIds);

    expect(allIds.length).toBe(uniqueIds.size); // No duplicates
    expect(allIds.length).toBe(25); // Should have all 25 listings
  });

  it('should support filter-only search with empty query', async () => {
    // Create listings in different categories
    const electronicsListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Test Electronics',
        description: 'Test description',
        price: 100.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0], // Electronics
        images: ['https://example.com/test.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const servicesListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Test Service',
        description: 'Test description',
        price: 50.0,
        listingType: 'service',
        pricingType: 'hourly',
        categoryId: testCategoryIds[1], // Services
        images: ['https://example.com/test2.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    testListingIds.push(electronicsListing.id, servicesListing.id);

    // Search with empty query but with category filter
    const result = await searchListings('', { categoryId: testCategoryIds[0] }, 100, 0);

    // Should return listings matching the filter (even with empty query)
    const foundIds = result.listings.map((l) => l.id);
    expect(foundIds).toContain(electronicsListing.id);
    expect(foundIds).not.toContain(servicesListing.id);
    
    // All results should be in the filtered category
    for (const listing of result.listings) {
      expect(listing.categoryId).toBe(testCategoryIds[0]);
    }
  });

  it('should include seller and category information in results', async () => {
    // Create a listing
    const listing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Test Product',
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

    // Search for the listing
    const result = await searchListings('product', {}, 100, 0);

    // Should include seller and category information
    expect(result.listings.length).toBeGreaterThan(0);

    const foundListing = result.listings.find((l) => l.id === listing.id);
    expect(foundListing).toBeDefined();

    // Verify seller information is included
    expect(foundListing!.seller).toBeDefined();
    expect(foundListing!.seller.id).toBe(testUserIds[0]);
    expect(foundListing!.seller.username).toBeDefined();

    // Verify category information is included
    expect(foundListing!.category).toBeDefined();
    expect(foundListing!.category.id).toBe(testCategoryIds[0]);
    expect(foundListing!.category.name).toBeDefined();
  });
});
