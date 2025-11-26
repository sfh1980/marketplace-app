/**
 * Category Routes
 * 
 * Defines all category-related API endpoints.
 * 
 * Why separate route files?
 * - Organization: Group related endpoints together
 * - Maintainability: Easy to find and modify routes
 * - Scalability: Can add middleware per route group
 * - Testing: Can test routes independently
 */

import { Router } from 'express';
import { getAllCategoriesHandler, getListingsByCategoryHandler } from '../controllers/categoryController';

// Create a new router instance
// This router will be mounted at /api/categories in the main app
const router = Router();

/**
 * GET /api/categories
 * 
 * Get all categories with listing counts
 * 
 * Public endpoint (no authentication required)
 * 
 * This endpoint demonstrates AGGREGATION QUERIES using GROUP BY.
 * 
 * What is GROUP BY?
 * GROUP BY is a SQL operation that groups rows with the same values
 * in specified columns. When combined with aggregation functions
 * (COUNT, SUM, AVG, etc.), it calculates statistics for each group.
 * 
 * Example:
 * Without GROUP BY: "There are 150 total listings"
 * With GROUP BY: "Electronics: 45, Furniture: 30, Services: 75"
 * 
 * SQL Translation:
 * SELECT categoryId, COUNT(*) as count
 * FROM listings
 * WHERE status = 'active'
 * GROUP BY categoryId
 * 
 * This groups all listings by their category and counts how many
 * listings are in each group.
 * 
 * Prisma Implementation:
 * Prisma provides a `groupBy` method that translates to SQL GROUP BY.
 * We use it to count active listings per category, then combine
 * the counts with category details.
 * 
 * Why is this useful?
 * - Users can see which categories have the most listings
 * - Helps users decide where to browse
 * - Shows marketplace inventory at a glance
 * - Guides users to active categories
 * 
 * Response includes:
 * - All categories (sorted alphabetically)
 * - Listing count for each category (only active listings)
 * - Category details (name, slug, description)
 * 
 * Example Response:
 * {
 *   categories: [
 *     {
 *       id: "abc-123",
 *       name: "Electronics",
 *       slug: "electronics",
 *       description: "Electronic devices and gadgets",
 *       listingCount: 245,
 *       createdAt: "2024-01-01T00:00:00Z",
 *       updatedAt: "2024-01-01T00:00:00Z"
 *     },
 *     {
 *       id: "def-456",
 *       name: "Furniture",
 *       slug: "furniture",
 *       description: "Home and office furniture",
 *       listingCount: 189,
 *       createdAt: "2024-01-01T00:00:00Z",
 *       updatedAt: "2024-01-01T00:00:00Z"
 *     }
 *   ]
 * }
 * 
 * Frontend Usage:
 * - Category navigation menu
 * - Homepage category cards
 * - Filter dropdowns in search
 * - Category browse pages
 * 
 * Why is this public?
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
 * Returns:
 * - 200 OK: Categories retrieved successfully
 * - 500 Internal Server Error: Unexpected error
 */
router.get('/', getAllCategoriesHandler);

/**
 * GET /api/categories/:id/listings
 * 
 * Get all listings in a specific category
 * 
 * Public endpoint (no authentication required)
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
 * Response includes:
 * - Category details (name, slug, description)
 * - Array of listings in the category
 * - Seller information for each listing
 * - Pagination metadata (totalCount, hasMore, etc.)
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
 * 
 * Returns:
 * - 200 OK: Listings retrieved successfully
 * - 400 Bad Request: Invalid category ID or pagination parameters
 * - 404 Not Found: Category doesn't exist
 * - 500 Internal Server Error: Unexpected error
 * 
 * Route Order Note:
 * This route MUST come after the / route because Express matches routes
 * in order. If this came before /, the path would never match.
 * 
 * Specific routes (no parameters) should come before parameterized routes.
 */
router.get('/:id/listings', getListingsByCategoryHandler);

export default router;
