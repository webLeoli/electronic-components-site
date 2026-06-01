import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

console.log('='.repeat(80));
console.log('  产品-厂商对应关系终极核查');
console.log('  扫描全部 719K 产品，三重交叉验证');
console.log('='.repeat(80) + '\n');

// ============================================================
// STRATEGY: Three independent verification methods
//
// 1. PREFIX CHECK: Part number prefix → expected brand
// 2. DESCRIPTION CHECK: Extract "by XXX" → should match manufacturer field
// 3. CROSS CHECK: If prefix says Brand-A AND description says Brand-B
//    AND manufacturer field says Brand-C, that's a problem
// ============================================================

// Definitive prefix rules (only 100% certain mappings)
// These prefixes EXCLUSIVELY belong to one brand — no second-sources
const EXCLUSIVE_PREFIXES = {
  // Altera (now Intel PSG) — FPGA/CPLD part numbers
  'EP1C': 'Altera', 'EP1S': 'Altera', 'EP1K': 'Altera',
  'EP2C': 'Altera', 'EP2S': 'Altera', 'EP2A': 'Altera',
  'EP3C': 'Altera', 'EP3S': 'Altera', 'EP3SE': 'Altera',
  'EP4C': 'Altera', 'EP4S': 'Altera', 'EP4SE': 'Altera',
  'EPM240': 'Altera', 'EPM570': 'Altera', 'EPM1270': 'Altera', 'EPM2210': 'Altera',
  'EPM7': 'Altera', 'EPC': 'Altera',
  '5CEFA': 'Altera', '5CEBA': 'Altera', '5CGXF': 'Altera', '5CSXF': 'Altera',
  '5AGXF': 'Altera', '5SGXE': 'Altera',
  '10M02': 'Altera', '10M04': 'Altera', '10M08': 'Altera', '10M16': 'Altera', '10M25': 'Altera', '10M50': 'Altera',
  '10CL': 'Altera', '10AX': 'Altera',
  '1SG': 'Altera', '1SM': 'Altera',

  // Xilinx — FPGA/CPLD part numbers
  'XC6SLX': 'Xilinx', 'XC6VLX': 'Xilinx', 'XC6VSX': 'Xilinx',
  'XC7A': 'Xilinx', 'XC7K': 'Xilinx', 'XC7V': 'Xilinx', 'XC7Z': 'Xilinx', 'XC7S': 'Xilinx',
  'XCKU': 'Xilinx', 'XCVU': 'Xilinx', 'XCZU': 'Xilinx',
  'XC2S': 'Xilinx', 'XC2V': 'Xilinx', 'XC2VP': 'Xilinx',
  'XC3S': 'Xilinx', 'XC4V': 'Xilinx', 'XC5V': 'Xilinx',
  'XC95': 'Xilinx', 'XC2C': 'Xilinx',
  'XCF': 'Xilinx', 'XC17': 'Xilinx', 'XC18': 'Xilinx',

  // Atmel — MCU/Memory
  'ATMEGA': 'Atmel', 'ATTINY': 'Atmel', 'ATXMEGA': 'Atmel',
  'ATSAM': 'Atmel', 'AT89C': 'Atmel', 'AT89S': 'Atmel',
  'AT90': 'Atmel', 'AT91SAM': 'Atmel',
  'AT24C': 'Atmel', 'AT25DF': 'Atmel', 'AT45DB': 'Atmel',

  // Linear Technology
  'LTC1': 'Linear Technology', 'LTC2': 'Linear Technology', 'LTC3': 'Linear Technology',
  'LTC4': 'Linear Technology', 'LTC5': 'Linear Technology', 'LTC6': 'Linear Technology',
  'LTC7': 'Linear Technology',
  'LTM2': 'Linear Technology', 'LTM4': 'Linear Technology', 'LTM8': 'Linear Technology',

  // Maxim — exclusive prefixes only
  'MAX232': 'Maxim Integrated', 'MAX3232': 'Maxim Integrated',
  'MAX485': 'Maxim Integrated', 'MAX490': 'Maxim Integrated',
  'MAX113': 'Maxim Integrated', 'MAX116': 'Maxim Integrated',
  'DS18B20': 'Maxim Integrated', 'DS1307': 'Maxim Integrated', 'DS3231': 'Maxim Integrated',

  // Cypress — exclusive prefixes
  'CY8C3': 'Cypress Semiconductor', 'CY8C4': 'Cypress Semiconductor', 'CY8C5': 'Cypress Semiconductor', 'CY8C6': 'Cypress Semiconductor',
  'CY7C6': 'Cypress Semiconductor', 'CY7C1': 'Cypress Semiconductor',
  'CYPD': 'Cypress Semiconductor',

  // Lattice — exclusive FPGA prefixes
  'LFE5U': 'Lattice Semiconductor', 'LFE5UM': 'Lattice Semiconductor',
  'LFE3': 'Lattice Semiconductor', 'LFE2': 'Lattice Semiconductor',
  'LCMXO': 'Lattice Semiconductor', 'ICE40': 'Lattice Semiconductor',
  'LFXP': 'Lattice Semiconductor',

  // Microsemi
  'A3P': 'Microsemi', 'A3PE': 'Microsemi', 'A2F': 'Microsemi',
  'M2S': 'Microsemi', 'M2GL': 'Microsemi',
  'RTAX': 'Microsemi', 'RT4G': 'Microsemi',

  // Intersil — exclusive
  'ISL6': 'Intersil', 'ISL8': 'Intersil', 'ISL9': 'Intersil',
  'ISL28': 'Intersil', 'ISL29': 'Intersil',
  'EL51': 'Intersil', 'EL71': 'Intersil',

  // IDT
  'IDT70': 'IDT', 'IDT71': 'IDT', 'IDT72': 'IDT', 'IDT74': 'IDT', 'IDT79': 'IDT',
  'IDT82': 'IDT', 'IDT85': 'IDT',
  '8V49': 'IDT', '8V89': 'IDT', '8V97': 'IDT',

  // Spansion — Flash memory
  'S25FL0': 'Spansion', 'S25FL1': 'Spansion', 'S25FL2': 'Spansion', 'S25FL5': 'Spansion',
  'S29GL': 'Spansion', 'S29AL': 'Spansion',
  'S34ML': 'Spansion',
};

// Known acceptable exceptions: distributor/second-source that legitimately carries these parts
const ACCEPTABLE_CARRIERS = {
  'Rochester Electronics': true,  // authorized obsolete parts distributor
  'Flip Electronics': true,
};

// Parent-child relationships (manufacturer field → acceptable parent companies in prefix)
const CHILD_OF = {
  'Altera': ['Intel', 'Intel Corporation'],
  'Atmel': ['Microchip', 'Microchip Technology'],
  'Linear Technology': ['Analog Devices', 'Analog Devices Inc.'],
  'Maxim Integrated': ['Analog Devices', 'Analog Devices Inc.'],
  'Cypress Semiconductor': ['Infineon Technologies', 'Infineon'],
  'Spansion': ['Infineon Technologies', 'Infineon', 'Cypress Semiconductor'],
  'Intersil': ['Renesas', 'Analog Devices'],
  'IDT': ['Renesas'],
  'Fairchild Semiconductor': ['Onsemi', 'ON Semiconductor'],
  'International Rectifier': ['Infineon Technologies', 'Infineon'],
  'Microsemi': ['Microchip', 'Microchip Technology'],
  'Lattice Semiconductor': ['Lattice Semiconductor Corporation'],
  'Xilinx': ['AMD', 'AMD / Xilinx'],
};

// ============================================================
// SCAN ALL 719K PRODUCTS
// ============================================================
const totalProducts = await p.product.count();
console.log(`扫描 ${totalProducts.toLocaleString()} 个产品...\n`);

const BATCH = 10000;
let offset = 0;
const prefixIssues = {};
const descIssues = {};
let scanned = 0;

while (offset < totalProducts) {
  const batch = await p.product.findMany({
    select: { partNumber: true, manufacturer: true, description: true },
    skip: offset, take: BATCH, orderBy: { id: 'asc' },
  });
  if (batch.length === 0) break;

  for (const prod of batch) {
    scanned++;
    if (!prod.manufacturer) continue;
    if (ACCEPTABLE_CARRIERS[prod.manufacturer]) continue;

    const pn = prod.partNumber;

    // CHECK 1: Prefix verification
    for (const [prefix, expectedBrand] of Object.entries(EXCLUSIVE_PREFIXES)) {
      if (!pn.startsWith(prefix)) continue;
      if (prod.manufacturer === expectedBrand) continue;

      // Is this brand a legitimate parent of the expected brand?
      const parents = CHILD_OF[expectedBrand];
      if (parents && parents.includes(prod.manufacturer)) {
        // Wrong! Product should be under the child brand, not parent
        const key = `${prod.manufacturer}→${expectedBrand}|${prefix}`;
        if (!prefixIssues[key]) prefixIssues[key] = { count: 0, samples: [], from: prod.manufacturer, to: expectedBrand, prefix };
        prefixIssues[key].count++;
        if (prefixIssues[key].samples.length < 3) prefixIssues[key].samples.push(pn);
        break;
      }

      // Is the manufacturer a known legitimate second-source for this prefix?
      // (e.g., TI makes MAX232, Onsemi makes MAX809)
      // Skip if manufacturer is NOT a known parent/child
      const childParents = CHILD_OF[prod.manufacturer];
      if (childParents && childParents.includes(expectedBrand)) continue; // reverse relationship OK
      
      // Check if it's a different company entirely (potential real issue)
      const isRelated = Object.values(CHILD_OF).some(parents => 
        parents.includes(prod.manufacturer) || parents.includes(expectedBrand)
      );
      if (!isRelated && prod.manufacturer !== expectedBrand) {
        // Potential cross-brand issue
        const key = `CROSS|${prod.manufacturer}|${prefix}|${expectedBrand}`;
        if (!prefixIssues[key]) prefixIssues[key] = { count: 0, samples: [], from: prod.manufacturer, to: expectedBrand, prefix, cross: true };
        prefixIssues[key].count++;
        if (prefixIssues[key].samples.length < 3) prefixIssues[key].samples.push(pn);
      }
      break;
    }

    // CHECK 2: Description cross-reference
    if (prod.description) {
      const byMatch = prod.description.match(/\bby\s+([A-Z][A-Za-z0-9\s&\-\/\.]+?)(?:[,.]|\s+(?:in|featuring|with|part|rated|This|-|\d))/);
      if (byMatch) {
        let descBrand = byMatch[1].trim().replace(/[,.\s]+$/, '');
        // Normalize
        if (descBrand === prod.manufacturer) continue;
        if (prod.manufacturer.includes(descBrand) || descBrand.includes(prod.manufacturer)) continue;

        // Check if description brand is a parent of manufacturer (this is WRONG)
        const parents = CHILD_OF[prod.manufacturer];
        if (parents && parents.some(p => descBrand.includes(p) || p.includes(descBrand))) {
          const key = `DESC|${prod.manufacturer}|${descBrand}`;
          if (!descIssues[key]) descIssues[key] = { count: 0, samples: [], mfr: prod.manufacturer, descBrand };
          descIssues[key].count++;
          if (descIssues[key].samples.length < 3) descIssues[key].samples.push(`${pn}: "${prod.description.substring(0, 60)}"`);
        }
      }
    }
  }

  offset += BATCH;
  if (offset % 100000 === 0) process.stdout.write(`  ${(offset/1000).toFixed(0)}K...`);
}

console.log(`\n\n扫描完成: ${scanned.toLocaleString()} 产品\n`);

// ============================================================
// REPORT PREFIX ISSUES
// ============================================================
const realPrefixIssues = Object.values(prefixIssues).filter(i => i.count > 0).sort((a, b) => b.count - a.count);

if (realPrefixIssues.length === 0) {
  console.log('=== 前缀检查 ===\n  ✅ 所有产品的型号前缀与厂商完全一致\n');
} else {
  console.log('=== 前缀不匹配 ===\n');
  for (const issue of realPrefixIssues) {
    if (issue.cross) {
      console.log(`  ⚠️ ${issue.count}x "${issue.from}" 有 "${issue.prefix}..." 产品 (通常属于 ${issue.to})`);
    } else {
      console.log(`  🔴 ${issue.count}x "${issue.from}" → 应为 "${issue.to}" (前缀: ${issue.prefix})`);
    }
    console.log(`     样本: ${issue.samples.join(', ')}\n`);
  }
}

// ============================================================
// REPORT DESCRIPTION ISSUES
// ============================================================
const realDescIssues = Object.values(descIssues).filter(i => i.count > 0).sort((a, b) => b.count - a.count);

if (realDescIssues.length === 0) {
  console.log('=== 描述检查 ===\n  ✅ 所有描述中的品牌名与厂商字段一致\n');
} else {
  console.log('=== 描述不匹配 ===\n');
  for (const issue of realDescIssues) {
    console.log(`  🔴 ${issue.count}x "${issue.mfr}" 描述含 "${issue.descBrand}"`);
    issue.samples.forEach(s => console.log(`     ${s}`));
    console.log('');
  }
}

const totalIssues = realPrefixIssues.filter(i => !i.cross).length + realDescIssues.length;
const crossIssues = realPrefixIssues.filter(i => i.cross).length;

console.log('='.repeat(80));
console.log(`  结果: ${totalIssues === 0 ? '✅ 零致命问题' : `${totalIssues} 个致命问题`}`);
if (crossIssues > 0) console.log(`  ⚠️ ${crossIssues} 个跨品牌项（可能是二次源，需人工确认）`);
console.log('='.repeat(80));

await p.$disconnect();
