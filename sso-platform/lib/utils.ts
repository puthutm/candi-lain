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
    
    // Allow HTTP for localhost, 127.0.0.1, or private LAN IP addresses (10.x.x.x, 192.168.x.x, 172.16.x.x-172.31.x.x)
    const isLocalOrPrivate = url.hostname === "localhost" || 
                             url.hostname === "127.0.0.1" ||
                             url.hostname.startsWith("10.") ||
                             url.hostname.startsWith("192.168.") ||
                             /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(url.hostname);

    if (url.protocol === "http:" && isLocalOrPrivate) {
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

/**
 * Check if the requested redirect URI is allowed, considering localhost/LAN mapping flexibility.
 */
export function isRedirectUriAllowed(registeredUris: string[], requestedUri: string): boolean {
  if (registeredUris.includes(requestedUri)) {
    return true;
  }
  try {
    const reqUrl = new URL(requestedUri);
    for (const reg of registeredUris) {
      try {
        const regUrl = new URL(reg);
        // Compare paths
        if (reqUrl.pathname !== regUrl.pathname) continue;
        // Compare ports
        if (reqUrl.port !== regUrl.port) continue;
        
        // If registered is localhost/127.0.0.1, allow requested to be any private LAN IP or localhost
        const isRegLocal = regUrl.hostname === "localhost" || regUrl.hostname === "127.0.0.1";
        const isReqLocalOrPrivate = reqUrl.hostname === "localhost" || 
                                    reqUrl.hostname === "127.0.0.1" ||
                                    reqUrl.hostname.startsWith("10.") ||
                                    reqUrl.hostname.startsWith("192.168.") ||
                                    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(reqUrl.hostname);
                                    
        if (isRegLocal && isReqLocalOrPrivate) {
          return true;
        }
      } catch {
        // Ignore parsing errors for individual registered URIs
      }
    }
  } catch {
    // Ignore parsing error for requested URI
  }
  return false;
}

