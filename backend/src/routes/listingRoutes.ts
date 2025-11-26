/**
 * Listing Routes
 * 
 * Defines all listing-related API endpoints.
 * 
 * Why separate route files?
 * - Organization: Group related endpoints together
 * - Maintainability: Easy to find and modify routes
 * - Scalability: Can add middleware per route group
 * - Testing: Can test routes independently
 */

import { Router } from 'express';
import { createListingHandler, getListingHandler, getAllListingsHandler, updateListingHandler, updateListingStatusHandler, deleteListingHandler } from '../controllers/listingController';
import { authenticate } from '../middleware/authMiddleware';

// Create a new router instance
// This router will be mounted at /api/listings in the main app
const router = Router();

/**
 * GET /api/listings
 * 
 * Get all listings with pagination
 * 
 * Public endpoint (no authentication required)
 * 
 * Query Parameters:
 * - limit: number (optional, default: 20, max: 100) - How many listings to return
 * - offset: number (optional, default: 0) - How many listings to skip
 * 
 * Query Parameter Explanation:
 * Query parameters are added to the URL after a ? symbol:
 * Example: GET /api/listings?limit=20&offset=40
 * 
 * This tells the API:
 * - Return 20 listings (limit=20)
 * - Skip the first 40 listings (offset=40)
 * - So we get listings 41-60
 * 
 * Pagination Benefits:
 * 1. Performance: Don't load thousands of listings at once
 * 2. Bandwidth: Send only what the user needs
 * 3. User Experience: Faster page loads, smoother scrolling
 * 4. Scalability: Works well as the database grows
 * 
 * Frontend Usage:
 * - Page 1: ?limit=20&offset=0
 * - Page 2: ?limit=20&offset=20
 * - Page 3: ?limit=20&offset=40
 * - Formula: offset = (page - 1) * limit
 * 
 * Response includes:
 * - listings: Array of listing objects with seller and category info
 * - totalCount: Total number of active listings
 * - limit: The limit used (validated by backend)
 * - offset: The offset used
 * - hasMore: Boolean indicating if there are more listings to load
 * 
 * Why is this public?
 * - Users should be able to browse before signing up
 * - Encourages registration by showing what's available
 * - Allows search engines to index listings (SEO)
 * 
 * Route Order Matters!
 * This route MUST come before /:id route because:
 * - Express matches routes in order
 * - If /:id came first, "listings" would be treated as an ID
 * - Specific routes (no parameters) should come before parameterized routes
 * 
 * Returns:
 * - 200 OK: Listings retrieved successfully
 * - 400 Bad Request: Invalid pagination parameters
 * - 500 Internal Server Error: Unexpected error
 */
router.get('/', getAllListingsHandler);

/**
 * POST /api/listings
 * 
 * Create a new listing (item or service)
 * 
 * Protected endpoint (authentication required)
 * 
 * The authenticateToken middleware:
 * 1. Extracts JWT token from Authorization header
 * 2. Verifies token is valid and not expired
 * 3. Adds userId to request object
 * 4. Calls next() to proceed to controller
 * 5. Returns 401 error if token is invalid
 * 
 * Request body:
 * - title: string (required) - Short title for the listing
 * - description: string (required) - Detailed description
 * - price: number (required) - Price in dollars
 * - listingType: 'item' | 'service' (required) - Type of listing
 * - pricingType: 'fixed' | 'hourly' (required for services) - How service is priced
 * - categoryId: string (required) - UUID of category
 * - images: string[] (required) - Array of image URLs (1-10)
 * - location: string (required) - General location
 * 
 * Polymorphic Data Model:
 * This endpoint handles two types of listings:
 * 
 * 1. Item Listings:
 *    - listingType: 'item'
 *    - pricingType: not used (should be omitted)
 *    - price: fixed price for the item
 * 
 * 2. Service Listings:
 *    - listingType: 'service'
 *    - pricingType: 'fixed' or 'hourly'
 *    - price: fixed price or hourly rate
 * 
 * Example Item Listing:
 * {
 *   "title": "Vintage Desk Lamp",
 *   "description": "Beautiful brass desk lamp from the 1960s",
 *   "price": 45.00,
 *   "listingType": "item",
 *   "categoryId": "uuid-of-furniture-category",
 *   "images": ["url1", "url2"],
 *   "location": "San Francisco, CA"
 * }
 * 
 * Example Service Listing:
 * {
 *   "title": "Web Development Services",
 *   "description": "Full-stack web development with React and Node.js",
 *   "price": 75.00,
 *   "listingType": "service",
 *   "pricingType": "hourly",
 *   "categoryId": "uuid-of-services-category",
 *   "images": ["portfolio-url"],
 *   "location": "Remote"
 * }
 * 
 * Returns:
 * - 201 Created: Listing created successfully
 * - 400 Bad Request: Invalid data or validation error
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: Category doesn't exist
 * - 500 Internal Server Error: Unexpected error
 */
router.post('/', authenticate, createListingHandler);

/**
 * GET /api/listings/:id
 * 
 * Get a specific listing by ID
 * 
 * Public endpoint (no authentication required)
 * 
 * This endpoint demonstrates EAGER LOADING to avoid the N+1 query problem.
 * 
 * The N+1 Query Problem:
 * When displaying data with relationships, you might fetch the main data
 * in one query, then fetch each related item in separate queries.
 * 
 * Example without eager loading:
 * 1. Fetch listing (1 query)
 * 2. Fetch seller for that listing (1 query)
 * 3. Fetch category for that listing (1 query)
 * Total: 3 queries for one listing
 * 
 * For 100 listings: 1 + 100 + 100 = 201 queries!
 * 
 * With eager loading (using SQL JOINs):
 * 1. Fetch listing with seller and category in one query
 * Total: 1 query for one listing
 * 
 * For 100 listings: 1 query!
 * 
 * Prisma's `include` option automatically creates SQL JOINs to fetch
 * related data efficiently. This is a best practice for performance.
 * 
 * URL Parameters:
 * - id: UUID of the listing
 * 
 * Response includes:
 * - All listing fields
 * - Seller information (username, profile picture, rating, join date)
 * - Category information (name, slug)
 * 
 * Why is this public?
 * - Users should be able to browse listings before signing up
 * - Allows sharing listing links
 * - Enables search engine indexing (SEO)
 * 
 * Returns:
 * - 200 OK: Listing found and returned
 * - 400 Bad Request: Invalid listing ID
 * - 404 Not Found: Listing doesn't exist
 * - 500 Internal Server Error: Unexpected error
 */
router.get('/:id', getListingHandler);

/**
 * PUT /api/listings/:id
 * 
 * Update an existing listing
 * 
 * Protected endpoint (authentication required)
 * Authorization: User must own the listing
 * 
 * Authentication vs Authorization:
 * - Authentication: Verifies WHO you are (JWT token)
 * - Authorization: Verifies WHAT you can do (ownership check)
 * 
 * This endpoint demonstrates both:
 * 1. authenticate middleware verifies the user is logged in (authentication)
 * 2. Service layer verifies the user owns the listing (authorization)
 * 
 * Real-world analogy:
 * - Authentication = Showing your ID to enter a building
 * - Authorization = Having the key to a specific office in that building
 * 
 * Request body (all fields optional - supports partial updates):
 * - title: string
 * - description: string
 * - price: number
 * - listingType: 'item' | 'service'
 * - pricingType: 'fixed' | 'hourly'
 * - categoryId: string
 * - images: string[]
 * - location: string
 * - status: 'active' | 'sold' | 'completed' | 'deleted'
 * 
 * Partial Updates:
 * You only need to include the fields you want to change.
 * Example: { "price": 75.00 } updates only the price
 * 
 * Immutable Fields (cannot be changed):
 * - id: Primary key
 * - sellerId: Ownership is permanent
 * - createdAt: Original creation timestamp is preserved
 * 
 * Why preserve createdAt?
 * - Users want to know when a listing was originally posted
 * - "Posted 3 days ago" should reflect original date, not last edit
 * - Prevents gaming "newest first" sorting by repeatedly editing
 * - Maintains historical accuracy and data integrity
 * 
 * The updatedAt field is automatically updated by Prisma to reflect
 * when the listing was last modified.
 * 
 * Returns:
 * - 200 OK: Listing updated successfully
 * - 400 Bad Request: Invalid data or validation error
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User doesn't own the listing (authorization failure)
 * - 404 Not Found: Listing doesn't exist
 * - 500 Internal Server Error: Unexpected error
 * 
 * HTTP Status Codes Explained:
 * - 401 Unauthorized: "I don't know who you are" (authentication failed)
 * - 403 Forbidden: "I know who you are, but you can't do that" (authorization failed)
 * 
 * Route Order Note:
 * This route comes after /:id GET route because Express matches routes
 * in order. If this came before /:id, "update" would be treated as an ID.
 * Specific routes should come before parameterized routes.
 */
router.put('/:id', authenticate, updateListingHandler);

/**
 * PATCH /api/listings/:id/status
 * 
 * Update listing status (mark as sold/completed/active)
 * 
 * Protected endpoint (authentication required)
 * Authorization: User must own the listing
 * 
 * This endpoint demonstrates STATE MANAGEMENT in REST APIs.
 * 
 * Why a separate endpoint for status updates?
 * - Semantic clarity: The intent is clear (changing status, not full update)
 * - Efficiency: Only updates one field, not the entire listing
 * - Security: Can apply different authorization rules if needed
 * - API design: Follows REST best practices for resource state changes
 * 
 * PATCH vs PUT:
 * - PATCH: Partial update (only specified fields)
 * - PUT: Full replacement (requires all fields)
 * 
 * For single-field updates like status, PATCH is the correct choice.
 * 
 * Request body:
 * {
 *   status: 'active' | 'sold' | 'completed' | 'deleted'
 * }
 * 
 * Status Transitions:
 * - active → sold: Item was purchased
 * - active → completed: Service was completed
 * - sold/completed → active: Re-list the item/service
 * - any → deleted: Soft delete (hide from searches)
 * 
 * Impact on Search Results:
 * Listings with status 'sold', 'completed', or 'deleted' are automatically
 * excluded from active search results. This keeps the marketplace clean
 * and prevents buyers from contacting sellers about unavailable items.
 * 
 * The listing remains in the database for:
 * - Historical records
 * - Transaction history
 * - Analytics and reporting
 * - Potential re-activation
 * 
 * Returns:
 * - 200 OK: Status updated successfully
 * - 400 Bad Request: Invalid status value or missing status field
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User doesn't own the listing
 * - 404 Not Found: Listing doesn't exist
 * - 500 Internal Server Error: Unexpected error
 * 
 * Route Order Note:
 * This route MUST come before /:id routes because Express matches routes
 * in order. If /:id came first, "status" would be treated as an ID.
 * 
 * Specific routes (with fixed path segments) should come before
 * parameterized routes (with :param).
 */
router.patch('/:id/status', authenticate, updateListingStatusHandler);

/**
 * DELETE /api/listings/:id
 * 
 * Delete a listing permanently (hard delete)
 * 
 * Protected endpoint (authentication required)
 * Authorization: User must own the listing
 * 
 * This endpoint demonstrates HARD DELETE - permanent removal from database.
 * 
 * Hard Delete vs Soft Delete:
 * 
 * Soft Delete (PATCH /:id/status with status='deleted'):
 * - Sets status to 'deleted'
 * - Keeps data in database
 * - Can be undone
 * - Preserves relationships
 * - Good for temporary removal
 * 
 * Hard Delete (this endpoint):
 * - Permanently removes from database
 * - Cannot be undone
 * - Complete data removal
 * - Respects user's right to delete data
 * 
 * When to use:
 * - User wants permanent removal
 * - Privacy concerns
 * - Cleaning up unwanted listings
 * - User explicitly requests deletion
 * 
 * URL Parameters:
 * - id: string (UUID) - The listing ID to delete
 * 
 * Authorization:
 * Only the seller who created the listing can delete it.
 * This is enforced in the service layer.
 * 
 * Returns:
 * - 200 OK: Listing deleted successfully
 * - 400 Bad Request: Invalid listing ID
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User doesn't own the listing
 * - 404 Not Found: Listing doesn't exist
 * - 500 Internal Server Error: Unexpected error
 * 
 * Route Order Note:
 * This route MUST come after specific routes like /:id/status
 * because Express matches routes in order. If this came before
 * /:id/status, "status" would be treated as an ID.
 * 
 * Specific routes should come before parameterized routes.
 */
router.delete('/:id', authenticate, deleteListingHandler);

/**
 * Future listing routes will be added here:
 * 
 * POST /api/listings/:id/images - Upload listing images
 */

export default router;
