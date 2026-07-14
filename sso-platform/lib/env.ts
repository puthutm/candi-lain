import { z } from "zod";

/**
 * Environment variables schema with validation
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // JWT Configuration
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ALGORITHM: z.enum(["RS256"]).default("RS256"),
  JWT_ISSUER: z.string().default("urn:unsia:sso"),
  JWT_AUDIENCE: z.string().default("urn:unsia:platform"),

  // Token Expiration
  ACCESS_TOKEN_EXPIRY: z.coerce.number().default(3600),
  REFRESH_TOKEN_EXPIRY: z.coerce.number().default(2592000),
  ID_TOKEN_EXPIRY: z.coerce.number().default(3600),
  AUTHORIZATION_CODE_EXPIRY: z.coerce.number().default(600),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Session
  SESSION_SECRET: z.string().optional(),
  SESSION_MAX_AGE: z.coerce.number().default(86400),
  SESSION_COOKIE_SECURE: z.coerce.boolean().default(false),

  // Application
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  PASSWORD_MIN_LENGTH: z.coerce.number().default(8),

  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),

  // Admin
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().optional(),

  // Default password applied when an admin resets a user's password
  DEFAULT_RESET_PASSWORD: z.string().default("Sso@2026!default"),

  // Seed configuration: client IDs, secrets, and redirect URIs per platform
  SEED_SIAKAD_CLIENT_ID: z.string().default("siakad-platform"),
  SEED_SIAKAD_CLIENT_SECRET: z.string().default("siakad-platform-client-secret-key-2026"),
  SEED_SIAKAD_CALLBACK_URL: z.string().default("http://localhost:3003/api/auth/callback"),
  SEED_LMS_CLIENT_ID: z.string().default("lms-platform"),
  SEED_LMS_CLIENT_SECRET: z.string().default("lms-platform-client-secret-key-2026"),
  SEED_LMS_CALLBACK_URL: z.string().default("http://localhost:3004/api/auth/callback"),
  SEED_PMB_CLIENT_ID: z.string().default("pmb-platform"),
  SEED_PMB_CLIENT_SECRET: z.string().default("pmb-platform-client-secret-key-2026"),
  SEED_PMB_CALLBACK_URL: z.string().default("http://localhost:3002/api/auth/callback"),
  SEED_KEUANGAN_CLIENT_ID: z.string().default("keuangan-platform"),
  SEED_KEUANGAN_CLIENT_SECRET: z.string().default("keuangan-platform-client-secret-key-2026"),
  SEED_KEUANGAN_CALLBACK_URL: z.string().default("http://localhost:3005/api/auth/callback"),
  SEED_HRIS_CLIENT_ID: z.string().default("hris-platform"),
  SEED_HRIS_CLIENT_SECRET: z.string().default("hris-platform-client-secret-key-2026"),
  SEED_HRIS_CALLBACK_URL: z.string().default("http://localhost:3006/api/auth/callback"),

  // CORS
  ALLOWED_ORIGINS: z.string().optional(),

  // Redirect / Host controls
  ALLOWED_RETURN_TO_HOSTS: z.string().optional(),
  PUBLIC_BASE_URL: z.string().url().optional(),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

/**
 * Parse and validate environment variables
 */
function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Invalid environment variables:");
    if (error instanceof z.ZodError) {
      console.error(error.flatten().fieldErrors);
    }
    throw new Error("Failed to parse environment variables");
  }
}

/**
 * Validated environment variables
 */
export const env = parseEnv();

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === "production";

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === "development";

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === "test";
