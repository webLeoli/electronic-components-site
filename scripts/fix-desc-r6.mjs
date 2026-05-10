import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

console.log('⚡ 第六轮修复\n');
let total = 0;

async function fixDesc(mfr, oldText, newText) {
  const products = await p.product.findMany({
    where: { manufacturer: mfr, description: { contains: oldText } },
    select: { id: true, description: true }
  });
  if (products.length === 0) return;
  let count = 0;
  for (const prod of products) {
    const newDesc = prod.description.replace(oldText, newText);
    if (newDesc !== prod.description) {
      await p.product.update({ where: { id: prod.id }, data: { description: newDesc } });
      count++;
    }
  }
  total += count;
  if (count > 0) console.log(`✅ ${mfr}: "${oldText}" → "${newText}": ${count}`);
}

// 1. Microsemi: "by Microchip" → "by Microsemi"
console.log('--- Microsemi 描述修复 ---');
await fixDesc('Microsemi', 'by Microchip,', 'by Microsemi,');
await fixDesc('Microsemi', 'by Microchip ', 'by Microsemi ');
await fixDesc('Microsemi', 'by Microchip.', 'by Microsemi.');

// Also fix "by Microsemi Corporation" → "by Microsemi"
await fixDesc('Microsemi', 'by Microsemi Corporation,', 'by Microsemi,');
await fixDesc('Microsemi', 'by Microsemi Corporation ', 'by Microsemi ');
await fixDesc('Microsemi', 'by Microsemi Corporation.', 'by Microsemi.');

// 2. Spansion: "by Cypress Semiconductor" → "by Spansion"  
console.log('\n--- Spansion 描述修复 ---');
await fixDesc('Spansion', 'by Cypress Semiconductor,', 'by Spansion,');
await fixDesc('Spansion', 'by Cypress Semiconductor.', 'by Spansion.');
await fixDesc('Spansion', 'by Cypress Semiconductor ', 'by Spansion ');
// Also Spansion®
await fixDesc('Spansion', 'by Spansion®', 'by Spansion');

// 3. Analog Devices: "by Analog Devices Inc.." → "by Analog Devices."
console.log('\n--- Analog Devices 描述标准化 ---');
await fixDesc('Analog Devices', 'by Analog Devices Inc..', 'by Analog Devices.');
await fixDesc('Analog Devices', 'by Analog Devices Inc.,', 'by Analog Devices,');
await fixDesc('Analog Devices', 'by Analog Devices Inc. ', 'by Analog Devices ');
await fixDesc('Analog Devices', 'by Analog Devices Inc./', 'by Analog Devices/');

// 4. Intersil: fix old names in descriptions
console.log('\n--- Intersil 描述修复 ---');
await fixDesc('Intersil', 'by Harris Semiconductor,', 'by Intersil,');
await fixDesc('Intersil', 'by Harris Semiconductor ', 'by Intersil ');
await fixDesc('Intersil', 'by Harris Semiconductor.', 'by Intersil.');
await fixDesc('Intersil', 'by Intersil Corporation,', 'by Intersil,');
await fixDesc('Intersil', 'by Intersil Corporation ', 'by Intersil ');
await fixDesc('Intersil', 'by Intersil Corporation.', 'by Intersil.');

// 5. IDT: fix "by Waldom Electronics" in description
console.log('\n--- IDT 描述修复 ---');
await fixDesc('IDT', 'by Waldom Electronics,', 'by IDT,');
await fixDesc('IDT', 'by Waldom Electronics ', 'by IDT ');
await fixDesc('IDT', 'by Waldom Electronics.', 'by IDT.');

// 6. Lattice: fix "by Lattice Semiconductor Corporation"
console.log('\n--- Lattice 描述修复 ---');
await fixDesc('Lattice Semiconductor', 'by Lattice Semiconductor Corporation,', 'by Lattice Semiconductor,');
await fixDesc('Lattice Semiconductor', 'by Lattice Semiconductor Corporation ', 'by Lattice Semiconductor ');
await fixDesc('Lattice Semiconductor', 'by Lattice Semiconductor Corporation.', 'by Lattice Semiconductor.');

// 7. Cypress: fix description referencing "by Cypress Semiconductor"
// We need to make sure we're not fixing Spansion products
// Actually these should be correct since we already separated Spansion

// 8. Xilinx remaining
console.log('\n--- Xilinx 残留修复 ---');
await fixDesc('Xilinx', 'by AMD / Xilinx', 'by Xilinx');

console.log(`\n${'='.repeat(60)}`);
console.log(`Fixed: ${total} descriptions`);
console.log('='.repeat(60));

await p.$disconnect();
