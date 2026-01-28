# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MineGNK** is a **GPU mining customer portal** for Gcore clients participating in the Gonka network.

Users can:
- View their GPU nodes (deployed on Gcore infrastructure by support team)
- Monitor mining performance and earnings from Gonka network
- Request new nodes (processed manually by support)

**Key Principle**: This is a **monitoring portal**, not a self-service provisioning platform.

## Architecture

```
+------------------+
| PUBLIC (Browser) |  [Auth Disabled]
+--------+---------+
         |
         v
+--------+---------+     +-------------------+
| Frontend         |     | node4.gonka.ai    |
| Angular 21       |     | (PRIMARY)         |
| (Landing page)   |     | /v1/epochs/...    |
+--------+---------+     +-------------------+
         |                        ^
         v                        |
+--------+---------+              |
| Backend API      +--------------+
| NestJS           |     +-------------------+
+--------+---------+     | Hyperfusion       |
         |               | (SUPPLEMENTARY)   |
         v               | countdown, health |
+--------+---------+     +-------------------+
| PostgreSQL       |
| (nodes, pricing) |
+------------------+

SUPPORT TEAM:
- Receives node requests from users
- Manually provisions VMs on Gcore Cloud
- Assigns node IDs to users via Admin Panel
```

### Data Flow

```
Landing Page -> Backend polls node4.gonka.ai + Hyperfusion every 60s
             -> Returns network stats (epoch, participants, GPUs, models, status)
             -> No authentication required (public view)

[Auth/Dashboard routes currently disabled - redirect to landing page]
```

## Tech Stack

- **Frontend**: Angular 21 with Tailwind CSS v4 + Spartan UI
- **Backend**: NestJS 11 with Swagger docs at /api/docs
- **Database**: PostgreSQL 16 with TypeORM
- **Storage**: Gcore S3-compatible Object Storage (KYC documents)
- **Auth**: Email/password + Google/GitHub/Telegram OAuth with secure refresh tokens
- **Security**: Helmet headers, rate limiting (throttler), strong password validation
- **External APIs**: Gonka (trackers), Gcore (instance specs), HubSpot (forms)
- **Caching**: LRU in-memory cache with TTL (2 min node data, 20 sec chain status)

**For Angular/Frontend patterns, see the `angular` skill** (loaded automatically).

## Key Integrations

### Gonka Network (PRIMARY data source)
- **What**: Decentralized AI network using Proof-of-Work for inference
- **Token**: GNK (~310,000/day, halving every 4 years)
- **Supported GPUs**: A100, H100, H200, B200

### Data Sources

| Source | URL | Data | Status |
|--------|-----|------|--------|
| **node4.gonka.ai** | `node4.gonka.ai/v1/epochs/current/participants` | Epoch ID, participants, GPUs, models | **PRIMARY** |
| **Gonka Chain RPC** | `node4.gonka.ai/chain-rpc/status` | Network status, block height, sync state | **Integrated** |
| **Hyperfusion** | `tracker.gonka.hyperfusion.io/api/v1/inference/current` | Healthy participants, countdown, fallback data | **Supplementary** |
| Gcore API | `api.gcore.com` | Instance specs | Not started |

### What we fetch:
- Node status (healthy/unhealthy/jailed/offline)
- Network status (Live/Syncing/Stale) + block age
- GPU type, earnings, uptime, active model
- Total GPUs, participants count

## Project Structure

```
/gonka
  frontend/                 # Angular 21 + Tailwind CSS v4
    src/app/
      core/                 # Services, guards, interceptors, models
      features/             # Landing, auth, dashboard, nodes, requests, admin
        landing/components/
          hubspot-form-modal.component.ts  # HubSpot form integration modal
      shared/               # Layout, loading-spinner, directives, utils
    nginx.conf              # IP restrictions for /api/admin/*
    environments/           # Environment configurations (HubSpot, backend URL)
  backend/                  # NestJS API
    src/
      common/               # Filters, utils, DTOs, services (LRU cache)
      config/               # App, database, JWT, Gonka, OAuth, S3 configs
      modules/              # auth, users, nodes, requests, admin, pricing, uploads, health
  scripts/                  # Management scripts
    pricing-view.py         # View current GPU prices
    pricing-update.py       # Update GPU prices
  docs/                     # PRD.md, PROGRESS.md, API_RESEARCH.md
  .claude/
    agents/                 # AI agents (code-review, refactor, angular, nestjs, testing, etc.)
    skills/                 # angular, context7, pricing, subagent-driven-development
    archive/                # Archived agents (gonka-api-research, db-architect)
  docker-compose.yml        # PostgreSQL
```

## Core Features

### Landing Page (ACTIVE)
- **Public Access**: No authentication required
- Dark theme, 6 network stats cards (status, epoch, participants, GPUs, models, countdown)
- Dynamic pricing, auto-refresh every 60s
- Data from node4.gonka.ai (primary) + Hyperfusion (supplementary)
- **HubSpot Form Integration**: "Rent GPU" buttons in header, hero, and pricing cards open modal with embedded HubSpot form (EU1 region)
  - Modal displays selected GPU type in header when opened from pricing card
  - Iframe-based form integration with white background for light theme
  - Separate portal/form IDs for sandbox (dev) and production environments

### Authentication (DISABLED)
- All auth routes disabled: `/auth/*`
- Sign In / Sign Up / Get Started buttons removed from landing page
- Redirects to landing page

### Dashboard (DISABLED)
- Summary cards: Active Nodes, Healthy Nodes, Total Earnings, Avg Uptime
- Auto-refresh every 30 seconds
- Onboarding checklist for new users
- **Status**: Routes disabled, redirects to `/`

### My Nodes (DISABLED)
- Node list with status, missed/invalid rates
- Problem node highlighting (>10% missed/invalid or jailed)
- Node detail view with Overview, Metrics, History tabs
- **Status**: Routes disabled

### Request New Node (DISABLED)
- GPU type selection with pricing, quantity selector
- Requests list with status tracking
- **Status**: Routes disabled

### Admin Panel (DISABLED)
- Dashboard with stats + health alerts
- User/Node/Request management with CSV export
- Node assignment modal
- **Status**: Routes disabled

## Development Commands

```bash
# Start PostgreSQL
docker-compose up -d

# Frontend
cd frontend && npm install && npm start

# Backend
cd backend && npm install && npm run start:dev

# Pricing Management
python3 scripts/pricing-view.py              # View current GPU prices
python3 scripts/pricing-update.py A100 2.50  # Update GPU price
```

## Production Deployment

```bash
# Fresh deployment (migrations run automatically)
docker-compose -f docker-compose.prod.yml up -d --build
```

## Git Workflow

```
<type>: <short description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

**Rules:**
- No "Generated with Claude Code" or "Co-Authored-By" lines
- Keep messages concise

## Environment Variables

### Backend (.env)

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=minegnk
DB_PASSWORD=minegnk
DB_DATABASE=minegnk

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth (Google, GitHub)
GOOGLE_CLIENT_ID=...
GITHUB_CLIENT_ID=...
FRONTEND_URL=http://localhost:4200

# Gonka
GONKA_CHAIN_RPC_URL=https://node4.gonka.ai/chain-rpc/status
HYPERFUSION_TRACKER_URL=https://tracker.gonka.hyperfusion.io

# S3 Storage (KYC documents)
S3_ENDPOINT=https://s-ed1.cloud.gcore.lu
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=minegnk-kyc-documents
```

See `backend/.env.example` for full list.

### Frontend (environment.ts / environment.prod.ts)

HubSpot form integration is configured in `frontend/src/environments/`:

| Environment | Portal ID | Form ID | Region |
|-------------|-----------|---------|--------|
| Sandbox (dev) | 147554099 | 78fd550b-eec3-4958-bc4d-52c73924b87b | eu1 |
| Production | 4202168 | 2d618652-614d-45f9-97fb-b9f88a6e8cc1 | eu1 |

**Note:** Production environment currently uses sandbox credentials for testing.

## Key Decisions

1. **Manual Provisioning**: VM creation by support team, not automated
2. **Node Linking**: Support assigns node IDs via Admin Panel
3. **Data Aggregation**: Backend fetches from node4.gonka.ai (primary) + Hyperfusion (supplementary)
4. **Gonka = Data, Gcore = Infrastructure**
5. **Styling**: Tailwind CSS v4 for all UI
6. **KYC Storage**: Gcore S3 with presigned URLs
7. **Admin Access**: IP-restricted (149.50.174.62) via nginx, pricing managed via Claude Code
8. **Pricing Management**: Python scripts + Claude Code skill instead of web UI
9. **Auth Disabled**: Landing page only, all protected routes disabled (as of 2026-01-28)
10. **node4 as Primary**: node4.gonka.ai/v1/epochs/current/participants for epoch/participant/GPU data
11. **HubSpot Integration**: External form submission via iframe modal for GPU rental inquiries (replaces internal request system for public users)

## Testing

```bash
cd backend && npm test        # Run tests (60 total)
cd backend && npm run test:cov  # With coverage
```

## Project Metrics

| Category | Count |
|----------|-------|
| Frontend components | 41 |
| Backend modules | 9 |
| API endpoints | 45 |
| Database tables | 8 |
| Tests passing | 60 |

## Health Endpoints

```bash
GET /api/health       # Full health status
GET /api/health/live  # Kubernetes liveness probe
GET /api/health/ready # Kubernetes readiness probe
```

## Local AI Agents & Skills

### Active Agents

Custom agents in `.claude/agents/`. **Use these instead of built-in system agents.**

| Agent | Use For |
|-------|---------|
| `code-review-agent` | Code quality, security, Spartan UI compliance |
| `refactor-agent` | Split files, extract templates, fix structure |
| `angular-frontend-agent` | Angular components with Spartan UI |
| `nestjs-backend-agent` | NestJS modules, controllers, services |
| `testing-agent` | Unit, integration, e2e tests |
| `project-doc-agent` | Documentation updates |

### Active Skills

Skills in `.claude/skills/`.

| Skill | Use For |
|-------|---------|
| `pricing` | View/update/check GPU prices against Gcore website |
| `angular` | Angular patterns with Spartan UI |
| `context7` | Fetch library documentation |
| `subagent-driven-development` | Task-based parallel development |

### Archived Agents (in `.claude/archive/`)

| Agent | Use For |
|-------|---------|
| `gonka-api-research-agent` | Adding new Gonka data sources |
| `db-architect-agent` | Schema changes/migrations |

### Usage

```
Task({
  subagent_type: "refactor-agent",  // ✅ Local agent
  prompt: "..."
})

Skill({skill: "pricing"})  // ✅ Load pricing skill
```
