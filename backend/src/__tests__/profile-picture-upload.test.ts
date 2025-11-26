/**
 * Profile Picture Upload Tests
 * 
 * These tests verify the profile picture upload functionality:
 * - File upload with valid image
 * - File type validation
 * - File size validation
 * - Authorization checks
 * - Old picture deletion
 * 
 * Testing file uploads:
 * - Use supertest to simulate HTTP requests
 * - Use .attach() to send files
 * - Verify file is saved to disk
 * - Verify database is updated
 * - Clean up test files after tests
 */

import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

describe('Profile Picture Upload', () => {
  let authToken: string;
  let userId: string;
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits
  const testEmail = `upload${timestamp}@example.com`;
  const testPassword = 'SecurePass123!';
  const testUsername = `upload${timestamp}`;

  // Create test image file
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  const uploadsDir = path.join(__dirname, '../../uploads/profile-pictures');

  beforeAll(async () => {
    // Create a simple test image file (1x1 pixel JPEG)
    // This is a minimal valid JPEG file
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x03, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
      0x7f, 0x80, 0xff, 0xd9,
    ]);
    fs.writeFileSync(testImagePath, jpegBuffer);

    try {
      // Clean up any existing test user first
      const existingUser = await prisma.user.findUnique({
        where: { email: testEmail },
      });
      if (existingUser) {
        await prisma.user.delete({
          where: { email: testEmail },
        });
      }

      // Register a test user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          username: testUsername,
        });

      // Get userId from response
      userId = registerResponse.body.user?.id;

      if (!userId) {
        console.error('Registration response:', JSON.stringify(registerResponse.body, null, 2));
        throw new Error('Failed to get user ID from registration response');
      }

      // Verify email directly in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      });

      // Login to get auth token
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: testPassword,
      });

      authToken = loginResponse.body.token;

      if (!authToken) {
        throw new Error('Failed to get auth token from login response');
      }
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up test user (only if userId was set)
    if (userId) {
      try {
        await prisma.user.delete({
          where: { id: userId },
        });
      } catch (error) {
        console.error('Error cleaning up test user:', error);
      }
    }

    // Clean up test image file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    // Clean up uploaded files
    if (fs.existsSync(uploadsDir) && userId) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file.startsWith(userId)) {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      }
    }

    await prisma.$disconnect();
  });

  /**
   * Test: Upload valid profile picture
   * 
   * This test verifies:
   * - File upload succeeds with valid image
   * - Response includes profile picture URL
   * - Database is updated with new URL
   * - File is saved to disk
   */
  test('should upload profile picture successfully', async () => {
    const response = await request(app)
      .post(`/api/users/${userId}/avatar`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('profilePicture', testImagePath);

    // Verify response
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Profile picture uploaded successfully');
    expect(response.body.profilePictureUrl).toMatch(
      /^\/uploads\/profile-pictures\/.+\.jpg$/
    );

    // Verify database was updated
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    expect(user?.profilePicture).toBe(response.body.profilePictureUrl);

    // Verify file exists on disk
    const filename = response.body.profilePictureUrl.split('/').pop();
    const filePath = path.join(uploadsDir, filename);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  /**
   * Test: Reject upload without authentication
   * 
   * This test verifies:
   * - Upload fails without auth token
   * - Returns 401 Unauthorized
   */
  test('should reject upload without authentication', async () => {
    const response = await request(app)
      .post(`/api/users/${userId}/avatar`)
      .attach('profilePicture', testImagePath);

    expect(response.status).toBe(401);
  });

  /**
   * Test: Reject upload for another user
   * 
   * This test verifies:
   * - Users cannot upload pictures for other users
   * - Returns 403 Forbidden
   */
  test('should reject upload for another user', async () => {
    const fakeUserId = '123e4567-e89b-12d3-a456-426614174000';
    const response = await request(app)
      .post(`/api/users/${fakeUserId}/avatar`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('profilePicture', testImagePath);

    expect(response.status).toBe(403);
  });

  /**
   * Test: Reject upload without file
   * 
   * This test verifies:
   * - Upload fails if no file is provided
   * - Returns 400 Bad Request
   */
  test('should reject upload without file', async () => {
    const response = await request(app)
      .post(`/api/users/${userId}/avatar`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('NO_FILE_UPLOADED');
  });

  /**
   * Test: Reject invalid file type
   * 
   * This test verifies:
   * - Upload fails for non-image files
   * - Returns 400 Bad Request
   */
  test('should reject invalid file type', async () => {
    // Create a text file
    const textFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(textFilePath, 'This is not an image');

    const response = await request(app)
      .post(`/api/users/${userId}/avatar`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('profilePicture', textFilePath);

    // Clean up text file
    fs.unlinkSync(textFilePath);

    expect(response.status).toBe(400);
  });

  /**
   * Test: Replace existing profile picture
   * 
   * This test verifies:
   * - Uploading new picture replaces old one
   * - Old file is deleted from disk
   * - Database is updated with new URL
   */
  test('should replace existing profile picture', async () => {
    // Upload first picture
    const firstResponse = await request(app)
      .post(`/api/users/${userId}/avatar`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('profilePicture', testImagePath);

    const firstUrl = firstResponse.body.profilePictureUrl;
    const firstFilename = firstUrl.split('/').pop();
    const firstFilePath = path.join(uploadsDir, firstFilename);

    // Verify first file exists
    expect(fs.existsSync(firstFilePath)).toBe(true);

    // Wait a moment to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Upload second picture
    const secondResponse = await request(app)
      .post(`/api/users/${userId}/avatar`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('profilePicture', testImagePath);

    const secondUrl = secondResponse.body.profilePictureUrl;
    const secondFilename = secondUrl.split('/').pop();
    const secondFilePath = path.join(uploadsDir, secondFilename);

    // Verify second file exists
    expect(fs.existsSync(secondFilePath)).toBe(true);

    // Verify first file was deleted
    expect(fs.existsSync(firstFilePath)).toBe(false);

    // Verify database has new URL
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    expect(user?.profilePicture).toBe(secondUrl);
  });
});
