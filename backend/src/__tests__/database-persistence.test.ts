/**
 * Property-Based Tests for Database Persistence
 * 
 * Feature: marketplace-platform, Property 29: Data changes persist immediately
 * Validates: Requirements 10.1
 * 
 * These tests verify that all database operations (create, update) persist
 * data immediately and that subsequent reads return the correct data.
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';

// Create a new Prisma client for testing
const prisma = new PrismaClient();

// ============================================
// CUSTOM GENERATORS
// ============================================
// These generators create random but valid test data

/**
 * Generates a valid email address with large random number to ensure uniqueness
 */
const emailArbitrary = fc.tuple(
  fc.stringMatching(/^[a-z0-9]{3,10}$/),
  fc.constantFrom('gmail.com', 'yahoo.com', 'test.com', 'example.com'),
  fc.integer({ min: 100000000, max: 999999999 }),
  fc.integer({ min: 100000000, max: 999999999 })
).map(([name, domain, random1, random2]) => `${name}_${random1}_${random2}@${domain}`);

/**
 * Generates a valid username (3-20 alphanumeric characters) with large random number for uniqueness
 */
const usernameArbitrary = fc.tuple(
  fc.stringMatching(/^[a-zA-Z0-9_]{3,10}$/),
  fc.integer({ min: 100000000, max: 999999999 }),
  fc.integer({ min: 100000000, max: 999999999 })
).map(([name, random1, random2]) => `${name}_${random1}_${random2}`.substring(0, 20));

/**
 * Generates a valid password hash (simulating bcrypt output)
 */
const passwordHashArbitrary = fc.string({ minLength: 60, maxLength: 60 });

/**
 * Generates optional location string
 */
const locationArbitrary = fc.option(
  fc.constantFrom(
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA'
  ),
  { nil: null }
);

/**
 * Generates a complete User object for testing
 */
const userArbitrary = fc.record({
  email: emailArbitrary,
  username: usernameArbitrary,
  passwordHash: passwordHashArbitrary,
  location: locationArbitrary,
  emailVerified: fc.boolean(),
});

/**
 * Generates a valid listing title
 */
const titleArbitrary = fc.string({ minLength: 5, maxLength: 100 });

/**
 * Generates a valid listing description
 */
const descriptionArbitrary = fc.string({ minLength: 10, maxLength: 500 });

/**
 * Generates a valid price (positive number)
 */
const priceArbitrary = fc.double({ min: 0.01, max: 10000, noNaN: true });

/**
 * Generates listing type
 */
const listingTypeArbitrary = fc.constantFrom('item', 'service');

/**
 * Generates pricing type for services
 */
const pricingTypeArbitrary = fc.option(
  fc.constantFrom('fixed', 'hourly'),
  { nil: null }
);

/**
 * Generates an array of image URLs
 */
const imagesArbitrary = fc.array(
  fc.webUrl(),
  { minLength: 1, maxLength: 10 }
);

/**
 * Generates a category name with large random numbers for uniqueness
 */
const categoryNameArbitrary = fc.tuple(
  fc.constantFrom(
    'Electronics',
    'Furniture',
    'Clothing',
    'Books',
    'Services',
    'Vehicles',
    'Real Estate'
  ),
  fc.integer({ min: 100000000, max: 999999999 }),
  fc.integer({ min: 100000000, max: 999999999 })
).map(([name, random1, random2]) => `${name}_${random1}_${random2}`);

/**
 * Generates a category slug with large random numbers for uniqueness
 */
const categorySlugArbitrary = fc.tuple(
  fc.constantFrom(
    'electronics',
    'furniture',
    'clothing',
    'books',
    'services',
    'vehicles',
    'real-estate'
  ),
  fc.integer({ min: 100000000, max: 999999999 }),
  fc.integer({ min: 100000000, max: 999999999 })
).map(([slug, random1, random2]) => `${slug}_${random1}_${random2}`);

// ============================================
// TEST SETUP AND TEARDOWN
// ============================================

beforeAll(async () => {
  // Connect to the database
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean the database before each test to ensure isolation
  // Delete in order to respect foreign key constraints
  await prisma.favorite.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.message.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
});

// ============================================
// PROPERTY-BASED TESTS
// ============================================

describe('Database Persistence Properties', () => {
  /**
   * Property 29a: User creation persists immediately
   * 
   * For any valid user data, creating a user should result in that user
   * being immediately retrievable with all the same data.
   */
  test('Property 29a: User creation persists immediately', async () => {
    await fc.assert(
      fc.asyncProperty(userArbitrary, async (userData) => {
        // Create a user with the generated data
        const createdUser = await prisma.user.create({
          data: userData,
        });

        // Immediately retrieve the user
        const retrievedUser = await prisma.user.findUnique({
          where: { id: createdUser.id },
        });

        // Verify the user exists
        expect(retrievedUser).not.toBeNull();

        // Verify all fields match
        expect(retrievedUser!.email).toBe(userData.email);
        expect(retrievedUser!.username).toBe(userData.username);
        expect(retrievedUser!.passwordHash).toBe(userData.passwordHash);
        expect(retrievedUser!.location).toBe(userData.location);
        expect(retrievedUser!.emailVerified).toBe(userData.emailVerified);
      }),
      { numRuns: 100 } // Run 100 random test cases
    );
  });

  /**
   * Property 29b: User update persists immediately
   * 
   * For any user and any valid update data, updating the user should
   * result in the changes being immediately retrievable.
   */
  test('Property 29b: User update persists immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        locationArbitrary,
        async (initialData, newLocation) => {
          // Create initial user
          const user = await prisma.user.create({
            data: initialData,
          });

          // Update the user's location
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { location: newLocation },
          });

          // Immediately retrieve the user
          const retrievedUser = await prisma.user.findUnique({
            where: { id: user.id },
          });

          // Verify the update persisted
          expect(retrievedUser).not.toBeNull();
          expect(retrievedUser!.location).toBe(newLocation);
          expect(updatedUser.location).toBe(newLocation);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29c: Listing creation persists immediately
   * 
   * For any valid listing data, creating a listing should result in that
   * listing being immediately retrievable with all the same data.
   * 
   * Note: Shrinking is disabled because fast-check's shrinking process
   * replays test cases, which causes unique constraint violations when
   * the database cleanup doesn't run between shrinking iterations.
   */
  test('Property 29c: Listing creation persists immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        categoryNameArbitrary,
        categorySlugArbitrary,
        titleArbitrary,
        descriptionArbitrary,
        priceArbitrary,
        listingTypeArbitrary,
        pricingTypeArbitrary,
        imagesArbitrary,
        locationArbitrary,
        async (
          userData,
          categoryName,
          categorySlug,
          title,
          description,
          price,
          listingType,
          pricingType,
          images,
          location
        ) => {
          // Create prerequisite user and category
          const user = await prisma.user.create({ data: userData });
          const category = await prisma.category.create({
            data: {
              name: categoryName,
              slug: categorySlug,
            },
          });

          // Create listing
          const createdListing = await prisma.listing.create({
            data: {
              sellerId: user.id,
              categoryId: category.id,
              title,
              description,
              price,
              listingType,
              pricingType,
              images,
              location: location || 'Unknown',
            },
          });

          // Immediately retrieve the listing
          const retrievedListing = await prisma.listing.findUnique({
            where: { id: createdListing.id },
          });

          // Verify the listing exists and all fields match
          expect(retrievedListing).not.toBeNull();
          expect(retrievedListing!.title).toBe(title);
          expect(retrievedListing!.description).toBe(description);
          // Use toBeCloseTo for floating point comparison due to precision limits
          expect(retrievedListing!.price).toBeCloseTo(price, 10);
          expect(retrievedListing!.listingType).toBe(listingType);
          expect(retrievedListing!.pricingType).toBe(pricingType);
          expect(retrievedListing!.images).toEqual(images);
          expect(retrievedListing!.sellerId).toBe(user.id);
          expect(retrievedListing!.categoryId).toBe(category.id);
        }
      ),
      { 
        numRuns: 100,
        endOnFailure: true, // Stop on first failure to avoid shrinking issues
      }
    );
  });

  /**
   * Property 29d: Message creation persists immediately
   * 
   * For any valid message data, creating a message should result in that
   * message being immediately retrievable with all the same data.
   */
  test('Property 29d: Message creation persists immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        userArbitrary,
        fc.string({ minLength: 1, maxLength: 500 }),
        async (senderData, receiverData, content) => {
          // Create sender and receiver (generators already ensure uniqueness)
          const sender = await prisma.user.create({ data: senderData });
          const receiver = await prisma.user.create({ data: receiverData });

          // Create message
          const createdMessage = await prisma.message.create({
            data: {
              senderId: sender.id,
              receiverId: receiver.id,
              content,
            },
          });

          // Immediately retrieve the message
          const retrievedMessage = await prisma.message.findUnique({
            where: { id: createdMessage.id },
          });

          // Verify the message exists and all fields match
          expect(retrievedMessage).not.toBeNull();
          expect(retrievedMessage!.content).toBe(content);
          expect(retrievedMessage!.senderId).toBe(sender.id);
          expect(retrievedMessage!.receiverId).toBe(receiver.id);
          expect(retrievedMessage!.read).toBe(false); // Default value
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29e: Category creation persists immediately
   * 
   * For any valid category data, creating a category should result in that
   * category being immediately retrievable with all the same data.
   */
  test('Property 29e: Category creation persists immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        categoryNameArbitrary,
        categorySlugArbitrary,
        fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: null }),
        async (name, slug, description) => {
          // Create category
          const createdCategory = await prisma.category.create({
            data: {
              name,
              slug,
              description,
            },
          });

          // Immediately retrieve the category
          const retrievedCategory = await prisma.category.findUnique({
            where: { id: createdCategory.id },
          });

          // Verify the category exists and all fields match
          expect(retrievedCategory).not.toBeNull();
          expect(retrievedCategory!.name).toBe(name);
          expect(retrievedCategory!.slug).toBe(slug);
          expect(retrievedCategory!.description).toBe(description);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29f: Rating creation persists immediately
   * 
   * For any valid rating data, creating a rating should result in that
   * rating being immediately retrievable with all the same data.
   */
  test('Property 29f: Rating creation persists immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        userArbitrary,
        fc.integer({ min: 1, max: 5 }),
        fc.option(fc.string({ minLength: 10, maxLength: 500 }), { nil: null }),
        async (raterData, ratedData, stars, review) => {
          // Create users (generators already ensure uniqueness)
          const rater = await prisma.user.create({ data: raterData });
          const ratedUser = await prisma.user.create({ data: ratedData });

          // Create rating
          const createdRating = await prisma.rating.create({
            data: {
              raterId: rater.id,
              ratedUserId: ratedUser.id,
              stars,
              review,
            },
          });

          // Immediately retrieve the rating
          const retrievedRating = await prisma.rating.findUnique({
            where: { id: createdRating.id },
          });

          // Verify the rating exists and all fields match
          expect(retrievedRating).not.toBeNull();
          expect(retrievedRating!.stars).toBe(stars);
          expect(retrievedRating!.review).toBe(review);
          expect(retrievedRating!.raterId).toBe(rater.id);
          expect(retrievedRating!.ratedUserId).toBe(ratedUser.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
