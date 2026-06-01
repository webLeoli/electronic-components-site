/**
 * Pilot: regenerate descriptions for 50 sample products and compare quality scores.
 *
 * Run: node scripts/pilot-new-descriptions.mjs
 *
 * No DB writes — read-only dry run. Shows side-by-side old vs new description,
 * old vs new quality score breakdown, and a final aggregate Gold/Silver flip table.
 */

import { PrismaClient } from '@prisma/client';
import { generateDescription } from '../src/lib/desc-templates.js';
import { computeQualityScore } from '../src/lib/quality-score.js';

const prisma = new PrismaClient();

const TARGETS = [
  { label: 'Altera FPGA',    where: { manufacturer: 'Altera' },                take: 25 },
  { label: 'Torex Regulator', where: { manufacturer: 'Torex Semiconductor' },  take: 25 },
];

function fmt(n, pad = 3) { return String(n).padStart(pad); }

function colorTier(score) {
  if (score >= 70) return `\x1b[32mGOLD ${fmt(score)}\x1b[0m`;
  if (score >= 45) return `\x1b[34mSILV ${fmt(score)}\x1b[0m`;
  if (score >= 20) return `\x1b[33mBRNZ ${fmt(score)}\x1b[0m`;
  return `\x1b[31mNOIX ${fmt(score)}\x1b[0m`;
}

(async () => {
  const allSamples = [];

  for (const group of TARGETS) {
    const items = await prisma.product.findMany({
      where: group.where,
      include: { category: { include: { parent: true } } },
      orderBy: { id: 'asc' },
      take: group.take,
    });
    for (const p of items) allSamples.push({ group: group.label, product: p });
  }

  console.log(`\n===== Pilot: ${allSamples.length} samples =====\n`);

  let oldGold = 0, newGold = 0, oldSilver = 0, newSilver = 0;
  let flips = 0;

  for (const { group, product } of allSamples) {
    const specs = product.specs ? safeJson(product.specs) : {};
    const newDesc = generateDescription(product, specs);

    const oldScore = computeQualityScore(product);
    const newScore = computeQualityScore({ ...product, description: newDesc });

    if (oldScore.score >= 70) oldGold++;
    else if (oldScore.score >= 45) oldSilver++;
    if (newScore.score >= 70) newGold++;
    else if (newScore.score >= 45) newSilver++;
    if (oldScore.score < 70 && newScore.score >= 70) flips++;

    console.log(`[${group}] ${product.partNumber}`);
    console.log(`  OLD (${(product.description || '').length}c, ${colorTier(oldScore.score)}): "${(product.description || '').substring(0, 130)}"`);
    console.log(`     breakdown: desc=${oldScore.breakdown.description.total} (len=${oldScore.breakdown.description.length} div=${oldScore.breakdown.description.diversity} kw=${oldScore.breakdown.description.keywords})  specs=${oldScore.breakdown.specs.total}  pr=${oldScore.breakdown.pricing.total}  ds=${oldScore.breakdown.datasheet.total}  img=${oldScore.breakdown.image.total}  lc=${oldScore.breakdown.lifecycle.total}`);
    console.log(`  NEW (${newDesc.length}c, ${colorTier(newScore.score)}): "${newDesc.substring(0, 250)}${newDesc.length > 250 ? '...' : ''}"`);
    console.log(`     breakdown: desc=${newScore.breakdown.description.total} (len=${newScore.breakdown.description.length} div=${newScore.breakdown.description.diversity} kw=${newScore.breakdown.description.keywords})  specs=${newScore.breakdown.specs.total}  pr=${newScore.breakdown.pricing.total}  ds=${newScore.breakdown.datasheet.total}  img=${newScore.breakdown.image.total}  lc=${newScore.breakdown.lifecycle.total}`);
    console.log();
  }

  console.log('===== Aggregate =====');
  console.log(`Sample size:                  ${allSamples.length}`);
  console.log(`OLD Gold (≥70 indexable):     ${oldGold}`);
  console.log(`NEW Gold (≥70 indexable):     ${newGold}    (Δ +${newGold - oldGold})`);
  console.log(`OLD Silver (45-69):           ${oldSilver}`);
  console.log(`NEW Silver (45-69):           ${newSilver}    (Δ ${newSilver - oldSilver >= 0 ? '+' : ''}${newSilver - oldSilver})`);
  console.log(`Silver→Gold flips:            ${flips}    (${((flips / allSamples.length) * 100).toFixed(1)}% of pilot)`);

  await prisma.$disconnect();
})();

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
