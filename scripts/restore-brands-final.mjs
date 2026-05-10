import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');
console.log(DRY_RUN ? '🔍 DRY RUN\n' : '⚡ LIVE MODE\n');

let total = 0;
async function fix(where, data, label) {
  const count = await p.product.count({ where });
  if (count === 0) return;
  if (!DRY_RUN) await p.product.updateMany({ where, data });
  total += count;
  console.log(`${DRY_RUN ? '📋' : '✅'} ${label}: ${count}`);
}

// ============================================================
// GROUP 1: "Lattice Semiconductor Corporation" → "Lattice Semiconductor"
// ============================================================
console.log('--- Lattice 标准化 ---');
await fix(
  { manufacturer: 'Lattice Semiconductor Corporation' },
  { manufacturer: 'Lattice Semiconductor' },
  'Lattice Semiconductor Corporation → Lattice Semiconductor'
);
await fix(
  { manufacturer: 'Lattice' },
  { manufacturer: 'Lattice Semiconductor' },
  'Lattice → Lattice Semiconductor'
);

// ============================================================
// GROUP 2: Dialog Semiconductor 有 Atmel 产品 (AT25/AT45/AT26)
// Dialog 在 2016 年收购了 Atmel 的一些产品线 (Serial Flash)
// 但采购中这些仍然叫 "Atmel" 型号
// ============================================================
console.log('\n--- Dialog → Atmel (Serial Flash) ---');
for (const prefix of ['AT25', 'AT45', 'AT26']) {
  await fix(
    { manufacturer: 'Dialog Semiconductor', partNumber: { startsWith: prefix } },
    { manufacturer: 'Atmel' },
    `Dialog(${prefix}) → Atmel`
  );
}

// ============================================================
// GROUP 3: Analog Devices 有 Intersil (ICL) 产品
// ADI 在 2017 年收购了 Intersil 的产品，ICL 系列仍应归 Intersil
// ============================================================
console.log('\n--- Analog Devices → Intersil ---');
await fix(
  { manufacturer: 'Analog Devices', partNumber: { startsWith: 'ICL' } },
  { manufacturer: 'Intersil' },
  'ADI(ICL) → Intersil'
);

// ============================================================
// GROUP 4: Infineon 有 Spansion (S25FL/S29) 产品
// Infineon 收购了 Cypress（Cypress 之前收购了 Spansion）
// S25FL/S29 系列在采购中仍然是 Spansion 品牌
// ============================================================
console.log('\n--- Infineon → Spansion ---');
await fix(
  { manufacturer: 'Infineon Technologies', partNumber: { startsWith: 'S25FL' } },
  { manufacturer: 'Spansion' },
  'Infineon(S25FL) → Spansion'
);
await fix(
  { manufacturer: 'Infineon Technologies', partNumber: { startsWith: 'S29' } },
  { manufacturer: 'Spansion' },
  'Infineon(S29) → Spansion'
);
// Also "Infineon" (without Technologies)
await fix(
  { manufacturer: 'Infineon', partNumber: { startsWith: 'S25FL' } },
  { manufacturer: 'Spansion' },
  'Infineon(S25FL) → Spansion'
);
await fix(
  { manufacturer: 'Infineon', partNumber: { startsWith: 'S29' } },
  { manufacturer: 'Spansion' },
  'Infineon(S29) → Spansion'
);

// Infineon has Intersil ICL products too
await fix(
  { manufacturer: 'Infineon Technologies', partNumber: { startsWith: 'ICL' } },
  { manufacturer: 'Intersil' },
  'Infineon(ICL) → Intersil'
);

// Infineon has AT89 (actually Infineon's own AT899x pressure sensors, NOT Atmel)
// Confirmed: AT89xx from Infineon = Infineon pressure sensors → KEEP

// Infineon has IR products
await fix(
  { manufacturer: 'Infineon', partNumber: { startsWith: 'IRFP' } },
  { manufacturer: 'International Rectifier' },
  'Infineon(IRFP) → IR'
);
await fix(
  { manufacturer: 'Infineon', partNumber: { startsWith: 'IRFZ' } },
  { manufacturer: 'International Rectifier' },
  'Infineon(IRFZ) → IR'
);
await fix(
  { manufacturer: 'Infineon', partNumber: { startsWith: 'IR21' } },
  { manufacturer: 'International Rectifier' },
  'Infineon(IR21) → IR'
);

// ============================================================
// GROUP 5: Renesas 有 AT25 (Atmel Serial Flash, came via Dialog acquisition)
// ============================================================
console.log('\n--- Renesas → Atmel ---');
await fix(
  { manufacturer: 'Renesas', partNumber: { startsWith: 'AT25' } },
  { manufacturer: 'Atmel' },
  'Renesas(AT25) → Atmel'
);

// Renesas MK series — these are actually Renesas's OWN products (clock/timing ICs)
// MK2712, MK2703 = Renesas clock generators → KEEP
// Renesas MPC9109 = Renesas clock buffers → KEEP (NOT Freescale MPC PowerPC)

// ============================================================
// GROUP 6: Duplicate manufacturer name consolidation
// ============================================================
console.log('\n--- 重复厂商名合并 ---');
await fix({ manufacturer: 'Broadcom' }, { manufacturer: 'Broadcom Limited' }, 'Broadcom → Broadcom Limited');
await fix({ manufacturer: 'Digi International, Inc.' }, { manufacturer: 'Digi International' }, 'Digi Int Inc → Digi Int');
await fix({ manufacturer: 'MYIR Tech Limited' }, { manufacturer: 'MYIR Tech' }, 'MYIR Tech Limited → MYIR Tech');
await fix({ manufacturer: 'Lantronix, Inc.' }, { manufacturer: 'Lantronix' }, 'Lantronix Inc → Lantronix');
await fix({ manufacturer: 'Astera Labs, Inc.' }, { manufacturer: 'Astera Labs' }, 'Astera Labs Inc → Astera Labs');
await fix({ manufacturer: 'Infineon' }, { manufacturer: 'Infineon Technologies' }, 'Infineon → Infineon Technologies');

// Harris Semiconductor = legacy Intersil (Harris acquired Intersil, then became Intersil)
await fix({ manufacturer: 'Harris Semiconductor' }, { manufacturer: 'Intersil' }, 'Harris Semi → Intersil');

// Nexperia has S25FL/S29 → these came via NXP split, should be Spansion
await fix(
  { manufacturer: 'Nexperia', partNumber: { startsWith: 'S25FL' } },
  { manufacturer: 'Spansion' },
  'Nexperia(S25FL) → Spansion'
);
await fix(
  { manufacturer: 'Nexperia', partNumber: { startsWith: 'S29' } },
  { manufacturer: 'Spansion' },
  'Nexperia(S29) → Spansion'
);

// Motorola MC9S → Freescale (Motorola spun off semiconductor as Freescale in 2004)
await fix(
  { manufacturer: 'Motorola, Inc.', partNumber: { startsWith: 'MC9S' } },
  { manufacturer: 'Freescale Semiconductor' },
  'Motorola(MC9S) → Freescale'
);

// Microchip FDC37 series → these are Microchip SMSC Super I/O chips, NOT Fairchild → KEEP
// TI DS90/DS100 series → these ARE TI's own LVDS/equalizer ICs → KEEP
// TI MAX232/MAX660 → TI's 2nd-source → KEEP (they make their own version)
// TI LT1016 → TI 2nd-source → KEEP
// Onsemi MAX803/MAX708/MAX809 → Onsemi 2nd-source → KEEP
// Microchip MAX3610/MAX9450 → Microchip's own RF/timing → KEEP
// Altera MPF10K → Already Altera, just happened to match Microsemi prefix rule → KEEP
// MPS MPM → MPS power modules, NOT Altera MAX Plus → KEEP (confirmed by product names)
// EPC (company) EPC21601 → GaN power transistors by EPC (Efficient Power Conversion) → KEEP
// TI FDC2114 → TI's own capacitive sensing ICs → KEEP
// Renesas MK → Renesas's own clock ICs → KEEP

// ============================================================
// GROUP 7: XC40200XV under Altera → actually Xilinx XC4000 family
// ============================================================
console.log('\n--- Altera XC40200 → Xilinx ---');
await fix(
  { manufacturer: 'Altera', partNumber: { startsWith: 'XC40' } },
  { manufacturer: 'Xilinx' },
  'Altera(XC40) → Xilinx'
);

// Cypress EP10-002165 → not Altera, it's Cypress connector → KEEP

// ============================================================
// GROUP 8: Sync Manufacturer table with new brand names
// ============================================================
console.log('\n--- 同步 Manufacturer 表 ---');
const newBrands = [
  'Spansion', 'Intersil', 'IDT', 'ISSI', 'AKM Semiconductor',
  'MACOM', 'SOC Technologies', 'LSI', 'MoSys', 'Burr-Brown',
  'Moxa', 'HY Electronic', 'SMSC', 'Sensata Technologies',
  'Azoteq', 'Mornsun',
];
for (const name of newBrands) {
  const slug = name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const exists = await p.manufacturer.findFirst({ where: { name } });
  if (!exists && !DRY_RUN) {
    const count = await p.product.count({ where: { manufacturer: name } });
    if (count > 0) {
      try {
        // Check by slug too
        const existsBySlug = await p.manufacturer.findFirst({ where: { slug } });
        if (existsBySlug) {
          // Update existing entry to use the new name
          await p.manufacturer.update({ where: { id: existsBySlug.id }, data: { name } });
          console.log(`✅ Manufacturer 表更新: "${existsBySlug.name}" → "${name}" (slug: ${slug}, ${count} products)`);
        } else {
          await p.manufacturer.create({ data: { name, slug } });
          console.log(`✅ Manufacturer 表新增: "${name}" (slug: ${slug}, ${count} products)`);
        }
      } catch(e) { console.log(`⚠️ Skip "${name}": ${e.message?.substring(0, 50)}`); }
    }
  } else if (!exists) {
    const count = await p.product.count({ where: { manufacturer: name } });
    if (count > 0) console.log(`📋 Would add to Manufacturer: "${name}" (${count} products)`);
  }
}

// Remove stale Manufacturer entries
const staleNames = [
  'Intel/Altera', 'Winbond', 'Skyworks', 'Actel', 'Freescale',
  'Nuvoton', 'SST',
];
for (const name of staleNames) {
  const count = await p.product.count({ where: { manufacturer: name } });
  if (count === 0 && !DRY_RUN) {
    const deleted = await p.manufacturer.deleteMany({ where: { name } });
    if (deleted.count > 0) console.log(`🗑️ Removed stale: "${name}"`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`${DRY_RUN ? 'Would fix' : 'Fixed'}: ${total} products`);
console.log('='.repeat(60));

await p.$disconnect();
