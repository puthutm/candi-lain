#!/bin/sh
set -eu

echo "==> Seeding Superadmin User for SSO Platform..."
cd "/workspace/sso-platform"

if [ ! -d node_modules ]; then
  echo "==> Installing dependencies..."
  if [ -f pnpm-lock.yaml ]; then
    npm install -g pnpm
    pnpm install --no-frozen-lockfile
  else
    npm install --legacy-peer-deps
  fi
fi

export DATABASE_URL="postgresql://postgres:postgres@db:5432/sso_platform"

echo "==> Running superadmin seeder..."
npx tsx lib/seed-superadmin.ts

echo "==> Superadmin seeding completed."
