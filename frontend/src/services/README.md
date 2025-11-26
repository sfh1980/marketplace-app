# API Services and React Query Integration

This directory contains all the API client code for communicating with the backend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│  (Pages, Forms, Lists - UI Layer)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Use hooks
                     ▼
┌─────────────────────────────────────────────────────────┐
│              React Query Hooks (hooks/)                  │
│  - useAuth, useListings, useSearch                      │
│  - Manage loading, caching, refetching                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Call services
                     ▼
┌─────────────────────────────────────────────────────────┐
│              API Services (services/)                    │
│  - authService, listingService, etc.                    │
│  - Pure functions that make HTTP requests               │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Use axios instance
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Axios Client (lib/axios.ts)                │
│  - Configured axios instance                            │
│  - Request/response interceptors                        │
│  - Automatic token attachment                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP requests
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend API                            │
│  Express.js REST API on http://localhost:3000           │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
frontend/src/
├── lib/
│   └── axios.ts              # Axios instance with interceptors
├── types/
│   └── api.ts                # TypeScript type definitions
├── services/
│   ├── authService.ts        # Authentication API calls
│   ├── userService.ts        # User profile API calls
│   ├── listingService.ts     # Listing CRUD API calls
│   ├── searchService.ts      # Search and category API calls
│   ├── messageService.ts     # Messaging API calls
│   ├── ratingService.ts      # Rating API calls (post-MVP)
│   ├── favoriteService.ts    # Favorites API calls (post-MVP)
│   └── index.ts              # Exports all services
└── hooks/
    ├── useAuth.ts            # Authentication hooks
    ├── useListings.ts        # Listing hooks
    └── useSearch.ts          # Search hooks
```

## How to Use

### Option 1: Using React Query Hooks (Recommended)

React Query hooks provide automatic caching, loading states, and error handling.

```typescript
import { useLogin } from '../hooks/useAuth';
import { useListings } from '../hooks/useListings';

function MyComponent() {
  // Fetch data with automatic caching
  const { data: listings, isLoading, isError } = useListings(1, 20);
  
  // Mutations for create/update/delete
  const loginMutation = useLogin();
  
  const handleLogin = (credentials) => {
    loginMutation.mutate(credentials, {
      onSuccess: (data) => {
        console.log('Logged in!', data.user);
      },
      onError: (error) => {
        console.error('Login failed', error);
      }
    });
  };
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading listings</div>;
  
  return (
    <div>
      {listings.data.map(listing => (
        <div key={listing.id}>{listing.title}</div>
      ))}
    </div>
  );
}
```

### Option 2: Using Services Directly

For one-off operations or outside React components:

```typescript
import { authService, listingService } from '../services';

// In an async function
async function doSomething() {
  try {
    // Login
    const { token, user } = await authService.login({
      email: 'user@example.com',
      password: 'password123'
    });
    
    // Fetch listings
    const listings = await listingService.getAllListings(1, 20);
    
    // Create a listing
    const newListing = await listingService.createListing({
      title: 'My Item',
      description: 'Great condition',
      price: 100,
      listingType: 'item',
      category: 'electronics',
      location: 'San Francisco, CA'
    });
    
  } catch (error) {
    console.error('API error:', error);
  }
}
```

## Available Services

### Authentication Service (`authService`)

- `register(data)` - Register a new user
- `login(data)` - Login with email and password
- `logout()` - Logout (clears local storage)
- `verifyEmail(token)` - Verify email address
- `requestPasswordReset(email)` - Request password reset
- `resetPassword(token, newPassword)` - Complete password reset
- `getCurrentUser()` - Get cached user data
- `isAuthenticated()` - Check if user is logged in

### User Service (`userService`)

- `getUserProfile(userId)` - Get user profile
- `updateProfile(userId, data)` - Update profile
- `uploadProfilePicture(userId, file)` - Upload profile picture
- `getUserListings(userId)` - Get user's listings
- `getUserRatings(userId)` - Get user's ratings

### Listing Service (`listingService`)

- `getAllListings(page, limit)` - Get paginated listings
- `getListingById(id)` - Get single listing
- `createListing(data)` - Create new listing
- `updateListing(id, data)` - Update listing
- `updateListingStatus(id, status)` - Mark as sold/completed
- `deleteListing(id)` - Delete listing
- `uploadListingImages(id, files)` - Upload images

### Search Service (`searchService`)

- `searchListings(params)` - Search with filters
- `getCategories()` - Get all categories
- `getListingsByCategory(slug, page, limit)` - Get listings by category

### Message Service (`messageService`)

- `getConversations()` - Get all conversations
- `getConversationMessages(conversationId)` - Get messages in conversation
- `sendMessage(data)` - Send a message
- `blockUser(userId)` - Block a user

## React Query Benefits

### 1. Automatic Caching

Data is cached and reused across components:

```typescript
// Component A fetches listings
const { data } = useListings(1, 20);

// Component B gets the same data from cache (no API call)
const { data } = useListings(1, 20);
```

### 2. Loading and Error States

No need to manage loading/error state manually:

```typescript
const { data, isLoading, isError, error } = useListings();

if (isLoading) return <Spinner />;
if (isError) return <Error message={error.message} />;
return <ListingsList listings={data.data} />;
```

### 3. Background Refetching

Data is automatically refetched in the background to stay fresh:

```typescript
const { data } = useListings(1, 20);
// Data is refetched when:
// - Window regains focus
// - Network reconnects
// - Configurable intervals
```

### 4. Optimistic Updates

Update UI immediately, rollback if API fails:

```typescript
const updateMutation = useUpdateListing();

updateMutation.mutate(
  { id: 'listing-id', data: { title: 'New Title' } },
  {
    // Update UI immediately
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['listing', newData.id]);
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['listing', newData.id]);
      
      // Optimistically update
      queryClient.setQueryData(['listing', newData.id], newData);
      
      return { previous };
    },
    // Rollback on error
    onError: (err, newData, context) => {
      queryClient.setQueryData(['listing', newData.id], context.previous);
    }
  }
);
```

### 5. Pagination Support

Built-in support for paginated data:

```typescript
const [page, setPage] = useState(1);
const { data, isLoading } = useListings(page, 20);

// Keep previous page visible while loading next page
// (configured with placeholderData in the hook)
```

## Error Handling

### Axios Interceptor Handles Common Errors

The axios instance automatically handles:

- **401 Unauthorized**: Clears token and redirects to login
- **403 Forbidden**: Logs error
- **404 Not Found**: Logs error
- **500 Server Error**: Logs error
- **Network errors**: Logs error

### Custom Error Handling in Components

```typescript
const mutation = useCreateListing();

mutation.mutate(data, {
  onError: (error) => {
    if (error.response?.status === 400) {
      // Validation error
      setFormErrors(error.response.data.error.details);
    } else {
      // Generic error
      alert('Something went wrong');
    }
  }
});
```

## Authentication Flow

### 1. Login

```typescript
const loginMutation = useLogin();

loginMutation.mutate({ email, password }, {
  onSuccess: (data) => {
    // Token is automatically stored in localStorage
    // User data is cached
    navigate('/dashboard');
  }
});
```

### 2. Authenticated Requests

All subsequent requests automatically include the JWT token:

```typescript
// Token is automatically added to Authorization header
const listings = await listingService.getAllListings();
```

### 3. Logout

```typescript
const logoutMutation = useLogout();

logoutMutation.mutate();
// - Clears localStorage
// - Clears React Query cache
// - Redirects to home page
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3000
```

In production, set this to your deployed backend URL.

## TypeScript Benefits

All API calls are fully typed:

```typescript
// TypeScript knows the shape of the data
const { data } = useListings();
data.data[0].title; // ✅ TypeScript knows this exists
data.data[0].invalidField; // ❌ TypeScript error

// Function parameters are typed
listingService.createListing({
  title: 'My Item',
  price: 100,
  // TypeScript will error if required fields are missing
});
```

## Best Practices

### 1. Use Hooks in Components

```typescript
// ✅ Good - Use hooks in components
function MyComponent() {
  const { data } = useListings();
  return <div>{data.data.length} listings</div>;
}

// ❌ Bad - Don't call services directly in components
function MyComponent() {
  const [listings, setListings] = useState([]);
  
  useEffect(() => {
    listingService.getAllListings().then(setListings);
  }, []);
  
  return <div>{listings.length} listings</div>;
}
```

### 2. Handle Loading and Error States

```typescript
// ✅ Good - Handle all states
const { data, isLoading, isError } = useListings();

if (isLoading) return <Spinner />;
if (isError) return <ErrorMessage />;
return <ListingsList listings={data.data} />;

// ❌ Bad - Assume data is always available
const { data } = useListings();
return <ListingsList listings={data.data} />; // Crashes if data is undefined
```

### 3. Use Mutation Callbacks

```typescript
// ✅ Good - Handle success and error
mutation.mutate(data, {
  onSuccess: () => navigate('/success'),
  onError: (error) => showError(error.message)
});

// ❌ Bad - No feedback to user
mutation.mutate(data);
```

### 4. Invalidate Queries After Mutations

```typescript
// ✅ Good - Automatically handled by our hooks
const createMutation = useCreateListing();
// This hook automatically invalidates ['listings'] queries

// If you need custom invalidation:
const queryClient = useQueryClient();
mutation.mutate(data, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['listings'] });
  }
});
```

## Testing

### Testing Components with React Query

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

test('renders listings', async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  render(
    <QueryClientProvider client={queryClient}>
      <ListingsPage />
    </QueryClientProvider>
  );
  
  expect(await screen.findByText('My Listing')).toBeInTheDocument();
});
```

### Mocking API Services

```typescript
import * as listingService from '../services/listingService';

jest.mock('../services/listingService');

test('handles API error', async () => {
  listingService.getAllListings.mockRejectedValue(new Error('API Error'));
  
  render(<ListingsPage />);
  
  expect(await screen.findByText('Error loading listings')).toBeInTheDocument();
});
```

## Next Steps

1. Create authentication pages (login, register)
2. Create listing pages (browse, detail, create)
3. Create search page with filters
4. Create messaging interface
5. Add error boundaries for better error handling
6. Add loading skeletons for better UX
7. Add optimistic updates for instant feedback

## Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Axios Documentation](https://axios-http.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
