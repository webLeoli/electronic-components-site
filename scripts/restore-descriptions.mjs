/**
 * Restore product (description, qualityScore, indexable) tuples from a backup JSONL.
 *
 * Usage:
 *   node scripts/restore-descriptions.mjs --file=backups/descriptions-20260517-1700.jsonl
 *   node scripts/restore-descriptions.mjs --file=BACKUP --ids=1,2,3
 *   node scripts/restore-descriptions.mjs --file=BACKUP --ids-file=phase32-torex.txt
 *   node scripts/restore-descriptions.mjs --file=BACKUP --ids-file=phase32-torex.txt --dry-run
 *
 * Filters can be combined: --ids and --ids-file are merged into one set.
 * Without any id filter, every row in the backup is restored (slow — full DB).
 */

import { PrismaClient } from '@prisma/client';
import { createInterface } from 'node:readline';
import { createReadStream, readFileSync } from 'node:fs';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FILE_ARG     = args.find(a => a.startsWith('--file='));
const IDS_ARG      = args.find(a => a.startsWith('--ids='));
const IDS_FILE_ARG = args.find(a => a.startsWith('--ids-file='));
if (!FILE_ARG) { console.error('--file=<backup.jsonl> required'); process.exit(1); }
const FILE = FILE_ARG.split('=')[1];

function loadIds() {
  let raw = '';
  if (IDS_ARG)      raw += IDS_ARG.split('=')[1] + ',';
  if (IDS_FILE_ARG) raw += readFileSync(IDS_FILE_ARG.split('=')[1], 'utf8');
  if (!raw) return null;
  const ids = raw.split(/[,\s]+/).map(s => s.trim()).filter(Boolean).map(Number).filter(Number.isFinite);
  return new Set(ids);
}

const IDS = loadIds();

const BATCH = 500; // batch updates inside a $transaction for throughput

(async () => {
  console.log(`Restoring from ${FILE}${IDS ? ` (only ${IDS.size.toLocaleString()} ids)` : ' (all rows — full DB!)'}${DRY_RUN ? ' — DRY RUN' : ''}`);

  const rl = createInterface({ input: createReadStream(FILE), crlfDelay: Infinity });
  let updated = 0;
  let skipped = 0;
  let pending = [];

  async function flush() {
    if (pending.length === 0) return;
    if (!DRY_RUN) {
      await prisma.$transaction(
        pending.map(row => prisma.product.update({
          where: { id: row.id },
          data: { description: row.description, qualityScore: row.qualityScore, indexable: row.indexable },
        }))
      );
    }
    updated += pending.length;
    if (updated % 5000 < BATCH) console.log(`  ... ${updated.toLocaleString()} restored`);
    pending = [];
  }

  for await (const line of rl) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (IDS && !IDS.has(row.id)) { skipped++; continue; }

    if (DRY_RUN && updated + pending.length < 5) {
      console.log(`[dry] ${row.id} ${row.partNumber}  desc(${(row.description || '').length}c)  q=${row.qualityScore}  idx=${row.indexable}`);
    }
    pending.push(row);
    if (pending.length >= BATCH) await flush();
  }
  await flush();

  console.log(`\n${DRY_RUN ? 'Would restore' : 'Restored'}: ${updated.toLocaleString()}`);
  console.log(`Skipped (not in id filter): ${skipped.toLocaleString()}`);
  await prisma.$disconnect();
})();
