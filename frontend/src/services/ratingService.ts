/**
 * Rating Service
 * 
 * This file contains all API calls related to user ratings and reviews.
 * Note: This is a post-MVP feature, but we're setting up the service now.
 */

import { apiClient } from '../lib/axios';
import type { Rating, CreateRatingRequest } from '../types/api';

/**
 * Submit a rating for a user
 * 
 * @param data - Rating data (user to rate, stars, optional review)
 * @returns Promise with the created rating
 * 
 * Example usage:
 * ```
 * const rating = await ratingService.createRating({
 *   ratedUserId: 'user-id',
 *   listingId: 'listing-id', // Optional
 *   stars: 5,
 *   review: 'Great seller, fast shipping!'
 * });
 * ```
 * 
 * Note: Stars must be between 1 and 5
 */
export const createRating = async (data: CreateRatingRequest): Promise<Rating> => {
  const response = await apiClient.post<Rating>('/ratings', data);
  return response.data;
};

/**
 * Get all ratings for a user
 * 
 * @param userId - The user's ID
 * @returns Promise with array of ratings
 * 
 * This returns all ratings the user has received from others.
 */
export const getUserRatings = async (userId: string): Promise<Rating[]> => {
  const response = await apiClient.get<Rating[]>(`/ratings/user/${userId}`);
  return response.data;
};
