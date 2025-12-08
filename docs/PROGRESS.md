# MineGNK Progress Tracker

**Last Updated**: 2025-12-08

---

## Current Status

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0: API Spike | **Complete** | 100% |
| Phase 1: Foundation | Not Started | 0% |
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

---

## Blockers

None currently.

---

## Next Actions

1. **Next**: Initialize NestJS backend (`/backend`)
2. **Then**: Initialize Angular frontend (`/frontend`)
3. **Then**: Set up PostgreSQL schema and migrations
4. **Then**: Build auth flow (register/login/JWT)

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
