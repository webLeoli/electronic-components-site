// Post-write database maintenance, shared by every bulk product writer.
//
// Two things must happen after any bulk product write or the site degrades
// silently:
//   1. Product.isProgrammableLogic - the homepage rotation filters on this
//      precomputed flag. New rows default to false, so freshly imported FPGAs
//      never show up until the flag is refreshed.
//   2. VACUUM ANALYZE "Product" - bulk writes leave the pg_trgm GIN pending
//      lists unmerged and the planner stats stale, which pushes search back to
//      multi-second scans until autovacuum eventually catches up.
//
// Importers call runPostImportMaintenance(); scripts/flag-programmable-logic.mjs
// exposes the same work as a standalone command.
import { buildProgrammableLogicWhere } from '../src/lib/fpga-series-data.js';

// Idempotent: clears rows that no longer match, sets rows that now match.
export async function refreshProgrammableLogicFlag(prisma) {
  const plWhere = buildProgrammableLogicWhere();
  const t0 = Date.now();
  const cleared = await prisma.product.updateMany({
    where: { isProgrammableLogic: true, NOT: plWhere },
    data: { isProgrammableLogic: false },
  });
  const flagged = await prisma.product.updateMany({
    where: { AND: [plWhere, { isProgrammableLogic: false }] },
    data: { isProgrammableLogic: true },
  });
  const total = await prisma.product.count({ where: { isProgrammableLogic: true } });
  return {
    cleared: cleared.count,
    flagged: flagged.count,
    total,
    seconds: Math.round((Date.now() - t0) / 1000),
  };
}

// VACUUM cannot run inside a transaction block, so this must stay a bare
// $executeRawUnsafe (no $transaction wrapper).
export async function vacuumAnalyzeProducts(prisma) {
  await prisma.$executeRawUnsafe('VACUUM ANALYZE "Product"');
}

// Seed Product.contentUpdatedAt for rows that have never had it set: legacy
// rows from before the column existed, plus anything written by an importer
// that forgot to populate it. Raw SQL on purpose - a Prisma updateMany would
// bump `updatedAt`, which is exactly the pollution this column exists to avoid.
export async function backfillContentUpdatedAt(prisma) {
  return prisma.$executeRawUnsafe(
    'UPDATE "Product" SET "contentUpdatedAt" = "updatedAt" WHERE "contentUpdatedAt" IS NULL',
  );
}

export async function runPostImportMaintenance(prisma, { quiet = false } = {}) {
  const log = quiet ? () => {} : (msg) => console.log(msg);

  log('\nPost-import maintenance');
  const seeded = await backfillContentUpdatedAt(prisma);
  if (seeded) log(`  contentUpdatedAt seeded for ${seeded} row(s)`);
  const flag = await refreshProgrammableLogicFlag(prisma);
  log(
    `  isProgrammableLogic: cleared ${flag.cleared}, flagged ${flag.flagged}, ` +
      `total ${flag.total} (${flag.seconds}s)`,
  );

  try {
    const t0 = Date.now();
    await vacuumAnalyzeProducts(prisma);
    log(`  VACUUM ANALYZE "Product": done (${Math.round((Date.now() - t0) / 1000)}s)`);
  } catch (e) {
    // Non-fatal: the import itself succeeded. Surface the manual fallback.
    log(`  VACUUM ANALYZE "Product" failed: ${e.message}`);
    log('  Run it by hand: psql "$DATABASE_URL" -c \'VACUUM ANALYZE "Product"\'');
  }

  return flag;
}
