#!/bin/sh
set -e

echo "==> Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL (max 30 seconds)
RETRIES=30
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-minegnk}" > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "Waiting for PostgreSQL... ($RETRIES retries left)"
  RETRIES=$((RETRIES-1))
  sleep 1
done

if [ $RETRIES -eq 0 ]; then
  echo "ERROR: PostgreSQL did not become ready in time"
  exit 1
fi

echo "==> PostgreSQL is ready!"

echo "==> Running database migrations..."
npm run migration:run:prod

echo "==> Migrations complete. Starting application..."
exec node dist/src/main.js
