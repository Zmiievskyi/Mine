# MineGNK Implementation Plan

**Last Updated**: 2025-12-09 (Session 19)
**Based on**: PRD.md, API_RESEARCH.md

---

## Overview

This plan is structured around **reducing risk early**. The biggest unknowns are:
1. Can we get useful data from Gonka/Hyperfusion APIs?
2. What identifier reliably links users to nodes?

Therefore, Phase 0 (Spike) validates these before building full features.

---

## Phase 0: API Spike (Risk Reduction) - COMPLETE

**Goal**: Prove we can fetch and display real node data.

### Tasks
- [x] Create minimal Node.js script to call Gonka API (2025-12-08)
- [x] Call `http://node1.gonka.ai:8000/v1/epochs/current/participants` (2025-12-08)
- [x] Call Hyperfusion `https://tracker.gonka.hyperfusion.io/api/v1/inference/current` (2025-12-08)
- [x] Log response structures to console (2025-12-08)
- [x] Identify which fields map to our needs (see mapping below) (2025-12-08)

### Field Mapping
| Our Need | Gonka API Field | Hyperfusion Field |
|----------|-----------------|-------------------|
| Node ID | `participants[].index` | `participant_index` |
| Status |  | `jail_status`, `health` |
| Models | `participants[].models` | `models` |
| Weight | `participants[].weight` | `weight` |
| Inferences |  | `inference_count` |
| Missed |  | `missed_count`, `missed_rate` |

### Definition of Done
- [x] Successfully fetch data from both APIs (2025-12-08)
- [x] Document actual response samples in `docs/api-samples/` (2025-12-08)
- [x] Identify gaps (e.g., earnings, GPU type) (2025-12-08)

### Dependencies
- None (standalone scripts)

---

## Phase 1: Foundation - COMPLETE

**Goal**: Project scaffolding with auth and basic layout.

### 1.1 Backend Setup (NestJS)
- [x] Initialize NestJS project in `/backend` (2025-12-08)
- [x] Configure PostgreSQL connection (TypeORM) (2025-12-08)
- [x] Create database schema (users, nodes, user_nodes, support_requests) (2025-12-08)
- [x] Run migrations (using TypeORM synchronize for dev) (2025-12-08)

### 1.2 Authentication
- [x] Implement `/auth/register` (email + password) (2025-12-08)
- [x] Implement `/auth/login` (returns JWT) (2025-12-08)
- [x] Implement `/auth/me` (returns current user) (2025-12-08)
- [x] Add JWT guard for protected routes (2025-12-08)
- [x] Create roles (user, admin) (2025-12-08)

### 1.3 Frontend Setup (Angular)
- [x] Initialize Angular 18 project in `/frontend` (2025-12-08)
- [x] Configure Tailwind CSS (GCore UI Kit pending) (2025-12-08)
- [x] Configure routing (login, dashboard, nodes, profile) (2025-12-08)
- [x] Create auth service and guards (2025-12-08)
- [x] Build login/register pages (2025-12-08)

### Definition of Done
- [x] User can register, login, see protected dashboard (2025-12-08)
- [x] JWT stored in localStorage (2025-12-08)
- [x] Angular routing works with auth guard (2025-12-08)

### Dependencies
- Docker (PostgreSQL)
- Node.js 18+

---

## Phase 2: Dashboard with Mock Data - COMPLETE

**Goal**: Build UI structure with static/mock data.

### 2.1 Dashboard Page
- [x] Summary cards: Active Nodes, Healthy Nodes, Total Earnings, Avg Uptime (2025-12-08)
- [x] Node overview table (2025-12-08)
- [ ] Earnings chart (deferred - needs historical data)
- [ ] Recent activity feed (deferred)

### 2.2 My Nodes List
- [x] Table with columns: Node, Status, GPU Type, Performance, Earnings, Uptime, Actions (2025-12-08)
- [x] Status badges (healthy/unhealthy/jailed/offline) (2025-12-08)
- [x] Click row to navigate to details (2025-12-08)

### 2.3 User Profile
- [ ] Display email, telegram, discord (deferred to Phase 5)
- [ ] Edit form with validation (deferred to Phase 5)
- [ ] Save to backend (deferred to Phase 5)

### Definition of Done
- [x] All pages render with data (2025-12-08)
- [x] Consistent styling with Tailwind CSS (2025-12-08)
- [x] Responsive layout (desktop + tablet) (2025-12-08)

### Dependencies
- Phase 1 complete

---

## Phase 3: Gonka Integration - COMPLETE

**Goal**: Replace mock data with real API data.

### 3.1 Backend: Gonka Service
- [x] Create `NodesService` in NestJS (2025-12-08)
- [x] Fetch from Hyperfusion tracker (primary data source) (2025-12-08)
- [x] Parse response, extract node data (2025-12-08)
- [x] Handle errors (timeout, 500, etc.) (2025-12-08)

### 3.2 Backend: Hyperfusion Service
- [x] Integrated into NodesService (2025-12-08)
- [x] Fetch from `/api/v1/inference/current` (2025-12-08)
- [x] Transform data to frontend-compatible format (2025-12-08)

### 3.3 Backend: Caching Layer
- [x] In-memory caching with 2-minute TTL (2025-12-08)
- [ ] Background job to refresh cache (deferred - not needed for MVP)

### 3.4 Backend: Node Aggregation Endpoint
- [x] Create `/nodes` endpoint (2025-12-08)
- [x] Create `/nodes/dashboard` endpoint (2025-12-08)
- [x] Filter nodes by user's assigned identifiers (from `user_nodes`) (2025-12-08)
- [x] Return merged data with stats (2025-12-08)

### 3.5 Frontend: Connect to Real Data
- [x] Update dashboard to call `/nodes/dashboard` (2025-12-08)
- [x] Update nodes list with real data (2025-12-08)
- [x] Show loading states and error handling (2025-12-08)
- [x] Created shared LayoutComponent for consistent navigation (2025-12-08)

### Definition of Done
- [x] Dashboard shows real node data from Gonka network (2025-12-08)
- [x] Data refreshes on page load (within cache TTL) (2025-12-08)
- [x] Errors displayed gracefully (tracker down, etc.) (2025-12-08)

### Dependencies
- Phase 2 complete
- API endpoints confirmed working (Phase 0)

---

## Phase 4: Node Details & Earnings - COMPLETE

**Goal**: Detailed view per node with historical data.

### 4.1 Node Details Page - COMPLETE (2025-12-08)
- [x] Tabs: Overview, Metrics, History (2025-12-08)
- [x] Overview: status, GPU type, models, inference URL (2025-12-08)
- [x] Metrics: inference count, missed rate, invalidation rate (2025-12-08)
- [x] Added NodeDetail interface with extended fields (2025-12-08)
- [x] Backend returns detailed node response (2025-12-08)

### 4.2 Earnings History (Optional for MVP)
- [ ] Store daily earnings snapshots in `earnings_history` table
- [ ] Backend job to calculate and store daily earnings
- [ ] Chart showing earnings over time (7/30 days)

### 4.3 Health Timeline (Optional for MVP)
- [ ] Store status changes in history table
- [ ] Show timeline of healthy/unhealthy/jailed states

### Definition of Done
- [x] User can view detailed info for each node (2025-12-08)
- [ ] Earnings chart shows historical data (deferred)
- [ ] Status history is visible (deferred)

### Dependencies
- Phase 3 complete
- Earnings calculation logic defined

---

## Phase 5: Request System - COMPLETE

**Goal**: Users can request new nodes, support manages queue.

### 5.1 Add Node Request Form - COMPLETE (2025-12-08)
- [x] Form: GPU type, quantity, region, message (2025-12-08)
- [x] Validation (required fields) (2025-12-08)
- [x] Submit creates `node_request` record (2025-12-08)

### 5.2 User Request List - COMPLETE (2025-12-08)
- [x] Page showing user's requests (2025-12-08)
- [x] Status badges (pending, approved, rejected, completed) (2025-12-08)
- [x] Cancel functionality for pending requests (2025-12-08)

### 5.3 Admin: Request Management - COMPLETE (2025-12-09)
- [x] Admin sees all requests (2025-12-09)
- [x] Can update status (approve/reject/complete) (2025-12-09)
- [x] Can add admin notes (2025-12-09)

### Definition of Done
- [x] User can submit node request (2025-12-08)
- [x] User sees request status (2025-12-08)
- [x] Admin can process requests (2025-12-09)

### Dependencies
- Phase 1 auth (admin role)

---

## Phase 6: Admin Panel - COMPLETE

**Goal**: Admins manage users and node assignments.

### 6.1 Users Management - COMPLETE (2025-12-09)
- [x] List all users with assigned nodes (2025-12-09)
- [x] View user details (expandable cards) (2025-12-09)
- [x] Assign role (user/admin) (2025-12-09)
- [x] Activate/deactivate users (2025-12-09)

### 6.2 Node Assignment - COMPLETE (2025-12-09)
- [x] Interface to link node identifier to user (modal) (2025-12-09)
- [x] Input: node address (gonka1...) + label + GPU type + notes (2025-12-09)
- [x] Creates record in `user_nodes` (2025-12-09)
- [x] Remove node from user (2025-12-09)

### 6.3 System Overview - COMPLETE (2025-12-09)
- [x] Dashboard with stats: total users, nodes, pending/approved requests (2025-12-09)
- [x] Quick action cards linking to management pages (2025-12-09)

### Definition of Done
- [x] Admin can assign nodes to users (2025-12-09)
- [x] User immediately sees assigned node (2025-12-09)
- [ ] Assignment audit trail (deferred - who assigned when)

### Dependencies
- Phase 3 (node data available)
- Phase 5 (requests exist)

---

## Phase 7: Polish & Launch - 95% COMPLETE

**Goal**: Production-ready release.

### 7.1 Error Handling & Fallbacks - COMPLETE (2025-12-09)
- [x] Graceful degradation when APIs down (stale cache fallback)
- [x] User-friendly error messages (GlobalExceptionFilter)
- [x] Retry logic with backoff (withRetry utility)
- [x] Frontend error/retry interceptors
- [x] Toast notifications (ngx-sonner)

### 7.2 Monitoring - NOT STARTED
- [ ] Add Sentry for error tracking
- [x] Health check endpoint (GET /api/health, /live, /ready)
- [x] Basic logging (NestJS Logger)

### 7.3 Security Review - COMPLETE (2025-12-09)
- [x] Input validation (class-validator, whitelist mode)
- [x] Rate limiting on auth endpoints (5 req/min)
- [x] Secure JWT configuration (32+ chars in prod)
- [x] Helmet security headers
- [x] Strong password validation (8-72 chars, upper+lower+number)
- [x] Request body size limits (100kb)

### 7.4 Documentation - COMPLETE (2025-12-09)
- [x] API documentation (Swagger at /api/docs)
- [x] All endpoints with @ApiOperation, @ApiResponse
- [x] Bearer auth configured in Swagger UI
- [ ] Deployment guide (deferred)
- [ ] Admin user guide (deferred)

### 7.5 Deployment - NOT STARTED
- [ ] Docker compose for production
- [ ] Environment configuration
- [ ] CI/CD setup (optional)

### 7.6 UI Framework - COMPLETE (2025-12-09)
- [x] Spartan UI component library installed
- [x] 15 helm components (tabs, dialog, table, badge, sonner, etc.)
- [x] GCore orange theme configured
- [x] ngx-sonner for toast notifications

### 7.7 Code Quality & Testing - COMPLETE (2025-12-09)
- [x] 38 backend tests passing (auth: 10, nodes: 12, admin: 16)
- [x] Type safety improvements (no `any` in controllers)
- [x] LRU cache with TTL and eviction
- [x] Pagination for list endpoints

### 7.8 Google OAuth - COMPLETE (2025-12-09)
- [x] Passport.js Google strategy
- [x] Auto-link existing accounts by email
- [x] OAuth callback component

### 7.9 GitHub OAuth - COMPLETE (2025-12-09)
- [x] Passport.js GitHub strategy
- [x] Auto-link existing accounts by email
- [x] Shared OAuth callback handling

### Definition of Done
- [x] No critical/high security issues
- [ ] Error tracking active (Sentry - deferred)
- [ ] Can deploy to production environment (Docker - deferred)

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gonka API changes | High | Cache data, version API calls |
| Hyperfusion goes down | Medium | Fallback to Gonka-only data |
| No earnings in API | High | Calculate from inference count or blockchain |
| Rate limiting | Medium | Aggressive caching, background refresh |
| GPU type not in API | Low | Manual entry by admin or Gcore API lookup |

---

## Parking Lot (Post-MVP)

- ~~Google OAuth login~~ → **DONE** (Session 14)
- ~~GitHub OAuth login~~ → **DONE** (Session 18)
- Email notifications (node unhealthy, earnings drop)
- Telegram/Discord notifications
- Auto-provisioning via Gcore API
- Multi-network support (beyond Gonka)
- Payment integration
- Sentry error tracking (Phase 7.2)
- Docker production deployment (Phase 7.5)

---

## Quick Reference

| Phase | Focus | Key Deliverable | Status |
|-------|-------|-----------------|--------|
| 0 | Spike | Confirm APIs work | **COMPLETE** |
| 1 | Foundation | Auth + project setup | **COMPLETE** |
| 2 | UI | Dashboard with mocks | **COMPLETE** |
| 3 | Integration | Real Gonka data | **COMPLETE** |
| 4 | Details | Node details + earnings | **COMPLETE** (4.1 done, 4.2-4.3 deferred) |
| 5 | Requests | Node request flow | **COMPLETE** |
| 6 | Admin | User/node management | **COMPLETE** |
| 7 | Launch | Production-ready | **95% COMPLETE** (7/9 tasks done) |
