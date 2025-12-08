# API Research Findings

**Date**: 2025-12-08
**Status**: API Spike Complete - Both APIs Working!

---

## Summary

| Source | API Available | Documentation | Priority |
|--------|--------------|---------------|----------|
| Gonka Network API | Yes | Partial | HIGH |
| Hyperfusion Tracker | Yes | GitHub README | HIGH |
| Hashiro | No public API | None | LOW (scraping only) |

---

## 1. Gonka Network API

### Base URLs
```
http://node1.gonka.ai:8000
http://node2.gonka.ai:8000
http://node3.gonka.ai:8000
https://node1.gonka.ai:8443  (HTTPS for models endpoint)
```

### Endpoints

#### GET `/v1/epochs/current/participants`
Returns all active participants in current epoch.

**Response Structure:**
```json
{
  "active_participants": {
    "participants": [
      {
        "index": "gonka1abc...",       // Gonka address (PRIMARY IDENTIFIER)
        "validator_key": "base64...",   // Base64-encoded public key
        "weight": 1000,                 // Voting weight
        "inference_url": "http://...",  // Node's inference endpoint
        "models": ["model-a", "model-b"], // Supported models
        "seed": {
          "participant": "gonka1...",
          "block_height": 12345,
          "signature": "hex..."
        }
      }
    ],
    "epoch_group_id": 42,
    "poc_start_block_height": 10000,
    "created_at_block_height": 10500
  },
  "addresses": ["GONKA1ABC...", "GONKA1XYZ..."],  // Uppercase hex
  "validators": [
    {
      "address": "...",
      "pub_key": "...",
      "voting_power": 1000,
      "proposer_priority": 0
    }
  ],
  "block": [...]  // Block metadata
}
```

#### GET `/v1/epochs/{epoch_id}/participants`
Same as above but for specific epoch.

#### GET `/api/v1/models` (port 8443, HTTPS)
List of available models.

### Node Identifiers
- **Primary**: `index` field (Gonka address, format: `gonka1...`)
- **Secondary**: `validator_key` (for consensus operations)
- **Host identification**: via `inference_url`

### Notes
- HTTP (not HTTPS) on port 8000
- No authentication required for read operations
- Data is real-time (current epoch)

---

## 2. Hyperfusion Tracker API (PRIMARY DATA SOURCE)

### Base URL
```
https://tracker.gonka.hyperfusion.io
```

### API Endpoints (VERIFIED WORKING)
```
GET /api/v1/hello              # Health check (200 OK)
GET /api/v1/inference/current  # Current epoch stats (200 OK)
```

### Response Structure (Verified 2025-12-08)

**GET /api/v1/inference/current**
```json
{
  "epoch_id": 105,
  "height": 1634323,
  "cached_at": "2025-12-08T13:56:38.900851",
  "is_current": true,
  "current_block_height": 1634323,
  "avg_block_time": 6.02,
  "participants": [...]  // 477 nodes
}
```

**Participant Object (THIS IS THE KEY DATA!):**
```json
{
  "index": "gonka1qzmhx83xnamk0uqup3lxpf2te9karrwjm9cjh7",
  "address": "gonka1qzmhx83xnamk0uqup3lxpf2te9karrwjm9cjh7",
  "weight": 3965,
  "inference_url": "http://93.119.168.43:8000",
  "status": "ACTIVE",
  "models": ["Qwen/Qwen3-235B-A22B-Instruct-2507-FP8"],

  "current_epoch_stats": {
    "inference_count": "6",
    "missed_requests": "0",
    "earned_coins": "3805",        // <-- EARNINGS IN GNK (smallest unit)
    "rewarded_coins": "0",
    "burned_coins": "0",
    "validated_inferences": "5",
    "invalidated_inferences": "0"
  },

  "is_jailed": false,
  "jailed_until": null,
  "node_healthy": true,
  "node_health_checked_at": "2025-12-08T13:55:10.619478",

  "missed_rate": 0,
  "invalidation_rate": 0,
  "participant_status": "ACTIVE"
}
```

### Field Mapping for MineGNK

| Our Need | Hyperfusion Field | Notes |
|----------|-------------------|-------|
| **Node ID** | `index` | Primary identifier |
| **Status** | `participant_status` | "ACTIVE", "JAILED" |
| **Is Jailed** | `is_jailed` | boolean |
| **Health** | `node_healthy` | boolean |
| **Models** | `models` | array |
| **Weight** | `weight` | voting power |
| **Inferences** | `current_epoch_stats.inference_count` | this epoch |
| **Missed** | `current_epoch_stats.missed_requests` | this epoch |
| **Earnings** | `current_epoch_stats.earned_coins` | GNK this epoch |
| **Validated** | `current_epoch_stats.validated_inferences` | |
| **Miss Rate** | `missed_rate` | 0-1 decimal |

### Sample Data (docs/api-samples/hyperfusion-inference.json)
Full response sample saved with 3 participants for reference.

### GitHub Repository
https://github.com/gonka-ai/gonka-tracker (Python, MIT license)

---

## 3. Hashiro

### URL
```
https://hashiro.tech/gonka
```

### Status
**No public API documented**. Frontend-only dashboard.

### Data Shown (via UI)
- Pool identifiers (wallet addresses: `gonka1...`)
- GPUs worldwide count
- Earnings (GNK tokens)
- Vesting schedules (180-day unlock)
- Pool funding status

### Potential Options
1. **Scraping** — fragile, not recommended
2. **Contact Hashiro** — request API access
3. **Skip for MVP** — use Gonka API + Hyperfusion only

---

## 4. Recommended Data Sources for MVP

### Primary (implement first)
1. **Gonka Network API** (`/v1/epochs/current/participants`)
   - Node list with identifiers
   - Active models
   - Weight/voting power

2. **Hyperfusion Tracker** (`/api/v1/inference/current`)
   - Health status
   - Jail status
   - Inference stats
   - Historical data

### Secondary (post-MVP)
3. **Hashiro** — only if they provide API access

---

## 5. Node Identifier Strategy

Based on research, use **Gonka address** (`index` field) as primary identifier:
- Format: `gonka1...` (Cosmos-style bech32)
- Consistent across Gonka API and Hyperfusion
- Used by Hashiro for pool wallets

### User-Node Mapping
```
user_nodes table:
  user_id    → internal user
  identifier → "gonka1abc..." (Gonka address)
  assigned_by → admin who linked
```

---

## 6. Resolved Questions

1. **Earnings data**: **SOLVED!**
   - Hyperfusion provides `earned_coins` per epoch in `current_epoch_stats`
   - Example: `"earned_coins": "3805"` (GNK smallest unit)

2. **Node health**: **SOLVED!**
   - Hyperfusion provides `node_healthy` (boolean)
   - Also: `is_jailed`, `jailed_until`, `participant_status`

3. **Rate limits**: Unknown but not blocking
   - Both APIs respond in <500ms
   - Cache with 2-5 min TTL should be safe

4. **Authentication**: None required
   - Both APIs are public read access

## Remaining Open Questions

1. **GPU type**: Not in API responses
   - Solution: Store manually when admin assigns node
   - Or query Gcore API by instance (future)

2. **Historical earnings**: Only current epoch available
   - Solution: Store daily snapshots in our DB
   - Run cron job at epoch end to capture `earned_coins`

3. **GNK unit conversion**: Need to confirm
   - Is `earned_coins: "3805"` = 3805 uGNK or 0.003805 GNK?

---

## 7. Next Steps

1. [x] Test actual API calls ✅
2. [x] Verify Hyperfusion response format ✅
3. [x] Determine earnings source ✅ (`earned_coins` in Hyperfusion)
4. [ ] Design caching strategy (TTL: 2-5 min)
5. [ ] Start Phase 1: NestJS + Angular setup
6. [ ] Implement Hyperfusion service in backend

---

## Sources

- [Gonka Network Node API](https://gonka.ai/host/network-node-api/)
- [Gonka GitHub](https://github.com/gonka-ai/gonka)
- [Gonka Tracker GitHub](https://github.com/gonka-ai/gonka-tracker)
- [Hashiro Gonka Pool](https://hashiro.tech/gonka)
