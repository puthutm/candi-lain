import { z } from "zod";

/**
 * Environment variables schema with validation for PMB Platform
 *
 * Note:
 * - Avoid hardcoded *host* defaults (no `.default("http://...")`)
 * - Some fields are optional so builds/dev work even when those
 *   integrations are not configured locally.
 * - Derived URLs are built from base URLs when possible.
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Application
  NODE_ENV: z.enum(["development", "production", "test"]),
  NEXT_PUBLIC_APP_URL: z.string(),
  NEXT_PUBLIC_API_URL: z.string(),

  // Auth.js / NextAuth
  AUTH_URL: z.string(),
  NEXTAUTH_URL: z.string(),
  AUTH_TRUST_HOST: z.coerce.boolean(),
  AUTH_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),

  // SSO OAuth2 Configuration
  SSO_OAUTH_CLIENT_ID: z.string(),
  SSO_OAUTH_CLIENT_SECRET: z.string(),
  SSO_OAUTH_AUTHORIZE_URL: z.string(),
  SSO_OAUTH_TOKEN_URL: z.string(),
  SSO_OAUTH_USERINFO_URL: z.string(),
  SSO_OAUTH_CALLBACK_URL: z.string(),

  // Institution / Branding (optional for dev/build)
  NEXT_PUBLIC_INSTITUTION_NAME: z.string().optional(),
  NEXT_PUBLIC_INSTITUTION_SHORT_NAME: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  NEXT_PUBLIC_LOGO_URL: z.string().optional(),

  // Cross-Platform Service URLs
  SIAKAD_BASE_URL: z.string().optional(),
  SIAKAD_CALLBACK_URL: z.string().optional(),
  SIAKAD_WEBHOOK_URL: z.string().optional(),
  STORAGE_BASE_URL: z.string().optional(),

  // Session
  SESSION_MAX_AGE: z.coerce.number().optional(),
  BCRYPT_ROUNDS: z.coerce.number().optional(),
  DEFAULT_APPLICANT_PASSWORD: z.string().optional(),
});

function joinUrl(base: string, path: string) {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function parseEnv() {
  try {
    const parsed = envSchema.parse(process.env);

    // Derive SIAKAD URLs when base exists
    const sia = parsed.SIAKAD_BASE_URL;
    if (sia) {
      parsed.SIAKAD_CALLBACK_URL =
        parsed.SIAKAD_CALLBACK_URL ?? joinUrl(sia, "/api/integration/pmb-callback");

      parsed.SIAKAD_WEBHOOK_URL =
        parsed.SIAKAD_WEBHOOK_URL ?? joinUrl(sia, "/api/webhooks/pmb");
    }

    return parsed;
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
