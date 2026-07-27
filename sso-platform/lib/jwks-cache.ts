/**
 * SSO JWKS Public Key Cache Manager
 * Caches RSA Public Keys / JWKS sets to prevent HTTP roundtrips during JWT token verification
 */

export interface CachedJwksKey {
  kid: string;
  alg: string;
  kty: string;
  n: string;
  e: string;
  use: string;
}

export interface JwksKeySet {
  keys: CachedJwksKey[];
  fetchedAt: number;
}

let memoryCache: JwksKeySet | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

export async function getOrFetchJwksKeySet(
  jwksUrl: string = "http://localhost:3001/.well-known/jwks.json"
): Promise<CachedJwksKey[]> {
  const now = Date.now();

  if (memoryCache && now - memoryCache.fetchedAt < CACHE_TTL_MS) {
    console.log("[JWKS Cache HIT] Returning cached SSO JWKS public keys");
    return memoryCache.keys;
  }

  console.log(`[JWKS Cache MISS] Fetching fresh JWKS public keys from ${jwksUrl}...`);

  try {
    const res = await fetch(jwksUrl, { next: { revalidate: 3600 } });
    if (!res.ok) {
      throw new Error(`JWKS endpoint returned status ${res.status}`);
    }

    const data = await res.json();
    const keys: CachedJwksKey[] = data.keys || [];

    memoryCache = {
      keys,
      fetchedAt: now,
    };

    return keys;
  } catch (error: any) {
    console.error(`[JWKS Cache Error] Failed to fetch JWKS: ${error.message}`);
    // Return stale cache if available as fallback
    if (memoryCache) {
      console.warn("[JWKS Cache Fallback] Returning stale memory cache");
      return memoryCache.keys;
    }
    return [];
  }
}

export function invalidateJwksCache(): void {
  console.log("[JWKS Cache Invalidate] Memory cache cleared");
  memoryCache = null;
}
