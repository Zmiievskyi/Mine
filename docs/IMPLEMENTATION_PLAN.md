# MineGNK Implementation Plan

**Last Updated**: 2025-12-08 (Session 4)
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

## Phase 4: Node Details & Earnings

**Goal**: Detailed view per node with historical data.

### 4.1 Node Details Page
- [ ] Tabs: Overview, Metrics, History
- [ ] Overview: status, GPU type, models, inference URL
- [ ] Metrics: inference count, missed rate, invalidation rate

### 4.2 Earnings History
- [ ] Store daily earnings snapshots in `earnings_history` table
- [ ] Backend job to calculate and store daily earnings
- [ ] Chart showing earnings over time (7/30 days)

### 4.3 Health Timeline
- [ ] Store status changes in history table
- [ ] Show timeline of healthy/unhealthy/jailed states

### Definition of Done
- [ ] User can view detailed info for each node
- [ ] Earnings chart shows historical data
- [ ] Status history is visible

### Dependencies
- Phase 3 complete
- Earnings calculation logic defined

---

## Phase 5: Request System

**Goal**: Users can request new nodes, support manages queue.

### 5.1 Add Node Request Form
- [ ] Form: GPU type, quantity, budget, comments
- [ ] Validation (required fields)
- [ ] Submit creates `support_request` record

### 5.2 User Request List
- [ ] Page showing user's requests
- [ ] Status badges (pending, in_progress, completed, rejected)

### 5.3 Admin: Request Management
- [ ] Admin sees all requests
- [ ] Can update status
- [ ] Can add internal notes

### Definition of Done
- [ ] User can submit node request
- [ ] User sees request status
- [ ] Admin can process requests

### Dependencies
- Phase 1 auth (admin role)

---

## Phase 6: Admin Panel

**Goal**: Admins manage users and node assignments.

### 6.1 Users Management
- [ ] List all users
- [ ] View user details
- [ ] Assign role (user/admin)

### 6.2 Node Assignment
- [ ] Interface to link node identifier to user
- [ ] Input: user email/ID + node identifier (gonka1...)
- [ ] Creates record in `user_nodes`
- [ ] Assigned node appears in user's dashboard

### 6.3 System Overview
- [ ] Total users, nodes, requests
- [ ] Recent activity log

### Definition of Done
- [ ] Admin can assign nodes to users
- [ ] User immediately sees assigned node
- [ ] Assignment audit trail (who assigned when)

### Dependencies
- Phase 3 (node data available)
- Phase 5 (requests exist)

---

## Phase 7: Polish & Launch

**Goal**: Production-ready release.

### 7.1 Error Handling & Fallbacks
- [ ] Graceful degradation when APIs down
- [ ] User-friendly error messages
- [ ] Retry logic with backoff

### 7.2 Monitoring
- [ ] Add Sentry for error tracking
- [ ] Health check endpoint
- [ ] Basic logging

### 7.3 Security Review
- [ ] Input validation (XSS, SQL injection)
- [ ] Rate limiting on auth endpoints
- [ ] Secure JWT configuration

### 7.4 Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Deployment guide
- [ ] Admin user guide

### 7.5 Deployment
- [ ] Docker compose for production
- [ ] Environment configuration
- [ ] CI/CD setup (optional)

### Definition of Done
- [ ] No critical/high security issues
- [ ] Error tracking active
- [ ] Can deploy to production environment

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

- Google OAuth login
- Email notifications (node unhealthy, earnings drop)
- Telegram/Discord notifications
- Auto-provisioning via Gcore API
- Multi-network support (beyond Gonka)
- Payment integration

---

## Quick Reference

| Phase | Focus | Key Deliverable | Status |
|-------|-------|-----------------|--------|
| 0 | Spike | Confirm APIs work | **COMPLETE** |
| 1 | Foundation | Auth + project setup | **COMPLETE** |
| 2 | UI | Dashboard with mocks | **COMPLETE** |
| 3 | Integration | Real Gonka data | **COMPLETE** |
| 4 | Details | Node details + earnings | Not Started |
| 5 | Requests | Node request flow | Not Started |
| 6 | Admin | User/node management | Not Started |
| 7 | Launch | Production-ready | Not Started |
