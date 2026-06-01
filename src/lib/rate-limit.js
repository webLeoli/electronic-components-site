import Redis from 'ioredis';

/**
 * Shared, cluster-safe rate limiter.
 *
 * - When REDIS_URL is set, uses Redis with an atomic fixed-window counter
 *   (single round-trip Lua: INCR + PEXPIRE). This works correctly across
 *   multiple processes / instances (PM2 cluster, multiple containers).
 * - When REDIS_URL is absent (or Redis is unreachable for a given call),
 *   falls back to a per-process in-memory sliding window. This keeps dev and
 *   single-process deployments working with no extra infrastructure.
 *
 * Usage:
 *   const ok = await rateLimit(ip, { windowMs: 60_000, max: 30, prefix: 'search' });
 *   if (!ok) return NextResponse.json({ error: '...' }, { status: 429 });
 */

const globalForRl = globalThis;

function getRedis() {
  if (!process.env.REDIS_URL) return null;
  // Cache the client across HMR / module reloads, like the Prisma singleton.
  if (globalForRl.__rlRedis !== undefined) return globalForRl.__rlRedis;
  try {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    // Swallow connection errors here so a Redis outage never crashes a request;
    // individual calls fall back to the in-memory limiter instead.
    client.on('error', (e) => {
      console.error('[rate-limit] Redis error:', e.message);
    });
    globalForRl.__rlRedis = client;
  } catch (e) {
    console.error('[rate-limit] Redis init failed:', e.message);
    globalForRl.__rlRedis = null;
  }
  return globalForRl.__rlRedis;
}

// Atomic fixed-window: increment the counter and, on the first hit of a new
// window, set its expiry. Returns the current count for this window.
const FIXED_WINDOW_LUA = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return current
`;

// --- In-memory fallback (per process only) ---
const memStore = globalForRl.__rlMem || (globalForRl.__rlMem = new Map());

function memCheck(key, windowMs, max) {
  const now = Date.now();
  const prev = memStore.get(key) || [];
  const timestamps = prev.filter((t) => now - t < windowMs);
  if (timestamps.length >= max) {
    memStore.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  memStore.set(key, timestamps);
  // Periodically purge stale entries to prevent unbounded growth.
  if (memStore.size > 10000) {
    for (const [k, ts] of memStore) {
      if (ts.every((t) => now - t > windowMs)) memStore.delete(k);
    }
  }
  return true;
}

/**
 * Check (and consume) one request against the limit.
 *
 * @param {string} identifier   Usually the client IP.
 * @param {object} opts
 * @param {number} opts.windowMs  Window length in milliseconds.
 * @param {number} opts.max       Max requests allowed per window.
 * @param {string} [opts.prefix]  Namespace so different endpoints don't share buckets.
 * @returns {Promise<boolean>}    true if allowed, false if the limit is exceeded.
 */
export async function rateLimit(identifier, { windowMs, max, prefix = 'rl' }) {
  const key = `${prefix}:${identifier || 'unknown'}`;
  const redis = getRedis();

  if (redis && redis.status === 'ready') {
    try {
      const count = await redis.eval(FIXED_WINDOW_LUA, 1, key, String(windowMs));
      return Number(count) <= max;
    } catch (e) {
      // Transient Redis failure — fall back to the in-memory limiter so the
      // endpoint stays protected (per process) rather than failing open.
      return memCheck(key, windowMs, max);
    }
  }

  return memCheck(key, windowMs, max);
}
