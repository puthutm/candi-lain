import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";

// Ensure environment variables are loaded
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(process.cwd(), ".env") });
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, {
  prepare: false,
});

export const db = drizzle(client);
export { client as postgresClient };
