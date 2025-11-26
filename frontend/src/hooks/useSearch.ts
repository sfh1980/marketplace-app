/**
 * Search Hooks
 * 
 * These custom hooks integrate our search service with React Query.
 */

import { useQuery } from '@tanstack/react-query';
import * as searchService from '../services/searchService';
import type { SearchParams } from '../types/api';

/**
 * Hook to search listings
 * 
 * @param params - Search and filter parameters
 * 
 * Example usage:
 * ```
 * function SearchPage() {
 *   const [searchParams, setSearchParams] = useState({
 *     query: 'camera',
 *     category: 'electronics',
 *     minPrice: 50,
 *     maxPrice: 500
 *   });
 *   
 *   const { data, isLoading } = useSearchListings(searchParams);
 *   
 *   return (
 *     <div>
 *       <SearchFilters onChange={setSearchParams} />
 *       {isLoading ? (
 *         <p>Searching...</p>
 *       ) : (
 *         <SearchResults listings={data.data} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const useSearchListings = (params: SearchParams) => {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => searchService.searchListings(params),
    // Keep previous results while fetching new ones
    placeholderData: (previousData) => previousData,
    // Only search if we have at least one search parameter
    enabled: Object.keys(params).length > 0,
  });
};

/**
 * Hook to fetch all categories
 * 
 * Categories don't change often, so we can cache them for a long time.
 * 
 * Example usage:
 * ```
 * function CategoryFilter() {
 *   const { data: categories, isLoading } = useCategories();
 *   
 *   if (isLoading) return <p>Loading categories...</p>;
 *   
 *   return (
 *     <select>
 *       {categories.map(cat => (
 *         <option key={cat.id} value={cat.slug}>
 *           {cat.name} ({cat.listingCount})
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => searchService.getCategories(),
    // Cache categories for 1 hour (they don't change often)
    staleTime: 1000 * 60 * 60,
  });
};

/**
 * Hook to fetch listings by category
 * 
 * @param categorySlug - The category slug
 * @param page - Page number
 * @param limit - Items per page
 */
export const useListingsByCategory = (
  categorySlug: string,
  page: number = 1,
  limit: number = 20
) => {
  return useQuery({
    queryKey: ['category', categorySlug, page, limit],
    queryFn: () => searchService.getListingsByCategory(categorySlug, page, limit),
    placeholderData: (previousData) => previousData,
    enabled: !!categorySlug,
  });
};
