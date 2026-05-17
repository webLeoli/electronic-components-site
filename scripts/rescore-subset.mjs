/**
 * Recompute qualityScore + indexable for a subset of products.
 *
 * Usage:
 *   node scripts/rescore-subset.mjs --ids=1,2,3,...      # inline list (small)
 *   node scripts/rescore-subset.mjs --file=ids.txt       # comma-separated ids in file
 *   node scripts/rescore-subset.mjs --file=ids.txt --threshold=70
 *   node scripts/rescore-subset.mjs --file=ids.txt --samples=20   # show 20 detail lines (default 10)
 *
 * Output is summary-only by default; only --samples N rows are printed in full
 * so the output stays readable when rescoring hundreds of thousands of ids.
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { computeQualityScore, isIndexable } from '../src/lib/quality-score.js';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const IDS_ARG  = args.find(a => a.startsWith('--ids='));
const FILE_ARG = args.find(a => a.startsWith('--file='));
const THRESHOLD = (() => {
  const a = args.find(a => a.startsWith('--threshold='));
  return a ? parseInt(a.split('=')[1], 10) : 70;
})();
const SAMPLES = (() => {
  const a = args.find(a => a.startsWith('--samples='));
  return a ? parseInt(a.split('=')[1], 10) : 10;
})();

if (!IDS_ARG && !FILE_ARG) { console.error('Provide --ids=1,2,3 or --file=path.txt'); process.exit(1); }

function loadIds() {
  let raw = '';
  if (IDS_ARG)  raw += IDS_ARG.split('=')[1] + ',';
  if (FILE_ARG) raw += readFileSync(FILE_ARG.split('=')[1], 'utf8');
  return [...new Set(
    raw.split(/[,\s]+/).map(s => s.trim()).filter(Boolean).map(Number).filter(Number.isFinite),
  )];
}

const ids = loadIds();
const BATCH = 1000;

(async () => {
  console.log(`Rescoring ${ids.length.toLocaleString()} products with threshold=${THRESHOLD}`);
  console.log(`Showing up to ${SAMPLES} sample rows; aggregate stats at the end.\n`);

  let flips = 0, downgrades = 0, unchanged = 0;
  let goldNew = 0, silverNew = 0, bronzeNew = 0, noindexNew = 0;
  const samples = [];

  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const products = await prisma.product.findMany({ where: { id: { in: chunk } } });

    const updates = products.map(p => {
      const result = computeQualityScore(p);
      const indexableFlag = isIndexable(result.score, THRESHOLD);
      const beforeIdx = p.indexable;
      const beforeScore = p.qualityScore;

      if (!beforeIdx && indexableFlag) flips++;
      else if (beforeIdx && !indexableFlag) downgrades++;
      else unchanged++;

      if (result.score >= 70) goldNew++;
      else if (result.score >= 45) silverNew++;
      else if (result.score >= 20) bronzeNew++;
      else noindexNew++;

      if (samples.length < SAMPLES) {
        samples.push({ partNumber: p.partNumber, mfr: p.manufacturer, before: { score: beforeScore, idx: beforeIdx }, after: { score: result.score, idx: indexableFlag } });
      }

      return prisma.product.update({
        where: { id: p.id },
        data: { qualityScore: result.score, indexable: indexableFlag },
      });
    });

    // Run all updates in this batch concurrently then await — much faster than one-by-one
    await prisma.$transaction(updates);

    if ((i + BATCH) % 10000 === 0) console.log(`  ... ${Math.min(i + BATCH, ids.length).toLocaleString()} processed`);
  }

  console.log('\nSample rows:');
  for (const r of samples) {
    const arrow = r.before.idx === r.after.idx ? '=' : (r.after.idx ? '↑' : '↓');
    console.log(`  ${r.partNumber.padEnd(24)} ${r.mfr.padEnd(22)} ${r.before.score}→${r.after.score}  idx ${r.before.idx}→${r.after.idx} ${arrow}`);
  }

  console.log(`\n=== Aggregate ===`);
  console.log(`Total rescored:        ${ids.length.toLocaleString()}`);
  console.log(`Flipped to indexable:  ${flips.toLocaleString()}`);
  console.log(`Downgraded:            ${downgrades.toLocaleString()}`);
  console.log(`Unchanged (idx flag):  ${unchanged.toLocaleString()}`);
  console.log('Tier distribution after rescore:');
  console.log(`  Gold (≥70):    ${goldNew.toLocaleString()}`);
  console.log(`  Silver (45-69):${silverNew.toLocaleString()}`);
  console.log(`  Bronze (20-44):${bronzeNew.toLocaleString()}`);
  console.log(`  Noindex (<20): ${noindexNew.toLocaleString()}`);

  await prisma.$disconnect();
})();
