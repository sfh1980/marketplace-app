/**
 * Listing Service
 * 
 * This file contains all API calls related to listings (items and services).
 */

import { apiClient } from '../lib/axios';
import type {
  Listing,
  CreateListingRequest,
  UpdateListingRequest,
  UpdateListingStatusRequest,
  PaginatedResponse,
} from '../types/api';

/**
 * Get all listings with pagination
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @returns Promise with paginated listings
 * 
 * Example usage:
 * ```
 * const { data, pagination } = await listingService.getAllListings(1, 20);
 * console.log(`Showing ${data.length} of ${pagination.total} listings`);
 * ```
 */
export const getAllListings = async (
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Listing>> => {
  const response = await apiClient.get<PaginatedResponse<Listing>>('/listings', {
    params: { page, limit },
  });
  return response.data;
};

/**
 * Get a specific listing by ID
 * 
 * @param listingId - The listing's ID
 * @returns Promise with listing data including seller information
 */
export const getListingById = async (listingId: string): Promise<Listing> => {
  const response = await apiClient.get<Listing>(`/listings/${listingId}`);
  return response.data;
};

/**
 * Create a new listing
 * 
 * @param data - Listing data
 * @returns Promise with created listing
 * 
 * Example usage:
 * ```
 * const newListing = await listingService.createListing({
 *   title: 'Vintage Camera',
 *   description: 'Classic film camera in excellent condition',
 *   price: 150,
 *   listingType: 'item',
 *   category: 'electronics',
 *   location: 'San Francisco, CA'
 * });
 * ```
 */
export const createListing = async (
  data: CreateListingRequest
): Promise<Listing> => {
  // If images are included, we need to use FormData
  if (data.images && data.images.length > 0) {
    const formData = new FormData();
    
    // Add all non-file fields
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('listingType', data.listingType);
    formData.append('category', data.category);
    formData.append('location', data.location);
    
    if (data.pricingType) {
      formData.append('pricingType', data.pricingType);
    }
    
    // Add all image files
    data.images.forEach((file) => {
      formData.append('images', file);
    });
    
    const response = await apiClient.post<Listing>('/listings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } else {
    // No images, send as JSON
    const response = await apiClient.post<Listing>('/listings', data);
    return response.data;
  }
};

/**
 * Update an existing listing
 * 
 * @param listingId - The listing's ID
 * @param data - Fields to update
 * @returns Promise with updated listing
 * 
 * Note: Only the listing owner can update their listing
 */
export const updateListing = async (
  listingId: string,
  data: UpdateListingRequest
): Promise<Listing> => {
  const response = await apiClient.put<Listing>(`/listings/${listingId}`, data);
  return response.data;
};

/**
 * Update listing status (mark as sold, completed, etc.)
 * 
 * @param listingId - The listing's ID
 * @param status - New status
 * @returns Promise with updated listing
 * 
 * Example usage:
 * ```
 * await listingService.updateListingStatus('listing-id', { status: 'sold' });
 * ```
 */
export const updateListingStatus = async (
  listingId: string,
  data: UpdateListingStatusRequest
): Promise<Listing> => {
  const response = await apiClient.patch<Listing>(
    `/listings/${listingId}/status`,
    data
  );
  return response.data;
};

/**
 * Delete a listing
 * 
 * @param listingId - The listing's ID
 * @returns Promise that resolves when deletion is complete
 * 
 * Note: Only the listing owner can delete their listing
 */
export const deleteListing = async (listingId: string): Promise<void> => {
  await apiClient.delete(`/listings/${listingId}`);
};

/**
 * Upload additional images to a listing
 * 
 * @param listingId - The listing's ID
 * @param files - Array of image files
 * @returns Promise with updated listing
 * 
 * Note: Maximum 10 images per listing
 */
export const uploadListingImages = async (
  listingId: string,
  files: File[]
): Promise<Listing> => {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('images', file);
  });
  
  const response = await apiClient.post<Listing>(
    `/listings/${listingId}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};
