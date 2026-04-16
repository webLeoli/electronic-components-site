import prisma from '@/lib/db';

// In-memory cache for admin settings.
// NOTE: In multi-process deployments (e.g. PM2 cluster), each process maintains
// its own cache. invalidateSettingsCache() only clears the current process's cache.
// The 30s TTL ensures stale data is refreshed quickly across all processes.
let settingsCache = null;
let cacheExpiry = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds — short enough for multi-process deployments

/**
 * Get all admin settings as a key-value object.
 * Cached for 30s to reduce DB load while staying reasonably fresh.
 */
export async function getSettings() {
  const now = Date.now();
  if (settingsCache && now < cacheExpiry) {
    return settingsCache;
  }

  try {
    const rows = await prisma.adminSetting.findMany();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    settingsCache = settings;
    cacheExpiry = now + CACHE_TTL;
    return settings;
  } catch {
    // On DB error, fall back to stale cache if available
    return settingsCache || {};
  }
}

/**
 * Get a single setting value
 */
export async function getSetting(key, defaultValue = '') {
  const settings = await getSettings();
  return settings[key] ?? defaultValue;
}

/**
 * Invalidate cache (call after saving settings).
 * In multi-process mode, other processes will refresh from DB within CACHE_TTL ms.
 */
export function invalidateSettingsCache() {
  settingsCache = null;
  cacheExpiry = 0;
}

