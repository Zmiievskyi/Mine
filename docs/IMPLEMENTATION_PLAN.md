# MineGNK Implementation Plan

**Last Updated**: 2025-12-08
**Based on**: PRD.md, API_RESEARCH.md

---

## Overview

This plan is structured around **reducing risk early**. The biggest unknowns are:
1. Can we get useful data from Gonka/Hyperfusion APIs?
2. What identifier reliably links users to nodes?

Therefore, Phase 0 (Spike) validates these before building full features.

---

## Phase 0: API Spike (Risk Reduction)

**Goal**: Prove we can fetch and display real node data.

### Tasks
- [ ] Create minimal Node.js script to call Gonka API
- [ ] Call `http://node1.gonka.ai:8000/v1/epochs/current/participants`
- [ ] Call Hyperfusion `https://tracker.gonka.hyperfusion.io/api/v1/inference/current`
- [ ] Log response structures to console
- [ ] Identify which fields map to our needs (see mapping below)

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
- [ ] Successfully fetch data from both APIs
- [ ] Document actual response samples in `docs/api-samples/`
- [ ] Identify gaps (e.g., earnings, GPU type)

### Dependencies
- None (standalone scripts)

### Estimated Effort
Small (few hours)

---

## Phase 1: Foundation

**Goal**: Project scaffolding with auth and basic layout.

### 1.1 Backend Setup (NestJS)
- [ ] Initialize NestJS project in `/backend`
- [ ] Configure PostgreSQL connection (TypeORM)
- [ ] Create database schema (users, nodes, user_nodes, support_requests)
- [ ] Run migrations

### 1.2 Authentication
- [ ] Implement `/auth/register` (email + password)
- [ ] Implement `/auth/login` (returns JWT)
- [ ] Implement `/auth/me` (returns current user)
- [ ] Add JWT guard for protected routes
- [ ] Create roles (user, admin)

### 1.3 Frontend Setup (Angular)
- [ ] Initialize Angular 18 project in `/frontend`
- [ ] Install `@gcore/ui-kit` v14.22.4
- [ ] Configure routing (login, dashboard, nodes, profile)
- [ ] Create auth service and guards
- [ ] Build login/register pages with GCore UI Kit

### Definition of Done
- [ ] User can register, login, see protected dashboard
- [ ] JWT stored in localStorage/cookie
- [ ] Angular routing works with auth guard

### Dependencies
- Docker (PostgreSQL)
- Node.js 18+

---

## Phase 2: Dashboard with Mock Data

**Goal**: Build UI structure with static/mock data.

### 2.1 Dashboard Page
- [ ] Summary cards: Active Nodes, Total GPUs, Monthly Earnings, Pending Requests
- [ ] Earnings chart (mock data, use GCore chart component)
- [ ] Node overview table (5 mock nodes)
- [ ] Recent activity feed (mock)

### 2.2 My Nodes List
- [ ] Table with columns: Node ID, Status, GPU, Earnings/day
- [ ] Status badges (healthy/unhealthy/jailed)
- [ ] Click row ’ navigate to details (placeholder)

### 2.3 User Profile
- [ ] Display email, telegram, discord
- [ ] Edit form with validation
- [ ] Save to backend

### Definition of Done
- [ ] All pages render with mock data
- [ ] GCore UI Kit components used consistently
- [ ] Responsive layout (desktop + tablet)

### Dependencies
- Phase 1 complete

---

## Phase 3: Gonka Integration

**Goal**: Replace mock data with real API data.

### 3.1 Backend: Gonka Service
- [ ] Create `GonkaService` in NestJS
- [ ] Fetch from `/v1/epochs/current/participants`
- [ ] Parse response, extract node data
- [ ] Handle errors (timeout, 500, etc.)

### 3.2 Backend: Hyperfusion Service
- [ ] Create `HyperfusionService`
- [ ] Fetch from `/api/v1/inference/current`
- [ ] Merge with Gonka data by `participant_index`

### 3.3 Backend: Caching Layer
- [ ] Cache aggregated node data in PostgreSQL (or Redis)
- [ ] TTL: 2-5 minutes
- [ ] Background job to refresh cache (cron)

### 3.4 Backend: Node Aggregation Endpoint
- [ ] Create `/nodes/my` endpoint
- [ ] Filter nodes by user's assigned identifiers (from `user_nodes`)
- [ ] Return merged data from cache

### 3.5 Frontend: Connect to Real Data
- [ ] Update dashboard to call `/nodes/my`
- [ ] Update nodes list with real data
- [ ] Show loading states and error handling

### Definition of Done
- [ ] Dashboard shows real node data from Gonka network
- [ ] Data refreshes on page load (within cache TTL)
- [ ] Errors displayed gracefully (tracker down, etc.)

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

| Phase | Focus | Key Deliverable |
|-------|-------|-----------------|
| 0 | Spike | Confirm APIs work |
| 1 | Foundation | Auth + project setup |
| 2 | UI | Dashboard with mocks |
| 3 | Integration | Real Gonka data |
| 4 | Details | Node details + earnings |
| 5 | Requests | Node request flow |
| 6 | Admin | User/node management |
| 7 | Launch | Production-ready |
