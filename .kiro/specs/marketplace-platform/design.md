# Design Docum
ent: Marketplace Platform

## Overview

The Marketplace Platform is a full-stack web application that enables peer-to-peer buying and selling of both physical goods and legal services. The system follows a modern three-tier architecture with a React-based frontend, Node.js/Express backend API, and PostgreSQL database. The platform emphasizes user experience, top-tier security (including FIDO2, MFA, and biometric authentication), and scalability while providing essential marketplace features including advanced user authentication, listing management, search functionality, messaging, and user ratings.

### MVP Focus

The initial MVP will focus on core functionality:
- Basic user registration and authentication (password-based with email verification)
- Creating and browsing listings (both items and services)
- Basic search and filtering
- Simple messaging between users
- User profiles with basic information

Advanced features for post-MVP:
- FIDO2/WebAuthn passwordless authentication
- Multi-factor authentication (TOTP)
- Biometric authentication for mobile
- Advanced search with filters
- Rating and review system
- Favorites/saved listings
- Image optimization and multiple sizes
- Real-time messaging

### Research: Common Marketplace Pain Points

Based on user feedback from popular marketplace platforms, users commonly complain about:

1. **Scams and Fraud**: Fake listings, non-delivery, payment scams
   - *Our approach*: Verified user profiles, rating system, secure messaging, future payment escrow

2. **Poor Search Experience**: Irrelevant results, outdated listings, poor filtering
   - *Our approach*: Clean search with accurate filtering, automatic removal of sold items, relevance-based results

3. **Spam and Low-Quality Listings**: Duplicate posts, misleading descriptions, poor images
   - *Our approach*: Image requirements, character limits, duplicate detection, moderation tools

4. **Unresponsive Sellers**: Messages go unanswered, listings stay up after items are sold
   - *Our approach*: Automatic status updates, response time tracking, seller activity indicators

5. **Complicated UI**: Too many features, cluttered interface, difficult navigation
   - *Our approach*: Clean, minimal design with CSS variables for consistency, focus on core features first

6. **Privacy Concerns**: Personal information exposed, location tracking, data selling
   - *Our approach*: Minimal data collection, general location only, no email exposure, strong security

7. **Hidden Fees**: Unexpected charges, complex pricing structures
   - *Our approach*: Transparent pricing, no hidden fees, clear cost structure

8. **Poor Mobile Experience**: Desktop-first design, slow loading, difficult to use on phones
   - *Our approach*: Mobile-first responsive design, optimized images, touch-friendly interface

## Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript for type safety and modern component architecture
- React Router for client-side routing
- Axios for API communication
- CSS Variables (Custom Properties) for theming and styling with BEM methodology for class naming
- CSS Modules for component-scoped styles
- React Query for server state management and caching
- @simplewebauthn/browser for FIDO2/WebAuthn support (post-MVP)

**Backend:**
- Node.js with Express.js for RESTful API
- TypeScript for type safety
- PostgreSQL for relational data storage
- Prisma ORM for database access and migrations
- JWT (JSON Web Tokens) for session management
- bcrypt for password hashing
- @simplewebauthn/server for FIDO2/WebAuthn support (post-MVP)
- speakeasy for TOTP-based MFA (post-MVP)
- Multer for file upload handling
- Express-validator for input validation
- Nodemailer for email verification

**Infrastructure:**
- Cloud storage (AWS S3 or similar) for image storage
- Redis for session management and caching (optional for MVP)

### System Architecture

The application follows a client-server architecture with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         React Frontend (SPA)            │
│  - Components, Pages, State Management  │
└──────────────┬──────────────────────────┘
               │ HTTPS/REST API
┌──────────────▼──────────────────────────┐
│       Express.js Backend API            │
│  - Controllers, Services, Middleware    │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼──────┐ ┌──▼─────┐ ┌─▼────────┐
│PostgreSQL Database│ │Cloud Storage│
│  - Users  │ │  - Images │
│  - Listings│ │           │
│  - Messages│ │           │
└──────────┘ └──────────┘ └──────────┘
```

## Components and Interfaces

### Frontend Components

**Pages:**
- HomePage: Landing page with featured/recent listings
- SearchPage: Search results with filters
- ListingDetailPage: Full listing information
- CreateListingPage: Form for creating new listings
- ProfilePage: User profile and listing management
- MessagesPage: Inbox and conversation view
- AuthPage: Login and registration forms

**Shared Components:**
- ListingCard: Reusable listing preview component
- ImageGallery: Image viewer with navigation
- SearchBar: Search input with autocomplete
- FilterPanel: Category, price, location filters
- MessageThread: Conversation display
- RatingDisplay: Star rating visualization
- UserAvatar: Profile picture component

### CSS Architecture

The application uses CSS Variables (Custom Properties) for maintainable, themeable styling:

**Design System Structure:**
```
src/styles/
├── variables.css          # CSS custom properties (colors, spacing, typography)
├── reset.css             # CSS reset/normalize
├── base.css              # Base element styles
├── utilities.css         # Utility classes
└── components/           # Component-specific styles
    ├── Button.module.css
    ├── Card.module.css
    └── ...
```

**CSS Variables Organization:**
```css
:root {
  /* Color Palette */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-primary-light: #60a5fa;
  --color-secondary: #8b5cf6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-text-primary: #1f2937;
  --color-text-secondary: #6b7280;
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-border: #e5e7eb;
  
  /* Spacing Scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  /* Typography */
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
  
  /* Breakpoints (for reference in media queries) */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}

/* Dark mode support (post-MVP) */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: #f9fafb;
    --color-text-secondary: #d1d5db;
    --color-background: #111827;
    --color-surface: #1f2937;
    --color-border: #374151;
  }
}
```

**CSS Best Practices:**
- BEM (Block Element Modifier) naming convention for global styles
- CSS Modules for component-scoped styles to prevent conflicts
- Mobile-first responsive design using media queries
- Semantic HTML with ARIA attributes for accessibility
- CSS Grid and Flexbox for layouts
- No inline styles (except dynamic values from props)
- Consistent use of CSS variables throughout
- Minimal use of !important (only for utilities)
- Performance: Critical CSS inlined, non-critical loaded async

### Backend API Endpoints

**Authentication:**
- POST /api/auth/register - Create new user account
- POST /api/auth/verify-email/:token - Verify email address
- POST /api/auth/login - Authenticate user
- POST /api/auth/logout - End user session
- POST /api/auth/reset-password - Request password reset
- POST /api/auth/reset-password/:token - Complete password reset
- POST /api/auth/mfa/setup - Enable MFA and get QR code (post-MVP)
- POST /api/auth/mfa/verify - Verify MFA code (post-MVP)
- POST /api/auth/webauthn/register-challenge - Get WebAuthn registration challenge (post-MVP)
- POST /api/auth/webauthn/register-verify - Verify WebAuthn registration (post-MVP)
- POST /api/auth/webauthn/login-challenge - Get WebAuthn login challenge (post-MVP)
- POST /api/auth/webauthn/login-verify - Verify WebAuthn login (post-MVP)

**Users:**
- GET /api/users/:id - Get user profile
- PUT /api/users/:id - Update user profile
- POST /api/users/:id/avatar - Upload profile picture
- GET /api/users/:id/listings - Get user's listings
- GET /api/users/:id/ratings - Get user's ratings

**Listings:**
- GET /api/listings - Get all listings (with pagination and filters)
- GET /api/listings/:id - Get specific listing
- POST /api/listings - Create new listing (item or service)
- PUT /api/listings/:id - Update listing
- DELETE /api/listings/:id - Delete listing
- POST /api/listings/:id/images - Upload listing images
- PATCH /api/listings/:id/status - Mark as sold/completed/available

**Search:**
- GET /api/search - Search listings with query and filters (including listing type)
- GET /api/categories - Get all categories with counts

**Messages:**
- GET /api/messages - Get user's conversations
- GET /api/messages/:conversationId - Get conversation messages
- POST /api/messages - Send new message
- POST /api/messages/block/:userId - Block user

**Ratings:**
- POST /api/ratings - Submit rating and review
- GET /api/ratings/user/:userId - Get user's ratings

**Favorites:**
- GET /api/favorites - Get user's saved listings
- POST /api/favorites/:listingId - Add listing to favorites
- DELETE /api/favorites/:listingId - Remove from favorites

## Data Models

### User
```typescript
{
  id: string (UUID)
  email: string (unique)
  emailVerified: boolean
  username: string (unique)
  passwordHash: string | null (null for passwordless users)
  profilePicture: string | null
  location: string | null
  joinDate: Date
  averageRating: number
  mfaEnabled: boolean
  mfaSecret: string | null (encrypted TOTP secret)
  webauthnCredentials: WebAuthnCredential[] (FIDO2 credentials)
  createdAt: Date
  updatedAt: Date
}
```

### WebAuthnCredential (Post-MVP)
```typescript
{
  id: string (UUID)
  userId: string (FK to User)
  credentialId: string (unique)
  publicKey: string
  counter: number
  deviceName: string
  createdAt: Date
}
```

### Listing
```typescript
{
  id: string (UUID)
  sellerId: string (FK to User)
  title: string
  description: string
  price: number
  listingType: 'item' | 'service'
  pricingType: 'fixed' | 'hourly' | null (for services)
  category: string
  images: string[] (URLs)
  status: 'active' | 'sold' | 'completed' | 'deleted'
  location: string
  createdAt: Date
  updatedAt: Date
}
```

### Message
```typescript
{
  id: string (UUID)
  senderId: string (FK to User)
  receiverId: string (FK to User)
  listingId: string | null (FK to Listing)
  content: string
  read: boolean
  createdAt: Date
}
```

### Rating
```typescript
{
  id: string (UUID)
  raterId: string (FK to User)
  ratedUserId: string (FK to User)
  listingId: string | null (FK to Listing)
  stars: number (1-5)
  review: string | null
  createdAt: Date
}
```

### Favorite
```typescript
{
  id: string (UUID)
  userId: string (FK to User)
  listingId: string (FK to Listing)
  createdAt: Date
}
```

### Category
```typescript
{
  id: string (UUID)
  name: string
  slug: string
  description: string
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication and User Management Properties

**Property 1: Valid registration creates unique user accounts**
*For any* valid registration data (email, password, username), submitting the registration should create a new user account with a unique identifier that can be retrieved from the database.
**Validates: Requirements 1.1**

**Property 2: Duplicate email registration is rejected**
*For any* existing user account, attempting to register a new account with the same email address should be rejected with an appropriate error, and no new account should be created.
**Validates: Requirements 1.2**

**Property 3: Valid credentials authenticate successfully**
*For any* registered user, submitting their correct email and password should result in successful authentication and return a valid authentication token.
**Validates: Requirements 1.3**

**Property 4: Invalid credentials are rejected**
*For any* login attempt with incorrect credentials (wrong password or non-existent email), the authentication should fail and return an appropriate error without granting access.
**Validates: Requirements 1.4**

**Property 4a: MFA enforcement works correctly (Post-MVP)**
*For any* user with MFA enabled, login attempts should require valid second factor verification, and should fail if the second factor is missing or incorrect.
**Validates: Requirements 1.6**

**Property 4b: FIDO2 authentication works correctly (Post-MVP)**
*For any* user with registered FIDO2 credentials, authentication using the security key should succeed with valid credentials and fail with invalid credentials.
**Validates: Requirements 1.7**

**Property 4c: Biometric authentication is available on capable devices (Post-MVP)**
*For any* user accessing from a device with biometric capabilities, the platform should offer biometric authentication as an option after initial credential setup.
**Validates: Requirements 1.8**

**Property 5: Profile updates persist correctly**
*For any* user and any valid profile data (username, location, profile picture), updating the profile should persist all changes such that subsequent profile retrievals return the updated information.
**Validates: Requirements 2.1, 2.2, 2.4**

**Property 6: Profile view contains required information**
*For any* user profile, viewing the profile should return all required fields including username, profile picture, join date, and listing history.
**Validates: Requirements 2.3**

### Listing Management Properties

**Property 7: Valid listing creation succeeds**
*For any* valid listing data (title, description, price, category, listing type, images), creating a listing should result in a new listing that is visible in search results and retrievable by its ID.
**Validates: Requirements 3.1**

**Property 7a: Service listings store pricing type correctly**
*For any* service listing with a pricing type (hourly or fixed), the listing should store and return the correct pricing type when retrieved.
**Validates: Requirements 3.2**

**Property 8: Image upload respects limits and ordering**
*For any* listing, uploading images should store up to 10 images in the order they were uploaded, and attempting to upload more than 10 images should either reject additional images or replace existing ones.
**Validates: Requirements 3.2**

**Property 9: Listing edits preserve creation timestamp**
*For any* existing listing, editing any listing fields (title, description, price) should update those fields while maintaining the original creation timestamp unchanged.
**Validates: Requirements 3.3**

**Property 10: Sold listings are excluded from active searches**
*For any* listing marked as sold, that listing should not appear in search results for active listings, but should still be retrievable by direct ID lookup.
**Validates: Requirements 3.4**

**Property 11: Deleted listings are permanently removed**
*For any* listing that is deleted, attempting to retrieve that listing by ID should fail, and the listing should not appear in any search results or user listing history.
**Validates: Requirements 3.5**

### Search and Discovery Properties

**Property 12: Search returns matching listings**
*For any* search query, all returned listings should contain the query text in either their title or description (case-insensitive).
**Validates: Requirements 4.2**

**Property 13: Filters return only matching results**
*For any* combination of filters (category, price range, location, listing type), all returned listings should satisfy all applied filter criteria.
**Validates: Requirements 4.3, 4.4, 4.5, 4.6**

**Property 14: Listing details include all required information**
*For any* listing, retrieving the listing details should return all required fields including images, description, price, seller information, posting date, and seller rating.
**Validates: Requirements 5.1, 5.2**

**Property 15: Sold status is reflected in listing view**
*For any* listing marked as sold, viewing the listing details should include a sold status indicator.
**Validates: Requirements 5.4**

### Messaging Properties

**Property 16: Messages are delivered and associated correctly**
*For any* message sent from one user to another about a listing, the message should be stored with the correct sender, receiver, listing association, and timestamp, and should appear in the receiver's inbox.
**Validates: Requirements 6.1, 6.2, 6.4**

**Property 17: Inbox organizes conversations correctly**
*For any* user with multiple message threads, viewing the inbox should display all conversations organized by listing or conversation partner.
**Validates: Requirements 6.3**

**Property 18: Blocking prevents message delivery**
*For any* two users where one has blocked the other, attempting to send a message from the blocked user should fail, and no message should be delivered.
**Validates: Requirements 6.5**

### Rating and Review Properties

**Property 19: Rating submission works within valid range**
*For any* transaction between two users, both users should be able to submit a rating (1-5 stars) with an optional text review, and the rating should be stored and associated with both users.
**Validates: Requirements 7.1, 7.2**

**Property 20: Profile displays ratings correctly**
*For any* user with ratings, viewing their profile should display the correct average rating (calculated from all ratings) and all individual reviews.
**Validates: Requirements 7.3, 7.5**

**Property 21: Duplicate ratings are prevented**
*For any* transaction, if a user has already submitted a rating, attempting to submit another rating for the same transaction should be rejected.
**Validates: Requirements 7.4**

### Category and Organization Properties

**Property 22: Listings require valid categories**
*For any* listing creation attempt without a category, the creation should be rejected, and for any listing with a valid category, the creation should succeed.
**Validates: Requirements 8.1**

**Property 23: Category browsing returns correct listings**
*For any* category, browsing that category should return all and only active listings assigned to that category.
**Validates: Requirements 8.2**

**Property 24: Category counts are accurate**
*For any* category, the displayed count should equal the actual number of active listings in that category.
**Validates: Requirements 8.3**

**Property 25: Listings display assigned categories**
*For any* listing with categories, viewing the listing should display all assigned categories.
**Validates: Requirements 8.4**

### Favorites Properties

**Property 26: Favoriting adds to saved collection**
*For any* user and listing, marking the listing as favorite should add it to the user's saved items collection, and it should appear when viewing favorites.
**Validates: Requirements 9.1, 9.2**

**Property 27: Favorites reflect listing status changes**
*For any* favorited listing, if the listing status changes (sold or deleted), the user's favorites view should reflect the updated status.
**Validates: Requirements 9.3**

**Property 28: Unfavoriting removes from collection**
*For any* favorited listing, removing it from favorites should result in the listing no longer appearing in the user's saved items collection.
**Validates: Requirements 9.4**

### Data Persistence and Security Properties

**Property 29: Data changes persist immediately**
*For any* create or update operation (user, listing, message, etc.), the changes should be immediately retrievable in subsequent read operations.
**Validates: Requirements 10.1**

**Property 30: Passwords are hashed before storage**
*For any* user registration or password change, the password stored in the database should be a hash, not the plaintext password, and should be verifiable using the hashing algorithm.
**Validates: Requirements 10.2**

**Property 31: Images are optimized for web delivery**
*For any* uploaded image, the stored image should be in a web-optimized format (e.g., compressed JPEG/PNG or WebP) and should be smaller in size than the original upload while maintaining acceptable quality.
**Validates: Requirements 10.3**

**Property 32: Account deletion removes personal data**
*For any* user account deletion, all personal identifiable information should be removed from the database, while transaction history should remain in an anonymized form.
**Validates: Requirements 10.4**

## Error Handling

The application implements comprehensive error handling at multiple levels:

**Validation Layer:**
- Input validation using express-validator on all API endpoints
- Type checking via TypeScript at compile time
- Schema validation using Prisma for database operations

**Error Types:**
- 400 Bad Request: Invalid input data, validation failures
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions for requested operation
- 404 Not Found: Requested resource doesn't exist
- 409 Conflict: Duplicate resource (e.g., email already exists)
- 500 Internal Server Error: Unexpected server errors

**Error Response Format:**
```typescript
{
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

**Frontend Error Handling:**
- Global error boundary for React component errors
- API error interceptor for consistent error display
- User-friendly error messages
- Retry logic for transient failures

**Backend Error Handling:**
- Global error middleware in Express
- Structured logging of all errors
- Database transaction rollback on failures
- Graceful degradation for non-critical features

## Development Approach

### Educational Development Methodology

This project follows an educational, incremental development approach:

**Code Explanation**: Every piece of code will be explained - what it does, why it's written that way, and what best practices it follows.

**Concept Introduction**: New technologies, libraries, and patterns will be introduced with explanations before use.

**Incremental Progress**: Development happens in small, functional chunks with testing at natural checkpoints.

**Test-Driven Verification**: After each functional milestone, we run tests to verify everything works before proceeding.

**Progress Documentation**: A progress log will track what's been built, what's been tested, and what's next.

**Learning from Failures**: When tests fail or issues arise, we'll use them as learning opportunities to understand debugging and problem-solving.

### Development Workflow

1. **Explain** - Introduce the concept/feature we're building
2. **Implement** - Write code with inline explanations
3. **Test** - Write and run tests at functional checkpoints
4. **Verify** - Ensure tests pass and functionality works
5. **Document** - Update progress log
6. **Repeat** - Move to next functional chunk

## Testing Strategy

The Marketplace Platform employs a dual testing approach combining unit tests and property-based tests to ensure comprehensive coverage and correctness.

### Property-Based Testing

**Framework:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:**
- Each property-based test will run a minimum of 100 iterations
- Tests will use custom generators for domain objects (users, listings, messages, etc.)
- Each test will be tagged with a comment referencing the specific correctness property from this design document
- Tag format: `// Feature: marketplace-platform, Property {number}: {property_text}`

**Property Test Coverage:**
- Authentication and authorization properties
- Data persistence and retrieval properties
- Search and filtering correctness
- Business logic invariants (e.g., timestamp preservation, rating calculations)
- State transitions (e.g., listing status changes)

**Custom Generators:**
- User generator: Creates valid user objects with random but valid emails, usernames, passwords
- Listing generator: Creates listings with valid titles, descriptions, prices, categories
- Message generator: Creates messages between valid users
- Rating generator: Creates ratings within valid range (1-5)
- Search query generator: Creates realistic search queries and filter combinations

### Unit Testing

**Framework:** Jest for both frontend and backend

**Unit Test Coverage:**
- API endpoint handlers
- Service layer business logic
- Database repository operations
- Authentication middleware
- Input validation functions
- Utility functions (e.g., password hashing, image processing)
- React component rendering and interactions
- Frontend state management

**Test Organization:**
- Backend tests: Co-located with source files using `.test.ts` suffix
- Frontend tests: Co-located with components using `.test.tsx` suffix
- Integration tests: Separate `__tests__` directory

**Mocking Strategy:**
- Database mocked for unit tests, real database for integration tests
- External services (email, cloud storage) mocked in tests
- Authentication bypassed in component tests using mock contexts

### Integration Testing

- End-to-end API tests using supertest
- Database integration tests with test database
- Frontend integration tests using React Testing Library
- Critical user flows tested end-to-end

### Test Execution

- Unit tests run on every commit
- Property-based tests run on every commit
- Integration tests run on pull requests
- All tests must pass before merging

The combination of unit tests (for specific examples and edge cases) and property-based tests (for universal correctness properties) provides comprehensive coverage: unit tests catch concrete bugs in specific scenarios, while property tests verify that general correctness properties hold across all possible inputs.

## Security Considerations

**Authentication (MVP):**
- JWT tokens with expiration (15 min access, 7 day refresh)
- Secure password hashing using bcrypt (cost factor 12)
- Email verification required before full account access
- Password reset tokens with expiration (1 hour)
- Rate limiting on authentication endpoints (5 attempts per 15 minutes)
- Account lockout after repeated failed attempts

**Advanced Authentication (Post-MVP):**
- Multi-Factor Authentication (MFA) using TOTP (Time-based One-Time Password)
  - QR code generation for authenticator apps (Google Authenticator, Authy)
  - Backup codes for account recovery
  - Optional enforcement for high-value accounts
- FIDO2/WebAuthn for passwordless authentication
  - Support for hardware security keys (YubiKey, etc.)
  - Platform authenticators (Windows Hello, Touch ID, Face ID)
  - Resident keys for usernameless authentication
  - Attestation verification for trusted devices
- Biometric authentication on mobile devices
  - Integration with device biometric APIs
  - Fallback to password/PIN if biometric fails
  - Secure enclave storage for credentials

**Authorization:**
- Middleware to verify user ownership of resources
- Users can only edit/delete their own listings and profile
- Message access restricted to sender and receiver
- Role-based access control (user, moderator, admin) for future expansion

**Data Protection:**
- SQL injection prevention via Prisma parameterized queries
- XSS prevention via React's built-in escaping and Content Security Policy
- CSRF protection using SameSite cookies and tokens
- HTTPS enforcement in production (HSTS headers)
- Secure headers (helmet.js): X-Frame-Options, X-Content-Type-Options, etc.
- Input sanitization and validation on all endpoints
- Output encoding for user-generated content

**File Upload Security:**
- File type validation (images only: JPEG, PNG, WebP)
- File size limits (5MB per image, 50MB total per listing)
- Image re-encoding to strip EXIF data and potential exploits
- Virus scanning (ClamAV integration for production)
- Separate storage domain to prevent XSS
- Signed URLs for temporary access

**Privacy:**
- Email addresses not publicly visible
- User location stored as general area, not exact coordinates
- Personal data encrypted at rest (database-level encryption)
- Minimal data collection (GDPR compliant)
- User data export and deletion capabilities
- No third-party tracking or analytics without consent
- Secure session management with httpOnly, secure cookies

**API Security:**
- Rate limiting per endpoint and per user
- Request size limits to prevent DoS
- API versioning for backward compatibility
- Audit logging for sensitive operations
- IP-based blocking for suspicious activity

## Performance Considerations

**Database Optimization:**
- Indexes on frequently queried fields (email, username, listing status, category)
- Pagination for all list endpoints
- Database connection pooling
- Query optimization using Prisma

**Caching Strategy:**
- Redis for session storage (optional for MVP)
- Browser caching for static assets
- API response caching for public data (categories, featured listings)

**Image Optimization:**
- Automatic image compression on upload
- Multiple image sizes (thumbnail, medium, full)
- Lazy loading for images
- CDN for image delivery

**Frontend Performance:**
- Code splitting by route
- Lazy loading of components
- React Query for data caching and deduplication
- Debouncing for search input
- Virtual scrolling for long lists

## Deployment Architecture

**Development Environment:**
- Local PostgreSQL database
- Local file storage for images
- Environment variables for configuration

**Production Environment:**
- Managed PostgreSQL (e.g., AWS RDS, Heroku Postgres)
- Cloud storage for images (AWS S3, Cloudinary)
- Environment-based configuration
- Automated deployments via CI/CD
- Health check endpoints
- Logging and monitoring (e.g., Sentry for errors)

## MVP vs Post-MVP Features

### MVP (Phase 1) - Core Marketplace Functionality
**Goal:** Launch a functional marketplace where users can list and discover items/services

**Included:**
- Basic user registration with email/password
- Email verification
- User profiles with basic information
- Create, edit, delete listings (items and services)
- Browse and search listings
- Basic filtering (category, price, location, listing type)
- Simple messaging between users
- Image upload (up to 10 per listing)
- Responsive design with CSS variables
- Basic security (password hashing, JWT, rate limiting)

**Excluded from MVP:**
- Multi-factor authentication (MFA)
- FIDO2/WebAuthn passwordless authentication
- Biometric authentication
- Rating and review system
- Favorites/saved listings
- Advanced image optimization
- Real-time messaging
- Payment integration

### Post-MVP (Phase 2) - Enhanced Security & Trust
**Goal:** Add advanced authentication and build trust through ratings

**Features:**
- Multi-factor authentication (TOTP)
- FIDO2/WebAuthn support for security keys
- Biometric authentication for mobile devices
- User rating and review system
- Favorites/saved listings
- Enhanced image optimization (multiple sizes, WebP)
- Email notifications for messages and activity

### Future Enhancements (Phase 3+)
**Goal:** Scale and add advanced features

**Potential features:**
- Real-time messaging using WebSockets
- Advanced search with Elasticsearch
- Payment integration (Stripe, PayPal) with escrow
- Shipping integration
- Mobile applications (React Native)
- Admin dashboard for moderation
- Analytics and reporting
- Social media integration
- Multi-language support
- Dispute resolution system
- Verified seller badges
