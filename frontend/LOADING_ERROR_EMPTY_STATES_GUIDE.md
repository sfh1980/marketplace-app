# Loading, Error, and Empty States Guide

## Overview

This guide explains the loading, error, and empty state components implemented in the marketplace platform. These components are essential for providing excellent user experience by giving clear feedback during async operations, when errors occur, and when there's no data to display.

## Why These States Matter

### Loading States
- **Prevent Confusion**: Users know something is happening, not that the app is broken
- **Reduce Perceived Wait Time**: Visual feedback makes waits feel shorter
- **Build Trust**: Shows the app is working and responsive
- **Improve Retention**: Users are less likely to leave if they see progress

### Error States
- **Reduce Frustration**: Clear explanations help users understand what went wrong
- **Enable Recovery**: Actionable next steps help users fix problems
- **Build Trust**: Transparency about errors shows honesty
- **Reduce Support Requests**: Good error messages answer user questions

### Empty States
- **Guide Users**: Show what to do when there's no content
- **Prevent Confusion**: Blank screens look broken; empty states provide context
- **Encourage Action**: Call-to-action buttons drive engagement
- **Improve Onboarding**: Help new users get started

## Components

### 1. LoadingSpinner

A reusable loading indicator with multiple size variants and optional messages.

#### Features
- Animated spinner with smooth rotation
- Three size variants: small, medium, large
- Optional loading message
- Centered layout option
- Accessible with ARIA labels
- Respects reduced motion preferences

#### Usage

```tsx
import { LoadingSpinner } from '../components';

// Simple spinner
<LoadingSpinner />

// With message
<LoadingSpinner message="Loading your listings..." />

// Small size for inline use
<LoadingSpinner size="small" />

// Centered in container
<LoadingSpinner centered message="Please wait..." />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | `undefined` | Optional loading message |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `centered` | `boolean` | `false` | Center in container |
| `className` | `string` | `''` | Additional CSS class |

#### Best Practices

1. **Always show loading states** for async operations
2. **Provide context** with loading messages when possible
3. **Use appropriate size** for the context (small for buttons, large for pages)
4. **Don't overuse** - only show when actually loading
5. **Consider skeleton loaders** for better perceived performance

### 2. ErrorMessage

A reusable error display component with retry functionality and multiple severity levels.

#### Features
- Clear error messaging
- Optional retry button
- Custom action buttons
- Three variants: error, warning, info
- Collapsible technical details
- Accessible with ARIA roles

#### Usage

```tsx
import { ErrorMessage } from '../components';

// Simple error
<ErrorMessage message="Failed to load data" />

// With retry button
<ErrorMessage 
  message="Failed to load listings"
  onRetry={() => refetch()}
/>

// With custom actions
<ErrorMessage 
  title="Page Not Found"
  message="The page you're looking for doesn't exist."
  actions={
    <Button onClick={() => navigate('/')}>Go Home</Button>
  }
/>

// Warning variant
<ErrorMessage 
  variant="warning"
  message="Your session is about to expire"
/>

// With technical details
<ErrorMessage 
  message="Failed to save changes"
  details="Network error: Connection timeout"
  onRetry={handleRetry}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Auto-generated | Error title |
| `message` | `string` | **Required** | Error message |
| `details` | `string` | `undefined` | Technical details (collapsible) |
| `variant` | `'error' \| 'warning' \| 'info'` | `'error'` | Severity level |
| `onRetry` | `() => void` | `undefined` | Retry callback |
| `actions` | `React.ReactNode` | `undefined` | Custom actions |
| `showIcon` | `boolean` | `true` | Show icon |
| `className` | `string` | `''` | Additional CSS class |

#### Best Practices

1. **Use clear, non-technical language** - Avoid jargon
2. **Explain what went wrong** - Don't just say "Error"
3. **Provide actionable next steps** - Tell users what to do
4. **Offer retry options** when appropriate
5. **Don't blame the user** - Use neutral language
6. **Be specific but not overwhelming** - Balance detail with clarity

#### Error Message Guidelines

❌ **Bad Examples:**
- "Error 500"
- "Network request failed"
- "Invalid input"
- "Something went wrong"

✅ **Good Examples:**
- "We couldn't load your listings. Please try again."
- "Connection problem. Check your internet and try again."
- "Please enter a valid email address"
- "We're having trouble connecting to the server. Please try again in a moment."

### 3. EmptyState

A reusable component for displaying empty states with friendly messaging and call-to-action.

#### Features
- Friendly, encouraging messaging
- Optional icon or illustration
- Call-to-action button
- Three size variants
- Customizable content
- Responsive design

#### Usage

```tsx
import { EmptyState } from '../components';

// Simple empty state
<EmptyState
  title="No Listings Yet"
  message="You haven't created any listings yet."
/>

// With action button
<EmptyState
  icon="📦"
  title="No Listings Yet"
  message="Create your first listing to get started!"
  action={
    <Button onClick={() => navigate('/listings/create')}>
      Create Listing
    </Button>
  }
/>

// Search results empty state
<EmptyState
  icon="🔍"
  title="No Results Found"
  message="Try adjusting your search terms or filters."
  action={
    <Button onClick={clearFilters}>Clear Filters</Button>
  }
/>

// Custom icon
<EmptyState
  icon={<CustomIcon />}
  title="No Messages"
  message="Your inbox is empty."
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string \| React.ReactNode` | `undefined` | Icon or emoji |
| `title` | `string` | **Required** | Title |
| `message` | `string` | **Required** | Message |
| `action` | `React.ReactNode` | `undefined` | Call-to-action |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `className` | `string` | `''` | Additional CSS class |

#### Best Practices

1. **Never show a blank screen** - Always provide context
2. **Explain why there's no content** - Give users context
3. **Provide a clear next action** - Guide users forward
4. **Use friendly, encouraging language** - Make it positive
5. **Add visual interest** - Icons make it less boring
6. **Frame as opportunity** - Not a problem, but a fresh start

#### Empty State Guidelines

❌ **Bad Examples:**
- "No results"
- "Empty"
- "0 items"
- "Nothing here"

✅ **Good Examples:**
- "No listings yet. Be the first to post!"
- "Your inbox is empty. Browse listings to start conversations!"
- "You haven't saved any favorites yet. Click the heart icon on listings you like!"
- "No results found. Try adjusting your search terms or filters."

## Implementation Examples

### Page with Loading, Error, and Empty States

```tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components';
import { getListings } from '../services/listingService';

const ListingsPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['listings'],
    queryFn: getListings,
  });

  // Loading State
  if (isLoading) {
    return <LoadingSpinner centered message="Loading listings..." />;
  }

  // Error State
  if (isError) {
    return (
      <ErrorMessage
        message="We couldn't load the listings. Please try again."
        details={error instanceof Error ? error.message : undefined}
        onRetry={refetch}
      />
    );
  }

  // Empty State
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="📦"
        title="No Listings Yet"
        message="Be the first to create a listing!"
        action={
          <Button onClick={() => navigate('/listings/create')}>
            Create Listing
          </Button>
        }
      />
    );
  }

  // Success State - Display Data
  return (
    <div>
      {data.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
};
```

### Inline Loading State

```tsx
<Button onClick={handleSubmit} disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <LoadingSpinner size="small" />
      <span>Saving...</span>
    </>
  ) : (
    'Save Changes'
  )}
</Button>
```

### Form Error State

```tsx
{formError && (
  <ErrorMessage
    variant="error"
    message={formError}
    showIcon={false}
  />
)}
```

## UX Best Practices

### Loading States

1. **Show immediately** - Don't wait to show loading state
2. **Provide context** - Tell users what's loading
3. **Use appropriate indicators** - Spinners for unknown duration, progress bars for known
4. **Consider skeleton screens** - Better perceived performance
5. **Don't block unnecessarily** - Allow interaction when possible

### Error States

1. **Be human** - Write like you're talking to a friend
2. **Be helpful** - Provide solutions, not just problems
3. **Be specific** - "Connection failed" is better than "Error"
4. **Be honest** - Don't hide errors or blame users
5. **Be actionable** - Always provide next steps

### Empty States

1. **Be encouraging** - Frame as opportunity
2. **Be clear** - Explain why it's empty
3. **Be actionable** - Provide clear next step
4. **Be visual** - Use icons or illustrations
5. **Be contextual** - Tailor message to the situation

## Accessibility

All components follow accessibility best practices:

### LoadingSpinner
- `role="status"` for dynamic content
- `aria-live="polite"` for screen reader announcements
- `aria-label` for context
- Respects `prefers-reduced-motion`

### ErrorMessage
- `role="alert"` for important messages
- `aria-live="assertive"` for immediate announcements
- High contrast colors
- Clear, readable typography

### EmptyState
- Semantic HTML structure
- Clear heading hierarchy
- Keyboard accessible actions
- Screen reader friendly

## Testing

All components have comprehensive test coverage:

```bash
# Run component tests
npm test -- LoadingSpinner.test.tsx
npm test -- ErrorMessage.test.tsx
npm test -- EmptyState.test.tsx

# Run all component tests
npm test -- src/components/__tests__
```

## Further Reading

- [Nielsen Norman Group: Progress Indicators](https://www.nngroup.com/articles/progress-indicators/)
- [Material Design: Empty States](https://material.io/design/communication/empty-states.html)
- [Error Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)

## Summary

These three components form the foundation of good user experience in async applications:

1. **LoadingSpinner** - Shows progress during operations
2. **ErrorMessage** - Communicates problems clearly
3. **EmptyState** - Guides users when there's no content

Use them consistently throughout the application to provide clear, helpful feedback to users at all times.
