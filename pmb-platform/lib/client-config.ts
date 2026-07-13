/**
 * Client-safe configuration for PMB Platform.
 *
 * All NEXT_PUBLIC_* environment variables are read here with centralized
 * defaults. Import from this module instead of reading process.env inline,
 * so hardcoded defaults live in ONE place.
 *
 * NOTE: This module is safe to import in both server and client components
 * ("use client" / "use server"). It only references NEXT_PUBLIC_* vars which
 * are inlined at build time.
 */

const read = (key: string, fallback: string): string => {
  const v = process.env[key];
  return v && v.length > 0 ? v : fallback;
};

// Institution / Branding
export const INSTITUTION_NAME = read("NEXT_PUBLIC_INSTITUTION_NAME", "Universitas Siber Asia");
export const INSTITUTION_SHORT_NAME = read("NEXT_PUBLIC_INSTITUTION_SHORT_NAME", "UNSIA");
export const APP_NAME = read("NEXT_PUBLIC_APP_NAME", "PMB");

// SSO OAuth (client-facing authorize URL + client id + callback)
export const SSO_AUTHORIZE_URL = read("NEXT_PUBLIC_SSO_OAUTH_AUTHORIZE_URL", "http://localhost:3000/oauth/authorize");
export const SSO_CLIENT_ID = read("NEXT_PUBLIC_SSO_OAUTH_CLIENT_ID", "pmb-platform");
export const SSO_CALLBACK_URL = read("NEXT_PUBLIC_SSO_OAUTH_CALLBACK_URL", "http://localhost:3002/api/auth/callback");

// Payment / fees (PMB-specific)
export const FORM_FEE_DISPLAY = read("NEXT_PUBLIC_FORM_FEE_DISPLAY", "Rp 250.000");
export const PAYMENT_BANKS = read("NEXT_PUBLIC_PAYMENT_BANKS", "Bank BNI VA,Bank Mandiri VA,Bank Permata VA").split(",");

// Default password for newly registered applicants (set by ops/admin)
export const DEFAULT_APPLICANT_PASSWORD = read("NEXT_PUBLIC_DEFAULT_APPLICANT_PASSWORD", "Pmb@2026!default");

// Entry path fees (in IDR). Override via NEXT_PUBLIC_ENTRY_PATHS as JSON if needed.
export type EntryPathConfig = { id: string; name: string; price: number };
const DEFAULT_ENTRY_PATHS: EntryPathConfig[] = [
  { id: "reguler", name: "Reguler", price: 250000 },
  { id: "prestasi", name: "Prestasi", price: 150000 },
  { id: "mitra", name: "Mitra", price: 200000 },
  { id: "beasiswa", name: "Beasiswa", price: 0 },
];
function parseEntryPaths(): EntryPathConfig[] {
  const raw = process.env.NEXT_PUBLIC_ENTRY_PATHS;
  if (!raw) return DEFAULT_ENTRY_PATHS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as EntryPathConfig[];
  } catch {
    // fall through to default
  }
  return DEFAULT_ENTRY_PATHS;
}
export const ENTRY_PATHS = parseEntryPaths();
export const ENTRY_PATH_FEE: Record<string, number> = ENTRY_PATHS.reduce(
  (acc, ep) => {
    acc[ep.id] = ep.price;
    return acc;
  },
  {} as Record<string, number>,
);

// Logo
export const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || undefined;
