import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');
console.log(DRY_RUN ? '🔍 DRY RUN\n' : '⚡ LIVE MODE\n');

// Fix descriptions that reference wrong parent company
const DESC_FIXES = [
  // [manufacturer, old text to find, new text to replace with]
  ['Altera', 'by Intel,', 'by Altera,'],
  ['Altera', 'by Intel ', 'by Altera '],
  ['Altera', 'by Intel.', 'by Altera.'],
  ['Atmel', 'by Microchip,', 'by Atmel,'],
  ['Atmel', 'by Microchip ', 'by Atmel '],
  ['Atmel', 'by Microchip.', 'by Atmel.'],
  ['Linear Technology', 'by Analog Devices Inc.,', 'by Linear Technology,'],
  ['Linear Technology', 'by Analog Devices Inc. ', 'by Linear Technology '],
  ['Linear Technology', 'by Analog Devices Inc./', 'by Linear Technology/'],
  ['Maxim Integrated', 'by Analog Devices Inc./Maxim Integrated', 'by Maxim Integrated'],
  ['Maxim Integrated', 'by Analog Devices Inc.,', 'by Maxim Integrated,'],
  ['Maxim Integrated', 'by Analog Devices Inc. ', 'by Maxim Integrated '],
  ['Xilinx', 'by AMD / Xilinx,', 'by Xilinx,'],
  ['Xilinx', 'by AMD / Xilinx ', 'by Xilinx '],
  ['Cypress Semiconductor', 'by Infineon Technologies,', 'by Cypress Semiconductor,'],
  ['Cypress Semiconductor', 'by Infineon Technologies ', 'by Cypress Semiconductor '],
  ['Spansion', 'by Infineon Technologies,', 'by Spansion,'],
  ['Spansion', 'by Infineon Technologies ', 'by Spansion '],
  ['Spansion', 'by Infineon,', 'by Spansion,'],
  ['Spansion', 'by Infineon ', 'by Spansion '],
  ['Intersil', 'by Renesas,', 'by Intersil,'],
  ['Intersil', 'by Renesas ', 'by Intersil '],
  ['Intersil', 'by Analog Devices Inc.,', 'by Intersil,'],
  ['Intersil', 'by Analog Devices Inc. ', 'by Intersil '],
  ['Intersil', 'by Analog Devices,', 'by Intersil,'],
  ['Fairchild Semiconductor', 'by Onsemi,', 'by Fairchild Semiconductor,'],
  ['Fairchild Semiconductor', 'by Onsemi ', 'by Fairchild Semiconductor '],
  ['International Rectifier', 'by Infineon Technologies,', 'by International Rectifier,'],
  ['International Rectifier', 'by Infineon Technologies ', 'by International Rectifier '],
  ['International Rectifier', 'by Infineon,', 'by International Rectifier,'],
  ['International Rectifier', 'by Infineon ', 'by International Rectifier '],
  ['IDT', 'by Renesas,', 'by IDT,'],
  ['IDT', 'by Renesas ', 'by IDT '],
];

let totalUpdated = 0;

for (const [mfr, oldText, newText] of DESC_FIXES) {
  // Count matching products
  const products = await p.product.findMany({
    where: {
      manufacturer: mfr,
      description: { contains: oldText }
    },
    select: { id: true, description: true }
  });

  if (products.length === 0) continue;

  if (!DRY_RUN) {
    // Update each product's description
    let batchCount = 0;
    for (const prod of products) {
      const newDesc = prod.description.replace(oldText, newText);
      if (newDesc !== prod.description) {
        await p.product.update({
          where: { id: prod.id },
          data: { description: newDesc }
        });
        batchCount++;
      }
    }
    totalUpdated += batchCount;
    console.log(`✅ ${mfr}: "${oldText}" → "${newText}": ${batchCount}`);
  } else {
    totalUpdated += products.length;
    console.log(`📋 ${mfr}: "${oldText}" → "${newText}": ${products.length}`);
  }
}

// Fix Manufacturer table slug mismatches
console.log('\n--- Manufacturer 表 slug 修复 ---');
const slugFixes = [
  ['Alpha & Omega Semiconductor', 'alpha-and-omega-semiconductor'],
  ['B&K Precision', 'bandk-precision'],
  ['Omron Automation & Safety', 'omron-automation-and-safety'],
];
for (const [name, newSlug] of slugFixes) {
  if (!DRY_RUN) {
    const result = await p.manufacturer.updateMany({
      where: { name },
      data: { slug: newSlug }
    });
    if (result.count > 0) console.log(`✅ Slug: "${name}" → ${newSlug}`);
  }
}

// Clean up stale Manufacturer entries with old names
const staleNames = [
  'Asahi Kasei Microdevices(AKM)',
  'International Rectifier(IR)',
  'Nexperia Energy Harvesting Solutions(Nowi)',
  'Standard Microsystems(SMSC)',
  'Infineon',
  'Broadcom',
];
for (const name of staleNames) {
  const count = await p.product.count({ where: { manufacturer: name } });
  if (count === 0 && !DRY_RUN) {
    const deleted = await p.manufacturer.deleteMany({ where: { name } });
    if (deleted.count > 0) console.log(`🗑️ Stale: "${name}"`);
  }
}

// Add missing manufacturers with >10 products
console.log('\n--- 新增缺失的 Manufacturer 条目 ---');
const allMfrs = await p.product.groupBy({
  by: ['manufacturer'],
  _count: { _all: true },
  having: { manufacturer: { _count: { gt: 10 } } }
});
const existingMfrs = new Set((await p.manufacturer.findMany({ select: { name: true } })).map(m => m.name));

for (const m of allMfrs) {
  if (!m.manufacturer || existingMfrs.has(m.manufacturer)) continue;
  const slug = m.manufacturer.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!DRY_RUN) {
    try {
      const existsBySlug = await p.manufacturer.findFirst({ where: { slug } });
      if (!existsBySlug) {
        await p.manufacturer.create({ data: { name: m.manufacturer, slug } });
        console.log(`✅ 新增: "${m.manufacturer}" (${m._count._all} products)`);
      }
    } catch(e) {}
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`${DRY_RUN ? 'Would update' : 'Updated'} descriptions: ${totalUpdated}`);
console.log('='.repeat(60));

await p.$disconnect();
