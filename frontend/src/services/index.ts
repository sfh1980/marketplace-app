/**
 * Services Index
 * 
 * This file exports all API services from a single location.
 * This makes imports cleaner throughout the application.
 * 
 * Instead of:
 * import { login } from '../services/authService';
 * import { getAllListings } from '../services/listingService';
 * 
 * You can do:
 * import { authService, listingService } from '../services';
 * authService.login(...);
 * listingService.getAllListings(...);
 */

import * as authService from './authService';
import * as userService from './userService';
import * as listingService from './listingService';
import * as searchService from './searchService';
import * as messageService from './messageService';
import * as ratingService from './ratingService';
import * as favoriteService from './favoriteService';

export {
  authService,
  userService,
  listingService,
  searchService,
  messageService,
  ratingService,
  favoriteService,
};

// Also export individual functions for convenience
export * from './authService';
export * from './listingService';
export * from './searchService';
export * from './messageService';
export * from './favoriteService';

// Export userService functions individually to avoid conflict with ratingService
export {
  getUserProfile,
  updateProfile,
  uploadProfilePicture,
  getUserListings,
} from './userService';

// Export ratingService functions individually
export {
  createRating,
  getUserRatings,
} from './ratingService';
