# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

URL Shortener PRO - a full-stack URL shortening service with real-time analytics. Currently ~75% MVP complete with authentication system, full CRUD operations for links, and CI/CD pipeline.

## Development Commands

### Backend (Node.js/Express/TypeScript)
```bash
# Development (from backend/)
npm run dev              # Start dev server with nodemon on port 3000
npm run build           # Compile TypeScript with tsc-silent (suppresses type errors)
npm start               # Run production server

# Code Quality  
npm run lint            # ESLint check
npm run format          # Prettier formatting
npm run test            # Run tests (returns 0, no tests configured yet)

# Database (Prisma)
npm run migrate         # Create development migration
npm run migrate:deploy  # Deploy migrations to production
npm run studio          # Open Prisma Studio GUI
npx prisma generate     # Generate Prisma client after schema changes
```

### Frontend (React/Vite/TypeScript)
```bash
# Development (from frontend/)
npm run dev             # Start Vite dev server on port 5173
npm run build          # Build for production
npm run lint           # ESLint check
npm run preview        # Preview production build
npm test                # Run tests (returns 0, no tests configured yet)
```

### Infrastructure
```bash
# Start services (from root)
docker-compose up -d    # PostgreSQL (5432) and Redis (6379)
docker-compose down     # Stop all services
docker-compose logs -f  # View logs

# Database access
# pgAdmin: http://localhost:5050 (admin@example.com / admin)
# Prisma Studio: npm run studio (from backend/)
```

### GitHub Actions CI/CD
```bash
# Workflows location: .github/workflows/
# - ci.yml: Main CI workflow (runs on push/PR)
# - backend.yml: Backend specific tests
# - frontend.yml: Frontend specific tests

# Actions run automatically on:
# - Push to master, main, or develop branches
# - Pull requests to these branches
# - Manual trigger via GitHub UI

# What CI checks:
# - Linting (ESLint)
# - TypeScript compilation
# - Build artifacts generation
# - Tests execution (placeholder for now)
```

## Architecture Overview

### Core Architecture
Monolithic application with separated backend API (Express.js) and frontend SPA (React). Backend uses service layer pattern for business logic separation. PostgreSQL for persistence with Prisma ORM handling database operations and migrations.

### Service Layer (`backend/src/services/`)
- **LinkService**: URL shortening core - `createShortLink()`, `getOriginalUrl()`, `trackClick()`
- **AuthService**: JWT authentication with refresh tokens - complete implementation
- **UserService**: User management, profile updates, account deletion - complete implementation
- **AnalyticsService**: Click tracking and stats (not yet implemented)

### API Routes (`backend/src/routes/`)
- **Base**: `/api/v1/`
- **Public**: `POST /shorten`, `GET /:shortCode` (redirect), `GET /links/:shortCode`
- **Authentication** (`/api/v1/auth/*`): register, login, logout, refresh, password reset
- **User** (`/api/v1/user/*`): profile, stats, links (protected routes)
- **Health**: `GET /health`
- **Rate limited**: 100 requests/15min per IP

### Frontend Structure (`frontend/src/`)
- **Pages**: Home, Login, Register, Dashboard, Password Reset
- **Components**: Layout, PrivateRoute, UrlShortener
- **Context**: AuthContext for global authentication state
- **API Client**: Axios with interceptors for auth token management

## URL Shortening Implementation

### Short Code Generation
- Uses `nanoid` with custom alphabet (excludes 0, O, I, l) for 6-char codes
- Collision retry mechanism (max 10 attempts)
- Anonymous URLs deduplicated by checking existing `originalUrl` with `userId: null`

### Error Handling
- `AppError` class in `middleware/errorHandler.ts` for consistent errors
- Standardized responses via `utils/apiResponse.ts`
- HTTP status codes: 400 (validation), 404 (not found), 410 (expired/deactivated), 500 (server error)

### Database Schema (Prisma)
```
users → links → clicks (cascade delete)
         ↓
    sessions, password_resets
```
- BigInt IDs require `.toString()` in JSON responses
- Indexes on: `short_code`, `user_id`, `created_at`, `email`
- Migrations: Update schema → `npm run migrate` → Deploy with `npm run migrate:deploy`

## Implementation Status

### Completed (~75% MVP)
- Express API with TypeScript, Prisma ORM setup
- URL shortening: create, retrieve, redirect
- Click tracking (basic), rate limiting, error handling
- Database schema (users, links, clicks, sessions, password_resets)
- Full authentication system (JWT with refresh tokens)
- User management (register, login, profile, delete account)
- Full CRUD operations for links (create, read, update, delete)
- Links analytics API (detailed stats and click history)
- Frontend React app with routing and auth integration
- Password reset flow (without email service)
- GitHub Actions CI/CD pipeline (build, lint, test)
- ESLint configuration for both backend and frontend
- TypeScript compilation with tsc-silent for backend

### Not Implemented (Priority Order)
- Redis caching integration (Redis running but not connected)
- Email service for password reset notifications
- Testing suite (no tests written yet)
- Environment validation and production configuration
- Production deployment and monitoring