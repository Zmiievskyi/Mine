# MineGNK Database Audit Report

**Date**: 2025-12-09
**Database**: PostgreSQL 16 (minegnk)
**Current Records**: 4 users, 1 user_node, 1 node_request

---

## Executive Summary

The current database schema implements basic user management, node assignment, and request handling functionality. However, it is **missing critical tables** for production-grade node monitoring and earnings tracking as specified in the DB_ARCHITECT_AGENT requirements.

### Status: INCOMPLETE

**Missing Tables**: 3 of 6 required tables
**Missing Indexes**: Multiple performance indexes
**Schema Gaps**: Node stats caching, earnings history, user preferences

---

## 1. Current Database Schema

### 1.1 Existing Tables

#### Table: `users`
```sql
Column       | Type                        | Nullable | Default
-------------|----------------------------|----------|------------------
id           | uuid                       | NO       | uuid_generate_v4()
email        | varchar                    | NO       |
password     | varchar                    | NO       |
name         | varchar                    | YES      |
role         | users_role_enum            | NO       | 'user'
isActive     | boolean                    | NO       | true
createdAt    | timestamp without time zone| NO       | now()
updatedAt    | timestamp without time zone| NO       | now()

Indexes:
- PRIMARY KEY (id)
- UNIQUE (email)

Enum: users_role_enum = ['user', 'admin']
```

#### Table: `user_nodes`
```sql
Column            | Type                        | Nullable | Default
------------------|----------------------------|----------|------------------
id                | uuid                       | NO       | uuid_generate_v4()
user_id           | uuid                       | NO       |
node_address      | varchar                    | NO       |
label             | varchar                    | YES      |
gpu_type          | varchar                    | YES      |
gcore_instance_id | varchar                    | YES      |
notes             | text                       | YES      |
is_active         | boolean                    | NO       | true
created_at        | timestamp without time zone| NO       | now()
updated_at        | timestamp without time zone| NO       | now()

Indexes:
- PRIMARY KEY (id)
- UNIQUE (node_address)

Foreign Keys:
- user_id REFERENCES users(id)
```

#### Table: `node_requests`
```sql
Column        | Type                        | Nullable | Default
--------------|----------------------------|----------|----------------------
id            | uuid                       | NO       | uuid_generate_v4()
user_id       | uuid                       | NO       |
gpu_type      | node_requests_gpu_type_enum| NO       |
gpu_count     | integer                    | NO       | 1
region        | varchar                    | YES      |
message       | text                       | YES      |
status        | node_requests_status_enum  | NO       | 'pending'
admin_notes   | text                       | YES      |
processed_by  | varchar                    | YES      |
processed_at  | timestamp without time zone| YES      |
created_at    | timestamp without time zone| NO       | now()
updated_at    | timestamp without time zone| NO       | now()

Indexes:
- PRIMARY KEY (id)

Foreign Keys:
- user_id REFERENCES users(id)

Enums:
- gpu_type_enum = ['3080', '4090', 'H100', 'H200']
- status_enum = ['pending', 'approved', 'rejected', 'completed']
```

---

## 2. Recommended Schema (From DB_ARCHITECT_AGENT Spec)

### Required Tables
1. **users** - User accounts (EXISTS - with gaps)
2. **nodes** - Node reference data (MISSING)
3. **user_nodes** - Links nodes to users (EXISTS - modified design)
4. **node_stats_cache** - Cached stats from trackers (MISSING)
5. **earnings_history** - Daily earnings per node (MISSING)
6. **support_requests** - Node requests (EXISTS as `node_requests` - with gaps)

---

## 3. Gap Analysis

### 3.1 Critical Missing Tables

#### MISSING: `nodes` Table
**Impact**: HIGH
**Description**: The recommended design separates node reference data into a dedicated table. Currently, `user_nodes` combines both node metadata AND user assignment, which:
- Prevents node sharing between multiple users
- Makes admin auditing difficult
- Complicates node lifecycle management

**Recommended Structure**:
```sql
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier VARCHAR(255) UNIQUE NOT NULL,
  identifier_type VARCHAR(50) NOT NULL CHECK (identifier_type IN ('wallet', 'node_id', 'operator', 'validator')),
  display_name VARCHAR(100),
  gpu_type VARCHAR(50),
  region VARCHAR(100),
  gcore_instance_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### MISSING: `node_stats_cache` Table
**Impact**: CRITICAL
**Description**: No caching layer for Gonka tracker data. Without this:
- Every API request hits external trackers (slow, rate-limited)
- No historical comparison of node health
- Cannot implement efficient dashboard queries
- No offline fallback if trackers are down

**Recommended Structure**:
```sql
CREATE TABLE node_stats_cache (
  node_id UUID PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
  status VARCHAR(50),
  earnings_day DECIMAL(20, 8),
  earnings_total DECIMAL(20, 8),
  uptime_percent DECIMAL(5, 2),
  tokens_per_sec DECIMAL(10, 2),
  jobs_day INTEGER,
  active_model VARCHAR(255),
  voting_weight DECIMAL(20, 8),
  source VARCHAR(50),
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_node_stats_fetched ON node_stats_cache(fetched_at);
```

#### MISSING: `earnings_history` Table
**Impact**: HIGH
**Description**: No persistent storage for historical earnings. Without this:
- Cannot render earnings charts over time
- Cannot calculate weekly/monthly trends
- Cannot verify earnings accuracy
- Lose data if cache is cleared

**Recommended Structure**:
```sql
CREATE TABLE earnings_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  earnings_gnk DECIMAL(20, 8) NOT NULL,
  source VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (node_id, date)
);

CREATE INDEX idx_earnings_node_date ON earnings_history(node_id, date DESC);
```

---

### 3.2 Existing Table Gaps

#### `users` Table - Missing Columns
**Missing Fields**:
- `telegram` VARCHAR(100) - For Telegram notifications
- `discord` VARCHAR(100) - For Discord notifications
- `currency_preference` VARCHAR(10) DEFAULT 'USD' - User's preferred currency

**Impact**: MEDIUM
**Recommendation**: Add columns in next migration

#### `user_nodes` Table - Design Mismatch
**Current Design**: Combines node metadata + user assignment
**Recommended Design**: Should only handle many-to-many relationship

**Comparison**:
```
Current:                      Recommended:
user_nodes {                  user_nodes {
  id (PK)                       user_id (FK to users)
  user_id (FK)                  node_id (FK to nodes)
  node_address                  assigned_at
  label                         assigned_by (FK to users)
  gpu_type                      PRIMARY KEY (user_id, node_id)
  gcore_instance_id           }
  notes
  is_active                   nodes {
  created_at                    id (PK)
  updated_at                    identifier (UNIQUE)
}                               identifier_type
                                display_name
                                gpu_type
                                region
                                gcore_instance_id
                                created_at
                              }
```

**Impact**: MEDIUM
**Recommendation**: Refactor when implementing `nodes` table (see Migration Strategy)

#### `node_requests` Table - Missing Fields
**Missing Fields**:
- `type` - Request type (new_node, support, other)
- `budget` - User's budget for the request
- `network` - Target network (default: 'gonka')
- `assigned_to` - Admin responsible for the request

**Current Limitation**:
- `processed_by` is VARCHAR (should be UUID FK to users)

**Impact**: LOW
**Recommendation**: Add in next iteration

---

### 3.3 Missing Indexes

Performance-critical indexes not present:

#### `user_nodes` Table
```sql
CREATE INDEX idx_user_nodes_user_id ON user_nodes(user_id);
CREATE INDEX idx_user_nodes_active ON user_nodes(is_active) WHERE is_active = true;
```

#### `node_requests` Table
```sql
CREATE INDEX idx_requests_user_id ON node_requests(user_id);
CREATE INDEX idx_requests_status ON node_requests(status);
CREATE INDEX idx_requests_created_at ON node_requests(created_at DESC);
```

**Impact**: MEDIUM (becomes HIGH with >1000 records)
**Recommendation**: Add immediately

---

## 4. Architecture Design Comparison

### Current vs. Recommended

| Aspect | Current Implementation | Recommended Design |
|--------|----------------------|-------------------|
| **Node Data** | Embedded in `user_nodes` | Separate `nodes` table |
| **Stats Caching** | None (live API calls) | `node_stats_cache` with TTL |
| **Earnings History** | None | `earnings_history` table |
| **Node Sharing** | Not supported | Many-to-many via `user_nodes` |
| **Admin Audit** | Partial (`assigned_by` missing) | Full audit trail |
| **User Preferences** | Minimal | Telegram, Discord, currency |

---

## 5. Migration Strategy

### Phase 1: Add Missing Core Tables (CRITICAL)

**Priority**: HIGH
**Estimated Effort**: 4-6 hours

1. Create `nodes` table
2. Create `node_stats_cache` table
3. Create `earnings_history` table
4. Migrate existing `user_nodes` data:
   ```sql
   -- For each record in user_nodes:
   -- 1. INSERT INTO nodes (identifier, gpu_type, gcore_instance_id, ...)
   -- 2. UPDATE user_nodes SET node_id = new_node_id
   -- 3. DROP old columns from user_nodes
   ```

**Risk**: Data loss if migration fails
**Mitigation**: Backup database before migration, test on staging first

### Phase 2: Refactor `user_nodes` Table

**Priority**: MEDIUM
**Estimated Effort**: 2-3 hours

1. Add `node_id` UUID column
2. Add `assigned_by` UUID column (FK to users)
3. Migrate data to `nodes` table
4. Drop redundant columns (node_address, gpu_type, gcore_instance_id, notes)
5. Update TypeORM entity and services

**Breaking Change**: YES - API responses will change
**Mitigation**: Version API or coordinate with frontend team

### Phase 3: Add Missing Columns

**Priority**: LOW
**Estimated Effort**: 1-2 hours

1. Add to `users`: telegram, discord, currency_preference
2. Add to `node_requests`: type, budget, network, assigned_to (UUID)
3. Change `processed_by` from VARCHAR to UUID

### Phase 4: Add Performance Indexes

**Priority**: MEDIUM
**Estimated Effort**: 30 minutes

Add all indexes listed in section 3.3

---

## 6. TypeORM Entity Changes Required

### New Entities to Create

#### `Node` Entity
```typescript
// backend/src/modules/nodes/entities/node.entity.ts
@Entity('nodes')
export class Node {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  identifier: string;

  @Column({ name: 'identifier_type' })
  identifierType: 'wallet' | 'node_id' | 'operator' | 'validator';

  @Column({ name: 'display_name', nullable: true })
  displayName: string;

  @Column({ name: 'gpu_type', nullable: true })
  gpuType: string;

  @Column({ nullable: true })
  region: string;

  @Column({ name: 'gcore_instance_id', nullable: true })
  gcoreInstanceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => UserNode, userNode => userNode.node)
  userNodes: UserNode[];

  @OneToOne(() => NodeStatsCache, stats => stats.node)
  stats: NodeStatsCache;

  @OneToMany(() => EarningsHistory, earnings => earnings.node)
  earningsHistory: EarningsHistory[];
}
```

#### `NodeStatsCache` Entity
```typescript
@Entity('node_stats_cache')
export class NodeStatsCache {
  @PrimaryGeneratedColumn('uuid')
  nodeId: string;

  @OneToOne(() => Node, node => node.stats)
  @JoinColumn({ name: 'node_id' })
  node: Node;

  @Column({ nullable: true })
  status: string;

  @Column({ name: 'earnings_day', type: 'decimal', precision: 20, scale: 8, nullable: true })
  earningsDay: number;

  @Column({ name: 'earnings_total', type: 'decimal', precision: 20, scale: 8, nullable: true })
  earningsTotal: number;

  @Column({ name: 'uptime_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  uptimePercent: number;

  @Column({ name: 'tokens_per_sec', type: 'decimal', precision: 10, scale: 2, nullable: true })
  tokensPerSec: number;

  @Column({ name: 'jobs_day', nullable: true })
  jobsDay: number;

  @Column({ name: 'active_model', nullable: true })
  activeModel: string;

  @Column({ name: 'voting_weight', type: 'decimal', precision: 20, scale: 8, nullable: true })
  votingWeight: number;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'fetched_at' })
  fetchedAt: Date;
}
```

#### `EarningsHistory` Entity
```typescript
@Entity('earnings_history')
export class EarningsHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'node_id' })
  nodeId: string;

  @ManyToOne(() => Node, node => node.earningsHistory)
  @JoinColumn({ name: 'node_id' })
  node: Node;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'earnings_gnk', type: 'decimal', precision: 20, scale: 8 })
  earningsGnk: number;

  @Column({ nullable: true })
  source: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### Entities to Modify

#### `UserNode` Entity - Refactor to Join Table
```typescript
// Current: Contains node metadata
// After Phase 2: Only contains relationship

@Entity('user_nodes')
export class UserNode {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @PrimaryColumn({ name: 'node_id' })
  nodeId: string;

  @ManyToOne(() => User, user => user.nodes)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Node, node => node.userNodes)
  @JoinColumn({ name: 'node_id' })
  node: Node;

  @Column({ name: 'assigned_at' })
  assignedAt: Date;

  @Column({ name: 'assigned_by', nullable: true })
  assignedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser: User;
}
```

---

## 7. Data Consistency Considerations

### Current Issues

1. **No Node Uniqueness**: Multiple `user_nodes` rows can have same `node_address` (only UNIQUE constraint exists, but node data is duplicated if we want different labels)

2. **No Cache Invalidation**: Without `node_stats_cache`, stale data can be served indefinitely

3. **No Historical Verification**: Cannot verify if current earnings match historical accumulation

### Recommended Solutions

1. **Separate Node Identity**: Use `nodes` table for canonical node data
2. **TTL-Based Caching**: Check `fetched_at` in `node_stats_cache` before serving
3. **Daily Earnings Job**: Background job to populate `earnings_history` daily
4. **Audit Trail**: Track who assigned nodes via `assigned_by` column

---

## 8. SQL Migration Scripts

### Migration 1: Create Missing Tables

```sql
-- File: backend/src/migrations/1733760000000-CreateNodesTables.ts

-- Create nodes table
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier VARCHAR(255) UNIQUE NOT NULL,
  identifier_type VARCHAR(50) NOT NULL CHECK (identifier_type IN ('wallet', 'node_id', 'operator', 'validator')),
  display_name VARCHAR(100),
  gpu_type VARCHAR(50),
  region VARCHAR(100),
  gcore_instance_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create node_stats_cache table
CREATE TABLE node_stats_cache (
  node_id UUID PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
  status VARCHAR(50),
  earnings_day DECIMAL(20, 8),
  earnings_total DECIMAL(20, 8),
  uptime_percent DECIMAL(5, 2),
  tokens_per_sec DECIMAL(10, 2),
  jobs_day INTEGER,
  active_model VARCHAR(255),
  voting_weight DECIMAL(20, 8),
  source VARCHAR(50),
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_node_stats_fetched ON node_stats_cache(fetched_at);

-- Create earnings_history table
CREATE TABLE earnings_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  earnings_gnk DECIMAL(20, 8) NOT NULL,
  source VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (node_id, date)
);

CREATE INDEX idx_earnings_node_date ON earnings_history(node_id, date DESC);
```

### Migration 2: Migrate Existing Data

```sql
-- File: backend/src/migrations/1733760001000-MigrateUserNodesToNodes.ts

-- Step 1: Copy unique nodes from user_nodes to nodes table
INSERT INTO nodes (identifier, identifier_type, display_name, gpu_type, gcore_instance_id, created_at)
SELECT DISTINCT
  node_address as identifier,
  'wallet' as identifier_type,  -- Assuming all current nodes are wallet addresses
  label as display_name,
  gpu_type,
  gcore_instance_id,
  created_at
FROM user_nodes
WHERE is_active = true;

-- Step 2: Add temporary node_id column to user_nodes
ALTER TABLE user_nodes ADD COLUMN node_id_temp UUID;

-- Step 3: Populate node_id_temp by matching node_address
UPDATE user_nodes un
SET node_id_temp = n.id
FROM nodes n
WHERE un.node_address = n.identifier;

-- Step 4: Verify all records have node_id_temp (should return 0)
SELECT COUNT(*) FROM user_nodes WHERE node_id_temp IS NULL;

-- Step 5: Add assigned_by column
ALTER TABLE user_nodes ADD COLUMN assigned_by UUID;
```

### Migration 3: Refactor user_nodes to Join Table

```sql
-- File: backend/src/migrations/1733760002000-RefactorUserNodesToJoinTable.ts

-- Step 1: Create new user_nodes_new table with correct structure
CREATE TABLE user_nodes_new (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, node_id)
);

-- Step 2: Copy data to new table
INSERT INTO user_nodes_new (user_id, node_id, assigned_at, assigned_by)
SELECT
  user_id,
  node_id_temp as node_id,
  created_at as assigned_at,
  assigned_by
FROM user_nodes
WHERE node_id_temp IS NOT NULL;

-- Step 3: Drop old table and rename new one
DROP TABLE user_nodes;
ALTER TABLE user_nodes_new RENAME TO user_nodes;

-- Step 4: Create indexes
CREATE INDEX idx_user_nodes_user_id ON user_nodes(user_id);
CREATE INDEX idx_user_nodes_node_id ON user_nodes(node_id);
```

### Migration 4: Add Missing Indexes

```sql
-- File: backend/src/migrations/1733760003000-AddPerformanceIndexes.ts

-- Node requests indexes
CREATE INDEX idx_requests_user_id ON node_requests(user_id);
CREATE INDEX idx_requests_status ON node_requests(status);
CREATE INDEX idx_requests_created_at ON node_requests(created_at DESC);

-- Users indexes (if needed)
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(isActive) WHERE isActive = true;
```

### Migration 5: Add Missing Columns

```sql
-- File: backend/src/migrations/1733760004000-AddMissingColumns.ts

-- Add columns to users table
ALTER TABLE users ADD COLUMN telegram VARCHAR(100);
ALTER TABLE users ADD COLUMN discord VARCHAR(100);
ALTER TABLE users ADD COLUMN currency_preference VARCHAR(10) DEFAULT 'USD';

-- Add columns to node_requests table
ALTER TABLE node_requests ADD COLUMN type VARCHAR(50) DEFAULT 'new_node'
  CHECK (type IN ('new_node', 'support', 'other'));
ALTER TABLE node_requests ADD COLUMN budget VARCHAR(100);
ALTER TABLE node_requests ADD COLUMN network VARCHAR(50) DEFAULT 'gonka';
ALTER TABLE node_requests ADD COLUMN assigned_to UUID REFERENCES users(id);

-- Change processed_by from VARCHAR to UUID (requires data migration)
ALTER TABLE node_requests ADD COLUMN processed_by_uuid UUID REFERENCES users(id);
-- Manually map processed_by (email) to user UUIDs
UPDATE node_requests nr
SET processed_by_uuid = u.id
FROM users u
WHERE nr.processed_by = u.email;
-- Drop old column
ALTER TABLE node_requests DROP COLUMN processed_by;
ALTER TABLE node_requests RENAME COLUMN processed_by_uuid TO processed_by;
```

---

## 9. Testing Checklist

Before deploying migrations to production:

- [ ] Backup production database
- [ ] Test all migrations on local development database
- [ ] Test migrations on staging environment with production-like data
- [ ] Verify no data loss in user_nodes -> nodes migration
- [ ] Test API endpoints with new schema
- [ ] Update TypeORM entities and regenerate migrations
- [ ] Run integration tests
- [ ] Test rollback procedure for each migration
- [ ] Update API documentation (Swagger)
- [ ] Update frontend to handle new data structure

---

## 10. Rollback Strategy

Each migration should include a rollback script:

```typescript
// Example: Migration 1 Rollback
export class CreateNodesTables1733760000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ... creation logic
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_earnings_node_date`);
    await queryRunner.query(`DROP TABLE IF EXISTS earnings_history`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_node_stats_fetched`);
    await queryRunner.query(`DROP TABLE IF EXISTS node_stats_cache`);
    await queryRunner.query(`DROP TABLE IF EXISTS nodes`);
  }
}
```

---

## 11. Performance Impact Analysis

### Before Migrations
- Node data queries: Simple JOIN on user_nodes
- Stats queries: Real-time API calls to Gonka trackers (slow, unreliable)
- Earnings queries: Not possible (no historical data)

### After Migrations
- Node data queries: Slightly more complex (3-way JOIN: users -> user_nodes -> nodes)
- Stats queries: Fast reads from node_stats_cache (1-5 min stale)
- Earnings queries: Fast reads from earnings_history with date range indexes

### Expected Query Performance
```sql
-- Current: Get user's nodes with stats (NO CACHING)
SELECT * FROM user_nodes WHERE user_id = ?
-- Then fetch from external API for each node (N+1 problem)

-- After: Get user's nodes with cached stats
SELECT
  n.*,
  ns.status, ns.earnings_day, ns.uptime_percent
FROM users u
JOIN user_nodes un ON u.id = un.user_id
JOIN nodes n ON un.node_id = n.id
LEFT JOIN node_stats_cache ns ON n.id = ns.node_id
WHERE u.id = ?;
-- Single query, all data from database cache
```

**Estimated Improvement**: 10-50x faster (depending on network latency to Gonka trackers)

---

## 12. Recommendations Summary

### CRITICAL (Do Immediately)
1. Create `node_stats_cache` table - Required for performance and reliability
2. Create `earnings_history` table - Required for dashboard charts
3. Add performance indexes to `node_requests` and `user_nodes`
4. Implement caching layer in backend API

### HIGH PRIORITY (Next Sprint)
5. Create `nodes` table and refactor `user_nodes` to join table
6. Migrate existing data with zero downtime strategy
7. Update TypeORM entities and API responses
8. Add missing columns to `users` table (telegram, discord, currency_preference)

### MEDIUM PRIORITY (Future Iteration)
9. Add request type and assignment fields to `node_requests`
10. Implement background job for daily earnings history
11. Add data retention policy for old cache entries
12. Implement audit logging for admin actions

### LOW PRIORITY (Nice to Have)
13. Add database-level encryption for sensitive fields
14. Implement soft deletes for nodes and requests
15. Add full-text search indexes for user notes
16. Create database views for common queries

---

## 13. Next Steps

1. **Review this audit** with the team and prioritize missing features
2. **Create TypeORM migration files** for Phase 1 (critical tables)
3. **Test migrations** on local database with sample data
4. **Update backend services** to use node_stats_cache instead of live API calls
5. **Coordinate with frontend team** on API response changes
6. **Schedule deployment** with rollback plan

---

## Appendix A: Complete Recommended Schema (DDL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (enhanced)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  telegram VARCHAR(100),
  discord VARCHAR(100),
  currency_preference VARCHAR(10) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Nodes table (NEW)
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier VARCHAR(255) UNIQUE NOT NULL,
  identifier_type VARCHAR(50) NOT NULL CHECK (identifier_type IN ('wallet', 'node_id', 'operator', 'validator')),
  display_name VARCHAR(100),
  gpu_type VARCHAR(50),
  region VARCHAR(100),
  gcore_instance_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nodes_identifier ON nodes(identifier);
CREATE INDEX idx_nodes_gpu_type ON nodes(gpu_type);

-- User-Node assignments (refactored)
CREATE TABLE user_nodes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, node_id)
);

CREATE INDEX idx_user_nodes_user_id ON user_nodes(user_id);
CREATE INDEX idx_user_nodes_node_id ON user_nodes(node_id);

-- Node stats cache (NEW)
CREATE TABLE node_stats_cache (
  node_id UUID PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
  status VARCHAR(50),
  earnings_day DECIMAL(20, 8),
  earnings_total DECIMAL(20, 8),
  uptime_percent DECIMAL(5, 2),
  tokens_per_sec DECIMAL(10, 2),
  jobs_day INTEGER,
  active_model VARCHAR(255),
  voting_weight DECIMAL(20, 8),
  source VARCHAR(50),
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_node_stats_fetched ON node_stats_cache(fetched_at);
CREATE INDEX idx_node_stats_status ON node_stats_cache(status);

-- Earnings history (NEW)
CREATE TABLE earnings_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  earnings_gnk DECIMAL(20, 8) NOT NULL,
  source VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (node_id, date)
);

CREATE INDEX idx_earnings_node_date ON earnings_history(node_id, date DESC);
CREATE INDEX idx_earnings_date ON earnings_history(date DESC);

-- Node requests (enhanced)
CREATE TABLE node_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'new_node' CHECK (type IN ('new_node', 'support', 'other')),
  gpu_type VARCHAR(50),
  gpu_count INTEGER DEFAULT 1,
  region VARCHAR(100),
  budget VARCHAR(100),
  network VARCHAR(50) DEFAULT 'gonka',
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  assigned_to UUID REFERENCES users(id),
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_requests_user_id ON node_requests(user_id);
CREATE INDEX idx_requests_status ON node_requests(status);
CREATE INDEX idx_requests_created_at ON node_requests(created_at DESC);
CREATE INDEX idx_requests_assigned_to ON node_requests(assigned_to);
```

---

## Appendix B: Entity Relationship Diagram

```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │
│ email (UQ)   │
│ password     │
│ role         │
│ telegram     │
│ discord      │
│ currency_pref│
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼────────┐         ┌──────────────┐
│  user_nodes   │ N:1     │    nodes     │
├───────────────┤────────►├──────────────┤
│ user_id (FK)  │         │ id (PK)      │
│ node_id (FK)  │         │ identifier   │
│ assigned_at   │         │ gpu_type     │
│ assigned_by   │         │ region       │
└───────────────┘         └──────┬───────┘
                                 │
                    ┌────────────┴──────────────┐
                    │                           │
                    │ 1:1                       │ 1:N
                    │                           │
         ┌──────────▼─────────┐    ┌───────────▼──────────┐
         │ node_stats_cache   │    │  earnings_history    │
         ├────────────────────┤    ├──────────────────────┤
         │ node_id (PK, FK)   │    │ id (PK)              │
         │ status             │    │ node_id (FK)         │
         │ earnings_day       │    │ date                 │
         │ earnings_total     │    │ earnings_gnk         │
         │ uptime_percent     │    │ source               │
         │ fetched_at         │    └──────────────────────┘
         └────────────────────┘

┌─────────────────┐
│  node_requests  │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ gpu_type        │
│ status          │
│ assigned_to (FK)│
│ processed_by(FK)│
└─────────────────┘
       │
       │ N:1
       │
       ▼
    users
```

---

**Report Generated By**: DB_ARCHITECT_AGENT
**Contact**: For questions or clarifications, refer to `/Users/anton/Documents/code/gonka/.claude/agents/db_architect_agent.md`
