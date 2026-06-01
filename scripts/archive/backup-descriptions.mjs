/**
 * Backup all product (id, description) tuples to a timestamped JSONL file,
 * so we can restore any subset later if a generator regression slips in.
 *
 * Output: backups/descriptions-{YYYYMMDD-HHmm}.jsonl
 */

import { PrismaClient } from '@prisma/client';
import { mkdir, open } from 'node:fs/promises';
import { join } from 'node:path';

const prisma = new PrismaClient();

const ts = (() => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
})();

(async () => {
  await mkdir('backups', { recursive: true });
  const path = join('backups', `descriptions-${ts}.jsonl`);
  const fh = await open(path, 'w');

  const BATCH = 5000;
  let cursor = 0;
  let written = 0;

  while (true) {
    const rows = await prisma.product.findMany({
      where: { id: { gt: cursor } },
      select: { id: true, partNumber: true, description: true, qualityScore: true, indexable: true },
      orderBy: { id: 'asc' },
      take: BATCH,
    });
    if (rows.length === 0) break;
    const lines = rows.map(r => JSON.stringify(r)).join('\n') + '\n';
    await fh.write(lines);
    written += rows.length;
    cursor = rows[rows.length - 1].id;
    if (written % 50000 === 0) console.log(`  ... ${written.toLocaleString()} rows backed up`);
  }

  await fh.close();
  console.log(`\n✓ Backup complete: ${path} (${written.toLocaleString()} rows)`);
  await prisma.$disconnect();
})();
