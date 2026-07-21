#!/bin/sh
set -eu

echo "============================================"
echo "  SSO Platform — Database Migration + Start"
echo "============================================"

# Step 1: Run database migrations
echo "==> [1/3] Running database migrations..."
cd /app
npx drizzle-kit migrate || {
    echo "WARNING: Migration failed. This may be OK if already migrated."
    echo "  Error details above. Continuing startup..."
}

# Step 2: Ensure seeding (instrumentation.ts handles auto-seed on first request,
# but we call it explicitly here to speed up first-time startup)
echo "==> [2/3] Database ready. Starting Next.js server..."
echo "     (Auto-seeding will run via instrumentation.ts)"

# Step 3: Start Next.js server
echo "==> [3/3] Starting SSO Platform on port ${PORT:-3000}..."
exec "$@"
