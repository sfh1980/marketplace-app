# Marketplace Platform

A full-stack web application for buying and selling items and legally allowable services in a peer-to-peer marketplace. Built with security, legal compliance, and education as core principles.

## 📊 Project Status

**Current Phase:** MVP Development - Authentication Implementation  
**Progress:** 4 of 80 tasks complete (5%)  
**Last Updated:** November 2024

### Recent Milestones
- ✅ Project structure and development environment
- ✅ PostgreSQL database and Prisma ORM setup
- ✅ Database schema defined and migrated (6 models)
- ✅ Property-based tests (600 test cases passing)
- ✅ Pushed to GitHub

### Next Steps
- 🔄 Implement user registration endpoint
- ⏳ Email verification
- ⏳ User login with JWT

## 🎯 Key Features

### MVP (Current Focus)
- User authentication (email verification, JWT)
- User profiles with ratings
- Listings for items AND services
- Search and filtering
- User-to-user messaging
- Bot prevention and content moderation
- Legal compliance (GDPR, CCPA)

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

Current test coverage: 600 property-based test cases, all passing ✅

## 📚 Documentation

### Specification Documents
- [Requirements](.kiro/specs/marketplace-platform/requirements.md) - 15 requirements with 80+ acceptance criteria
- [Design](.kiro/specs/marketplace-platform/design.md) - Complete technical design with 32+ correctness properties
- [Tasks](.kiro/specs/marketplace-platform/tasks.md) - 80+ implementation tasks
- [Feature Roadmap](.kiro/specs/marketplace-platform/feature-roadmap.md) - MVP through Phase 3

### Development Guides
- [Backend Development Guide](backend/DEVELOPMENT_GUIDE.md) - Database setup, Prisma Studio, quick reference
- [Progress Log](PROGRESS.md) - Detailed development history and learning log

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
