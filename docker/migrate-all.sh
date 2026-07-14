#!/bin/sh
set -eu

run_migration() {
  SERVICE_DIR="$1"
  DB_NAME="$2"

  echo "==> Migrating ${SERVICE_DIR} (${DB_NAME})"

  cd "/workspace/${SERVICE_DIR}"

  if [ -f package-lock.json ]; then
    npm ci
  elif [ -f pnpm-lock.yaml ]; then
    npm install -g pnpm
    pnpm install --frozen-lockfile
  else
    npm install
  fi

  export DATABASE_URL="postgresql://postgres:postgres@db:5432/${DB_NAME}"

  npx drizzle-kit generate
  npx drizzle-kit migrate

  echo "==> Done ${SERVICE_DIR}"
}

run_migration "sso-platform" "sso_platform"
run_migration "reference-data" "reference_data"
run_migration "pmb-platform" "pmb_platform"
run_migration "siakad-platform" "siakad_platform"
run_migration "lms-platform" "lms_platform"
run_migration "keuangan-platform" "keuangan_platform"
run_migration "hris-platform" "hris_platform"
run_migration "bank-konten-platform" "bank_konten_platform"

echo "All migrations completed."
