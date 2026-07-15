/**
 * Client-safe configuration for LMS Platform.
 *
 * All NEXT_PUBLIC_* environment variables are read here with centralized
 * defaults. Import from this module instead of reading process.env inline,
 * so hardcoded defaults live in ONE place.
 */

const read = (key: string, fallback: string): string => {
  const v = process.env[key];
  return v && v.length > 0 ? v : fallback;
};

// Institution / Branding
export const INSTITUTION_NAME = read("NEXT_PUBLIC_INSTITUTION_NAME", "Universitas Siber Asia");
export const INSTITUTION_SHORT_NAME = read("NEXT_PUBLIC_INSTITUTION_SHORT_NAME", "UNSIA");
export const APP_NAME = read("NEXT_PUBLIC_APP_NAME", "LMS");

// SSO OAuth (client-facing)
export const SSO_AUTHORIZE_URL = read("NEXT_PUBLIC_SSO_OAUTH_AUTHORIZE_URL", "http://localhost:3000/oauth/authorize");
export const SSO_CLIENT_ID = read("NEXT_PUBLIC_SSO_OAUTH_CLIENT_ID", "lms-platform");
export const SSO_CALLBACK_URL = read("NEXT_PUBLIC_SSO_OAUTH_CALLBACK_URL", "http://localhost:3004/api/auth/callback");

// Logo
export const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || undefined;

// Cross-Platform Service URLs
export const BANK_KONTEN_BASE_URL = read("NEXT_PUBLIC_BANK_KONTEN_BASE_URL", "http://localhost:3007");
