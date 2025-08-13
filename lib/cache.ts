// lib/cache.ts
import LRU from "lru-cache";

export const cache = new LRU<string, any>({
  max: 500,
  ttl: 60 * 1000, // default 60s
});

export function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>) {
  const hit = cache.get(key);
  if (hit !== undefined) return Promise.resolve(hit as T);
  return fn().then((val) => {
    cache.set(key, val, { ttl: ttlMs });
    return val;
  });
}
