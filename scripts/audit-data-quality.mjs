/**
 * Read-only data-quality audit: duplicate brands, duplicate parts, thin content.
 *
 * Run it after every bulk import. Each check below corresponds to a defect class
 * that was found in the catalogue in 2026-08 and fixed — the point of the script
 * is to notice the regression on the next feed drop instead of months later:
 *
 *   1. brand duplicates      — 25 spellings of 13 companies, 35 brand pages with
 *                              zero products (docs/data-quality-audit.md §2)
 *   2. part duplicates       — 1,861 groups differing only in separator
 *                              punctuation (§3)
 *   3. thin specs            — 76,463 rows padded with "-" placeholders (§5)
 *   4. distributor copy      — "manufactured by Rochester Electronics" (§4)
 *   5. placeholder leaks     — "This - component" in generated prose
 *
 * Exits 1 if any check finds something, so it can gate an import pipeline.
 *
 * Usage: node scripts/audit-data-quality.mjs
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { scoreSpecs } from '../src/lib/quality-score.js';
import {
  canonicalManufacturer,
  DISTRIBUTOR_BRANDS,
} from '../src/lib/manufacturer-canonical.js';
import { normalizedPartNumberSql } from '../src/lib/part-number.js';
import { FALLBACK_BRANDS } from '../src/lib/fallbacks.js';

const prisma = new PrismaClient();

// Shared with scripts/dedupe-part-numbers.mjs via lib/part-number.js, so this
// audit can never report a duplicate count the dedupe would not act on.
const NORMALIZED_PART_SQL = normalizedPartNumberSql();

const findings = [];
function check(label, count, detail) {
  const clean = count === 0;
  console.log(`${clean ? '✅' : '⚠️ '} ${label}: ${count.toLocaleString()}`);
  if (detail) console.log(`      ${detail}`);
  if (!clean) findings.push(`${label}: ${count.toLocaleString()}`);
}

async function run() {
  console.log('━'.repeat(70));
  console.log('  Data quality audit');
  console.log('━'.repeat(70));

  const [products, brands] = await Promise.all([
    prisma.product.count(),
    prisma.manufacturer.count(),
  ]);
  console.log(`  ${products.toLocaleString()} products / ${brands} brands\n`);

  // ── 1. Brand hygiene ────────────────────────────────────────────────────
  const productBrands = await prisma.$queryRawUnsafe(
    `SELECT "manufacturer" AS name, COUNT(*)::int AS n FROM "Product" GROUP BY 1`
  );
  const aliasSpellings = productBrands.filter(b => canonicalManufacturer(b.name) !== b.name);
  check('Product rows under a known duplicate brand spelling',
    aliasSpellings.reduce((s, b) => s + b.n, 0),
    aliasSpellings.length ? `run scripts/merge-manufacturers.mjs — ${aliasSpellings.map(b => `"${b.name}"`).join(', ')}` : '');

  const [{ n: emptyBrands }] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS n FROM "Manufacturer" m
      WHERE NOT EXISTS (SELECT 1 FROM "Product" p WHERE p."manufacturer" = m.name)`
  );
  check('Brand pages with zero products', emptyBrands,
    emptyBrands ? 'they render as "0 products" and ship in the sitemap' : '');

  const [{ n: brandlessProducts }] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(DISTINCT p."manufacturer")::int AS n FROM "Product" p
      WHERE NOT EXISTS (SELECT 1 FROM "Manufacturer" m WHERE m.name = p."manufacturer")`
  );
  check('Product brands with no Manufacturer row', brandlessProducts,
    brandlessProducts ? 'run scripts/sync-manufacturers.mjs' : '');

  // lib/fallbacks.js is hand-maintained and easy to forget after a rename. Its
  // brand names feed the degraded-mode UI and the last-resort resolver in the
  // /manufacturer/[slug] route, so a stale spelling there rebuilds the exact
  // 0-product page a merge just retired. This has now been missed twice.
  const brandCounts = new Map(productBrands.map(b => [b.name, b.n]));
  const staleFallbacks = FALLBACK_BRANDS.filter(
    name => canonicalManufacturer(name) !== name || !brandCounts.has(name)
  );
  check('FALLBACK_BRANDS entries that are stale or have no products', staleFallbacks.length,
    staleFallbacks.length ? `fix src/lib/fallbacks.js: ${staleFallbacks.map(n => `"${n}"`).join(', ')}` : '');

  // ── 2. Part-number duplicates ───────────────────────────────────────────
  // Expected end state for a duplicate group: exactly one row keeps its page and
  // the rest carry duplicateOfId. `extra_pages` counts the surplus.
  //
  // Informational, never a finding: dedupe-part-numbers.mjs deliberately leaves
  // groups whose rows are equally detailed, differently branded AND disagree on
  // specs (158 of them as of 2026-08-15). Its dry run is the authority on what is
  // still actionable — this line only shows whether the number is drifting.
  const [dupes] = await prisma.$queryRawUnsafe(`
    WITH k AS (SELECT id, "duplicateOfId", ${NORMALIZED_PART_SQL} AS nk FROM "Product"),
         d AS (SELECT nk FROM k GROUP BY nk HAVING COUNT(*) > 1),
         g AS (SELECT k.nk, COUNT(*)::int AS members,
                      COUNT(*) FILTER (WHERE k."duplicateOfId" IS NULL)::int AS own_pages
               FROM k JOIN d USING (nk) GROUP BY k.nk)
    SELECT COUNT(*)::int AS groups, SUM(members)::int AS rows,
           SUM(GREATEST(own_pages - 1, 0))::int AS extra_pages
    FROM g`);
  console.log(`ℹ️  Separator-only duplicate groups: ${(dupes.groups || 0).toLocaleString()}`
    + ` (${(dupes.rows || 0).toLocaleString()} rows, ${(dupes.extra_pages || 0).toLocaleString()} still competing)`);
  console.log('      run scripts/dedupe-part-numbers.mjs to see which are actionable');

  const [{ n: indexableDupes }] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS n FROM "Product" WHERE "duplicateOfId" IS NOT NULL AND "indexable" = true`
  );
  check('Consolidated duplicates still marked indexable', indexableDupes,
    indexableDupes ? 'a rescore re-indexed them — compute-quality-scores.mjs re-hides them at the end' : '');

  const [{ n: chained }] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS n FROM "Product" a
      JOIN "Product" b ON a."duplicateOfId" = b.id
      WHERE b."duplicateOfId" IS NOT NULL`
  );
  check('Duplicate chains (A → B → C)', chained,
    chained ? 'the product route would redirect twice; re-run dedupe-part-numbers.mjs' : '');

  // ── 3. Thin specs (paged; specs is a multi-KB blob per row) ──────────────
  let thin = 0, thinIndexable = 0, cursor = 0;
  for (;;) {
    const rows = await prisma.product.findMany({
      where: { id: { gt: cursor } }, take: 10000, orderBy: { id: 'asc' },
      select: { id: true, specs: true, indexable: true },
    });
    if (!rows.length) break;
    cursor = rows[rows.length - 1].id;
    for (const row of rows) {
      const s = scoreSpecs(row.specs);
      if ((s.presentKeys || 0) - (s.filledKeys || 0) >= 8) {
        thin++;
        if (row.indexable) thinIndexable++;
      }
    }
  }
  // Informational: a residue is expected and is a threshold judgement, not a bug.
  // These rows have empty spec slots but still clear the gate on price, lifecycle,
  // package image and the specs they do carry. Baseline on 2026-08-15, after the
  // cleanup and at threshold 48: 76,463 thin rows of which 6,994 indexable — down
  // from 38,464 before scoreSpecs stopped paying for placeholder slots.
  // A jump well above that means a feed arrived with padded specs again.
  console.log(`ℹ️  Thin-spec rows (8+ empty slots): ${thin.toLocaleString()},`
    + ` of which indexable: ${thinIndexable.toLocaleString()}  (baseline 76,463 / 6,994)`);

  // ── 4/5. Copy defects ───────────────────────────────────────────────────
  let badBrandCopy = 0;
  for (const brand of DISTRIBUTOR_BRANDS) {
    const [{ n }] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS n FROM "Product"
        WHERE "manufacturer" = $1 AND "description" LIKE '%manufactured by ' || $1 || '%'`,
      brand
    );
    badBrandCopy += n;
  }
  check('Distributor rows claiming "manufactured by" the distributor', badBrandCopy,
    badBrandCopy ? 'run scripts/fix-distributor-copy.mjs' : '');

  const [{ n: placeholderLeak }] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS n FROM "Product" WHERE "description" LIKE '%This - component%'`
  );
  check('Descriptions containing "This - component"', placeholderLeak,
    placeholderLeak ? 'run scripts/fix-distributor-copy.mjs' : '');

  console.log('\n' + '━'.repeat(70));
  if (findings.length === 0) {
    console.log('  ✅ clean');
  } else {
    console.log(`  ⚠️  ${findings.length} finding(s):`);
    for (const f of findings) console.log(`     - ${f}`);
  }
  console.log('━'.repeat(70));

  await prisma.$disconnect();
  process.exitCode = findings.length === 0 ? 0 : 1;
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
