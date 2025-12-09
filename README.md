# MineGNK

GPU Mining Customer Portal for Gcore clients participating in the Gonka network.

## Overview

MineGNK is a monitoring portal that allows users to:
- View their GPU nodes (deployed on Gcore infrastructure)
- Monitor mining performance and earnings from Gonka network
- Request new nodes (processed manually by support team)

**Key Principle**: This is a monitoring portal, not a self-service provisioning platform.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 21, Tailwind CSS v4, Spartan UI |
| Backend | NestJS 11, TypeORM, Swagger/OpenAPI |
| Database | PostgreSQL 16 |
| Auth | JWT (7-day expiry), Google OAuth, GitHub OAuth |
| External APIs | Hyperfusion tracker (node stats, earnings) |

## Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)

## Quick Start

### 1. Clone and install

```bash
git clone <repository-url>
cd gonka

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Start the database

```bash
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432` with:
- Database: `minegnk`
- User: `minegnk`
- Password: `minegnk`

### 3. Configure environment

```bash
# Copy example env file
cp backend/.env.example backend/.env

# Edit with your settings (optional for development)
```

### 4. Start the backend

```bash
cd backend
npm run start:dev
```

Backend runs on http://localhost:3000

- API Documentation: http://localhost:3000/api/docs
- Health check: http://localhost:3000/api/health

### 5. Start the frontend

```bash
cd frontend
npm start
```

Frontend runs on http://localhost:4200

## Project Structure

```
/gonka
├── frontend/               # Angular 21 + Tailwind CSS v4
│   └── src/app/
│       ├── core/           # Services, guards, interceptors, models
│       ├── features/       # Landing, auth, dashboard, nodes, requests, admin
│       └── shared/         # Layout, loading-spinner, directives
├── backend/                # NestJS API
│   └── src/
│       ├── common/         # Filters, utils, DTOs, LRU cache
│       ├── config/         # App, database, JWT, OAuth configs
│       └── modules/
│           ├── auth/       # JWT + Google/GitHub OAuth
│           ├── users/      # User management
│           ├── nodes/      # Node monitoring (Gonka trackers)
│           ├── requests/   # Node request handling
│           ├── admin/      # Admin panel APIs
│           └── health/     # Health checks
├── docs/                   # Documentation
│   ├── PRD.md              # Product Requirements
│   ├── API_RESEARCH.md     # External API documentation
│   └── PROGRESS.md         # Development progress tracker
└── docker-compose.yml      # PostgreSQL container
```

## Available Scripts

### Frontend

```bash
cd frontend

npm start          # Start dev server (localhost:4200)
npm run build      # Production build
npm test           # Run tests
```

### Backend

```bash
cd backend

npm run start:dev    # Start with hot reload (localhost:3000)
npm run start:prod   # Start production build
npm test             # Run unit tests (38 tests)
npm run test:cov     # Run tests with coverage
npm run migration:run    # Apply database migrations
npm run migration:show   # Check migration status
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (protected) |
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/github` | Initiate GitHub OAuth |

### Nodes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nodes` | List user's nodes |
| GET | `/api/nodes/dashboard` | Dashboard stats |
| GET | `/api/nodes/:address` | Node details |

### Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests` | Create node request |
| GET | `/api/requests/my` | User's requests |
| DELETE | `/api/requests/:id` | Cancel pending request |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Admin stats |
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users/:id/nodes` | Assign node to user |
| PUT | `/api/requests/:id` | Update request status |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Full health status |
| GET | `/api/health/live` | Kubernetes liveness probe |
| GET | `/api/health/ready` | Kubernetes readiness probe |

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://minegnk:minegnk@localhost:5432/minegnk

# JWT (required in production, min 32 chars)
JWT_SECRET=your-secret-key-minimum-32-characters

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:4200

# External APIs
HYPERFUSION_TRACKER_URL=https://tracker.gonka.hyperfusion.io
```

## Features

### Dashboard
- Summary cards: Active Nodes, Healthy Nodes, Total Earnings, Avg Uptime
- Node overview table with top nodes

### My Nodes
- List of user's nodes with status, GPU type, earnings
- Node detail view with 3 tabs: Overview, Metrics, History

### Request New Node
- GPU type selection (RTX 3080, 4090, H100, H200)
- Quantity selector, region dropdown
- Request tracking with status updates

### Admin Panel
- Request management (approve/reject/complete)
- User management (toggle role, activate/deactivate)
- Node assignment to users

## Security Features

- JWT authentication with 7-day expiry
- Rate limiting (5 req/min on auth endpoints)
- Helmet security headers
- Strong password validation (8+ chars, upper+lower+number)
- Bcrypt hashing (12 rounds)
- Payload size limits (100kb)

## Testing

```bash
# Backend tests (38 tests)
cd backend && npm test

# Test coverage
cd backend && npm run test:cov
```

Test files:
- `auth.service.spec.ts` - 10 tests
- `nodes.service.spec.ts` - 12 tests
- `admin.service.spec.ts` - 16 tests

## Database

### Tables
- `users` - User accounts with roles
- `user_nodes` - Links users to Gonka node addresses
- `node_requests` - GPU provisioning requests
- `nodes` - Canonical node reference data
- `node_stats_cache` - Cached tracker data
- `earnings_history` - Historical earnings

### Migrations

```bash
cd backend

# Apply migrations
npm run migration:run

# Check status
npm run migration:show

# Rollback last migration
npm run migration:revert
```

## Development

### Git Workflow

```bash
# Commit message format
<type>: <short description>

# Types: feat, fix, refactor, docs, style, test, chore
# Examples:
feat: add dashboard earnings chart
fix: correct earnings calculation
docs: update API documentation
```

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Angular signals pattern
- inject() pattern for DI
- takeUntilDestroyed() for subscriptions

## License

UNLICENSED - Private project
