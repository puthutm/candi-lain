#!/bin/sh
set -eu

run_migration() {
  SERVICE_DIR="$1"
  DB_NAME="$2"

  echo "==> Migrating ${SERVICE_DIR} (${DB_NAME})"

  cd "/workspace/${SERVICE_DIR}"

  if [ ! -d node_modules ]; then
    if [ -f package-lock.json ]; then
      npm ci
    elif [ -f pnpm-lock.yaml ]; then
      npm install -g pnpm
      pnpm install --no-frozen-lockfile
    else
      npm install
    fi
  fi
 
  if [ "${SERVICE_DIR}" = "sso-platform" ]; then
    echo "==> Ensuring all platform databases exist in PostgreSQL..."
    node -e "
      const postgres = require('postgres');
      const sql = postgres('postgresql://postgres:postgres@db:5432/postgres');
      const databases = ['sso_platform', 'reference_data', 'pmb_platform', 'siakad_platform', 'lms_platform', 'keuangan_platform', 'hris_platform', 'bank_konten_platform'];
      async function main() {
        for (const db of databases) {
          const exists = await sql\`SELECT 1 FROM pg_database WHERE datname = \${db}\`;
          if (exists.length === 0) {
            console.log('Creating database: ' + db);
            await sql.unsafe('CREATE DATABASE ' + db);
          }
        }
        await sql.end();
      }
      main().catch((err) => { console.error(err); process.exit(1); });
    "
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
