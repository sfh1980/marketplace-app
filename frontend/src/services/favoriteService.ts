/**
 * Favorite Service
 * 
 * This file contains all API calls related to favoriting/saving listings.
 * Note: This is a post-MVP feature, but we're setting up the service now.
 */

import { apiClient } from '../lib/axios';
import type { Favorite } from '../types/api';

/**
 * Get all favorited listings for the current user
 * 
 * @returns Promise with array of favorites
 * 
 * Each favorite includes the full listing data.
 */
export const getFavorites = async (): Promise<Favorite[]> => {
  const response = await apiClient.get<Favorite[]>('/favorites');
  return response.data;
};

/**
 * Add a listing to favorites
 * 
 * @param listingId - The listing's ID
 * @returns Promise with the created favorite
 * 
 * Example usage:
 * ```
 * await favoriteService.addFavorite('listing-id');
 * ```
 */
export const addFavorite = async (listingId: string): Promise<Favorite> => {
  const response = await apiClient.post<Favorite>(`/favorites/${listingId}`);
  return response.data;
};

/**
 * Remove a listing from favorites
 * 
 * @param listingId - The listing's ID
 * @returns Promise that resolves when removal is complete
 */
export const removeFavorite = async (listingId: string): Promise<void> => {
  await apiClient.delete(`/favorites/${listingId}`);
};

/**
 * Check if a listing is favorited
 * 
 * @param listingId - The listing's ID
 * @param favorites - Array of user's favorites
 * @returns true if the listing is in favorites
 * 
 * This is a helper function that doesn't make an API call.
 * It checks the local favorites array.
 */
export const isFavorited = (listingId: string, favorites: Favorite[]): boolean => {
  return favorites.some((fav) => fav.listingId === listingId);
};
