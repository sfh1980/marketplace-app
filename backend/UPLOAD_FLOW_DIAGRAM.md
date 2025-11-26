# Profile Picture Upload Flow Diagram

## Complete Upload Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser/App)                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 1. POST /api/users/:id/avatar
                                  │    Content-Type: multipart/form-data
                                  │    Authorization: Bearer <token>
                                  │    Body: profilePicture=<file>
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER (index.ts)                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Middleware Pipeline                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 2. Route to /api/users
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    USER ROUTES (userRoutes.ts)                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Middleware Chain:                                            │ │
│  │  1. authenticate → 2. multerUpload → 3. uploadProfilePicture │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
         ┌──────────────┐  ┌──────────┐  ┌──────────────┐
         │ authenticate │  │  Multer  │  │   Upload     │
         │ Middleware   │  │ Upload   │  │  Controller  │
         └──────────────┘  └──────────┘  └──────────────┘
                │                │              │
                │                │              │
                ▼                ▼              ▼

┌─────────────────────────────────────────────────────────────────────┐
│                        STEP-BY-STEP FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

Step 1: AUTHENTICATE MIDDLEWARE (authMiddleware.ts)
┌─────────────────────────────────────────────────────────────────────┐
│  • Extract JWT token from Authorization header                     │
│  • Verify token signature and expiration                           │
│  • Decode user info (userId, email, username)                      │
│  • Attach user to req.user                                         │
│  • If valid: call next()                                           │
│  • If invalid: return 401 Unauthorized                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Token Valid ✓
                                  ▼

Step 2: MULTER UPLOAD MIDDLEWARE (config/upload.ts)
┌─────────────────────────────────────────────────────────────────────┐
│  • Parse multipart/form-data request                               │
│  • Extract file from 'profilePicture' field                        │
│  • Validate file type (MIME type check)                            │
│    - Allowed: image/jpeg, image/png, image/gif, image/webp        │
│    - Rejected: text/plain, application/pdf, etc.                   │
│  • Validate file size (max 5MB)                                    │
│  • Generate unique filename:                                       │
│    Format: userId-timestamp-random.ext                             │
│    Example: 123e4567-1234567890-a1b2c3.jpg                        │
│  • Stream file to disk:                                            │
│    Location: backend/uploads/profile-pictures/                     │
│  • Add file info to req.file                                       │
│  • If valid: call next()                                           │
│  • If invalid: return 400 Bad Request                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ File Valid ✓
                                  ▼

Step 3: UPLOAD CONTROLLER (controllers/userController.ts)
┌─────────────────────────────────────────────────────────────────────┐
│  uploadProfilePicture() function:                                  │
│                                                                     │
│  1. Validate user ID format (UUID)                                 │
│  2. Check authorization (req.user.userId === :id)                  │
│  3. Verify file was uploaded (req.file exists)                     │
│  4. Generate public URL:                                           │
│     /uploads/profile-pictures/filename.jpg                         │
│  5. Get current profile picture URL (for deletion)                 │
│  6. Update database with new URL:                                  │
│     ┌─────────────────────────────────────────────────────────┐   │
│     │  await updateUserProfile(userId, {                      │   │
│     │    profilePicture: newUrl                               │   │
│     │  })                                                      │   │
│     └─────────────────────────────────────────────────────────┘   │
│  7. Delete old profile picture file (if exists)                    │
│  8. Return success response with new URL                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE UPDATE (Prisma)                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  UPDATE users                                                 │ │
│  │  SET profilePicture = '/uploads/profile-pictures/...'        │ │
│  │  WHERE id = 'userId'                                          │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FILE SYSTEM (uploads/)                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  uploads/profile-pictures/                                    │ │
│  │    ├── user1-1234567890-abc.jpg  ← New file saved            │ │
│  │    └── user1-1234567880-xyz.jpg  ← Old file deleted          │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RESPONSE TO CLIENT                               │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  HTTP 200 OK                                                  │ │
│  │  {                                                            │ │
│  │    "message": "Profile picture uploaded successfully",       │ │
│  │    "profilePictureUrl": "/uploads/profile-pictures/...",     │ │
│  │    "user": {                                                  │ │
│  │      "id": "...",                                             │ │
│  │      "username": "...",                                       │ │
│  │      "profilePicture": "/uploads/profile-pictures/...",      │ │
│  │      ...                                                      │ │
│  │    }                                                          │ │
│  │  }                                                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT RECEIVES                             │
│  • New profile picture URL                                         │
│  • Updated user profile                                            │
│  • Can now display image using URL                                 │
└─────────────────────────────────────────────────────────────────────┘


## Accessing Uploaded Images

┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT REQUESTS IMAGE                            │
│  GET /uploads/profile-pictures/user123-1234567890-abc.jpg          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│              EXPRESS STATIC MIDDLEWARE (index.ts)                   │
│  app.use('/uploads', express.static('uploads'))                    │
│                                                                     │
│  • Maps URL to filesystem path                                     │
│  • Reads file from disk                                            │
│  • Sets appropriate Content-Type header                            │
│  • Streams file to client                                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT RECEIVES IMAGE                            │
│  • Browser displays image                                          │
│  • Can be used in <img> tags                                       │
│  • Can be used as CSS background                                   │
└─────────────────────────────────────────────────────────────────────┘


## Error Handling Flow

┌─────────────────────────────────────────────────────────────────────┐
│                         ERROR SCENARIOS                             │
└─────────────────────────────────────────────────────────────────────┘

1. NO AUTHENTICATION TOKEN
   authenticate middleware → 401 Unauthorized
   "Authentication required"

2. INVALID TOKEN
   authenticate middleware → 401 Unauthorized
   "Invalid or expired token"

3. WRONG USER ID
   uploadProfilePicture → 403 Forbidden
   "You can only upload a profile picture for your own account"

4. NO FILE UPLOADED
   uploadProfilePicture → 400 Bad Request
   "Please upload an image file"

5. INVALID FILE TYPE
   Multer fileFilter → 400 Bad Request
   "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed"

6. FILE TOO LARGE
   Multer limits → 413 Payload Too Large
   "File size exceeds 5MB limit"

7. DATABASE ERROR
   uploadProfilePicture → 500 Internal Server Error
   "An unexpected error occurred while uploading profile picture"


## Security Checks

┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY CHECKPOINTS                           │
└─────────────────────────────────────────────────────────────────────┘

✓ Authentication Check (JWT token required)
  └─ Prevents anonymous uploads

✓ Authorization Check (user owns profile)
  └─ Prevents uploading to other users' profiles

✓ File Type Validation (MIME type)
  └─ Prevents uploading executables or malicious files

✓ File Size Limit (5MB max)
  └─ Prevents DoS attacks via large uploads

✓ Unique Filenames (userId-timestamp-random)
  └─ Prevents overwrites and path traversal attacks

✓ Old File Deletion
  └─ Prevents storage bloat

✓ Static File Serving (uploads directory only)
  └─ Prevents access to other filesystem areas


## Data Flow Summary

1. Client → Express → Authenticate → Multer → Controller
2. Controller → Database (update URL)
3. Controller → Filesystem (delete old file)
4. Controller → Client (success response)
5. Client → Express Static → Filesystem (access image)
6. Filesystem → Client (image data)
```

## Key Components

### 1. Multer Configuration (`config/upload.ts`)
- Handles file parsing and validation
- Generates unique filenames
- Saves files to disk
- Provides helper functions

### 2. Upload Controller (`controllers/userController.ts`)
- Validates authorization
- Updates database
- Deletes old files
- Returns response

### 3. Static File Serving (`index.ts`)
- Serves uploaded files
- Maps URLs to filesystem
- Handles Content-Type headers

### 4. Authentication Middleware (`middleware/authMiddleware.ts`)
- Verifies JWT tokens
- Attaches user to request
- Protects endpoints

## File Locations

```
backend/
├── uploads/                          ← Created automatically
│   └── profile-pictures/             ← Profile pictures stored here
│       └── user123-1234567890-abc.jpg
├── src/
│   ├── config/
│   │   └── upload.ts                 ← Multer configuration
│   ├── controllers/
│   │   └── userController.ts         ← Upload controller
│   ├── routes/
│   │   └── userRoutes.ts             ← POST /avatar endpoint
│   ├── middleware/
│   │   └── authMiddleware.ts         ← JWT verification
│   └── index.ts                      ← Static file serving
```

## URL Structure

```
Upload Endpoint:
POST http://localhost:5000/api/users/:id/avatar

Image Access:
GET http://localhost:5000/uploads/profile-pictures/filename.jpg

Example:
GET http://localhost:5000/uploads/profile-pictures/user123-1234567890-abc.jpg
```
