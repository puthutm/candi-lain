/**
 * Client-safe configuration for SSO Platform.
 *
 * All NEXT_PUBLIC_* environment variables are read here with centralized
 * defaults. Import from this module instead of reading process.env inline.
 */

const read = (key: string, fallback: string): string => {
  const v = process.env[key];
  return v && v.length > 0 ? v : fallback;
};

// Institution / Branding
export const INSTITUTION_NAME = read("NEXT_PUBLIC_INSTITUTION_NAME", "Universitas Siber Asia");
export const INSTITUTION_SHORT_NAME = read("NEXT_PUBLIC_INSTITUTION_SHORT_NAME", "UNSIA");

// Portal name
export const PORTAL_NAME = read("NEXT_PUBLIC_PORTAL_NAME", "SSO Portal");
