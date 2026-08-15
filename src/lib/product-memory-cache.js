// Small, bounded process-local cache for hot catalogue reads.
//
// Product pages are deliberately rendered dynamically to prevent Next.js from
// writing hundreds of thousands of per-SKU HTML/RSC files to disk. This cache
// removes repeated database work for hot pages without bringing that disk
// growth back. It is intentionally short-lived and capped.

const STORE_KEY = Symbol.for('fpgacenter.product-memory-cache.v1');

function intFromEnv(name, fallback, min, max) {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

const DEFAULT_TTL_MS = intFromEnv('PRODUCT_MEMORY_CACHE_TTL_MS', 5 * 60 * 1000, 10_000, 30 * 60 * 1000);
const NULL_TTL_MS = intFromEnv('PRODUCT_MEMORY_CACHE_NULL_TTL_MS', 30 * 1000, 1_000, 5 * 60 * 1000);
const MAX_ENTRIES = intFromEnv('PRODUCT_MEMORY_CACHE_MAX_ENTRIES', 1500, 100, 10_000);

function getStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = {
      entries: new Map(),
      pending: new Map(),
      generation: 0,
    };
  }
  return globalThis[STORE_KEY];
}

function readEntry(store, key, now) {
  const entry = store.entries.get(key);
  if (!entry) return { hit: false };

  if (entry.expiresAt <= now) {
    store.entries.delete(key);
    return { hit: false };
  }

  // Map insertion order is used as a low-overhead LRU list.
  store.entries.delete(key);
  store.entries.set(key, entry);
  return { hit: true, value: entry.value };
}

function writeEntry(store, key, value, ttlMs) {
  store.entries.delete(key);
  store.entries.set(key, { value, expiresAt: Date.now() + ttlMs });

  while (store.entries.size > MAX_ENTRIES) {
    const oldestKey = store.entries.keys().next().value;
    store.entries.delete(oldestKey);
  }
}

/**
 * Cache a catalogue read and coalesce concurrent misses for the same key.
 * Rejected loaders are never cached. Null results receive a shorter TTL.
 */
export async function getProductMemoryCached(key, loader, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const store = getStore();
  const cached = readEntry(store, key, Date.now());
  if (cached.hit) return cached.value;

  const existing = store.pending.get(key);
  if (existing) return existing;

  const generation = store.generation;
  const pending = Promise.resolve()
    .then(loader)
    .then((value) => {
      // An admin mutation may clear the cache while this query is in flight.
      // Do not let the old result repopulate the freshly-cleared cache.
      if (store.generation === generation) {
        writeEntry(store, key, value, value == null ? NULL_TTL_MS : ttlMs);
      }
      return value;
    })
    .finally(() => {
      if (store.pending.get(key) === pending) store.pending.delete(key);
    });

  store.pending.set(key, pending);
  return pending;
}

// Admin product mutations call this after a successful write. Clearing the
// bounded cache is cheap and also invalidates related/category/manufacturer
// cards whose content may have changed.
export function clearProductMemoryCache() {
  const store = getStore();
  store.entries.clear();
  store.generation += 1;
}
