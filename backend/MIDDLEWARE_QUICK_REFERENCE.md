# Authentication Middleware - Quick Reference

## Import

```typescript
import { authenticate, optionalAuthenticate, requireOwnership, AuthenticatedRequest } from '../middleware/authMiddleware';
```

## Usage

### Protect Single Route
```typescript
router.get('/profile', authenticate, getProfile);
```

### Protect All Routes
```typescript
router.use(authenticate);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
```

### Optional Authentication
```typescript
router.get('/listings', optionalAuthenticate, getListings);
```

### Require Ownership
```typescript
router.put('/listings/:id', authenticate, requireOwnership('listing'), updateListing);
```

## Route Handler

```typescript
async function getProfile(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId;
  const email = req.user!.email;
  const username = req.user!.username;
  
  // Your logic here
}
```

## Client Usage

```typescript
// Get token from login
const { token } = await login(email, password);

// Use in requests
fetch('/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Error Responses

- `NO_TOKEN` - No Authorization header
- `INVALID_TOKEN_FORMAT` - Missing "Bearer " prefix
- `INVALID_TOKEN` - Token is malformed
- `TOKEN_EXPIRED` - Token has expired (15 min)
- `AUTHENTICATION_FAILED` - Generic auth error

## Testing

```typescript
// Unit test
import { authenticate } from '../middleware/authMiddleware';

it('should reject without token', () => {
  const req = { headers: {} } as Request;
  const res = createMockResponse();
  const next = jest.fn();
  
  authenticate(req, res, next);
  
  expect(res.status).toHaveBeenCalledWith(401);
});

// Integration test
import request from 'supertest';
import app from '../index';

it('should access protected route', async () => {
  await request(app)
    .get('/api/users/profile')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
});
```

## Common Patterns

### Check if User is Logged In
```typescript
function handler(req: AuthenticatedRequest, res: Response) {
  if (req.user) {
    // User is authenticated
  } else {
    // User is not authenticated
  }
}
```

### Check Resource Ownership
```typescript
async function updateListing(req: AuthenticatedRequest, res: Response) {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id }
  });
  
  if (listing.sellerId !== req.user!.userId) {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Not your listing' }
    });
  }
  
  // Update listing...
}
```

## Security Checklist

- ✅ Always use HTTPS in production
- ✅ Never log tokens
- ✅ Store JWT_SECRET in environment variables
- ✅ Set short token expiration (15 min)
- ✅ Verify token on every request
- ✅ Use generic error messages

## Troubleshooting

**"No token" error but token is sent**
- Check format: `Bearer <token>` with space

**"Token expired" immediately**
- Check server time is correct

**TypeScript error on req.user**
- Use `AuthenticatedRequest` type
- Use `req.user!` to assert it exists

**Middleware not running**
- Ensure middleware is BEFORE handler
- Check you called `next()`

## See Also

- `AUTHENTICATION_MIDDLEWARE_GUIDE.md` - Complete guide
- `src/middleware/authMiddleware.ts` - Source code
- `src/__tests__/auth-middleware.test.ts` - Unit tests
- `src/__tests__/protected-routes.test.ts` - Integration tests
