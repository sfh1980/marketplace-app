/**
 * Category Service
 * 
 * Handles business logic for category operations including:
 * - Retrieving all categories
 * - Counting listings per category
 * 
 * Why a separate service layer?
 * - Separates business logic from HTTP handling
 * - Makes code testable without HTTP requests
 * - Allows reuse across different controllers
 * - Follows Single Responsibility Principle
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Interface for category with listing count
 * 
 * This extends the basic Category model with a computed field
 * that shows how many active listings are in each category.
 */
export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  listingCount: number; // Computed field - not stored in database
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all categories with listing counts
 * 
 * This function demonstrates AGGREGATION QUERIES and GROUP BY operations.
 * 
 * Aggregation Explained:
 * Aggregation is the process of combining multiple rows of data into
 * a single summary value. Common aggregations include:
 * - COUNT: How many rows
 * - SUM: Total of values
 * - AVG: Average of values
 * - MIN/MAX: Smallest/largest value
 * 
 * GROUP BY Explained:
 * GROUP BY groups rows that have the same values in specified columns.
 * When combined with aggregation functions, it calculates statistics
 * for each group.
 * 
 * Example: Count listings per category
 * Without GROUP BY: "There are 150 total listings"
 * With GROUP BY: "Electronics: 45, Furniture: 30, Services: 75"
 * 
 * SQL Translation:
 * What we want to achieve in SQL:
 * 
 * SELECT 
 *   categoryId,
 *   COUNT(*) as count
 * FROM listings
 * WHERE status = 'active'
 * GROUP BY categoryId
 * 
 * This groups all listings by their categoryId and counts how many
 * listings are in each group.
 * 
 * Prisma Approach:
 * Prisma provides a `groupBy` method that translates to SQL GROUP BY.
 * However, we need to join this data with the Category table to get
 * category names and other details.
 * 
 * Our Strategy:
 * 1. Fetch all categories from the database
 * 2. Use Prisma's groupBy to count active listings per category
 * 3. Combine the results: match counts to categories
 * 4. Return categories with their listing counts
 * 
 * Why not use Prisma's _count?
 * Prisma's _count on relations counts ALL listings, not just active ones.
 * We need to filter by status='active', so we use groupBy instead.
 * 
 * Performance Considerations:
 * - We run both queries in parallel using Promise.all
 * - Categories table is small (typically < 100 rows)
 * - groupBy is efficient (uses database aggregation)
 * - Results can be cached since they don't change frequently
 * 
 * Alternative Approaches:
 * 
 * Approach 1 (Current): Fetch categories + groupBy counts
 * - Pros: Simple, type-safe, works with any filter
 * - Cons: Two queries (but run in parallel)
 * 
 * Approach 2: Raw SQL with JOIN
 * - Pros: Single query, potentially faster
 * - Cons: Loses type safety, harder to maintain
 * 
 * Approach 3: Prisma's include with _count
 * - Pros: Single query, type-safe
 * - Cons: Can't filter by status (counts all listings)
 * 
 * For our use case, Approach 1 is best because:
 * - We need to filter by status='active'
 * - Type safety is important
 * - Performance is good enough (parallel queries)
 * - Code is maintainable and clear
 * 
 * Real-World Example:
 * Imagine an e-commerce site showing:
 * - Electronics (245 items)
 * - Clothing (189 items)
 * - Home & Garden (156 items)
 * 
 * This helps users:
 * - See which categories have the most options
 * - Decide where to browse
 * - Understand the marketplace inventory
 * 
 * @returns Array of categories with listing counts
 */
export async function getAllCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  // Run both queries in parallel for better performance
  // Promise.all waits for all promises to complete and returns an array of results
  const [categories, listingCounts] = await Promise.all([
    // Query 1: Fetch all categories
    // This gets the category details (name, slug, description)
    prisma.category.findMany({
      orderBy: {
        name: 'asc', // Sort alphabetically by name
      },
    }),

    // Query 2: Count active listings per category using GROUP BY
    // This is the aggregation query that counts listings in each category
    prisma.listing.groupBy({
      by: ['categoryId'], // GROUP BY categoryId
      where: {
        status: 'active', // Only count active listings (not sold/deleted)
      },
      _count: {
        categoryId: true, // COUNT(categoryId) - how many listings per category
      },
    }),
  ]);

  // Create a lookup map for fast access to listing counts
  // This converts the array into an object for O(1) lookup time
  // 
  // Example listingCounts array:
  // [
  //   { categoryId: 'abc-123', _count: { categoryId: 45 } },
  //   { categoryId: 'def-456', _count: { categoryId: 30 } },
  // ]
  // 
  // Becomes countMap object:
  // {
  //   'abc-123': 45,
  //   'def-456': 30
  // }
  // 
  // Why use a map?
  // - Fast lookup: O(1) instead of O(n)
  // - Clean code: countMap[categoryId] instead of array.find()
  // - Efficient: Only loop through counts once
  const countMap: Record<string, number> = {};
  for (const count of listingCounts) {
    countMap[count.categoryId] = count._count.categoryId;
  }

  // Combine categories with their listing counts
  // For each category, look up its count in the map
  // If no count exists (no active listings), default to 0
  const categoriesWithCounts: CategoryWithCount[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    listingCount: countMap[category.id] || 0, // Get count from map, default to 0
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  }));

  return categoriesWithCounts;
}

/**
 * Get listings by category
 * 
 * This function retrieves all active listings in a specific category.
 * It's used when users click on a category to browse its listings.
 * 
 * Why a separate function?
 * - Specific use case: browsing by category
 * - Can add category-specific logic later
 * - Clear intent: "get listings for this category"
 * - Reusable across different controllers
 * 
 * This is essentially a filtered version of getAllListings,
 * but scoped to a single category.
 * 
 * @param categoryId - UUID of the category
 * @param limit - Maximum number of listings to return (default: 20)
 * @param offset - Number of listings to skip (default: 0)
 * @returns Object with listings array and pagination metadata
 */
export async function getListingsByCategory(
  categoryId: string,
  limit: number = 20,
  offset: number = 0
) {
  // Validate pagination parameters
  const validLimit = Math.min(Math.max(limit, 1), 100);
  const validOffset = Math.max(offset, 0);

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // Fetch listings with pagination
  const [listings, totalCount] = await Promise.all([
    // Query 1: Get paginated listings in this category
    prisma.listing.findMany({
      where: {
        categoryId: categoryId,
        status: 'active', // Only active listings
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            averageRating: true,
            joinDate: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        {
          createdAt: 'desc', // Newest first
        },
        {
          id: 'asc', // Secondary sort by ID for stable ordering
        },
      ],
      take: validLimit,
      skip: validOffset,
    }),

    // Query 2: Get total count of active listings in this category
    prisma.listing.count({
      where: {
        categoryId: categoryId,
        status: 'active',
      },
    }),
  ]);

  return {
    category, // Include category details in response
    listings,
    totalCount,
    limit: validLimit,
    offset: validOffset,
    hasMore: validOffset + validLimit < totalCount,
  };
}
