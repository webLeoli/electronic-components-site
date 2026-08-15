// Repair product descriptions whose opening noun phrase names the wrong kind of
// device, because the generator mapped the category to the wrong template.
//
// Found 2026-08-04 by comparing each category's generated noun phrase against
// the category itself. Two systematic errors remain after
// scripts/fix-converter-descriptions.mjs fixed the ADC and DAC categories:
//
//   gate-drivers (6,266 parts, 3,586 indexable)
//     "is a combinational logic IC" + "confirm logic family, I/O voltage,
//     propagation delay" — a gate driver is a power-stage driver, not a logic
//     gate, and the review checklist omits every specification that actually
//     destroys hardware (dead time, negative VS transient, peak drive current).
//
//   op-amps (28,323 parts, 23,815 indexable)
//     "is an instrumentation amplifier" applied to ALL of them, including
//     LM358DR, LM324, TL072 and the whole OPA/MCP60x general-purpose range.
//     An instrumentation amplifier is a specific three-amplifier topology;
//     only about 5% of this category's part numbers belong to those families.
//     Genuine instrumentation-amplifier and isolated-amplifier families are
//     detected by prefix and keep an accurate noun instead.
//
//   application-specific-processors (8,264 parts, 6,666 indexable)
//     Every one said "is an application-specific processor" and asked the
//     reader to confirm "GPIO, SPI, I2C, UART, ADC peripherals, clock speed,
//     Flash memory" — but the category does not contain processors. Measured
//     2026-08-04: 6,474 part numbers match a clock/timing prefix (Skyworks
//     Si53xx/Si52xx, IDT 9DB/9FG/9UM/954/932, Microsemi ZL3xxx, Diodes PI6C,
//     Cypress CY28xx), and spot-checking the remainder found more of the same
//     (IDTCV clock buffers, IDT5T9xx, DSC557 MEMS oscillators, DS1083/DS1181
//     programmable oscillators, MAX3679A fanout, 6V49061 VCXOs). Only 4 parts
//     match any processor prefix. The category NAME is also wrong, but renaming
//     it changes /category/<slug>, so that needs sign-off — see
//     docs/blog-content-plan.md. This script fixes only the per-product text.
//
// Idempotent: each replacement stops matching once applied.
//
// contentUpdatedAt is bumped on changed rows (the sitemap <lastmod> source),
// because the visible text really did change and these pages should be
// recrawled. Pass --no-lastmod to suppress.
//
// Usage:
//   node scripts/fix-description-category-mismatches.mjs --dry-run
//   node scripts/fix-description-category-mismatches.mjs
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const dryRun = process.argv.includes('--dry-run');
const noLastmod = process.argv.includes('--no-lastmod');
const prisma = new PrismaClient();

// Genuine instrumentation-amplifier / current-sense-amplifier families.
const INSTRUMENTATION_PREFIXES = [
  'INA', 'PGA', 'AMP0',
  'AD620', 'AD621', 'AD622', 'AD623', 'AD624', 'AD625', 'AD626', 'AD627', 'AD628',
  'AD8220', 'AD8221', 'AD8222', 'AD8224', 'AD8225', 'AD8226', 'AD8227', 'AD8228',
  'AD8229', 'AD8230', 'AD8231', 'AD8235', 'AD8236', 'AD8237', 'AD8250', 'AD8251',
  'AD8253', 'AD8420', 'AD8421', 'AD8422', 'AD8426', 'AD8428', 'AD8429',
  'LT1167', 'LT1168', 'LT1789', 'LTC1100', 'LTC6800', 'LTC6915',
  'MAX4194', 'MAX4195', 'MAX4196', 'MAX4197', 'MAX4208', 'MAX4209', 'MAX4460', 'MAX4462',
];

// Optically or capacitively isolated amplifiers — neither op-amps nor IAs.
const ISOLATED_PREFIXES = ['HCPL', 'ACPL', 'ISO12', 'ISO22', 'ISOW', 'AMC12', 'AMC13'];

const startsWithAny = (pn, list) => list.some((pre) => pn.startsWith(pre));

const RULES = [
  {
    slug: 'gate-drivers',
    rewrite: (pn, desc) => {
      let next = desc.replace(/\bis a combinational logic IC\b/g, 'is a gate driver IC');
      next = next.split('confirm logic family, I/O voltage, propagation delay, package fit, and operating temperature limits')
        .join(
          'confirm dead-time provision (internal, programmable or none), peak source and sink current against the power ' +
          'device gate charge, negative VS transient immunity, undervoltage lockout thresholds, isolation rating where ' +
          'applicable, and operating temperature limits',
        );
      return next;
    },
  },
  {
    slug: 'op-amps',
    rewrite: (pn, desc) => {
      if (startsWithAny(pn, ISOLATED_PREFIXES)) {
        return desc.replace(/\bis an instrumentation amplifier\b/g, 'is an isolation amplifier');
      }
      if (startsWithAny(pn, INSTRUMENTATION_PREFIXES)) return desc; // already accurate
      return desc.replace(/\bis an instrumentation amplifier\b/g, 'is an operational amplifier');
    },
  },
  {
    slug: 'application-specific-processors',
    rewrite: (pn, desc) => {
      let next = desc.replace(/\bis an application-specific processor\b/g, 'is a clock and timing IC');
      next = next
        .split('confirm GPIO, SPI, I2C, UART, ADC peripherals, clock speed, Flash memory, package fit, and operating temperature limits')
        .join(
          'confirm output frequency and configuration code, output format and termination (LVCMOS, LVDS, LVPECL or HCSL), ' +
          'output count and per-output enables, additive phase jitter over the band your application specifies, ' +
          'input reference requirements, and operating temperature limits',
        );
      // "IoT endpoints, consumer electronics, and industrial automation" is the
      // processor template's application list; these are clock distribution and
      // synchronisation parts.
      next = next
        .split('Designed for IoT endpoints, consumer electronics, and industrial automation applications')
        .join('Designed for networking, server, PCIe and industrial timing applications');
      return next;
    },
  },
];

let grandTotal = 0;

for (const rule of RULES) {
  const cat = await prisma.category.findUnique({ where: { slug: rule.slug }, select: { id: true, name: true } });
  if (!cat) {
    console.error(`  ! no such category "${rule.slug}"`);
    continue;
  }
  console.log(`\n=== ${cat.name} [${rule.slug}] ===`);

  let changed = 0;
  let scanned = 0;
  let shown = 0;
  let cursor = 0;

  for (;;) {
    const rows = await prisma.product.findMany({
      where: { categoryId: cat.id, id: { gt: cursor } },
      select: { id: true, partNumber: true, description: true },
      orderBy: { id: 'asc' },
      take: 1000,
    });
    if (!rows.length) break;
    cursor = rows[rows.length - 1].id;

    for (const row of rows) {
      scanned++;
      if (!row.description) continue;
      const next = rule.rewrite(row.partNumber, row.description);
      if (next === row.description) continue;

      if (shown < 2) {
        shown++;
        console.log(`  example — ${row.partNumber}`);
        console.log(`    before: ${row.description.slice(0, 150)}…`);
        console.log(`    after:  ${next.slice(0, 150)}…`);
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
  grandTotal += changed;
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${grandTotal} descriptions repaired`);
await prisma.$disconnect();
