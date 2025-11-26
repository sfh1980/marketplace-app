/**
 * User Service
 * 
 * This service handles all user-related business logic including:
 * - Fetching user profiles with related data
 * - User profile updates (future)
 * - User statistics and ratings (future)
 * 
 * Why a separate service layer?
 * - Separates business logic from HTTP handling (controllers)
 * - Makes code easier to test (can test without HTTP requests)
 * - Allows reuse of logic across different controllers
 * - Follows Single Responsibility Principle
 * 
 * Database Query Optimization:
 * - Uses Prisma's include to fetch related data in one query
 * - Prevents N+1 query problem (making separate queries for each listing)
 * - Filters listings to only show active ones
 * - Selects only needed fields for efficiency
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Interface for user profile data
 * This defines the structure of data returned by getUserProfile
 */
export interface UserProfile {
  id: string;
  username: string;
  profilePicture: string | null;
  location: string | null;
  joinDate: Date;
  averageRating: number;
  listings: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    listingType: string;
    pricingType: string | null;
    images: string[];
    status: string;
    location: string;
    createdAt: Date;
  }>;
}

/**
 * Get user profile by ID
 * 
 * This function:
 * 1. Fetches user data from database
 * 2. Includes user's active listings
 * 3. Excludes private information (email, password)
 * 4. Returns null if user doesn't exist
 * 
 * Eager Loading with Prisma:
 * - We use `include` to fetch related listings in the same query
 * - This is more efficient than making separate queries
 * - Prevents the N+1 query problem
 * 
 * N+1 Query Problem Explained:
 * - BAD: Query user, then query each listing separately (1 + N queries)
 * - GOOD: Query user with listings in one go (1 query)
 * - With 10 listings: 11 queries vs 1 query!
 * 
 * Privacy Considerations:
 * - Email is NOT included (private information)
 * - Password hash is never exposed
 * - Only active listings are shown
 * - Sold/deleted listings are filtered out
 * 
 * Performance Optimization:
 * - We only select fields we need (not all fields)
 * - Listings are filtered at database level (not in application)
 * - Uses database indexes for fast lookups
 * 
 * @param userId - User's unique identifier (UUID)
 * @returns User profile with listings, or null if user doesn't exist
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // Fetch user with related listings in one query
  // This is called "eager loading" - loading related data upfront
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      // User fields - only what we need for public profile
      id: true,
      username: true,
      profilePicture: true,
      location: true,
      joinDate: true,
      averageRating: true,
      // Email is NOT included - it's private information
      // Password hash is NOT included - never expose this
      
      // Related listings - using include for eager loading
      listings: {
        where: {
          // Only show active listings (not sold or deleted)
          // This filtering happens at database level for efficiency
          status: 'active',
        },
        select: {
          // Listing fields for preview
          id: true,
          title: true,
          description: true,
          price: true,
          listingType: true,
          pricingType: true,
          images: true,
          status: true,
          location: true,
          createdAt: true,
        },
        // Sort listings by creation date (newest first)
        // This provides a better user experience
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  // Return null if user doesn't exist
  // Controller will handle this and return 404
  if (!user) {
    return null;
  }

  // Return user profile with listings
  // TypeScript ensures this matches UserProfile interface
  return user;
}

/**
 * Interface for profile update data
 * All fields are optional for partial updates (PATCH)
 * 
 * Note: Fields can be:
 * - undefined: Field not provided (don't update)
 * - null: Explicitly set to null (clear the field)
 * - string: Update to this value
 */
export interface ProfileUpdateData {
  username?: string;
  location?: string | null;
  profilePicture?: string | null;
}

/**
 * Update user profile
 * 
 * This function implements partial updates (PATCH semantics):
 * - Only provided fields are updated
 * - Undefined fields are left unchanged
 * - Null values explicitly set field to null
 * 
 * Why partial updates?
 * - Better user experience (update one field at a time)
 * - More efficient (less data transfer)
 * - Follows REST best practices for PATCH method
 * - Reduces risk of accidentally clearing fields
 * 
 * Validation:
 * - Username uniqueness is checked at database level
 * - Input validation should happen in controller before calling this
 * - Prisma will throw error if username already exists
 * 
 * What gets updated:
 * - username: User's display name (must be unique)
 * - location: General location (city, state)
 * - profilePicture: URL to profile image
 * 
 * What CANNOT be updated here:
 * - email: Requires verification flow (separate endpoint)
 * - password: Requires current password verification (separate endpoint)
 * - joinDate: Immutable (set at registration)
 * - averageRating: Calculated from ratings (not directly editable)
 * 
 * Prisma's update behavior:
 * - Only sends changed fields to database (efficient)
 * - Automatically updates `updatedAt` timestamp
 * - Returns updated user object
 * - Throws error if user doesn't exist
 * 
 * @param userId - User's unique identifier
 * @param data - Fields to update (partial)
 * @returns Updated user profile, or null if user doesn't exist
 * @throws Error if username is already taken
 */
export async function updateUserProfile(
  userId: string,
  data: ProfileUpdateData
): Promise<UserProfile | null> {
  try {
    // Build update object with only provided fields
    // This implements PATCH semantics - only update what's provided
    const updateData: any = {};
    
    if (data.username !== undefined) {
      updateData.username = data.username;
    }
    
    if (data.location !== undefined) {
      updateData.location = data.location;
    }
    
    if (data.profilePicture !== undefined) {
      updateData.profilePicture = data.profilePicture;
    }

    // Update user in database
    // Prisma will throw error if:
    // - User doesn't exist
    // - Username is already taken (unique constraint)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        // Return same fields as getUserProfile for consistency
        id: true,
        username: true,
        profilePicture: true,
        location: true,
        joinDate: true,
        averageRating: true,
        listings: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            listingType: true,
            pricingType: true,
            images: true,
            status: true,
            location: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return updatedUser;
  } catch (error: any) {
    // Handle Prisma errors
    if (error.code === 'P2025') {
      // User not found
      return null;
    }
    
    if (error.code === 'P2002') {
      // Unique constraint violation (username already exists)
      throw new Error('Username already taken');
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Future functions will be added here:
 * - uploadProfilePicture(userId, file)
 * - getUserRatings(userId)
 * - getUserStatistics(userId)
 */
