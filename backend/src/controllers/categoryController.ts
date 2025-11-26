/**
 * Category Controller
 * 
 * Handles HTTP requests for category endpoints.
 * 
 * Controller responsibilities:
 * - Parse and validate HTTP requests
 * - Call service layer for business logic
 * - Format and send HTTP responses
 * - Handle errors and return appropriate status codes
 */

import { Request, Response } from 'express';
import { getAllCategoriesWithCounts, getListingsByCategory } from '../services/categoryService';

/**
 * Get all categories with listing counts
 * 
 * GET /api/categories
 * 
 * Authentication: Not required (public endpoint)
 * Anyone can view categories
 * 
 * This endpoint demonstrates AGGREGATION QUERIES - combining data
 * from multiple rows into summary statistics.
 * 
 * What is an aggregation query?
 * An aggregation query performs calculations on groups of data.
 * Common aggregations:
 * - COUNT: How many items in each group
 * - SUM: Total value in each group
 * - AVG: Average value in each group
 * - MIN/MAX: Smallest/largest value in each group
 * 
 * In this case, we're counting how many active listings exist
 * in each category.
 * 
 * GROUP BY Explained:
 * GROUP BY is a SQL operation that groups rows with the same values.
 * 
 * Example without GROUP BY:
 * SELECT COUNT(*) FROM listings WHERE status='active'
 * Result: 150 (total count)
 * 
 * Example with GROUP BY:
 * SELECT categoryId, COUNT(*) FROM listings WHERE status='active' GROUP BY categoryId
 * Result:
 * - Electronics: 45
 * - Furniture: 30
 * - Services: 75
 * 
 * GROUP BY groups all listings by their category, then counts
 * how many listings are in each group.
 * 
 * Why is this useful?
 * - Users can see which categories have the most listings
 * - Helps users decide where to browse
 * - Shows marketplace inventory at a glance
 * - Guides users to active categories
 * 
 * Real-World Examples:
 * - Amazon: "Electronics (12,456 items)"
 * - eBay: "Collectibles (8,234 listings)"
 * - Craigslist: "For Sale (1,234) | Services (567)"
 * 
 * Success response (200 OK):
 * {
 *   categories: [
 *     {
 *       id: string,
 *       name: string,
 *       slug: string,
 *       description: string | null,
 *       listingCount: number,  // This is the aggregated count
 *       createdAt: Date,
 *       updatedAt: Date
 *     },
 *     // ... more categories
 *   ]
 * }
 * 
 * Response Details:
 * - categories: Array of all categories
 * - listingCount: Number of ACTIVE listings in each category
 *   (excludes sold, completed, and deleted listings)
 * - Sorted alphabetically by name
 * 
 * Why is this endpoint public?
 * - Users should be able to browse categories before signing up
 * - Helps users understand what's available on the platform
 * - Encourages registration by showing active marketplace
 * - Allows search engines to index categories (SEO)
 * 
 * Performance Considerations:
 * - Categories table is small (typically < 100 rows)
 * - Aggregation is efficient (database does the counting)
 * - Results can be cached (categories don't change often)
 * - Two queries run in parallel for speed
 * 
 * Caching Strategy (Future Enhancement):
 * This endpoint is a good candidate for caching because:
 * - Data doesn't change frequently
 * - Same result for all users
 * - Reduces database load
 * - Improves response time
 * 
 * Example caching:
 * - Cache for 5 minutes
 * - Invalidate when new listing is created
 * - Invalidate when listing status changes
 * 
 * Error responses:
 * - 500 Internal Server Error: Unexpected error
 * 
 * Frontend Usage:
 * This endpoint is typically used for:
 * - Category navigation menu
 * - Homepage category cards
 * - Filter dropdowns in search
 * - Category browse pages
 * 
 * Example Frontend Display:
 * ```
 * Categories:
 * - Electronics (245 listings)
 * - Furniture (189 listings)
 * - Services (156 listings)
 * - Clothing (134 listings)
 * ```
 */
export async function getAllCategoriesHandler(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    // Call service to get categories with listing counts
    // The service handles the aggregation query (GROUP BY)
    const categories = await getAllCategoriesWithCounts();

    // Return categories with counts
    res.status(200).json({
      categories,
    });
  } catch (error) {
    // Log unexpected errors
    console.error('Get all categories error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while retrieving categories',
      },
    });
  }
}

/**
 * Get listings by category
 * 
 * GET /api/categories/:id/listings
 * 
 * Authentication: Not required (public endpoint)
 * Anyone can browse listings by category
 * 
 * This endpoint allows users to browse all listings in a specific category.
 * It's essentially a filtered version of the main listings endpoint,
 * scoped to a single category.
 * 
 * URL Parameters:
 * - id: string (UUID) - The category ID
 * 
 * Query Parameters:
 * - limit: number (optional, default: 20) - How many listings to return
 * - offset: number (optional, default: 0) - How many listings to skip
 * 
 * Example URLs:
 * - /api/categories/abc-123/listings → First 20 listings in category
 * - /api/categories/abc-123/listings?limit=50 → First 50 listings
 * - /api/categories/abc-123/listings?offset=20 → Listings 21-40
 * 
 * Success response (200 OK):
 * {
 *   category: {
 *     id: string,
 *     name: string,
 *     slug: string,
 *     description: string | null
 *   },
 *   listings: [
 *     {
 *       id: string,
 *       sellerId: string,
 *       title: string,
 *       description: string,
 *       price: number,
 *       listingType: string,
 *       pricingType: string | null,
 *       categoryId: string,
 *       images: string[],
 *       status: string,
 *       location: string,
 *       createdAt: Date,
 *       updatedAt: Date,
 *       seller: {
 *         id: string,
 *         username: string,
 *         profilePicture: string | null,
 *         averageRating: number,
 *         joinDate: Date
 *       },
 *       category: {
 *         id: string,
 *         name: string,
 *         slug: string
 *       }
 *     },
 *     // ... more listings
 *   ],
 *   totalCount: number,
 *   limit: number,
 *   offset: number,
 *   hasMore: boolean
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid category ID or pagination parameters
 * - 404 Not Found: Category doesn't exist
 * - 500 Internal Server Error: Unexpected error
 * 
 * Why include category in response?
 * - Frontend can display category name and description
 * - Useful for breadcrumbs: "Home > Electronics > Laptops"
 * - Avoids extra API call to get category details
 * - Better user experience (all data in one request)
 * 
 * Use Cases:
 * - User clicks "Electronics" category → show all electronics
 * - User navigates to /categories/electronics → show listings
 * - User filters search by category → show category listings
 */
export async function getListingsByCategoryHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Extract category ID from URL parameters
    const { id } = req.params;

    // Validate that ID is provided
    if (!id) {
      res.status(400).json({
        error: {
          code: 'MISSING_ID',
          message: 'Category ID is required',
        },
      });
      return;
    }

    // Extract pagination parameters from query string
    const limitParam = req.query.limit as string | undefined;
    const offsetParam = req.query.offset as string | undefined;

    // Parse limit with default value of 20
    let limit = 20;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit)) {
        limit = parsedLimit;
      }
    }

    // Parse offset with default value of 0
    let offset = 0;
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (!isNaN(parsedOffset)) {
        offset = parsedOffset;
      }
    }

    // Validate pagination parameters
    if (limit < 0 || offset < 0) {
      res.status(400).json({
        error: {
          code: 'INVALID_PAGINATION',
          message: 'Limit and offset must be non-negative numbers',
        },
      });
      return;
    }

    // Call service to get listings by category
    const result = await getListingsByCategory(id, limit, offset);

    // Return listings with category info and pagination metadata
    res.status(200).json({
      category: result.category,
      listings: result.listings,
      totalCount: result.totalCount,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      // Category not found
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        });
        return;
      }
    }

    // Log unexpected errors
    console.error('Get listings by category error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while retrieving listings',
      },
    });
  }
}
