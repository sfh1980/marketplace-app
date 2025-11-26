/**
 * Tests for Get Conversation Messages Endpoint
 * 
 * This test file verifies the functionality of retrieving all messages
 * in a conversation between two users, including the read receipt feature.
 * 
 * What we're testing:
 * 1. Retrieving all messages in a conversation
 * 2. Messages are ordered chronologically (oldest first)
 * 3. Read receipts: unread messages are marked as read when viewing
 * 4. Only messages between the two users are returned
 * 5. Authentication is required
 * 6. Cannot view conversation with yourself
 * 7. Other user must exist
 * 
 * Educational focus: Read receipts and message status
 * 
 * Read receipts are a common messaging feature that indicates when a message
 * has been viewed by the recipient. When implemented:
 * - Messages start with read: false when created
 * - When the receiver views the conversation, messages are marked read: true
 * - This updates the unread count in the inbox
 * - Provides feedback to the sender that their message was seen
 * 
 * Requirements: 6.2
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../index';
import { registerUser, loginUser } from '../services/authService';

const prisma = new PrismaClient();

// ============================================
// TEST SETUP AND TEARDOWN
// ============================================

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Clean database function
async function cleanDatabase() {
  // Order matters due to foreign key constraints
  await prisma.favorite.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.message.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

beforeEach(async () => {
  await cleanDatabase();
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a test user and return their ID and token
 */
async function createTestUser(
  email: string,
  username: string,
  password: string
): Promise<{ userId: string; token: string }> {
  const user = await registerUser({
    email,
    username,
    password,
    location: 'Test Location',
  });

  // Verify email so user can log in
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  const loginResult = await loginUser(email, password);

  return {
    userId: user.id,
    token: loginResult.token,
  };
}

/**
 * Send a message between two users
 */
async function sendTestMessage(
  senderId: string,
  receiverId: string,
  content: string
): Promise<string> {
  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      content,
      read: false,
    },
  });

  return message.id;
}

// ============================================
// TESTS
// ============================================

describe('GET /api/messages/:otherUserId - Get Conversation Messages', () => {
  /**
   * Test: Successfully retrieve conversation messages
   * 
   * Verifies that:
   * - All messages between two users are returned
   * - Messages are ordered chronologically (oldest first)
   * - Message data is complete and correct
   */
  test('should retrieve all messages in a conversation', async () => {
    // Setup: Create two users
    const user1 = await createTestUser(
      'user1@test.com',
      'user1',
      'Password123!'
    );
    const user2 = await createTestUser(
      'user2@test.com',
      'user2',
      'Password123!'
    );

    // Setup: Send multiple messages between users
    const message1Id = await sendTestMessage(
      user1.userId,
      user2.userId,
      'Hello, is this available?'
    );
    
    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const message2Id = await sendTestMessage(
      user2.userId,
      user1.userId,
      'Yes, it is still available!'
    );
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const message3Id = await sendTestMessage(
      user1.userId,
      user2.userId,
      'Great! Can we meet tomorrow?'
    );

    // Act: User 2 retrieves conversation with User 1
    const response = await request(app)
      .get(`/api/messages/${user1.userId}`)
      .set('Authorization', `Bearer ${user2.token}`);

    // Assert: Response is successful
    expect(response.status).toBe(200);
    expect(response.body.messages).toBeDefined();
    expect(Array.isArray(response.body.messages)).toBe(true);

    // Assert: All messages are returned
    expect(response.body.messages.length).toBe(3);

    // Assert: Messages are ordered chronologically (oldest first)
    const messages = response.body.messages;
    expect(messages[0].id).toBe(message1Id);
    expect(messages[1].id).toBe(message2Id);
    expect(messages[2].id).toBe(message3Id);

    // Assert: Message data is complete
    expect(messages[0].senderId).toBe(user1.userId);
    expect(messages[0].receiverId).toBe(user2.userId);
    expect(messages[0].content).toBe('Hello, is this available?');
    expect(messages[0].createdAt).toBeDefined();

    expect(messages[1].senderId).toBe(user2.userId);
    expect(messages[1].receiverId).toBe(user1.userId);
    expect(messages[1].content).toBe('Yes, it is still available!');

    expect(messages[2].senderId).toBe(user1.userId);
    expect(messages[2].receiverId).toBe(user2.userId);
    expect(messages[2].content).toBe('Great! Can we meet tomorrow?');
  });

  /**
   * Test: Read receipts - unread messages are marked as read
   * 
   * This is the core feature of this endpoint!
   * 
   * Verifies that:
   * - Unread messages are marked as read when viewing conversation
   * - Only messages TO the current user are marked as read
   * - Messages FROM the current user remain unchanged
   * - Read status is reflected in the response
   * - Read status persists in the database
   */
  test('should mark unread messages as read when viewing conversation', async () => {
    // Setup: Create two users
    const user1 = await createTestUser(
      'sender@test.com',
      'sender',
      'Password123!'
    );
    const user2 = await createTestUser(
      'receiver@test.com',
      'receiver',
      'Password123!'
    );

    // Setup: Send messages from user1 to user2 (unread)
    await sendTestMessage(
      user1.userId,
      user2.userId,
      'Message 1 - unread'
    );
    await sendTestMessage(
      user1.userId,
      user2.userId,
      'Message 2 - unread'
    );
    await sendTestMessage(
      user1.userId,
      user2.userId,
      'Message 3 - unread'
    );

    // Verify messages are unread before viewing
    const unreadMessages = await prisma.message.findMany({
      where: {
        receiverId: user2.userId,
        read: false,
      },
    });
    expect(unreadMessages.length).toBe(3);

    // Act: User 2 views conversation with User 1
    const response = await request(app)
      .get(`/api/messages/${user1.userId}`)
      .set('Authorization', `Bearer ${user2.token}`);

    // Assert: Response is successful
    expect(response.status).toBe(200);

    // Assert: All messages in response are marked as read
    const messages = response.body.messages;
    expect(messages.length).toBe(3);
    messages.forEach((msg: any) => {
      expect(msg.read).toBe(true);
    });

    // Assert: Messages are marked as read in database
    const readMessages = await prisma.message.findMany({
      where: {
        receiverId: user2.userId,
        read: true,
      },
    });
    expect(readMessages.length).toBe(3);

    // Assert: No unread messages remain
    const stillUnread = await prisma.message.findMany({
      where: {
        receiverId: user2.userId,
        read: false,
      },
    });
    expect(stillUnread.length).toBe(0);
  });

  /**
   * Test: Read receipts only affect messages TO the current user
   * 
   * Verifies that:
   * - Messages sent BY the current user are not marked as read
   * - Only messages received BY the current user are marked as read
   * - Bidirectional conversations are handled correctly
   */
  test('should only mark messages TO current user as read, not FROM', async () => {
    // Setup: Create two users
    const user1 = await createTestUser(
      'user1@test.com',
      'user1',
      'Password123!'
    );
    const user2 = await createTestUser(
      'user2@test.com',
      'user2',
      'Password123!'
    );

    // Setup: Send messages in both directions
    await sendTestMessage(user1.userId, user2.userId, 'From user1 to user2');
    await sendTestMessage(user2.userId, user1.userId, 'From user2 to user1');
    await sendTestMessage(user1.userId, user2.userId, 'Another from user1');

    // Act: User 1 views conversation with User 2
    const response = await request(app)
      .get(`/api/messages/${user2.userId}`)
      .set('Authorization', `Bearer ${user1.token}`);

    // Assert: Response is successful
    expect(response.status).toBe(200);

    // Assert: Only message TO user1 is marked as read
    const messagesReadByUser1 = await prisma.message.findMany({
      where: {
        receiverId: user1.userId,
        read: true,
      },
    });
    expect(messagesReadByUser1.length).toBe(1);
    expect(messagesReadByUser1[0].content).toBe('From user2 to user1');

    // Assert: Messages FROM user1 are still unread (for user2)
    const messagesUnreadByUser2 = await prisma.message.findMany({
      where: {
        receiverId: user2.userId,
        read: false,
      },
    });
    expect(messagesUnreadByUser2.length).toBe(2);
  });

  /**
   * Test: Already-read messages remain read
   * 
   * Verifies that:
   * - Messages that are already read are not affected
   * - Viewing conversation multiple times doesn't cause issues
   */
  test('should not affect already-read messages', async () => {
    // Setup: Create two users
    const user1 = await createTestUser(
      'user1@test.com',
      'user1',
      'Password123!'
    );
    const user2 = await createTestUser(
      'user2@test.com',
      'user2',
      'Password123!'
    );

    // Setup: Send a message and mark it as read
    const messageId = await sendTestMessage(
      user1.userId,
      user2.userId,
      'Already read message'
    );
    
    await prisma.message.update({
      where: { id: messageId },
      data: { read: true },
    });

    // Act: User 2 views conversation (message already read)
    const response = await request(app)
      .get(`/api/messages/${user1.userId}`)
      .set('Authorization', `Bearer ${user2.token}`);

    // Assert: Response is successful
    expect(response.status).toBe(200);

    // Assert: Message is still read
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    expect(message?.read).toBe(true);
  });

  /**
   * Test: Empty conversation returns empty array
   * 
   * Verifies that:
   * - Endpoint works even with no messages
   * - Returns empty array instead of error
   */
  test('should return empty array for conversation with no messages', async () => {
    // Setup: Create two users
    const user1 = await createTestUser(
      'user1@test.com',
      'user1',
      'Password123!'
    );
    const user2 = await createTestUser(
      'user2@test.com',
      'user2',
      'Password123!'
    );

    // Act: User 1 views conversation with User 2 (no messages)
    const response = await request(app)
      .get(`/api/messages/${user2.userId}`)
      .set('Authorization', `Bearer ${user1.token}`);

    // Assert: Response is successful
    expect(response.status).toBe(200);
    expect(response.body.messages).toBeDefined();
    expect(Array.isArray(response.body.messages)).toBe(true);
    expect(response.body.messages.length).toBe(0);
  });

  /**
   * Test: Authentication required
   * 
   * Verifies that:
   * - Endpoint requires authentication
   * - Returns 401 without token
   */
  test('should require authentication', async () => {
    // Act: Try to get messages without authentication
    const response = await request(app)
      .get('/api/messages/some-user-id');

    // Assert: Returns 401 Unauthorized
    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  /**
   * Test: Other user must exist
   * 
   * Verifies that:
   * - Returns 404 if other user doesn't exist
   * - Provides helpful error message
   */
  test('should return 404 if other user does not exist', async () => {
    // Setup: Create a user
    const user = await createTestUser(
      'user@test.com',
      'user',
      'Password123!'
    );

    // Act: Try to get conversation with non-existent user
    const response = await request(app)
      .get('/api/messages/non-existent-user-id')
      .set('Authorization', `Bearer ${user.token}`);

    // Assert: Returns 404 Not Found
    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('USER_NOT_FOUND');
  });

  /**
   * Test: Cannot view conversation with yourself
   * 
   * Verifies that:
   * - Returns 400 if trying to view conversation with yourself
   * - Provides helpful error message
   */
  test('should return 400 if trying to view conversation with yourself', async () => {
    // Setup: Create a user
    const user = await createTestUser(
      'user@test.com',
      'user',
      'Password123!'
    );

    // Act: Try to get conversation with yourself
    const response = await request(app)
      .get(`/api/messages/${user.userId}`)
      .set('Authorization', `Bearer ${user.token}`);

    // Assert: Returns 400 Bad Request
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('INVALID_CONVERSATION');
  });

  /**
   * Test: Only returns messages between the two users
   * 
   * Verifies that:
   * - Messages with other users are not included
   * - Conversation is isolated to the two specified users
   */
  test('should only return messages between the two users', async () => {
    // Setup: Create three users
    const user1 = await createTestUser(
      'user1@test.com',
      'user1',
      'Password123!'
    );
    const user2 = await createTestUser(
      'user2@test.com',
      'user2',
      'Password123!'
    );
    const user3 = await createTestUser(
      'user3@test.com',
      'user3',
      'Password123!'
    );

    // Setup: Send messages between different users
    await sendTestMessage(user1.userId, user2.userId, 'User1 to User2');
    await sendTestMessage(user2.userId, user1.userId, 'User2 to User1');
    await sendTestMessage(user1.userId, user3.userId, 'User1 to User3'); // Should not appear
    await sendTestMessage(user3.userId, user1.userId, 'User3 to User1'); // Should not appear

    // Act: User 1 views conversation with User 2
    const response = await request(app)
      .get(`/api/messages/${user2.userId}`)
      .set('Authorization', `Bearer ${user1.token}`);

    // Assert: Response is successful
    expect(response.status).toBe(200);

    // Assert: Only messages between user1 and user2 are returned
    const messages = response.body.messages;
    expect(messages.length).toBe(2);
    
    messages.forEach((msg: any) => {
      const isUser1ToUser2 = msg.senderId === user1.userId && msg.receiverId === user2.userId;
      const isUser2ToUser1 = msg.senderId === user2.userId && msg.receiverId === user1.userId;
      expect(isUser1ToUser2 || isUser2ToUser1).toBe(true);
    });
  });
});
