// Repair the product descriptions in the `adc` and `dac` categories.
//
// Both categories were generated against the SWITCHING-REGULATOR template, so
// every one of the 26,690 part numbers in them opened with "is a switching
// converter" and told the reader to "confirm input voltage, output voltage,
// load current, buck or boost topology". An ADC is not a switching converter,
// and 22,886 of those pages are indexable — so this is wrong text on indexable
// pages, not a cosmetic issue. (The mapping was shifted: `analog-comparators`
// received the ADC/DAC signal-chain clause that belonged here.)
//
// This script rewrites only two fragments and leaves package, temperature,
// application and lifecycle sentences untouched. It is idempotent: the
// replacements no longer match once applied.
//
// contentUpdatedAt IS bumped on every changed row, deliberately. That field is
// the sitemap <lastmod> source and must only move when something a visitor can
// see has changed — which is exactly what this script does. We want these pages
// recrawled. Pass --no-lastmod to suppress it if the recrawl needs staging.
//
// Usage:
//   node scripts/fix-converter-descriptions.mjs --dry-run
//   node scripts/fix-converter-descriptions.mjs
//   node scripts/fix-converter-descriptions.mjs --no-lastmod
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const dryRun = process.argv.includes('--dry-run');
const noLastmod = process.argv.includes('--no-lastmod');
const prisma = new PrismaClient();

const POWER_CLAUSE =
  'input voltage, output voltage, load current, buck or boost topology when applicable, and thermal operating temperature limits';

const FIXES = [
  {
    slug: 'adc',
    noun: [/\bis a switching converter\b/g, 'is an analog-to-digital converter (ADC)'],
    clause: [
      POWER_CLAUSE,
      'resolution and effective number of bits, sample rate and architecture, reference arrangement, input drive and source impedance, interface type, and operating temperature limits',
    ],
  },
  {
    slug: 'dac',
    noun: [/\bis a switching converter\b/g, 'is a digital-to-analog converter (DAC)'],
    clause: [
      POWER_CLAUSE,
      'resolution and monotonicity, output structure (voltage, current or multiplying), reference arrangement and gain option, settling time against the update rate, power-on default state, and operating temperature limits',
    ],
  },
];

let totalChanged = 0;
let totalScanned = 0;

for (const fix of FIXES) {
  const cat = await prisma.category.findUnique({ where: { slug: fix.slug }, select: { id: true, name: true } });
  if (!cat) {
    console.error(`  ! no such category "${fix.slug}"`);
    continue;
  }

  console.log(`\n=== ${cat.name} [${fix.slug}] ===`);
  let changed = 0;
  let scanned = 0;
  let shownExample = false;
  const BATCH = 1000;
  let cursor = 0;

  for (;;) {
    const rows = await prisma.product.findMany({
      where: { categoryId: cat.id, id: { gt: cursor } },
      select: { id: true, partNumber: true, description: true },
      orderBy: { id: 'asc' },
      take: BATCH,
    });
    if (!rows.length) break;
    cursor = rows[rows.length - 1].id;

    for (const row of rows) {
      scanned++;
      if (!row.description) continue;
      let next = row.description.replace(fix.noun[0], fix.noun[1]);
      next = next.split(fix.clause[0]).join(fix.clause[1]);
      if (next === row.description) continue;

      if (!shownExample) {
        shownExample = true;
        console.log(`  example — ${row.partNumber}`);
        console.log(`    before: ${row.description.slice(0, 190)}…`);
        console.log(`    after:  ${next.slice(0, 190)}…`);
      }

      changed++;
      if (!dryRun) {
        await prisma.product.update({
          where: { id: row.id },
          data: noLastmod ? { description: next } : { description: next, contentUpdatedAt: new Date() },
        });
      }
    }
  }

  console.log(`  ${dryRun ? '[dry-run] would change' : 'changed'} ${changed} of ${scanned} rows`);
  totalChanged += changed;
  totalScanned += scanned;
}

console.log(
  `\n${dryRun ? '[dry-run] ' : ''}${totalChanged} of ${totalScanned} product descriptions repaired` +
    (dryRun || noLastmod ? '' : ' (contentUpdatedAt bumped — these pages should be recrawled)'),
);

await prisma.$disconnect();
