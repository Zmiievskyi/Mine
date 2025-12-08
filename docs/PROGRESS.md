# MineGNK Progress Tracker

**Last Updated**: 2025-12-08

---

## Current Status

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0: API Spike | **Complete** | 100% |
| Phase 1: Foundation | **In Progress** | 20% |
| Phase 2: Dashboard (Mock) | Not Started | 0% |
| Phase 3: Gonka Integration | Not Started | 0% |
| Phase 4: Node Details | Not Started | 0% |
| Phase 5: Request System | Not Started | 0% |
| Phase 6: Admin Panel | Not Started | 0% |
| Phase 7: Polish & Launch | Not Started | 0% |

---

## Phase 0: API Spike - COMPLETE

### Completed
- [x] Research Gonka Network API endpoints
- [x] Research Hyperfusion tracker API
- [x] Research Hashiro (no public API found)
- [x] Document findings in `docs/API_RESEARCH.md`
- [x] Create implementation plan
- [x] Test actual API calls with Node.js scripts
- [x] Save response samples to `docs/api-samples/`
- [x] Verify data fields meet MVP requirements

### Key Findings
- **477 active nodes** in current epoch
- **Hyperfusion API** provides everything we need:
  - Node status, health, jail status
  - Earnings (`earned_coins`)
  - Inference stats
  - Models list
- **Response time**: Gonka ~480ms, Hyperfusion ~145ms
- **No auth required** for either API

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12-08 | Use `gonka1...` address as primary node identifier | Consistent across Gonka API and Hyperfusion |
| 2025-12-08 | Skip Hashiro for MVP | No public API, would require scraping |
| 2025-12-08 | Hyperfusion as primary data source | Has earnings, health, all needed fields |
| 2025-12-08 | Start with API spike before building UI | Reduce risk - validate data first |
| 2025-12-08 | Use Angular 18 + Tailwind CSS (minimal) for frontend | Modern stack, easy to restyle later |
| 2025-12-08 | Logic-first approach: skeleton + auth before styling | Waiting for Gcore UI Kit access |
| 2025-12-08 | Work in `feature/frontend-skeleton` branch | Safe experimentation, easy rollback |

---

## Blockers

None currently.

---

## Next Actions

1. ~~Initialize Angular frontend (`/frontend`)~~ **DONE**
2. **Current**: Set up project structure (core, features, layout)
3. **Then**: Create auth module (JWT service, guards, login/register pages)
4. **Then**: Create layout (header, sidebar)
5. **Then**: Create dashboard skeleton
6. **Then**: Initialize NestJS backend (`/backend`)
7. **Then**: Set up PostgreSQL schema and migrations

---

## Phase 1: Foundation - IN PROGRESS

### Branch: `feature/frontend-skeleton`

### Approach
**Logic-first development**: Build skeleton and business logic without heavy styling.
When Gcore UI Kit access is granted, apply styles on top.

### Completed
- [x] Create Angular 18 project with routing
- [ ] Setup Tailwind CSS (minimal, for layout only)
- [ ] Project structure (core, features, shared, layout)
- [ ] Auth module (JWT service, guards)
- [ ] Login/Register pages
- [ ] Layout (header, sidebar)
- [ ] Dashboard skeleton
- [ ] Nodes list skeleton

### UI Kit Status
- **Gcore UI Kit**: Access requested, waiting for approval
- **Fallback**: Tailwind CSS for basic layout
- **Plan**: Replace native elements with `<gc-*>` components when kit available

---

## Done This Session (2025-12-08)

- Created `docs/API_RESEARCH.md` with full API documentation
- Created `docs/IMPLEMENTATION_PLAN.md` with 8-phase plan
- Created `docs/PROGRESS.md` (this file)
- Created `spike/api-test.mjs` - API testing script
- Created `spike/save-samples.mjs` - Sample saving script
- Saved API samples to `docs/api-samples/`:
  - `gonka-participants.json`
  - `hyperfusion-inference.json`
  - `gonka-epochs-latest.json`
- **Validated both APIs work and provide needed data**

---

## Metrics

| Metric | Value |
|--------|-------|
| Lines of code | 0 |
| API endpoints implemented | 0 |
| Pages built | 0 |
| Tests passing | N/A |

---

## Notes

### API Data Strategy

**Hyperfusion** (`tracker.gonka.hyperfusion.io`) - PRIMARY:
- `/api/v1/inference/current` - all node data
- Has: earnings, health, status, models, inference stats
- Response: ~145ms, no auth needed

**Gonka API** (`node1.gonka.ai:8000`) - BACKUP:
- `/v1/epochs/current/participants` - node list
- Response: ~480ms
- Useful for `ml_nodes` breakdown

**Hashiro** - SKIP for MVP (no public API)

### Caching
- TTL: 2-5 minutes
- Store daily earnings snapshots for history

### Manual Data
- GPU type: admin enters when assigning node
