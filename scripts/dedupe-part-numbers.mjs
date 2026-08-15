/**
 * Consolidate part numbers that differ only in punctuation.
 *
 * Supplier feeds ship the same orderable part under several spellings — NXP's
 * 12NC suffix survives as "74AHC132D,112" in one feed and gets flattened to
 * "74AHC132D112" in a reseller's — and Product.partNumber's @unique constraint
 * treats those as different products. Measured 2026-08 on the live catalogue:
 * 1,861 such groups, 3,814 rows, 1,211 of them indexable.
 *
 * WHAT COUNTS AS THE SAME PART
 * ----------------------------
 * Only separator punctuation is ignored: , ; : ' " space . _ - / \ ( ). Anything
 * else, including "+", is part of the orderable identity.
 *
 * Getting this wrong in the obvious direction is expensive. Stripping EVERY
 * non-alphanumeric character — the first cut of this script — produced 12,315
 * groups covering 24,760 rows, but 10,121 of those groups (82%) paired a "+" part
 * with a non-"+" one: "MAX505ACNG+" (Maxim, lead-free) against "MAX505ACNG"
 * (the leaded part). Those are different orderable items, they differ in exactly
 * the RoHS spec fields, and consolidating them would have 301'd away thousands of
 * legitimate pages. Suffixes that encode a variant must survive normalization.
 *
 * Strategy: pick the row with the most real specification values as the page that
 * survives, point the rest at it via Product.duplicateOfId and drop them from the
 * index. The product route 301s a duplicate to its survivor, so no URL dies.
 * Nothing is deleted — a duplicate can be released again by clearing the column.
 *
 * Why "most filled specs" picks the right winner: the thin row is almost always a
 * reseller listing whose spec table is entirely "-" (34,864 of Rochester
 * Electronics' rows are like this), while the OEM row carries the real data.
 *
 * Tie-breaking, when two rows are equally detailed and carry different brands
 * (typically "…ADGG:51" from NXP against "…ADGG,51" from Nexperia, its own
 * standard-logic spin-off): the OEM row wins over a distributor row, then stock,
 * then the lower id. If the two rows' filled specifications actually disagree,
 * the data itself is saying they may not be the same item — those groups are left
 * alone and reported instead.
 *
 * Usage:
 *   node scripts/dedupe-part-numbers.mjs                 # dry run (default)
 *   node scripts/dedupe-part-numbers.mjs --apply         # write
 *   node scripts/dedupe-part-numbers.mjs --limit=50      # inspect 50 groups
 *   node scripts/dedupe-part-numbers.mjs --reset --apply # release all duplicates
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { scoreSpecs } from '../src/lib/quality-score.js';
import { isDistributorBrand } from '../src/lib/manufacturer-canonical.js';
import { normalizedPartNumberSql } from '../src/lib/part-number.js';

const prisma = new PrismaClient();

// The rule itself lives in lib/part-number.js, shared with the audit script.
const NORMALIZED_PART_SQL = normalizedPartNumberSql();

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const RESET = args.includes('--reset');
const LIMIT_ARG = args.find(a => a.startsWith('--limit='));
const SHOW_LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : 25;

async function run() {
  console.log(`Mode: ${APPLY ? '✏️  APPLY (writing)' : '🔍 DRY RUN (no writes) — pass --apply to commit'}`);

  if (RESET) {
    if (!APPLY) {
      const n = await prisma.product.count({ where: { duplicateOfId: { not: null } } });
      console.log(`\n--reset would release ${n.toLocaleString()} rows (duplicateOfId → NULL).`);
      console.log('Note: indexable is NOT restored here — re-run compute-quality-scores.mjs for that.');
      await prisma.$disconnect();
      return;
    }
    const released = await prisma.$executeRawUnsafe(
      `UPDATE "Product" SET "duplicateOfId" = NULL WHERE "duplicateOfId" IS NOT NULL`
    );
    console.log(`✅ released ${released.toLocaleString()} rows. Re-run compute-quality-scores.mjs to restore indexable.`);
    await prisma.$disconnect();
    return;
  }

  // One pass over Product: normalize, keep only keys with more than one row.
  // The CTE is referenced twice so Postgres materializes it — this is a single
  // seq scan plus a hash aggregate, NOT a per-row subquery.
  console.log('\n📖 Loading duplicate groups…');
  const rows = await prisma.$queryRawUnsafe(`
    WITH k AS (
      SELECT id, "partNumber", "manufacturer", "qualityScore", "minPrice", "stock",
             "specs", "indexable", "categoryId", "duplicateOfId",
             ${NORMALIZED_PART_SQL} AS nk
      FROM "Product"
    ),
    d AS (SELECT nk FROM k GROUP BY nk HAVING COUNT(*) > 1)
    SELECT k.* FROM k JOIN d USING (nk) ORDER BY k.nk, k.id
  `);
  console.log(`   ${rows.length.toLocaleString()} rows in duplicate groups`);

  // Group and rank.
  const groups = new Map();
  for (const row of rows) {
    // filledKeys comes from the same predicate the quality score uses, so "rich"
    // here means exactly what it means to the indexing gate.
    row.filled = scoreSpecs(row.specs).filledKeys || 0;
    if (!groups.has(row.nk)) groups.set(row.nk, []);
    groups.get(row.nk).push(row);
  }

  // Fingerprint of the real, TECHNICAL specifications. Two rows that agree here
  // describe the same device; two that disagree might not.
  //
  // Compliance and lifecycle fields are excluded on purpose. They are properties
  // of a listing, not of the silicon, and two channels listing the same part
  // routinely disagree on them: of the 158 groups this rule first left unresolved,
  // the differences were "Product Status: Active vs Obsolete" (127), "China RoHS
  // Status" (99), "REACH Status" (91) and "US ECCN" (65) — the electrical specs
  // and the package were identical. Package fields stay in: a different package
  // really is a different orderable part.
  const NON_TECHNICAL_SPEC_KEYS = new Set([
    'Product  Status', 'Product Status', 'Status',
    'China RoHS Status', 'EU RoHS Status', 'RoHS Status', 'REACH Status',
    'US ECCN', 'ECCN', 'HTS US', 'HTS', 'Country of Origin',
    'MSL Rating', 'Moisture Sensitivity Level (MSL)',
  ]);

  const fingerprint = (row) => {
    let parsed;
    try { parsed = JSON.parse(row.specs || '{}'); } catch { return `unparseable:${row.id}`; }
    return JSON.stringify(
      Object.entries(parsed)
        .filter(([k, v]) => {
          if (NON_TECHNICAL_SPEC_KEYS.has(k.trim()) || NON_TECHNICAL_SPEC_KEYS.has(k)) return false;
          const val = String(v ?? '').trim();
          return val && val !== '-' && val !== '—' && val !== 'N/A' && val !== 'n/a';
        })
        .sort(([a], [b]) => a.localeCompare(b))
    );
  };

  const plans = [];
  const skipped = [];
  let sticky = 0;
  for (const [nk, members] of groups) {
    const ranked = [...members].sort((a, b) =>
      b.filled - a.filled ||
      // An OEM page outranks a reseller's listing of the same part.
      (isDistributorBrand(a.manufacturer) ? 1 : 0) - (isDistributorBrand(b.manufacturer) ? 1 : 0) ||
      b.qualityScore - a.qualityScore ||
      (b.minPrice != null) - (a.minPrice != null) ||
      b.stock - a.stock ||
      a.id - b.id
    );
    let [winner, runnerUp] = ranked;

    // Stickiness. qualityScore is one of the tie-breaks above and it is
    // recomputed after every import, so an unchanged group could rank a
    // different member on the next run — the surviving page would start
    // redirecting and a redirecting one would become canonical. URLs flapping
    // between 200 and 301 is worse for search than any ranking refinement.
    //
    // So once a group is consolidated, its winner stays, UNLESS a challenger has
    // strictly more real specifications: that is a genuine data improvement, not
    // score noise. (Measured 2026-08-15: without this, one of 1,816 consolidated
    // groups would already flip on the next run purely from rescoring.)
    const established = members.find(m =>
      m.duplicateOfId === null && members.some(other => other.duplicateOfId === m.id));
    if (established && established.id !== winner.id && winner.filled <= established.filled) {
      winner = established;
      runnerUp = ranked.find(r => r.id !== established.id);
      sticky++;
    }

    // Equally detailed, different brands, and the specs themselves disagree:
    // leave both pages standing rather than guess which one is authoritative.
    if (winner.filled === runnerUp.filled
      && winner.manufacturer !== runnerUp.manufacturer
      && fingerprint(winner) !== fingerprint(runnerUp)) {
      skipped.push({ nk, members: ranked });
      continue;
    }
    // Losers are "every member except the winner" — NOT ranked.slice(1). With a
    // sticky winner those differ, and slicing would put the winner in its own
    // loser list, pointing duplicateOfId at itself.
    plans.push({ nk, winner, losers: ranked.filter(r => r.id !== winner.id) });
  }

  const loserCount = plans.reduce((s, p) => s + p.losers.length, 0);
  const loserIndexable = plans.reduce((s, p) => s + p.losers.filter(l => l.indexable).length, 0);

  console.log('');
  console.log('━'.repeat(70));
  console.log(`  Groups found:            ${groups.size.toLocaleString()}`);
  console.log(`  Groups to consolidate:   ${plans.length.toLocaleString()}`);
  console.log(`  Groups skipped (tie):    ${skipped.length.toLocaleString()}  — equal detail, different brand`);
  console.log(`  Winner kept (sticky):    ${sticky.toLocaleString()}  — ranking drifted, URL kept stable`);
  console.log(`  Rows to redirect:        ${loserCount.toLocaleString()}  (${loserIndexable.toLocaleString()} currently indexable)`);
  console.log('━'.repeat(70));

  console.log(`\nSample of ${Math.min(SHOW_LIMIT, plans.length)} consolidations:`);
  for (const plan of plans.slice(0, SHOW_LIMIT)) {
    console.log(`  KEEP  ${plan.winner.partNumber} @${plan.winner.manufacturer} (specs=${plan.winner.filled}, score=${plan.winner.qualityScore})`);
    for (const loser of plan.losers) {
      console.log(`   └─→  ${loser.partNumber} @${loser.manufacturer} (specs=${loser.filled}, score=${loser.qualityScore})`);
    }
  }

  if (skipped.length > 0) {
    console.log(`\nSample of ${Math.min(10, skipped.length)} skipped groups (left as separate pages):`);
    for (const s of skipped.slice(0, 10)) {
      console.log(`  ${s.members.map(m => `${m.partNumber} @${m.manufacturer} (specs=${m.filled})`).join('  |  ')}`);
    }
  }

  if (!APPLY) {
    console.log('\nℹ️  DRY RUN — nothing written. Re-run with --apply.');
    await prisma.$disconnect();
    return;
  }

  // Write: losers point at their winner and leave the index; winners are cleared
  // in case a previous run had them pointing elsewhere.
  console.log('\n📝 Writing…');
  const CHUNK = 5000;
  let written = 0;

  const winnerIds = plans.map(p => p.winner.id).filter((id, i, a) => a.indexOf(id) === i);
  for (let i = 0; i < winnerIds.length; i += CHUNK) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Product" SET "duplicateOfId" = NULL
        WHERE "id" IN (${winnerIds.slice(i, i + CHUNK).join(',')}) AND "duplicateOfId" IS NOT NULL`
    );
  }

  // Group the updates by winner id so each statement is a simple IN-list.
  let planIndex = 0;
  for (const plan of plans) {
    const ids = plan.losers.map(l => l.id);
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      await prisma.$executeRawUnsafe(
        // No contentUpdatedAt bump: these pages stop being pages. Dropping them
        // from the sitemap (indexable = false) is the visible change, and a
        // lastmod on a URL that now 301s would be noise.
        `UPDATE "Product"
            SET "duplicateOfId" = ${plan.winner.id}, "indexable" = false
          WHERE "id" IN (${chunk.join(',')})`
      );
      written += chunk.length;
    }
    // Each plan writes only one or two rows, so report per 200 groups rather than
    // per row — a per-row counter emits ~1,800 lines of noise.
    if (++planIndex % 200 === 0) {
      process.stdout.write(`\r   ${written.toLocaleString()} / ${loserCount.toLocaleString()} rows`);
    }
  }
  console.log(`\r   ${written.toLocaleString()} / ${loserCount.toLocaleString()} rows updated`);

  console.log('\n🧹 VACUUM ANALYZE "Product" …');
  await prisma.$executeRawUnsafe('VACUUM (ANALYZE) "Product"');

  const [remaining, indexableNow] = await Promise.all([
    prisma.product.count({ where: { duplicateOfId: { not: null } } }),
    prisma.product.count({ where: { indexable: true } }),
  ]);
  console.log(`\n✅ ${remaining.toLocaleString()} rows now redirect to a canonical part.`);
  console.log(`   Indexable pages: ${indexableNow.toLocaleString()}`);
  console.log('   Revalidate the "sitemap" cache tag (or restart) so shards drop them.');

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
