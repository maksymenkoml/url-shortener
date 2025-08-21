# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

URL Shortener PRO - a monolithic URL shortening service with real-time analytics. Currently ~30% MVP complete with backend API operational.

## Development Commands

### Backend (Node.js/Express/TypeScript)
```bash
# Development (from backend/)
npm run dev              # Start dev server with nodemon on port 3000
npm run build           # Compile TypeScript to dist/
npm start               # Run production server

# Code Quality  
npm run lint            # ESLint check
npm run format          # Prettier formatting
npm run test            # Jest tests (not configured yet)

# Database (Prisma)
npm run migrate         # Create development migration
npm run migrate:deploy  # Deploy migrations to production
npm run studio          # Open Prisma Studio GUI
npx prisma generate     # Generate Prisma client after schema changes
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

## Architecture Overview

### Core Architecture
Express.js monolithic API with TypeScript, using service layer pattern for business logic separation. PostgreSQL for persistence with Prisma ORM handling database operations and migrations.

### Service Layer (`backend/src/services/`)
- **LinkService**: URL shortening core - `createShortLink()`, `getOriginalUrl()`, `trackClick()`
- **AnalyticsService**: Click tracking and stats (planned)
- **AuthService**: JWT authentication (planned)
- **UserService**: User management (planned)

### API Routes
- **Base**: `/api/v1/`
- **Public**: `POST /shorten`, `GET /:shortCode` (redirect), `GET /links/:shortCode`
- **Health**: `GET /health`
- **Rate limited**: 100 requests/15min per IP

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

### Completed (~30% MVP)
- Express API with TypeScript, Prisma ORM setup
- URL shortening: create, retrieve, redirect
- Click tracking (basic), rate limiting, error handling
- Database schema (users, links, clicks, sessions, password_resets)

### Not Implemented
- Authentication (JWT), user registration/login
- Protected routes, analytics service
- Redis caching, GeoIP tracking
- Frontend (React/Vite)
- Testing (Jest)