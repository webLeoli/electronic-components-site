import prisma from '@/lib/db';
import { isIndexable } from '@/lib/quality-score';

// Default threshold raised from 45 → 70 on 2026-05-17 to match the
// Gold-tier strategy: only let products with score ≥ 70 into the index.
// Silver (45-69) is now considered insufficient on its own; products must
// either be rewritten with richer generated descriptions (lifting them to Gold)
// or stay out of the index.
const DEFAULT_INDEX_THRESHOLD = 70;
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
