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

# Step 2: Run database seeder (seed users, apps, multi-roles)
echo "==> [2/3] Running SSO database seeder (seed:pegawai-dosen)..."
npx tsx lib/seed-pegawai-dosen.ts || {
    echo "WARNING: Seeder encountered an issue. Continuing startup..."
}

# Step 3: Start Next.js server
echo "==> [3/3] Starting SSO Platform on port ${PORT:-3000}..."
exec "$@"
