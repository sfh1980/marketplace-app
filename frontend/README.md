# Marketplace Platform - Frontend

## Overview

This is the frontend application for the Marketplace Platform, built with React 18, TypeScript, and Vite. The application provides a modern, responsive user interface for buying and selling items and services.

## Technology Stack

### Core Technologies

- **React 18**: Modern UI library with hooks and concurrent features
- **TypeScript**: Type-safe JavaScript for better developer experience and fewer bugs
- **Vite**: Fast build tool and development server with hot module replacement (HMR)

### Key Libraries

- **React Router DOM v6**: Client-side routing for single-page application navigation
- **React Query (@tanstack/react-query)**: Server state management, caching, and data fetching
- **Axios**: HTTP client for API communication with the backend

### Development Tools

- **ESLint**: Code linting to catch errors and enforce code style
- **Prettier**: Code formatting for consistent style
- **TypeScript Compiler**: Type checking and compilation

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── .gitkeep
│   ├── pages/           # Page-level components (routes)
│   │   └── .gitkeep
│   ├── hooks/           # Custom React hooks
│   │   └── .gitkeep
│   ├── context/         # React Context providers (global state)
│   │   └── .gitkeep
│   ├── services/        # API service functions
│   │   └── .gitkeep
│   ├── utils/           # Utility functions and helpers
│   │   └── .gitkeep
│   ├── types/           # TypeScript type definitions
│   │   └── .gitkeep
│   ├── styles/          # Global CSS files
│   │   ├── reset.css    # CSS reset for browser consistency
│   │   ├── variables.css # CSS custom properties (design system)
│   │   └── base.css     # Base styles and utilities
│   ├── App.tsx          # Root application component
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

### Folder Organization Explained

**Why this structure?**
- **Separation of concerns**: Each folder has a specific purpose
- **Scalability**: Easy to find and organize code as the project grows
- **Team collaboration**: Clear conventions make it easier for multiple developers to work together
- **Maintainability**: Related code is grouped together

**Folder purposes:**

- `components/`: Reusable UI components like buttons, cards, forms, modals
  - Example: `Button.tsx`, `ListingCard.tsx`, `SearchBar.tsx`
  
- `pages/`: Full page components that represent routes
  - Example: `HomePage.tsx`, `LoginPage.tsx`, `ListingDetailPage.tsx`
  
- `hooks/`: Custom React hooks for reusable logic
  - Example: `useAuth.ts`, `useListings.ts`, `useDebounce.ts`
  
- `context/`: React Context providers for global state
  - Example: `AuthContext.tsx`, `ThemeContext.tsx`
  
- `services/`: Functions that communicate with the backend API
  - Example: `authService.ts`, `listingService.ts`, `messageService.ts`
  
- `utils/`: Helper functions and utilities
  - Example: `formatDate.ts`, `validation.ts`, `constants.ts`
  
- `types/`: TypeScript type definitions and interfaces
  - Example: `user.types.ts`, `listing.types.ts`, `api.types.ts`
  
- `styles/`: Global CSS files and design system

## Design System (CSS Variables)

The application uses CSS Custom Properties (CSS Variables) for a consistent design system. This approach provides:

- **Consistency**: All components use the same colors, spacing, and typography
- **Maintainability**: Change a value once, update everywhere
- **Theming**: Easy to implement dark mode or custom themes
- **Performance**: No JavaScript needed for styling

### Available CSS Variables

See `src/styles/variables.css` for the complete list. Key categories:

- **Colors**: Primary, secondary, success, warning, error, text, background
- **Spacing**: xs (4px) to 2xl (48px) for consistent margins and padding
- **Typography**: Font sizes, weights, and line heights
- **Border Radius**: sm, md, lg, full for rounded corners
- **Shadows**: sm, md, lg for depth and elevation
- **Transitions**: Fast, base, slow for smooth animations

### Using CSS Variables

```css
/* In your component CSS */
.my-button {
  background-color: var(--color-primary);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
}

.my-button:hover {
  background-color: var(--color-primary-dark);
}
```

## React Router Setup

The application uses React Router v6 for client-side routing. This means:

- **No page reloads**: Navigation happens instantly without server requests
- **Browser history**: Back/forward buttons work as expected
- **URL-based navigation**: Each page has its own URL for bookmarking and sharing

### How it works

```tsx
// In App.tsx
<Router>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/listings/:id" element={<ListingDetailPage />} />
  </Routes>
</Router>
```

### Navigation

```tsx
// Using Link component (preferred)
import { Link } from 'react-router-dom';
<Link to="/listings/123">View Listing</Link>

// Programmatic navigation
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/listings/123');
```

## React Query Setup

React Query manages server state (data from the backend API). Benefits:

- **Automatic caching**: Fetched data is cached and reused
- **Background refetching**: Data stays fresh automatically
- **Loading and error states**: Built-in handling for async operations
- **Optimistic updates**: UI updates before server confirms
- **Deduplication**: Multiple components requesting same data = one request

### Configuration

```tsx
// In App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      retry: 1, // Retry failed requests once
    },
  },
});
```

### Usage Example

```tsx
import { useQuery } from '@tanstack/react-query';

function ListingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['listings'],
    queryFn: () => fetch('/api/listings').then(res => res.json()),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading listings</div>;
  
  return <div>{/* Render listings */}</div>;
}
```

## Vite Configuration

Vite is our build tool and development server. Key features:

- **Fast HMR**: Changes appear instantly without full page reload
- **Path aliases**: Use `@/` instead of `../../` for imports
- **API proxy**: Frontend can call `/api/*` which proxies to backend
- **Code splitting**: Automatic optimization for production builds

### Path Aliases

```tsx
// Instead of this:
import { Button } from '../../../components/Button';

// You can write:
import { Button } from '@/components/Button';
```

### API Proxy

During development, API requests to `/api/*` are automatically forwarded to `http://localhost:5000`:

```tsx
// This request goes to http://localhost:5000/api/listings
axios.get('/api/listings');
```

## Available Scripts

Run these commands in the `frontend/` directory:

### Development

```bash
npm run dev
```
Starts the development server at http://localhost:5173
- Hot Module Replacement (HMR) enabled
- Automatically opens browser
- API requests proxied to backend

### Build

```bash
npm run build
```
Creates optimized production build in `dist/` folder
- TypeScript compilation
- Code minification
- Asset optimization
- Source maps generated

### Preview

```bash
npm run preview
```
Preview the production build locally before deploying

### Linting

```bash
npm run lint
```
Check code for errors and style issues using ESLint

### Formatting

```bash
npm run format
```
Format all code using Prettier for consistent style

### Testing

```bash
npm run test
```
Run Jest tests (to be implemented)

## TypeScript Configuration

TypeScript provides type safety and better developer experience:

- **Strict mode enabled**: Catches more potential bugs
- **Path aliases**: `@/*` maps to `src/*`
- **JSX support**: React components with type checking
- **Modern ES features**: ES2020 target with latest JavaScript features

### Benefits of TypeScript

1. **Catch errors early**: Type errors found during development, not production
2. **Better IDE support**: Autocomplete, refactoring, inline documentation
3. **Self-documenting code**: Types serve as documentation
4. **Safer refactoring**: Compiler catches breaking changes

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Backend server running on port 5000

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### Running the Application

```bash
# Start development server
npm run dev
```

The application will open at http://localhost:5173

### Development Workflow

1. **Start backend server** (in separate terminal)
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Make changes** - Files auto-reload with HMR

4. **Check for errors**
   ```bash
   npm run lint
   ```

5. **Format code**
   ```bash
   npm run format
   ```

## Next Steps

Now that the project structure is set up, we'll build:

1. **Reusable UI components** (Button, Input, Card, Modal)
2. **Authentication pages** (Login, Register, Password Reset)
3. **Listing pages** (Browse, Create, Edit, Detail)
4. **Search and filtering** (Search bar, filters, results)
5. **Messaging interface** (Inbox, conversations)
6. **User profile pages** (View, Edit)

Each feature will be built incrementally with explanations and testing at checkpoints.

## Best Practices

### Component Organization

```tsx
// Component file structure
import React from 'react';
import styles from './Button.module.css';

// TypeScript interface for props
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

// Component with clear prop types
export function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  return (
    <button 
      className={`${styles.button} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### CSS Modules

Use CSS Modules for component-scoped styles:

```tsx
// Button.tsx
import styles from './Button.module.css';

export function Button() {
  return <button className={styles.button}>Click me</button>;
}
```

```css
/* Button.module.css */
.button {
  background-color: var(--color-primary);
  padding: var(--space-md);
  border-radius: var(--radius-md);
}
```

### API Service Pattern

Centralize API calls in service files:

```tsx
// services/listingService.ts
import axios from 'axios';

export const listingService = {
  getAll: () => axios.get('/api/listings'),
  getById: (id: string) => axios.get(`/api/listings/${id}`),
  create: (data: CreateListingData) => axios.post('/api/listings', data),
  update: (id: string, data: UpdateListingData) => 
    axios.put(`/api/listings/${id}`, data),
  delete: (id: string) => axios.delete(`/api/listings/${id}`),
};
```

### Custom Hooks

Extract reusable logic into custom hooks:

```tsx
// hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router Documentation](https://reactrouter.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [CSS Variables Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

## Troubleshooting

### Port already in use

If port 5173 is already in use:
```bash
# Kill the process using the port (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change the port in vite.config.ts
server: {
  port: 3000, // Use different port
}
```

### Module not found errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
# Restart TypeScript server in VS Code
Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### HMR not working

```bash
# Restart the dev server
# Press Ctrl+C to stop, then npm run dev again
```

## Contributing

When adding new features:

1. Create components in appropriate folders
2. Use TypeScript for type safety
3. Follow CSS variable naming conventions
4. Write clear, commented code
5. Test your changes before committing
6. Run linter and formatter before pushing

---

**Happy coding! 🚀**
