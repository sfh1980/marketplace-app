/**
 * API Type Definitions
 * 
 * These TypeScript interfaces define the shape of data we send to and receive from the API.
 * Benefits:
 * - Type safety: TypeScript will catch errors at compile time
 * - Autocomplete: Your IDE will suggest available properties
 * - Documentation: Types serve as inline documentation
 * - Refactoring: Easy to update when API changes
 */

/**
 * User Types
 */
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  username: string;
  profilePicture: string | null;
  location: string | null;
  joinDate: string; // ISO date string
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateProfileRequest {
  username?: string;
  location?: string;
}

/**
 * Listing Types
 */
export type ListingType = 'item' | 'service';
export type ListingStatus = 'active' | 'sold' | 'completed' | 'deleted';
export type PricingType = 'fixed' | 'hourly';

export interface Listing {
  id: string;
  sellerId: string;
  seller?: User; // Populated in some responses
  title: string;
  description: string;
  price: number;
  listingType: ListingType;
  pricingType: PricingType | null;
  category: string;
  images: string[];
  status: ListingStatus;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  listingType: ListingType;
  pricingType?: PricingType;
  category: string;
  location: string;
  images?: File[]; // Files to upload
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  location?: string;
}

export interface UpdateListingStatusRequest {
  status: ListingStatus;
}

/**
 * Search and Filter Types
 */
export interface SearchParams {
  query?: string;
  category?: string;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Category Types
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  listingCount?: number; // Included when fetching all categories
}

/**
 * Message Types
 */
export interface Message {
  id: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  listingId: string | null;
  listing?: Listing;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  receiverId: string;
  listingId?: string;
  content: string;
}

/**
 * Conversation Type
 * 
 * Represents a conversation in the user's inbox.
 * The backend groups messages by the other user and returns:
 * - Information about the other user
 * - The last message in the conversation
 * - Count of unread messages
 * - Associated listing (if any)
 */
export interface Conversation {
  userId: string; // ID of the other user (otherUserId from backend)
  user: User; // Other user's information
  listingId: string | null;
  listing?: Listing;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    read: boolean;
  };
  unreadCount: number;
}

/**
 * Rating Types
 */
export interface Rating {
  id: string;
  raterId: string;
  rater?: User;
  ratedUserId: string;
  ratedUser?: User;
  listingId: string | null;
  listing?: Listing;
  stars: number; // 1-5
  review: string | null;
  createdAt: string;
}

export interface CreateRatingRequest {
  ratedUserId: string;
  listingId?: string;
  stars: number;
  review?: string;
}

/**
 * Favorite Types
 */
export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  listing: Listing;
  createdAt: string;
}

/**
 * Error Response Type
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Generic API Response wrapper
 * Some endpoints might wrap data in a response object
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}
