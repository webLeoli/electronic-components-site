/**
 * Batch Quality Score Computation (v2 — Optimized)
 * 
 * Strategy: 
 *   Phase 1: Read products in batches, compute scores in memory
 *   Phase 2: Group by score, do raw SQL batch updates per score value
 *   
 * This avoids 720K individual UPDATE statements — instead uses ~100 grouped UPDATEs.
 * 
 * Usage:
 *   node scripts/compute-quality-scores.mjs                  # Full run (threshold from admin policy)
 *   node scripts/compute-quality-scores.mjs --dry-run        # Preview without writing
 *   node scripts/compute-quality-scores.mjs --threshold=55   # Override the threshold for this run
 *   node scripts/compute-quality-scores.mjs --sample=20      # Score 20 products and show details
 *   node scripts/compute-quality-scores.mjs --force          # Allow a >20% index-status swing
 *
 * A full run aborts if it would flip the indexable flag on more than 20% of the
 * catalogue, unless --force is given. Always --dry-run after touching the
 * weights in lib/quality-score.js.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  computeQualityScore,
  isIndexable,
  getQualityTier,
  getTierInfo,
  TIERS,
  DEFAULT_INDEX_THRESHOLD,
} from '../src/lib/quality-score.js';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const SAMPLE_MODE = args.find(a => a.startsWith('--sample='));
const SAMPLE_SIZE = SAMPLE_MODE ? parseInt(SAMPLE_MODE.split('=')[1]) : 0;
const THRESHOLD_ARG = args.find(a => a.startsWith('--threshold='));
const BATCH_SIZE = 5000;

// Refuse to silently flip more than this share of the catalogue's index status
// in one run. Rewriting the scoring weights without re-tuning the threshold can
// de-index the entire site in a single pass; --force is the deliberate override.
const MAX_INDEX_SWING = 0.2;

// Threshold resolution: --threshold= wins, then the live admin policy, then the
// shared default. This script used to hardcode 45 while the app used 70, so the
// batch job and the per-product path disagreed about what was indexable.
async function resolveThreshold() {
  if (THRESHOLD_ARG) return parseInt(THRESHOLD_ARG.split('=')[1]);
  try {
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'quality_index_threshold' },
      select: { value: true },
    });
    const stored = Number.parseInt(setting?.value, 10);
    if (Number.isFinite(stored)) return stored;
  } catch {}
  return DEFAULT_INDEX_THRESHOLD;
}

const THRESHOLD = await resolveThreshold();

// A dropped connection halfway through Phase 2 leaves the catalogue holding a mix
// of old and new scores — and, worse, duplicates re-indexed because the re-hide
// step at the end never runs. Retry each statement instead of losing the run;
// every write here is idempotent, so replaying one is safe.
async function writeWithRetry(sql, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$executeRawUnsafe(sql);
    } catch (e) {
      if (attempt >= attempts) throw e;
      console.warn(`\n  ⚠️  write failed (${e.code || e.message}); retry ${attempt}/${attempts - 1} in ${attempt}s`);
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
}

async function run() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📊 Product Quality Score Computation (v2)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Mode:      ${DRY_RUN ? '🔍 DRY RUN (no writes)' : SAMPLE_SIZE ? `🔬 SAMPLE (${SAMPLE_SIZE} products)` : '✏️  FULL RUN'}`);
  console.log(`  Threshold: ${THRESHOLD} (${getQualityTier(THRESHOLD)} tier minimum for indexing)`);
  console.log('');

  const total = await prisma.product.count();
  console.log(`  Total products: ${total.toLocaleString()}`);
  console.log('');

  // ━━━ Sample mode: show detailed breakdown for a few products ━━━
  if (SAMPLE_SIZE) {
    const samples = await prisma.product.findMany({
      take: SAMPLE_SIZE,
      orderBy: { id: 'asc' },
      // Same shape as the full run below, so a sampled breakdown matches the
      // score the full run would store (scoreImage reads the category too).
      include: {
        category: { select: { name: true, slug: true, parent: { select: { name: true } } } },
      },
    });

    for (const product of samples) {
      const result = computeQualityScore(product);
      const { score, tier, breakdown } = result;
      const tierInfo = getTierInfo(tier);
      console.log(`  ┌─ ${product.partNumber} (${product.manufacturer})`);
      console.log(`  │  Category: ${product.category?.name || '—'}`);
      console.log(`  │  Description: "${(product.description || '').substring(0, 80)}..."`);
      console.log(`  │`);
      // Maxima below are the live weights from lib/quality-score.js. They used
      // to read 30/25/15/10/10/10 — the pre-2026-08-02 split — which made a
      // sampled breakdown look wrong against the score it printed underneath.
      console.log(`  │  📝 Description: ${breakdown.description.total}/5   (len=${breakdown.description.length} div=${breakdown.description.diversity} kw=${breakdown.description.keywords})`);
      console.log(`  │  📋 Specs:       ${breakdown.specs.total}/40  (filled=${breakdown.specs.filledKeys}/${breakdown.specs.presentKeys} keys=${breakdown.specs.keyCount} vals=${breakdown.specs.valueQuality})`);
      console.log(`  │  💰 Pricing:     ${breakdown.pricing.total}/18`);
      console.log(`  │  📄 Datasheet:   ${breakdown.datasheet.total}/15`);
      console.log(`  │  🖼️  Image:       ${breakdown.image.total}/10  (${breakdown.image.kind})`);
      console.log(`  │  ♻️  Lifecycle:   ${breakdown.lifecycle.total}/12  (${product.status})`);
      console.log(`  │`);
      console.log(`  │  ══ SCORE: ${score}/100  ${tierInfo.emoji} ${tierInfo.label.toUpperCase()}`);
      console.log(`  │  Indexable: ${isIndexable(score, THRESHOLD) ? '✅ YES' : '❌ NO'}`);
      console.log(`  └──────────────────────────────────────`);
      console.log('');
    }
    await prisma.$disconnect();
    return;
  }

  // ━━━ Full/dry-run mode ━━━
  const tierCounts = { gold: 0, silver: 0, bronze: 0, noindex: 0 };
  let totalScore = 0;
  let processed = 0;
  let indexableCount = 0;

  // scoreMap: Map<score_value, Set<product_id>>
  // Groups all product IDs by their computed score for efficient batch update
  const scoreMap = new Map();

  // Rows consolidated by scripts/dedupe-part-numbers.mjs are never indexable,
  // whatever they score: their URL 301s to the surviving part. Tracked separately
  // because the write below derives `indexable` from the score alone, so without
  // this a rescore would silently re-index every duplicate page.
  let duplicateCount = 0;

  const startTime = Date.now();

  console.log('  📖 Phase 1: Computing scores in memory...');
  console.log('');

  // Keyset pagination, not skip/take. OFFSET makes Postgres walk and discard
  // every earlier row, so batch N costs O(N·BATCH_SIZE): the last batches of a
  // 719K-row catalogue were taking 13s each and a full read took over an hour.
  // Seeking on the primary key is a constant-cost index range scan per batch.
  let cursor = 0;
  for (;;) {
    const products = await prisma.product.findMany({
      where: { id: { gt: cursor } },
      take: BATCH_SIZE,
      orderBy: { id: 'asc' },
      // The category has to come along: scoreImage resolves a package-family
      // image from the same blob the page uses, and that blob includes the
      // category name/slug. Scoring without it would store a different number
      // than the page renders.
      include: {
        category: { select: { name: true, slug: true, parent: { select: { name: true } } } },
      },
    });
    if (products.length === 0) break;
    cursor = products[products.length - 1].id;

    for (const product of products) {
      const result = computeQualityScore(product);
      tierCounts[result.tier]++;
      totalScore += result.score;
      const isDuplicate = product.duplicateOfId != null;
      if (isDuplicate) duplicateCount++;
      if (!isDuplicate && isIndexable(result.score, THRESHOLD)) indexableCount++;
      processed++;

      // Group by score for batch update
      if (!scoreMap.has(result.score)) {
        scoreMap.set(result.score, []);
      }
      scoreMap.get(result.score).push(product.id);
    }

    const pct = Math.round((processed / total) * 100);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`\r  ⏳ Reading: ${processed.toLocaleString()} / ${total.toLocaleString()} (${pct}%) — ${elapsed}s`);
  }

  const readTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n  ✅ Phase 1 complete: ${processed.toLocaleString()} products scored in ${readTime}s`);
  console.log(`  📊 Unique score values: ${scoreMap.size}`);
  console.log('');

  // ━━━ Blast-radius guard ━━━
  // A weight change in lib/quality-score.js shifts every score at once. Paired
  // with a stale threshold that can de-index the whole catalogue in one pass,
  // which reaches Google as a mass noindex before anyone notices.
  if (!DRY_RUN && !SAMPLE_SIZE) {
    const currentIndexable = await prisma.product.count({ where: { indexable: true } });
    const swing = Math.abs(indexableCount - currentIndexable);
    const swingPct = processed > 0 ? swing / processed : 0;

    console.log(`  🔎 Index status: ${currentIndexable.toLocaleString()} → ${indexableCount.toLocaleString()} (${swing.toLocaleString()} pages, ${(swingPct * 100).toFixed(1)}% of catalogue)`);

    if (swingPct > MAX_INDEX_SWING && !FORCE) {
      console.error('');
      console.error(`  ⛔ ABORTED: this run would change the index status of ${(swingPct * 100).toFixed(1)}% of the catalogue (limit ${(MAX_INDEX_SWING * 100)}%).`);
      console.error(`     Threshold in use: ${THRESHOLD}. If the scoring weights changed, re-tune the threshold first:`);
      console.error('       node scripts/compute-quality-scores.mjs --dry-run --threshold=NN');
      console.error('     Re-run with --force once the new size is what you intend.');
      console.error('');
      await prisma.$disconnect();
      process.exit(1);
    }
    console.log('');
  }

  // ━━━ Phase 2: Batch SQL update ━━━
  if (!DRY_RUN) {
    console.log('  📝 Phase 2: Writing scores to database (batch SQL)...');
    const writeStart = Date.now();
    let updateCount = 0;
    let changedCount = 0;
    const scoreEntries = [...scoreMap.entries()];

    for (const [score, ids] of scoreEntries) {
      const indexable = isIndexable(score, THRESHOLD);

      // Process IDs in chunks to avoid SQL parameter limits
      const CHUNK = 10000;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const chunk = ids.slice(i, i + CHUNK);
        const idList = chunk.join(',');

        changedCount += await writeWithRetry(
          // Deliberately does NOT touch updatedAt or contentUpdatedAt. Scoring
          // is housekeeping: no rendered field changes, so nothing here may
          // advance a sitemap <lastmod>. The old `"updatedAt" = NOW()` restamped
          // the entire catalogue on every run.
          //
          // The IS DISTINCT FROM guard skips rows whose stored values already
          // match. Most of a re-run is unchanged rows, and writing them anyway
          // meant 719K row versions per run: dead tuples, index churn and an
          // autovacuum pass, for nothing.
          `UPDATE "Product" SET "qualityScore" = ${score}, "indexable" = ${indexable}
            WHERE "id" IN (${idList})
              AND ("qualityScore" IS DISTINCT FROM ${score} OR "indexable" IS DISTINCT FROM ${indexable})`
        );
        updateCount += chunk.length;
      }

      // Progress
      const pct = Math.round((updateCount / processed) * 100);
      process.stdout.write(`\r  ⏳ Writing: ${updateCount.toLocaleString()} / ${processed.toLocaleString()} (${pct}%) — ${changedCount.toLocaleString()} changed`);
    }

    // Re-assert the duplicate rule after the score-driven writes above, which set
    // `indexable` from the score alone and would otherwise resurrect duplicates.
    if (duplicateCount > 0) {
      const reHidden = await writeWithRetry(
        `UPDATE "Product" SET "indexable" = false
          WHERE "duplicateOfId" IS NOT NULL AND "indexable" = true`
      );
      console.log(`\n  🔗 Duplicates kept out of the index: ${duplicateCount.toLocaleString()} rows (${reHidden.toLocaleString()} re-hidden)`);
    }

    const writeTime = ((Date.now() - writeStart) / 1000).toFixed(1);
    console.log(`\n  ✅ Phase 2 complete: ${changedCount.toLocaleString()} of ${updateCount.toLocaleString()} products actually changed, in ${writeTime}s`);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📊 Results');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`  Processed: ${processed.toLocaleString()} products in ${totalTime}s`);
  console.log(`  Avg Score: ${(totalScore / processed).toFixed(1)} / 100`);
  console.log('');

  // Tier distribution
  console.log('  ┌──────────────────────────────────────────────┐');
  console.log('  │  Tier Distribution                          │');
  console.log('  ├──────────────────────────────────────────────┤');
  for (const [tier, count] of Object.entries(tierCounts)) {
    const info = getTierInfo(tier);
    const pct = ((count / processed) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(pct / 2));
    console.log(`  │  ${info.emoji} ${info.label.padEnd(8)} ${count.toLocaleString().padStart(8)}  (${pct.padStart(5)}%)  ${bar}`);
  }
  console.log('  ├──────────────────────────────────────────────┤');
  console.log(`  │  ✅ Indexable  ${indexableCount.toLocaleString().padStart(8)}  (${((indexableCount / processed) * 100).toFixed(1).padStart(5)}%)  — threshold ≥ ${THRESHOLD}`);
  console.log(`  │  ❌ Hidden     ${(processed - indexableCount).toLocaleString().padStart(8)}  (${(((processed - indexableCount) / processed) * 100).toFixed(1).padStart(5)}%)`);
  console.log('  └──────────────────────────────────────────────┘');
  console.log('');

  if (DRY_RUN) {
    console.log('  ℹ️  DRY RUN — no changes written. Run without --dry-run to apply.');
  } else {
    console.log('  ✅ All scores written to database.');
    console.log(`  ✅ ${indexableCount.toLocaleString()} products marked as indexable (score ≥ ${THRESHOLD}).`);
  }

  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
