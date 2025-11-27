/**
 * Search Service
 * 
 * This file contains all API calls related to searching and filtering listings.
 */

import { apiClient } from '../lib/axios';
import type { Listing, SearchParams, PaginatedResponse, Category } from '../types/api';

/**
 * Search listings with filters
 * 
 * @param params - Search and filter parameters
 * @returns Promise with paginated search results
 * 
 * Example usage:
 * ```
 * const results = await searchService.searchListings({
 *   query: 'camera',
 *   category: 'electronics',
 *   minPrice: 50,
 *   maxPrice: 500,
 *   listingType: 'item',
 *   page: 1,
 *   limit: 20
 * });
 * ```
 * 
 * All parameters are optional:
 * - query: Search text (searches title and description)
 * - category: Filter by category slug
 * - listingType: Filter by 'item' or 'service'
 * - minPrice/maxPrice: Price range filter
 * - location: Filter by location
 * - page/limit: Pagination
 */
export const searchListings = async (
  params: SearchParams
): Promise<PaginatedResponse<Listing>> => {
  const response = await apiClient.get<PaginatedResponse<Listing>>('/search', {
    params,
  });
  return response.data;
};

/**
 * Get all categories with listing counts
 * 
 * @returns Promise with array of categories
 * 
 * Each category includes:
 * - id, name, slug, description
 * - listingCount: Number of active listings in this category
 * 
 * Example usage:
 * ```
 * const categories = await searchService.getCategories();
 * categories.forEach(cat => {
 *   console.log(`${cat.name}: ${cat.listingCount} listings`);
 * });
 * ```
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<{ categories: Category[] }>('/categories');
  return response.data.categories;
};

/**
 * Get listings by category
 * 
 * @param categorySlug - The category slug (e.g., 'electronics', 'furniture')
 * @param page - Page number
 * @param limit - Items per page
 * @returns Promise with paginated listings in that category
 * 
 * This is a convenience function that uses searchListings under the hood
 */
export const getListingsByCategory = async (
  categorySlug: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Listing>> => {
  return searchListings({
    category: categorySlug,
    page,
    limit,
  });
};
