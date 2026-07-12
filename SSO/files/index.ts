import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import * as relations from "./relations";

// Gunakan connection pool, bukan single client — penting untuk Next.js
// API routes/server actions yang berjalan sebagai banyak instance serverless.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX ?? 10),
});

export const db = drizzle(pool, {
  schema: { ...schema, ...relations },
});

export type Database = typeof db;
