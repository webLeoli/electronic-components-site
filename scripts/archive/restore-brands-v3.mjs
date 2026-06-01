import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');
console.log(DRY_RUN ? '🔍 DRY RUN\n' : '⚡ LIVE MODE\n');

let total = 0;

async function fix(where, data, label) {
  const count = await p.product.count({ where });
  if (count === 0) return;
  if (!DRY_RUN) {
    await p.product.updateMany({ where, data });
  }
  total += count;
  console.log(`${DRY_RUN ? '📋' : '✅'} ${label}: ${count}`);
}

// ============================================================
// GROUP 1: Remaining Intel → Altera
// ============================================================
console.log('--- Intel → Altera ---');
for (const prefix of ['EPXA', '5M1', '5M2', '5M4', '5M5', '5M8', '1SD', 'MPF10K']) {
  await fix(
    { manufacturer: 'Intel', partNumber: { startsWith: prefix } },
    { manufacturer: 'Altera' },
    `Intel(${prefix}) → Altera`
  );
}

// ============================================================
// GROUP 2: AMD / Xilinx → Xilinx
// ============================================================
console.log('\n--- AMD / Xilinx → Xilinx ---');
await fix(
  { manufacturer: 'AMD / Xilinx' },
  { manufacturer: 'Xilinx' },
  'AMD / Xilinx → Xilinx'
);

// ============================================================
// GROUP 3: Analog Devices Inc./Maxim Integrated — split by prefix
// ============================================================
console.log('\n--- Analog Devices Inc./Maxim Integrated 拆分 ---');
// 71M, 596 prefixes → keep as ADI/Maxim? No — 71M is Maxim (energy metering)
// 203, 234 prefixes → Maxim (LED drivers)
// Everything remaining → Analog Devices
await fix(
  { manufacturer: 'Analog Devices Inc./Maxim Integrated', partNumber: { startsWith: '71M' } },
  { manufacturer: 'Maxim Integrated' },
  'ADI/Maxim(71M) → Maxim'
);
await fix(
  { manufacturer: 'Analog Devices Inc./Maxim Integrated', partNumber: { startsWith: '203' } },
  { manufacturer: 'Maxim Integrated' },
  'ADI/Maxim(203) → Maxim'
);
await fix(
  { manufacturer: 'Analog Devices Inc./Maxim Integrated', partNumber: { startsWith: '234' } },
  { manufacturer: 'Maxim Integrated' },
  'ADI/Maxim(234) → Maxim'
);
// 596 series - check what these are
const sample596 = await p.product.findMany({
  where: { manufacturer: 'Analog Devices Inc./Maxim Integrated', partNumber: { startsWith: '596' } },
  select: { partNumber: true, description: true },
  take: 3
});
if (sample596.length > 0) {
  console.log(`  596 samples: ${sample596.map(s => `${s.partNumber}(${s.description?.substring(0,30)||''})`).join(', ')}`);
}
// Everything else in ADI/Maxim → Analog Devices
await fix(
  { manufacturer: 'Analog Devices Inc./Maxim Integrated' },
  { manufacturer: 'Analog Devices' },
  'ADI/Maxim(remaining) → Analog Devices'
);

// ============================================================
// GROUP 4: Clean up ®/™ suffixes
// ============================================================
console.log('\n--- 清理 ® ™ 后缀 ---');
await fix({ manufacturer: 'ISSI®' }, { manufacturer: 'ISSI' }, 'ISSI® → ISSI');
await fix({ manufacturer: 'Macom®' }, { manufacturer: 'MACOM' }, 'Macom® → MACOM');
await fix({ manufacturer: 'Spansion®' }, { manufacturer: 'Spansion' }, 'Spansion® → Spansion');
await fix({ manufacturer: 'MoSys™' }, { manufacturer: 'MoSys' }, 'MoSys™ → MoSys');
await fix({ manufacturer: 'Moxa®' }, { manufacturer: 'Moxa' }, 'Moxa® → Moxa');
await fix({ manufacturer: 'Mornsun®' }, { manufacturer: 'Mornsun' }, 'Mornsun® → Mornsun');
await fix({ manufacturer: 'TI Burr-Brown™' }, { manufacturer: 'Burr-Brown' }, 'TI Burr-Brown™ → Burr-Brown');
await fix({ manufacturer: 'AIRPAX / Sensata' }, { manufacturer: 'Sensata Technologies' }, 'AIRPAX / Sensata → Sensata');

// ============================================================
// GROUP 5: Clean up legal suffixes / verbose names
// ============================================================
console.log('\n--- 清理法律后缀 ---');
await fix({ manufacturer: 'Microsemi Corporation' }, { manufacturer: 'Microsemi' }, 'Microsemi Corporation → Microsemi');
await fix({ manufacturer: 'Intersil Corporation' }, { manufacturer: 'Intersil' }, 'Intersil Corporation → Intersil');
await fix({ manufacturer: 'LSI Computer Systems, Inc. (LSI/CSI)' }, { manufacturer: 'LSI' }, 'LSI Computer Systems → LSI');
await fix({ manufacturer: 'LSI/CSI' }, { manufacturer: 'LSI' }, 'LSI/CSI → LSI');

// Also check for "Analog Devices Inc." → "Analog Devices"
// Keep as-is since it's a common format, but let's standardize
await fix({ manufacturer: 'Analog Devices Inc.' }, { manufacturer: 'Analog Devices' }, 'Analog Devices Inc. → Analog Devices');

// ============================================================
// GROUP 6: Flip Electronics & Waldom → restore original brand for Cypress parts
// These are small distributors, and having CY8C products under "Flip Electronics" 
// creates wrong URLs (/product/flip-electronics/CY8C...). Fix these.
// ============================================================
console.log('\n--- 分销商 Cypress 产品修正 ---');
await fix(
  { manufacturer: 'Flip Electronics', partNumber: { startsWith: 'CY' } },
  { manufacturer: 'Cypress Semiconductor' },
  'Flip(CY) → Cypress'
);
await fix(
  { manufacturer: 'Waldom Electronics', partNumber: { startsWith: 'CY' } },
  { manufacturer: 'Cypress Semiconductor' },
  'Waldom(CY) → Cypress'
);

// Waldom also has some Xilinx parts
await fix(
  { manufacturer: 'Waldom Electronics', partNumber: { startsWith: 'XC' } },
  { manufacturer: 'Xilinx' },
  'Waldom(XC) → Xilinx'
);
await fix(
  { manufacturer: 'Waldom Electronics', partNumber: { startsWith: 'XCV' } },
  { manufacturer: 'Xilinx' },
  'Waldom(XCV) → Xilinx'
);

// Waldom IDT parts
await fix(
  { manufacturer: 'Waldom Electronics', partNumber: { startsWith: '89H' } },
  { manufacturer: 'IDT' },
  'Waldom(89H) → IDT'
);

// Flip Electronics Xilinx parts
await fix(
  { manufacturer: 'Flip Electronics', partNumber: { startsWith: 'XC' } },
  { manufacturer: 'Xilinx' },
  'Flip(XC) → Xilinx'
);

// Critical Link has Altera SoC modules
await fix(
  { manufacturer: 'Critical Link, LLC', partNumber: { startsWith: '5CS' } },
  { manufacturer: 'Altera' },
  'Critical Link(5CS) → Altera'
);

console.log(`\n${'='.repeat(50)}`);
console.log(`${DRY_RUN ? 'Would fix' : 'Fixed'}: ${total} products`);
console.log('='.repeat(50));

await p.$disconnect();
