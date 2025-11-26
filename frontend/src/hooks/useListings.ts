/**
 * Listing Hooks
 * 
 * These custom hooks integrate our listing service with React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as listingService from '../services/listingService';
import type {
  CreateListingRequest,
  UpdateListingRequest,
  UpdateListingStatusRequest,
} from '../types/api';

/**
 * Hook to fetch all listings with pagination
 * 
 * @param page - Page number
 * @param limit - Items per page
 * 
 * Returns a query object with:
 * - data: Paginated listings
 * - isLoading: true while fetching
 * - isError: true if fetch failed
 * - error: Error object
 * - refetch: Function to manually refetch
 * 
 * Example usage:
 * ```
 * function ListingsPage() {
 *   const { data, isLoading, isError } = useListings(1, 20);
 *   
 *   if (isLoading) return <p>Loading...</p>;
 *   if (isError) return <p>Error loading listings</p>;
 *   
 *   return (
 *     <div>
 *       {data.data.map(listing => (
 *         <ListingCard key={listing.id} listing={listing} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useListings = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['listings', page, limit],
    queryFn: () => listingService.getAllListings(page, limit),
    // Keep previous data while fetching new page
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook to fetch a single listing by ID
 * 
 * @param listingId - The listing's ID
 */
export const useListing = (listingId: string) => {
  return useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => listingService.getListingById(listingId),
    // Only fetch if we have a listingId
    enabled: !!listingId,
  });
};

/**
 * Hook to create a new listing
 * 
 * Example usage:
 * ```
 * function CreateListingForm() {
 *   const createMutation = useCreateListing();
 *   
 *   const handleSubmit = (data) => {
 *     createMutation.mutate(data, {
 *       onSuccess: (newListing) => {
 *         navigate(`/listings/${newListing.id}`);
 *       }
 *     });
 *   };
 * }
 * ```
 */
export const useCreateListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateListingRequest) => listingService.createListing(data),
    onSuccess: () => {
      // Invalidate listings queries to refetch with new listing
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
};

/**
 * Hook to update a listing
 */
export const useUpdateListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateListingRequest }) =>
      listingService.updateListing(id, data),
    onSuccess: (updatedListing) => {
      // Update the specific listing in cache
      queryClient.setQueryData(['listing', updatedListing.id], updatedListing);
      // Invalidate listings list to refetch
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
};

/**
 * Hook to update listing status
 */
export const useUpdateListingStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateListingStatusRequest }) =>
      listingService.updateListingStatus(id, data),
    onSuccess: (updatedListing) => {
      // Update the specific listing in cache
      queryClient.setQueryData(['listing', updatedListing.id], updatedListing);
      // Invalidate listings list to refetch
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
};

/**
 * Hook to delete a listing
 */
export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (listingId: string) => listingService.deleteListing(listingId),
    onSuccess: (_, listingId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['listing', listingId] });
      // Invalidate listings list to refetch
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
};

/**
 * Hook to upload listing images
 */
export const useUploadListingImages = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) =>
      listingService.uploadListingImages(id, files),
    onSuccess: (updatedListing) => {
      // Update the specific listing in cache
      queryClient.setQueryData(['listing', updatedListing.id], updatedListing);
    },
  });
};
