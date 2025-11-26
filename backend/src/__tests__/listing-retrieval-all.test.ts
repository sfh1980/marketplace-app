/**
 * Tests for GET /api/listings endpoint
 * 
 * This test file verifies the pagination functionality for retrieving all listings.
 * 
 * What we're testing:
 * 1. Basic retrieval of listings
 * 2. Pagination with limit and offset
 * 3. Response includes seller information (eager loading)
 * 4. Only active listings are returned
 * 5. Listings are ordered by newest first
 * 6. Pagination metadata is correct
 * 
 * Educational Focus:
 * - How to test paginated endpoints
 * - Verifying query parameters work correctly
 * - Testing eager loading (included relations)
 * - Validating response structure
 */

import request from 'supertest';
import express from 'express';
import listingRoutes from '../routes/listingRoutes';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/listings', listingRoutes);

describe('GET /api/listings - Get all listings with pagination', () => {
  let testUser: any;
  let testCategory: any;
  let testListings: any[] = [];

  // Setup: Create test data before running tests
  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: 'seller-pagination@test.com',
        username: 'paginationseller',
        passwordHash: 'hashedpassword',
        emailVerified: true,
        joinDate: new Date(),
        averageRating: 4.5,
      },
    });

    // Create a test category
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Category for pagination testing',
      },
    });

    // Create multiple test listings for pagination testing
    // We'll create 5 listings to test pagination
    for (let i = 1; i <= 5; i++) {
      const listing = await prisma.listing.create({
        data: {
          sellerId: testUser.id,
          title: `Test Listing ${i}`,
          description: `Description for test listing ${i}`,
          price: 10 * i,
          listingType: 'item',
          categoryId: testCategory.id,
          images: [`https://example.com/image${i}.jpg`],
          location: 'Test City',
          status: 'active',
        },
      });
      testListings.push(listing);
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Create a sold listing (should not appear in results)
    await prisma.listing.create({
      data: {
        sellerId: testUser.id,
        title: 'Sold Listing',
        description: 'This listing is sold',
        price: 100,
        listingType: 'item',
        categoryId: testCategory.id,
        images: ['https://example.com/sold.jpg'],
        location: 'Test City',
        status: 'sold',
      },
    });
  });

  // Cleanup: Remove test data after all tests
  afterAll(async () => {
    // Delete in correct order due to foreign key constraints
    await prisma.listing.deleteMany({
      where: {
        sellerId: testUser.id,
      },
    });
    await prisma.category.delete({
      where: { id: testCategory.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await prisma.$disconnect();
  });

  /**
   * Test 1: Basic retrieval without pagination parameters
   * 
   * This tests the default behavior when no query parameters are provided.
   * Should return all active listings with default pagination (limit=20, offset=0)
   */
  it('should return all active listings with default pagination', async () => {
    const response = await request(app)
      .get('/api/listings')
      .expect(200);

    // Verify response structure
    expect(response.body).toHaveProperty('listings');
    expect(response.body).toHaveProperty('totalCount');
    expect(response.body).toHaveProperty('limit');
    expect(response.body).toHaveProperty('offset');
    expect(response.body).toHaveProperty('hasMore');

    // Verify we got listings
    expect(Array.isArray(response.body.listings)).toBe(true);
    expect(response.body.listings.length).toBeGreaterThan(0);

    // Verify default pagination values
    expect(response.body.limit).toBe(20);
    expect(response.body.offset).toBe(0);

    // Verify only active listings are returned (not the sold one)
    const allActive = response.body.listings.every(
      (listing: any) => listing.status === 'active'
    );
    expect(allActive).toBe(true);
  });

  /**
   * Test 2: Pagination with custom limit
   * 
   * This tests that the limit parameter correctly restricts the number of results.
   */
  it('should respect the limit parameter', async () => {
    const response = await request(app)
      .get('/api/listings?limit=2')
      .expect(200);

    // Should return at most 2 listings
    expect(response.body.listings.length).toBeLessThanOrEqual(2);
    expect(response.body.limit).toBe(2);
  });

  /**
   * Test 3: Pagination with offset
   * 
   * This tests that the offset parameter correctly skips listings.
   */
  it('should respect the offset parameter', async () => {
    // Get first page
    const firstPage = await request(app)
      .get('/api/listings?limit=2&offset=0')
      .expect(200);

    // Get second page
    const secondPage = await request(app)
      .get('/api/listings?limit=2&offset=2')
      .expect(200);

    // Verify we got different listings
    if (firstPage.body.listings.length > 0 && secondPage.body.listings.length > 0) {
      expect(firstPage.body.listings[0].id).not.toBe(secondPage.body.listings[0].id);
    }

    expect(secondPage.body.offset).toBe(2);
  });

  /**
   * Test 4: Eager loading of seller information
   * 
   * This tests that seller information is included in the response
   * (avoiding N+1 query problem).
   */
  it('should include seller information with each listing', async () => {
    const response = await request(app)
      .get('/api/listings?limit=1')
      .expect(200);

    expect(response.body.listings.length).toBeGreaterThan(0);

    const listing = response.body.listings[0];

    // Verify seller information is included
    expect(listing).toHaveProperty('seller');
    expect(listing.seller).toHaveProperty('id');
    expect(listing.seller).toHaveProperty('username');
    expect(listing.seller).toHaveProperty('profilePicture');
    expect(listing.seller).toHaveProperty('averageRating');
    expect(listing.seller).toHaveProperty('joinDate');

    // Verify sensitive fields are NOT included
    expect(listing.seller).not.toHaveProperty('email');
    expect(listing.seller).not.toHaveProperty('passwordHash');
  });

  /**
   * Test 5: Category information is included
   * 
   * This tests that category information is included in the response.
   */
  it('should include category information with each listing', async () => {
    const response = await request(app)
      .get('/api/listings?limit=1')
      .expect(200);

    expect(response.body.listings.length).toBeGreaterThan(0);

    const listing = response.body.listings[0];

    // Verify category information is included
    expect(listing).toHaveProperty('category');
    expect(listing.category).toHaveProperty('id');
    expect(listing.category).toHaveProperty('name');
    expect(listing.category).toHaveProperty('slug');
  });

  /**
   * Test 6: Listings are ordered by newest first
   * 
   * This tests that listings are returned in descending order by creation date.
   */
  it('should return listings ordered by newest first', async () => {
    const response = await request(app)
      .get('/api/listings?limit=5')
      .expect(200);

    if (response.body.listings.length >= 2) {
      // Compare timestamps - first should be newer than second
      const first = new Date(response.body.listings[0].createdAt);
      const second = new Date(response.body.listings[1].createdAt);
      expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
    }
  });

  /**
   * Test 7: hasMore flag is correct
   * 
   * This tests that the hasMore flag correctly indicates if there are more listings.
   */
  it('should correctly set hasMore flag', async () => {
    // Get total count first
    const allResponse = await request(app)
      .get('/api/listings')
      .expect(200);

    const totalCount = allResponse.body.totalCount;

    // Request with limit less than total
    if (totalCount > 2) {
      const response = await request(app)
        .get('/api/listings?limit=2&offset=0')
        .expect(200);

      expect(response.body.hasMore).toBe(true);
    }

    // Request with offset that reaches the end
    const lastPageResponse = await request(app)
      .get(`/api/listings?limit=100&offset=0`)
      .expect(200);

    expect(lastPageResponse.body.hasMore).toBe(false);
  });

  /**
   * Test 8: Invalid pagination parameters
   * 
   * This tests that negative values are rejected.
   */
  it('should reject negative pagination parameters', async () => {
    await request(app)
      .get('/api/listings?limit=-1')
      .expect(400);

    await request(app)
      .get('/api/listings?offset=-1')
      .expect(400);
  });

  /**
   * Test 9: Non-numeric pagination parameters are handled gracefully
   * 
   * This tests that invalid parameter values fall back to defaults.
   */
  it('should handle non-numeric pagination parameters gracefully', async () => {
    const response = await request(app)
      .get('/api/listings?limit=abc&offset=xyz')
      .expect(200);

    // Should fall back to defaults
    expect(response.body.limit).toBe(20);
    expect(response.body.offset).toBe(0);
  });

  /**
   * Test 10: Total count is accurate
   * 
   * This tests that the totalCount reflects only active listings.
   */
  it('should return accurate total count of active listings', async () => {
    const response = await request(app)
      .get('/api/listings')
      .expect(200);

    // We created 5 active listings and 1 sold listing
    // Total count should be at least 5 (may be more from other tests)
    expect(response.body.totalCount).toBeGreaterThanOrEqual(5);

    // Verify the count matches active listings only
    const allListings = await prisma.listing.findMany({
      where: { status: 'active' },
    });
    expect(response.body.totalCount).toBe(allListings.length);
  });
});
