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
|  USER (Browser)  |
+--------+---------+
         |
         v
+--------+---------+     +-------------------+
| Frontend         |     | Hyperfusion API   |
| Angular 18       |     | (Node stats)      |
+--------+---------+     +-------------------+
         |                        ^
         v                        |
+--------+---------+              |
| Backend API      +--------------+
| NestJS           |
+--------+---------+     +-------------------+
         |               | Gonka API         |
         v               | (Backup)          |
+--------+---------+     +-------------------+
| PostgreSQL       |
| (users, nodes)   |
+------------------+

SUPPORT TEAM:
- Receives node requests from users
- Manually provisions VMs on Gcore Cloud
- Assigns node IDs to users via Admin Panel
```

### Data Flow

```
User Login -> Backend checks user_id
           -> Fetches node_identifiers from DB (user_nodes table)
           -> Queries trackers for node data (with caching)
           -> Returns JSON with only user's nodes
```

## Tech Stack

- **Frontend**: Angular 18+ with Tailwind CSS v4
- **Backend**: NestJS with Swagger docs at /api/docs
- **Database**: PostgreSQL 16
- **Auth**: Email/password + Google OAuth with JWT tokens (7-day expiry)
- **Security**: Helmet headers, rate limiting, strong password validation
- **External APIs**: Gonka (trackers), Gcore (instance specs)

## Key Integrations

### Gonka Network (PRIMARY data source)
- **What**: Decentralized AI network using Proof-of-Work for inference
- **Token**: GNK (~310,000/day, halving every 4 years)
- **Supported GPUs**: 3080, 4090, H100, H200

### Data Sources

| Source | URL | Data | Priority | Status |
|--------|-----|------|----------|--------|
| Hyperfusion | `tracker.gonka.hyperfusion.io` | Node stats, earnings, health | HIGH | **Primary - Integrated** |
| Gonka API | `node{1,2,3}.gonka.ai:8000` | `/v1/epochs/current/participants` | MEDIUM | Researched (backup) |
| Hashiro | `hashiro.tech/gonka` | Pool stats, earnings | LOW | Skipped (no public API) |
| Gcore API | `api.gcore.com` | Instance specs | LOW | Not started |

### What we fetch:
- Node status (healthy/unhealthy/jailed/offline)
- GPU type
- Performance (tokens/sec, jobs/day)
- Earnings (GNK/day, total GNK)
- Uptime percentage
- Active model
- Inference jobs history

### What we DON'T do:
- Create/modify/delete VMs via API (manual by support)
- Direct wallet operations

## Project Structure

```
/gonka
  frontend/                 # Angular 18 + Tailwind CSS v4
    src/app/
      core/                 # Services, guards, interceptors, models
      features/             # Landing, auth, dashboard, nodes, requests, admin
      shared/               # Layout, toast, reusable components
  backend/                  # NestJS API
    src/
      common/               # Filters, utils (retry logic)
      config/               # App, database, JWT, Gonka configs
      modules/
        auth/               # Authentication (JWT) + tests
        users/              # User management
        nodes/              # Node monitoring (Gonka trackers) + tests
        requests/           # Node request handling
        admin/              # Admin panel APIs + tests
        health/             # Health checks (liveness/readiness)
  docs/                     # Documentation
    PRD.md                  # Product Requirements
    IMPLEMENTATION_PLAN.md
    PROGRESS.md             # Progress tracker
  .claude/
    agents/                 # AI agents (code-review, refactor, etc.)
    commands/               # Slash commands (research, sync-docs, update-progress)
    skills/                 # Angular, API design, etc.
  docker-compose.yml        # PostgreSQL
```

## Core Features

### 1. Dashboard (Implemented)
- Summary cards: Active Nodes, Healthy Nodes, Total Earnings, Avg Uptime
- Node overview table with top nodes
- Links to node details

### 2. My Nodes (Implemented)
- List of user's nodes (data from Gonka trackers)
- Node detail view with 3 tabs:
  - **Overview**: GPU type, status, weight, blocks claimed, active models
  - **Metrics**: Inference count, missed rate, invalidation rate, uptime with progress bars
  - **History**: Placeholder for earnings history (future)

### 3. Request New Node (Implemented)
- GPU type selection (RTX 3080, 4090, H100, H200) with pricing
- Quantity selector (1-10)
- Region dropdown (optional)
- Request summary before submit
- Requests list page with status tracking
- Backend API for create/list/cancel requests

### 4. Admin Panel (Implemented)
- Admin dashboard with stats cards
- Request management (approve/reject/complete with notes)
- User management (toggle role, activate/deactivate)
- Node assignment modal (gonka1... address + GPU type + notes)

## Development Commands

```bash
# Start PostgreSQL database
docker-compose up -d

# Connect to database
psql postgresql://minegnk:minegnk@localhost:5432/minegnk

# Frontend
cd frontend && npm install && npm start

# Backend
cd backend && npm install && npm run start:dev
```

## Git Workflow

### Commit Message Format
```
<type>: <short description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

### Examples
```
feat: add dashboard earnings chart
feat: implement node request form
fix: correct earnings calculation
docs: update PRD with Gonka integration
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://minegnk:minegnk@localhost:5432/minegnk

# JWT
JWT_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:4200

# Gonka API
GONKA_API_NODES=http://node1.gonka.ai:8000,http://node2.gonka.ai:8000

# Trackers
HYPERFUSION_TRACKER_URL=https://tracker.gonka.hyperfusion.io
HASHIRO_API_URL=https://hashiro.tech/gonka

# Gcore API (read-only, low priority)
GCORE_API_KEY=your-gcore-api-key
GCORE_BASE_URL=https://api.gcore.com
```

## UI/UX References

For visual inspiration only (no functional integration):

| Service | URL | What to study |
|---------|-----|---------------|
| Vast.ai | `console.vast.ai` | Dashboard layout, earnings display, instance tables |
| Hyperstack | `console.hyperstack.cloud` | Status badges, GPU metrics, navigation |
| GCore UI Kit | `ui-storybook.gcore.top` | **Primary** - our component library |

## Key Decisions

1. **Manual Provisioning**: VM creation is handled by support team, not automated via API
2. **Node Linking**: Support assigns node identifiers to users via Admin Panel
3. **Data Aggregation**: Backend fetches from Gonka trackers, caches results (1-5 min TTL)
4. **Gonka = Data, Gcore = Infrastructure**: Gonka provides node stats, Gcore provides GPU servers
5. **Styling**: Tailwind CSS v4 for all UI (landing, dashboard, components)

## Frontend Styling

### Architecture

The project uses **Tailwind CSS v4** as the primary styling solution across all pages:

| Area | Style Approach | Theme |
|------|----------------|-------|
| Landing page | Tailwind utilities | Dark (purple accents) |
| Dashboard/App | Tailwind utilities | Light (GCore brand colors) |
| Components | Tailwind utilities | Inherits from parent |

### File Structure

```
frontend/src/
  tailwind.css          # Tailwind import + @theme customization
  styles.scss           # CSS variables (GCore brand colors)
```

### Typography

```scss
// Fonts (matching minegnk.com style)
--font-heading: 'Outfit', sans-serif;  // Headings, titles
--font-body: 'Inter', sans-serif;      // Body text, UI
```

Usage: `class="font-heading"` or `class="font-body"`

### CSS Variables

```scss
// GCore brand (dashboard/app - light theme)
--gcore-primary: #FF4C00;
--gcore-bg: #f5f4f4;
--gcore-text: #363636;

// Landing page (dark theme)
--dark-bg: #0a0a0a;
--accent-purple: #a855f7;
```

### Scroll Reveal Animation

The landing page uses a custom `appScrollReveal` directive for scroll-triggered animations:

```html
<!-- Basic usage -->
<div appScrollReveal>Content fades in when scrolled into view</div>

<!-- With stagger delay -->
<div appScrollReveal [revealDelay]="0">Card 1</div>
<div appScrollReveal [revealDelay]="100">Card 2 (100ms delay)</div>
<div appScrollReveal [revealDelay]="200">Card 3 (200ms delay)</div>
```

**File:** `shared/directives/scroll-reveal.directive.ts`

### Guidelines for Developers

1. **Use Tailwind utilities** for layout, spacing, colors, typography
2. **Use CSS variables** (`var(--gcore-primary)`) for brand colors
3. **Use `appScrollReveal`** for scroll-triggered animations on landing page
4. **Keep component SCSS minimal** - only for `:host` styling or complex animations

### Example

```html
<!-- Good: Tailwind utilities -->
<div class="bg-white p-6 rounded-lg shadow-sm border border-[var(--gcore-border)]">

<!-- Avoid: Custom CSS for simple styling -->
<div class="custom-card">  <!-- Don't create .custom-card in SCSS -->
```

## Testing

```bash
# Run backend tests
cd backend && npm test

# Run with coverage
cd backend && npm run test:cov
```

**Test Files:**
- `auth.service.spec.ts` - 10 tests (register, login, validateUser)
- `nodes.service.spec.ts` - 12 tests (getUserNodes, getDashboardStats)
- `admin.service.spec.ts` - 16 tests (assignNode, updateUser, removeNode)

## Health Endpoints

```bash
GET /api/health       # Full health status (services, uptime)
GET /api/health/live  # Kubernetes liveness probe
GET /api/health/ready # Kubernetes readiness probe
```

## AI Coding Guidance

- For explanations of changes (what/why), Angular topics to cover, and when to keep comments minimal, see `docs/LEARNING_GUIDE.md`.
- Keep code comments focused on intent where logic is non-obvious; place broader learning notes in documentation or PR descriptions.
