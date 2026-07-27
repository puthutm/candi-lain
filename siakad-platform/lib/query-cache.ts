/**
 * In-Memory Query & Data Cache Manager for SIAKAD & Keuangan Platform
 * Accelerates high-frequency read queries (Academic Periods, Study Programs, Fee Rates)
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<any>>();

export async function cacheQuery<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const existing = store.get(key);

  if (existing && existing.expiresAt > now) {
    console.log(`[Query Cache HIT] key: '${key}'`);
    return existing.value as T;
  }

  console.log(`[Query Cache MISS] key: '${key}'. Fetching from DB...`);
  const freshData = await fetcher();

  store.set(key, {
    value: freshData,
    expiresAt: now + ttlMs,
  });

  return freshData;
}

export function invalidateCacheKey(key: string): void {
  store.delete(key);
  console.log(`[Query Cache Invalidated] key: '${key}'`);
}

export function clearAllQueryCache(): void {
  store.clear();
  console.log(`[Query Cache Cleared] All entries removed.`);
}
