# Marketplace Platform

A full-stack web application for buying and selling items and services in a peer-to-peer marketplace.

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
│   │   └── index.ts        # Entry point
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/         # React + Vite + TypeScript SPA
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Page components
    │   ├── hooks/          # Custom React hooks
    │   ├── services/       # API client
    │   ├── utils/          # Helper functions
    │   ├── types/          # TypeScript types
    │   ├── context/        # React Context
    │   ├── styles/         # CSS files
    │   ├── App.tsx         # Root component
    │   └── main.tsx        # Entry point
    ├── package.json
    └── vite.config.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration

5. Run the development server:
   ```bash
   npm run dev
   ```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## 🛠️ Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Prisma** - ORM
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **React Query** - Server state management
- **Axios** - HTTP client
- **CSS Variables** - Styling

## 📝 Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## 🎨 Code Style

This project uses:
- **ESLint** for code quality
- **Prettier** for code formatting
- **TypeScript** for type safety

Run `npm run lint` and `npm run format` before committing.

## 📚 Documentation

- [Requirements](.kiro/specs/marketplace-platform/requirements.md)
- [Design](.kiro/specs/marketplace-platform/design.md)
- [Tasks](.kiro/specs/marketplace-platform/tasks.md)

## 🧪 Testing

Tests are written using Jest and can be run with:
```bash
npm test
```

## 📄 License

MIT
