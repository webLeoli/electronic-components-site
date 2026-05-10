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
 *   node scripts/compute-quality-scores.mjs                  # Full run (threshold=45)
 *   node scripts/compute-quality-scores.mjs --dry-run        # Preview without writing
 *   node scripts/compute-quality-scores.mjs --threshold=70   # Only Gold tier indexable
 *   node scripts/compute-quality-scores.mjs --sample=20      # Score 20 products and show details
 */
import { PrismaClient } from '@prisma/client';
import { computeQualityScore, isIndexable, getQualityTier, getTierInfo, TIERS } from '../src/lib/quality-score.js';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SAMPLE_MODE = args.find(a => a.startsWith('--sample='));
const SAMPLE_SIZE = SAMPLE_MODE ? parseInt(SAMPLE_MODE.split('=')[1]) : 0;
const THRESHOLD_ARG = args.find(a => a.startsWith('--threshold='));
const THRESHOLD = THRESHOLD_ARG ? parseInt(THRESHOLD_ARG.split('=')[1]) : 45;
const BATCH_SIZE = 5000;

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
      include: { category: { select: { name: true } } },
    });

    for (const product of samples) {
      const result = computeQualityScore(product);
      const { score, tier, breakdown } = result;
      const tierInfo = getTierInfo(tier);
      console.log(`  ┌─ ${product.partNumber} (${product.manufacturer})`);
      console.log(`  │  Category: ${product.category?.name || '—'}`);
      console.log(`  │  Description: "${(product.description || '').substring(0, 80)}..."`);
      console.log(`  │`);
      console.log(`  │  📝 Description: ${breakdown.description.total}/30  (len=${breakdown.description.length} div=${breakdown.description.diversity} kw=${breakdown.description.keywords})`);
      console.log(`  │  📋 Specs:       ${breakdown.specs.total}/25  (keys=${breakdown.specs.keyCount} vals=${breakdown.specs.valueQuality})`);
      console.log(`  │  💰 Pricing:     ${breakdown.pricing.total}/15`);
      console.log(`  │  📄 Datasheet:   ${breakdown.datasheet.total}/10`);
      console.log(`  │  🖼️  Image:       ${breakdown.image.total}/10`);
      console.log(`  │  ♻️  Lifecycle:   ${breakdown.lifecycle.total}/10  (${product.status})`);
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

  const startTime = Date.now();
  const batches = Math.ceil(total / BATCH_SIZE);

  console.log('  📖 Phase 1: Computing scores in memory...');
  console.log('');

  for (let batch = 0; batch < batches; batch++) {
    const products = await prisma.product.findMany({
      skip: batch * BATCH_SIZE,
      take: BATCH_SIZE,
      orderBy: { id: 'asc' },
    });

    for (const product of products) {
      const result = computeQualityScore(product);
      tierCounts[result.tier]++;
      totalScore += result.score;
      if (isIndexable(result.score, THRESHOLD)) indexableCount++;
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

  // ━━━ Phase 2: Batch SQL update ━━━
  if (!DRY_RUN) {
    console.log('  📝 Phase 2: Writing scores to database (batch SQL)...');
    const writeStart = Date.now();
    let updateCount = 0;
    const scoreEntries = [...scoreMap.entries()];

    for (const [score, ids] of scoreEntries) {
      const indexable = isIndexable(score, THRESHOLD);

      // Process IDs in chunks to avoid SQL parameter limits
      const CHUNK = 10000;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const chunk = ids.slice(i, i + CHUNK);
        const idList = chunk.join(',');

        await prisma.$executeRawUnsafe(
          `UPDATE "Product" SET "qualityScore" = ${score}, "indexable" = ${indexable}, "updatedAt" = NOW() WHERE "id" IN (${idList})`
        );
        updateCount += chunk.length;
      }

      // Progress
      const pct = Math.round((updateCount / processed) * 100);
      process.stdout.write(`\r  ⏳ Writing: ${updateCount.toLocaleString()} / ${processed.toLocaleString()} (${pct}%)`);
    }

    const writeTime = ((Date.now() - writeStart) / 1000).toFixed(1);
    console.log(`\n  ✅ Phase 2 complete: ${updateCount.toLocaleString()} products updated in ${writeTime}s`);
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
