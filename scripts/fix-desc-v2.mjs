import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

console.log('⚡ 修复残留描述问题\n');
let total = 0;

// These are the remaining patterns that didn't match the first pass
const PATTERNS = [
  // Linear Technology: "by Analog Devices Inc.." (double dot)
  ['Linear Technology', 'by Analog Devices Inc..', 'by Linear Technology.'],
  ['Linear Technology', 'by Analog Devices Inc./', 'by Linear Technology/'],
  ['Linear Technology', 'by Analog Devices.', 'by Linear Technology.'],
  
  // Xilinx: remaining "by AMD / Xilinx...."
  ['Xilinx', 'by AMD / Xilinx.', 'by Xilinx.'],
  ['Xilinx', 'by AMD / Xilinx', 'by Xilinx'],
  
  // Cypress: "by Infineon Technologies...."  
  ['Cypress Semiconductor', 'by Infineon Technologies.', 'by Cypress Semiconductor.'],
  ['Cypress Semiconductor', 'by Infineon Technologies', 'by Cypress Semiconductor'],
  
  // Intersil: "by Renesas." and "by Analog Devices"
  ['Intersil', 'by Renesas.', 'by Intersil.'],
  ['Intersil', 'by Renesas', 'by Intersil'],
  ['Intersil', 'by Analog Devices Inc./', 'by Intersil/'],
  ['Intersil', 'by Analog Devices Inc.', 'by Intersil'],
  ['Intersil', 'by Analog Devices', 'by Intersil'],
  
  // Fairchild: "by Onsemi."
  ['Fairchild Semiconductor', 'by Onsemi.', 'by Fairchild Semiconductor.'],
  ['Fairchild Semiconductor', 'by Onsemi', 'by Fairchild Semiconductor'],
  
  // IDT: "by Renesas."
  ['IDT', 'by Renesas.', 'by IDT.'],
  ['IDT', 'by Renesas', 'by IDT'],
  
  // International Rectifier remaining
  ['International Rectifier', 'by Infineon', 'by International Rectifier'],
];

for (const [mfr, oldText, newText] of PATTERNS) {
  const products = await p.product.findMany({
    where: {
      manufacturer: mfr,
      description: { contains: oldText }
    },
    select: { id: true, description: true }
  });
  
  if (products.length === 0) continue;
  
  let batchCount = 0;
  for (const prod of products) {
    // Replace only the first occurrence to avoid double-replacements
    const newDesc = prod.description.replace(oldText, newText);
    if (newDesc !== prod.description) {
      await p.product.update({
        where: { id: prod.id },
        data: { description: newDesc }
      });
      batchCount++;
    }
  }
  total += batchCount;
  if (batchCount > 0) console.log(`✅ ${mfr}: "${oldText}" → "${newText}": ${batchCount}`);
}

// Also check for any URL-dangerous part numbers
console.log('\n--- URL 危险字符型号分析 ---');
const dangerPNs = await p.product.findMany({
  where: {
    OR: [
      { partNumber: { contains: '/' } },
      { partNumber: { contains: '#' } },
    ]
  },
  select: { partNumber: true, manufacturer: true },
  take: 30
});
console.log(`型号含 / 或 # 的产品: ${dangerPNs.length}`);
for (const pn of dangerPNs.slice(0, 10)) {
  console.log(`  "${pn.partNumber}" (${pn.manufacturer})`);
}
// These are OK - Next.js encodeURIComponent handles them in URLs
// e.g., /product/microchip/PIC16F877A-I%2FP

console.log(`\nFixed: ${total} descriptions`);
await p.$disconnect();
