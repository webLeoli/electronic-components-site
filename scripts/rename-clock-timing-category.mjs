// Rename the "Application Specific Processors" product category to describe what
// it actually holds. NAME, seoTitle and seoDesc only — the slug is deliberately
// left alone, so /category/application-specific-processors keeps working and no
// URL, canonical or sitemap entry changes.
//
// Why: the category contains no processors. Measured 2026-08-04 across its 8,264
// part numbers, 6,474 match a clock/timing prefix (Skyworks Si53xx/Si52xx alone
// is 4,406; plus IDT 9DB/9FG/9UM/954/932, Microsemi ZL3xxx, Diodes PI6C, Cypress
// CY28xx) and sampling the remainder found only more of the same — IDTCV and
// IDT5T9xx clock buffers, DSC557 MEMS oscillators, DS1083/DS1181 programmable
// oscillators, MAX3679A fanout buffers, 6V49061 VCXOs, Abracon AB-557 oscillators.
// Exactly 4 part numbers match any processor prefix. 6,666 of these product pages
// are indexable, so the wrong noun was costing relevance on every one of them.
//
// The per-product descriptions were fixed separately by
// scripts/fix-description-category-mismatches.mjs (third rule).
//
// Idempotent: re-running after a successful rename reports "already renamed".
//
// Second step, added after approval of "anything that does not change a URL":
// the category is MOVED from "Embedded & Programmable > Microcontrollers &
// Processors" to "Clock & Timing > Clock Generation", which is where the site
// already keeps clock-generators-plls. This fixes breadcrumbs, BreadcrumbList
// JSON-LD and navigation placement. parentId is not part of any URL — the
// category route is /category/<slug> and product routes do not encode the
// parent — so no URL, canonical, sitemap entry or redirect is affected.
//
// A systematic scan of every leaf category with 300+ parts (name keywords vs
// top-level branch) found this to be the ONLY genuine misplacement; the other
// eight hits were false positives of the heuristic (gate-drivers legitimately
// under Power, adc/dac under Analog, logic-comparators being 74x85 magnitude
// comparators rather than analogue ones, and so on).
//
// STILL OPEN (needs its own decision):
//   · The slug still says application-specific-processors. Changing it is a real
//     URL change on the parent of 6,666 indexable pages — redirects required.
//   · Whether to merge into clock-generators-plls (32,305) instead of keeping a
//     third clock category.
//   · scripts/setup-categories.mjs has been updated to match the new name, but
//     its tree still nests this slug under mcu-processors, so a re-run of that
//     seed script would move it back. Fixing that means restructuring the seed
//     tree; until then, re-run THIS script after ever running setup-categories.
//
// Usage:
//   node scripts/rename-clock-timing-category.mjs --dry-run
//   node scripts/rename-clock-timing-category.mjs
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const dryRun = process.argv.includes('--dry-run');
const prisma = new PrismaClient();

const SLUG = 'application-specific-processors';
const OLD_NAME = 'Application Specific Processors';
const NEW = {
  name: 'Clock Generators & Timing ICs',
  seoTitle: 'Clock Generators, Buffers & Timing ICs',
  seoDesc:
    'FPGACenter stocks 8,264 clock generator, buffer and timing IC part numbers across Skyworks, Renesas, and Microchip. Volume pricing, no minimum order.',
};

const before = await prisma.category.findUnique({
  where: { slug: SLUG },
  select: { id: true, name: true, slug: true, seoTitle: true, seoDesc: true, parentId: true },
});

if (!before) {
  console.error(`  ! no category with slug "${SLUG}"`);
  await prisma.$disconnect();
  process.exit(1);
}

const productCount = await prisma.product.count({ where: { categoryId: before.id } });

console.log('before:');
console.log(`  name     ${before.name}`);
console.log(`  slug     ${before.slug}   (unchanged by this script)`);
console.log(`  seoTitle ${before.seoTitle}`);
console.log(`  seoDesc  ${before.seoDesc}`);
console.log(`  products ${productCount}`);

// ── Step 2: move it under Clock & Timing > Clock Generation ──────────────────
const NEW_PARENT_SLUG = 'clock-generation';
const newParent = await prisma.category.findUnique({
  where: { slug: NEW_PARENT_SLUG },
  select: { id: true, name: true },
});
if (!newParent) {
  console.error(`  ! no category with slug "${NEW_PARENT_SLUG}" — cannot move`);
  await prisma.$disconnect();
  process.exit(1);
}

const parentChain = async (id) => {
  const out = [];
  let cur = id ? await prisma.category.findUnique({ where: { id }, select: { name: true, parentId: true } }) : null;
  while (cur) {
    out.unshift(cur.name);
    cur = cur.parentId ? await prisma.category.findUnique({ where: { id: cur.parentId }, select: { name: true, parentId: true } }) : null;
  }
  return out.join(' > ');
};

const needsMove = before.parentId !== newParent.id;
console.log(`  parent   ${await parentChain(before.parentId)}`);

if (before.name === NEW.name && before.seoTitle === NEW.seoTitle && !needsMove) {
  console.log('\nalready renamed and already in the right branch — nothing to do');
  await prisma.$disconnect();
  process.exit(0);
}

if (needsMove) {
  // Append after the existing children so nothing else's ordering shifts.
  const siblings = await prisma.category.findMany({
    where: { parentId: newParent.id },
    select: { sortOrder: true },
  });
  const nextSort = siblings.length ? Math.max(...siblings.map((s) => s.sortOrder)) + 1 : 0;
  console.log(`\nmove:  → ${await parentChain(newParent.id)}   (sortOrder ${nextSort})`);
  if (!dryRun) {
    await prisma.category.update({
      where: { id: before.id },
      data: { parentId: newParent.id, sortOrder: nextSort },
    });
    console.log(`  moved. new chain: ${await parentChain(before.id)}`);
  }
}

if (before.name === NEW.name && before.seoTitle === NEW.seoTitle) {
  console.log('\nname/seoTitle already correct — nothing further to do');
  await prisma.$disconnect();
  process.exit(0);
}

if (before.name !== OLD_NAME) {
  console.error(
    `\n  ! expected name "${OLD_NAME}" but found "${before.name}". Someone else has changed it; ` +
      'review before running this script.',
  );
  await prisma.$disconnect();
  process.exit(1);
}

console.log('\nafter:');
console.log(`  name     ${NEW.name}`);
console.log(`  slug     ${before.slug}`);
console.log(`  seoTitle ${NEW.seoTitle}`);
console.log(`  seoDesc  ${NEW.seoDesc}`);

if (dryRun) {
  console.log('\n[dry-run] no changes written');
} else {
  await prisma.category.update({ where: { id: before.id }, data: NEW });
  const after = await prisma.category.findUnique({
    where: { id: before.id },
    select: { name: true, slug: true, parentId: true },
  });
  const stillCounted = await prisma.product.count({ where: { categoryId: before.id } });
  console.log('\nwritten. verification:');
  console.log(`  slug unchanged:     ${after.slug === before.slug ? 'yes' : 'NO — INVESTIGATE'}`);
  console.log(`  parent unchanged:   ${after.parentId === before.parentId ? 'yes' : 'NO — INVESTIGATE'}`);
  console.log(`  products unchanged: ${stillCounted === productCount ? `yes (${stillCounted})` : `NO (${productCount} → ${stillCounted})`}`);
}

await prisma.$disconnect();
