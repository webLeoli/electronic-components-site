/**
 * Persist the indexing policy (threshold + disabled flag) to AdminSetting
 * so every downstream code path — admin UI, /api/admin/quality, and
 * indexing-policy.js's runtime read — agrees on the same value.
 *
 * Run BEFORE bulk-rescoring so any concurrent admin-side action defaults
 * to the right threshold.
 *
 * Usage:
 *   node scripts/set-indexing-policy.mjs --threshold=70                    # set threshold, keep disabled=false
 *   node scripts/set-indexing-policy.mjs --threshold=70 --disabled=false   # explicit
 *   node scripts/set-indexing-policy.mjs --show                            # just read & print
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const SHOW = args.includes('--show');
const THRESHOLD_ARG = args.find(a => a.startsWith('--threshold='));
const DISABLED_ARG  = args.find(a => a.startsWith('--disabled='));

const THRESHOLD_KEY = 'quality_index_threshold';
const DISABLED_KEY  = 'quality_indexing_disabled';

async function readPolicy() {
  const rows = await prisma.adminSetting.findMany({
    where: { key: { in: [THRESHOLD_KEY, DISABLED_KEY] } },
  });
  const m = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    threshold: m[THRESHOLD_KEY] ?? '(unset — falls back to indexing-policy.js DEFAULT)',
    disabled:  m[DISABLED_KEY]  ?? '(unset — defaults to false)',
  };
}

(async () => {
  if (SHOW || (!THRESHOLD_ARG && !DISABLED_ARG)) {
    const p = await readPolicy();
    console.log('Current AdminSetting:');
    console.log(`  ${THRESHOLD_KEY} = ${p.threshold}`);
    console.log(`  ${DISABLED_KEY}  = ${p.disabled}`);
    if (!SHOW) console.log('\n(no --threshold / --disabled given; nothing written)');
    await prisma.$disconnect();
    return;
  }

  if (THRESHOLD_ARG) {
    const v = String(parseInt(THRESHOLD_ARG.split('=')[1], 10));
    await prisma.adminSetting.upsert({
      where: { key: THRESHOLD_KEY },
      create: { key: THRESHOLD_KEY, value: v },
      update: { value: v },
    });
    console.log(`✓ set ${THRESHOLD_KEY} = ${v}`);
  }

  if (DISABLED_ARG) {
    const v = DISABLED_ARG.split('=')[1] === 'true' ? 'true' : 'false';
    await prisma.adminSetting.upsert({
      where: { key: DISABLED_KEY },
      create: { key: DISABLED_KEY, value: v },
      update: { value: v },
    });
    console.log(`✓ set ${DISABLED_KEY} = ${v}`);
  }

  const p = await readPolicy();
  console.log('\nNew state:');
  console.log(`  ${THRESHOLD_KEY} = ${p.threshold}`);
  console.log(`  ${DISABLED_KEY}  = ${p.disabled}`);

  await prisma.$disconnect();
})();
