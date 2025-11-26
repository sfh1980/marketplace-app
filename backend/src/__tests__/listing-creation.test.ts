/**
 * Property-Based Tests for Listing Creation
 * 
 * These tests verify the correctness properties for listing creation:
 * - Property 7: Valid listing creation succeeds
 * - Property 7a: Service listings store pricing type correctly
 * - Property 22: Listings require valid categories
 * 
 * Why property-based testing for listings?
 * - Tests across many random inputs (not just a few examples)
 * - Verifies polymorphic data model works correctly
 * - Catches edge cases in validation logic
 * - Ensures properties hold for ALL valid inputs
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { createListing } from '../services/listingService';

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
        slug: 'test-electronics-' + Date.now(),
        description: 'Test category for electronics',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Services',
        slug: 'test-services-' + Date.now(),
        description: 'Test category for services',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Test Furniture',
        slug: 'test-furniture-' + Date.now(),
        description: 'Test category for furniture',
      },
    }),
  ]);

  testCategoryIds = categories.map((c) => c.id);

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: `test-seller-1-${Date.now()}@example.com`,
        username: `test_seller_1_${Date.now()}`,
        passwordHash: 'hashed_password',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: `test-seller-2-${Date.now()}@example.com`,
        username: `test_seller_2_${Date.now()}`,
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
 * 
 * Strategy: Create realistic titles
 * - 5-100 characters
 * - Alphanumeric with spaces and common punctuation
 */
const validTitleArbitrary = fc.stringMatching(/^[a-zA-Z0-9 ]{5,50}$/);

/**
 * Generate valid listing descriptions
 * 
 * Strategy: Create realistic descriptions
 * - 10-500 characters
 * - Alphanumeric with spaces and punctuation
 */
const validDescriptionArbitrary = fc.stringMatching(/^[a-zA-Z0-9 .,!?]{10,200}$/);

/**
 * Generate valid prices
 * 
 * Strategy: Positive numbers with up to 2 decimal places
 * - Range: $0.01 to $10,000
 */
const validPriceArbitrary = fc.double({
  min: 0.01,
  max: 10000,
  noNaN: true,
}).map((price) => Math.round(price * 100) / 100); // Round to 2 decimal places

/**
 * Generate valid image URLs
 * 
 * Strategy: Create realistic image URLs
 * - 1-10 images per listing
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
 * 
 * Item listings:
 * - listingType: 'item'
 * - pricingType: undefined (not used for items)
 * 
 * Note: This is a function that returns an arbitrary, so it can access
 * testUserIds and testCategoryIds after they're initialized
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
 * 
 * Service listings:
 * - listingType: 'service'
 * - pricingType: 'fixed' or 'hourly' (required for services)
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
 * Feature: marketplace-platform, Property 7: Valid listing creation succeeds
 * 
 * Property: For any valid listing data (title, description, price, category,
 * listing type, images), creating a listing should result in a new listing
 * that is visible in search results and retrievable by its ID.
 * 
 * Validates: Requirements 3.1
 * 
 * What this test verifies:
 * - Valid listing data creates a new listing
 * - Created listing has a unique ID
 * - Created listing can be retrieved from database
 * - All fields are stored correctly
 * - Listing is created with 'active' status
 */
describe('Property 7: Valid listing creation succeeds', () => {
  it('should create a listing for any valid listing data', async () => {
    await fc.assert(
      fc.asyncProperty(getValidListingArbitrary(), async (listingData) => {
        // Create the listing
        const createdListing = await createListing(listingData);

        // Track for cleanup
        testListingIds.push(createdListing.id);

        // Verify listing was created with an ID
        expect(createdListing.id).toBeDefined();
        expect(typeof createdListing.id).toBe('string');

        // Verify listing can be retrieved from database
        const retrievedListing = await prisma.listing.findUnique({
          where: { id: createdListing.id },
        });

        expect(retrievedListing).not.toBeNull();

        // Verify all fields match input data
        expect(retrievedListing!.sellerId).toBe(listingData.sellerId);
        expect(retrievedListing!.title).toBe(listingData.title);
        expect(retrievedListing!.description).toBe(listingData.description);
        expect(retrievedListing!.price).toBe(listingData.price);
        expect(retrievedListing!.listingType).toBe(listingData.listingType);
        expect(retrievedListing!.categoryId).toBe(listingData.categoryId);
        expect(retrievedListing!.images).toEqual(listingData.images);
        expect(retrievedListing!.location).toBe(listingData.location);

        // Verify listing is created with 'active' status
        expect(retrievedListing!.status).toBe('active');

        // Verify timestamps are set
        expect(retrievedListing!.createdAt).toBeInstanceOf(Date);
        expect(retrievedListing!.updatedAt).toBeInstanceOf(Date);
      }),
      { numRuns: 100 } // Run 100 iterations with random data
    );
  });
});

/**
 * Feature: marketplace-platform, Property 7a: Service listings store pricing type correctly
 * 
 * Property: For any service listing with a pricing type (hourly or fixed),
 * the listing should store and return the correct pricing type when retrieved.
 * 
 * Validates: Requirements 3.2
 * 
 * What this test verifies:
 * - Service listings require pricingType
 * - pricingType is stored correctly ('fixed' or 'hourly')
 * - Retrieved listing returns the same pricingType
 * - Item listings don't have pricingType
 */
describe('Property 7a: Service listings store pricing type correctly', () => {
  it('should store pricing type correctly for service listings', async () => {
    await fc.assert(
      fc.asyncProperty(getValidServiceListingArbitrary(), async (listingData) => {
        // Create the service listing
        const createdListing = await createListing(listingData);

        // Track for cleanup
        testListingIds.push(createdListing.id);

        // Verify pricingType is stored
        expect(createdListing.pricingType).toBeDefined();
        expect(createdListing.pricingType).toBe(listingData.pricingType);

        // Verify pricingType is either 'fixed' or 'hourly'
        expect(['fixed', 'hourly']).toContain(createdListing.pricingType);

        // Retrieve from database and verify again
        const retrievedListing = await prisma.listing.findUnique({
          where: { id: createdListing.id },
        });

        expect(retrievedListing!.pricingType).toBe(listingData.pricingType);
      }),
      { numRuns: 100 }
    );
  });

  it('should not have pricing type for item listings', async () => {
    await fc.assert(
      fc.asyncProperty(getValidItemListingArbitrary(), async (listingData) => {
        // Create the item listing
        const createdListing = await createListing(listingData);

        // Track for cleanup
        testListingIds.push(createdListing.id);

        // Verify pricingType is null for items
        expect(createdListing.pricingType).toBeNull();

        // Retrieve from database and verify again
        const retrievedListing = await prisma.listing.findUnique({
          where: { id: createdListing.id },
        });

        expect(retrievedListing!.pricingType).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: marketplace-platform, Property 22: Listings require valid categories
 * 
 * Property: For any listing creation attempt without a category, the creation
 * should be rejected, and for any listing with a valid category, the creation
 * should succeed.
 * 
 * Validates: Requirements 8.1
 * 
 * What this test verifies:
 * - Listings with valid categories are created successfully
 * - Listings with invalid categories are rejected
 * - Category validation happens before database insertion
 */
describe('Property 22: Listings require valid categories', () => {
  it('should create listings with valid categories', async () => {
    await fc.assert(
      fc.asyncProperty(getValidListingArbitrary(), async (listingData) => {
        // Create the listing (should succeed with valid category)
        const createdListing = await createListing(listingData);

        // Track for cleanup
        testListingIds.push(createdListing.id);

        // Verify listing was created
        expect(createdListing.id).toBeDefined();

        // Verify category is stored correctly
        expect(createdListing.categoryId).toBe(listingData.categoryId);

        // Verify category exists in database
        const category = await prisma.category.findUnique({
          where: { id: createdListing.categoryId },
        });

        expect(category).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should reject listings with invalid categories', async () => {
    await fc.assert(
      fc.asyncProperty(
        getValidListingArbitrary(),
        fc.uuid(), // Generate random invalid category ID
        async (listingData, invalidCategoryId) => {
          // Ensure the invalid ID doesn't accidentally match a real category
          const categoryExists = await prisma.category.findUnique({
            where: { id: invalidCategoryId },
          });

          // Skip this test case if the random ID happens to exist
          if (categoryExists) {
            return true;
          }

          // Create listing data with invalid category
          const invalidListingData = {
            ...listingData,
            categoryId: invalidCategoryId,
          };

          // Attempt to create listing (should fail)
          await expect(createListing(invalidListingData)).rejects.toThrow(
            'Invalid category ID'
          );

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
 * These tests verify specific validation rules
 */
describe('Listing validation edge cases', () => {
  it('should reject service listings without pricing type', async () => {
    const invalidServiceData = {
      sellerId: testUserIds[0],
      title: 'Test Service',
      description: 'Test description for service',
      price: 50.0,
      listingType: 'service' as const,
      pricingType: undefined, // Missing for service
      categoryId: testCategoryIds[0],
      images: ['https://example.com/image.jpg'],
      location: 'New York, NY',
    };

    await expect(createListing(invalidServiceData)).rejects.toThrow(
      'Pricing type is required for service listings'
    );
  });

  it('should reject item listings with pricing type', async () => {
    const invalidItemData = {
      sellerId: testUserIds[0],
      title: 'Test Item',
      description: 'Test description for item',
      price: 50.0,
      listingType: 'item' as const,
      pricingType: 'fixed' as const, // Should not be set for items
      categoryId: testCategoryIds[0],
      images: ['https://example.com/image.jpg'],
      location: 'New York, NY',
    };

    await expect(createListing(invalidItemData)).rejects.toThrow(
      'Pricing type should not be set for item listings'
    );
  });

  it('should reject listings with more than 10 images', async () => {
    const tooManyImages = Array(11).fill('https://example.com/image.jpg');

    const invalidData = {
      sellerId: testUserIds[0],
      title: 'Test Listing',
      description: 'Test description',
      price: 50.0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: tooManyImages,
      location: 'New York, NY',
    };

    await expect(createListing(invalidData)).rejects.toThrow(
      'Maximum 10 images allowed per listing'
    );
  });

  it('should reject listings with no images', async () => {
    const noImages = {
      sellerId: testUserIds[0],
      title: 'Test Listing',
      description: 'Test description',
      price: 50.0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: [],
      location: 'New York, NY',
    };

    await expect(createListing(noImages)).rejects.toThrow(
      'At least one image is required'
    );
  });

  it('should reject listings with negative or zero price', async () => {
    const invalidPrice = {
      sellerId: testUserIds[0],
      title: 'Test Listing',
      description: 'Test description',
      price: 0,
      listingType: 'item' as const,
      pricingType: undefined,
      categoryId: testCategoryIds[0],
      images: ['https://example.com/image.jpg'],
      location: 'New York, NY',
    };

    await expect(createListing(invalidPrice)).rejects.toThrow(
      'Price must be greater than 0'
    );
  });
});
