/**
 * Message Service
 * 
 * This file contains all API calls related to messaging between users.
 */

import { apiClient } from '../lib/axios';
import type { Message, SendMessageRequest, Conversation } from '../types/api';

/**
 * Get all conversations for the current user
 * 
 * @returns Promise with array of conversations
 * 
 * Each conversation includes:
 * - The other user's information
 * - The associated listing (if any)
 * - The last message
 * - Unread message count
 * 
 * Backend Response Format:
 * The backend returns conversations with this structure:
 * {
 *   otherUserId: string,
 *   otherUserUsername: string,
 *   otherUserProfilePicture: string | null,
 *   lastMessage: { ... },
 *   unreadCount: number,
 *   listingId: string | null
 * }
 * 
 * We transform it to match our frontend Conversation type.
 * 
 * Example usage:
 * ```
 * const conversations = await messageService.getConversations();
 * conversations.forEach(conv => {
 *   console.log(`${conv.user.username}: ${conv.lastMessage.content}`);
 *   if (conv.unreadCount > 0) {
 *     console.log(`${conv.unreadCount} unread messages`);
 *   }
 * });
 * ```
 */
export const getConversations = async (): Promise<Conversation[]> => {
  // Backend response type (what we actually receive)
  interface BackendConversation {
    otherUserId: string;
    otherUserUsername: string;
    otherUserProfilePicture: string | null;
    lastMessage: {
      id: string;
      content: string;
      createdAt: string;
      senderId: string;
      read: boolean;
    };
    unreadCount: number;
    listingId: string | null;
  }
  
  const response = await apiClient.get<{ conversations: BackendConversation[] }>('/messages');
  
  // Transform backend response to frontend Conversation type
  // This mapping ensures our frontend types match what we expect
  const conversations: Conversation[] = response.data.conversations.map((conv) => ({
    userId: conv.otherUserId,
    user: {
      id: conv.otherUserId,
      username: conv.otherUserUsername,
      profilePicture: conv.otherUserProfilePicture,
      // These fields aren't provided by the backend for conversations
      // but are required by the User type. We set them to defaults.
      email: '',
      emailVerified: false,
      location: null,
      joinDate: '',
      averageRating: 0,
      createdAt: '',
      updatedAt: '',
    },
    listingId: conv.listingId,
    lastMessage: conv.lastMessage,
    unreadCount: conv.unreadCount,
  }));
  
  return conversations;
};

/**
 * Get all messages in a conversation
 * 
 * @param conversationId - The conversation ID (usually the other user's ID)
 * @returns Promise with array of messages
 * 
 * Messages are returned in chronological order (oldest first).
 * This endpoint also marks messages as read.
 */
export const getConversationMessages = async (
  conversationId: string
): Promise<Message[]> => {
  const response = await apiClient.get<Message[]>(`/messages/${conversationId}`);
  return response.data;
};

/**
 * Send a message
 * 
 * @param data - Message data (receiver, content, optional listing)
 * @returns Promise with the created message
 * 
 * Example usage:
 * ```
 * const message = await messageService.sendMessage({
 *   receiverId: 'user-id',
 *   listingId: 'listing-id', // Optional
 *   content: 'Is this item still available?'
 * });
 * ```
 */
export const sendMessage = async (data: SendMessageRequest): Promise<Message> => {
  const response = await apiClient.post<Message>('/messages', data);
  return response.data;
};

/**
 * Block a user
 * 
 * @param userId - The user ID to block
 * @returns Promise that resolves when blocking is complete
 * 
 * After blocking, you won't receive messages from this user.
 */
export const blockUser = async (userId: string): Promise<void> => {
  await apiClient.post(`/messages/block/${userId}`);
};
