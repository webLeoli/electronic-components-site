import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

console.log('\n' + '='.repeat(70));
console.log('  深度厂商-产品匹配审计 v2');
console.log('='.repeat(70) + '\n');

// ============================================================
// PART 1: Check ALL manufacturers - sample their products
// For each manufacturer, show top part number prefixes to spot anomalies
// ============================================================
console.log('=== PART 1: 每个厂商的产品前缀分布（异常检测）===\n');

const allMfrs = await p.product.groupBy({
  by: ['manufacturer'],
  _count: { _all: true },
  orderBy: { _count: { manufacturer: 'desc' } },
});

// Known brand-specific prefixes (expanded)
const BRAND_PREFIXES = {
  'Altera': ['EP', '5C', '5A', '5S', '10M', '10C', '10A', '1S', 'AG', 'MAX10'],
  'Xilinx': ['XC2', 'XC3', 'XC4', 'XC5', 'XC6', 'XC7', 'XCV', 'XCF', 'XA', 'XADC'],
  'Atmel': ['AT', 'ATMEGA', 'ATTINY', 'ATSAM'],
  'Microchip': ['PIC', 'DSPIC', 'MCP', 'MIC', 'TC', 'SST'],
  'Texas Instruments': ['TPS', 'TLV', 'TMS', 'MSP', 'SN', 'LM', 'OPA', 'ADS', 'TL', 'UCC', 'BQ', 'DRV', 'TXS', 'TCA', 'DAC', 'INA'],
  'Analog Devices': ['AD', 'ADP', 'ADM', 'ADUM', 'ADF', 'ADG', 'HMC', 'ADXL'],
  'STMicroelectronics': ['STM', 'ST', 'L7', 'L29', 'VN', 'TSV'],
  'NXP Semiconductors': ['LPC', 'MIMX', 'S32', 'PCA', 'PCF', 'TJA', 'TEA'],
  'Renesas': ['R5F', 'R7F', 'RX', 'RA', 'RZ', 'UPD'],
  'Infineon': ['IFX', 'TLE', 'XMC', 'CY', 'BSP', 'BSS', 'BTS', 'IPD', 'IPB', 'SPB'],
  'Onsemi': ['NCV', 'NCP', 'NCS', 'NCD', 'NB', 'NSR', 'NTMS', 'MC78', 'MC79'],
  'Cypress Semiconductor': ['CY', 'PSOC', 'CYW', 'CYPD', 'CYBL', 'CY7C', 'CY8C', 'S25', 'FM'],
  'Linear Technology': ['LTC', 'LTM', 'LTP', 'LT1', 'LT3', 'LT4', 'LT6', 'LT8'],
  'Maxim Integrated': ['MAX', 'DS'],
  'Intersil': ['ISL', 'ICL', 'HIP', 'EL', 'X9'],
  'IDT': ['IDT', '8V', '5V', '89'],
  'Fairchild Semiconductor': ['FAN', 'FD', 'FQ', 'KA'],
  'International Rectifier': ['IRF', 'IRL', 'IRS', 'AUIR', 'IR1', 'IR2', 'IR3'],
  'Microsemi': ['A2F', 'A3P', 'APA', 'M2S', 'M2GL', 'MPF', 'RT4G', 'RTAX', 'SA'],
  'Freescale Semiconductor': ['MC9S', 'MK', 'MCIMX', 'MPC', 'MCF', 'FRDM'],
  'Spansion': ['S25', 'S29', 'S34', 'MB'],
  'Micron': ['MT'],
  'ISSI': ['IS'],
  'Torex Semiconductor': ['XC6', 'XC9', 'XC3'],
  'Rochester Electronics': [],  // Distributor - sells everything
  'ROHM': ['BD', 'BU', 'BR', 'BA', 'BH', 'BM', 'ML'],
  'Vishay': ['SI', 'SIR', 'SIS', 'VS', 'VOS'],
  'Broadcom': ['BCM', 'HCPL', 'ACPL', 'SFP'],
  'Diodes': ['AP', 'DMP', 'DMG', 'DMN', 'DMS', 'ZXT', 'ZXMS', 'PI'],
  'Skyworks': ['SKY', 'SI', 'AAT', 'AS'],
  'Silicon Labs': ['EFM', 'EFR', 'BGM', 'C8051', 'CP2', 'SI'],
  'ABLIC': ['S-', 'S1', 'S5'],
  'Lattice Semiconductor': ['LFE', 'LCMX', 'ICE', 'LIF', 'LFXP', 'LPTM', 'LFECP'],
  'Winbond Electronics': ['W25', 'W9', 'W78', 'W83'],
  'Macronix': ['MX25', 'MX29', 'MX66'],
  'GigaDevice': ['GD25', 'GD32'],
  'Dialog Semiconductor': ['DA1', 'DA7', 'SLG'],
  'Monolithic Power Systems': ['MP'],
};

// For each mfr with >50 products, show their prefix distribution
const issues = [];
for (const mfr of allMfrs) {
  if (!mfr.manufacturer || mfr._count._all < 20) continue;
  
  // Get top 3-char prefixes
  const samples = await p.product.findMany({
    where: { manufacturer: mfr.manufacturer },
    select: { partNumber: true },
    take: 500,
    orderBy: { partNumber: 'asc' }
  });
  
  const prefixCounts = {};
  for (const s of samples) {
    const pn = s.partNumber || '';
    // Try 4, 3, 2 char prefixes
    const prefix = pn.substring(0, 3).toUpperCase();
    prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
  }
  
  // Check if any top prefix belongs to a DIFFERENT brand
  const topPrefixes = Object.entries(prefixCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  for (const [prefix, count] of topPrefixes) {
    if (count < 3) continue;
    
    // Check which brand this prefix belongs to
    for (const [brand, knownPrefixes] of Object.entries(BRAND_PREFIXES)) {
      if (brand === mfr.manufacturer) continue;
      
      for (const kp of knownPrefixes) {
        if (prefix.startsWith(kp.substring(0, 3).toUpperCase()) && kp.length <= 3) {
          // Potential mismatch - verify with actual count
          const actualCount = await p.product.count({
            where: { manufacturer: mfr.manufacturer, partNumber: { startsWith: kp } }
          });
          if (actualCount > 2) {
            // Get samples
            const sampleParts = await p.product.findMany({
              where: { manufacturer: mfr.manufacturer, partNumber: { startsWith: kp } },
              select: { partNumber: true },
              take: 5
            });
            issues.push({
              currentMfr: mfr.manufacturer,
              prefix: kp,
              count: actualCount,
              suggestedBrand: brand,
              samples: sampleParts.map(s => s.partNumber),
            });
          }
        }
      }
    }
  }
}

// Print issues sorted by count
issues.sort((a, b) => b.count - a.count);
for (const issue of issues) {
  console.log(`⚠️ "${issue.currentMfr}" has ${issue.count}x "${issue.prefix}..." products`);
  console.log(`   Might belong to: ${issue.suggestedBrand}`);
  console.log(`   Samples: ${issue.samples.slice(0, 3).join(', ')}`);
  console.log('');
}

if (issues.length === 0) {
  console.log('✅ 没有检测到明显的前缀-品牌不匹配\n');
}

// ============================================================
// PART 2: Check remaining "Analog Devices Inc./Maxim Integrated" entries
// ============================================================
console.log('\n=== PART 2: 检查复合厂商名 ===\n');

const compoundMfrs = await p.product.groupBy({
  by: ['manufacturer'],
  _count: { _all: true },
  orderBy: { _count: { manufacturer: 'desc' } }
});

for (const m of compoundMfrs) {
  if (!m.manufacturer) continue;
  if (m.manufacturer.includes('/') || m.manufacturer.includes('®') || m.manufacturer.includes('™')) {
    console.log(`  ⚠️ "${m.manufacturer}" — ${m._count._all} products`);
    const sample = await p.product.findMany({
      where: { manufacturer: m.manufacturer },
      select: { partNumber: true },
      take: 5
    });
    console.log(`     Samples: ${sample.map(s => s.partNumber).join(', ')}`);
  }
}

// ============================================================
// PART 3: Remaining Intel check (what IS actually Intel?)
// ============================================================
console.log('\n\n=== PART 3: Intel 剩余产品检查 ===\n');

const intelProducts = await p.product.findMany({
  where: { manufacturer: 'Intel' },
  select: { partNumber: true },
  take: 100,
  orderBy: { partNumber: 'asc' }
});
const intelPrefixes = {};
for (const prod of intelProducts) {
  const prefix = prod.partNumber.substring(0, 3);
  intelPrefixes[prefix] = (intelPrefixes[prefix] || 0) + 1;
}
const intelTotal = await p.product.count({ where: { manufacturer: 'Intel' } });
console.log(`Intel 剩余 ${intelTotal} 个产品:`);
Object.entries(intelPrefixes).sort((a,b) => b[1]-a[1]).forEach(([p, c]) => console.log(`  ${p}: ${c}`));

// ============================================================
// PART 4: Remaining Microchip check
// ============================================================
console.log('\n\n=== PART 4: Microchip 剩余产品检查 ===\n');

const mcProducts = await p.product.findMany({
  where: { manufacturer: 'Microchip' },
  select: { partNumber: true },
  take: 200,
  orderBy: { partNumber: 'asc' }
});
const mcPrefixes = {};
for (const prod of mcProducts) {
  const prefix = prod.partNumber.substring(0, 3);
  mcPrefixes[prefix] = (mcPrefixes[prefix] || 0) + 1;
}
const mcTotal = await p.product.count({ where: { manufacturer: 'Microchip' } });
console.log(`Microchip 剩余 ${mcTotal} 个产品 (应该都是真正的 Microchip):`);
Object.entries(mcPrefixes).sort((a,b) => b[1]-a[1]).slice(0, 15).forEach(([p, c]) => console.log(`  ${p}: ${c}`));

// ============================================================
// PART 5: Check Renesas remaining
// ============================================================
console.log('\n\n=== PART 5: Renesas 剩余产品检查 ===\n');

const renProducts = await p.product.findMany({
  where: { manufacturer: 'Renesas' },
  select: { partNumber: true },
  take: 200,
  orderBy: { partNumber: 'asc' }
});
const renPrefixes = {};
for (const prod of renProducts) {
  const prefix = prod.partNumber.substring(0, 3);
  renPrefixes[prefix] = (renPrefixes[prefix] || 0) + 1;
}
const renTotal = await p.product.count({ where: { manufacturer: 'Renesas' } });
console.log(`Renesas 剩余 ${renTotal} 个产品:`);
Object.entries(renPrefixes).sort((a,b) => b[1]-a[1]).slice(0, 15).forEach(([p, c]) => console.log(`  ${p}: ${c}`));

// ============================================================
// PART 6: Check Analog Devices remaining
// ============================================================
console.log('\n\n=== PART 6: Analog Devices 剩余产品检查 ===\n');

for (const adiName of ['Analog Devices Inc.', 'Analog Devices Inc./Maxim Integrated', 'Analog Devices']) {
  const count = await p.product.count({ where: { manufacturer: adiName } });
  if (count === 0) continue;
  const prods = await p.product.findMany({
    where: { manufacturer: adiName },
    select: { partNumber: true },
    take: 100,
    orderBy: { partNumber: 'asc' }
  });
  const prefixes = {};
  for (const prod of prods) {
    const prefix = prod.partNumber.substring(0, 3);
    prefixes[prefix] = (prefixes[prefix] || 0) + 1;
  }
  console.log(`"${adiName}" 剩余 ${count} 个产品:`);
  Object.entries(prefixes).sort((a,b) => b[1]-a[1]).slice(0, 10).forEach(([p, c]) => console.log(`  ${p}: ${c}`));
  console.log('');
}

// ============================================================
// PART 7: Final overall stats
// ============================================================
console.log('\n=== FINAL: 修正后厂商分布 Top 25 ===\n');

const finalTop = await p.product.groupBy({
  by: ['manufacturer'],
  _count: { _all: true },
  orderBy: { _count: { manufacturer: 'desc' } },
  take: 25
});
const totalProducts = await p.product.count();
console.log(`总产品数: ${totalProducts.toLocaleString()}\n`);
for (const m of finalTop) {
  const pct = ((m._count._all / totalProducts) * 100).toFixed(1);
  console.log(`  ${m._count._all.toString().padStart(7)} (${pct.padStart(4)}%)  ${m.manufacturer}`);
}

console.log('\n' + '='.repeat(70));
console.log('  审计完成');
console.log('='.repeat(70) + '\n');

await p.$disconnect();
