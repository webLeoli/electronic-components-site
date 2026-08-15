import prisma from '@/lib/db';
import { isIndexable, DEFAULT_INDEX_THRESHOLD } from '@/lib/quality-score';

// 2026-08-15: 50 → 44. Same story a second time — scoreSpecs stopped paying for
// "-" placeholder spec slots, so every score moved down by the number of blanks
// the supplier feed padded. The full measurement table is in lib/quality-score.js
// next to the constant. Note the STORED policy (AdminSetting
// quality_index_threshold) overrides this default, so it has to be updated too:
// scripts/set-indexing-policy.mjs, or the /admin/quality screen.
//
// 2026-08-02: 70 → 50, because the scoring scale underneath it changed.
//
// The old 100-point scale had 20 unreachable points (datasheet: 383 of 719,342
// products; image: 0) and 30 constant ones (every description is the same
// generated template), so scores bunched at 70-77 and a "≥ 70" gate admitted
// 76% of the catalogue — it was not selecting anything. lib/quality-score.js
// now weights the dimensions that actually vary and the distribution spans
// 13-75 (p25=49, p50=57, p75=65, p90=69).
//
// 50 is calibrated to be roughly SIZE-neutral against the old gate (≈532K
// indexable vs the current 547K) while making the selection quality-based
// rather than arbitrary. Raise it to tighten: ≥55 ≈ 443K, ≥60 ≈ 285K,
// ≥65 ≈ 191K. Leaving it at 70 against the new scale would index ~4.5K pages.
//
// The value itself lives in lib/quality-score.js, beside the scale it is
// calibrated against; re-exported here so existing importers keep working.
const THRESHOLD_KEY = 'quality_index_threshold';
const DISABLED_KEY = 'quality_indexing_disabled';

async function getIndexingPolicy() {
  try {
    const settings = await prisma.adminSetting.findMany({
      where: { key: { in: [THRESHOLD_KEY, DISABLED_KEY] } },
      select: { key: true, value: true },
    });
    const byKey = new Map(settings.map(setting => [setting.key, setting.value]));
    const threshold = Number.parseInt(byKey.get(THRESHOLD_KEY), 10);

    return {
      threshold: Number.isFinite(threshold) ? threshold : DEFAULT_INDEX_THRESHOLD,
      disabled: byKey.get(DISABLED_KEY) === 'true',
    };
  } catch {
    return {
      threshold: DEFAULT_INDEX_THRESHOLD,
      disabled: false,
    };
  }
}

function isScoreIndexable(score, policy) {
  if (policy?.disabled) return false;
  return isIndexable(score, policy?.threshold ?? DEFAULT_INDEX_THRESHOLD);
}

async function shouldProductBeIndexable(score) {
  const policy = await getIndexingPolicy();
  return isScoreIndexable(score, policy);
}

async function setIndexingPolicy({ threshold, disabled }) {
  const writes = [];

  if (threshold !== undefined) {
    writes.push(prisma.adminSetting.upsert({
      where: { key: THRESHOLD_KEY },
      create: { key: THRESHOLD_KEY, value: String(threshold) },
      update: { value: String(threshold) },
    }));
  }

  if (disabled !== undefined) {
    writes.push(prisma.adminSetting.upsert({
      where: { key: DISABLED_KEY },
      create: { key: DISABLED_KEY, value: disabled ? 'true' : 'false' },
      update: { value: disabled ? 'true' : 'false' },
    }));
  }

  if (writes.length) {
    await prisma.$transaction(writes);
  }
}

export {
  DEFAULT_INDEX_THRESHOLD,
  getIndexingPolicy,
  isScoreIndexable,
  setIndexingPolicy,
  shouldProductBeIndexable,
};
