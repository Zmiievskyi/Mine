# Database Migrations

This directory contains TypeORM migrations for the MineGNK database schema.

## Overview

These migrations implement the database improvements outlined in the Database Audit Report, adding critical tables for node tracking, stats caching, and earnings history.

## Migration Files

### 1. CreateUserTables (1733759000000)
Creates the core user-related tables and enums. **Must run first** as other tables depend on `users`.

**Tables Created:**
- `users` - User accounts (email, password, OAuth IDs, role)
- `user_nodes` - Links users to Gonka nodes
- `node_requests` - User requests for new GPU nodes

**Enums Created:**
- `users_role_enum` - (user, admin)
- `users_provider_enum` - (local, google, github)
- `node_requests_gpu_type_enum` - (A100, H100, H200)
- `node_requests_status_enum` - (pending, approved, rejected, completed)

**Purpose:** Establishes the foundation for user management and node assignment.

### 3. CreateNodesTable (1733760000000)
Creates the `nodes` table to store canonical node reference data.

**Tables Created:**
- `nodes` - Node reference data with identifier, GPU type, region, etc.

**Indexes:**
- `idx_nodes_identifier` - For fast node lookups by identifier
- `idx_nodes_gpu_type` - For filtering nodes by GPU type

**Purpose:** Separates node identity from user assignments, enabling:
- Multiple users to share access to a node
- Node lifecycle management independent of users
- Cleaner admin audit trail

### 4. CreateNodeStatsCacheTable (1733760001000)
Creates the `node_stats_cache` table for caching Gonka tracker data.

**Tables Created:**
- `node_stats_cache` - Cached statistics from Gonka trackers

**Indexes:**
- `idx_node_stats_fetched` - For TTL-based cache invalidation
- `idx_node_stats_status` - For filtering by node status

**Purpose:** Eliminates the need to hit external APIs on every request:
- Improves API response times (10-50x faster)
- Reduces dependency on external tracker availability
- Enables offline fallback if trackers are down
- Recommended cache TTL: 1-5 minutes

### 5. CreateEarningsHistoryTable (1733760002000)
Creates the `earnings_history` table for historical earnings tracking.

**Tables Created:**
- `earnings_history` - Daily earnings per node

**Indexes:**
- `idx_earnings_node_date` - Composite index for node + date queries
- `idx_earnings_date` - For time-based queries across all nodes

**Constraints:**
- `uq_earnings_node_date` - Unique constraint on (node_id, date)

**Purpose:** Enables:
- Earnings trend charts over time
- Weekly/monthly earnings summaries
- Historical verification of earnings accuracy
- Data retention even if cache is cleared

### 6. AddPerformanceIndexes (1733760003000)
Adds performance indexes to existing tables.

**Indexes Added:**
- `user_nodes`:
  - `idx_user_nodes_user_id` - For user's node lookups
  - `idx_user_nodes_active` - Partial index for active nodes only
- `node_requests`:
  - `idx_requests_user_id` - For user's request history
  - `idx_requests_status` - For filtering by status
  - `idx_requests_created_at` - For sorting by creation date
- `users`:
  - `idx_users_role` - For role-based filtering
  - `idx_users_is_active` - Partial index for active users only

**Purpose:** Improves query performance, especially with >1000 records.

## Running Migrations

### Prerequisites
1. Ensure PostgreSQL is running:
   ```bash
   docker-compose up -d
   ```

2. Install dependencies (if not already installed):
   ```bash
   cd backend
   npm install
   ```

### Run All Pending Migrations
```bash
npm run migration:run
```

### Show Migration Status
```bash
npm run migration:show
```

### Revert Last Migration
```bash
npm run migration:revert
```

### Generate New Migration (from entity changes)
```bash
npm run migration:generate -- src/migrations/MigrationName
```

## Migration Order

**IMPORTANT:** Migrations must be run in this exact order:

1. **CreateUserTables** (creates `users`, `user_nodes`, `node_requests` + enums)
2. CreateNodesTable (creates `nodes` table)
3. CreateNodeStatsCacheTable (references `nodes`)
4. CreateEarningsHistoryTable (references `nodes`)
5. AddPerformanceIndexes (adds indexes to existing tables)

TypeORM runs migrations in timestamp order automatically.

## Fresh Database Setup (Production)

### Option 1: Docker (Recommended)

Migrations run **automatically** when using Docker:

```bash
# Clone repo on new machine
git clone <repo> && cd gonka

# Create .env file
cp .env.example .env
# Edit JWT_SECRET and other variables

# Start everything (migrations run automatically)
docker-compose -f docker-compose.prod.yml up -d --build
```

The `docker-entrypoint.sh` script:
1. Waits for PostgreSQL to be ready
2. Runs `npm run migration:run:prod`
3. Starts the application

### Option 2: Manual

For non-Docker deployments:

```bash
# 1. Ensure database exists and is accessible
psql -U minegnk -d minegnk -c "SELECT 1"

# 2. Run all migrations
cd backend && npm run migration:run

# 3. Verify tables created
npm run migration:show
```

**Note:** The `ormconfig.ts` automatically detects `NODE_ENV=production` and uses compiled `.js` files from `dist/`.

## Database Schema After Migrations

```
users
  |
  ├── user_nodes
  |      └── indexed on: user_id, is_active
  |
  └── node_requests
         └── indexed on: user_id, status, created_at

nodes
  |
  ├── node_stats_cache (1:1)
  |      └── indexed on: fetched_at, status
  |
  └── earnings_history (1:N)
         └── indexed on: (node_id, date), date
```

## Future Migrations (Phase 2)

The next phase will refactor the `user_nodes` table to be a pure join table:

**Current Design:**
```
user_nodes {
  id, user_id, node_address, label, gpu_type,
  gcore_instance_id, notes, is_active
}
```

**Target Design:**
```
user_nodes {
  user_id (FK to users),
  node_id (FK to nodes),
  assigned_at,
  assigned_by (FK to users),
  PRIMARY KEY (user_id, node_id)
}
```

This will require:
1. Migrating existing `user_nodes` data to `nodes` table
2. Creating new join table structure
3. Updating TypeORM entities and services
4. Coordinating with frontend for API changes

## Rollback Strategy

Each migration includes a `down()` method for rollback:

```typescript
public async down(queryRunner: QueryRunner): Promise<void> {
  // Drops tables, indexes, and columns in reverse order
}
```

To rollback the last migration:
```bash
npm run migration:revert
```

**WARNING:** Rolling back will delete data in the affected tables. Always backup before reverting in production.

## Testing Checklist

Before deploying to production:

- [ ] Run migrations on local development database
- [ ] Verify no data loss
- [ ] Test API endpoints with new schema
- [ ] Run integration tests
- [ ] Test rollback procedure
- [ ] Update API documentation (Swagger)
- [ ] Backup production database
- [ ] Test on staging with production-like data
- [ ] Update frontend to handle new data structure (if needed)

## Environment Variables

Migrations use the same database configuration as the application:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=minegnk
DB_PASSWORD=minegnk
DB_DATABASE=minegnk
```

Configuration is loaded from:
1. `.env` file (if exists)
2. `ormconfig.ts` (fallback to defaults)

## TypeORM CLI Commands

The migration scripts use TypeORM's CLI under the hood:

- `migration:run` → `typeorm-ts-node-commonjs migration:run -d ormconfig.ts`
- `migration:revert` → `typeorm-ts-node-commonjs migration:revert -d ormconfig.ts`
- `migration:show` → `typeorm-ts-node-commonjs migration:show -d ormconfig.ts`
- `migration:generate` → `typeorm-ts-node-commonjs migration:generate -d ormconfig.ts`

## Troubleshooting

### Error: "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### Error: "relation already exists"
The migration has already been run. Check status:
```bash
npm run migration:show
```

### Error: "column already exists"
The column may have been added manually or via synchronize mode. Either:
1. Revert the migration and fix it
2. Modify the migration to check if column exists first

### Synchronize Mode
**WARNING:** Do not use `synchronize: true` in production. It can lead to data loss.

In development, migrations and synchronize can conflict. Choose one:
- Use migrations (recommended) → set `synchronize: false`
- Use auto-sync (quick prototyping) → delete migrations

## Reference

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [Database Audit Report](/Users/anton/Documents/code/gonka/docs/DATABASE_AUDIT_REPORT.md)
- [NestJS TypeORM Guide](https://docs.nestjs.com/techniques/database)

## Support

For questions or issues with migrations, refer to:
- DB_ARCHITECT_AGENT documentation
- Database Audit Report
- TypeORM migration documentation
