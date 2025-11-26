/**
 * Listing Controller
 * 
 * Handles HTTP requests for listing endpoints.
 * 
 * Controller responsibilities:
 * - Parse and validate HTTP requests
 * - Extract user ID from authentication token
 * - Call service layer for business logic
 * - Format and send HTTP responses
 * - Handle errors and return appropriate status codes
 */

import { Response } from 'express';
import { Request } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { createListing, getListingById, getAllListings, updateListing, updateListingStatus, deleteListing, searchListings } from '../services/listingService';

/**
 * Create a new listing
 * 
 * POST /api/listings
 * 
 * Authentication: Required (JWT token)
 * The authenticated user becomes the seller
 * 
 * Request body:
 * {
 *   title: string,
 *   description: string,
 *   price: number,
 *   listingType: 'item' | 'service',
 *   pricingType?: 'fixed' | 'hourly', // Required for services
 *   categoryId: string,
 *   images: string[], // Array of image URLs (1-10 images)
 *   location: string
 * }
 * 
 * Success response (201 Created):
 * {
 *   message: string,
 *   listing: {
 *     id: string,
 *     sellerId: string,
 *     title: string,
 *     description: string,
 *     price: number,
 *     listingType: string,
 *     pricingType: string | null,
 *     categoryId: string,
 *     images: string[],
 *     status: string,
 *     location: string,
 *     createdAt: Date,
 *     updatedAt: Date
 *   }
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid input data or validation failure
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: Category doesn't exist
 * - 500 Internal Server Error: Unexpected error
 * 
 * Validation Strategy:
 * 1. Controller validates HTTP-level concerns (required fields present)
 * 2. Service validates business logic (type rules, constraints)
 * 3. Database validates data integrity (foreign keys, unique constraints)
 * 
 * This layered approach ensures:
 * - Fast feedback (fail early on missing fields)
 * - Clear error messages (specific to the validation layer)
 * - Separation of concerns (HTTP vs business vs data)
 */
export async function createListingHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Extract user ID from authenticated request
    // The auth middleware adds user info to the request object
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const userId = req.user.userId;

    // Extract listing data from request body
    const {
      title,
      description,
      price,
      listingType,
      pricingType,
      categoryId,
      images,
      location,
    } = req.body;

    // Step 1: Validate required fields are present
    // This is HTTP-level validation - checking the request structure
    if (!title || !description || !price || !listingType || !categoryId || !location) {
      res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required fields',
          details: {
            required: ['title', 'description', 'price', 'listingType', 'categoryId', 'location'],
          },
        },
      });
      return;
    }

    // Step 2: Validate images array
    if (!images || !Array.isArray(images)) {
      res.status(400).json({
        error: {
          code: 'INVALID_IMAGES',
          message: 'Images must be provided as an array',
        },
      });
      return;
    }

    // Step 3: Validate price is a number
    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) {
      res.status(400).json({
        error: {
          code: 'INVALID_PRICE',
          message: 'Price must be a valid number',
        },
      });
      return;
    }

    // Step 4: Call service to create listing
    // Service layer handles business logic validation
    const listing = await createListing({
      sellerId: userId,
      title,
      description,
      price: priceNum,
      listingType,
      pricingType,
      categoryId,
      images,
      location,
    });

    // Step 5: Return success response
    res.status(201).json({
      message: 'Listing created successfully',
      listing,
    });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      // Business logic validation errors from service
      if (
        error.message.includes('Listing type must be') ||
        error.message.includes('Pricing type') ||
        error.message.includes('Price must be') ||
        error.message.includes('images') ||
        error.message.includes('image is required')
      ) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        });
        return;
      }

      // Category not found
      if (error.message.includes('Invalid category')) {
        res.status(404).json({
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'The specified category does not exist',
          },
        });
        return;
      }

      // Seller not found (shouldn't happen if auth works correctly)
      if (error.message.includes('Invalid seller')) {
        res.status(404).json({
          error: {
            code: 'SELLER_NOT_FOUND',
            message: 'Seller account not found',
          },
        });
        return;
      }
    }

    // Log unexpected errors
    console.error('Create listing error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while creating the listing',
      },
    });
  }
}

/**
 * Get all listings with pagination
 * 
 * GET /api/listings
 * 
 * Authentication: Not required (public endpoint)
 * Anyone can browse listings
 * 
 * Query Parameters:
 * - limit: number (optional, default: 20) - How many listings to return
 * - offset: number (optional, default: 0) - How many listings to skip
 * 
 * Query Parameter Explanation:
 * Query parameters are key-value pairs in the URL after the ? symbol.
 * Example: /api/listings?limit=20&offset=40
 * 
 * The browser/client sends these as part of the URL, and Express
 * automatically parses them into req.query object:
 * - req.query.limit = "20"
 * - req.query.offset = "40"
 * 
 * Note: Query parameters are always strings, so we need to parse them
 * to numbers using parseInt().
 * 
 * Pagination Math:
 * - Page 1: offset=0, limit=20 → items 1-20
 * - Page 2: offset=20, limit=20 → items 21-40
 * - Page 3: offset=40, limit=20 → items 41-60
 * - Formula: offset = (page - 1) * limit
 * 
 * Success response (200 OK):
 * {
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
 * Pagination Metadata:
 * - totalCount: Total number of active listings (for calculating pages)
 * - limit: The limit used (may differ from requested if invalid)
 * - offset: The offset used
 * - hasMore: Whether there are more listings to load (useful for "Load More" buttons)
 * 
 * Error responses:
 * - 400 Bad Request: Invalid pagination parameters
 * - 500 Internal Server Error: Unexpected error
 * 
 * Why is this endpoint public?
 * - Users should be able to browse listings before signing up
 * - Encourages user registration by showing available items
 * - Allows search engines to index listings (SEO)
 * 
 * Performance Considerations:
 * - Only returns active listings (not sold/deleted)
 * - Uses eager loading to include seller info efficiently
 * - Limits maximum page size to prevent abuse
 * - Orders by newest first for better user experience
 */
export async function getAllListingsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Extract pagination parameters from query string
    // Query parameters are always strings, so we need to parse them
    const limitParam = req.query.limit as string | undefined;
    const offsetParam = req.query.offset as string | undefined;

    // Parse limit with default value of 20
    // parseInt() converts string to number
    // If parsing fails (NaN), use default value
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
    // Negative values don't make sense for pagination
    if (limit < 0 || offset < 0) {
      res.status(400).json({
        error: {
          code: 'INVALID_PAGINATION',
          message: 'Limit and offset must be non-negative numbers',
        },
      });
      return;
    }

    // Call service to get listings with pagination
    // The service handles validation and database queries
    const result = await getAllListings(limit, offset);

    // Return listings with pagination metadata
    // The frontend can use this metadata to:
    // - Display "Page X of Y"
    // - Show/hide "Next" and "Previous" buttons
    // - Implement "Load More" functionality
    // - Display total results count
    res.status(200).json({
      listings: result.listings,
      totalCount: result.totalCount,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    });
  } catch (error) {
    // Log unexpected errors
    console.error('Get all listings error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while retrieving listings',
      },
    });
  }
}

/**
 * Get a listing by ID
 * 
 * GET /api/listings/:id
 * 
 * Authentication: Not required (public endpoint)
 * Anyone can view listing details
 * 
 * URL Parameters:
 * - id: string (UUID) - The listing ID
 * 
 * Success response (200 OK):
 * {
 *   listing: {
 *     id: string,
 *     sellerId: string,
 *     title: string,
 *     description: string,
 *     price: number,
 *     listingType: string,
 *     pricingType: string | null,
 *     categoryId: string,
 *     images: string[],
 *     status: string,
 *     location: string,
 *     createdAt: Date,
 *     updatedAt: Date,
 *     seller: {
 *       id: string,
 *       username: string,
 *       profilePicture: string | null,
 *       averageRating: number,
 *       joinDate: Date
 *     },
 *     category: {
 *       id: string,
 *       name: string,
 *       slug: string
 *     }
 *   }
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid listing ID format
 * - 404 Not Found: Listing doesn't exist
 * - 500 Internal Server Error: Unexpected error
 * 
 * Why is this endpoint public?
 * - Users need to browse listings before creating an account
 * - Search engines can index listings for SEO
 * - Sharing listing links works without authentication
 * 
 * Eager Loading Explanation:
 * This endpoint uses eager loading to fetch the listing and its related
 * seller and category data in a single database query. This avoids the
 * N+1 query problem and improves performance.
 * 
 * Without eager loading:
 * 1. Query to get listing
 * 2. Query to get seller
 * 3. Query to get category
 * Total: 3 queries
 * 
 * With eager loading:
 * 1. Query with JOINs to get listing + seller + category
 * Total: 1 query
 * 
 * This is especially important when displaying multiple listings,
 * where the savings multiply (N listings = N*3 queries vs 1 query).
 */
export async function getListingHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Extract listing ID from URL parameters
    const { id } = req.params;

    // Validate that ID is provided
    if (!id) {
      res.status(400).json({
        error: {
          code: 'MISSING_ID',
          message: 'Listing ID is required',
        },
      });
      return;
    }

    // Call service to get listing with seller information
    // This uses eager loading to fetch related data efficiently
    const listing = await getListingById(id);

    // Check if listing exists
    if (!listing) {
      res.status(404).json({
        error: {
          code: 'LISTING_NOT_FOUND',
          message: 'Listing not found',
        },
      });
      return;
    }

    // Return listing with seller and category information
    res.status(200).json({
      listing,
    });
  } catch (error) {
    // Log unexpected errors
    console.error('Get listing error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while retrieving the listing',
      },
    });
  }
}

/**
 * Update a listing
 * 
 * PUT /api/listings/:id
 * 
 * Authentication: Required (JWT token)
 * Authorization: User must own the listing
 * 
 * This endpoint demonstrates the difference between authentication and authorization:
 * 
 * Authentication (handled by middleware):
 * - Verifies WHO the user is
 * - Checks if JWT token is valid
 * - Extracts user ID from token
 * - Ensures user is logged in
 * 
 * Authorization (handled in controller/service):
 * - Verifies WHAT the user can do
 * - Checks if user owns the listing
 * - Prevents users from editing others' listings
 * - Enforces business rules about permissions
 * 
 * Analogy:
 * - Authentication = Showing your ID at the door (proving who you are)
 * - Authorization = Checking if you're on the guest list (proving you're allowed in)
 * 
 * URL Parameters:
 * - id: string (UUID) - The listing ID to update
 * 
 * Request body (all fields optional - partial updates supported):
 * {
 *   title?: string,
 *   description?: string,
 *   price?: number,
 *   listingType?: 'item' | 'service',
 *   pricingType?: 'fixed' | 'hourly',
 *   categoryId?: string,
 *   images?: string[],
 *   location?: string,
 *   status?: 'active' | 'sold' | 'completed' | 'deleted'
 * }
 * 
 * Partial Updates:
 * You only need to include the fields you want to change.
 * Other fields will remain unchanged.
 * 
 * Example: Update only the price
 * PUT /api/listings/123
 * { "price": 75.00 }
 * 
 * Example: Update title and description
 * PUT /api/listings/123
 * { "title": "New Title", "description": "Updated description" }
 * 
 * Immutable Fields:
 * These fields CANNOT be changed after creation:
 * - id: Primary key
 * - sellerId: Ownership is permanent
 * - createdAt: Original creation timestamp must be preserved
 * 
 * Why preserve createdAt?
 * - Users want to know when a listing was originally posted
 * - "Posted 3 days ago" should reflect original date, not last edit
 * - Prevents gaming "newest first" sorting by editing
 * - Maintains data integrity and historical accuracy
 * 
 * Success response (200 OK):
 * {
 *   message: string,
 *   listing: {
 *     id: string,
 *     sellerId: string,
 *     title: string,
 *     description: string,
 *     price: number,
 *     listingType: string,
 *     pricingType: string | null,
 *     categoryId: string,
 *     images: string[],
 *     status: string,
 *     location: string,
 *     createdAt: Date,  // PRESERVED - never changes
 *     updatedAt: Date   // UPDATED - reflects last edit time
 *   }
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid input data or validation failure
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User doesn't own the listing (authorization failure)
 * - 404 Not Found: Listing doesn't exist
 * - 500 Internal Server Error: Unexpected error
 * 
 * HTTP Status Code Explanation:
 * - 401 Unauthorized: Authentication failed (who are you?)
 * - 403 Forbidden: Authorization failed (you can't do that)
 * 
 * Common confusion: 401 vs 403
 * - 401: "I don't know who you are" (no valid token)
 * - 403: "I know who you are, but you're not allowed" (valid token, wrong user)
 */
export async function updateListingHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Step 1: Verify authentication
    // The auth middleware adds user info to the request object
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const userId = req.user.userId;

    // Step 2: Extract listing ID from URL parameters
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: {
          code: 'MISSING_ID',
          message: 'Listing ID is required',
        },
      });
      return;
    }

    // Step 3: Extract update data from request body
    // All fields are optional - this supports partial updates
    const {
      title,
      description,
      price,
      listingType,
      pricingType,
      categoryId,
      images,
      location,
      status,
    } = req.body;

    // Step 4: Validate price if provided
    let priceNum: number | undefined;
    if (price !== undefined) {
      priceNum = parseFloat(price);
      if (isNaN(priceNum)) {
        res.status(400).json({
          error: {
            code: 'INVALID_PRICE',
            message: 'Price must be a valid number',
          },
        });
        return;
      }
    }

    // Step 5: Validate images if provided
    if (images !== undefined && !Array.isArray(images)) {
      res.status(400).json({
        error: {
          code: 'INVALID_IMAGES',
          message: 'Images must be provided as an array',
        },
      });
      return;
    }

    // Step 6: Call service to update listing
    // The service handles:
    // - Authorization (checking if user owns the listing)
    // - Business logic validation
    // - Preserving immutable fields (createdAt)
    const updatedListing = await updateListing(id, userId, {
      title,
      description,
      price: priceNum,
      listingType,
      pricingType,
      categoryId,
      images,
      location,
      status,
    });

    // Step 7: Return success response
    res.status(200).json({
      message: 'Listing updated successfully',
      listing: updatedListing,
    });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      // Authorization error - user doesn't own the listing
      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
        return;
      }

      // Listing not found
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'LISTING_NOT_FOUND',
            message: 'Listing not found',
          },
        });
        return;
      }

      // Business logic validation errors from service
      if (
        error.message.includes('Listing type must be') ||
        error.message.includes('Pricing type') ||
        error.message.includes('Price must be') ||
        error.message.includes('images') ||
        error.message.includes('image is required') ||
        error.message.includes('Invalid category')
      ) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        });
        return;
      }
    }

    // Log unexpected errors
    console.error('Update listing error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while updating the listing',
      },
    });
  }
}

/**
 * Update listing status
 * 
 * PATCH /api/listings/:id/status
 * 
 * Authentication: Required (JWT token)
 * Authorization: User must own the listing
 * 
 * This endpoint demonstrates STATE MANAGEMENT and STATUS TRANSITIONS.
 * 
 * State Management Explained:
 * In software, "state" refers to the current condition or status of data.
 * For a listing, the state is tracked by the status field.
 * 
 * State Transitions:
 * A state transition is a change from one state to another.
 * Valid transitions for listings:
 * - active → sold (item was purchased)
 * - active → completed (service was completed)  
 * - sold → active (transaction fell through, re-list)
 * - completed → active (service available again)
 * - any → deleted (seller removes listing)
 * 
 * Why PATCH instead of PUT?
 * HTTP methods have specific meanings:
 * - GET: Retrieve data (read-only)
 * - POST: Create new resource
 * - PUT: Replace entire resource (requires all fields)
 * - PATCH: Partial update (only specified fields)
 * - DELETE: Remove resource
 * 
 * Since we're only updating the status field (not the entire listing),
 * PATCH is the semantically correct choice. It's more efficient and
 * clearer about the intent.
 * 
 * REST API Best Practice:
 * Use specific endpoints for specific actions:
 * - PUT /api/listings/:id - Update entire listing
 * - PATCH /api/listings/:id/status - Update only status
 * 
 * This makes the API more intuitive and prevents accidental overwrites.
 * 
 * URL Parameters:
 * - id: string (UUID) - The listing ID
 * 
 * Request body:
 * {
 *   status: 'active' | 'sold' | 'completed' | 'deleted'
 * }
 * 
 * Status Values Explained:
 * - active: Listing is available for purchase/booking
 * - sold: Item has been sold (for physical items)
 * - completed: Service has been completed (for services)
 * - deleted: Listing has been removed (soft delete)
 * 
 * Soft Delete vs Hard Delete:
 * - Soft delete: Set status to 'deleted', keep in database
 * - Hard delete: Actually remove from database (DELETE endpoint)
 * 
 * Soft delete is useful because:
 * - Can be undone if accidental
 * - Preserves transaction history
 * - Maintains referential integrity (messages, ratings still work)
 * - Useful for analytics and reporting
 * 
 * Success response (200 OK):
 * {
 *   message: string,
 *   listing: {
 *     id: string,
 *     sellerId: string,
 *     title: string,
 *     description: string,
 *     price: number,
 *     listingType: string,
 *     pricingType: string | null,
 *     categoryId: string,
 *     images: string[],
 *     status: string,  // UPDATED - reflects new status
 *     location: string,
 *     createdAt: Date,  // PRESERVED - never changes
 *     updatedAt: Date   // UPDATED - reflects status change time
 *   }
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid status value or missing status field
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User doesn't own the listing (authorization failure)
 * - 404 Not Found: Listing doesn't exist
 * - 500 Internal Server Error: Unexpected error
 * 
 * Use Cases:
 * 1. Seller sold item outside platform → status: 'sold'
 * 2. Service provider completed job → status: 'completed'
 * 3. Seller wants to re-list → status: 'active'
 * 4. Seller wants to hide listing → status: 'deleted'
 * 
 * Impact on Search:
 * When a listing is marked as 'sold', 'completed', or 'deleted',
 * it's automatically excluded from active search results.
 * This keeps the marketplace clean and prevents buyers from
 * contacting sellers about unavailable items.
 */
export async function updateListingStatusHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Step 1: Verify authentication
    // The auth middleware adds user info to the request object
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const userId = req.user.userId;

    // Step 2: Extract listing ID from URL parameters
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: {
          code: 'MISSING_ID',
          message: 'Listing ID is required',
        },
      });
      return;
    }

    // Step 3: Extract status from request body
    const { status } = req.body;

    // Validation: Status is required
    if (!status) {
      res.status(400).json({
        error: {
          code: 'MISSING_STATUS',
          message: 'Status field is required',
          details: {
            validStatuses: ['active', 'sold', 'completed', 'deleted'],
          },
        },
      });
      return;
    }

    // Step 4: Call service to update listing status
    // The service handles:
    // - Authorization (checking if user owns the listing)
    // - Status validation (ensuring status is valid)
    // - Database update
    const updatedListing = await updateListingStatus(id, userId, status);

    // Step 5: Return success response
    res.status(200).json({
      message: 'Listing status updated successfully',
      listing: updatedListing,
    });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      // Authorization error - user doesn't own the listing
      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
        return;
      }

      // Listing not found
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'LISTING_NOT_FOUND',
            message: 'Listing not found',
          },
        });
        return;
      }

      // Invalid status value
      if (error.message.includes('Invalid status')) {
        res.status(400).json({
          error: {
            code: 'INVALID_STATUS',
            message: error.message,
          },
        });
        return;
      }
    }

    // Log unexpected errors
    console.error('Update listing status error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while updating the listing status',
      },
    });
  }
}

/**
 * Delete a listing permanently
 * 
 * DELETE /api/listings/:id
 * 
 * Authentication: Required (JWT token)
 * Authorization: User must own the listing
 * 
 * This endpoint demonstrates HARD DELETE vs SOFT DELETE.
 * 
 * Soft Delete vs Hard Delete:
 * 
 * Soft Delete (PATCH /api/listings/:id/status with status='deleted'):
 * - Sets status field to 'deleted'
 * - Listing stays in database
 * - Can be undone (set status back to 'active')
 * - Preserves all relationships (messages, ratings)
 * - Useful for temporary removal
 * - Good for analytics and historical records
 * 
 * Hard Delete (this endpoint):
 * - Permanently removes listing from database
 * - Cannot be undone
 * - May affect relationships (messages, ratings)
 * - Complete data removal
 * - Respects user's right to delete their data
 * 
 * When to use each:
 * 
 * Use Soft Delete when:
 * - User marks item as "sold" or "no longer available"
 * - Temporary removal (might want to re-list later)
 * - Need to preserve transaction history
 * - Want to maintain referential integrity
 * 
 * Use Hard Delete when:
 * - User wants complete data removal
 * - Privacy concerns (remove personal information)
 * - Cleaning up test/spam listings
 * - User explicitly requests permanent deletion
 * 
 * Real-world Examples:
 * - Facebook Marketplace: Uses soft delete (can restore listings)
 * - Craigslist: Uses hard delete (listings are gone forever)
 * - eBay: Uses soft delete (maintains transaction history)
 * 
 * Our Implementation:
 * We provide both options:
 * - Soft delete via status update (PATCH /api/listings/:id/status)
 * - Hard delete via this endpoint (DELETE /api/listings/:id)
 * 
 * This gives users flexibility:
 * - Mark as sold → soft delete (can reactivate if sale falls through)
 * - Delete listing → hard delete (permanent removal)
 * 
 * Database Considerations:
 * When we add messaging, we'll need to handle messages that reference
 * deleted listings. Options:
 * 1. Set listingId to NULL (preserve messages, remove listing reference)
 * 2. Cascade delete (delete messages too)
 * 3. Prevent deletion if messages exist
 * 
 * We'll implement option 1 (set to NULL) to preserve message history
 * while respecting the user's right to delete their listing.
 * 
 * URL Parameters:
 * - id: string (UUID) - The listing ID to delete
 * 
 * Success response (200 OK):
 * {
 *   message: 'Listing deleted successfully'
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid listing ID
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User doesn't own the listing (authorization failure)
 * - 404 Not Found: Listing doesn't exist
 * - 500 Internal Server Error: Unexpected error
 * 
 * HTTP Status Codes:
 * - 200 OK: Deletion successful (we return 200 instead of 204 to include a message)
 * - 204 No Content: Alternative for successful deletion (no response body)
 * 
 * We use 200 OK with a message for better user feedback.
 * 
 * Security Note:
 * The authorization check in the service layer ensures users can only
 * delete their own listings. This prevents malicious users from deleting
 * others' listings even if they know the listing ID.
 */
export async function deleteListingHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Step 1: Verify authentication
    // The auth middleware adds user info to the request object
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const userId = req.user.userId;

    // Step 2: Extract listing ID from URL parameters
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: {
          code: 'MISSING_ID',
          message: 'Listing ID is required',
        },
      });
      return;
    }

    // Step 3: Call service to delete listing
    // The service handles:
    // - Authorization (checking if user owns the listing)
    // - Permanent deletion from database
    await deleteListing(id, userId);

    // Step 4: Return success response
    // We use 200 OK with a message instead of 204 No Content
    // to provide feedback to the user
    res.status(200).json({
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      // Authorization error - user doesn't own the listing
      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
        return;
      }

      // Listing not found
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'LISTING_NOT_FOUND',
            message: 'Listing not found',
          },
        });
        return;
      }
    }

    // Log unexpected errors
    console.error('Delete listing error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while deleting the listing',
      },
    });
  }
}

/**
 * Search listings by query with optional filters
 * 
 * GET /api/search
 * 
 * Authentication: Not required (public endpoint)
 * Anyone can search listings
 * 
 * Query Parameters:
 * - q: string (optional) - The search query (can search with filters only)
 * - categoryId: string (optional) - Filter by category ID
 * - listingType: string (optional) - Filter by 'item' or 'service'
 * - minPrice: number (optional) - Minimum price (inclusive)
 * - maxPrice: number (optional) - Maximum price (inclusive)
 * - location: string (optional) - Filter by location (partial match)
 * - limit: number (optional, default: 20) - How many listings to return
 * - offset: number (optional, default: 0) - How many listings to skip
 * 
 * Query Parameter Explanation:
 * Query parameters are key-value pairs in the URL after the ? symbol.
 * Multiple parameters are separated by & symbols.
 * 
 * Example URLs:
 * - /api/search?q=laptop → Search for "laptop"
 * - /api/search?q=laptop&categoryId=abc123 → Search for "laptop" in specific category
 * - /api/search?categoryId=abc123&listingType=item → Browse items in category (no text search)
 * - /api/search?q=desk&minPrice=50&maxPrice=200 → Search for "desk" between $50-$200
 * - /api/search?listingType=service&location=New+York → Find services in New York
 * 
 * Filter Combination (AND Logic):
 * All specified filters must match for a listing to be included.
 * This is called "filter composition" - filters narrow down results.
 * 
 * Example: ?q=laptop&categoryId=electronics&minPrice=500&maxPrice=1000
 * Returns: Laptops in Electronics category priced between $500-$1000
 * 
 * Why AND logic?
 * - Users expect filters to narrow results, not expand them
 * - More intuitive: "Show me laptops under $500 in Electronics"
 * - OR logic would be confusing: "Show me laptops OR anything under $500 OR anything in Electronics"
 * 
 * Search Behavior:
 * - Searches in both title and description fields
 * - Case-insensitive matching (LAPTOP = laptop = Laptop)
 * - Partial word matching ("lap" matches "laptop")
 * - OR logic for text search: matches if query appears in title OR description
 * - AND logic for filters: all filters must match
 * - Only returns active listings (not sold/completed/deleted)
 * 
 * Filter Details:
 * 
 * 1. Category Filter (categoryId):
 *    - Exact match on category ID
 *    - Example: categoryId=abc-123-def
 *    - Use GET /api/categories to get available category IDs
 * 
 * 2. Listing Type Filter (listingType):
 *    - Must be 'item' or 'service'
 *    - Example: listingType=item (physical goods only)
 *    - Example: listingType=service (services only)
 * 
 * 3. Price Range Filter (minPrice, maxPrice):
 *    - Numeric values (dollars)
 *    - Can specify min, max, or both
 *    - Example: minPrice=100 (at least $100)
 *    - Example: maxPrice=500 (at most $500)
 *    - Example: minPrice=100&maxPrice=500 (between $100-$500)
 * 
 * 4. Location Filter (location):
 *    - Case-insensitive partial match
 *    - Example: location=New+York matches "New York, NY" and "New York City"
 *    - Example: location=Remote matches "Remote" and "Remote Work"
 * 
 * Example Searches:
 * - /api/search?q=laptop → All laptops
 * - /api/search?q=laptop&listingType=item → Physical laptop items only
 * - /api/search?q=web+dev&listingType=service → Web development services
 * - /api/search?categoryId=abc123 → All items in category (browse mode)
 * - /api/search?minPrice=100&maxPrice=500 → All items $100-$500
 * - /api/search?q=desk&location=New+York&maxPrice=200 → Desks in NY under $200
 * 
 * Success response (200 OK):
 * {
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
 *   hasMore: boolean,
 *   query: string | null,
 *   filters: {
 *     categoryId?: string,
 *     listingType?: string,
 *     minPrice?: number,
 *     maxPrice?: number,
 *     location?: string
 *   }
 * }
 * 
 * Pagination Metadata:
 * - totalCount: Total number of matching listings
 * - limit: The limit used (may differ from requested if invalid)
 * - offset: The offset used
 * - hasMore: Whether there are more results to load
 * - query: The search query used (null if no text search)
 * - filters: The filters applied (for frontend convenience)
 * 
 * Error responses:
 * - 400 Bad Request: Invalid filter values or pagination parameters
 * - 500 Internal Server Error: Unexpected error
 * 
 * Why is this endpoint public?
 * - Users should be able to search before signing up
 * - Encourages user registration by showing available items
 * - Allows search engines to index listings (SEO)
 * 
 * Performance Considerations:
 * - Only searches active listings
 * - Uses eager loading to include seller info efficiently
 * - Limits maximum page size to prevent abuse
 * - Orders by newest first for better user experience
 * - Database indexes on categoryId, listingType, price, and status speed up filtering
 * 
 * Full-Text Search vs SQL LIKE:
 * 
 * Current Implementation (SQL LIKE):
 * - Simple pattern matching
 * - Works: WHERE title LIKE '%query%' OR description LIKE '%query%'
 * - Pros: Easy to implement, no setup, works everywhere
 * - Cons: Slower on large datasets, no relevance ranking
 * 
 * Future Enhancement (Full-Text Search):
 * - PostgreSQL has built-in full-text search
 * - Creates special indexes for text searching
 * - Provides relevance ranking (best matches first)
 * - Handles word variations (stemming)
 * - Much faster on large datasets
 * 
 * For MVP, SQL LIKE is sufficient. We can upgrade to full-text search
 * later when we have more data and need better performance.
 * 
 * Search Quality Tips:
 * - Use specific keywords (e.g., "vintage desk lamp" vs "lamp")
 * - Try different word orders (e.g., "desk vintage" vs "vintage desk")
 * - Use singular/plural forms (e.g., "laptop" vs "laptops")
 * - Combine text search with filters for best results
 * - Use price range to narrow expensive/cheap items
 * - Use location filter to find local items
 */
export async function searchListingsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Extract search query from query parameters
    // Query is now optional - users can search with filters only
    const query = (req.query.q as string | undefined) || '';

    // Extract filter parameters from query string
    const categoryId = req.query.categoryId as string | undefined;
    const listingType = req.query.listingType as string | undefined;
    const minPriceParam = req.query.minPrice as string | undefined;
    const maxPriceParam = req.query.maxPrice as string | undefined;
    const location = req.query.location as string | undefined;

    // Extract pagination parameters from query string
    const limitParam = req.query.limit as string | undefined;
    const offsetParam = req.query.offset as string | undefined;

    // Validate listingType if provided
    if (listingType && listingType !== 'item' && listingType !== 'service') {
      res.status(400).json({
        error: {
          code: 'INVALID_LISTING_TYPE',
          message: 'Listing type must be either "item" or "service"',
        },
      });
      return;
    }

    // Parse and validate price filters
    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    if (minPriceParam) {
      minPrice = parseFloat(minPriceParam);
      if (isNaN(minPrice) || minPrice < 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_MIN_PRICE',
            message: 'Minimum price must be a non-negative number',
          },
        });
        return;
      }
    }

    if (maxPriceParam) {
      maxPrice = parseFloat(maxPriceParam);
      if (isNaN(maxPrice) || maxPrice < 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_MAX_PRICE',
            message: 'Maximum price must be a non-negative number',
          },
        });
        return;
      }
    }

    // Validate price range logic
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      res.status(400).json({
        error: {
          code: 'INVALID_PRICE_RANGE',
          message: 'Minimum price cannot be greater than maximum price',
        },
      });
      return;
    }

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

    // Build filters object
    const filters: any = {};
    
    if (categoryId) filters.categoryId = categoryId;
    if (listingType) filters.listingType = listingType;
    if (minPrice !== undefined) filters.minPrice = minPrice;
    if (maxPrice !== undefined) filters.maxPrice = maxPrice;
    if (location) filters.location = location;

    // Call service to search listings with filters
    const result = await searchListings(query, filters, limit, offset);

    // Return search results with pagination metadata
    res.status(200).json({
      listings: result.listings,
      totalCount: result.totalCount,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
      query: query || null, // Echo back the query for frontend convenience
      filters: filters, // Echo back the filters applied
    });
  } catch (error) {
    // Log unexpected errors
    console.error('Search listings error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while searching listings',
      },
    });
  }
}
