# Authentication Middleware Guide

## Overview

This guide explains how to use the authentication middleware to protect API routes in the Marketplace Platform.

## What is Middleware?

Middleware is a function that runs **before** your route handler. It sits in the middle of the request-response cycle:

```
Client Request → Middleware → Route Handler → Response
```

Middleware can:
1. Execute code
2. Modify request/response objects
3. End the request-response cycle (send error)
4. Call `next()` to pass control to the next middleware

## Why Use Middleware for Authentication?

Without middleware, you'd have to copy-paste authentication code in every protected route:

```typescript
// ❌ BAD: Repetitive code
router.get('/profile', async (req, res) => {
  // Copy-paste this in every route
  const token = req.headers.authorization?.substring(7);
  if (!token) return res.status(401).json({ error: 'No token' });
  const user = verifyJWT(token);
  // ... actual route logic
});

router.get('/listings', async (req, res) => {
  // Copy-paste again!
  const token = req.headers.authorization?.substring(7);
  if (!token) return res.status(401).json({ error: 'No token' });
  const user = verifyJWT(token);
  // ... actual route logic
});
```

With middleware, you write authentication logic once:

```typescript
// ✅ GOOD: Write once, use everywhere
router.get('/profile', authenticate, getProfile);
router.get('/listings', authenticate, getListings);
router.post('/listings', authenticate, createListing);
```

## Available Middleware Functions

### 1. `authenticate` - Required Authentication

Use this when a route **requires** authentication. If the user is not authenticated, the request is rejected with a 401 error.

```typescript
import { authenticate } from '../middleware/authMiddleware';

// Single route
router.get('/profile', authenticate, getProfile);

// Multiple routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.delete('/account', authenticate, deleteAccount);
```

**What it does:**
1. Extracts JWT token from `Authorization: Bearer <token>` header
2. Verifies token is valid and not expired
3. Attaches user info to `req.user`
4. Calls `next()` to continue to route handler
5. Returns 401 error if authentication fails

**Error responses:**
- `NO_TOKEN`: No Authorization header provided
- `INVALID_TOKEN_FORMAT`: Header doesn't start with "Bearer "
- `INVALID_TOKEN`: Token is malformed or signature is invalid
- `TOKEN_EXPIRED`: Token has expired (15 minutes)
- `AUTHENTICATION_FAILED`: Generic authentication error

### 2. `optionalAuthenticate` - Optional Authentication

Use this when a route works for both authenticated and unauthenticated users, but behaves differently.

```typescript
import { optionalAuthenticate } from '../middleware/authMiddleware';

router.get('/listings', optionalAuthenticate, getListings);
```

**What it does:**
1. If valid token provided: Attaches user info to `req.user`
2. If no token or invalid token: Continues without user info
3. Never returns an error - always calls `next()`

**Use cases:**
- Homepage that shows personalized content if logged in
- Search results that include user's favorites if authenticated
- Public listings that show "edit" button only for owner

**Example route handler:**
```typescript
async function getListings(req: AuthenticatedRequest, res: Response) {
  const listings = await fetchListings();
  
  if (req.user) {
    // User is logged in - add personalized data
    const favorites = await getUserFavorites(req.user.userId);
    return res.json({ listings, favorites });
  } else {
    // User is not logged in - just return listings
    return res.json({ listings });
  }
}
```

### 3. `requireOwnership` - Ownership Check

Use this when a route requires the user to own a resource (listing, profile, etc.).

```typescript
import { authenticate, requireOwnership } from '../middleware/authMiddleware';

router.put('/listings/:id', authenticate, requireOwnership('listing'), updateListing);
router.delete('/listings/:id', authenticate, requireOwnership('listing'), deleteListing);
```

**What it does:**
1. Ensures `req.user` exists (authentication happened)
2. Continues to route handler
3. Route handler checks if `req.user.userId` matches resource owner

**Note:** The actual ownership check happens in your route handler:

```typescript
async function updateListing(req: AuthenticatedRequest, res: Response) {
  const listingId = req.params.id;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  
  // Check ownership
  if (listing.sellerId !== req.user!.userId) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You can only edit your own listings',
      },
    });
  }
  
  // Update listing...
}
```

## How to Use in Your Routes

### Protect a Single Route

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public route - no authentication
router.get('/listings', getListings);

// Protected route - authentication required
router.get('/profile', authenticate, getProfile);

export default router;
```

### Protect All Routes in a Router

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Apply middleware to ALL routes below
router.use(authenticate);

// All these routes require authentication
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/listings', createListing);
router.delete('/account', deleteAccount);

export default router;
```

### Mix Public and Protected Routes

```typescript
import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/listings', getListings);
router.get('/listings/:id', getListingDetails);

// Optional authentication
router.get('/search', optionalAuthenticate, searchListings);

// Protected routes
router.post('/listings', authenticate, createListing);
router.put('/listings/:id', authenticate, updateListing);
router.delete('/listings/:id', authenticate, deleteListing);

export default router;
```

## Accessing User Information in Route Handlers

After authentication, user information is available in `req.user`:

```typescript
import { AuthenticatedRequest } from '../middleware/authMiddleware';

async function getProfile(req: AuthenticatedRequest, res: Response) {
  // Access authenticated user info
  const userId = req.user!.userId;
  const email = req.user!.email;
  const username = req.user!.username;
  
  // Fetch full user data from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  res.json({ user });
}
```

**TypeScript Note:** Use `req.user!` (with `!`) to tell TypeScript that `req.user` definitely exists after authentication middleware.

## Client-Side Usage

### How to Send Authentication Token

Clients must include the JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

**JavaScript/TypeScript Example:**

```typescript
// Get token from login
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const { token } = await loginResponse.json();

// Store token (localStorage, sessionStorage, or cookie)
localStorage.setItem('authToken', token);

// Use token for authenticated requests
const response = await fetch('http://localhost:5000/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

**Axios Example:**

```typescript
import axios from 'axios';

// Set default header for all requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Or set per request
const response = await axios.get('/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### Handling Authentication Errors

```typescript
try {
  const response = await fetch('/api/users/profile', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    const error = await response.json();
    
    if (error.error.code === 'TOKEN_EXPIRED') {
      // Clear stored token
      localStorage.removeItem('authToken');
      // Redirect to login
      window.location.href = '/login';
    }
  }
  
  const data = await response.json();
  // Use data...
} catch (error) {
  console.error('Request failed:', error);
}
```

## Security Best Practices

### 1. Always Use HTTPS in Production

JWT tokens can be intercepted if sent over HTTP. Always use HTTPS in production:

```typescript
// In production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 2. Set Short Token Expiration

Tokens expire after 15 minutes. This limits damage if a token is stolen:

```typescript
// In authService.ts
const token = jwt.sign(payload, secret, {
  expiresIn: '15m', // Short expiration
});
```

### 3. Never Log Tokens

Tokens are sensitive - never log them:

```typescript
// ❌ BAD
console.log('Token:', req.headers.authorization);

// ✅ GOOD
console.log('Authentication attempt from:', req.ip);
```

### 4. Store JWT Secret Securely

Never hardcode the JWT secret. Use environment variables:

```typescript
// ❌ BAD
const secret = 'my-secret-key';

// ✅ GOOD
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET environment variable is not set');
}
```

### 5. Validate Token on Every Request

Never trust client-side token validation. Always verify on the server:

```typescript
// ✅ GOOD - Server verifies every request
router.get('/profile', authenticate, getProfile);
```

## Testing Protected Routes

### Unit Test Example

```typescript
import { authenticate } from '../middleware/authMiddleware';

it('should reject requests without token', () => {
  const req = { headers: {} } as Request;
  const res = createMockResponse();
  const next = jest.fn();
  
  authenticate(req, res, next);
  
  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
});
```

### Integration Test Example

```typescript
import request from 'supertest';
import app from '../index';

it('should access protected route with valid token', async () => {
  const response = await request(app)
    .get('/api/users/profile')
    .set('Authorization', `Bearer ${validToken}`)
    .expect(200);
  
  expect(response.body.user).toBeDefined();
});
```

## Common Issues and Solutions

### Issue: "No token" error even though token is sent

**Solution:** Check token format. Must be `Bearer <token>` with a space:

```typescript
// ❌ WRONG
Authorization: Bearer<token>

// ✅ CORRECT
Authorization: Bearer <token>
```

### Issue: "Token expired" error immediately after login

**Solution:** Check server time. Token expiration is based on server time:

```bash
# Check server time
date

# Sync time if needed (Linux)
sudo ntpdate -s time.nist.gov
```

### Issue: TypeScript error "Property 'user' does not exist on type 'Request'"

**Solution:** Use `AuthenticatedRequest` type:

```typescript
// ❌ WRONG
import { Request } from 'express';
function handler(req: Request, res: Response) {
  const userId = req.user.userId; // Error!
}

// ✅ CORRECT
import { AuthenticatedRequest } from '../middleware/authMiddleware';
function handler(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId; // Works!
}
```

### Issue: Middleware not running

**Solution:** Ensure middleware is placed BEFORE route handler:

```typescript
// ❌ WRONG - middleware after handler
router.get('/profile', getProfile, authenticate);

// ✅ CORRECT - middleware before handler
router.get('/profile', authenticate, getProfile);
```

## Summary

- Use `authenticate` for routes that require authentication
- Use `optionalAuthenticate` for routes that work with or without authentication
- Use `requireOwnership` for routes that require resource ownership
- Always send tokens as `Authorization: Bearer <token>`
- Tokens expire after 15 minutes for security
- Use HTTPS in production
- Never log or expose tokens

## Next Steps

1. Implement password reset flow (Task 9)
2. Add rate limiting to prevent brute force attacks
3. Implement refresh tokens for longer sessions
4. Add MFA (Multi-Factor Authentication) support
5. Implement FIDO2/WebAuthn for passwordless authentication
