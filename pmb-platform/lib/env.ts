import { z } from "zod";

/**
 * Environment variables schema with validation for PMB Platform
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Application
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3002"),
  NEXT_PUBLIC_API_URL: z.string().default("http://localhost:3002/api"),

  // SSO OAuth2 Configuration
  SSO_OAUTH_CLIENT_ID: z.string().default("pmb-platform"),
  SSO_OAUTH_CLIENT_SECRET: z.string().default(""),
  SSO_OAUTH_AUTHORIZE_URL: z.string().default("http://localhost:3000/oauth/authorize"),
  SSO_OAUTH_TOKEN_URL: z.string().default("http://localhost:3000/oauth/token"),
  SSO_OAUTH_USERINFO_URL: z.string().default("http://localhost:3000/oauth/userinfo"),
  SSO_OAUTH_CALLBACK_URL: z.string().default("http://localhost:3002/api/auth/callback"),

  // Institution / Branding
  NEXT_PUBLIC_INSTITUTION_NAME: z.string().default("Universitas Siber Asia"),
  NEXT_PUBLIC_INSTITUTION_SHORT_NAME: z.string().default("UNSIA"),
  NEXT_PUBLIC_APP_NAME: z.string().default("PMB"),
  NEXT_PUBLIC_LOGO_URL: z.string().optional(),

  // Cross-Platform Service URLs
  SIAKAD_BASE_URL: z.string().default("http://localhost:3003"),
  SIAKAD_CALLBACK_URL: z.string().default("http://localhost:3003/api/integration/pmb-callback"),
  SIAKAD_WEBHOOK_URL: z.string().default("http://localhost:3003/api/webhooks/pmb"),
  STORAGE_BASE_URL: z.string().default("http://storage.unsia.ac.id"),

  // Session
  SESSION_MAX_AGE: z.coerce.number().default(86400),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  DEFAULT_APPLICANT_PASSWORD: z.string().default("password123"),
});

function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Invalid environment variables for PMB Platform:");
    if (error instanceof z.ZodError) {
      console.error(error.flatten().fieldErrors);
    }
    throw new Error("Failed to parse environment variables");
  }
}

export const env = parseEnv();
export const isProduction = env.NODE_ENV === "production";
