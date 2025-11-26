/**
 * Listing Service
 * 
 * Handles business logic for listing operations including:
 * - Creating listings (items and services)
 * - Validating listing data
 * - Managing listing images
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
 * Interface for creating a new listing
 * 
 * This defines all the data needed to create a listing.
 * Some fields are optional depending on the listing type.
 */
export interface CreateListingData {
  sellerId: string;
  title: string;
  description: string;
  price: number;
  listingType: 'item' | 'service';
  pricingType?: 'fixed' | 'hourly'; // Only for services
  categoryId: string;
  images: string[]; // Array of image URLs
  location: string;
}

/**
 * Interface for the created listing response
 * Matches the Prisma Listing model
 */
export interface CreatedListing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  listingType: string;
  pricingType: string | null;
  categoryId: string;
  images: string[];
  status: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new listing
 * 
 * This function handles the core business logic for creating listings.
 * It validates the data and stores it in the database.
 * 
 * Polymorphic Data Model Explanation:
 * - One model (Listing) represents two types (item and service)
 * - listingType field determines which type it is
 * - pricingType is conditional - only used for services
 * - Validation ensures type-specific rules are followed
 * 
 * Validation Strategy:
 * 1. Type validation: Ensure listingType is 'item' or 'service'
 * 2. Conditional validation: If service, pricingType is required
 * 3. Business rules: Price must be positive, images limited to 10
 * 4. Foreign key validation: Category must exist
 * 
 * @param data - Listing data from the controller
 * @returns Created listing with all fields
 * @throws Error if validation fails or database operation fails
 */
export async function createListing(
  data: CreateListingData
): Promise<CreatedListing> {
  // Validation 1: Ensure listingType is valid
  if (data.listingType !== 'item' && data.listingType !== 'service') {
    throw new Error('Listing type must be either "item" or "service"');
  }

  // Validation 2: For services, pricingType is required
  if (data.listingType === 'service' && !data.pricingType) {
    throw new Error('Pricing type is required for service listings');
  }

  // Validation 3: For items, pricingType should not be set
  if (data.listingType === 'item' && data.pricingType) {
    throw new Error('Pricing type should not be set for item listings');
  }

  // Validation 4: Validate pricingType if provided
  if (
    data.pricingType &&
    data.pricingType !== 'fixed' &&
    data.pricingType !== 'hourly'
  ) {
    throw new Error('Pricing type must be either "fixed" or "hourly"');
  }

  // Validation 5: Price must be positive
  if (data.price <= 0) {
    throw new Error('Price must be greater than 0');
  }

  // Validation 6: Images array must not exceed 10
  if (data.images.length > 10) {
    throw new Error('Maximum 10 images allowed per listing');
  }

  // Validation 7: At least one image is required
  if (data.images.length === 0) {
    throw new Error('At least one image is required');
  }

  // Validation 8: Verify category exists
  const categoryExists = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!categoryExists) {
    throw new Error('Invalid category ID');
  }

  // Validation 9: Verify seller exists
  const sellerExists = await prisma.user.findUnique({
    where: { id: data.sellerId },
  });

  if (!sellerExists) {
    throw new Error('Invalid seller ID');
  }

  // Create the listing in the database
  // Prisma will automatically set:
  // - id (UUID)
  // - status (default: 'active')
  // - createdAt (current timestamp)
  // - updatedAt (current timestamp)
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
      // status defaults to 'active' in schema
    },
  });

  return listing;
}

/**
 * Get a listing by ID with seller information
 * 
 * This function demonstrates EAGER LOADING to avoid the N+1 query problem.
 * 
 * N+1 Query Problem Explained:
 * - Without eager loading: 1 query for listing + 1 query for seller = 2 queries
 * - With eager loading: 1 query with JOIN = 1 query
 * 
 * For a single listing, the difference is small. But imagine displaying 100 listings:
 * - Without eager loading: 1 + 100 = 101 queries
 * - With eager loading: 1 query with JOIN
 * 
 * Prisma's `include` option tells it to fetch related data in the same query
 * using SQL JOINs. This is much more efficient than separate queries.
 * 
 * What data do we include?
 * - seller: We need seller info (username, profile picture, rating) for display
 * - category: We need category name for display
 * 
 * What data do we NOT include?
 * - messages: Not needed for listing display (would be fetched separately)
 * - ratings: Not needed for listing display (seller's average rating is on User)
 * - favorites: Not needed for listing display
 * 
 * Security Note:
 * We use `select` to exclude sensitive seller data like email and passwordHash.
 * Only include data that should be publicly visible.
 * 
 * @param listingId - UUID of the listing to retrieve
 * @returns Listing with seller and category information, or null if not found
 */
export async function getListingById(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      // Eager load seller information
      // This creates a SQL JOIN to fetch seller data in the same query
      seller: {
        select: {
          // Only select fields that should be publicly visible
          id: true,
          username: true,
          profilePicture: true,
          averageRating: true,
          joinDate: true,
          // Explicitly exclude sensitive fields:
          // email: false (not included)
          // passwordHash: false (not included)
          // emailVerificationToken: false (not included)
          // etc.
        },
      },
      // Eager load category information
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return listing;
}

/**
 * Get all listings with pagination
 * 
 * This function retrieves active listings with pagination support.
 * 
 * Pagination Explained:
 * Pagination divides large datasets into smaller "pages" for better performance
 * and user experience. Instead of loading 10,000 listings at once, we load
 * 20 at a time.
 * 
 * Offset-based Pagination:
 * - limit: How many items to return (e.g., 20)
 * - offset: How many items to skip (e.g., 0 for first page, 20 for second page)
 * 
 * Example:
 * - Page 1: limit=20, offset=0 → items 1-20
 * - Page 2: limit=20, offset=20 → items 21-40
 * - Page 3: limit=20, offset=40 → items 41-60
 * 
 * SQL Translation:
 * Prisma translates this to: SELECT * FROM listings LIMIT 20 OFFSET 0
 * 
 * Why include seller information?
 * - Users want to see who's selling before clicking
 * - Displays seller rating and username on listing cards
 * - Uses eager loading (JOIN) to avoid N+1 query problem
 * 
 * Performance Considerations:
 * - We only fetch active listings (status = 'active')
 * - We use eager loading to minimize database queries
 * - We limit the number of results to prevent overwhelming the client
 * - We order by createdAt DESC to show newest listings first
 * 
 * @param limit - Maximum number of listings to return (default: 20)
 * @param offset - Number of listings to skip (default: 0)
 * @returns Object with listings array and total count
 */
export async function getAllListings(
  limit: number = 20,
  offset: number = 0
) {
  // Validate pagination parameters
  // Ensure limit is reasonable (between 1 and 100)
  const validLimit = Math.min(Math.max(limit, 1), 100);
  
  // Ensure offset is non-negative
  const validOffset = Math.max(offset, 0);

  // Fetch listings with pagination
  // We use Promise.all to run both queries in parallel for better performance
  const [listings, totalCount] = await Promise.all([
    // Query 1: Get paginated listings with seller information
    prisma.listing.findMany({
      where: {
        // Only return active listings (not sold, completed, or deleted)
        status: 'active',
      },
      // Include seller information using eager loading (SQL JOIN)
      // This prevents the N+1 query problem
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            averageRating: true,
            joinDate: true,
            // Exclude sensitive fields like email and passwordHash
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
      // Order by newest first
      // This ensures users see the most recent listings
      orderBy: {
        createdAt: 'desc',
      },
      // Pagination parameters
      take: validLimit, // How many to return
      skip: validOffset, // How many to skip
    }),

    // Query 2: Get total count of active listings
    // This is needed for pagination UI (e.g., "Page 1 of 50")
    prisma.listing.count({
      where: {
        status: 'active',
      },
    }),
  ]);

  // Return both the listings and the total count
  // The total count helps the frontend calculate:
  // - Total number of pages
  // - Whether there are more pages to load
  // - Progress indicators
  return {
    listings,
    totalCount,
    // Also return pagination metadata for convenience
    limit: validLimit,
    offset: validOffset,
    hasMore: validOffset + validLimit < totalCount,
  };
}

/**
 * Interface for updating a listing
 * 
 * All fields are optional - only provided fields will be updated
 * Some fields are immutable and cannot be updated:
 * - id (primary key)
 * - sellerId (ownership is permanent)
 * - createdAt (creation timestamp is immutable)
 */
export interface UpdateListingData {
  title?: string;
  description?: string;
  price?: number;
  listingType?: 'item' | 'service';
  pricingType?: 'fixed' | 'hourly' | null;
  categoryId?: string;
  images?: string[];
  location?: string;
  status?: 'active' | 'sold' | 'completed' | 'deleted';
}

/**
 * Update an existing listing
 * 
 * This function handles updating listings with proper authorization and validation.
 * 
 * Authorization vs Authentication:
 * - Authentication: Verifying WHO the user is (handled by JWT middleware)
 * - Authorization: Verifying WHAT the user can do (handled here)
 * 
 * In this case, authorization means:
 * - Only the seller who created the listing can update it
 * - Admins could update any listing (future feature)
 * 
 * Immutable Fields:
 * Certain fields should NEVER change after creation:
 * - id: Primary key, changing it would break relationships
 * - sellerId: Ownership is permanent, prevents listing theft
 * - createdAt: Historical record, must preserve original creation time
 * 
 * Why preserve createdAt?
 * - Users want to know when a listing was originally posted
 * - "Posted 3 days ago" should reflect original post date, not last edit
 * - Prevents sellers from gaming "newest first" sorting by editing
 * - Maintains data integrity and trust
 * 
 * Partial Updates:
 * This endpoint supports partial updates - you only need to provide
 * the fields you want to change. Other fields remain unchanged.
 * 
 * Example: Update only the price
 * { price: 75.00 }
 * 
 * Example: Update title and description
 * { title: "New Title", description: "New description" }
 * 
 * Validation Strategy:
 * 1. Verify listing exists
 * 2. Verify user owns the listing (authorization)
 * 3. Validate any provided fields
 * 4. Apply business rules (e.g., service listings need pricingType)
 * 5. Update only the provided fields
 * 6. Preserve immutable fields (createdAt)
 * 
 * @param listingId - ID of the listing to update
 * @param userId - ID of the user making the update (for authorization)
 * @param data - Fields to update (partial)
 * @returns Updated listing with all fields
 * @throws Error if validation fails or user doesn't own the listing
 */
export async function updateListing(
  listingId: string,
  userId: string,
  data: UpdateListingData
): Promise<CreatedListing> {
  // Step 1: Fetch the existing listing
  const existingListing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  // Validation 1: Verify listing exists
  if (!existingListing) {
    throw new Error('Listing not found');
  }

  // Validation 2: Authorization - verify user owns the listing
  // This is the key authorization check
  // Only the seller who created the listing can update it
  if (existingListing.sellerId !== userId) {
    throw new Error('Unauthorized: You can only update your own listings');
  }

  // Step 2: Validate provided fields
  // Only validate fields that are being updated

  // Validation 3: If listingType is being changed, validate it
  if (data.listingType && data.listingType !== 'item' && data.listingType !== 'service') {
    throw new Error('Listing type must be either "item" or "service"');
  }

  // Determine the final listingType (either updated or existing)
  const finalListingType = data.listingType || existingListing.listingType;

  // Validation 4: For services, pricingType is required
  // Check if we're updating to a service or if it's already a service
  if (finalListingType === 'service') {
    // If pricingType is being explicitly set to null/undefined, that's an error
    if (data.pricingType === null || data.pricingType === undefined) {
      // But only if the existing listing doesn't have one either
      if (!existingListing.pricingType) {
        throw new Error('Pricing type is required for service listings');
      }
    }
    // If pricingType is provided, validate it
    if (data.pricingType && data.pricingType !== 'fixed' && data.pricingType !== 'hourly') {
      throw new Error('Pricing type must be either "fixed" or "hourly"');
    }
  }

  // Validation 5: For items, pricingType should not be set
  if (finalListingType === 'item' && data.pricingType) {
    throw new Error('Pricing type should not be set for item listings');
  }

  // Validation 6: If price is provided, it must be positive
  if (data.price !== undefined && data.price <= 0) {
    throw new Error('Price must be greater than 0');
  }

  // Validation 7: If images are provided, validate count
  if (data.images) {
    if (data.images.length > 10) {
      throw new Error('Maximum 10 images allowed per listing');
    }
    if (data.images.length === 0) {
      throw new Error('At least one image is required');
    }
  }

  // Validation 8: If category is being changed, verify it exists
  if (data.categoryId) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!categoryExists) {
      throw new Error('Invalid category ID');
    }
  }

  // Step 3: Build update data object
  // Only include fields that are being updated
  // This allows partial updates
  const updateData: any = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.listingType !== undefined) updateData.listingType = data.listingType;
  if (data.pricingType !== undefined) updateData.pricingType = data.pricingType;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.status !== undefined) updateData.status = data.status;

  // Step 4: Update the listing in the database
  // Prisma will automatically update the updatedAt timestamp
  // The createdAt timestamp is NOT included in the update, so it's preserved
  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: updateData,
  });

  // The createdAt field is immutable - it's never included in the update
  // Prisma preserves it automatically because we don't modify it
  // This ensures the original creation timestamp is maintained

  return updatedListing;
}

/**
 * Update listing status
 * 
 * This function handles updating the status of a listing (active, sold, completed).
 * 
 * State Management Explained:
 * State management is about controlling how data changes over time.
 * For listings, the "state" is the status field, which can be:
 * - active: Available for purchase
 * - sold: Item has been sold
 * - completed: Service has been completed
 * - deleted: Listing has been removed (soft delete)
 * 
 * Status Transitions:
 * Valid transitions between states:
 * - active → sold (item was purchased)
 * - active → completed (service was completed)
 * - sold → active (transaction fell through, re-list)
 * - completed → active (service available again)
 * - any → deleted (seller removes listing)
 * 
 * Why PATCH instead of PUT?
 * - PATCH: Partial update (only changing status field)
 * - PUT: Full replacement (would require all listing fields)
 * 
 * PATCH is more efficient and clearer for single-field updates.
 * 
 * Business Rules:
 * 1. Only the seller can update their listing status
 * 2. Status must be one of the valid values
 * 3. Sold/completed listings are excluded from active searches
 * 4. Status changes are logged via updatedAt timestamp
 * 
 * Why keep sold listings in the database?
 * - Historical record for the seller
 * - Can be re-activated if transaction falls through
 * - Useful for analytics and reporting
 * - Maintains data integrity (messages/ratings still reference it)
 * 
 * Soft Delete vs Hard Delete:
 * - Soft delete: Set status to 'deleted', keep in database
 * - Hard delete: Actually remove from database
 * 
 * We use soft delete for listings because:
 * - Preserves transaction history
 * - Allows undo if accidental
 * - Maintains referential integrity (messages, ratings)
 * - Useful for analytics
 * 
 * @param listingId - ID of the listing to update
 * @param userId - ID of the user making the update (for authorization)
 * @param status - New status value
 * @returns Updated listing
 * @throws Error if validation fails or user doesn't own the listing
 */
export async function updateListingStatus(
  listingId: string,
  userId: string,
  status: string
): Promise<CreatedListing> {
  // Step 1: Validate status value
  // Only allow specific status values to prevent invalid states
  const validStatuses = ['active', 'sold', 'completed', 'deleted'];
  if (!validStatuses.includes(status)) {
    throw new Error(
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    );
  }

  // Step 2: Fetch the existing listing
  const existingListing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  // Validation 1: Verify listing exists
  if (!existingListing) {
    throw new Error('Listing not found');
  }

  // Validation 2: Authorization - verify user owns the listing
  // This is the key authorization check
  // Only the seller who created the listing can update its status
  if (existingListing.sellerId !== userId) {
    throw new Error('Unauthorized: You can only update your own listings');
  }

  // Step 3: Update the listing status
  // Prisma will automatically update the updatedAt timestamp
  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: {
      status: status,
    },
  });

  return updatedListing;
}

/**
 * Delete a listing permanently
 * 
 * This function performs a HARD DELETE - the listing is permanently removed
 * from the database and cannot be recovered.
 * 
 * Hard Delete vs Soft Delete:
 * 
 * Soft Delete (status = 'deleted'):
 * - Listing stays in database
 * - Can be undone by changing status back to 'active'
 * - Preserves relationships (messages, ratings still work)
 * - Good for temporary removal or accidental deletion
 * - Useful for analytics and historical records
 * 
 * Hard Delete (this function):
 * - Listing is permanently removed from database
 * - Cannot be undone
 * - Breaks relationships (messages may reference non-existent listing)
 * - Good for complete data removal
 * - Respects user's right to delete their data
 * 
 * When to use each:
 * - Soft delete: User marks listing as "sold" or "no longer available"
 * - Hard delete: User wants to completely remove the listing forever
 * 
 * Database Considerations:
 * - Foreign key constraints: Messages reference listings
 * - We need to handle these relationships:
 *   Option 1: Cascade delete (delete messages too)
 *   Option 2: Set foreign key to NULL (keep messages, remove listing reference)
 *   Option 3: Prevent deletion if messages exist
 * 
 * For this implementation, we'll use Option 2 (set to NULL) because:
 * - Preserves message history for users
 * - Doesn't break the messaging system
 * - Respects both parties' data
 * 
 * However, our current schema doesn't have messages yet, so we'll implement
 * simple deletion for now and handle message cleanup when we add messaging.
 * 
 * Authorization:
 * Only the seller who created the listing can delete it.
 * This prevents users from deleting others' listings.
 * 
 * @param listingId - ID of the listing to delete
 * @param userId - ID of the user requesting deletion (for authorization)
 * @throws Error if listing not found or user doesn't own the listing
 */
export async function deleteListing(
  listingId: string,
  userId: string
): Promise<void> {
  // Step 1: Fetch the existing listing
  const existingListing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  // Validation 1: Verify listing exists
  if (!existingListing) {
    throw new Error('Listing not found');
  }

  // Validation 2: Authorization - verify user owns the listing
  // This is the key authorization check
  // Only the seller who created the listing can delete it
  if (existingListing.sellerId !== userId) {
    throw new Error('Unauthorized: You can only delete your own listings');
  }

  // Step 2: Permanently delete the listing from the database
  // This is a hard delete - the listing is completely removed
  // and cannot be recovered
  await prisma.listing.delete({
    where: { id: listingId },
  });

  // Note: When we add messaging later, we'll need to handle messages
  // that reference this listing. Options:
  // 1. Set listingId to NULL in messages (preserve message history)
  // 2. Delete messages too (cascade delete)
  // 3. Prevent deletion if messages exist
  // 
  // For now, we'll implement option 1 when we add the Message model.
}

/**
 * Check if a category exists
 * 
 * Helper function to validate category IDs
 * 
 * @param categoryId - Category ID to check
 * @returns true if category exists, false otherwise
 */
export async function categoryExists(categoryId: string): Promise<boolean> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  return category !== null;
}
