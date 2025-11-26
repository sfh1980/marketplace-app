/**
 * Property-Based Tests for Message Delivery
 * 
 * These tests verify the correctness property for message delivery:
 * - Property 16: Messages are delivered and associated correctly
 * 
 * Feature: marketplace-platform, Property 16: Messages are delivered and associated correctly
 * Validates: Requirements 6.1, 6.2, 6.4
 * 
 * For any message sent from one user to another about a listing, the message
 * should be stored with the correct sender, receiver, listing association, and
 * timestamp, and should appear in the receiver's inbox.
 * 
 * Why property-based testing for messaging?
 * - Tests across many random message scenarios
 * - Verifies messages work for any valid sender/receiver/content combination
 * - Catches edge cases in message threading and association
 * - More confidence than a few example-based tests
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { sendMessage } from '../services/messageService';
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
    'Hello! I am interested in this item. Could you tell me more about its condition and if you would be willing to negotiate on the price?',
    'Hi there! I saw your listing and I am very interested. Would you be able to meet this weekend for pickup?',
    'Is this item still available? I would like to purchase it if so. Please let me know your availability.'
  ),
  // Long messages
  fc.string({ minLength: 50, maxLength: 500 }).map(s => 
    'I am very interested in your listing. ' + s + ' Please let me know if this works for you.'
  )
);

/**
 * Generate listing data
 * Strategy: Create minimal listing data for testing
 */
const listingDataArbitrary = fc.record({
  title: fc.constantFrom(
    'Vintage Bicycle',
    'Laptop Computer',
    'Dining Table',
    'Garden Tools',
    'Photography Services'
  ),
  description: fc.string({ minLength: 20, maxLength: 200 }),
  price: fc.float({ min: 10, max: 1000, noNaN: true }),
  listingType: fc.constantFrom('item', 'service'),
  location: fc.constantFrom('New York, NY', 'Los Angeles, CA', 'Chicago, IL'),
});

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
): Promise<string> {
  const result = await registerUser({
    email,
    username,
    password,
    location: 'Test Location',
  });
  return result.id;
}

/**
 * Create a test category
 * Helper function to create categories for listings
 */
async function createTestCategory(name: string): Promise<string> {
  const category = await prisma.category.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: `Test category: ${name}`,
    },
  });
  return category.id;
}

/**
 * Create a test listing
 * Helper function to create listings for message testing
 */
async function createTestListing(
  sellerId: string,
  categoryId: string,
  data: any
): Promise<string> {
  const listing = await prisma.listing.create({
    data: {
      sellerId,
      categoryId,
      title: data.title,
      description: data.description,
      price: data.price,
      listingType: data.listingType,
      location: data.location,
      images: [],
      status: 'active',
    },
  });
  return listing.id;
}

// ============================================
// PROPERTY-BASED TESTS
// ============================================

describe('Message Delivery Properties', () => {
  /**
   * Feature: marketplace-platform, Property 16: Messages are delivered and associated correctly
   * Validates: Requirements 6.1, 6.2, 6.4
   * 
   * For any message sent from one user to another about a listing, the message
   * should be stored with the correct sender, receiver, listing association, and
   * timestamp, and should appear in the receiver's inbox.
   * 
   * What we're testing:
   * 1. Message is created in database
   * 2. Message has correct sender ID
   * 3. Message has correct receiver ID
   * 4. Message has correct content
   * 5. Message has correct listing association (if provided)
   * 6. Message has timestamp
   * 7. Message starts as unread
   * 8. Message can be retrieved by receiver
   * 9. Message can be retrieved by sender
   * 10. Message appears in conversation between sender and receiver
   */
  test(
    'Property 16: Messages are delivered and associated correctly',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validEmailArbitrary,
          validUsernameArbitrary,
          validPasswordArbitrary,
          validEmailArbitrary,
          validUsernameArbitrary,
          validPasswordArbitrary,
          messageContentArbitrary,
          listingDataArbitrary,
          async (
            senderEmail,
            senderUsername,
            senderPassword,
            receiverEmail,
            receiverUsername,
            receiverPassword,
            messageContent,
            listingData
          ) => {
            // Clean database before each property test iteration
            // This prevents unique constraint violations from previous iterations
            await cleanDatabase();

            // Setup: Create sender and receiver users
            const senderId = await createTestUser(
              senderEmail,
              senderUsername,
              senderPassword
            );
            const receiverId = await createTestUser(
              receiverEmail,
              receiverUsername,
              receiverPassword
            );

            // Setup: Create category and listing
            const categoryId = await createTestCategory('Test Category');
            const listingId = await createTestListing(
              senderId,
              categoryId,
              listingData
            );

            // Record time before sending message
            const beforeSend = new Date();

            // Send message with listing association
            const message = await sendMessage({
              senderId,
              receiverId,
              content: messageContent,
              listingId,
            });

            // Record time after sending message
            const afterSend = new Date();

            // Verify message was created with correct data
            expect(message.id).toBeDefined();
            expect(typeof message.id).toBe('string');
            expect(message.id.length).toBeGreaterThan(0);

            // Verify sender and receiver are correct
            expect(message.senderId).toBe(senderId);
            expect(message.receiverId).toBe(receiverId);

            // Verify content is correct
            expect(message.content).toBe(messageContent);

            // Verify listing association is correct
            expect(message.listingId).toBe(listingId);

            // Verify message starts as unread
            expect(message.read).toBe(false);

            // Verify timestamp is within reasonable range
            expect(message.createdAt).toBeDefined();
            expect(message.createdAt.getTime()).toBeGreaterThanOrEqual(
              beforeSend.getTime()
            );
            expect(message.createdAt.getTime()).toBeLessThanOrEqual(
              afterSend.getTime()
            );

            // Verify message can be retrieved from database
            const retrievedMessage = await prisma.message.findUnique({
              where: { id: message.id },
            });

            expect(retrievedMessage).not.toBeNull();
            expect(retrievedMessage!.senderId).toBe(senderId);
            expect(retrievedMessage!.receiverId).toBe(receiverId);
            expect(retrievedMessage!.content).toBe(messageContent);
            expect(retrievedMessage!.listingId).toBe(listingId);
            expect(retrievedMessage!.read).toBe(false);

            // Verify message appears in receiver's inbox
            // (messages where user is the receiver)
            const receiverMessages = await prisma.message.findMany({
              where: { receiverId },
            });

            expect(receiverMessages.length).toBeGreaterThan(0);
            const foundInInbox = receiverMessages.some(m => m.id === message.id);
            expect(foundInInbox).toBe(true);

            // Verify message appears in sender's sent messages
            // (messages where user is the sender)
            const senderMessages = await prisma.message.findMany({
              where: { senderId },
            });

            expect(senderMessages.length).toBeGreaterThan(0);
            const foundInSent = senderMessages.some(m => m.id === message.id);
            expect(foundInSent).toBe(true);

            // Verify message appears in conversation between sender and receiver
            // (messages where user is either sender or receiver, and other party is the other user)
            const conversationMessages = await prisma.message.findMany({
              where: {
                OR: [
                  { senderId, receiverId },
                  { senderId: receiverId, receiverId: senderId },
                ],
              },
              orderBy: { createdAt: 'asc' },
            });

            expect(conversationMessages.length).toBeGreaterThan(0);
            const foundInConversation = conversationMessages.some(
              m => m.id === message.id
            );
            expect(foundInConversation).toBe(true);
          }
        ),
        { numRuns: 20 } // Reduced from 100 due to bcrypt being slow in user creation
      );
    },
    120000 // 120 second timeout (creating users with bcrypt is slow)
  );

  /**
   * Additional test: Messages without listing association
   * 
   * Tests that messages can be sent without a listing reference
   * (general conversation between users)
   */
  test(
    'Property 16a: Messages without listing association are delivered correctly',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validEmailArbitrary,
          validUsernameArbitrary,
          validPasswordArbitrary,
          validEmailArbitrary,
          validUsernameArbitrary,
          validPasswordArbitrary,
          messageContentArbitrary,
          async (
            senderEmail,
            senderUsername,
            senderPassword,
            receiverEmail,
            receiverUsername,
            receiverPassword,
            messageContent
          ) => {
            // Clean database before each property test iteration
            await cleanDatabase();

            // Setup: Create sender and receiver users
            const senderId = await createTestUser(
              senderEmail,
              senderUsername,
              senderPassword
            );
            const receiverId = await createTestUser(
              receiverEmail,
              receiverUsername,
              receiverPassword
            );

            // Send message WITHOUT listing association
            const message = await sendMessage({
              senderId,
              receiverId,
              content: messageContent,
              listingId: null, // No listing association
            });

            // Verify message was created correctly
            expect(message.id).toBeDefined();
            expect(message.senderId).toBe(senderId);
            expect(message.receiverId).toBe(receiverId);
            expect(message.content).toBe(messageContent);
            expect(message.listingId).toBeNull(); // Should be null
            expect(message.read).toBe(false);
            expect(message.createdAt).toBeDefined();

            // Verify message can be retrieved from database
            const retrievedMessage = await prisma.message.findUnique({
              where: { id: message.id },
            });

            expect(retrievedMessage).not.toBeNull();
            expect(retrievedMessage!.listingId).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    },
    120000
  );

  /**
   * Additional test: Multiple messages form a conversation
   * 
   * Tests that multiple messages between two users can be retrieved
   * as a conversation thread
   */
  test(
    'Property 16b: Multiple messages form a conversation thread',
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
            senderEmail,
            senderUsername,
            senderPassword,
            receiverEmail,
            receiverUsername,
            receiverPassword,
            messageContents
          ) => {
            // Clean database before each property test iteration
            await cleanDatabase();

            // Setup: Create sender and receiver users
            const senderId = await createTestUser(
              senderEmail,
              senderUsername,
              senderPassword
            );
            const receiverId = await createTestUser(
              receiverEmail,
              receiverUsername,
              receiverPassword
            );

            // Send multiple messages
            const sentMessages = [];
            for (const content of messageContents) {
              const message = await sendMessage({
                senderId,
                receiverId,
                content,
                listingId: null,
              });
              sentMessages.push(message);
            }

            // Retrieve conversation
            const conversation = await prisma.message.findMany({
              where: {
                OR: [
                  { senderId, receiverId },
                  { senderId: receiverId, receiverId: senderId },
                ],
              },
              orderBy: { createdAt: 'asc' },
            });

            // Verify all messages are in conversation
            expect(conversation.length).toBe(messageContents.length);

            // Verify messages are ordered by timestamp
            for (let i = 1; i < conversation.length; i++) {
              expect(conversation[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                conversation[i - 1].createdAt.getTime()
              );
            }

            // Verify all sent messages are in conversation
            for (const sentMessage of sentMessages) {
              const found = conversation.some(m => m.id === sentMessage.id);
              expect(found).toBe(true);
            }
          }
        ),
        { numRuns: 10 } // Reduced due to multiple messages per test
      );
    },
    180000 // 180 second timeout (multiple messages per test)
  );
});

// ============================================
// ERROR HANDLING TESTS
// ============================================

describe('Message Delivery Error Handling', () => {
  /**
   * Test that sending message to non-existent receiver fails
   */
  test('Sending message to non-existent receiver throws error', async () => {
    await fc.assert(
      fc.asyncProperty(
        validEmailArbitrary,
        validUsernameArbitrary,
        validPasswordArbitrary,
        messageContentArbitrary,
        async (email, username, password, content) => {
          // Clean database before each property test iteration
          await cleanDatabase();

          // Create sender
          const senderId = await createTestUser(email, username, password);

          // Try to send message to non-existent receiver
          const fakeReceiverId = 'non-existent-user-id';

          await expect(
            sendMessage({
              senderId,
              receiverId: fakeReceiverId,
              content,
              listingId: null,
            })
          ).rejects.toThrow('Receiver not found');
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  /**
   * Test that sending message with non-existent listing fails
   */
  test('Sending message with non-existent listing throws error', async () => {
    await fc.assert(
      fc.asyncProperty(
        validEmailArbitrary,
        validUsernameArbitrary,
        validPasswordArbitrary,
        validEmailArbitrary,
        validUsernameArbitrary,
        validPasswordArbitrary,
        messageContentArbitrary,
        async (
          senderEmail,
          senderUsername,
          senderPassword,
          receiverEmail,
          receiverUsername,
          receiverPassword,
          content
        ) => {
          // Clean database before each property test iteration
          await cleanDatabase();

          // Create sender and receiver
          const senderId = await createTestUser(
            senderEmail,
            senderUsername,
            senderPassword
          );
          const receiverId = await createTestUser(
            receiverEmail,
            receiverUsername,
            receiverPassword
          );

          // Try to send message with non-existent listing
          const fakeListingId = 'non-existent-listing-id';

          await expect(
            sendMessage({
              senderId,
              receiverId,
              content,
              listingId: fakeListingId,
            })
          ).rejects.toThrow('Listing not found');
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);
});
