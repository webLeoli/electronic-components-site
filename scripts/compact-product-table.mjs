/**
 * Reclaim heap bloat left behind by bulk rewrites.
 *
 * Every UPDATE writes a new row version and leaves the old one dead. Plain
 * VACUUM (which the data scripts run) marks that space reusable but never gives
 * it back, so the table keeps its high-water mark and every sequential or bitmap
 * scan keeps paying for it. Search is exactly that kind of scan: ILIKE '%q%'
 * over three columns.
 *
 * Measured after the 2026-08-15 cleanup, which rewrote ~236K descriptions, ~105K
 * brand values and scored 719K rows twice:
 *
 *   heap 2,363 MB / 302,502 pages  →  a broad query counted 111,463 matches in
 *   6,268 ms, almost all of it reading pages.
 *
 * VACUUM FULL rewrites the table compactly and rebuilds every index. It takes an
 * ACCESS EXCLUSIVE lock — the table is unavailable for the duration, so run it in
 * a maintenance window, not against live traffic — and needs free disk equal to
 * the new copy.
 *
 * Run it after any bulk data migration. Routine imports do not need it.
 *
 * Usage:
 *   node scripts/compact-product-table.mjs            # report only
 *   node scripts/compact-product-table.mjs --apply    # VACUUM FULL + ANALYZE
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

async function sizes() {
  const [row] = await prisma.$queryRawUnsafe(`
    SELECT pg_total_relation_size('"Product"')::bigint AS total,
           pg_relation_size('"Product"')::bigint AS heap,
           pg_indexes_size('"Product"')::bigint AS indexes,
           (SELECT relpages::int FROM pg_class WHERE relname = 'Product') AS pages,
           (SELECT n_dead_tup::int FROM pg_stat_user_tables WHERE relname = 'Product') AS dead,
           (SELECT n_live_tup::int FROM pg_stat_user_tables WHERE relname = 'Product') AS live`);
  return row;
}

const mb = (bytes) => `${(Number(bytes) / 1024 / 1024).toFixed(0)} MB`;

function report(label, s) {
  console.log(`  ${label}`);
  console.log(`    total ${mb(s.total)}  (heap ${mb(s.heap)}, indexes ${mb(s.indexes)})`);
  console.log(`    ${s.pages.toLocaleString()} heap pages for ${s.live.toLocaleString()} live rows`
    + ` = ${(s.pages / s.live).toFixed(3)} pages/row, ${s.dead.toLocaleString()} dead tuples`);
}

async function run() {
  console.log(`Mode: ${APPLY ? '✏️  APPLY (takes an ACCESS EXCLUSIVE lock on Product)' : '🔍 REPORT ONLY — pass --apply to compact'}\n`);

  const before = await sizes();
  report('before', before);

  if (!APPLY) {
    console.log('\nℹ️  Nothing written. VACUUM FULL locks the table for minutes at this size —');
    console.log('   run it when the site can be offline, then re-check with this script.');
    await prisma.$disconnect();
    return;
  }

  console.log('\n  🧹 VACUUM (FULL, ANALYZE) "Product" … this blocks all access until it finishes');
  const started = Date.now();
  await prisma.$executeRawUnsafe('VACUUM (FULL, ANALYZE) "Product"');
  console.log(`  ✅ done in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);

  const after = await sizes();
  report('after', after);
  const saved = Number(before.total) - Number(after.total);
  console.log(`\n  reclaimed ${mb(saved)} (${((saved / Number(before.total)) * 100).toFixed(1)}%)`);

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
