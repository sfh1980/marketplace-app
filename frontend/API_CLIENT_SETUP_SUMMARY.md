# API Client and React Query Setup - Complete ✅

## What We Built

We've successfully set up a complete API client layer for the frontend application. This provides a robust, type-safe, and developer-friendly way to communicate with the backend API.

## Files Created

### Core Infrastructure

1. **`src/lib/axios.ts`** - Configured Axios instance
   - Base URL configuration
   - Request interceptor (automatic JWT token attachment)
   - Response interceptor (error handling, token expiration)
   - Helper functions for auth token management

2. **`src/types/api.ts`** - TypeScript type definitions
   - User, Listing, Message, Rating, Favorite types
   - Request/Response types for all endpoints
   - Pagination and search parameter types
   - Error response types

### API Services (Pure Functions)

3. **`src/services/authService.ts`** - Authentication
   - register, login, logout
   - verifyEmail, requestPasswordReset, resetPassword
   - getCurrentUser, isAuthenticated

4. **`src/services/userService.ts`** - User Profiles
   - getUserProfile, updateProfile
   - uploadProfilePicture
   - getUserListings, getUserRatings

5. **`src/services/listingService.ts`** - Listings
   - getAllListings, getListingById
   - createListing, updateListing, deleteListing
   - updateListingStatus, uploadListingImages

6. **`src/services/searchService.ts`** - Search & Categories
   - searchListings (with filters)
   - getCategories
   - getListingsByCategory

7. **`src/services/messageService.ts`** - Messaging
   - getConversations, getConversationMessages
   - sendMessage, blockUser

8. **`src/services/ratingService.ts`** - Ratings (Post-MVP)
   - createRating, getUserRatings

9. **`src/services/favoriteService.ts`** - Favorites (Post-MVP)
   - getFavorites, addFavorite, removeFavorite
   - isFavorited (helper)

10. **`src/services/index.ts`** - Central exports

### React Query Hooks

11. **`src/hooks/useAuth.ts`** - Authentication hooks
    - useRegister, useLogin, useLogout
    - useRequestPasswordReset, useResetPassword
    - useVerifyEmail

12. **`src/hooks/useListings.ts`** - Listing hooks
    - useListings (fetch all with pagination)
    - useListing (fetch single)
    - useCreateListing, useUpdateListing, useDeleteListing
    - useUpdateListingStatus, useUploadListingImages

13. **`src/hooks/useSearch.ts`** - Search hooks
    - useSearchListings (with filters)
    - useCategories
    - useListingsByCategory

### Documentation & Examples

14. **`src/services/README.md`** - Comprehensive documentation
    - Architecture overview
    - Usage examples
    - Best practices
    - Testing guidelines

15. **`src/examples/ApiUsageExample.tsx`** - Working examples
    - Authentication example
    - Fetching data example
    - Creating data example
    - Search with filters example

16. **`.env.example`** - Environment variable template

## Key Features

### 1. Automatic Authentication
- JWT tokens are automatically attached to all requests
- Token expiration is handled automatically (redirects to login)
- User data is cached in localStorage

### 2. Type Safety
- All API calls are fully typed with TypeScript
- Compile-time error checking
- IDE autocomplete for all API functions

### 3. React Query Integration
- Automatic caching and background refetching
- Built-in loading and error states
- Optimistic updates support
- Pagination support
- Query invalidation after mutations

### 4. Error Handling
- Global error interceptor handles common errors
- 401: Auto-logout and redirect to login
- 403, 404, 500: Logged to console
- Network errors: Logged to console
- Custom error handling in components

### 5. Developer Experience
- Clean, intuitive API
- Comprehensive documentation
- Working examples
- Consistent patterns across all services

## How to Use

### Basic Usage (Recommended)

```typescript
import { useListings } from '../hooks/useListings';

function MyComponent() {
  const { data, isLoading, isError } = useListings(1, 20);
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error!</div>;
  
  return (
    <div>
      {data.data.map(listing => (
        <div key={listing.id}>{listing.title}</div>
      ))}
    </div>
  );
}
```

### Mutations

```typescript
import { useCreateListing } from '../hooks/useListings';

function CreateForm() {
  const createMutation = useCreateListing();
  
  const handleSubmit = (data) => {
    createMutation.mutate(data, {
      onSuccess: () => alert('Created!'),
      onError: () => alert('Failed!')
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

### Direct Service Calls (Outside React)

```typescript
import { authService, listingService } from '../services';

async function doSomething() {
  const { token, user } = await authService.login({
    email: 'user@example.com',
    password: 'password123'
  });
  
  const listings = await listingService.getAllListings(1, 20);
}
```

## Architecture Benefits

### Separation of Concerns

```
Components (UI)
    ↓
React Query Hooks (State Management)
    ↓
API Services (Business Logic)
    ↓
Axios Client (HTTP)
    ↓
Backend API
```

Each layer has a single responsibility:
- **Components**: Render UI and handle user interactions
- **Hooks**: Manage server state, caching, and loading states
- **Services**: Make HTTP requests and transform data
- **Axios**: Handle HTTP communication and interceptors

### Easy to Test

```typescript
// Mock the service
jest.mock('../services/listingService');

// Test the component
test('renders listings', async () => {
  listingService.getAllListings.mockResolvedValue({
    data: [{ id: '1', title: 'Test' }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
  });
  
  render(<ListingsPage />);
  expect(await screen.findByText('Test')).toBeInTheDocument();
});
```

### Easy to Extend

Adding a new endpoint is simple:

1. Add types to `types/api.ts`
2. Add service function to appropriate service file
3. Add React Query hook if needed
4. Use in components

## React Query Benefits

### 1. Automatic Caching
```typescript
// Component A fetches data
const { data } = useListings(1, 20);

// Component B gets cached data (no API call!)
const { data } = useListings(1, 20);
```

### 2. Background Refetching
Data stays fresh automatically:
- When window regains focus
- When network reconnects
- On configurable intervals

### 3. Loading States
```typescript
const { data, isLoading, isError, error } = useListings();

// No need to manage loading state manually!
if (isLoading) return <Spinner />;
if (isError) return <Error message={error.message} />;
return <List data={data.data} />;
```

### 4. Optimistic Updates
Update UI immediately, rollback if API fails:
```typescript
mutation.mutate(data, {
  onMutate: async () => {
    // Update UI immediately
    queryClient.setQueryData(['listing', id], newData);
  },
  onError: () => {
    // Rollback on error
    queryClient.setQueryData(['listing', id], oldData);
  }
});
```

### 5. Pagination Support
```typescript
const [page, setPage] = useState(1);
const { data } = useListings(page, 20);

// Previous page stays visible while loading next page
// (configured with placeholderData)
```

## Environment Setup

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3000
```

In production, set this to your deployed backend URL.

## Next Steps

Now that the API client is set up, you can:

1. **Create Authentication Pages**
   - Login page using `useLogin()`
   - Registration page using `useRegister()`
   - Password reset pages

2. **Create Listing Pages**
   - Browse listings using `useListings()`
   - Listing detail page using `useListing(id)`
   - Create listing form using `useCreateListing()`

3. **Create Search Page**
   - Search interface using `useSearchListings()`
   - Category filters using `useCategories()`

4. **Create Messaging Interface**
   - Inbox using `getConversations()`
   - Conversation view using `getConversationMessages()`

5. **Add Error Boundaries**
   - Catch and display errors gracefully

6. **Add Loading Skeletons**
   - Better UX while data is loading

## Testing the Setup

You can test the API client by:

1. **Using the Example Component**
   ```typescript
   import { ApiExamples } from './examples/ApiUsageExample';
   
   // Add to your App.tsx temporarily
   <ApiExamples />
   ```

2. **Making Test API Calls**
   ```typescript
   import { listingService } from './services';
   
   // In browser console or component
   listingService.getAllListings(1, 20)
     .then(data => console.log('Listings:', data))
     .catch(error => console.error('Error:', error));
   ```

3. **Checking Network Tab**
   - Open browser DevTools → Network tab
   - Watch API requests being made
   - Verify Authorization headers are present
   - Check response data

## Common Patterns

### Protected Routes
```typescript
import { isAuthenticated } from '../services/authService';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  return children;
}
```

### Form Handling
```typescript
function MyForm() {
  const mutation = useCreateListing();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    mutation.mutate({
      title: formData.get('title'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      // ...
    });
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Conditional Queries
```typescript
// Only fetch if user is logged in
const { data } = useListings(1, 20, {
  enabled: isAuthenticated()
});
```

### Dependent Queries
```typescript
// Fetch listing first, then fetch seller details
const { data: listing } = useListing(listingId);
const { data: seller } = useUserProfile(listing?.sellerId, {
  enabled: !!listing?.sellerId
});
```

## Troubleshooting

### CORS Errors
If you see CORS errors, make sure:
1. Backend has CORS enabled
2. Backend allows requests from `http://localhost:5173` (Vite dev server)

### 401 Errors
If you get 401 errors:
1. Check if token is in localStorage: `localStorage.getItem('authToken')`
2. Check if token is expired
3. Try logging in again

### Network Errors
If requests fail:
1. Check if backend is running on `http://localhost:3000`
2. Check `.env` file has correct `VITE_API_URL`
3. Check browser console for errors

### TypeScript Errors
If you see TypeScript errors:
1. Make sure all types are imported correctly
2. Run `npm run build` to check for type errors
3. Check that response data matches type definitions

## Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Axios Documentation](https://axios-http.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## Summary

✅ **Complete API client infrastructure**
✅ **Type-safe with TypeScript**
✅ **React Query integration**
✅ **Automatic authentication**
✅ **Error handling**
✅ **Comprehensive documentation**
✅ **Working examples**

The API client is now ready to use throughout the application. All future features can leverage this infrastructure for reliable, type-safe communication with the backend.
