/**
 * Message Service
 * 
 * This service handles all messaging-related business logic including:
 * - Sending messages between users
 * - Retrieving conversations
 * - Marking messages as read
 * 
 * Why a separate service layer?
 * - Separates business logic from HTTP handling (controllers)
 * - Makes code easier to test (can test without HTTP requests)
 * - Allows reuse of logic across different controllers
 * - Follows Single Responsibility Principle
 * 
 * Message threading design:
 * - Each message is independent (not nested)
 * - Conversations are formed by grouping messages between two users
 * - Messages can be associated with a listing for context
 * - Read status helps with notification systems
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Interface for sending a message
 */
export interface SendMessageData {
  senderId: string;
  receiverId: string;
  content: string;
  listingId: string | null;
}

/**
 * Interface for message response
 */
export interface MessageResponse {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  listingId: string | null;
  read: boolean;
  createdAt: Date;
}

/**
 * Interface for conversation response
 * 
 * A conversation represents all messages between two users
 * This interface defines what data we return for each conversation in the inbox
 */
export interface ConversationResponse {
  otherUserId: string; // ID of the other person in the conversation
  otherUserUsername: string; // Username of the other person
  otherUserProfilePicture: string | null; // Profile picture of the other person
  lastMessage: {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string; // Who sent the last message
    read: boolean; // Has the last message been read (only relevant if current user is receiver)
  };
  unreadCount: number; // Number of unread messages in this conversation
  listingId: string | null; // Associated listing (if any)
}

/**
 * Send a message from one user to another
 * 
 * This function:
 * 1. Validates receiver exists
 * 2. Validates listing exists (if provided)
 * 3. Creates message in database
 * 4. Returns message data
 * 
 * Message threading:
 * - Messages between two users form a conversation
 * - Conversations can be filtered by listing
 * - Messages are ordered by timestamp (createdAt)
 * - Each message has a read status (false by default)
 * 
 * Why validate receiver and listing?
 * - Prevents creating orphaned messages (referencing non-existent users/listings)
 * - Provides better error messages to users
 * - Maintains referential integrity
 * - Catches bugs early (before database constraint errors)
 * 
 * Read status:
 * - New messages start as unread (read: false)
 * - Receiver can mark as read later
 * - Used for notification badges and inbox counts
 * 
 * @param data - Message data (sender, receiver, content, optional listing)
 * @returns Created message
 * @throws Error if receiver or listing not found
 */
export async function sendMessage(
  data: SendMessageData
): Promise<MessageResponse> {
  // Step 1: Validate receiver exists
  // We need to ensure the receiver is a valid user
  // This prevents creating messages to non-existent users
  const receiver = await prisma.user.findUnique({
    where: { id: data.receiverId },
    select: { id: true }, // Only select id for efficiency
  });

  if (!receiver) {
    throw new Error('Receiver not found');
  }

  // Step 2: Validate listing exists (if provided)
  // If a listingId is provided, ensure it's a valid listing
  // This maintains referential integrity and provides better errors
  if (data.listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: { id: true },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }
  }

  // Step 3: Create message in database
  // Prisma will automatically:
  // - Generate UUID for id
  // - Set createdAt timestamp
  // - Set default value for read (false)
  // - Enforce foreign key constraints
  const message = await prisma.message.create({
    data: {
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      listingId: data.listingId,
      read: false, // New messages start as unread
    },
  });

  console.log(`📨 Message sent from ${data.senderId} to ${data.receiverId}`);

  // Step 4: Return message data
  return {
    id: message.id,
    senderId: message.senderId,
    receiverId: message.receiverId,
    content: message.content,
    listingId: message.listingId,
    read: message.read,
    createdAt: message.createdAt,
  };
}

/**
 * Get all conversations for a user
 * 
 * This function retrieves a user's inbox by:
 * 1. Finding all messages where user is sender or receiver
 * 2. Grouping messages by conversation (the other user)
 * 3. For each conversation, finding the last message
 * 4. Counting unread messages (where user is receiver and read=false)
 * 5. Including information about the other user
 * 
 * Conversation grouping explained:
 * - A conversation is all messages between two users
 * - We need to identify the "other user" in each conversation
 * - If current user is sender, other user is receiver
 * - If current user is receiver, other user is sender
 * - We group by the other user's ID to get distinct conversations
 * 
 * Why is this complex?
 * - Messages are bidirectional (user can be sender OR receiver)
 * - Need to aggregate data (count unread, find last message)
 * - Need to join with User table to get other user's info
 * - Need to handle both directions of conversation
 * 
 * Algorithm:
 * 1. Get all messages involving the user (as sender or receiver)
 * 2. Group messages by the other party
 * 3. For each group (conversation):
 *    - Find the most recent message
 *    - Count unread messages (where user is receiver and read=false)
 *    - Get other user's profile info
 * 4. Sort conversations by most recent message
 * 
 * Performance considerations:
 * - Uses Prisma's groupBy for efficient aggregation
 * - Indexes on senderId, receiverId, and createdAt help performance
 * - Could be optimized with raw SQL for very large datasets
 * 
 * @param userId - ID of the user whose conversations to retrieve
 * @returns Array of conversations sorted by most recent activity
 */
export async function getConversations(
  userId: string
): Promise<ConversationResponse[]> {
  // Step 1: Get all messages involving this user
  // We need messages where user is either sender or receiver
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId }, // Messages sent by user
        { receiverId: userId }, // Messages received by user
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
      receiver: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc', // Most recent first
    },
  });

  // Step 2: Group messages by conversation (other user)
  // We'll use a Map to group messages by the other user's ID
  // Key: other user's ID
  // Value: array of messages in that conversation
  const conversationMap = new Map<string, typeof messages>();

  for (const message of messages) {
    // Determine who the "other user" is
    // If current user sent the message, other user is receiver
    // If current user received the message, other user is sender
    const otherUserId =
      message.senderId === userId ? message.receiverId : message.senderId;

    // Get existing messages for this conversation, or create new array
    const conversationMessages = conversationMap.get(otherUserId) || [];
    conversationMessages.push(message);
    conversationMap.set(otherUserId, conversationMessages);
  }

  // Step 3: Build conversation response for each group
  const conversations: ConversationResponse[] = [];

  for (const [, conversationMessages] of conversationMap.entries()) {
    // Sort messages by timestamp (most recent first)
    // They should already be sorted from the query, but let's be explicit
    conversationMessages.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Get the most recent message (first in sorted array)
    const lastMessage = conversationMessages[0];

    // Count unread messages
    // Only count messages where:
    // - Current user is the receiver (not messages they sent)
    // - Message is unread (read = false)
    const unreadCount = conversationMessages.filter(
      (msg) => msg.receiverId === userId && !msg.read
    ).length;

    // Get other user's information
    // The other user is either the sender or receiver of the last message
    const otherUser =
      lastMessage.senderId === userId
        ? lastMessage.receiver
        : lastMessage.sender;

    // Build conversation response
    conversations.push({
      otherUserId: otherUser.id,
      otherUserUsername: otherUser.username,
      otherUserProfilePicture: otherUser.profilePicture,
      lastMessage: {
        id: lastMessage.id,
        content: lastMessage.content,
        createdAt: lastMessage.createdAt,
        senderId: lastMessage.senderId,
        read: lastMessage.read,
      },
      unreadCount,
      listingId: lastMessage.listingId,
    });
  }

  // Step 4: Sort conversations by most recent activity
  // Conversations with most recent messages should appear first
  conversations.sort(
    (a, b) =>
      b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
  );

  console.log(`📬 Retrieved ${conversations.length} conversations for user ${userId}`);

  return conversations;
}

/**
 * Get all messages in a conversation between two users
 * 
 * This function:
 * 1. Retrieves all messages between the current user and another user
 * 2. Orders messages by timestamp (oldest first for chat display)
 * 3. Marks unread messages as read (implementing read receipts)
 * 4. Returns the conversation thread
 * 
 * What is a conversation?
 * - All messages between two specific users
 * - Bidirectional: includes messages sent by either party
 * - Ordered chronologically for chat-like display
 * - Can span multiple listings or be general conversation
 * 
 * Read receipts explained:
 * - When a user views a conversation, they're "reading" the messages
 * - We mark all unread messages (where user is receiver) as read
 * - This updates the unread count in the inbox
 * - Provides feedback to senders that messages were seen
 * 
 * Why mark as read automatically?
 * - Viewing the conversation implies reading the messages
 * - Reduces manual "mark as read" actions
 * - Keeps unread counts accurate
 * - Standard behavior in messaging apps (WhatsApp, Facebook Messenger, etc.)
 * 
 * Message ordering:
 * - Oldest messages first (ascending by createdAt)
 * - This is standard for chat interfaces
 * - Allows users to read conversation from beginning
 * - New messages appear at the bottom
 * 
 * Performance considerations:
 * - Uses indexed fields (senderId, receiverId, createdAt) for fast queries
 * - Batch update for marking messages as read (single query)
 * - Could add pagination for very long conversations (post-MVP)
 * 
 * @param userId - ID of the authenticated user viewing the conversation
 * @param otherUserId - ID of the other user in the conversation
 * @returns Array of messages ordered by timestamp (oldest first)
 */
export async function getConversationMessages(
  userId: string,
  otherUserId: string
): Promise<MessageResponse[]> {
  // Step 1: Retrieve all messages between the two users
  // We need messages where:
  // - User A sent to User B, OR
  // - User B sent to User A
  // This captures the full bidirectional conversation
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        // Messages from current user to other user
        {
          senderId: userId,
          receiverId: otherUserId,
        },
        // Messages from other user to current user
        {
          senderId: otherUserId,
          receiverId: userId,
        },
      ],
    },
    orderBy: {
      createdAt: 'asc', // Oldest first (standard for chat display)
    },
  });

  // Step 2: Mark unread messages as read
  // We only mark messages where:
  // - Current user is the receiver (not messages they sent)
  // - Message is currently unread (read = false)
  // 
  // Why batch update?
  // - More efficient than updating each message individually
  // - Single database query instead of N queries
  // - Atomic operation (all or nothing)
  // 
  // Read receipt behavior:
  // - Viewing conversation = reading messages
  // - Only mark messages TO the current user (not FROM them)
  // - Already-read messages are not affected
  const unreadMessageIds = messages
    .filter((msg) => msg.receiverId === userId && !msg.read)
    .map((msg) => msg.id);

  if (unreadMessageIds.length > 0) {
    // Batch update all unread messages to read
    await prisma.message.updateMany({
      where: {
        id: {
          in: unreadMessageIds, // Update only these specific messages
        },
      },
      data: {
        read: true, // Mark as read
      },
    });

    console.log(
      `✅ Marked ${unreadMessageIds.length} messages as read in conversation between ${userId} and ${otherUserId}`
    );
  }

  // Step 3: Return messages with updated read status
  // Map to response format
  // Note: We need to update the read status in our returned data
  // since the database update happened after we fetched the messages
  const messagesWithUpdatedStatus = messages.map((msg) => ({
    id: msg.id,
    senderId: msg.senderId,
    receiverId: msg.receiverId,
    content: msg.content,
    listingId: msg.listingId,
    // Update read status for messages that were marked as read
    read: unreadMessageIds.includes(msg.id) ? true : msg.read,
    createdAt: msg.createdAt,
  }));

  console.log(
    `💬 Retrieved ${messages.length} messages in conversation between ${userId} and ${otherUserId}`
  );

  return messagesWithUpdatedStatus;
}
