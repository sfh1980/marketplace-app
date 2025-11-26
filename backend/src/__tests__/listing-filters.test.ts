/**
 * Property-Based Tests for Listing Filters
 * 
 * These tests verify the correctness property for search filtering:
 * - Property 13: Filters return only matching results
 * 
 * Why property-based testing for filters?
 * - Tests across many random filter combinations
 * - Verifies filter logic works correctly for ALL inputs
 * - Catches edge cases in filter matching
 * - Ensures AND logic works properly (all filters must match)
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { searchListings, SearchFilters } from '../services/listingService';

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
        name: 'Test Electronics Filters',
        slug: 'test-electronics-filters-' + Date.now(),
        description: 'Test category for electronics',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Furniture Filters',
        slug: 'test-furniture-filters-' + Date.now(),
        description: 'Test category for furniture',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Services Filters',
        slug: 'test-services-filters-' + Date.now(),
        description: 'Test category for services',
      },
    }),
  ]);

  testCategoryIds = categories.map((c) => c.id);

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: `test-filter-seller-1-${Date.now()}@example.com`,
        username: `test_filter_seller_1_${Date.now()}`,
        passwordHash: 'hashed_password',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: `test-filter-seller-2-${Date.now()}@example.com`,
        username: `test_filter_seller_2_${Date.now()}`,
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
 * Generate a listing with known properties for filtering
 * 
 * This creates listings where we control all the filterable fields
 * so we can test that filters work correctly
 */
const getFilterableListingArbitrary = () => fc.record({
  sellerId: fc.constantFrom(...testUserIds),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  price: fc.double({ min: 10, max: 2000, noNaN: true }).map((p) => Math.round(p * 100) / 100),
  listingType: fc.constantFrom('item' as const, 'service' as const),
  pricingType: fc.option(fc.constantFrom('fixed' as const, 'hourly' as const), { nil: undefined }),
  categoryId: fc.constantFrom(...testCategoryIds),
  images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 3 }),
  location: fc.constantFrom('New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Remote'),
  status: fc.constant('active' as const),
});

// ============================================
// PROPERTY-BASED TESTS
// ============================================

/**
 * Feature: marketplace-platform, Property 13: Filters return only matching results
 * 
 * Property: For any combination of filters (category, listing type, price range, location),
 * all returned listings should match ALL the specified filter criteria (AND logic).
 * 
 * Validates: Requirements 4.3, 4.4, 4.5, 4.6
 * 
 * What this test verifies:
 * - Category filter returns only listings in that category
 * - Listing type filter returns only items or services
 * - Price range filter returns only listings within range
 * - Location filter returns only listings matching location
 * - Multiple filters work together with AND logic
 * - All returned listings match ALL specified filters
 */
describe('Property 13: Filters return only matching results', () => {
  it('should return only listings that match all specified filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(getFilterableListingArbitrary(), { minLength: 10, maxLength: 20 }),
        fc.record({
          // Generate random filter combinations
          useCategoryFilter: fc.boolean(),
          useTypeFilter: fc.boolean(),
          usePriceFilter: fc.boolean(),
          useLocationFilter: fc.boolean(),
        }),
        async (listingsData, filterConfig) => {
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

          // Build filters based on configuration
          const filters: SearchFilters = {};
          
          if (filterConfig.useCategoryFilter && createdListings.length > 0) {
            // Pick a category from our created listings
            filters.categoryId = createdListings[0].categoryId;
          }
          
          if (filterConfig.useTypeFilter && createdListings.length > 0) {
            // Pick a type from our created listings
            filters.listingType = createdListings[0].listingType as 'item' | 'service';
          }
          
          if (filterConfig.usePriceFilter && createdListings.length > 0) {
            // Set price range based on created listings
            const prices = createdListings.map(l => l.price).sort((a, b) => a - b);
            const minPrice = prices[Math.floor(prices.length * 0.25)]; // 25th percentile
            const maxPrice = prices[Math.floor(prices.length * 0.75)]; // 75th percentile
            filters.minPrice = minPrice;
            filters.maxPrice = maxPrice;
          }
          
          if (filterConfig.useLocationFilter && createdListings.length > 0) {
            // Pick a location from our created listings
            filters.location = createdListings[0].location;
          }

          // Perform the search with filters (empty query to test filters only)
          const searchResult = await searchListings('', filters, 100, 0);

          // Verify: All returned listings should match ALL specified filters
          for (const listing of searchResult.listings) {
            // Verify category filter
            if (filters.categoryId) {
              expect(listing.categoryId).toBe(filters.categoryId);
            }
            
            // Verify listing type filter
            if (filters.listingType) {
              expect(listing.listingType).toBe(filters.listingType);
            }
            
            // Verify price range filter
            if (filters.minPrice !== undefined) {
              expect(listing.price).toBeGreaterThanOrEqual(filters.minPrice);
            }
            if (filters.maxPrice !== undefined) {
              expect(listing.price).toBeLessThanOrEqual(filters.maxPrice);
            }
            
            // Verify location filter (case-insensitive partial match)
            if (filters.location) {
              const listingLocationLower = listing.location.toLowerCase();
              const filterLocationLower = filters.location.toLowerCase();
              expect(listingLocationLower).toContain(filterLocationLower);
            }
            
            // Verify status is always active
            expect(listing.status).toBe('active');
          }

          // Count expected matches from our created listings
          const expectedMatches = createdListings.filter((listing) => {
            // Check category filter
            if (filters.categoryId && listing.categoryId !== filters.categoryId) {
              return false;
            }
            
            // Check listing type filter
            if (filters.listingType && listing.listingType !== filters.listingType) {
              return false;
            }
            
            // Check price range filter
            if (filters.minPrice !== undefined && listing.price < filters.minPrice) {
              return false;
            }
            if (filters.maxPrice !== undefined && listing.price > filters.maxPrice) {
              return false;
            }
            
            // Check location filter
            if (filters.location) {
              const listingLocationLower = listing.location.toLowerCase();
              const filterLocationLower = filters.location.toLowerCase();
              if (!listingLocationLower.includes(filterLocationLower)) {
                return false;
              }
            }
            
            return true;
          });

          // The search should find at least as many matches as we expect
          // (There might be other listings in the database from other tests)
          expect(searchResult.totalCount).toBeGreaterThanOrEqual(expectedMatches.length);

          return true;
        }
      ),
      { numRuns: 50 } // Run 50 iterations with random data
    );
  });

  it('should filter by category correctly', async () => {
    // Create listings in different categories
    const electronicsListing = await prisma.listing.create({
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
    });

    const furnitureListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Vintage Desk',
        description: 'Beautiful wooden desk',
        price: 350.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[1], // Furniture
        images: ['https://example.com/desk.jpg'],
        location: 'Los Angeles, CA',
        status: 'active',
      },
    });

    testListingIds.push(electronicsListing.id, furnitureListing.id);

    // Filter by electronics category
    const result = await searchListings('', { categoryId: testCategoryIds[0] }, 100, 0);

    // Should only find electronics listing
    const foundIds = result.listings.map((l) => l.id);
    expect(foundIds).toContain(electronicsListing.id);
    expect(foundIds).not.toContain(furnitureListing.id);

    // All results should be in electronics category
    for (const listing of result.listings) {
      expect(listing.categoryId).toBe(testCategoryIds[0]);
    }
  });

  it('should filter by listing type correctly', async () => {
    // Create item and service listings
    const itemListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Gaming Laptop',
        description: 'High performance laptop',
        price: 1200.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/laptop.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const serviceListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[1],
        title: 'Web Development',
        description: 'Professional web development services',
        price: 75.0,
        listingType: 'service',
        pricingType: 'hourly',
        categoryId: testCategoryIds[2], // Services
        images: ['https://example.com/webdev.jpg'],
        location: 'Remote',
        status: 'active',
      },
    });

    testListingIds.push(itemListing.id, serviceListing.id);

    // Filter by items only
    const itemResult = await searchListings('', { listingType: 'item' }, 100, 0);

    // Should only find item listing
    const itemIds = itemResult.listings.map((l) => l.id);
    expect(itemIds).toContain(itemListing.id);
    expect(itemIds).not.toContain(serviceListing.id);

    // All results should be items
    for (const listing of itemResult.listings) {
      expect(listing.listingType).toBe('item');
    }

    // Filter by services only
    const serviceResult = await searchListings('', { listingType: 'service' }, 100, 0);

    // Should only find service listing
    const serviceIds = serviceResult.listings.map((l) => l.id);
    expect(serviceIds).toContain(serviceListing.id);
    expect(serviceIds).not.toContain(itemListing.id);

    // All results should be services
    for (const listing of serviceResult.listings) {
      expect(listing.listingType).toBe('service');
    }
  });

  it('should filter by price range correctly', async () => {
    // Create listings with different prices
    const cheapListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Cheap Item',
        description: 'Affordable item',
        price: 25.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/cheap.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const midPriceListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Mid Price Item',
        description: 'Moderately priced item',
        price: 150.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/mid.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const expensiveListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Expensive Item',
        description: 'Premium item',
        price: 1500.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/expensive.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    testListingIds.push(cheapListing.id, midPriceListing.id, expensiveListing.id);

    // Filter by price range: $100 - $500
    const result = await searchListings('', { minPrice: 100, maxPrice: 500 }, 100, 0);

    // Should only find mid-price listing
    const foundIds = result.listings.map((l) => l.id);
    expect(foundIds).toContain(midPriceListing.id);
    expect(foundIds).not.toContain(cheapListing.id);
    expect(foundIds).not.toContain(expensiveListing.id);

    // All results should be within price range
    for (const listing of result.listings) {
      expect(listing.price).toBeGreaterThanOrEqual(100);
      expect(listing.price).toBeLessThanOrEqual(500);
    }
  });

  it('should filter by minimum price only', async () => {
    // Create listings with different prices
    const cheapListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Cheap Item',
        description: 'Affordable item',
        price: 25.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/cheap.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const expensiveListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Expensive Item',
        description: 'Premium item',
        price: 1500.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/expensive.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    testListingIds.push(cheapListing.id, expensiveListing.id);

    // Filter by minimum price: $100
    const result = await searchListings('', { minPrice: 100 }, 100, 0);

    // Should only find expensive listing
    const foundIds = result.listings.map((l) => l.id);
    expect(foundIds).toContain(expensiveListing.id);
    expect(foundIds).not.toContain(cheapListing.id);

    // All results should be at least $100
    for (const listing of result.listings) {
      expect(listing.price).toBeGreaterThanOrEqual(100);
    }
  });

  it('should filter by maximum price only', async () => {
    // Create listings with different prices
    const cheapListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Cheap Item',
        description: 'Affordable item',
        price: 25.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/cheap.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const expensiveListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Expensive Item',
        description: 'Premium item',
        price: 1500.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/expensive.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    testListingIds.push(cheapListing.id, expensiveListing.id);

    // Filter by maximum price: $100
    const result = await searchListings('', { maxPrice: 100 }, 100, 0);

    // Should only find cheap listing
    const foundIds = result.listings.map((l) => l.id);
    expect(foundIds).toContain(cheapListing.id);
    expect(foundIds).not.toContain(expensiveListing.id);

    // All results should be at most $100
    for (const listing of result.listings) {
      expect(listing.price).toBeLessThanOrEqual(100);
    }
  });

  it('should filter by location correctly', async () => {
    // Create listings in different locations
    const nyListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'New York Item',
        description: 'Item in New York',
        price: 100.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/ny.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const laListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'LA Item',
        description: 'Item in Los Angeles',
        price: 100.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/la.jpg'],
        location: 'Los Angeles, CA',
        status: 'active',
      },
    });

    const remoteListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[1],
        title: 'Remote Service',
        description: 'Remote work service',
        price: 50.0,
        listingType: 'service',
        pricingType: 'hourly',
        categoryId: testCategoryIds[2],
        images: ['https://example.com/remote.jpg'],
        location: 'Remote',
        status: 'active',
      },
    });

    testListingIds.push(nyListing.id, laListing.id, remoteListing.id);

    // Filter by "New York" (case-insensitive partial match)
    const nyResult = await searchListings('', { location: 'New York' }, 100, 0);

    // Should only find NY listing
    const nyIds = nyResult.listings.map((l) => l.id);
    expect(nyIds).toContain(nyListing.id);
    expect(nyIds).not.toContain(laListing.id);
    expect(nyIds).not.toContain(remoteListing.id);

    // All results should contain "New York" (case-insensitive)
    for (const listing of nyResult.listings) {
      expect(listing.location.toLowerCase()).toContain('new york');
    }

    // Filter by "remote" (case-insensitive)
    const remoteResult = await searchListings('', { location: 'remote' }, 100, 0);

    // Should only find remote listing
    const remoteIds = remoteResult.listings.map((l) => l.id);
    expect(remoteIds).toContain(remoteListing.id);
    expect(remoteIds).not.toContain(nyListing.id);
    expect(remoteIds).not.toContain(laListing.id);

    // All results should contain "remote" (case-insensitive)
    for (const listing of remoteResult.listings) {
      expect(listing.location.toLowerCase()).toContain('remote');
    }
  });

  it('should combine multiple filters with AND logic', async () => {
    // Create diverse listings
    const targetListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Target Item',
        description: 'This should match all filters',
        price: 150.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0], // Electronics
        images: ['https://example.com/target.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const wrongCategoryListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Wrong Category',
        description: 'Wrong category but everything else matches',
        price: 150.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[1], // Furniture (wrong)
        images: ['https://example.com/wrong1.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const wrongTypeListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[1],
        title: 'Wrong Type',
        description: 'Wrong type but everything else matches',
        price: 150.0,
        listingType: 'service', // Service (wrong)
        pricingType: 'fixed',
        categoryId: testCategoryIds[0],
        images: ['https://example.com/wrong2.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const wrongPriceListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Wrong Price',
        description: 'Wrong price but everything else matches',
        price: 500.0, // Too expensive
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/wrong3.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const wrongLocationListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Wrong Location',
        description: 'Wrong location but everything else matches',
        price: 150.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0],
        images: ['https://example.com/wrong4.jpg'],
        location: 'Los Angeles, CA', // Wrong location
        status: 'active',
      },
    });

    testListingIds.push(
      targetListing.id,
      wrongCategoryListing.id,
      wrongTypeListing.id,
      wrongPriceListing.id,
      wrongLocationListing.id
    );

    // Apply all filters - only target listing should match
    const result = await searchListings(
      '',
      {
        categoryId: testCategoryIds[0],
        listingType: 'item',
        minPrice: 100,
        maxPrice: 200,
        location: 'New York',
      },
      100,
      0
    );

    // Should only find target listing
    const foundIds = result.listings.map((l) => l.id);
    expect(foundIds).toContain(targetListing.id);
    expect(foundIds).not.toContain(wrongCategoryListing.id);
    expect(foundIds).not.toContain(wrongTypeListing.id);
    expect(foundIds).not.toContain(wrongPriceListing.id);
    expect(foundIds).not.toContain(wrongLocationListing.id);

    // All results should match ALL filters
    for (const listing of result.listings) {
      expect(listing.categoryId).toBe(testCategoryIds[0]);
      expect(listing.listingType).toBe('item');
      expect(listing.price).toBeGreaterThanOrEqual(100);
      expect(listing.price).toBeLessThanOrEqual(200);
      expect(listing.location.toLowerCase()).toContain('new york');
    }
  });

  it('should combine text search with filters', async () => {
    // Create listings with specific keywords
    const matchingListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Gaming Laptop',
        description: 'High performance gaming laptop',
        price: 1200.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[0], // Electronics
        images: ['https://example.com/laptop.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    const wrongCategoryListing = await prisma.listing.create({
      data: {
        sellerId: testUserIds[0],
        title: 'Gaming Chair',
        description: 'Comfortable gaming chair',
        price: 300.0,
        listingType: 'item',
        pricingType: null,
        categoryId: testCategoryIds[1], // Furniture (wrong category)
        images: ['https://example.com/chair.jpg'],
        location: 'New York, NY',
        status: 'active',
      },
    });

    testListingIds.push(matchingListing.id, wrongCategoryListing.id);

    // Search for "gaming" with electronics category filter
    const result = await searchListings(
      'gaming',
      { categoryId: testCategoryIds[0] },
      100,
      0
    );

    // Should only find gaming laptop (matches both query and filter)
    const foundIds = result.listings.map((l) => l.id);
    expect(foundIds).toContain(matchingListing.id);
    expect(foundIds).not.toContain(wrongCategoryListing.id);

    // All results should match query AND filter
    for (const listing of result.listings) {
      const titleLower = listing.title.toLowerCase();
      const descriptionLower = listing.description.toLowerCase();
      const matchesQuery = titleLower.includes('gaming') || descriptionLower.includes('gaming');
      
      expect(matchesQuery).toBe(true);
      expect(listing.categoryId).toBe(testCategoryIds[0]);
    }
  });

  it('should return empty results when no listings match filters', async () => {
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

    // Search with filters that won't match anything
    const result = await searchListings(
      '',
      {
        categoryId: testCategoryIds[0],
        minPrice: 10000, // Impossibly high price
        maxPrice: 20000,
      },
      100,
      0
    );

    // Should return empty results
    expect(result.listings).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.hasMore).toBe(false);
  });
});
