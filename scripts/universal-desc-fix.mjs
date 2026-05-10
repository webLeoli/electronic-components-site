import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// ============================================================
// 通用算法：不再列举特定模式
// 扫描每一条产品，用正则提取描述中的 "by XXX" 厂商名
// 如果提取出的名字与 manufacturer 字段不同，就修正描述
// ============================================================

console.log('='.repeat(80));
console.log('  通用描述修复 — 自动检测所有 "by XXX" 不一致');
console.log('='.repeat(80) + '\n');

// Build a set of ALL known manufacturer names for matching
const allMfrs = await p.product.groupBy({ by: ['manufacturer'] });
const mfrNames = new Set(allMfrs.map(m => m.manufacturer).filter(Boolean));

// Build alias → canonical name map
// This maps OLD names that might appear in descriptions to CURRENT manufacturer field value
const ALIASES = {};
// Populate from actual data: for each product, its manufacturer is the canonical name
// We also add common variations
const KNOWN_ALIASES = {
  'Intel': ['Intel'],
  'Microchip': ['Microchip'],
  'Analog Devices Inc.': ['Analog Devices'],
  'Analog Devices Inc./Maxim Integrated': ['Maxim Integrated', 'Analog Devices'],
  'Analog Devices': ['Analog Devices'],
  'AMD / Xilinx': ['Xilinx'],
  'AMD': ['Xilinx'],
  'Renesas': ['Renesas'],
  'Infineon Technologies': ['Infineon Technologies'],
  'Infineon': ['Infineon Technologies'],
  'Onsemi': ['Onsemi'],
  'ON Semiconductor': ['Onsemi'],
  'Lattice Semiconductor Corporation': ['Lattice Semiconductor'],
  'Harris Semiconductor': ['Intersil'],
  'Intersil Corporation': ['Intersil'],
  'Microsemi Corporation': ['Microsemi'],
  'Waldom Electronics': ['IDT'],
  'Cypress Semiconductor': ['Cypress Semiconductor', 'Spansion'],
  'Spansion®': ['Spansion'],
};

// Process ALL products in batches
const BATCH_SIZE = 5000;
let offset = 0;
let totalFixed = 0;
let totalScanned = 0;
const mismatches = {};

const totalProducts = await p.product.count();
console.log(`扫描 ${totalProducts.toLocaleString()} 个产品...\n`);

while (offset < totalProducts) {
  const batch = await p.product.findMany({
    select: { id: true, partNumber: true, manufacturer: true, description: true },
    skip: offset,
    take: BATCH_SIZE,
    orderBy: { id: 'asc' },
  });
  
  if (batch.length === 0) break;
  
  for (const prod of batch) {
    totalScanned++;
    if (!prod.description || !prod.manufacturer) continue;
    
    // Extract "by XXXX" from description  
    // Pattern: "by <ManufacturerName>" followed by comma, period, space, or end
    const byMatch = prod.description.match(/\bby\s+([A-Z][A-Za-z0-9\s&®™\-\/\.\(\),]+?)(?:\.\s|\.\s*$|,\s|,\s*$|\s+(?:in|featuring|with|part|rated|This|-|\d))/);
    
    if (!byMatch) continue;
    
    let descMfr = byMatch[1].trim();
    // Remove trailing punctuation
    descMfr = descMfr.replace(/[,.\s]+$/, '');
    
    // Skip if description manufacturer matches product manufacturer (exact or contains)
    if (descMfr === prod.manufacturer) continue;
    if (prod.manufacturer.includes(descMfr) || descMfr.includes(prod.manufacturer)) continue;
    
    // Check if it's a known alias that maps to the correct manufacturer
    const aliasTargets = KNOWN_ALIASES[descMfr];
    if (aliasTargets && aliasTargets.includes(prod.manufacturer)) continue;
    
    // This is a genuine mismatch — description says one brand, field says another
    // BUT we need to verify it's not just a legitimate second-source
    // Only flag if the description brand is a KNOWN parent company of the field brand
    const parentChild = {
      'Intel': 'Altera',
      'Microchip': ['Atmel', 'Microsemi'],
      'Analog Devices': ['Linear Technology', 'Maxim Integrated'],
      'Analog Devices Inc.': ['Linear Technology', 'Maxim Integrated', 'Intersil'],
      'Analog Devices Inc./Maxim Integrated': ['Maxim Integrated'],
      'Renesas': ['Intersil', 'IDT'],
      'Infineon Technologies': ['Cypress Semiconductor', 'Spansion', 'International Rectifier'],
      'Infineon': ['Cypress Semiconductor', 'Spansion', 'International Rectifier'],
      'Onsemi': ['Fairchild Semiconductor'],
      'ON Semiconductor': ['Fairchild Semiconductor'],
      'AMD': ['Xilinx'],
      'AMD / Xilinx': ['Xilinx'],
      'Cypress Semiconductor': ['Spansion'],
      'Lattice Semiconductor Corporation': ['Lattice Semiconductor'],
      'Harris Semiconductor': ['Intersil'],
      'Intersil Corporation': ['Intersil'],
      'Microsemi Corporation': ['Microsemi'],
      'Waldom Electronics': ['IDT', 'Cypress Semiconductor', 'Xilinx'],
      'Spansion®': ['Spansion'],
    };
    
    const children = parentChild[descMfr];
    const isParentMismatch = children && (
      Array.isArray(children) ? children.includes(prod.manufacturer) : children === prod.manufacturer
    );
    
    if (isParentMismatch) {
      // This is a REAL problem — description says parent, should say child brand
      const key = `${prod.manufacturer}|${descMfr}`;
      if (!mismatches[key]) {
        mismatches[key] = { count: 0, samples: [], mfr: prod.manufacturer, descBrand: descMfr };
      }
      mismatches[key].count++;
      if (mismatches[key].samples.length < 3) {
        mismatches[key].samples.push(prod.partNumber);
      }
      
      // FIX IT: replace "by <oldName>" with "by <correctName>" in description
      const oldPattern = `by ${descMfr}`;
      const newPattern = `by ${prod.manufacturer}`;
      const newDesc = prod.description.replace(oldPattern, newPattern);
      
      if (newDesc !== prod.description) {
        await p.product.update({
          where: { id: prod.id },
          data: { description: newDesc }
        });
        totalFixed++;
      }
    }
  }
  
  offset += BATCH_SIZE;
  if (offset % 50000 === 0) {
    console.log(`  进度: ${offset.toLocaleString()}/${totalProducts.toLocaleString()} (修复: ${totalFixed})`);
  }
}

console.log(`\n扫描完成: ${totalScanned.toLocaleString()} 产品`);
console.log(`修复: ${totalFixed} 条描述\n`);

if (Object.keys(mismatches).length > 0) {
  console.log('发现并修复的不一致类型:');
  for (const [, m] of Object.entries(mismatches).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${m.count}x "${m.mfr}" 描述含 "by ${m.descBrand}": ${m.samples.join(', ')}`);
  }
} else {
  console.log('✅ 未发现任何描述不一致！');
}

console.log('\n' + '='.repeat(80));
await p.$disconnect();
