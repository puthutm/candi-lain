import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate cryptographically secure random string
 */
export function generateSecureRandomString(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = new Uint8Array(length);
  
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    // Fallback for Node.js environment
    const nodeCrypto = require("crypto");
    nodeCrypto.randomFillSync(randomValues);
  }

  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i]! % charset.length];
  }

  return result;
}

/**
 * Generate code verifier for PKCE (43-128 characters)
 */
export function generateCodeVerifier(): string {
  return generateSecureRandomString(128);
}

/**
 * Generate code challenge from code verifier using SHA-256
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  
  // Convert to base64url
  return base64UrlEncode(hash);
}

/**
 * Base64 URL encode (without padding)
 */
export function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * - Minimum 8 characters
 * - At least one letter
 * - At least one number
 * - At least one special character
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasLetter && hasNumber && hasSpecial;
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Check if URL is valid HTTPS or localhost
 */
export function isValidRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    
    // Allow HTTPS for production
    if (url.protocol === "https:") {
      return true;
    }
    
    // Allow HTTP only for localhost in development
    if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Parse space-separated scope string to array
 */
export function parseScopes(scopeString: string): string[] {
  return scopeString.split(" ").filter(Boolean);
}

/**
 * Join scope array to space-separated string
 */
export function joinScopes(scopes: string[]): string {
  return scopes.join(" ");
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
