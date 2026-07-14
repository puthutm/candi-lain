/**
 * Security Configuration Constants
 * Token expirations, bcrypt rounds, session durations
 */

// Token Expiration Times (in seconds)
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: parseInt(process.env.ACCESS_TOKEN_EXPIRY || '3600'), // 1 hour
  REFRESH_TOKEN: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '2592000'), // 30 days
  ID_TOKEN: parseInt(process.env.ID_TOKEN_EXPIRY || '3600'), // 1 hour
  AUTHORIZATION_CODE: parseInt(process.env.AUTHORIZATION_CODE_EXPIRY || '600'), // 10 minutes
  SESSION_MAX_AGE: parseInt(process.env.SESSION_MAX_AGE || '86400'), // 24 hours
  PASSWORD_RESET: parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY || '3600'), // 1 hour
  EMAIL_VERIFICATION: parseInt(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY || '86400'), // 24 hours
} as const;

// Cryptography
export const CRYPTO_CONFIG = {
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS || '10'),
  ALGORITHM: process.env.CRYPTO_ALGORITHM || 'aes-256-cbc',
} as const;

// JWT & OAuth Configuration
export const JWT_CONFIG = {
  ALGORITHM: process.env.JWT_ALGORITHM || 'HS256',
  ISSUER: process.env.JWT_ISSUER || 'urn:unsia:sso',
  AUDIENCE: process.env.JWT_AUDIENCE || 'urn:unsia:platform',
} as const;

// PKCE Configuration
export const PKCE_CONFIG = {
  ENABLED: process.env.PKCE_ENABLED !== 'false', // enabled by default
  CODE_CHALLENGE_LENGTH: 128,
  CODE_VERIFIER_LENGTH: 128,
} as const;

// Cache Control Headers
export const CACHE_HEADERS = {
  PUBLIC_LONG_TERM: 'max-age=31536000; includeSubDomains; preload', // 1 year
  JWKS: 'max-age=3600; public', // 1 hour for JWKS endpoint
  NO_CACHE: 'no-cache, no-store, must-revalidate',
  PRIVATE_SHORT: 'private, max-age=3600', // 1 hour
} as const;

// Rate Limiting Configuration
export const RATE_LIMIT = {
  ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  LOGIN_WINDOW_MS: parseInt(process.env.LOGIN_WINDOW_MS || '900000'), // 15 minutes
} as const;

// Password Policy
export const PASSWORD_POLICY = {
  MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
  MAX_LENGTH: parseInt(process.env.PASSWORD_MAX_LENGTH || '128'),
  REQUIRE_UPPERCASE: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
  REQUIRE_LOWERCASE: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
  REQUIRE_NUMBERS: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
  REQUIRE_SPECIAL: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
  EXPIRE_DAYS: parseInt(process.env.PASSWORD_EXPIRE_DAYS || '90'), // 0 = never
  HISTORY_COUNT: parseInt(process.env.PASSWORD_HISTORY_COUNT || '5'), // prevent reuse
} as const;

// Default Security Values
export const SECURITY_DEFAULTS = {
  DEFAULT_PASSWORD: process.env.DEFAULT_PASSWORD || 'Change@Me!123',
  DEFAULT_RESET_PASSWORD: process.env.DEFAULT_RESET_PASSWORD || 'Reset@Me!123',
  DEFAULT_APPLICANT_PASSWORD: process.env.DEFAULT_APPLICANT_PASSWORD || 'Welcome@2026!',
} as const;

// Helper functions for token expiry
export function getTokenExpiry(tokenType: keyof typeof TOKEN_EXPIRY): number {
  return TOKEN_EXPIRY[tokenType];
}

export function getSessionExpiry(): number {
  return TOKEN_EXPIRY.SESSION_MAX_AGE * 1000; // convert to milliseconds for cookie
}

export function getPasswordResetUrl(token: string, baseUrl?: string): string {
  const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${url}/auth/reset-password?token=${token}`;
}
