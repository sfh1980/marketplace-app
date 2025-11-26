/**
 * Message Routes
 * 
 * Defines all messaging-related API endpoints.
 * 
 * Why separate route files?
 * - Organization: Group related endpoints together
 * - Maintainability: Easy to find and modify routes
 * - Scalability: Can add middleware per route group
 * - Testing: Can test routes independently
 * 
 * Message system design:
 * - Simple 1-on-1 messaging between users
 * - Messages can reference a listing (optional)
 * - All message endpoints require authentication
 * - Messages are organized into conversations
 */

import { Router } from 'express';
import { 
  sendMessageHandler,
  getConversationsHandler,
  getConversationMessagesHandler
} from '../controllers/messageController';
import { authenticate } from '../middleware/authMiddleware';

// Create a new router instance
// This router will be mounted at /api/messages in the main app
const router = Router();

/**
 * GET /api/messages
 * 
 * Get user's conversations (inbox)
 * 
 * Protected endpoint (requires authentication)
 * 
 * Returns:
 * - conversations: Array of conversation objects, each containing:
 *   - otherUserId: ID of the other person in the conversation
 *   - otherUserUsername: Username of the other person
 *   - otherUserProfilePicture: Profile picture URL of the other person
 *   - lastMessage: Preview of the most recent message
 *   - unreadCount: Number of unread messages in this conversation
 *   - listingId: Associated listing (if any)
 * 
 * Authentication:
 * - Requires valid JWT token in Authorization header
 * - User ID is extracted from authenticated user
 * 
 * Conversation grouping:
 * - Messages between two users form a conversation
 * - Conversations are sorted by most recent activity
 * - Each conversation shows the last message as a preview
 * - Unread count helps users identify conversations needing attention
 * 
 * Use cases:
 * - User views their message inbox
 * - User sees which conversations have unread messages
 * - User navigates to a specific conversation
 * - User sees recent activity across all conversations
 */
router.get('/', authenticate, getConversationsHandler);

/**
 * POST /api/messages
 * 
 * Send a message to another user
 * 
 * Protected endpoint (requires authentication)
 * 
 * Request body:
 * - receiverId: string (required) - ID of user receiving the message
 * - content: string (required) - Message text (1-5000 characters)
 * - listingId: string (optional) - ID of listing this message is about
 * 
 * Returns:
 * - message: Created message object with id, sender, receiver, content, timestamp
 * 
 * Authentication:
 * - Requires valid JWT token in Authorization header
 * - Sender ID is extracted from authenticated user
 * - Format: Authorization: Bearer <token>
 * 
 * Use cases:
 * - Buyer contacts seller about a listing
 * - Seller responds to buyer inquiry
 * - Users negotiate price or details
 * - Users arrange pickup/delivery
 * 
 * Message threading:
 * - Messages between two users form a conversation
 * - Conversations can be filtered by listing
 * - Messages are ordered by timestamp
 * - Read status helps with notifications
 * 
 * Validation:
 * - Content cannot be empty (after trimming whitespace)
 * - Content cannot exceed 5000 characters
 * - Receiver must exist
 * - Listing must exist (if provided)
 * - Cannot send message to yourself
 * 
 * Security:
 * - Authentication required (cannot send anonymous messages)
 * - Sender ID comes from JWT token (cannot be spoofed)
 * - Content length limited (prevents spam and database issues)
 * - Receiver and listing validated (prevents orphaned references)
 * 
 * Future enhancements (post-MVP):
 * - Real-time delivery using WebSockets
 * - Message read receipts
 * - Message editing/deletion
 * - Rich media support (images, files)
 * - Blocking users
 * - Reporting inappropriate messages
 */
router.post('/', authenticate, sendMessageHandler);

/**
 * GET /api/messages/:otherUserId
 * 
 * Get all messages in a conversation with another user
 * 
 * Protected endpoint (requires authentication)
 * 
 * URL Parameters:
 * - otherUserId: string (required) - ID of the other user in the conversation
 * 
 * Returns:
 * - messages: Array of message objects ordered chronologically (oldest first)
 *   Each message contains:
 *   - id: Message unique identifier
 *   - senderId: ID of user who sent the message
 *   - receiverId: ID of user who received the message
 *   - content: Message text
 *   - listingId: Associated listing (if any)
 *   - read: Whether message has been read
 *   - createdAt: When message was sent
 * 
 * Authentication:
 * - Requires valid JWT token in Authorization header
 * - User ID is extracted from authenticated user
 * 
 * Read receipts:
 * - Automatically marks unread messages as read when viewing conversation
 * - Only marks messages where current user is receiver
 * - Updates unread count in inbox
 * 
 * Message ordering:
 * - Messages ordered oldest first (ascending by timestamp)
 * - Standard for chat interfaces
 * - New messages appear at bottom
 * 
 * Use cases:
 * - User opens a conversation to view message history
 * - User reads new messages from another user
 * - User reviews past conversation about a listing
 * - Chat interface displays full conversation thread
 * 
 * Validation:
 * - Other user must exist
 * - Cannot view conversation with yourself
 * 
 * Security:
 * - Authentication required
 * - Can only view conversations you're part of
 * - User ID comes from JWT token (cannot be spoofed)
 * 
 * Performance:
 * - Indexed queries for fast retrieval
 * - Batch update for marking messages as read
 * - Could add pagination for very long conversations (post-MVP)
 */
router.get('/:otherUserId', authenticate, getConversationMessagesHandler);

/**
 * Future message routes will be added here:
 * 
 * POST /api/messages/block/:userId
 * - Block a user from sending messages
 * - Prevents future messages from blocked user
 */

export default router;
