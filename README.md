# Marketplace Platform

A full-stack web application for buying and selling items and legally allowable services in a peer-to-peer marketplace. Built with security, legal compliance, and education as core principles.

## 📊 Project Status

**Current Phase:** MVP Development - Search & Browse Complete (Backend)  
**Progress:** 26 of 80 tasks complete (32.5%)  
**Last Updated:** November 26, 2024

### Completed Phases
**Phase 1: Project Foundation** ✅
- ✅ Task 1: Project structure and development environment
- ✅ Task 2: PostgreSQL database and Prisma ORM setup
- ✅ Task 3: Database schema defined and migrated (6 models)
- ✅ Task 3.1: Property-based tests (600 test cases passing)
- ✅ Task 4: Checkpoint - Database setup verified
- ✅ Task 4.1: Pushed to GitHub (first checkpoint)

**Phase 2: Authentication & User Management** ✅
- ✅ Task 5: User registration endpoint with bcrypt hashing
- ✅ Task 5.1-5.3: Property tests for registration and password hashing
- ✅ Task 6: Email verification system
- ✅ Task 7: User login with JWT authentication
- ✅ Task 7.1-7.2: Property tests for login validation
- ✅ Task 8: Authentication middleware (JWT verification)
- ✅ Task 9: Password reset flow
- ✅ Task 10: Checkpoint - Authentication flow verified
- ✅ Task 10.1: Pushed to GitHub (authentication checkpoint)

**Phase 3: User Profile Management** ✅
- ✅ Task 11: Get user profile endpoint
- ✅ Task 11.1: Property test for profile view
- ✅ Task 12: Update user profile endpoint
- ✅ Task 12.1: Property test for profile updates
- ✅ Task 13: Profile picture upload with Multer
- ✅ Task 14: Checkpoint - Test user profile management

**Phase 4: Listing Management (Backend)** ✅
- ✅ Task 15: Create listing endpoint (items and services)
- ✅ Task 15.1-15.3: Property tests for listing creation
- ✅ Task 16: Get listing endpoint with seller information
- ✅ Task 16.1: Property test for listing details
- ✅ Task 17: Get all listings endpoint with pagination
- ✅ Task 18: Update listing endpoint with authorization
- ✅ Task 18.1: Property test for timestamp preservation
- ✅ Task 19: Listing status updates (sold/completed/active)
- ✅ Task 19.1: Property test for sold listing exclusion
- ✅ Task 20: Delete listing endpoint
- ✅ Task 20.1: Property test for listing deletion
- ✅ Task 21: Checkpoint - All listing management tests passing (48/48 tests)
- ✅ Task 21.1: Pushed to GitHub (fourth checkpoint)

**Phase 5: Search & Browse (Backend)** ✅
- ✅ Task 22: Create initial categories with seed script
- ✅ Task 23: Basic listing search endpoint (text search)
- ✅ Task 23.1: Property test for search matching
- ✅ Task 24: Search filters (category, type, price, location)
- ✅ Task 24.1: Property test for filtering
- ✅ Task 25: Category endpoints with listing counts
- ✅ Task 25.1: Property test for category browsing
- ✅ Task 25.2: Property test for category counts
- ✅ Task 26: Checkpoint - All search and browse tests passing (41/41 tests)

### Next Steps
- 🔄 Task 26.1: Push to GitHub (fifth checkpoint)
- ⏳ Task 27: Implement send message endpoint
- ⏳ Task 28: Implement get conversations endpoint

## 🎯 Key Features

### MVP (Current Focus)
- ✅ User authentication (email verification, JWT)
- ✅ User profiles with profile pictures
- ✅ File upload system (Multer with validation)
- ✅ Listings for items AND services (full CRUD operations)
- ✅ Listing status management (active/sold/completed)
- ✅ Authorization checks (users can only modify their own listings)
- ✅ Search and filtering (text search, category, type, price, location)
- ✅ Category browsing with accurate listing counts
- ⏳ User-to-user messaging
- ⏳ Bot prevention and content moderation
- ⏳ Legal compliance (GDPR, CCPA)

### Post-MVP
- Multi-factor authentication (TOTP, FIDO2, biometrics)
- Payment integration with escrow
- Seller portfolios (services only)
- Real-time messaging
- Mobile applications

## 🏗️ Project Structure

```
marketplace-platform/
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Database access
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Helper functions
│   │   ├── types/          # TypeScript types
│   │   └── __tests__/      # Tests
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Database migrations
│   └── package.json
│
└── frontend/         # React + Vite + TypeScript SPA
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Page components
    │   ├── hooks/          # Custom React hooks
    │   ├── services/       # API client
    │   ├── context/        # React Context
    │   ├── styles/         # CSS Variables design system
    │   ├── App.tsx         # Root component
    │   └── main.tsx        # Entry point
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Git

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sfh1980/marketplace-app.git
   cd marketplace-app
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your PostgreSQL credentials
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```
   Backend runs on `http://localhost:5000`

3. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

For detailed setup instructions, see [Backend Development Guide](backend/DEVELOPMENT_GUIDE.md).

## 🛠️ Technology Stack

### Backend
- **Node.js + Express.js** - REST API framework
- **TypeScript** - Type safety
- **PostgreSQL** - Relational database
- **Prisma ORM** - Type-safe database access
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email verification
- **Jest + fast-check** - Unit and property-based testing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Axios** - HTTP client
- **CSS Variables** - Custom properties for theming

### Development Tools
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Prisma Studio** - Visual database browser
- **ts-node-dev** - Hot reload for backend

## 📝 Available Scripts

### Backend
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Run production build
npm test         # Run tests
npm run lint     # Check code quality
npm run format   # Format code
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run tests
npm run lint     # Check code quality
npm run format   # Format code
```

### Database
```bash
npx prisma studio              # Open visual database browser
npx prisma migrate dev         # Create and apply migration
npx prisma generate            # Generate Prisma Client
npx ts-node src/utils/verifyDatabase.ts  # Verify database setup
```

## ✨ Feature Highlights

### Listing Management (Items & Services)
Complete CRUD operations for marketplace listings with full support for both physical items and services:

**Listing Types:**
- **Items**: Physical goods with fixed pricing
- **Services**: Professional services with hourly or fixed pricing

**Features:**
- ✅ Create listings with title, description, price, category, images
- ✅ Retrieve individual listings with seller information
- ✅ Browse all active listings with pagination
- ✅ Update listings (owner only) while preserving creation timestamp
- ✅ Mark listings as sold/completed/active
- ✅ Delete listings permanently (owner only)
- ✅ Authorization checks ensure users can only modify their own listings
- ✅ Sold listings automatically excluded from active searches

**Validation:**
- Required fields: title, description, price, category, listingType
- Price must be positive
- Category must be valid
- Images: 1-10 images required
- Service listings must specify pricing type (hourly/fixed)
- Item listings cannot have pricing type

**Example Usage:**
```bash
# Create a listing
curl -X POST http://localhost:5000/api/listings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Vintage Camera",
    "description": "Classic 35mm film camera in excellent condition",
    "price": 150.00,
    "category": "Electronics",
    "listingType": "item",
    "location": "San Francisco, CA",
    "images": ["image1.jpg", "image2.jpg"]
  }'

# Get all listings with pagination
curl http://localhost:5000/api/listings?limit=20&offset=0

# Update listing status to sold
curl -X PATCH http://localhost:5000/api/listings/LISTING_ID/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "sold"}'
```

**Property-Based Tests:**
- Property 7: Valid listing creation succeeds (all valid inputs create listings)
- Property 7a: Service listings store pricing type correctly
- Property 9: Listing edits preserve creation timestamp
- Property 10: Sold listings excluded from active searches
- Property 11: Deleted listings permanently removed
- Property 14: Listing details include all required information
- Property 22: Listings require valid categories

**Test Coverage: 48 tests passing** ✅

### Search & Browse
Comprehensive search and filtering system for discovering listings:

**Search Features:**
- ✅ Text search in titles and descriptions (case-insensitive)
- ✅ Filter by category
- ✅ Filter by listing type (items vs services)
- ✅ Filter by price range (min/max)
- ✅ Filter by location (partial match)
- ✅ Combine multiple filters with AND logic
- ✅ Pagination support for all search results
- ✅ Only returns active listings (sold/deleted excluded)

**Category Browsing:**
- ✅ Browse listings by category
- ✅ Accurate listing counts per category
- ✅ Category information included in results
- ✅ Pagination support for category browsing

**Example Usage:**
```bash
# Search for "laptop" with filters
curl "http://localhost:5000/api/search?query=laptop&categoryId=CATEGORY_ID&minPrice=500&maxPrice=2000&listingType=item&limit=20&offset=0"

# Browse by category
curl "http://localhost:5000/api/categories/CATEGORY_ID/listings?limit=20&offset=0"

# Get all categories with listing counts
curl "http://localhost:5000/api/categories"
```

**Property-Based Tests:**
- Property 12: Search returns matching listings (case-insensitive, title/description)
- Property 13: Filters return only matching results (AND logic)
- Property 23: Category browsing returns correct listings
- Property 24: Category counts are accurate

**Test Coverage: 41 tests passing** ✅
- 8 search tests
- 10 filter tests
- 13 category browsing tests
- 10 pagination tests

### Profile Picture Upload
Users can upload profile pictures with comprehensive validation and security:

- **File Types**: JPEG, PNG, GIF, WebP
- **Max Size**: 5MB per image
- **Security**: Authentication required, users can only upload to own profile
- **Validation**: MIME type checking, file size limits
- **Storage**: Local filesystem (MVP), cloud storage ready (post-MVP)
- **Auto-cleanup**: Old pictures automatically deleted

**Example Usage:**
```bash
curl -X POST http://localhost:5000/api/users/USER_ID/avatar \
  -H "Authorization: Bearer TOKEN" \
  -F "profilePicture=@image.jpg"
```

See [Frontend Integration Examples](backend/FRONTEND_INTEGRATION_EXAMPLES.md) for React/JavaScript code.

## 🧪 Testing

This project uses a comprehensive testing approach:

- **Unit Tests** - Specific functionality and edge cases
- **Property-Based Tests** - Universal properties across all inputs
- **Integration Tests** - End-to-end workflows

Run tests:
```bash
cd backend
npm test
```

**Current Test Results:**
- **Test Suites:** 20 passed (20 total)
- **Tests:** 164 passed (164 total)
- **Success Rate:** 100% ✅
- **Coverage:** Authentication, profile management, listing management (CRUD), search & filtering, category browsing, database persistence, file uploads

All tests passing including:
- 48 listing management tests
- 41 search and browse tests (8 search + 10 filters + 13 category browsing + 10 pagination)

## 📚 Documentation

### Specification Documents
- [Requirements](.kiro/specs/marketplace-platform/requirements.md) - 15 requirements with 80+ acceptance criteria
- [Design](.kiro/specs/marketplace-platform/design.md) - Complete technical design with 32+ correctness properties
- [Tasks](.kiro/specs/marketplace-platform/tasks.md) - 80+ implementation tasks
- [Feature Roadmap](.kiro/specs/marketplace-platform/feature-roadmap.md) - MVP through Phase 3

### Development Guides
- [Backend Development Guide](backend/DEVELOPMENT_GUIDE.md) - Database setup, Prisma Studio, quick reference
- [Progress Log](PROGRESS.md) - Detailed development history and learning log
- [Profile Picture Upload Summary](backend/PROFILE_PICTURE_UPLOAD_SUMMARY.md) - File upload implementation details
- [Upload Flow Diagram](backend/UPLOAD_FLOW_DIAGRAM.md) - Visual flow diagrams for file uploads
- [Frontend Integration Examples](backend/FRONTEND_INTEGRATION_EXAMPLES.md) - React/JavaScript upload examples

### Additional Resources
- [Legal Compliance Checklist](.kiro/specs/marketplace-platform/legal-compliance-checklist.md)
- [Marketing Strategy](.kiro/specs/marketplace-platform/marketing-strategy.md)
- [Research Summary](.kiro/specs/marketplace-platform/RESEARCH-SUMMARY.md)

## 🔒 Security & Compliance

### Security Features
- Bot prevention (CAPTCHA, honeypots, rate limiting, device fingerprinting)
- Content moderation system
- Email and phone verification
- Password hashing with bcrypt
- JWT authentication
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS and CSRF protection

### Legal Compliance
- GDPR compliance (data privacy, right to deletion)
- CCPA compliance (California privacy)
- Terms of Service and Privacy Policy
- Acceptable Use Policy
- Prohibited content enforcement
- DMCA takedown process

## 🎓 Educational Approach

This project is built with education as a primary goal. Every implementation includes:

- **Explanations** - What we're building and why
- **Concepts** - New technologies and patterns explained
- **Best Practices** - Industry standards and why they matter
- **Common Pitfalls** - What to avoid and why
- **Testing** - What each test validates
- **Documentation** - Comprehensive guides and comments

See [Educational Development Guidelines](.kiro/steering/educational-development.md) for more details.

## 🎨 Code Style

This project follows strict code quality standards:

- **ESLint** - Enforces code quality rules
- **Prettier** - Automatic code formatting
- **TypeScript Strict Mode** - Maximum type safety
- **Conventional Commits** - Meaningful commit messages

Run before committing:
```bash
npm run lint
npm run format
```

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Current schema includes:

- **User** - Authentication, profile, ratings
- **Listing** - Items and services with pricing
- **Category** - Organization and browsing
- **Message** - User-to-user communication
- **Rating** - User reviews and ratings
- **Favorite** - Saved listings

View schema: `backend/prisma/schema.prisma`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `GET /api/auth/verify-email/:token` - Verify email address
- `POST /api/auth/login` - Authenticate user and get JWT token
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Complete password reset

### User Profile
- `GET /api/users/:id` - Get user profile (public)
- `PATCH /api/users/:id` - Update user profile (authenticated)
- `POST /api/users/:id/avatar` - Upload profile picture (authenticated)
  - Accepts: multipart/form-data
  - Field name: `profilePicture`
  - Max size: 5MB
  - Formats: JPEG, PNG, GIF, WebP

### Listings
- `POST /api/listings` - Create new listing (authenticated)
  - Supports both item and service types
  - Service listings include pricing type (hourly/fixed)
  - Requires: title, description, price, category, listingType, images
- `GET /api/listings` - Get all active listings with pagination
  - Query params: limit, offset
  - Returns: listings array, total count, hasMore flag
- `GET /api/listings/:id` - Get specific listing with seller info
- `PUT /api/listings/:id` - Update listing (authenticated, owner only)
  - Preserves creation timestamp
- `PATCH /api/listings/:id/status` - Update listing status (authenticated, owner only)
  - Status values: active, sold, completed
- `DELETE /api/listings/:id` - Delete listing (authenticated, owner only)
  - Permanently removes listing

### Search & Browse
- `GET /api/search` - Search listings with filters
  - Query params: query, categoryId, listingType, minPrice, maxPrice, location, limit, offset
  - Returns: listings array, total count, hasMore flag
  - All filters use AND logic
  - Text search is case-insensitive
- `GET /api/categories` - Get all categories with listing counts
  - Returns: categories array with active listing counts
- `GET /api/categories/:id/listings` - Browse listings by category
  - Query params: limit, offset
  - Returns: listings array, category info, total count, hasMore flag

### Static Files
- `GET /uploads/profile-pictures/:filename` - Access uploaded profile pictures

For detailed API documentation and examples, see:
- [Manual Testing Guide](backend/test-upload-manual.md)
- [Frontend Integration Examples](backend/FRONTEND_INTEGRATION_EXAMPLES.md)

## 🚀 Deployment

Deployment instructions coming soon. The application is designed to be deployed on:

- **Backend**: Heroku, Railway, or AWS
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Database**: Heroku Postgres, AWS RDS, or Supabase

## 🤝 Contributing

This is an educational project. Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run linting and formatting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Links

- **Repository**: https://github.com/sfh1980/marketplace-app
- **Documentation**: See `.kiro/specs/marketplace-platform/`
- **Progress Log**: [PROGRESS.md](PROGRESS.md)

---

**Built with ❤️ using modern web technologies and best practices**
