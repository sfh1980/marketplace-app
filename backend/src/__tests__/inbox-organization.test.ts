/**
 * Property-Based Tests for Inbox Organization
 * 
 * These tests verify the correctness property for inbox organization:
 * - Property 17: Inbox organizes conversations correctly
 * 
 * Feature: marketplace-platform, Property 17: Inbox organizes conversations correctly
 * Validates: Requirements 6.3
 * 
 * For any user with multiple message threads, viewing the inbox should display
 * all conversations organized by listing or conversation partner.
 * 
 * What we're testing:
 * 1. Conversations are grouped by the other user (not by individual messages)
 * 2. Each conversation shows the most recent message
 * 3. Unread count is accurate for each conversation
 * 4. Conversations are sorted by most recent activity
 * 5. Other user's information is included (username, profile picture)
 * 6. Bidirectional messages (sent and received) are grouped correctly
 * 7. Multiple conversations with different users are all returned
 * 
 * Why property-based testing for inbox?
 * - Tests across many random conversation scenarios
 * - Verifies inbox works for any number of conversations
 * - Catches edge cases in grouping and aggregation
 * - More confidence than a few example-based tests
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { sendMessage, getConversations } from '../services/messageService';
import { registerUser } from '../services/authService';
import { describe, test, beforeEach, beforeAll, afterAll, expect } from '@jest/globals';

const prisma = new PrismaClient();

// ============================================
// CUSTOM GENERATORS
// ============================================

/**
 * Generate valid email addresses
 * Strategy: Create unique emails for test users
 */
const validEmailArbitrary = fc.tuple(
  fc.stringMatching(/^[a-z0-9]{3,10}$/),
  fc.constantFrom('gmail.com', 'yahoo.com', 'test.com'),
  fc.integer({ min: 100000000, max: 999999999 }),
  fc.integer({ min: 100000000, max: 999999999 })
).map(([name, domain, random1, random2]) => 
  `${name}_${random1}_${random2}@${domain}`
);

/**
 * Generate valid usernames
 * Strategy: Create unique usernames for test users
 */
const validUsernameArbitrary = fc.tuple(
  fc.stringMatching(/^[a-zA-Z0-9_]{3,10}$/),
  fc.integer({ min: 100000000, max: 999999999 }),
  fc.integer({ min: 100000000, max: 999999999 })
).map(([name, random1, random2]) => 
  `${name}_${random1}_${random2}`.substring(0, 20)
);

/**
 * Generate valid passwords
 * Strategy: Create passwords that meet requirements
 */
const validPasswordArbitrary = fc.tuple(
  fc.stringMatching(/^[A-Z]{2,4}$/),
  fc.stringMatching(/^[a-z]{2,4}$/),
  fc.stringMatching(/^[0-9]{2,4}$/),
  fc.constantFrom('!', '@', '#', '$', '%'),
  fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/)
).map(([upper, lower, numbers, special, extra]) => 
  `${upper}${lower}${numbers}${special}${extra}`.split('').sort(() => Math.random() - 0.5).join('')
);

/**
 * Generate message content
 * Strategy: Create realistic message content of varying lengths
 */
const messageContentArbitrary = fc.oneof(
  // Short messages
  fc.constantFrom(
    'Hi, is this still available?',
    'What is the condition?',
    'Can you deliver?',
    'Is the price negotiable?',
    'When can I pick this up?'
  ),
  // Medium messages
  fc.constantFrom(
    'Hello! I am interested in this item. Could you tell me more about its condition?',
    'Hi there! I saw your listing and I am very interested.',
    'Is this item still available? I would like to purchase it if so.'
  )
);

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
 * Create a test user
 * Helper function to create users for testing
 */
async function createTestUser(
  email: string,
  username: string,
  password: string
): Promise<{ id: string; username: string }> {
  const result = await registerUser({
    email,
    username,
    password,
    location: 'Test Location',
  });
  return { id: result.id, username };
}

/**
 * Helper to add delay between messages
 * Ensures messages have different timestamps
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// PROPERTY-BASED TESTS
// ============================================

describe('Inbox Organization Properties', () => {
  /**
   * Feature: marketplace-platform, Property 17: Inbox organizes conversations correctly
   * Validates: Requirements 6.3
   * 
   * For any user with multiple message threads, viewing the inbox should display
   * all conversations organized by listing or conversation partner.
   * 
   * What we're testing:
   * 1. Each conversation appears exactly once (grouped by other user)
   * 2. Last message in each conversation is the most recent
   * 3. Unread count is accurate
   * 4. Conversations are sorted by most recent activity
   * 5. Other user's information is included
   * 6. Bidirectional messages are grouped into same conversation
   */
  test(
    'Property 17: Inbox organizes conversations correctly',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate main user
          validEmailArbitrary,
          validUsernameArbitrary,
          validPasswordArbitrary,
          // Generate 2-4 other users to have conversations with
          fc.array(
            fc.tuple(validEmailArbitrary, validUsernameArbitrary, validPasswordArbitrary),
            { minLength: 2, maxLength: 4 }
          ),
          // Generate 1-3 messages per conversation
          fc.integer({ min: 1, max: 3 }),
          async (
            mainUserEmail,
            mainUserUsername,
            mainUserPassword,
            otherUsersData,
            messagesPerConversation
          ) => {
            // Clean database before each property test iteration
            await cleanDatabase();

            // Setup: Create main user
            const mainUser = await createTestUser(
              mainUserEmail,
              mainUserUsername,
              mainUserPassword
            );

            // Setup: Create other users
            const otherUsers = [];
            for (const [email, username, password] of otherUsersData) {
              const user = await createTestUser(email, username, password);
              otherUsers.push(user);
            }

            // Setup: Send messages between main user and each other user
            // Track expected data for verification
            const expectedConversations = new Map<string, {
              lastMessageContent: string;
              lastMessageTime: Date;
              unreadCount: number;
              otherUsername: string;
            }>();

            for (const otherUser of otherUsers) {
              let lastMessageContent = '';
              let lastMessageTime = new Date(0);
              let unreadCount = 0;

              // Send multiple messages in this conversation
              for (let i = 0; i < messagesPerConversation; i++) {
                // Alternate who sends the message
                const isMainUserSending = i % 2 === 0;
                const content = `Message ${i + 1} in conversation with ${otherUser.username}`;

                // Add small delay to ensure different timestamps
                await delay(10);

                if (isMainUserSending) {
                  // Main user sends to other user
                  await sendMessage({
                    senderId: mainUser.id,
                    receiverId: otherUser.id,
                    content,
                    listingId: null,
                  });
                } else {
                  // Other user sends to main user (will be unread)
                  await sendMessage({
                    senderId: otherUser.id,
                    receiverId: mainUser.id,
                    content,
                    listingId: null,
                  });
                  unreadCount++; // This message is unread for main user
                }

                // Track last message
                lastMessageContent = content;
                lastMessageTime = new Date();
              }

              // Store expected data for this conversation
              expectedConversations.set(otherUser.id, {
                lastMessageContent,
                lastMessageTime,
                unreadCount,
                otherUsername: otherUser.username,
              });
            }

            // Add small delay before retrieving conversations
            await delay(10);

            // Get conversations for main user
            const conversations = await getConversations(mainUser.id);

            // Verify: Number of conversations matches number of other users
            expect(conversations.length).toBe(otherUsers.length);

            // Verify: Each other user appears exactly once
            const conversationUserIds = conversations.map(c => c.otherUserId);
            const uniqueUserIds = new Set(conversationUserIds);
            expect(uniqueUserIds.size).toBe(otherUsers.length);

            // Verify: All other users are present
            for (const otherUser of otherUsers) {
              const found = conversations.some(c => c.otherUserId === otherUser.id);
              expect(found).toBe(true);
            }

            // Verify: Each conversation has correct data
            for (const conversation of conversations) {
              const expected = expectedConversations.get(conversation.otherUserId);
              expect(expected).toBeDefined();

              // Verify other user's information is included
              expect(conversation.otherUserUsername).toBe(expected!.otherUsername);
              expect(conversation.otherUserId).toBeDefined();

              // Verify last message content
              expect(conversation.lastMessage.content).toBe(expected!.lastMessageContent);

              // Verify last message has required fields
              expect(conversation.lastMessage.id).toBeDefined();
              expect(conversation.lastMessage.createdAt).toBeDefined();
              expect(conversation.lastMessage.senderId).toBeDefined();
              expect(typeof conversation.lastMessage.read).toBe('boolean');

              // Verify unread count
              expect(conversation.unreadCount).toBe(expected!.unreadCount);
            }

            // Verify: Conversations are sorted by most recent activity
            for (let i = 1; i < conversations.length; i++) {
              const prevTime = conversations[i - 1].lastMessage.createdAt.getTime();
              const currTime = conversations[i].lastMessage.createdAt.getTime();
              expect(prevTime).toBeGreaterThanOrEqual(currTime);
            }
          }
        ),
        { numRuns: 10 } // Reduced due to multiple users and messages per test
      );
    },
    180000 // 180 second timeout (multiple users and messages per test)
  );

  /**
   * Additional test: Empty inbox returns empty array
   * 
   * Tests that a user with no messages gets an empty inbox
   */
  test(
    'Property 17a: Empty inbox returns empty array',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validEmailArbitrary,
          validUsernameArbitrary,
          validPasswordArbitrary,
          async (email, username, password) => {
            // Clean database before each property test iteration
            await cleanDatabase();

            // Create user with no messages
            const user = await createTestUser(email, username, password);

            // Get conversations
            const conversations = await getConversations(user.id);

            // Verify empty array
            expect(conversations).toEqual([]);
            expect(conversations.length).toBe(0);
          }
        ),
        { numRuns: 10 }
      );
    },
    60000
  );

  /**
   * Additional test: Bidirectional messages are grouped correctly
   * 
   * Tests that messages sent and received between two users
   * are grouped into a single conversation
   */
  test(
    'Property 17b: Bidirectional messages are grouped into single conversation',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validEmailArbitrary,
          validUsernameArbitrary,
          validPasswordArbitrary,
          validEmailArbitrary,
          validUsernameArbitrary,
          validPasswordArbitrary,
          fc.array(messageContentArbitrary, { minLength: 2, maxLength: 5 }),
          async (
            user1Email,
            user1Username,
            user1Password,
            user2Email,
            user2Username,
            user2Password,
            messageContents
          ) => {
            // Clean database before each property test iteration
            await cleanDatabase();

            // Create two users
            const user1 = await createTestUser(user1Email, user1Username, user1Password);
            const user2 = await createTestUser(user2Email, user2Username, user2Password);

            // Send messages alternating between users
            for (let i = 0; i < messageContents.length; i++) {
              await delay(10);
              
              if (i % 2 === 0) {
                // User 1 sends to User 2
                await sendMessage({
                  senderId: user1.id,
                  receiverId: user2.id,
                  content: messageContents[i],
                  listingId: null,
                });
              } else {
                // User 2 sends to User 1
                await sendMessage({
                  senderId: user2.id,
                  receiverId: user1.id,
                  content: messageContents[i],
                  listingId: null,
                });
              }
            }

            // Get conversations for user 1
            const user1Conversations = await getConversations(user1.id);

            // Verify: User 1 has exactly one conversation (with User 2)
            expect(user1Conversations.length).toBe(1);
            expect(user1Conversations[0].otherUserId).toBe(user2.id);
            expect(user1Conversations[0].otherUserUsername).toBe(user2.username);

            // Get conversations for user 2
            const user2Conversations = await getConversations(user2.id);

            // Verify: User 2 has exactly one conversation (with User 1)
            expect(user2Conversations.length).toBe(1);
            expect(user2Conversations[0].otherUserId).toBe(user1.id);
            expect(user2Conversations[0].otherUserUsername).toBe(user1.username);

            // Verify: Last message is the same for both (most recent message)
            const lastContent = messageContents[messageContents.length - 1];
            expect(user1Conversations[0].lastMessage.content).toBe(lastContent);
            expect(user2Conversations[0].lastMessage.content).toBe(lastContent);
          }
        ),
        { numRuns: 10 }
      );
    },
    120000
  );

  /**
   * Additional test: Unread count only includes messages received by user
   * 
   * Tests that unread count only counts messages where the user is the receiver,
   * not messages they sent
   */
  test(
    'Property 17c: Unread count only includes received messages',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validEmailArbitrary,
          validUsernameArbitrary,
          validPasswordArbitrary,
          validEmailArbitrary,
          validUsernameArbitrary,
          validPasswordArbitrary,
          fc.integer({ min: 1, max: 5 }), // Messages sent by user
          fc.integer({ min: 1, max: 5 }), // Messages received by user
          async (
            user1Email,
            user1Username,
            user1Password,
            user2Email,
            user2Username,
            user2Password,
            sentCount,
            receivedCount
          ) => {
            // Clean database before each property test iteration
            await cleanDatabase();

            // Create two users
            const user1 = await createTestUser(user1Email, user1Username, user1Password);
            const user2 = await createTestUser(user2Email, user2Username, user2Password);

            // User 1 sends messages to User 2
            for (let i = 0; i < sentCount; i++) {
              await delay(10);
              await sendMessage({
                senderId: user1.id,
                receiverId: user2.id,
                content: `Sent message ${i + 1}`,
                listingId: null,
              });
            }

            // User 2 sends messages to User 1 (these will be unread)
            for (let i = 0; i < receivedCount; i++) {
              await delay(10);
              await sendMessage({
                senderId: user2.id,
                receiverId: user1.id,
                content: `Received message ${i + 1}`,
                listingId: null,
              });
            }

            // Get conversations for user 1
            const conversations = await getConversations(user1.id);

            // Verify: User 1 has exactly one conversation
            expect(conversations.length).toBe(1);

            // Verify: Unread count equals number of messages received (not sent)
            expect(conversations[0].unreadCount).toBe(receivedCount);
          }
        ),
        { numRuns: 10 }
      );
    },
    120000
  );
});
