# Error Boundary Implementation Guide

## What Are Error Boundaries?

Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of crashing the entire application. They act as a "safety net" for your React application.

## Why Do We Need Them?

Without error boundaries:
- A single error in any component crashes the entire app
- Users see a blank white screen with no explanation
- No way to recover without refreshing the page
- Poor user experience and potential data loss

With error boundaries:
- Errors are contained to specific parts of the app
- Users see a friendly error message with recovery options
- The rest of the app continues to work
- Better debugging information in development
- Improved user experience

## How Error Boundaries Work

Error boundaries are implemented as React **class components** (not functional components with hooks) because they use special lifecycle methods:

1. **`static getDerivedStateFromError(error)`** - Called during rendering phase to update state and show fallback UI
2. **`componentDidCatch(error, errorInfo)`** - Called during commit phase for side effects like logging

### What Errors Do They Catch?

Error boundaries catch errors during:
- ✅ Rendering
- ✅ Lifecycle methods
- ✅ Constructors of child components

### What Errors DON'T They Catch?

Error boundaries do NOT catch:
- ❌ Event handlers (use try-catch instead)
- ❌ Asynchronous code (setTimeout, promises, async/await)
- ❌ Server-side rendering
- ❌ Errors thrown in the error boundary itself

## Our Implementation

### File Location
`frontend/src/components/ErrorBoundary.tsx`

### Features

1. **Default Fallback UI**
   - Friendly error message
   - Error icon
   - Multiple recovery options (Try Again, Go Home, Reload)
   - Error details in development mode only

2. **Custom Fallback Support**
   - Pass a custom `fallback` prop to customize the error UI
   - Useful for different error contexts

3. **Error Logging**
   - Logs errors to console in development
   - Optional `onError` callback for production error tracking (e.g., Sentry)

4. **Recovery Actions**
   - **Try Again**: Resets error state and attempts to re-render
   - **Go Home**: Navigates to homepage
   - **Reload Page**: Full page refresh

### Usage Examples

#### Basic Usage

```tsx
import { ErrorBoundary } from './components';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

#### With Custom Fallback

```tsx
<ErrorBoundary
  fallback={(error, resetError) => (
    <div>
      <h1>Custom Error UI</h1>
      <p>{error.message}</p>
      <button onClick={resetError}>Try Again</button>
    </div>
  )}
>
  <YourComponent />
</ErrorBoundary>
```

#### With Error Tracking

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Send to error tracking service
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    });
  }}
>
  <YourComponent />
</ErrorBoundary>
```

#### Multiple Boundaries (Recommended)

```tsx
function App() {
  return (
    // Top-level boundary catches everything
    <ErrorBoundary>
      <Header />
      
      {/* Isolate main content errors */}
      <ErrorBoundary>
        <MainContent />
      </ErrorBoundary>
      
      {/* Isolate sidebar errors */}
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      
      <Footer />
    </ErrorBoundary>
  );
}
```

## Best Practices

### 1. Use Multiple Boundaries

Place error boundaries at strategic points in your component tree to isolate errors:
- One at the top level (catches everything)
- One around each major section (isolates failures)
- One around third-party components (isolates external code)

### 2. Don't Overuse Them

Don't wrap every single component. Error boundaries add overhead and can make debugging harder if overused.

### 3. Provide Recovery Options

Always give users a way to recover:
- Try again (for transient errors)
- Navigate away (for persistent errors)
- Contact support (for critical errors)

### 4. Log Errors in Production

Use the `onError` callback to send errors to a tracking service:

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry, LogRocket, etc.
      errorTrackingService.log(error, errorInfo);
    }
  }}
>
  <App />
</ErrorBoundary>
```

### 5. Show Different UI in Development vs Production

In development:
- Show full error details
- Show component stack trace
- Make debugging easier

In production:
- Show user-friendly message
- Hide technical details
- Provide recovery options

Our implementation does this automatically using `process.env.NODE_ENV`.

### 6. Handle Event Handler Errors Separately

Error boundaries don't catch errors in event handlers. Use try-catch:

```tsx
function MyComponent() {
  const handleClick = () => {
    try {
      // Code that might throw
      riskyOperation();
    } catch (error) {
      // Handle error
      console.error('Error in click handler:', error);
      showErrorToast(error.message);
    }
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

### 7. Handle Async Errors Separately

Error boundaries don't catch errors in async code. Use try-catch:

```tsx
function MyComponent() {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      setData(data);
    } catch (error) {
      // Handle error
      console.error('Error fetching data:', error);
      setError(error.message);
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

## Testing Error Boundaries

Our test file (`frontend/src/components/__tests__/ErrorBoundary.test.tsx`) covers:

1. ✅ Renders children normally when no error
2. ✅ Catches errors and displays fallback UI
3. ✅ Shows error details in development mode
4. ✅ Provides recovery actions
5. ✅ Supports custom fallback UI
6. ✅ Calls onError callback
7. ✅ Logs errors to console

## Integration in Our App

We've integrated error boundaries in `frontend/src/App.tsx`:

1. **Top-level boundary** - Wraps the entire app
2. **Route boundary** - Wraps the Routes component to isolate routing errors

This ensures that:
- If any page crashes, the app shell remains functional
- Users can navigate away from broken pages
- Errors are logged for debugging

## Future Enhancements

Potential improvements for production:

1. **Error Tracking Integration**
   - Integrate with Sentry, LogRocket, or similar
   - Track error frequency and patterns
   - Get notified of critical errors

2. **Retry Logic**
   - Automatic retry for transient errors
   - Exponential backoff for network errors

3. **Contextual Error Messages**
   - Different messages for different error types
   - Localized error messages

4. **Error Recovery Strategies**
   - Automatic fallback to cached data
   - Graceful degradation of features

## Resources

- [React Error Boundaries Documentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Error Handling in React](https://react.dev/learn/error-boundaries)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)

## Summary

Error boundaries are a critical part of production React applications. They:
- Prevent complete app crashes
- Provide better user experience
- Enable error tracking and debugging
- Allow graceful degradation

Our implementation provides a solid foundation with sensible defaults while allowing customization for specific needs.
