/**
 * Upload Configuration Tests
 * 
 * These tests verify the upload configuration and helper functions work correctly.
 * We test the configuration without making actual HTTP requests.
 */

import path from 'path';
import fs from 'fs';
import { getProfilePictureUrl, deleteProfilePicture } from '../config/upload';

describe('Upload Configuration', () => {
  const testFilename = 'test-user-123-1234567890-abc.jpg';
  const uploadsDir = path.join(__dirname, '../../uploads/profile-pictures');

  /**
   * Test: getProfilePictureUrl generates correct URL
   */
  test('should generate correct profile picture URL', () => {
    const url = getProfilePictureUrl(testFilename);
    expect(url).toBe(`/uploads/profile-pictures/${testFilename}`);
  });

  /**
   * Test: deleteProfilePicture removes file from disk
   */
  test('should delete profile picture file', () => {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create a test file
    const testFilePath = path.join(uploadsDir, testFilename);
    fs.writeFileSync(testFilePath, 'test content');

    // Verify file exists
    expect(fs.existsSync(testFilePath)).toBe(true);

    // Delete the file
    deleteProfilePicture(testFilename);

    // Verify file is deleted
    expect(fs.existsSync(testFilePath)).toBe(false);
  });

  /**
   * Test: deleteProfilePicture handles non-existent files gracefully
   */
  test('should handle deleting non-existent file gracefully', () => {
    // This should not throw an error
    expect(() => {
      deleteProfilePicture('non-existent-file.jpg');
    }).not.toThrow();
  });

  /**
   * Test: uploads directory is created automatically
   */
  test('should create uploads directory automatically', () => {
    // The directory should exist after importing the upload config
    expect(fs.existsSync(uploadsDir)).toBe(true);
  });
});
