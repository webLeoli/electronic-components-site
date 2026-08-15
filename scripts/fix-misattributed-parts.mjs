/**
 * Reassign parts whose brand is demonstrably wrong in the feed.
 *
 * Not a heuristic sweep — every entry below is a specific row where the part
 * number belongs to a manufacturer's own documented series and the brand on the
 * row makes no sense for that kind of silicon. Found while auditing brand data in
 * 2026-08; see docs/data-quality-audit.md §7.
 *
 * ISSI's IS25* line is SPI/QSPI NOR flash. 536 IS25* rows sit under ISSI; five
 * more sit under a sensor company (Sensata), an LED company (Enfis), an RF
 * passives company (Johanson) and Texas Instruments. None of them makes that
 * part. Reassigning them also empties three brand rows, which are then removed so
 * they do not become "0 products" pages.
 *
 * The product URL contains the brand slug, but no redirect config is needed: the
 * product route resolves by part number and 301s a stale brand segment on its own.
 *
 * Usage:
 *   node scripts/fix-misattributed-parts.mjs            # dry run (default)
 *   node scripts/fix-misattributed-parts.mjs --apply
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const REASSIGNMENTS = [
  { partNumber: 'IS25LE512M-RMLE-TY', from: 'Sensata Technologies', to: 'ISSI' },
  { partNumber: 'IS25LE256E-RMLE-TY', from: 'Enfis', to: 'ISSI' },
  { partNumber: 'IS25LP128F-RMLA3-TY', from: 'Johanson Technology', to: 'ISSI' },
  { partNumber: 'IS25LP256D-JMLE-TY', from: 'Johanson Technology', to: 'ISSI' },
  { partNumber: 'IS25LP256H-RMLE-TY', from: 'Texas Instruments', to: 'ISSI' },
];

async function run() {
  console.log(`Mode: ${APPLY ? '✏️  APPLY (writing)' : '🔍 DRY RUN (no writes) — pass --apply to commit'}\n`);

  // brand -> how many of its rows this run moves away, so the dry run can report
  // the post-write state instead of the current one.
  const movedFrom = new Map();
  for (const item of REASSIGNMENTS) {
    const product = await prisma.product.findUnique({
      where: { partNumber: item.partNumber },
      select: { id: true, manufacturer: true },
    });

    if (!product) {
      console.log(`  ⏭️  ${item.partNumber}: not in the catalogue`);
      continue;
    }
    if (product.manufacturer !== item.from) {
      console.log(`  ⏭️  ${item.partNumber}: brand is "${product.manufacturer}", expected "${item.from}" — skipping`);
      continue;
    }

    console.log(`  ${item.partNumber}: "${item.from}" → "${item.to}"`);
    movedFrom.set(item.from, (movedFrom.get(item.from) || 0) + 1);

    if (APPLY) {
      await prisma.$executeRawUnsafe(
        // The brand is named inside the generated description too, so both move.
        `UPDATE "Product"
            SET "manufacturer" = $1,
                "description" = replace("description", $2, $1),
                "contentUpdatedAt" = NOW(), "updatedAt" = NOW()
          WHERE "id" = $3`,
        item.to, item.from, product.id
      );
    }
  }

  // Brands that just lost their last product would render an empty page.
  console.log('');
  for (const [brand, moved] of movedFrom) {
    // In dry run the rows have not moved yet, so subtract what this run would
    // move — otherwise the preview reports "still has 1 products" for a brand it
    // is about to empty and delete.
    const remaining = await prisma.product.count({ where: { manufacturer: brand } })
      - (APPLY ? 0 : moved);
    if (remaining > 0) {
      console.log(`  "${brand}" still has ${remaining.toLocaleString()} products — keeping`);
      continue;
    }
    console.log(`  "${brand}" has no products left — removing the brand row`);
    if (APPLY) {
      await prisma.manufacturer.deleteMany({ where: { name: brand } });
    }
  }

  if (!APPLY) console.log('\nℹ️  DRY RUN — nothing written. Re-run with --apply.');

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
