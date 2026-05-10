import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

console.log('='.repeat(80));
console.log('  穷尽式厂商审计 — 采购工程师视角');
console.log('  检查每一个厂商、每一条异常');
console.log('='.repeat(80) + '\n');

// ============================================================
// MASTER PREFIX DATABASE — industry standard part number prefixes
// Built from decades of procurement knowledge
// Format: prefix → { brand, note }
// ============================================================
const PREFIX_DB = {
  // === Altera / Intel PSG ===
  'EP1': 'Altera', 'EP2': 'Altera', 'EP3': 'Altera', 'EP4': 'Altera',
  'EPM': 'Altera', 'EPC': 'Altera', 'EPF': 'Altera', 'EPXA': 'Altera',
  '5CS': 'Altera', '5CG': 'Altera', '5CE': 'Altera', '5CB': 'Altera',
  '5A': 'Altera', '5S': 'Altera', '5M': 'Altera',
  '10M0': 'Altera', '10M1': 'Altera', '10M2': 'Altera', '10M4': 'Altera', '10M5': 'Altera', '10M8': 'Altera',
  '10CL': 'Altera', '10CX': 'Altera',
  '10AT': 'Altera', '10AX': 'Altera', '10AS': 'Altera',
  '1SG': 'Altera', '1SM': 'Altera', '1SX': 'Altera', '1ST': 'Altera', '1SD': 'Altera',
  'AGFB': 'Altera', 'AGIB': 'Altera', 'AGF0': 'Altera', 'AGI0': 'Altera', 'AGM0': 'Altera',
  'MPF10K': 'Altera', 'MPF82': 'Altera', 'MPF84': 'Altera', 'MPF86': 'Altera', 'MPF88': 'Altera',
  'MPM': 'Altera',

  // === Xilinx ===
  'XC2S': 'Xilinx', 'XC2V': 'Xilinx', 'XC2VP': 'Xilinx',
  'XC3S': 'Xilinx', 'XC3SD': 'Xilinx', 'XC3A': 'Xilinx',
  'XC4V': 'Xilinx', 'XC4VLX': 'Xilinx', 'XC4VFX': 'Xilinx', 'XC4VSX': 'Xilinx',
  'XC5V': 'Xilinx', 'XC5VLX': 'Xilinx', 'XC5VFX': 'Xilinx', 'XC5VSX': 'Xilinx',
  'XC6S': 'Xilinx', 'XC6V': 'Xilinx', 'XC6SLX': 'Xilinx', 'XC6VLX': 'Xilinx',
  'XC7A': 'Xilinx', 'XC7K': 'Xilinx', 'XC7V': 'Xilinx', 'XC7Z': 'Xilinx', 'XC7S': 'Xilinx',
  'XCKU': 'Xilinx', 'XCVU': 'Xilinx', 'XCZU': 'Xilinx',
  'XA7A': 'Xilinx', 'XA7S': 'Xilinx', 'XAZU': 'Xilinx',
  'XCF': 'Xilinx', 'XC17': 'Xilinx', 'XC18': 'Xilinx',
  'XC95': 'Xilinx', 'XC9572': 'Xilinx', 'XC9536': 'Xilinx',
  'XC2C': 'Xilinx',
  'XC40': 'Xilinx', // APEX is Altera but XC4000 is Xilinx!

  // === Atmel ===
  'ATMEGA': 'Atmel', 'ATTINY': 'Atmel', 'ATXMEGA': 'Atmel',
  'ATSAM': 'Atmel', 'ATSAMA': 'Atmel', 'ATSAMD': 'Atmel', 'ATSAME': 'Atmel',
  'AT89': 'Atmel', 'AT90': 'Atmel', 'AT91': 'Atmel',
  'AT24': 'Atmel', 'AT25': 'Atmel', 'AT26': 'Atmel', 'AT27': 'Atmel',
  'AT28': 'Atmel', 'AT29': 'Atmel', 'AT32': 'Atmel', 'AT43': 'Atmel',
  'AT45': 'Atmel', 'AT49': 'Atmel', 'AT73': 'Atmel', 'AT76': 'Atmel',
  'AT86': 'Atmel', 'AT97': 'Atmel', 'AT17': 'Atmel',
  'ATA': 'Atmel', 'ATECC': 'Atmel', 'ATSHA': 'Atmel', 'ATUC': 'Atmel',

  // === Linear Technology ===
  'LTC': 'Linear Technology', 'LTM': 'Linear Technology', 'LTP': 'Linear Technology',
  'LT1': 'Linear Technology', 'LT3': 'Linear Technology', 'LT4': 'Linear Technology',
  'LT6': 'Linear Technology', 'LT8': 'Linear Technology',

  // === Maxim Integrated ===
  'MAX2': 'Maxim Integrated', 'MAX3': 'Maxim Integrated', 'MAX4': 'Maxim Integrated',
  'MAX5': 'Maxim Integrated', 'MAX6': 'Maxim Integrated', 'MAX7': 'Maxim Integrated',
  'MAX8': 'Maxim Integrated', 'MAX9': 'Maxim Integrated', 'MAX1': 'Maxim Integrated',
  'DS1': 'Maxim Integrated', 'DS2': 'Maxim Integrated', 'DS3': 'Maxim Integrated',
  'DS4': 'Maxim Integrated', 'DS9': 'Maxim Integrated',

  // === Intersil ===
  'ISL': 'Intersil', 'ICL': 'Intersil', 'HIP': 'Intersil',

  // === IDT ===
  'IDT7': 'IDT', 'IDT8': 'IDT', 'IDT5': 'IDT', 'IDT4': 'IDT', 'IDT2': 'IDT',
  '8V49': 'IDT', '8V89': 'IDT', '8V97': 'IDT',

  // === Fairchild ===
  'FAN': 'Fairchild Semiconductor',
  'FDC': 'Fairchild Semiconductor', 'FDD': 'Fairchild Semiconductor',
  'FDF': 'Fairchild Semiconductor', 'FDG': 'Fairchild Semiconductor',
  'FDN': 'Fairchild Semiconductor', 'FDP': 'Fairchild Semiconductor',
  'FDS': 'Fairchild Semiconductor', 'FDT': 'Fairchild Semiconductor',
  'FDV': 'Fairchild Semiconductor', 'FDY': 'Fairchild Semiconductor',
  'FDMS': 'Fairchild Semiconductor', 'FDMC': 'Fairchild Semiconductor',
  'FQP': 'Fairchild Semiconductor', 'FQA': 'Fairchild Semiconductor',
  'FQPF': 'Fairchild Semiconductor',
  'KA7': 'Fairchild Semiconductor', 'KA3': 'Fairchild Semiconductor', 'KA2': 'Fairchild Semiconductor',

  // === International Rectifier ===
  'IRFP': 'International Rectifier', 'IRFZ': 'International Rectifier',
  'IRFB': 'International Rectifier', 'IRFS': 'International Rectifier',
  'IRFI': 'International Rectifier', 'IRFU': 'International Rectifier',
  'IRLZ': 'International Rectifier', 'IRLB': 'International Rectifier',
  'IRLS': 'International Rectifier',
  'IRS2': 'International Rectifier', 'IRS2': 'International Rectifier',
  'AUIR': 'International Rectifier',
  'IR21': 'International Rectifier', 'IR22': 'International Rectifier',
  'IR33': 'International Rectifier', 'IR38': 'International Rectifier',

  // === Microsemi ===
  'A2F': 'Microsemi', 'A3P': 'Microsemi', 'A3PE': 'Microsemi',
  'APA': 'Microsemi', 'AX': 'Microsemi',
  'M2S': 'Microsemi', 'M2GL': 'Microsemi',
  'MPF1': 'Microsemi', 'MPF2': 'Microsemi', 'MPF3': 'Microsemi', 'MPF5': 'Microsemi',
  'RTAX': 'Microsemi', 'RT4G': 'Microsemi', 'RTPF': 'Microsemi',

  // === Freescale ===
  'MC9S': 'Freescale Semiconductor', 'MC9S08': 'Freescale Semiconductor',
  'MK': 'Freescale Semiconductor',
  'MCIMX': 'Freescale Semiconductor',
  'MPC': 'Freescale Semiconductor',
  'MCF': 'Freescale Semiconductor',

  // === Spansion ===
  'S25FL': 'Spansion', 'S29': 'Spansion', 'S34': 'Spansion',

  // === Cypress ===
  'CY8C': 'Cypress Semiconductor', 'CY7C': 'Cypress Semiconductor',
  'CY14': 'Cypress Semiconductor', 'CY15': 'Cypress Semiconductor',
  'CY62': 'Cypress Semiconductor', 'CY22': 'Cypress Semiconductor',
  'CY23': 'Cypress Semiconductor', 'CY27': 'Cypress Semiconductor',
  'CYBL': 'Cypress Semiconductor', 'CYPD': 'Cypress Semiconductor',
  'CYW4': 'Cypress Semiconductor', 'CYW2': 'Cypress Semiconductor',

  // === Dialog ===
  'DA14': 'Dialog Semiconductor', 'DA72': 'Dialog Semiconductor',
  'SLG46': 'Dialog Semiconductor',

  // === Lattice ===
  'LFE5': 'Lattice Semiconductor', 'LFE3': 'Lattice Semiconductor', 'LFE2': 'Lattice Semiconductor',
  'LCMXO': 'Lattice Semiconductor', 'ICE40': 'Lattice Semiconductor',
  'LFXP': 'Lattice Semiconductor', 'LPTM': 'Lattice Semiconductor',
};

// Brands that are DISTRIBUTORS (their products should NOT be reassigned)
const DISTRIBUTORS = new Set([
  'Rochester Electronics', 'Flip Electronics', 'Waldom Electronics',
  'Arrow Electronics', 'Avnet', 'Mouser', 'Digi-Key',
  'Future Electronics', 'Newark', 'RS Components',
]);

// Brands that legitimately share prefixes with other companies
// prefix → set of acceptable manufacturers
const LEGITIMATE_OVERLAPS = {
  'XC': new Set(['Xilinx', 'Torex Semiconductor', 'Infineon Technologies', 'NXP Semiconductors', 'Motorola, Inc.', 'Nexperia USA Inc.']),
  'XC6': new Set(['Torex Semiconductor']),
  'XC9': new Set(['Torex Semiconductor', 'Renesas']),
  'XC2': new Set(['Xilinx', 'Torex Semiconductor']),
  'XC3': new Set(['Xilinx', 'Torex Semiconductor']),
  'MAX': new Set(['Maxim Integrated', 'Altera', 'Analog Devices']),
  'IR': new Set(['International Rectifier', 'Sharp Microelectronics', 'Vishay']),
  'CY': new Set(['Cypress Semiconductor', 'IXYS', 'Infineon Technologies']),
  'CYG': new Set(['IXYS']),
  'AD': new Set(['Analog Devices', 'Advantech']),
  'PCA': new Set(['NXP Semiconductors', 'Advantech', 'ScioSense']),
  'TL': new Set(['Texas Instruments', 'Micro Commercial Components, Corp.']),
  'LM': new Set(['Texas Instruments', 'Micro Commercial Components, Corp.']),
  'KA': new Set(['Fairchild Semiconductor', 'Nuvoton Technology']),
  'SN': new Set(['Texas Instruments', 'Motorola, Inc.']),
  'TPS': new Set(['Texas Instruments', 'Ampleon USA Inc.']),
  'IS': new Set(['ISSI', 'Intersil']),
  'ST': new Set(['STMicroelectronics', 'Kinetic Technologies']),
  'SI': new Set(['Skyworks Solutions', 'Vishay', 'Silicon Labs']),
  'MP': new Set(['Monolithic Power Systems']),
  'FM': new Set(['Cypress Semiconductor', 'Ramtron']),
  'MB': new Set(['Spansion', 'Fujitsu']),
  'UPD': new Set(['Renesas', 'Ampleon USA Inc.']),
  'DS': new Set(['Maxim Integrated', 'Dallas Semiconductor']),
  'EL': new Set(['Intersil', 'Renesas', 'Elmos Semiconductor']),
  'MC33': new Set(['Freescale Semiconductor', 'NXP Semiconductors', 'Onsemi']),
  'MC34': new Set(['Freescale Semiconductor', 'NXP Semiconductors', 'Onsemi']),
  'MK': new Set(['Freescale Semiconductor', 'NXP Semiconductors']),
  'AX': new Set(['Microsemi', 'Microchip']),
  'A3P': new Set(['Microsemi', 'Microchip']),
  'A2F': new Set(['Microsemi', 'Microchip']),
  'M2S': new Set(['Microsemi', 'Microchip']),
  'M2GL': new Set(['Microsemi', 'Microchip']),
  'MPF': new Set(['Microsemi', 'Microchip']),
  'RT4G': new Set(['Microsemi', 'Microchip']),
  'HIP': new Set(['Intersil', 'Renesas']),
  '89': new Set(['IDT', 'Waldom Electronics']),
  '5C': new Set(['Altera', 'Critical Link, LLC']),
  'W25': new Set(['Winbond Electronics', 'Cypress Semiconductor']),
  'S25': new Set(['Spansion', 'Cypress Semiconductor']),
  'AT': new Set(['Atmel', 'Microchip']),
  'MPC': new Set(['Freescale Semiconductor', 'NXP Semiconductors']),
  'AG': new Set(['Altera', 'Microsemi Corporation']),
  'AGL': new Set(['Microsemi']),
};

// ============================================================
// PHASE 1: Check EVERY manufacturer for prefix conflicts
// ============================================================
console.log('=== PHASE 1: 逐厂商产品前缀异常检测 ===\n');

const allMfrs = await p.product.groupBy({
  by: ['manufacturer'],
  _count: { _all: true },
  orderBy: { _count: { manufacturer: 'desc' } },
});

const allIssues = [];

for (const mfr of allMfrs) {
  if (!mfr.manufacturer || DISTRIBUTORS.has(mfr.manufacturer)) continue;
  
  // Get ALL products for this manufacturer (in batches)
  const products = await p.product.findMany({
    where: { manufacturer: mfr.manufacturer },
    select: { partNumber: true },
  });

  for (const prod of products) {
    const pn = prod.partNumber;
    
    // Check against every prefix in our DB
    for (const [prefix, correctBrand] of Object.entries(PREFIX_DB)) {
      if (correctBrand === mfr.manufacturer) continue; // Same brand = OK
      if (!pn.startsWith(prefix)) continue;
      
      // Check if this is a legitimate overlap
      const overlapKey = Object.keys(LEGITIMATE_OVERLAPS).find(k => prefix.startsWith(k) || k === prefix);
      if (overlapKey && LEGITIMATE_OVERLAPS[overlapKey]?.has(mfr.manufacturer)) continue;
      
      // This is a real mismatch!
      const key = `${mfr.manufacturer}|${prefix}|${correctBrand}`;
      const existing = allIssues.find(i => i.key === key);
      if (existing) {
        existing.count++;
        if (existing.samples.length < 3) existing.samples.push(pn);
      } else {
        allIssues.push({
          key, currentMfr: mfr.manufacturer, prefix, correctBrand,
          count: 1, samples: [pn]
        });
      }
    }
  }
}

// Sort by count descending
allIssues.sort((a, b) => b.count - a.count);

if (allIssues.length === 0) {
  console.log('  ✅ 没有检测到任何前缀-品牌不匹配！\n');
} else {
  console.log(`  发现 ${allIssues.length} 类问题:\n`);
  for (const issue of allIssues) {
    const icon = issue.count > 10 ? '🔴' : issue.count > 3 ? '🟡' : '⚪';
    console.log(`  ${icon} ${issue.count}x "${issue.currentMfr}" has "${issue.prefix}..." → should be "${issue.correctBrand}"`);
    console.log(`     Samples: ${issue.samples.join(', ')}\n`);
  }
}

// ============================================================
// PHASE 2: Check for DUPLICATE manufacturer names (same brand, different spelling)
// ============================================================
console.log('\n=== PHASE 2: 重复/相似厂商名检测 ===\n');

const mfrNames = allMfrs.map(m => m.manufacturer).filter(Boolean);
const normalized = {};
for (const name of mfrNames) {
  const key = name.toLowerCase()
    .replace(/\s*(inc\.?|corp\.?|corporation|ltd\.?|limited|co\.?|company|gmbh|ag|sa|nv|bv|plc)\s*/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  if (!normalized[key]) normalized[key] = [];
  normalized[key].push(name);
}
const dupes = Object.entries(normalized).filter(([, names]) => names.length > 1);
if (dupes.length === 0) {
  console.log('  ✅ 没有重复厂商名');
} else {
  for (const [, names] of dupes) {
    const counts = [];
    for (const name of names) {
      const c = allMfrs.find(m => m.manufacturer === name)?._count._all || 0;
      counts.push(`"${name}" (${c})`);
    }
    console.log(`  ⚠️ 可能重复: ${counts.join(' vs ')}`);
  }
}

// ============================================================
// PHASE 3: Verify Manufacturer table vs Product.manufacturer
// ============================================================
console.log('\n\n=== PHASE 3: Manufacturer表 vs Product.manufacturer 一致性 ===\n');

const mfrTable = await p.manufacturer.findMany({ select: { name: true, slug: true } });
const mfrTableNames = new Set(mfrTable.map(m => m.name));
const productMfrs = new Set(mfrNames);

const inProductNotInTable = [...productMfrs].filter(n => !mfrTableNames.has(n));
const inTableNotInProduct = [...mfrTableNames].filter(n => !productMfrs.has(n));

if (inProductNotInTable.length > 0) {
  console.log(`  ⚠️ ${inProductNotInTable.length} 个厂商在产品中但不在 Manufacturer 表:`);
  inProductNotInTable.slice(0, 20).forEach(n => console.log(`     - "${n}"`));
  if (inProductNotInTable.length > 20) console.log(`     ... and ${inProductNotInTable.length - 20} more`);
}
if (inTableNotInProduct.length > 0) {
  console.log(`  ⚠️ ${inTableNotInProduct.length} 个厂商在 Manufacturer 表但没有产品:`);
  inTableNotInProduct.slice(0, 10).forEach(n => console.log(`     - "${n}"`));
}
if (inProductNotInTable.length === 0 && inTableNotInProduct.length === 0) {
  console.log('  ✅ 完全一致');
}

// ============================================================
// PHASE 4: Products with empty/null/suspicious manufacturer
// ============================================================
console.log('\n\n=== PHASE 4: 异常厂商值 ===\n');

const emptyMfr = await p.product.count({ where: { manufacturer: '' } });
const nullMfr = await p.product.count({ where: { manufacturer: { equals: null } } });
const unknownMfr = await p.product.count({ where: { manufacturer: { in: ['Unknown', 'unknown', 'N/A', 'n/a', '-', 'TBD', 'Other'] } } });
console.log(`  空值: ${emptyMfr} | NULL: ${nullMfr} | Unknown/N-A: ${unknownMfr}`);

// ============================================================
// PHASE 5: Final statistics
// ============================================================
console.log('\n\n=== PHASE 5: 最终统计 ===\n');

const totalProducts = await p.product.count();
const uniqueMfrs = (await p.product.groupBy({ by: ['manufacturer'] })).length;
console.log(`总产品: ${totalProducts.toLocaleString()}`);
console.log(`独立厂商: ${uniqueMfrs}`);
console.log(`Manufacturer 表: ${mfrTable.length} 条\n`);

console.log('='.repeat(80));
console.log('  审计完成');
console.log('='.repeat(80));

await p.$disconnect();
