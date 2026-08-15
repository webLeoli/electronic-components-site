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

/**
 * The in-memory limiter counts per process, which is correct for a single
 * instance and silently wrong for several: with N workers and no Redis every
 * limit becomes N times looser, and nothing in the logs says so. PM2 exposes the
 * worker index in NODE_APP_INSTANCE, so the one situation where this matters is
 * detectable — warn once instead of letting a scale-up quietly disable the
 * quotas on the quote form.
 */
function warnIfClusteredWithoutRedis() {
  if (globalForRl.__rlClusterWarned) return;
  const instance = process.env.NODE_APP_INSTANCE ?? process.env.pm_id;
  if (instance === undefined) return;
  globalForRl.__rlClusterWarned = true;
  console.error(
    `[rate-limit] Running as PM2 instance ${instance} with no REDIS_URL. ` +
    'Rate limits are counted per process, so every quota is multiplied by the ' +
    'number of workers. Set REDIS_URL, or run a single instance (fork mode).'
  );
}

function memCheck(key, windowMs, max) {
  warnIfClusteredWithoutRedis();
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

// How many proxies of our own sit in front of the app. Each one appends an
// entry to x-forwarded-for, so this is how far from the END the real client
// address sits. 1 = nginx only (the documented setup). 2 = a CDN/WAF in front
// of nginx. Getting this wrong is not cosmetic:
//   - too LOW (CDN present, still counting 1): every visitor keys to the CDN's
//     address, so all quotas collapse into one shared bucket — the quote form
//     becomes 3 submissions per hour for the entire site, and one attacker
//     locks every admin out of login. Silent: the logs show ordinary 429s.
//   - too HIGH: the key comes from a client-supplied entry, which is spoofable
//     by rotating the header, so the limits stop limiting anything.
// Default 1 preserves the previous behaviour exactly.
const TRUSTED_PROXY_HOPS = Math.max(
  1,
  parseInt(process.env.TRUSTED_PROXY_HOPS || '1', 10) || 1
);

/**
 * Derive the client IP for rate-limit keying (and for the ipAddress stored on
 * leads).
 *
 * The FIRST entry of x-forwarded-for is client-supplied and trivially
 * spoofable — keying limits on it lets an attacker rotate the header and
 * bypass every limit. Each proxy APPENDS the address it actually saw, so we
 * count TRUSTED_PROXY_HOPS back from the end: that is the last entry we
 * control and the first one the client cannot forge.
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) {
      // Clamp for requests carrying fewer entries than configured hops (health
      // checks, or the CDN bypassed): fall back to the oldest entry rather than
      // indexing off the front of the list.
      // NOTE: setting hops > 1 means trusting that traffic really did pass
      // through that many of our proxies. Anyone who can reach the origin
      // directly can forge the entry we read. Restrict the origin to the CDN's
      // address ranges at the firewall; hop-counting alone cannot enforce it.
      const index = Math.max(0, parts.length - TRUSTED_PROXY_HOPS);
      return parts[index];
    }
  }
  return request.headers.get('x-real-ip') || 'unknown';
}
