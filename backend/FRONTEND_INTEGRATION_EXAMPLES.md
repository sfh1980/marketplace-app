# Frontend Integration Examples for Profile Picture Upload

This document provides examples of how to integrate the profile picture upload functionality in the frontend.

## React Component Example

### Basic Upload Component

```tsx
import React, { useState } from 'react';
import axios from 'axios';

interface ProfilePictureUploadProps {
  userId: string;
  authToken: string;
  currentPictureUrl?: string;
  onUploadSuccess: (newUrl: string) => void;
}

export function ProfilePictureUpload({
  userId,
  authToken,
  currentPictureUrl,
  onUploadSuccess,
}: ProfilePictureUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      // Upload to API
      const response = await axios.post(
        `http://localhost:5000/api/users/${userId}/avatar`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            // Don't set Content-Type - browser will set it with boundary
          },
        }
      );

      // Success!
      const newUrl = response.data.profilePictureUrl;
      onUploadSuccess(newUrl);
      
      // Reset state
      setSelectedFile(null);
      setPreview(null);
    } catch (err: any) {
      // Handle errors
      if (err.response) {
        setError(err.response.data.error.message || 'Upload failed');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-picture-upload">
      {/* Current Picture */}
      <div className="current-picture">
        <img
          src={currentPictureUrl || '/default-avatar.png'}
          alt="Profile"
          className="profile-picture"
        />
      </div>

      {/* File Input */}
      <div className="upload-controls">
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </div>

      {/* Preview */}
      {preview && (
        <div className="preview">
          <h4>Preview:</h4>
          <img src={preview} alt="Preview" className="preview-image" />
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="upload-button"
        >
          {uploading ? 'Uploading...' : 'Upload Picture'}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}
```

### CSS Styles

```css
/* ProfilePictureUpload.module.css */

.profile-picture-upload {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
}

.current-picture {
  display: flex;
  justify-content: center;
}

.profile-picture {
  width: 150px;
  height: 150px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 3px solid var(--color-border);
}

.upload-controls input[type="file"] {
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.preview-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-primary);
}

.upload-button {
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.upload-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.upload-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: var(--space-sm);
  background: var(--color-error);
  color: white;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}
```

## Using React Query

### API Service Function

```typescript
// src/services/userService.ts

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export async function uploadProfilePicture(
  userId: string,
  file: File,
  authToken: string
): Promise<string> {
  const formData = new FormData();
  formData.append('profilePicture', file);

  const response = await axios.post(
    `${API_BASE_URL}/users/${userId}/avatar`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    }
  );

  return response.data.profilePictureUrl;
}
```

### React Query Hook

```typescript
// src/hooks/useProfilePictureUpload.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadProfilePicture } from '../services/userService';

export function useProfilePictureUpload(userId: string, authToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadProfilePicture(userId, file, authToken),
    onSuccess: (newUrl) => {
      // Invalidate user profile query to refetch with new picture
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
}
```

### Component Using React Query

```tsx
import React, { useState } from 'react';
import { useProfilePictureUpload } from '../hooks/useProfilePictureUpload';

interface ProfilePictureUploadProps {
  userId: string;
  authToken: string;
  currentPictureUrl?: string;
}

export function ProfilePictureUpload({
  userId,
  authToken,
  currentPictureUrl,
}: ProfilePictureUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const uploadMutation = useProfilePictureUpload(userId, authToken);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <div>
      <img
        src={currentPictureUrl || '/default-avatar.png'}
        alt="Profile"
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploadMutation.isPending}
      />

      {preview && <img src={preview} alt="Preview" />}

      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
        </button>
      )}

      {uploadMutation.isError && (
        <div className="error">
          {uploadMutation.error.message}
        </div>
      )}

      {uploadMutation.isSuccess && (
        <div className="success">
          Profile picture updated successfully!
        </div>
      )}
    </div>
  );
}
```

## Drag and Drop Upload

```tsx
import React, { useState, useCallback } from 'react';

export function DragDropUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      
      // Validate file type
      if (droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
      } else {
        alert('Please drop an image file');
      }
    }
  }, []);

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {file ? (
        <p>Selected: {file.name}</p>
      ) : (
        <p>Drag and drop an image here, or click to select</p>
      )}
    </div>
  );
}
```

## Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Profile Picture Upload</title>
</head>
<body>
  <h1>Upload Profile Picture</h1>
  
  <img id="currentPicture" src="/default-avatar.png" alt="Profile">
  
  <input type="file" id="fileInput" accept="image/*">
  <button id="uploadButton">Upload</button>
  
  <div id="preview"></div>
  <div id="message"></div>

  <script>
    const userId = 'YOUR_USER_ID';
    const authToken = 'YOUR_AUTH_TOKEN';
    
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const preview = document.getElementById('preview');
    const message = document.getElementById('message');
    const currentPicture = document.getElementById('currentPicture');

    // Preview selected file
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.innerHTML = `<img src="${e.target.result}" width="200">`;
        };
        reader.readAsDataURL(file);
      }
    });

    // Upload file
    uploadButton.addEventListener('click', async () => {
      const file = fileInput.files[0];
      
      if (!file) {
        message.textContent = 'Please select a file';
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append('profilePicture', file);

      try {
        uploadButton.disabled = true;
        message.textContent = 'Uploading...';

        // Upload to API
        const response = await fetch(
          `http://localhost:5000/api/users/${userId}/avatar`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        
        // Update current picture
        currentPicture.src = `http://localhost:5000${data.profilePictureUrl}`;
        
        // Clear preview
        preview.innerHTML = '';
        fileInput.value = '';
        
        message.textContent = 'Upload successful!';
      } catch (error) {
        message.textContent = `Error: ${error.message}`;
      } finally {
        uploadButton.disabled = false;
      }
    });
  </script>
</body>
</html>
```

## Error Handling

```typescript
// Comprehensive error handling

async function uploadWithErrorHandling(file: File) {
  try {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await axios.post(
      `/api/users/${userId}/avatar`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          if (data.error.code === 'INVALID_FILE_TYPE') {
            throw new Error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
          } else if (data.error.code === 'NO_FILE_UPLOADED') {
            throw new Error('Please select a file to upload');
          }
          throw new Error(data.error.message);
          
        case 401:
          throw new Error('You must be logged in to upload a profile picture');
          
        case 403:
          throw new Error('You can only upload pictures to your own profile');
          
        case 413:
          throw new Error('File is too large. Maximum size is 5MB');
          
        case 500:
          throw new Error('Server error. Please try again later');
          
        default:
          throw new Error('Upload failed. Please try again');
      }
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error. Please check your connection');
    } else {
      // Something else went wrong
      throw new Error('An unexpected error occurred');
    }
  }
}
```

## Progress Indicator

```tsx
import React, { useState } from 'react';
import axios from 'axios';

export function UploadWithProgress() {
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      await axios.post(
        `/api/users/${userId}/avatar`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress(percentCompleted);
          },
        }
      );
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      {progress > 0 && progress < 100 && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
}
```

## Image Cropping (Future Enhancement)

```tsx
// Using react-image-crop library

import React, { useState } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export function ImageCropUpload() {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    aspect: 1, // Square crop
  });

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setSrc(reader.result as string)
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={onSelectFile} />
      {src && (
        <ReactCrop crop={crop} onChange={setCrop}>
          <img src={src} alt="Crop" />
        </ReactCrop>
      )}
    </div>
  );
}
```

## Testing the Upload

```typescript
// Jest test example

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ProfilePictureUpload', () => {
  it('uploads file successfully', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        profilePictureUrl: '/uploads/profile-pictures/test.jpg',
      },
    });

    const onSuccess = jest.fn();
    
    render(
      <ProfilePictureUpload
        userId="123"
        authToken="token"
        onUploadSuccess={onSuccess}
      />
    );

    // Create a fake file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Select file
    const input = screen.getByLabelText(/upload/i);
    fireEvent.change(input, { target: { files: [file] } });

    // Click upload
    const button = screen.getByText(/upload/i);
    fireEvent.click(button);

    // Wait for success
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('/uploads/profile-pictures/test.jpg');
    });
  });
});
```

## Notes

- Always validate file type and size on the client side for better UX
- Server-side validation is still required for security
- Use FormData for file uploads (not JSON)
- Don't set Content-Type header manually (browser sets it with boundary)
- Handle all possible error cases
- Show upload progress for better UX
- Consider image cropping for better profile pictures
- Test with different file types and sizes
