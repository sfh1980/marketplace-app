/**
 * User Service
 * 
 * This file contains all API calls related to user profiles.
 */

import { apiClient } from '../lib/axios';
import type { User, UpdateProfileRequest, Listing } from '../types/api';

/**
 * Get a user's profile by ID
 * 
 * @param userId - The user's ID
 * @returns Promise with user data
 */
export const getUserProfile = async (userId: string): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${userId}`);
  return response.data;
};

/**
 * Update the current user's profile
 * 
 * @param userId - The user's ID
 * @param data - Profile data to update
 * @returns Promise with updated user data
 * 
 * Example usage:
 * ```
 * const updatedUser = await userService.updateProfile('user-id', {
 *   username: 'newUsername',
 *   location: 'San Francisco, CA'
 * });
 * ```
 */
export const updateProfile = async (
  userId: string,
  data: UpdateProfileRequest
): Promise<User> => {
  const response = await apiClient.put<User>(`/users/${userId}`, data);
  
  // Update cached user data
  localStorage.setItem('user', JSON.stringify(response.data));
  
  return response.data;
};

/**
 * Upload a profile picture
 * 
 * @param userId - The user's ID
 * @param file - The image file to upload
 * @returns Promise with updated user data
 * 
 * Note: This uses FormData to send the file as multipart/form-data
 * 
 * Example usage:
 * ```
 * const file = event.target.files[0];
 * const updatedUser = await userService.uploadProfilePicture('user-id', file);
 * ```
 */
export const uploadProfilePicture = async (
  userId: string,
  file: File
): Promise<User> => {
  // Create FormData to send the file
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await apiClient.post<User>(
    `/users/${userId}/avatar`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  // Update cached user data
  localStorage.setItem('user', JSON.stringify(response.data));
  
  return response.data;
};

/**
 * Get a user's listings
 * 
 * @param userId - The user's ID
 * @returns Promise with array of listings
 */
export const getUserListings = async (userId: string): Promise<Listing[]> => {
  const response = await apiClient.get<Listing[]>(`/users/${userId}/listings`);
  return response.data;
};

/**
 * Get a user's ratings
 * 
 * @param userId - The user's ID
 * @returns Promise with array of ratings
 */
export const getUserRatings = async (userId: string): Promise<unknown[]> => {
  const response = await apiClient.get(`/users/${userId}/ratings`);
  return response.data;
};
