import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

console.log('\n========================================');
console.log('  厂商-产品匹配审计报告');
console.log('========================================\n');

// Known part number prefix → brand mappings for cross-checking
const PREFIX_BRAND = {
  // FPGA / CPLD
  'EP': 'Altera', 'EPM': 'Altera', 'EPC': 'Altera', 
  '5CS': 'Altera', '5CG': 'Altera', '5CE': 'Altera',
  '5A': 'Altera', '5S': 'Altera', '10M': 'Altera',
  '10AT': 'Altera', '10AX': 'Altera', '10AS': 'Altera',
  '1SG': 'Altera', 'AGFB': 'Altera', 'AGIB': 'Altera',
  'XC': 'Xilinx', 'XA': 'Xilinx',
  'LCMXO': 'Lattice Semiconductor', 'LFE': 'Lattice Semiconductor',
  'ICE40': 'Lattice Semiconductor',
  
  // MCU
  'ATMEGA': 'Atmel', 'ATTINY': 'Atmel', 'ATSAM': 'Atmel',
  'AT89': 'Atmel', 'AT91': 'Atmel', 'AT90': 'Atmel',
  'STM32': 'STMicroelectronics', 'STM8': 'STMicroelectronics',
  'PIC': 'Microchip', 'DSPIC': 'Microchip',
  'MSP430': 'Texas Instruments', 'TMS320': 'Texas Instruments',
  'LPC': 'NXP Semiconductors', 'MIMX': 'NXP Semiconductors',
  'R5F': 'Renesas', 'R7F': 'Renesas',
  'CY8C': 'Cypress Semiconductor', 'PSOC': 'Cypress Semiconductor',
  'EFM32': 'Silicon Labs', 'EFR32': 'Silicon Labs',
  'NRF': 'Nordic Semiconductor',
  'ESP32': 'Espressif', 'ESP8266': 'Espressif',
  
  // Power
  'LTC': 'Linear Technology', 'LTM': 'Linear Technology', 'LT1': 'Linear Technology',
  'LT3': 'Linear Technology', 'LT6': 'Linear Technology', 'LT8': 'Linear Technology',
  'TPS': 'Texas Instruments', 'TLV': 'Texas Instruments', 'LM': 'Texas Instruments',
  'ADP': 'Analog Devices', 'AD5': 'Analog Devices', 'AD7': 'Analog Devices',
  'MAX': 'Maxim Integrated',
  'ISL': 'Intersil', 'HIP': 'Intersil',
  'IRF': 'International Rectifier', 'IRFP': 'International Rectifier',
  'FAN': 'Fairchild Semiconductor',
  
  // Memory
  'MT': 'Micron', 'N25Q': 'Micron',
  'S25FL': 'Spansion', 'S29': 'Spansion',
  'IS': 'ISSI',
  'W25': 'Winbond Electronics', 'W9': 'Winbond Electronics',
  'MX25': 'Macronix', 'MX29': 'Macronix',
  'AT24': 'Atmel', 'AT25': 'Atmel', 'AT45': 'Atmel',
  'SST': 'Microchip',
  'K9': 'Samsung', 'K4': 'Samsung',
  
  // Interface
  'FT': 'FTDI', 'DS': 'Maxim Integrated',
  'SN': 'Texas Instruments', 'CD': 'Texas Instruments',
  'IDT': 'IDT',
};

// 1. Check for products still under parent company that should be under acquired brand
console.log('=== 1. 可能仍然错误归属于母公司的产品 ===\n');

const CHECKS = [
  { mfr: 'Intel', prefixes: ['EP', '5C', '5A', '5S', '10M', '10C', '10A', '1S', 'AG', 'MAX'], expected: 'Altera' },
  { mfr: 'Microchip', prefixes: ['AT', 'ATMEGA', 'ATTINY', 'ATSAM'], expected: 'Atmel' },
  { mfr: 'Microchip', prefixes: ['A2F', 'A3P', 'APA', 'M2S', 'M2GL', 'MPF', 'RT4G', 'RTAX'], expected: 'Microsemi' },
  { mfr: 'Analog Devices Inc.', prefixes: ['LTC', 'LTM', 'LTP', 'LT1', 'LT3', 'LT4', 'LT6', 'LT8'], expected: 'Linear Technology' },
  { mfr: 'Analog Devices Inc./Maxim Integrated', prefixes: ['MAX', 'DS', 'ICM'], expected: 'Maxim Integrated' },
  { mfr: 'Renesas', prefixes: ['ISL', 'ICL', 'HIP', 'EL', 'X9', 'HS'], expected: 'Intersil' },
  { mfr: 'Renesas', prefixes: ['IDT', '8V'], expected: 'IDT' },
  { mfr: 'Onsemi', prefixes: ['FAN', 'FD', 'FQ', 'KA'], expected: 'Fairchild Semiconductor' },
  { mfr: 'Infineon Technologies', prefixes: ['IRF', 'IRL', 'IRS', 'AUIR', 'IR1', 'IR2', 'IR3'], expected: 'International Rectifier' },
  { mfr: 'NXP Semiconductors', prefixes: ['MC9S', 'MK', 'MCIMX', 'MPC', 'MCF', 'MC33', 'MC34', 'FRDM'], expected: 'Freescale Semiconductor' },
  { mfr: 'Cypress Semiconductor', prefixes: ['S25FL', 'S29', 'S34', 'MB'], expected: 'Spansion' },
];

let remainingIssues = 0;
for (const check of CHECKS) {
  for (const prefix of check.prefixes) {
    const count = await p.product.count({
      where: { manufacturer: check.mfr, partNumber: { startsWith: prefix } }
    });
    if (count > 0) {
      console.log(`  ⚠️ ${count} products under "${check.mfr}" start with "${prefix}" → should be "${check.expected}"`);
      remainingIssues += count;
    }
  }
}
if (remainingIssues === 0) console.log('  ✅ 无剩余母公司误归属问题');
else console.log(`  \n  ❌ 共 ${remainingIssues} 个产品仍需修正`);

// 2. Check for cross-manufacturer conflicts (Product brand doesn't match any known prefix)
console.log('\n\n=== 2. 产品型号前缀与厂商名不匹配 (抽样) ===\n');

// Check specific known prefix-brand pairs
const SPOT_CHECKS = [
  { prefix: 'STM32', expected: ['STMicroelectronics'] },
  { prefix: 'PIC', expected: ['Microchip'] },
  { prefix: 'TPS', expected: ['Texas Instruments'] },
  { prefix: 'AD5', expected: ['Analog Devices Inc.', 'Analog Devices'] },
  { prefix: 'XC', expected: ['Xilinx', 'AMD / Xilinx', 'AMD'] },
  { prefix: 'NRF', expected: ['Nordic Semiconductor'] },
  { prefix: 'ESP32', expected: ['Espressif'] },
  { prefix: 'W25', expected: ['Winbond Electronics'] },
  { prefix: 'MX25', expected: ['Macronix'] },
  { prefix: 'CY8C', expected: ['Cypress Semiconductor'] },
  { prefix: 'EFM32', expected: ['Silicon Labs'] },
  { prefix: 'MT4', expected: ['Micron', 'Micron Technology Inc.'] },
];

for (const check of SPOT_CHECKS) {
  const wrongMfrs = await p.product.groupBy({
    by: ['manufacturer'],
    where: {
      partNumber: { startsWith: check.prefix },
      manufacturer: { notIn: check.expected }
    },
    _count: { _all: true }
  });
  if (wrongMfrs.length > 0) {
    for (const w of wrongMfrs) {
      console.log(`  ⚠️ ${w._count._all}x "${check.prefix}..." under "${w.manufacturer}" (expected: ${check.expected.join('/')})`);
      // Show sample
      const samples = await p.product.findMany({
        where: { partNumber: { startsWith: check.prefix }, manufacturer: w.manufacturer },
        select: { partNumber: true },
        take: 3
      });
      console.log(`     Sample: ${samples.map(s => s.partNumber).join(', ')}`);
    }
  }
}

// 3. Check for duplicate products (same part number, different manufacturer)
console.log('\n\n=== 3. 同一型号多个厂商 (数据冲突) ===\n');

const dupes = await p.$queryRaw`
  SELECT "partNumber", COUNT(DISTINCT manufacturer) as mfr_count, 
         array_agg(DISTINCT manufacturer) as manufacturers
  FROM "Product" 
  GROUP BY "partNumber" 
  HAVING COUNT(DISTINCT manufacturer) > 1
  LIMIT 20
`;

if (dupes.length === 0) {
  console.log('  ✅ 无重复型号（partNumber 是唯一键）');
} else {
  console.log(`  发现 ${dupes.length} 个重复型号:`);
  for (const d of dupes) {
    console.log(`  "${d.partNumber}" → ${d.manufacturers.join(', ')}`);
  }
}

// 4. Products with null/empty manufacturer
console.log('\n\n=== 4. 缺失厂商名的产品 ===\n');

const noMfr = await p.product.count({
  where: { OR: [{ manufacturer: null }, { manufacturer: '' }] }
});
console.log(`  ${noMfr === 0 ? '✅' : '⚠️'} ${noMfr} 个产品没有厂商名`);

// 5. Current manufacturer distribution (post-fix)
console.log('\n\n=== 5. 修正后厂商分布 Top 30 ===\n');

const top30 = await p.product.groupBy({
  by: ['manufacturer'],
  _count: { _all: true },
  orderBy: { _count: { manufacturer: 'desc' } },
  take: 30
});
for (const m of top30) {
  console.log(`  ${m._count._all.toString().padStart(7)} ${m.manufacturer}`);
}

// 6. Check "Analog Devices Inc./Maxim Integrated" still exists  
console.log('\n\n=== 6. 需要清理的复合厂商名 ===\n');

const compoundNames = await p.product.groupBy({
  by: ['manufacturer'],
  _count: { _all: true },
  having: { manufacturer: { _count: { gt: 0 } } },
  orderBy: { _count: { manufacturer: 'desc' } }
});

const ugly = compoundNames.filter(m => 
  m.manufacturer && (
    m.manufacturer.includes('/') || 
    m.manufacturer.includes('®') || 
    m.manufacturer.includes('™') ||
    m.manufacturer.includes('(') ||
    m.manufacturer.length > 35
  )
);
if (ugly.length === 0) {
  console.log('  ✅ 无需清理的复合名称');
} else {
  for (const u of ugly) {
    console.log(`  ⚠️ "${u.manufacturer}" (${u._count._all} products)`);
  }
}

console.log('\n========================================');
console.log('  审计完成');
console.log('========================================\n');

await p.$disconnect();
