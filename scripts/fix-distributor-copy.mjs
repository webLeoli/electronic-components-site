/**
 * Repair stored product copy that credits a distributor as the manufacturer.
 *
 * Product.description is bulk-generated text that ends up in the page body and in
 * the schema.org Product description. For rows filed under a distributor it says
 * "manufactured by Rochester Electronics", which is false — Rochester resells
 * other makers' silicon — and it contradicts the OEM's own page for the same part
 * ("no longer produced by Microchip"). 106,452 rows are affected by Rochester
 * alone.
 *
 * This rewrites only the offending phrases, in place, in SQL. It does not
 * regenerate descriptions: the surrounding sentences are still accurate, and a
 * full regeneration would restamp contentUpdatedAt across a sixth of the
 * catalogue.
 *
 * The render path (generateRichDescription) and the JSON-LD brand field are fixed
 * in code; the distributor list lives in lib/manufacturer-canonical.js.
 *
 * Usage:
 *   node scripts/fix-distributor-copy.mjs            # dry run (default)
 *   node scripts/fix-distributor-copy.mjs --apply
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { DISTRIBUTOR_BRANDS } from '../src/lib/manufacturer-canonical.js';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

// Phrase rewrites applied per distributor name. Each pattern must be wrong for a
// reseller and right for a maker, and the patterns must not overlap: an earlier
// "produced by X" → "stocked by X" rule silently ate the longer "is no longer
// produced by X" sentence and turned it into "is no longer stocked by X", which
// says the opposite of the truth (the distributor stocks it; the OEM stopped
// making it).
const BRAND_REWRITES = [
  { from: (b) => `manufactured by ${b}`, to: (b) => `supplied by ${b}` },
  { from: (b) => `is no longer produced by ${b}`, to: () => `is no longer produced by the original manufacturer` },
  { from: (b) => `is currently in active production through ${b}`, to: (b) => `is currently available through ${b}` },
];

// Brand-independent copy defects in the same generated text.
const GLOBAL_REWRITES = [
  // The generator interpolated the mountType field straight into prose, so rows
  // whose feed left it as "-" read "This - component is supplied in …".
  { from: 'This - component', to: 'This component' },
];

async function run() {
  console.log(`Mode: ${APPLY ? '✏️  APPLY (writing)' : '🔍 DRY RUN (no writes) — pass --apply to commit'}`);

  for (const brand of DISTRIBUTOR_BRANDS) {
    console.log(`\n── ${brand} ─────────────────────────────────`);
    const total = await prisma.product.count({ where: { manufacturer: brand } });
    console.log(`   rows under this brand: ${total.toLocaleString()}`);

    for (const rewrite of BRAND_REWRITES) {
      const needle = rewrite.from(brand);
      const replacement = rewrite.to(brand);
      const [{ n }] = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS n FROM "Product"
          WHERE "manufacturer" = $1 AND "description" LIKE '%' || $2 || '%'`,
        brand, needle
      );
      console.log(`   "${needle}" → "${replacement}": ${n.toLocaleString()} rows`);

      if (APPLY && n > 0) {
        // Copy is rendered, so contentUpdatedAt moves — this is a real content
        // correction, not housekeeping.
        const updated = await prisma.$executeRawUnsafe(
          `UPDATE "Product"
              SET "description" = replace("description", $2, $3),
                  "contentUpdatedAt" = NOW(), "updatedAt" = NOW()
            WHERE "manufacturer" = $1 AND "description" LIKE '%' || $2 || '%'`,
          brand, needle, replacement
        );
        console.log(`   ✅ ${updated.toLocaleString()} rows rewritten`);
      }
    }
  }

  console.log('\n── all brands ─────────────────────────────────');
  for (const rewrite of GLOBAL_REWRITES) {
    const [{ n }] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS n FROM "Product" WHERE "description" LIKE '%' || $1 || '%'`,
      rewrite.from
    );
    console.log(`   "${rewrite.from}" → "${rewrite.to}": ${n.toLocaleString()} rows`);

    if (APPLY && n > 0) {
      const updated = await prisma.$executeRawUnsafe(
        `UPDATE "Product"
            SET "description" = replace("description", $1, $2),
                "contentUpdatedAt" = NOW(), "updatedAt" = NOW()
          WHERE "description" LIKE '%' || $1 || '%'`,
        rewrite.from, rewrite.to
      );
      console.log(`   ✅ ${updated.toLocaleString()} rows rewritten`);
    }
  }

  if (APPLY) {
    console.log('\n🧹 VACUUM ANALYZE "Product" …');
    await prisma.$executeRawUnsafe('VACUUM (ANALYZE) "Product"');
  } else {
    console.log('\nℹ️  DRY RUN — nothing written. Re-run with --apply.');
  }

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
