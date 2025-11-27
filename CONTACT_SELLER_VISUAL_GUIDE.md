# Contact Seller Button - Visual Guide

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Listing Detail Page                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Vintage Camera                                     │    │
│  │  $250.00                                            │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  [Image Gallery]                          │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  │  Description: A beautiful vintage camera...        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Seller Information                                 │    │
│  │  ┌────┐                                             │    │
│  │  │ 👤 │  sellername                                │    │
│  │  └────┘  ⭐⭐⭐⭐⭐ 4.8                              │    │
│  │          Member since Jan 2024                      │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  💬 Contact Seller                        │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ User clicks "Contact Seller"
                            ▼
                    ┌───────────────┐
                    │ Is user       │
                    │ logged in?    │
                    └───────┬───────┘
                            │
                ┌───────────┴───────────┐
                │                       │
               NO                      YES
                │                       │
                ▼                       ▼
        ┌───────────────┐      ┌───────────────┐
        │  Login Page   │      │ Is user the   │
        │               │      │ seller?       │
        │ After login:  │      └───────┬───────┘
        │ Return to     │              │
        │ listing       │    ┌─────────┴─────────┐
        └───────────────┘    │                   │
                            YES                  NO
                             │                   │
                             ▼                   ▼
                    ┌────────────────┐  ┌────────────────┐
                    │ Show Error:    │  │ Navigate to    │
                    │ "Cannot        │  │ Conversation   │
                    │ contact        │  │ Page           │
                    │ yourself"      │  │                │
                    └────────────────┘  └────────┬───────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Conversation Page                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ← Back    👤 sellername                           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  📦 About listing: Vintage Camera                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  Start the Conversation                             │    │
│  │  Send a message to sellername to start chatting!   │    │
│  │                                                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  [Type a message...]                    [Send]     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Component Interaction

```
┌──────────────────────────────────────────────────────────────┐
│                    ListingDetailPage                          │
│                                                               │
│  State:                                                       │
│  - listing: Listing data from API                            │
│  - currentImageIndex: number                                 │
│                                                               │
│  Functions:                                                   │
│  - handleContactSeller()                                     │
│    1. Check if user is logged in                             │
│    2. Check if user is seller                                │
│    3. Navigate to /messages/:sellerId                        │
│       with state: { listingId, listingTitle }               │
│                                                               │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        │ navigate('/messages/:sellerId', { state })
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                    ConversationPage                           │
│                                                               │
│  Receives from navigation state:                             │
│  - listingId: string                                         │
│  - listingTitle: string                                      │
│                                                               │
│  State:                                                       │
│  - messageContent: string                                    │
│  - messages: Message[]                                       │
│                                                               │
│  Functions:                                                   │
│  - sendMessage()                                             │
│    If first message:                                         │
│      Include listingId in request                            │
│    Else:                                                      │
│      Send without listingId                                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Action                               │
│              Click "Contact Seller"                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ListingDetailPage Component                     │
│                                                              │
│  const handleContactSeller = () => {                        │
│    if (!user) {                                             │
│      navigate('/login', {                                   │
│        state: { from: `/listings/${listingId}` }           │
│      });                                                     │
│      return;                                                 │
│    }                                                         │
│                                                              │
│    if (user.id === listing.seller.id) {                    │
│      alert('Cannot contact yourself');                      │
│      return;                                                 │
│    }                                                         │
│                                                              │
│    navigate(`/messages/${listing.seller.id}`, {            │
│      state: {                                               │
│        listingId: listing.id,                              │
│        listingTitle: listing.title                         │
│      }                                                       │
│    });                                                       │
│  };                                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              React Router Navigation                         │
│                                                              │
│  URL: /messages/:sellerId                                   │
│  State: { listingId, listingTitle }                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ConversationPage Component                      │
│                                                              │
│  const location = useLocation();                            │
│  const locationState = location.state as {                  │
│    listingId?: string;                                      │
│    listingTitle?: string;                                   │
│  };                                                          │
│                                                              │
│  const contextListingId = locationState?.listingId;         │
│  const contextListingTitle = locationState?.listingTitle;   │
│                                                              │
│  // Display listing context banner                          │
│  {contextListingId && contextListingTitle && (              │
│    <Card>                                                    │
│      📦 About listing: {contextListingTitle}                │
│    </Card>                                                   │
│  )}                                                          │
│                                                              │
│  // Include listing in first message                        │
│  const sendMessageMutation = useMutation({                  │
│    mutationFn: async (content: string) => {                │
│      const shouldIncludeListingContext =                    │
│        contextListingId && messages.length === 0;          │
│                                                              │
│      return sendMessage({                                   │
│        receiverId: otherUserId,                            │
│        content,                                             │
│        ...(shouldIncludeListingContext && {                │
│          listingId: contextListingId                       │
│        })                                                    │
│      });                                                     │
│    }                                                         │
│  });                                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                               │
│                                                              │
│  POST /api/messages                                         │
│  Body: {                                                     │
│    receiverId: "seller-456",                                │
│    content: "Is this still available?",                     │
│    listingId: "listing-123"  // Only in first message      │
│  }                                                           │
│                                                              │
│  Response: {                                                 │
│    id: "message-789",                                       │
│    senderId: "buyer-123",                                   │
│    receiverId: "seller-456",                                │
│    listingId: "listing-123",                                │
│    content: "Is this still available?",                     │
│    read: false,                                             │
│    createdAt: "2024-11-26T10:30:00Z"                       │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## CSS Styling

### Listing Context Banner
```css
.listingContext {
  /* Gradient background with primary colors */
  background: linear-gradient(
    135deg, 
    rgba(59, 130, 246, 0.1),  /* Primary blue */
    rgba(139, 92, 246, 0.1)    /* Secondary purple */
  );
  
  /* Left border accent */
  border-left: 3px solid var(--color-primary);
  
  /* Spacing */
  padding: var(--space-md);
}

.listingContextContent {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.listingContextIcon {
  font-size: var(--font-size-2xl);  /* Large emoji */
  flex-shrink: 0;
}

.listingContextLabel {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: var(--font-weight-semibold);
}

.listingContextTitle {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}
```

## Key Features

### 1. Authentication Guard
- Unauthenticated users are redirected to login
- After login, they return to the listing page
- Preserves the user's intent to contact the seller

### 2. Self-Contact Prevention
- Users cannot message themselves about their own listings
- Clear error message explains why
- Prevents confusion and unnecessary conversations

### 3. Listing Context Preservation
- Listing ID and title passed through navigation state
- Visual banner shows what listing is being discussed
- First message automatically associated with listing
- Subsequent messages don't need listing ID (backend tracks it)

### 4. Seamless Navigation
- One-click flow from listing to conversation
- No intermediate steps or forms
- User can start typing immediately
- Context is clear from the banner

### 5. Responsive Design
- Works on mobile and desktop
- Touch-friendly button
- Banner adapts to screen size
- Maintains usability across devices

## Testing Scenarios

### Scenario 1: Unauthenticated User
```
Given: User is not logged in
When: User clicks "Contact Seller"
Then: User is redirected to /login
And: After login, user returns to listing page
And: User can click "Contact Seller" again
```

### Scenario 2: Authenticated User (Not Seller)
```
Given: User is logged in
And: User is viewing someone else's listing
When: User clicks "Contact Seller"
Then: User navigates to conversation page
And: Listing context banner is displayed
And: User can send message immediately
And: First message includes listingId
```

### Scenario 3: Seller Viewing Own Listing
```
Given: User is logged in
And: User is viewing their own listing
When: User clicks "Contact Seller"
Then: Alert is shown: "Cannot contact yourself"
And: User stays on listing page
```

### Scenario 4: Existing Conversation
```
Given: User has already messaged seller about this listing
When: User clicks "Contact Seller" again
Then: User navigates to existing conversation
And: Listing context banner is displayed
And: Previous messages are shown
And: New messages don't include listingId (already associated)
```

## Benefits of This Implementation

1. **User Experience**
   - Simple, one-click action
   - Clear visual feedback
   - Context preserved throughout flow
   - No confusion about what's being discussed

2. **Code Quality**
   - Separation of concerns (navigation vs messaging)
   - Reusable components
   - Clean state management
   - Proper error handling

3. **Maintainability**
   - Well-documented code
   - Clear function responsibilities
   - Easy to test
   - Easy to extend

4. **Performance**
   - No unnecessary API calls
   - Efficient state management
   - Optimistic updates for messages
   - Cached data reused

5. **Security**
   - Authentication required
   - Authorization checked (can't message self)
   - Proper token handling
   - Input validation
