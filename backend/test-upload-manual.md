# Manual Testing Guide for Profile Picture Upload

## Prerequisites
1. Backend server must be running: `npm run dev` in the `backend/` directory
2. You must have a registered and verified user account
3. You must be logged in and have an auth token

## Test Steps

### 1. Register and Login (if you haven't already)

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"testuser@example.com\",\"password\":\"SecurePass123!\",\"username\":\"testuser\"}"
```

**Get verification token from database and verify email:**
```bash
# Check database for verification token, then:
curl http://localhost:5000/api/auth/verify-email/YOUR_TOKEN_HERE
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"testuser@example.com\",\"password\":\"SecurePass123!\"}"
```

Save the token from the response.

### 2. Upload Profile Picture

**Create a test image (or use any image file you have):**
```bash
# On Windows PowerShell:
# Create a simple 1x1 pixel image file for testing
$bytes = [byte[]](0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46)
[System.IO.File]::WriteAllBytes("test-image.jpg", $bytes)
```

**Upload the image:**
```bash
curl -X POST http://localhost:5000/api/users/YOUR_USER_ID/avatar \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "profilePicture=@test-image.jpg"
```

Replace:
- `YOUR_USER_ID` with your user ID from the login response
- `YOUR_TOKEN_HERE` with your auth token from the login response
- `test-image.jpg` with the path to your test image

**Expected Response:**
```json
{
  "message": "Profile picture uploaded successfully",
  "profilePictureUrl": "/uploads/profile-pictures/userid-timestamp-random.jpg",
  "user": {
    "id": "...",
    "username": "testuser",
    "profilePicture": "/uploads/profile-pictures/userid-timestamp-random.jpg",
    ...
  }
}
```

### 3. Verify Upload

**Check the file exists:**
```bash
# The file should be in backend/uploads/profile-pictures/
ls backend/uploads/profile-pictures/
```

**Access the image via URL:**
```bash
curl http://localhost:5000/uploads/profile-pictures/FILENAME_FROM_RESPONSE
```

Or open in browser:
```
http://localhost:5000/uploads/profile-pictures/FILENAME_FROM_RESPONSE
```

### 4. Test Error Cases

**Upload without authentication (should fail with 401):**
```bash
curl -X POST http://localhost:5000/api/users/YOUR_USER_ID/avatar \
  -F "profilePicture=@test-image.jpg"
```

**Upload for another user (should fail with 403):**
```bash
curl -X POST http://localhost:5000/api/users/DIFFERENT_USER_ID/avatar \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "profilePicture=@test-image.jpg"
```

**Upload without file (should fail with 400):**
```bash
curl -X POST http://localhost:5000/api/users/YOUR_USER_ID/avatar \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Upload invalid file type (should fail with 400):**
```bash
# Create a text file
echo "This is not an image" > test.txt

curl -X POST http://localhost:5000/api/users/YOUR_USER_ID/avatar \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "profilePicture=@test.txt"
```

### 5. Test Replacing Profile Picture

**Upload a second image (should replace the first):**
```bash
curl -X POST http://localhost:5000/api/users/YOUR_USER_ID/avatar \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "profilePicture=@test-image.jpg"
```

**Verify:**
- Old file should be deleted from `backend/uploads/profile-pictures/`
- New file should exist
- Database should have new URL

## What to Check

✅ File is saved to `backend/uploads/profile-pictures/` with unique name
✅ Database `profilePicture` field is updated with URL
✅ Image is accessible via URL
✅ Old profile picture is deleted when uploading new one
✅ Only authenticated users can upload
✅ Users can only upload to their own profile
✅ Only image files are accepted
✅ File size limit is enforced (5MB max)

## Troubleshooting

**"Cannot find module '../config/upload'"**
- Make sure `backend/src/config/upload.ts` exists
- Try restarting the dev server

**"ENOENT: no such file or directory"**
- The uploads directory is created automatically
- Check that the backend has write permissions

**"Invalid file type"**
- Make sure you're uploading an image file (JPEG, PNG, GIF, WebP)
- Check the file's MIME type

**"File too large"**
- Maximum file size is 5MB
- Compress your image or use a smaller file
