/**
 * Apply v2 descriptions to selected products and persist to DB.
 *
 * Crash-safe behaviour: for each product, the ID is appended to --ids-out
 * BEFORE the DB UPDATE runs. If the process dies between the append and the
 * update, the recorded ID points at a row whose DB description is still the
 * old value — a later `restore-descriptions.mjs --ids-file=…` call on it is a
 * no-op (it writes back the same value), so no rollback gap.
 *
 * Usage:
 *   node scripts/apply-new-descriptions.mjs --dry-run
 *   node scripts/apply-new-descriptions.mjs --mfr=Altera --limit=25
 *   node scripts/apply-new-descriptions.mjs --mfr="Torex Semiconductor" --limit=25
 *   node scripts/apply-new-descriptions.mjs --silver-only --limit=1000 --ids-out=phase31-ids.txt --skip-uncategorized
 *
 * Flags:
 *   --dry-run               Print samples, write nothing.
 *   --mfr=NAME              Restrict to a single manufacturer (exact match).
 *   --limit=N               Process at most N products (after filtering).
 *   --silver-only           Only update products with qualityScore in [45, 69].
 *   --skip-uncategorized    Skip products whose categoryId is null. Recommended
 *                           during the v2 rollout — these products fall back to
 *                           "integrated circuit" because there's no signal to
 *                           classify them. Will be handled separately after a
 *                           category-backfill pass.
 *   --skip-existing-long    Skip products whose existing description is already
 *                           > 250 chars (re-run safety).
 *   --ids-out=PATH          Append the id of every product to this file BEFORE
 *                           the DB update (crash-safe). Comma-separated, single
 *                           line. Path is truncated at start of run.
 *   --ids-file=PATH         Restrict to the comma-separated id list in PATH.
 *                           Combines with other filters (--silver-only etc.).
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { generateDescription } from '../src/lib/desc-templates.js';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN              = args.includes('--dry-run');
const SILVER_ONLY          = args.includes('--silver-only');
const SKIP_EXISTING_LONG   = args.includes('--skip-existing-long');
const SKIP_UNCATEGORIZED   = args.includes('--skip-uncategorized');
const MFR_ARG = args.find(a => a.startsWith('--mfr='));
const MFR = MFR_ARG ? MFR_ARG.split('=')[1].replace(/^["']|["']$/g, '') : null;
const LIMIT_ARG = args.find(a => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : Infinity;
const IDS_OUT_ARG = args.find(a => a.startsWith('--ids-out='));
const IDS_OUT = IDS_OUT_ARG ? IDS_OUT_ARG.split('=')[1] : null;
const IDS_FILE_ARG = args.find(a => a.startsWith('--ids-file='));
const IDS_FILTER = IDS_FILE_ARG
  ? new Set(readFileSync(IDS_FILE_ARG.split('=')[1], 'utf8').split(/[,\s]+/).map(s => +s.trim()).filter(Number.isFinite))
  : null;

// Truncate ids-out at start; the file must end up matching exactly the set of
// rows attempted on this run.
if (IDS_OUT && !DRY_RUN) writeFileSync(IDS_OUT, '');

// Crash-safe ID recording: append synchronously BEFORE every UPDATE. If the
// process dies after this line but before the UPDATE completes, the row stays
// at its pre-run description and a later restore call on the recorded ID is a
// no-op. Cost is one fs.appendFileSync per row (~0.1ms vs ~10ms for UPDATE) —
// negligible.
let idsWritten = 0;
function recordId(id) {
  if (!IDS_OUT || DRY_RUN) return;
  appendFileSync(IDS_OUT, (idsWritten === 0 ? '' : ',') + id);
  idsWritten++;
}

const BATCH_SIZE = 200;

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }

async function main() {
  console.log(`Mode:               ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE — writing to DB'}`);
  console.log(`Manufacturer:       ${MFR || '(all)'}`);
  console.log(`Silver only:        ${SILVER_ONLY}`);
  console.log(`Skip uncategorized: ${SKIP_UNCATEGORIZED}`);
  console.log(`Skip existing long: ${SKIP_EXISTING_LONG}`);
  console.log(`Limit:              ${LIMIT === Infinity ? '∞' : LIMIT}`);
  console.log(`ids-out:            ${IDS_OUT || '(none)'}`);
  console.log('');

  const where = {};
  if (MFR) where.manufacturer = MFR;
  if (SILVER_ONLY) where.qualityScore = { gte: 45, lt: 70 };
  if (SKIP_UNCATEGORIZED) where.categoryId = { not: null };
  if (IDS_FILTER) where.id = { in: [...IDS_FILTER] };

  if (IDS_FILTER) console.log(`Restricted to ${IDS_FILTER.size} ids from ${IDS_FILE_ARG.split('=')[1]}`);

  let processed = 0;
  let updated = 0;
  let skippedLong = 0;
  let cursor = 0;

  while (processed < LIMIT) {
    const remaining = LIMIT - processed;
    const take = Math.min(BATCH_SIZE, remaining);

    const products = await prisma.product.findMany({
      where: { ...where, id: { gt: cursor } },
      include: { category: { include: { parent: true } } },
      orderBy: { id: 'asc' },
      take,
    });

    if (products.length === 0) break;

    for (const p of products) {
      cursor = p.id;
      processed++;

      const specs = p.specs ? safeJson(p.specs) : {};
      const newDesc = generateDescription(p, specs);

      if (SKIP_EXISTING_LONG && (p.description || '').length >= 250) {
        skippedLong++;
        if (processed >= LIMIT) break;
        continue;
      }

      if (DRY_RUN) {
        if (updated < 5) {
          console.log(`[dry] ${p.partNumber} (${p.manufacturer})`);
          console.log(`  OLD (${(p.description || '').length}c): "${(p.description || '').substring(0, 120)}"`);
          console.log(`  NEW (${newDesc.length}c): "${newDesc.substring(0, 180)}..."`);
        }
        updated++;
      } else {
        // CRASH-SAFE ORDER: record id first, then write to DB.
        recordId(p.id);
        await prisma.product.update({
          where: { id: p.id },
          data: { description: newDesc },
        });
        updated++;
        if (updated % 1000 === 0) console.log(`  ... ${updated.toLocaleString()} updated`);
      }

      if (processed >= LIMIT) break;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Scanned:        ${processed.toLocaleString()}`);
  console.log(`${DRY_RUN ? 'Would update' : 'Updated'}:   ${updated.toLocaleString()}`);
  console.log(`Skipped (long): ${skippedLong.toLocaleString()}`);
  if (IDS_OUT && !DRY_RUN) console.log(`IDs written to: ${IDS_OUT}  (${idsWritten.toLocaleString()} ids)`);

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
