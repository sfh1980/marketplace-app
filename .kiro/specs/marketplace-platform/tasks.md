# Implementation Plan: Marketplace Platform MVP

## Overview
This implementation plan breaks down the MVP into small, educational chunks. Each task includes explanations, and we'll test at natural checkpoints to ensure everything works before moving forward.

---

## Phase 1: Project Foundation

- [x] 1. Set up project structure and development environment
  - Initialize Node.js backend with TypeScript
  - Initialize React frontend with TypeScript
  - Configure build tools (Vite for frontend, ts-node for backend)
  - Set up ESLint and Prettier for code quality
  - Create folder structure following best practices
  - **Educational focus**: Explain project structure, TypeScript benefits, build tools
  - _Requirements: Foundation for all features_

- [x] 2. Set up PostgreSQL database and Prisma ORM
  - Install and configure PostgreSQL locally
  - Initialize Prisma with PostgreSQL connection
  - Explain ORM benefits and Prisma's approach
  - _Requirements: 10.1_

- [x] 3. Define database schema for MVP
  - Create Prisma schema for User model
  - Create Prisma schema for Listing model (with item/service support)
  - Create Prisma schema for Message model
  - Create Prisma schema for Category model
  - Run initial migration
  - **Educational focus**: Explain relational database design, foreign keys, indexes
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 8.1_

- [x] 3.1 Write property test for database schema
  - **Property 29: Data changes persist immediately**
  - **Validates: Requirements 10.1**

- [x] 4. Checkpoint: Verify database setup
  - Ensure all tests pass, ask the user if questions arise
  - Verify database connection works
  - Verify tables are created correctly
  - **Educational focus**: How to inspect database, use Prisma Studio

- [x] 4.1 Push to GitHub
  - Initialize git repository if not already done
  - Create .gitignore file (node_modules, .env, etc.)
  - Commit project foundation and database setup
  - Push to GitHub repository
  - **Educational focus**: Explain git workflow, .gitignore importance, commit messages

---

## Phase 2: Authentication & User Management (Backend)

- [x] 5. Implement user registration endpoint
  - Create user registration controller
  - Implement password hashing with bcrypt
  - Add input validation (email format, password strength)
  - Generate email verification token
  - **Educational focus**: Explain password hashing, why bcrypt, validation importance
  - _Requirements: 1.1, 1.2, 10.2_

- [x] 5.1 Write property test for user registration
  - **Property 1: Valid registration creates unique user accounts**
  - **Validates: Requirements 1.1**

- [x] 5.2 Write property test for duplicate email rejection
  - **Property 2: Duplicate email registration is rejected**
  - **Validates: Requirements 1.2**

- [x] 5.3 Write property test for password hashing
  - **Property 30: Passwords are hashed before storage**
  - **Validates: Requirements 10.2**

- [x] 6. Implement email verification
  - Create email verification endpoint
  - Set up Nodemailer for sending emails
  - Generate and validate verification tokens
  - **Educational focus**: Explain email verification importance, token security
  - _Requirements: 1.1_

- [x] 7. Implement user login endpoint
  - Create login controller
  - Implement JWT token generation
  - Add password verification
  - Add rate limiting for security
  - **Educational focus**: Explain JWT, stateless authentication, rate limiting
  - _Requirements: 1.3, 1.4_

- [x] 7.1 Write property test for valid login
  - **Property 3: Valid credentials authenticate successfully**
  - **Validates: Requirements 1.3**

- [x] 7.2 Write property test for invalid login rejection
  - **Property 4: Invalid credentials are rejected**
  - **Validates: Requirements 1.4**

- [x] 8. Implement authentication middleware
  - Create JWT verification middleware
  - Add protected route decorator
  - Handle token expiration
  - **Educational focus**: Explain middleware pattern, request pipeline
  - _Requirements: 1.3_

- [x] 9. Implement password reset flow
  - Create password reset request endpoint
  - Create password reset completion endpoint
  - Generate secure reset tokens
  - **Educational focus**: Explain secure token generation, time-based expiration
  - _Requirements: 1.5_

- [x] 10. Checkpoint: Test authentication flow
  - Ensure all tests pass, ask the user if questions arise
  - Test registration → email verification → login flow
  - Test password reset flow
  - Verify JWT tokens work correctly
  - **Educational focus**: How to test APIs with Postman/curl

- [x] 10.1 Push to GitHub
  - Commit authentication implementation
  - Update PROGRESS.md with authentication milestone
  - Push to GitHub
  - **Educational focus**: Explain meaningful commit messages, progress documentation

---

## Phase 3: User Profile Management (Backend)

- [x] 11. Implement get user profile endpoint
  - Create profile retrieval controller
  - Include user's listings in response
  - **Educational focus**: Explain REST API design, resource relationships
  - _Requirements: 2.3_

- [x] 11.1 Write property test for profile view
  - **Property 6: Profile view contains required information**
  - **Validates: Requirements 2.3**

- [x] 12. Implement update user profile endpoint
  - Create profile update controller
  - Validate profile data
  - Handle partial updates
  - **Educational focus**: Explain PUT vs PATCH, data validation
  - _Requirements: 2.1, 2.4_

- [x] 12.1 Write property test for profile updates
  - **Property 5: Profile updates persist correctly**
  - **Validates: Requirements 2.1, 2.2, 2.4**

- [x] 13. Implement profile picture upload
  - Set up Multer for file uploads
  - Add image validation (type, size)
  - Store images to local filesystem (MVP) or cloud storage
  - **Educational focus**: Explain file uploads, multipart/form-data, image validation
  - _Requirements: 2.2_

- [x] 14. Checkpoint: Test user profile management
  - Ensure all tests pass, ask the user if questions arise
  - Test profile retrieval, updates, and image upload
  - Verify authentication is required for updates

- [x] 14.1 Push to GitHub
  - Commit user profile management
  - Update PROGRESS.md
  - Push to GitHub

---

## Phase 4: Listing Management (Backend)

- [x] 15. Implement create listing endpoint
  - Create listing creation controller
  - Support both item and service listing types
  - Handle pricing type for services (hourly/fixed)
  - Validate required fields
  - **Educational focus**: Explain polymorphic data models, validation strategies
  - _Requirements: 3.1, 3.2_

- [x] 15.1 Write property test for listing creation
  - **Property 7: Valid listing creation succeeds**
  - **Validates: Requirements 3.1**

- [x] 15.2 Write property test for service pricing
  - **Property 7a: Service listings store pricing type correctly**
  - **Validates: Requirements 3.2**

- [x] 15.3 Write property test for category requirement
  - **Property 22: Listings require valid categories**
  - **Validates: Requirements 8.1**

- [x] 16. Implement get listing endpoint





  - Create listing retrieval controller (GET /api/listings/:id)
  - Include seller information in response
  - **Educational focus**: Explain eager loading, N+1 query problem
  - _Requirements: 5.1, 5.2_

- [x] 16.1 Write property test for listing details


  - **Property 14: Listing details include all required information**
  - **Validates: Requirements 5.1, 5.2**

- [x] 17. Implement get all listings endpoint





  - Create endpoint to retrieve all listings (GET /api/listings)
  - Add pagination support (limit, offset)
  - Return listings with seller information
  - **Educational focus**: Explain pagination, query parameters
  - _Requirements: 4.1_

- [x] 18. Implement update listing endpoint





  - Create listing update controller (PUT /api/listings/:id)
  - Verify user owns the listing (authorization)
  - Preserve creation timestamp
  - **Educational focus**: Explain authorization vs authentication, immutable fields
  - _Requirements: 3.4_

- [x] 18.1 Write property test for timestamp preservation


  - **Property 9: Listing edits preserve creation timestamp**
  - **Validates: Requirements 3.4**

- [x] 19. Implement listing status updates





  - Add endpoint to mark listing as sold/completed (PATCH /api/listings/:id/status)
  - Update listing status field
  - **Educational focus**: Explain state management, status transitions
  - _Requirements: 3.5_

- [x] 19.1 Write property test for sold listing exclusion


  - **Property 10: Sold listings are excluded from active searches**
  - **Validates: Requirements 3.5**

- [x] 20. Implement delete listing endpoint





  - Create listing deletion controller (DELETE /api/listings/:id)
  - Verify user owns the listing
  - Permanently remove listing
  - **Educational focus**: Explain soft delete vs hard delete
  - _Requirements: 3.6_

- [x] 20.1 Write property test for listing deletion


  - **Property 11: Deleted listings are permanently removed**
  - **Validates: Requirements 3.6**

- [x] 21. Checkpoint: Test listing management




  - Ensure all tests pass, ask the user if questions arise
  - Test create, read, update, delete operations
  - Test both item and service listings
  - Verify authorization works correctly

- [x] 21.1 Push to GitHub


  - Commit listing management implementation
  - Update PROGRESS.md with listing features
  - Push to GitHub
  - **Educational focus**: Explain feature branches vs main branch

---

## Phase 5: Search & Browse (Backend)

- [x] 22. Create initial categories





  - Create seed script to populate categories table
  - Add common marketplace categories (Electronics, Furniture, Services, etc.)
  - **Educational focus**: Explain database seeding, initial data
  - _Requirements: 8.1_

- [x] 23. Implement basic listing search endpoint





  - Create search controller with query parameter (GET /api/search)
  - Search in title and description
  - Return paginated results
  - **Educational focus**: Explain full-text search, pagination, SQL LIKE vs full-text indexes
  - _Requirements: 4.2_

- [x] 23.1 Write property test for search matching


  - **Property 12: Search returns matching listings**
  - **Validates: Requirements 4.2**

- [x] 24. Implement search filters





  - Add category filter to search endpoint
  - Add listing type filter (item/service)
  - Add price range filter
  - Add location filter
  - Combine filters with AND logic
  - **Educational focus**: Explain query building, filter composition
  - _Requirements: 4.3, 4.4, 4.5, 4.6_

- [x] 24.1 Write property test for filtering


  - **Property 13: Filters return only matching results**
  - **Validates: Requirements 4.3, 4.4, 4.5, 4.6**

- [x] 25. Implement category endpoints





  - Create get all categories endpoint (GET /api/categories)
  - Include listing counts per category
  - **Educational focus**: Explain aggregation queries, GROUP BY
  - _Requirements: 8.2, 8.3_

- [x] 25.1 Write property test for category browsing


  - **Property 23: Category browsing returns correct listings**
  - **Validates: Requirements 8.2**

- [x] 25.2 Write property test for category counts

  - **Property 24: Category counts are accurate**
  - **Validates: Requirements 8.3**

- [x] 26. Checkpoint: Test search and browse functionality






  - Ensure all tests pass, ask the user if questions arise
  - Test search with various queries
  - Test all filter combinations
  - Test category browsing
  - Verify pagination works

- [x] 26.1 Push to GitHub



  - Commit search and browse functionality
  - Update PROGRESS.md
  - Push to GitHub

---

## Phase 6: Messaging (Backend)

- [x] 27. Implement send message endpoint





  - Create message sending controller (POST /api/messages)
  - Associate message with listing (optional)
  - Store sender, receiver, content, timestamp
  - **Educational focus**: Explain message threading, conversation design
  - _Requirements: 6.1, 6.4_

- [x] 27.1 Write property test for message delivery


  - **Property 16: Messages are delivered and associated correctly**
  - **Validates: Requirements 6.1, 6.2, 6.4**

- [x] 28. Implement get conversations endpoint





  - Create inbox controller (GET /api/messages)
  - Group messages by conversation
  - Include unread count
  - **Educational focus**: Explain conversation grouping, aggregation
  - _Requirements: 6.3_

- [x] 28.1 Write property test for inbox organization


  - **Property 17: Inbox organizes conversations correctly**
  - **Validates: Requirements 6.3**

- [x] 29. Implement get conversation messages endpoint





  - Retrieve all messages in a conversation (GET /api/messages/:conversationId)
  - Mark messages as read
  - **Educational focus**: Explain read receipts, message status
  - _Requirements: 6.2_

- [x] 30. Checkpoint: Test messaging functionality




  - Ensure all tests pass, ask the user if questions arise
  - Test sending messages
  - Test retrieving conversations
  - Test message threading

- [x] 30.1 Push to GitHub


  - **Update all documentation** (README.md, PROGRESS.md, CURRENT-STATUS.md)
    - Count completed tasks in tasks.md
    - Update progress counters (X of 80 tasks, Y%)
    - Update current task and phase
    - Add completed tasks to lists
  - Commit messaging implementation
  - Update PROGRESS.md - Backend MVP complete!
  - Push to GitHub
  - **Educational focus**: Celebrate milestone - backend is done!

---

## Phase 7: Frontend Foundation

- [x] 31. Set up React project structure





  - Initialize Vite + React + TypeScript
  - Create folder structure (components, pages, hooks, utils, styles)
  - Set up React Router
  - **Educational focus**: Explain React project structure, component organization
  - _Requirements: Foundation for frontend_

- [x] 32. Create CSS Variables design system





  - Create variables.css with color palette
  - Define spacing scale
  - Define typography system
  - Define border radius and shadows
  - Create reset.css and base.css
  - **Educational focus**: Explain CSS custom properties, design systems, consistency
  - _Requirements: All UI requirements_

- [x] 33. Create reusable UI components





  - Create Button component with CSS Module
  - Create Input component with validation states
  - Create Card component
  - Create Modal component
  - **Educational focus**: Explain component reusability, CSS Modules, BEM naming
  - _Requirements: All UI requirements_

- [x] 34. Set up API client and React Query





  - Create Axios instance with base configuration
  - Set up React Query provider
  - Create API service functions
  - **Educational focus**: Explain API abstraction, React Query benefits, caching
  - _Requirements: All API interactions_

- [x] 35. Checkpoint: Verify frontend foundation




  - Ensure all tests pass, ask the user if questions arise
  - Verify React app runs
  - Verify CSS variables work
  - Verify components render correctly

- [x] 35.1 Push to GitHub


  - **Update all documentation** (README.md, PROGRESS.md, CURRENT-STATUS.md)
    - Count completed tasks and update progress counters
    - Update current task and phase
  - Commit frontend foundation
  - Update PROGRESS.md
  - Push to GitHub

---

## Phase 8: Authentication UI

- [x] 36. Create authentication context
  - Create AuthContext for global auth state
  - Implement login, logout, register functions
  - Store JWT in localStorage
  - **Educational focus**: Explain React Context, global state, token storage
  - _Requirements: 1.1, 1.3_

- [x] 37. Create registration page
  - Build registration form with validation
  - Handle form submission
  - Display success/error messages
  - **Educational focus**: Explain form handling, validation, error states
  - _Requirements: 1.1, 1.2_

- [x] 38. Create login page
  - Build login form
  - Handle authentication
  - Redirect on success
  - **Educational focus**: Explain protected routes, redirects
  - _Requirements: 1.3, 1.4_

- [x] 39. Create email verification page
  - Handle verification token from URL
  - Display verification status
  - **Educational focus**: Explain URL parameters, token handling
  - _Requirements: 1.1_

- [x] 40. Create password reset flow
  - Create password reset request page
  - Create password reset completion page
  - **Educational focus**: Explain multi-step flows
  - _Requirements: 1.5_

- [x] 41. Create protected route component
  - Implement route guard
  - Redirect unauthenticated users
  - **Educational focus**: Explain route protection, HOCs
  - _Requirements: 1.3_

- [x] 42. Checkpoint: Test authentication UI





  - Ensure all tests pass, ask the user if questions arise
  - Test registration flow end-to-end
  - Test login flow
  - Test protected routes
  - Test password reset

- [x] 42.1 Push to GitHub


  - **Update all documentation** (README.md, PROGRESS.md, CURRENT-STATUS.md)
    - Count completed tasks and update progress counters
    - Update current task and phase
  - Commit authentication UI
  - Update PROGRESS.md
  - Push to GitHub

---

## Phase 9: User Profile UI

- [x] 43. Create user profile page





  - Display user information
  - Display user's listings
  - **Educational focus**: Explain data fetching, loading states
  - _Requirements: 2.3_

- [x] 44. Create profile edit page




  - Build profile edit form
  - Handle profile updates
  - Handle profile picture upload
  - **Educational focus**: Explain file uploads in React, preview images
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 45. Checkpoint: Test profile UI





  - Ensure all tests pass, ask the user if questions arise
  - Test viewing profile
  - Test editing profile
  - Test uploading profile picture

- [x] 45.1 Push to GitHub


  - **Update all documentation** (README.md, PROGRESS.md, CURRENT-STATUS.md)
    - Count completed tasks and update progress counters
    - Update current task and phase
  - Commit profile UI
  - Update PROGRESS.md
  - Push to GitHub

---

## Phase 10: Listing Management UI

- [x] 46. Create listing card component




  - Display listing preview
  - Show image, title, price, location
  - Handle item vs service display
  - **Educational focus**: Explain component props, conditional rendering
  - _Requirements: 3.1, 4.1_

- [x] 47. Create listing creation page




  - Build listing form with all fields
  - Support item and service types
  - Handle image uploads (up to 10)
  - **Educational focus**: Explain dynamic forms, multiple file uploads
  - _Requirements: 3.1, 3.2, 3.3_
-

- [x] 48. Create listing detail page



  - Display full listing information
  - Show image gallery
  - Display seller information
  - Show contact button
  - **Educational focus**: Explain image galleries, related data
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 49. Create listing edit page



  - Pre-fill form with existing data
  - Handle updates
  - **Educational focus**: Explain form initialization, PATCH requests
  - _Requirements: 3.4_
-

- [x] 50. Create my listings page



  - Display user's own listings
  - Add edit/delete buttons
  - Add mark as sold button
  - **Educational focus**: Explain list management, action buttons
  - _Requirements: 3.4, 3.5, 3.6_

- [x] 51. Checkpoint: Test listing UI





  - Ensure all tests pass, ask the user if questions arise
  - Test creating listings (items and services)
  - Test viewing listing details
  - Test editing and deleting listings
  - Test marking as sold

- [x] 51.1 Push to GitHub


  - **Update all documentation** (README.md, PROGRESS.md, CURRENT-STATUS.md)
    - Count completed tasks and update progress counters
    - Update current task and phase
  - Commit listing UI
  - Update PROGRESS.md
  - Push to GitHub

---

## Phase 11: Search & Browse UI

- [x] 52. Create homepage




  - Display featured/recent listings
  - Add search bar
  - Add category links
  - **Educational focus**: Explain homepage design, call-to-action placement
  - _Requirements: 4.1_
-

- [x] 53. Create search page




  - Display search results
  - Show listing cards in grid
  - Add pagination
  - **Educational focus**: Explain grid layouts, pagination UI
  - _Requirements: 4.2_
-

- [x] 54. Create filter panel component



  - Add category filter
  - Add listing type filter
  - Add price range filter
  - Add location filter
  - **Educational focus**: Explain filter UI patterns, form state management
  - _Requirements: 4.3, 4.4, 4.5, 4.6_
-

- [x] 55. Create category browse page



  - Display listings by category
  - Show category information
  - **Educational focus**: Explain category navigation
  - _Requirements: 8.2, 8.4_

- [x] 56. Checkpoint: Test search and browse UI





  - Ensure all tests pass, ask the user if questions arise
  - Test homepage displays correctly
  - Test search functionality
  - Test all filters
  - Test category browsing
  - Test pagination

- [x] 56.1 Push to GitHub







  - **Update all documentation** (README.md, PROGRESS.md, CURRENT-STATUS.md)
    - Count completed tasks and update progress counters
    - Update current task and phase
  - Commit search and browse UI
  - Update PROGRESS.md
  - Push to GitHub

---

## Phase 12: Messaging UI

- [x] 57. Create messages inbox page





  - Display list of conversations
  - Show preview of last message
  - Show unread indicators
  - **Educational focus**: Explain inbox UI patterns, unread badges
  - _Requirements: 6.3_

- [x] 58. Create conversation page




  - Display message thread
  - Show message history
  - Add send message form
  - **Educational focus**: Explain chat UI, message threading
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 59. Add contact seller button to listings





  - Add button to listing detail page
  - Open conversation or create new one
  - **Educational focus**: Explain user flows, navigation
  - _Requirements: 6.1_

- [ ] 60. Checkpoint: Test messaging UI

  - Ensure all tests pass, ask the user if questions arise
  - Test viewing inbox
  - Test sending messages
  - Test message threading
  - Test contacting sellers from listings

- [-] 60.1 Push to GitHub

  - **Update all documentation** (README.md, PROGRESS.md, CURRENT-STATUS.md)
    - Count completed tasks and update progress counters
    - Update current task and phase
    - Celebrate major milestone!
  - Commit messaging UI
  - Update PROGRESS.md - All core features complete!
  - Push to GitHub
  - **Educational focus**: Major milestone - full functionality working!

---

## Phase 13: Polish & Final Testing

- [ ] 61. Add responsive design
  - Test on mobile breakpoints
  - Adjust layouts for small screens
  - Ensure touch-friendly interactions
  - **Educational focus**: Explain mobile-first design, media queries
  - _Requirements: All UI requirements_

- [ ] 62. Add loading and error states
  - Add loading spinners
  - Add error messages
  - Add empty states
  - **Educational focus**: Explain UX best practices, user feedback
  - _Requirements: All UI requirements_

- [ ] 63. Add form validation feedback
  - Show validation errors inline
  - Disable submit on invalid forms
  - **Educational focus**: Explain client-side validation, UX
  - _Requirements: All form requirements_

- [ ] 64. Implement error boundaries
  - Add React error boundaries
  - Create fallback UI
  - **Educational focus**: Explain error handling in React
  - _Requirements: All UI requirements_

- [ ] 65. Add accessibility features
  - Add ARIA labels
  - Ensure keyboard navigation
  - Test with screen readers
  - **Educational focus**: Explain web accessibility, WCAG guidelines
  - _Requirements: All UI requirements_

- [ ] 66. Final checkpoint: End-to-end testing
  - Ensure all tests pass, ask the user if questions arise
  - Test complete user journeys
  - Test edge cases
  - Verify all MVP requirements are met
  - **Educational focus**: Explain E2E testing, user acceptance testing

- [ ] 66.1 Push to GitHub
  - **Update all documentation** (README.md, PROGRESS.md, CURRENT-STATUS.md)
    - Count completed tasks and update progress counters
    - Update current task and phase
  - Commit polish and accessibility improvements
  - Update PROGRESS.md
  - Push to GitHub

---

## Phase 14: Deployment Preparation

- [ ] 67. Set up environment variables
  - Create .env.example
  - Document all required variables
  - **Educational focus**: Explain environment configuration, secrets management
  - _Requirements: 10.1_

- [ ] 68. Add production database configuration
  - Configure production database connection
  - Set up migrations for production
  - **Educational focus**: Explain dev vs production environments
  - _Requirements: 10.1_

- [ ] 69. Add security headers
  - Configure helmet.js
  - Set up CORS properly
  - **Educational focus**: Explain security headers, CORS
  - _Requirements: Security_

- [ ] 70. Create deployment documentation
  - Document deployment steps
  - Document environment setup
  - Create README with setup instructions
  - **Educational focus**: Explain documentation importance
  - _Requirements: All_

- [ ] 71. Final checkpoint: MVP complete
  - Ensure all tests pass, ask the user if questions arise
  - Verify all MVP features work
  - Review code quality
  - Celebrate completion!

- [ ] 71.1 Final push to GitHub
  - **Update all documentation** (README.md, PROGRESS.md, CURRENT-STATUS.md)
    - Mark project as 100% complete!
    - Update all progress counters to 80/80 (100%)
    - Update status to "MVP COMPLETE"
    - Add final session to PROGRESS.md
  - Commit deployment preparation
  - Update PROGRESS.md - MVP COMPLETE! 🎉
  - Create release tag (v1.0.0-mvp)
  - Push to GitHub
  - **Educational focus**: Explain semantic versioning, git tags, releases

---

## Post-MVP: Future Enhancements

These tasks are for Phase 2 and beyond:

- [ ] 72. Implement multi-factor authentication (TOTP)
  - _Requirements: 1.6_

- [ ] 73. Implement FIDO2/WebAuthn support
  - _Requirements: 1.7_

- [ ] 74. Implement biometric authentication
  - _Requirements: 1.8_

- [ ] 75. Implement rating and review system
  - _Requirements: 7.1-7.5_

- [ ] 76. Implement favorites/saved listings
  - _Requirements: 9.1-9.4_

- [ ] 77. Implement advanced image optimization
  - _Requirements: 10.3_

- [ ] 78. Implement real-time messaging with WebSockets

- [ ] 79. Implement payment integration

- [ ] 80. Build mobile applications

---

## Notes

- All tasks are required for comprehensive learning and quality assurance
- Each checkpoint ensures we test before moving forward
- Educational explanations will be provided throughout implementation
- Progress will be documented in PROGRESS.md after each significant milestone
- GitHub pushes happen at natural breakpoints to track progress
- Property-based tests will be written alongside implementation for thorough testing
