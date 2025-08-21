# URL Shortener PRO

A modern URL shortening service with real-time analytics, built with Node.js, TypeScript, and React.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ LTS
- Docker & Docker Compose
- npm or yarn

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd url-shortener
```

2. **Start database services**
```bash
docker-compose up -d
```

3. **Setup backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate dev
npm run dev
```

The backend server will start at `http://localhost:3000`

### API Endpoints

#### Public Endpoints

- `POST /api/v1/shorten` - Create a short URL
- `GET /:shortCode` - Redirect to original URL
- `GET /api/v1/links/:shortCode` - Get link information
- `GET /api/v1/links/:shortCode/stats` - Get basic statistics

#### Health Check

- `GET /health` - Server health status

### Database Management

- **pgAdmin**: http://localhost:5050
  - Email: admin@example.com
  - Password: admin

- **Prisma Studio**: 
```bash
npm run studio
```

### Available Scripts

#### Backend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run migrate      # Run database migrations
npm run studio       # Open Prisma Studio
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 📝 Project Structure

```
url-shortener/
├── backend/
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── prisma/            # Database schema
│   └── package.json
├── frontend/              # React application (coming soon)
├── docs/                  # Documentation
└── docker-compose.yml     # Docker services
```

## 🔧 Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Redis
- **ORM**: Prisma
- **Frontend**: React, Vite, TypeScript (coming soon)
- **Infrastructure**: Docker, Nginx

## 📄 License

MIT