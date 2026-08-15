#!/usr/bin/env node
/**
 * Fast repair for missing product sitemap files.
 *
 * The sitemap includes products where Product.indexable = true. This script
 * aligns indexable with existing qualityScore and the chosen threshold.
 * It does not change product content, RFQs, contacts, users, or schema.
 */

import { PrismaClient } from '@prisma/client';
import { DEFAULT_INDEX_THRESHOLD } from '../src/lib/quality-score.js';

const prisma = new PrismaClient();
const PRODUCTS_PER_SITEMAP = 5000;

function parseArgs() {
  // Default MUST track the live policy. A hardcoded 70 here once meant running
  // this "repair" would silently noindex every Silver-tier page (score 48-69).
  const opts = { threshold: DEFAULT_INDEX_THRESHOLD, dryRun: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg.startsWith('--threshold=')) {
      opts.threshold = Number.parseInt(arg.split('=')[1], 10) || DEFAULT_INDEX_THRESHOLD;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return opts;
}

async function countStats(threshold) {
  const [total, indexable, eligible, maxScore] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { indexable: true } }),
    prisma.product.count({ where: { qualityScore: { gte: threshold } } }),
    prisma.product.aggregate({ _max: { qualityScore: true } }),
  ]);

  return {
    total,
    indexable,
    eligible,
    maxScore: maxScore._max.qualityScore ?? 0,
    sitemapFiles: Math.ceil(indexable / PRODUCTS_PER_SITEMAP),
  };
}

async function setPolicy(threshold) {
  await prisma.$transaction([
    prisma.adminSetting.upsert({
      where: { key: 'quality_index_threshold' },
      create: { key: 'quality_index_threshold', value: String(threshold) },
      update: { value: String(threshold) },
    }),
    prisma.adminSetting.upsert({
      where: { key: 'quality_indexing_disabled' },
      create: { key: 'quality_indexing_disabled', value: 'false' },
      update: { value: 'false' },
    }),
  ]);
}

async function main() {
  const opts = parseArgs();
  const before = await countStats(opts.threshold);

  console.log('Product sitemap indexing repair');
  console.log(`  threshold: ${opts.threshold}`);
  console.log(`  mode: ${opts.dryRun ? 'dry-run' : 'apply'}`);
  console.log('');
  console.log(`Before: total=${before.total.toLocaleString()} indexable=${before.indexable.toLocaleString()} eligible=${before.eligible.toLocaleString()} maxScore=${before.maxScore}`);

  if (opts.dryRun) {
    console.log('No database writes made.');
    await prisma.$disconnect();
    return;
  }

  await setPolicy(opts.threshold);

  // Consolidated duplicates 301 to their canonical row; they must never be
  // indexable no matter their score, or the sitemap advertises redirects.
  const enabled = await prisma.product.updateMany({
    where: { qualityScore: { gte: opts.threshold }, duplicateOfId: null },
    data: { indexable: true },
  });
  const disabled = await prisma.product.updateMany({
    where: {
      OR: [
        { qualityScore: { lt: opts.threshold } },
        { duplicateOfId: { not: null } },
      ],
    },
    data: { indexable: false },
  });

  const after = await countStats(opts.threshold);

  console.log(`Updated: enabled=${enabled.count.toLocaleString()} disabled=${disabled.count.toLocaleString()}`);
  console.log(`After: total=${after.total.toLocaleString()} indexable=${after.indexable.toLocaleString()} productSitemaps=${after.sitemapFiles.toLocaleString()}`);

  if (after.indexable === 0 && after.total > 0) {
    console.log('');
    console.log('No products became indexable. Run: node scripts/compute-quality-scores.mjs --threshold=70');
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
