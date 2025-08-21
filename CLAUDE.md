# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

URL Shortener PRO - a URL shortening service with real-time analytics, user management, and dashboard capabilities. The project has comprehensive technical documentation in the `docs/` folder covering architecture, database schema, API specifications, and technology stack.

## Development Commands

### Backend (Node.js/Express/TypeScript)
```bash
# Development
cd backend
npm run dev              # Start dev server with nodemon
npm run build           # Compile TypeScript to dist/
npm start               # Run production server

# Testing & Quality  
npm run test            # Run Jest tests (not configured yet)
npm run lint            # ESLint check
npm run format          # Prettier formatting

# Database (Prisma)
npm run migrate         # Create development migration
npm run migrate:deploy  # Deploy migrations to production
npm run studio          # Open Prisma Studio GUI
npx prisma generate     # Generate Prisma client after schema changes
```

### Docker & Infrastructure
```bash
# Docker commands (from root directory)
docker-compose up -d    # Start PostgreSQL and Redis services
docker-compose down     # Stop all services
docker-compose logs -f  # View logs

# Database access
# pgAdmin: http://localhost:5050 (admin@example.com / admin)
# Prisma Studio: npm run studio (from backend/)
```

## Architecture Overview

### Monolithic Architecture (MVP)
- **Backend**: Express.js API server with TypeScript
- **Frontend**: React SPA with Vite bundler (to be implemented)
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache**: Redis 7 for sessions and URL caching (to be implemented)
- **Proxy**: Nginx for load balancing and static assets

### Core Services Structure
```
services/
├── LinkService      # Short code generation, URL validation, CRUD operations
├── AnalyticsService # Click tracking, GeoIP, stats aggregation (to be implemented)
├── AuthService      # JWT auth, registration, password reset (to be implemented)
└── UserService      # Profile management, user operations (to be implemented)
```

### API Structure
- Base path: `/api/v1/`
- Authentication: JWT Bearer tokens (to be implemented)
- Public endpoints: `/shorten`, `/:shortCode`, `/links/:shortCode`, `/links/:shortCode/stats`
- Protected endpoints: `/links`, `/analytics`, `/user` (to be implemented)
- Rate limiting: Configured via express-rate-limit
- Health check: `/health`

### Database Schema
- `users` - User accounts with authentication
- `links` - Short URLs with metadata and statistics
- `clicks` - Detailed click analytics per visit
- `sessions` - User sessions for JWT management
- `password_resets` - Password reset tokens

## Technology Stack Details

### Backend Dependencies
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 5.1
- **Language**: TypeScript 5.9
- **ORM**: Prisma 6.14
- **Auth**: jsonwebtoken, bcrypt
- **Validation**: Joi 18.0
- **Utils**: nanoid 5.1 (short codes), compression, helmet, cors, morgan
- **Rate Limiting**: express-rate-limit 8.0

### Infrastructure
- **Database**: PostgreSQL 15
- **Cache**: Redis 7 (configured in docker-compose)
- **Container**: Docker & docker-compose
- **Environment**: dotenv for configuration

## Key Implementation Details

### URL Shortening Logic
- `nanoid` generates 6-character short codes using custom alphabet (no confusing chars: 0, O, I, l)
- URL validation in `utils/urlUtils.ts` - checks protocol and length
- Collision handling with retry mechanism (max 10 attempts)
- Anonymous links cached in database to avoid duplicates

### Service Layer Pattern
Services encapsulate business logic in `services/`:
- `LinkService`: URL shortening, CRUD operations, click tracking
  - `createShortLink()`: Creates new short URL with validation
  - `getLinkByShortCode()`: Retrieves link details
  - `getOriginalUrl()`: Gets original URL and increments clicks
  - `trackClick()`: Records click analytics

### Error Handling
- Custom `AppError` class for consistent error responses
- Global error middleware in `middleware/errorHandler.ts`
- Standardized API responses via `utils/apiResponse.ts`
- Error codes defined in constants

### Routing Structure
- Main app configuration in `app.ts`
- Route definitions in `routes/linkRoutes.ts`
- Controllers in `controllers/linkController.ts`
- Redirect route (`/:shortCode`) handled separately from API routes

### Performance Considerations
- Database indexes on: `short_code`, `user_id`, `created_at`, `email`
- Connection pooling via Prisma
- Async click tracking (fire-and-forget pattern)
- Compression middleware enabled

## API Response Standards

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

## Database Schema & Migrations

### Migration Workflow
1. Update `backend/prisma/schema.prisma`
2. Run `npm run migrate` to create migration
3. Review generated SQL in `prisma/migrations/`
4. Test migration locally
5. Deploy with `npm run migrate:deploy`

### BigInt Handling
All ID fields use BigInt type - requires special handling in JSON serialization

## Current Implementation Status

### ✅ Completed
- Basic Express server setup with TypeScript
- Prisma ORM configuration with full schema
- Database schema design (all tables)
- URL shortening service (create, retrieve)
- Short code generation with custom alphabet
- URL validation and normalization
- API endpoints (`/api/v1/shorten`, `/:shortCode`, `/api/v1/links/:shortCode`)
- Error handling middleware with AppError class
- API response standardization
- Health check endpoint
- Rate limiting configuration
- Security middleware (helmet, cors)
- Logging with morgan
- Click tracking (basic implementation)

### 🚧 To Do (Priority Order)
1. User authentication (JWT implementation)
2. Protected routes middleware
3. User registration/login endpoints
4. Analytics service implementation
5. Redis caching layer integration
6. Click analytics with GeoIP
7. Frontend React application
8. Testing setup with Jest
9. User dashboard functionality
10. Password reset flow