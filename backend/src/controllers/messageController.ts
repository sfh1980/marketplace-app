/**
 * Message Controller
 * 
 * Handles HTTP requests for messaging endpoints.
 * 
 * Messaging system design:
 * - Simple 1-on-1 messaging between users
 * - Messages can be associated with a listing (optional)
 * - Messages are organized into conversations (threads)
 * - Read status tracking for notifications
 * 
 * Controller responsibilities:
 * - Parse and validate HTTP requests
 * - Call service layer for business logic
 * - Format and send HTTP responses
 * - Handle errors and return appropriate status codes
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { sendMessage } from '../services/messageService';

/**
 * Send a message to another user
 * 
 * POST /api/messages
 * 
 * Request body:
 * {
 *   receiverId: string (required) - ID of user receiving the message
 *   content: string (required) - Message text
 *   listingId?: string (optional) - ID of listing this message is about
 * }
 * 
 * Success response (201 Created):
 * {
 *   message: {
 *     id: string,
 *     senderId: string,
 *     receiverId: string,
 *     content: string,
 *     listingId: string | null,
 *     read: boolean,
 *     createdAt: Date
 *   }
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Missing required fields or invalid data
 * - 401 Unauthorized: Not authenticated
 * - 404 Not Found: Receiver or listing not found
 * - 500 Internal Server Error: Unexpected error
 * 
 * Authentication:
 * - Requires valid JWT token in Authorization header
 * - Sender ID is extracted from authenticated user
 * - Cannot send messages to yourself
 * 
 * Flow:
 * 1. Extract authenticated user ID from request (set by auth middleware)
 * 2. Validate required fields (receiverId, content)
 * 3. Validate content is not empty or too long
 * 4. Call service to create message
 * 5. Return created message
 * 
 * Message threading:
 * - Messages between two users form a conversation
 * - Conversations can be filtered by listing
 * - Messages are ordered by timestamp
 * - Read status helps with notifications
 * 
 * Use cases:
 * - Buyer asks seller a question about a listing
 * - Seller responds to buyer inquiry
 * - Users negotiate price or details
 * - Users arrange pickup/delivery
 */
export async function sendMessageHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Step 1: Extract authenticated user ID
    // This is set by the authentication middleware
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to send messages',
        },
      });
      return;
    }

    const senderId = req.user.userId;

    // Step 2: Extract message data from request body
    const { receiverId, content, listingId } = req.body;

    // Step 3: Validate required fields
    if (!receiverId) {
      res.status(400).json({
        error: {
          code: 'MISSING_RECEIVER',
          message: 'Receiver ID is required',
        },
      });
      return;
    }

    if (!content) {
      res.status(400).json({
        error: {
          code: 'MISSING_CONTENT',
          message: 'Message content is required',
        },
      });
      return;
    }

    // Step 4: Validate content
    // Trim whitespace and check if empty
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      res.status(400).json({
        error: {
          code: 'EMPTY_CONTENT',
          message: 'Message content cannot be empty',
        },
      });
      return;
    }

    // Check maximum length (prevent spam and database issues)
    // 5000 characters is reasonable for a message
    if (trimmedContent.length > 5000) {
      res.status(400).json({
        error: {
          code: 'CONTENT_TOO_LONG',
          message: 'Message content cannot exceed 5000 characters',
        },
      });
      return;
    }

    // Step 5: Validate user is not sending message to themselves
    if (senderId === receiverId) {
      res.status(400).json({
        error: {
          code: 'INVALID_RECEIVER',
          message: 'Cannot send message to yourself',
        },
      });
      return;
    }

    // Step 6: Create message
    // Service layer handles:
    // - Verifying receiver exists
    // - Verifying listing exists (if provided)
    // - Creating message in database
    // - Returning message data
    const message = await sendMessage({
      senderId,
      receiverId,
      content: trimmedContent,
      listingId: listingId || null,
    });

    // Step 7: Return success response
    res.status(201).json({
      message,
    });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      // User not found
      if (error.message.includes('Receiver not found')) {
        res.status(404).json({
          error: {
            code: 'RECEIVER_NOT_FOUND',
            message: 'The specified receiver does not exist',
          },
        });
        return;
      }

      // Listing not found
      if (error.message.includes('Listing not found')) {
        res.status(404).json({
          error: {
            code: 'LISTING_NOT_FOUND',
            message: 'The specified listing does not exist',
          },
        });
        return;
      }
    }

    // Log unexpected errors
    console.error('Send message error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while sending the message',
      },
    });
  }
}

/**
 * Get user's conversations (inbox)
 * 
 * GET /api/messages
 * 
 * Returns all conversations for the authenticated user, grouped by the other party.
 * Each conversation includes:
 * - Information about the other user
 * - The last message in the conversation
 * - Count of unread messages
 * - Associated listing (if any)
 * 
 * Success response (200 OK):
 * {
 *   conversations: [
 *     {
 *       otherUserId: string,
 *       otherUserUsername: string,
 *       otherUserProfilePicture: string | null,
 *       lastMessage: {
 *         id: string,
 *         content: string,
 *         createdAt: Date,
 *         senderId: string,
 *         read: boolean
 *       },
 *       unreadCount: number,
 *       listingId: string | null
 *     }
 *   ]
 * }
 * 
 * Error responses:
 * - 401 Unauthorized: Not authenticated
 * - 500 Internal Server Error: Unexpected error
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
 * 
 * Frontend integration:
 * - Display conversations in a list
 * - Show unread badge for conversations with unread messages
 * - Show last message preview
 * - Show other user's profile picture and username
 * - Sort by most recent activity (already done by backend)
 */
export async function getConversationsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Step 1: Extract authenticated user ID
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to view conversations',
        },
      });
      return;
    }

    const userId = req.user.userId;

    // Step 2: Get conversations from service
    // Service handles all the complex grouping and aggregation logic
    const { getConversations } = await import('../services/messageService');
    const conversations = await getConversations(userId);

    // Step 3: Return conversations
    res.status(200).json({
      conversations,
    });
  } catch (error) {
    // Log unexpected errors
    console.error('Get conversations error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while retrieving conversations',
      },
    });
  }
}

/**
 * Get all messages in a conversation with another user
 * 
 * GET /api/messages/:otherUserId
 * 
 * Returns all messages between the authenticated user and the specified user.
 * Messages are ordered chronologically (oldest first) for chat-like display.
 * 
 * Automatically marks unread messages as read (implements read receipts).
 * 
 * Success response (200 OK):
 * {
 *   messages: [
 *     {
 *       id: string,
 *       senderId: string,
 *       receiverId: string,
 *       content: string,
 *       listingId: string | null,
 *       read: boolean,
 *       createdAt: Date
 *     }
 *   ]
 * }
 * 
 * Error responses:
 * - 400 Bad Request: Invalid user ID format
 * - 401 Unauthorized: Not authenticated
 * - 404 Not Found: Other user not found
 * - 500 Internal Server Error: Unexpected error
 * 
 * Authentication:
 * - Requires valid JWT token in Authorization header
 * - User ID is extracted from authenticated user
 * 
 * Read receipts:
 * - Viewing a conversation marks messages as read
 * - Only marks messages where current user is receiver
 * - Already-read messages are not affected
 * - Updates unread count in inbox
 * 
 * Message ordering:
 * - Oldest messages first (ascending by timestamp)
 * - Standard for chat interfaces
 * - New messages appear at bottom
 * 
 * Use cases:
 * - User opens a conversation to view message history
 * - User reads new messages from another user
 * - User reviews past conversation about a listing
 * - Chat interface displays full conversation thread
 * 
 * Frontend integration:
 * - Display messages in chronological order
 * - Show sender/receiver for each message
 * - Differentiate between sent and received messages
 * - Auto-scroll to bottom (newest messages)
 * - Show read status for sent messages
 * 
 * Why mark as read automatically?
 * - Viewing conversation implies reading messages
 * - Standard behavior in messaging apps
 * - Reduces manual actions
 * - Keeps unread counts accurate
 * 
 * Performance:
 * - Indexed queries for fast retrieval
 * - Batch update for marking as read
 * - Could add pagination for very long conversations (post-MVP)
 */
export async function getConversationMessagesHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Step 1: Extract authenticated user ID
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to view messages',
        },
      });
      return;
    }

    const userId = req.user.userId;

    // Step 2: Extract other user ID from URL parameter
    const { otherUserId } = req.params;

    if (!otherUserId) {
      res.status(400).json({
        error: {
          code: 'MISSING_USER_ID',
          message: 'Other user ID is required',
        },
      });
      return;
    }

    // Step 3: Validate other user exists
    // This provides better error messages than letting the service fail
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });

    if (!otherUser) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The specified user does not exist',
        },
      });
      return;
    }

    // Step 4: Validate user is not trying to view conversation with themselves
    // This would be a strange edge case
    if (userId === otherUserId) {
      res.status(400).json({
        error: {
          code: 'INVALID_CONVERSATION',
          message: 'Cannot view conversation with yourself',
        },
      });
      return;
    }

    // Step 5: Get conversation messages
    // Service handles:
    // - Retrieving all messages between the two users
    // - Ordering messages chronologically
    // - Marking unread messages as read
    const { getConversationMessages } = await import(
      '../services/messageService'
    );
    const messages = await getConversationMessages(userId, otherUserId);

    // Step 6: Return messages
    res.status(200).json({
      messages,
    });
  } catch (error) {
    // Log unexpected errors
    console.error('Get conversation messages error:', error);

    // Return generic error to client
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          'An unexpected error occurred while retrieving conversation messages',
      },
    });
  }
}
