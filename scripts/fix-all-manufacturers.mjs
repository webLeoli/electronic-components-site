#!/usr/bin/env node
/**
 * 一键厂商数据修复脚本
 * 合并全部 6 轮修复，生产环境只需运行这一个脚本
 * 
 * 用法: node scripts/fix-all-manufacturers.mjs [--dry-run]
 */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const DRY = process.argv.includes('--dry-run');
console.log('='.repeat(70));
console.log('  FPGACenter 厂商数据一键修复');
console.log('  模式:', DRY ? '🔍 预览' : '⚡ 执行');
console.log('='.repeat(70) + '\n');

let totalMfr = 0, totalDesc = 0;

// ── helpers ─────────────────────────────────────────────────
async function fixMfr(where, data, label) {
  const c = await p.product.count({ where });
  if (!c) return;
  if (!DRY) await p.product.updateMany({ where, data });
  totalMfr += c;
  console.log(`  ✅ ${label}: ${c}`);
}

async function fixDescBatch(mfr, oldText, newText) {
  const rows = await p.product.findMany({
    where: { manufacturer: mfr, description: { contains: oldText } },
    select: { id: true, description: true },
  });
  if (!rows.length) return 0;
  if (!DRY) {
    for (const r of rows) {
      const d = r.description.replace(oldText, newText);
      if (d !== r.description) await p.product.update({ where: { id: r.id }, data: { description: d } });
    }
  }
  totalDesc += rows.length;
  return rows.length;
}

// ═══════════════════════════════════════════════════════════
// PART 1: 厂商字段修正 (manufacturer field)
// ═══════════════════════════════════════════════════════════
console.log('━━━ PART 1: 厂商字段修正 ━━━\n');

// --- 1A: Intel → Altera ---
console.log('[Intel → Altera]');
for (const pfx of [
  'EP1','EP2','EP3','EP4','EPM','EPC','EPF','EPXA',
  '5CS','5CG','5CE','5CB','5A','5S','5M',
  '10M0','10M1','10M2','10M4','10M5','10M8','10CL','10CX','10AT','10AX','10AS',
  '1SG','1SM','1SX','1ST','1SD',
  'AGFB','AGIB','AGF0','AGI0','AGM0',
  'MPF10K','MPF82','MPF84','MPF86','MPF88','MPM',
  'ARRIA','FLIX','XC40200XV',
]) {
  if (pfx === 'XC40200XV') {
    await fixMfr({ manufacturer: 'Intel', partNumber: pfx }, { manufacturer: 'Altera' }, `Intel(${pfx})→Altera`);
  } else {
    await fixMfr({ manufacturer: 'Intel', partNumber: { startsWith: pfx } }, { manufacturer: 'Altera' }, `Intel(${pfx})→Altera`);
  }
}
// Also fix Altera XC40 → Xilinx
await fixMfr({ manufacturer: 'Altera', partNumber: { startsWith: 'XC40' } }, { manufacturer: 'Xilinx' }, 'Altera(XC40)→Xilinx');

// --- 1B: Microchip → Atmel ---
console.log('\n[Microchip → Atmel]');
for (const pfx of ['ATMEGA','ATTINY','ATXMEGA','ATSAM','AT89','AT90','AT91','AT24','AT25','AT26','AT27','AT28','AT29','AT32','AT43','AT45','AT49','AT73','AT76','AT86','AT97','AT17','ATA','ATECC','ATSHA','ATUC']) {
  await fixMfr({ manufacturer: 'Microchip', partNumber: { startsWith: pfx } }, { manufacturer: 'Atmel' }, `Microchip(${pfx})→Atmel`);
}

// --- 1C: Analog Devices → Linear Technology ---
console.log('\n[ADI → Linear Technology]');
for (const pfx of ['LTC','LTM','LTP','LT1','LT3','LT4','LT6','LT8']) {
  await fixMfr({ manufacturer: 'Analog Devices', partNumber: { startsWith: pfx } }, { manufacturer: 'Linear Technology' }, `ADI(${pfx})→LT`);
  await fixMfr({ manufacturer: 'Analog Devices Inc.', partNumber: { startsWith: pfx } }, { manufacturer: 'Linear Technology' }, `ADI Inc(${pfx})→LT`);
}

// --- 1D: Analog Devices → Maxim Integrated ---
console.log('\n[ADI → Maxim Integrated]');
for (const pfx of ['MAX','DS1','DS2','DS3','DS4','DS9','71M','203','234']) {
  await fixMfr({ manufacturer: 'Analog Devices', partNumber: { startsWith: pfx } }, { manufacturer: 'Maxim Integrated' }, `ADI(${pfx})→Maxim`);
  await fixMfr({ manufacturer: 'Analog Devices Inc.', partNumber: { startsWith: pfx } }, { manufacturer: 'Maxim Integrated' }, `ADI Inc(${pfx})→Maxim`);
}

// --- 1E: ADI/Maxim compound → split ---
console.log('\n[ADI/Maxim → split]');
await fixMfr({ manufacturer: 'Analog Devices Inc./Maxim Integrated', partNumber: { startsWith: '71M' } }, { manufacturer: 'Maxim Integrated' }, 'ADI/Maxim(71M)→Maxim');
await fixMfr({ manufacturer: 'Analog Devices Inc./Maxim Integrated', partNumber: { startsWith: '203' } }, { manufacturer: 'Maxim Integrated' }, 'ADI/Maxim(203)→Maxim');
await fixMfr({ manufacturer: 'Analog Devices Inc./Maxim Integrated', partNumber: { startsWith: '234' } }, { manufacturer: 'Maxim Integrated' }, 'ADI/Maxim(234)→Maxim');
await fixMfr({ manufacturer: 'Analog Devices Inc./Maxim Integrated' }, { manufacturer: 'Analog Devices' }, 'ADI/Maxim(rest)→ADI');

// --- 1F: Renesas → Intersil ---
console.log('\n[Renesas → Intersil]');
for (const pfx of ['ISL','ICL','EL1','EL2','EL4','EL5','EL7','HIP','CD22','HS-','HS0','HS1','HS2','HS4','HS9']) {
  await fixMfr({ manufacturer: 'Renesas', partNumber: { startsWith: pfx } }, { manufacturer: 'Intersil' }, `Renesas(${pfx})→Intersil`);
}

// --- 1G: Renesas → IDT ---
console.log('\n[Renesas → IDT]');
for (const pfx of ['IDT','8V49','8V89','8V97','8V19','8V31','8V3']) {
  await fixMfr({ manufacturer: 'Renesas', partNumber: { startsWith: pfx } }, { manufacturer: 'IDT' }, `Renesas(${pfx})→IDT`);
}

// --- 1H: Infineon → Cypress ---
console.log('\n[Infineon → Cypress]');
for (const pfx of ['CY8C','CY7C','CY14','CY15','CY62','CY22','CY23','CY27','CYBL','CYPD','CYW4','CYW2','FM25','FM24','FM22']) {
  await fixMfr({ manufacturer: 'Infineon Technologies', partNumber: { startsWith: pfx } }, { manufacturer: 'Cypress Semiconductor' }, `Infineon(${pfx})→Cypress`);
}

// --- 1I: Infineon → Spansion ---
console.log('\n[Infineon → Spansion]');
for (const pfx of ['S25FL','S29','S34ML']) {
  await fixMfr({ manufacturer: 'Infineon Technologies', partNumber: { startsWith: pfx } }, { manufacturer: 'Spansion' }, `Infineon(${pfx})→Spansion`);
  await fixMfr({ manufacturer: 'Infineon', partNumber: { startsWith: pfx } }, { manufacturer: 'Spansion' }, `Infineon(${pfx})→Spansion`);
}

// --- 1J: Infineon → International Rectifier ---
console.log('\n[Infineon → IR]');
for (const pfx of ['IRFP','IRFZ','IRFB','IRFS','IRFI','IRFU','IRLZ','IRLB','IRS2','IR21','IR22','IR33','IR38','AUIR']) {
  await fixMfr({ manufacturer: 'Infineon Technologies', partNumber: { startsWith: pfx } }, { manufacturer: 'International Rectifier' }, `Infineon(${pfx})→IR`);
  await fixMfr({ manufacturer: 'Infineon', partNumber: { startsWith: pfx } }, { manufacturer: 'International Rectifier' }, `Infineon(${pfx})→IR`);
}

// --- 1K: Infineon → Intersil (ICL) ---
await fixMfr({ manufacturer: 'Infineon Technologies', partNumber: { startsWith: 'ICL' } }, { manufacturer: 'Intersil' }, 'Infineon(ICL)→Intersil');

// --- 1L: Onsemi → Fairchild ---
console.log('\n[Onsemi → Fairchild]');
for (const pfx of ['FAN','FDC','FDD','FDF','FDG','FDN','FDP','FDS','FDT','FDV','FDY','FDMS','FDMC','FQP','FQA','FQPF','KA7','KA3','KA2']) {
  await fixMfr({ manufacturer: 'Onsemi', partNumber: { startsWith: pfx } }, { manufacturer: 'Fairchild Semiconductor' }, `Onsemi(${pfx})→Fairchild`);
}

// --- 1M: AMD / Xilinx → Xilinx ---
console.log('\n[Compound names]');
await fixMfr({ manufacturer: 'AMD / Xilinx' }, { manufacturer: 'Xilinx' }, 'AMD/Xilinx→Xilinx');

// --- 1N: Dialog → Atmel (Serial Flash) ---
console.log('\n[Dialog → Atmel]');
for (const pfx of ['AT25','AT45','AT26']) {
  await fixMfr({ manufacturer: 'Dialog Semiconductor', partNumber: { startsWith: pfx } }, { manufacturer: 'Atmel' }, `Dialog(${pfx})→Atmel`);
}
// Renesas AT25 → Atmel
await fixMfr({ manufacturer: 'Renesas', partNumber: { startsWith: 'AT25' } }, { manufacturer: 'Atmel' }, 'Renesas(AT25)→Atmel');

// --- 1O: Analog Devices ICL → Intersil ---
await fixMfr({ manufacturer: 'Analog Devices', partNumber: { startsWith: 'ICL' } }, { manufacturer: 'Intersil' }, 'ADI(ICL)→Intersil');

// --- 1P: Nexperia → Spansion ---
for (const pfx of ['S25FL','S29']) {
  await fixMfr({ manufacturer: 'Nexperia', partNumber: { startsWith: pfx } }, { manufacturer: 'Spansion' }, `Nexperia(${pfx})→Spansion`);
}

// --- 1Q: Motorola → Freescale ---
await fixMfr({ manufacturer: 'Motorola, Inc.', partNumber: { startsWith: 'MC9S' } }, { manufacturer: 'Freescale Semiconductor' }, 'Motorola(MC9S)→Freescale');

// --- 1R: Flip/Waldom → original brands ---
console.log('\n[Distributor → Brand]');
await fixMfr({ manufacturer: 'Flip Electronics', partNumber: { startsWith: 'CY' } }, { manufacturer: 'Cypress Semiconductor' }, 'Flip(CY)→Cypress');
await fixMfr({ manufacturer: 'Waldom Electronics', partNumber: { startsWith: 'CY' } }, { manufacturer: 'Cypress Semiconductor' }, 'Waldom(CY)→Cypress');
await fixMfr({ manufacturer: 'Waldom Electronics', partNumber: { startsWith: 'XC' } }, { manufacturer: 'Xilinx' }, 'Waldom(XC)→Xilinx');
await fixMfr({ manufacturer: 'Waldom Electronics', partNumber: { startsWith: '89H' } }, { manufacturer: 'IDT' }, 'Waldom(89H)→IDT');
await fixMfr({ manufacturer: 'Flip Electronics', partNumber: { startsWith: 'XC' } }, { manufacturer: 'Xilinx' }, 'Flip(XC)→Xilinx');
await fixMfr({ manufacturer: 'Critical Link, LLC', partNumber: { startsWith: '5CS' } }, { manufacturer: 'Altera' }, 'CriticalLink(5CS)→Altera');

// --- 1S: Clean special chars & legal suffixes ---
console.log('\n[Name cleanup]');
const nameCleanups = [
  ['ISSI®', 'ISSI'], ['Macom®', 'MACOM'], ['Spansion®', 'Spansion'],
  ['MoSys™', 'MoSys'], ['Moxa®', 'Moxa'], ['Mornsun®', 'Mornsun'],
  ['TI Burr-Brown™', 'Burr-Brown'], ['AIRPAX / Sensata', 'Sensata Technologies'],
  ['Microsemi Corporation', 'Microsemi'], ['Intersil Corporation', 'Intersil'],
  ['LSI Computer Systems, Inc. (LSI/CSI)', 'LSI'], ['LSI/CSI', 'LSI'],
  ['Analog Devices Inc.', 'Analog Devices'],
  ['Lattice Semiconductor Corporation', 'Lattice Semiconductor'], ['Lattice', 'Lattice Semiconductor'],
  ['Asahi Kasei Microdevices(AKM)', 'AKM Semiconductor'],
  ['Digi International Inc. (Digi)', 'Digi International'],
  ['Nexperia Energy Harvesting Solutions(Nowi)', 'Nexperia'],
  ['System-On-Chip (SOC) Technologies', 'SOC Technologies'],
  ['Azoteq (Pty) Ltd.', 'Azoteq'],
  ['International Rectifier(IR)', 'International Rectifier'],
  ['HY Electronic (Cayman) Limited', 'HY Electronic'],
  ['Standard Microsystems(SMSC)', 'SMSC'],
  ['Broadcom', 'Broadcom Limited'],
  ['Digi International, Inc.', 'Digi International'],
  ['MYIR Tech Limited', 'MYIR Tech'],
  ['Lantronix, Inc.', 'Lantronix'],
  ['Astera Labs, Inc.', 'Astera Labs'],
  ['Infineon', 'Infineon Technologies'],
  ['Harris Semiconductor', 'Intersil'],
];
for (const [from, to] of nameCleanups) {
  await fixMfr({ manufacturer: from }, { manufacturer: to }, `"${from}"→"${to}"`);
}

console.log(`\n  厂商字段修正合计: ${totalMfr.toLocaleString()}\n`);

// ═══════════════════════════════════════════════════════════
// PART 2: 产品描述修正
// ═══════════════════════════════════════════════════════════
console.log('━━━ PART 2: 描述文字修正 ━━━\n');

const DESC_RULES = [
  // [manufacturer, oldText, newText]
  ['Altera', 'by Intel,', 'by Altera,'], ['Altera', 'by Intel ', 'by Altera '], ['Altera', 'by Intel.', 'by Altera.'],
  ['Atmel', 'by Microchip,', 'by Atmel,'], ['Atmel', 'by Microchip ', 'by Atmel '], ['Atmel', 'by Microchip.', 'by Atmel.'],
  ['Linear Technology', 'by Analog Devices Inc.,', 'by Linear Technology,'], ['Linear Technology', 'by Analog Devices Inc. ', 'by Linear Technology '],
  ['Linear Technology', 'by Analog Devices Inc..', 'by Linear Technology.'], ['Linear Technology', 'by Analog Devices Inc./', 'by Linear Technology/'],
  ['Maxim Integrated', 'by Analog Devices Inc./Maxim Integrated', 'by Maxim Integrated'],
  ['Maxim Integrated', 'by Analog Devices Inc.,', 'by Maxim Integrated,'], ['Maxim Integrated', 'by Analog Devices Inc. ', 'by Maxim Integrated '],
  ['Xilinx', 'by AMD / Xilinx,', 'by Xilinx,'], ['Xilinx', 'by AMD / Xilinx ', 'by Xilinx '], ['Xilinx', 'by AMD / Xilinx.', 'by Xilinx.'], ['Xilinx', 'by AMD / Xilinx', 'by Xilinx'],
  ['Cypress Semiconductor', 'by Infineon Technologies,', 'by Cypress Semiconductor,'], ['Cypress Semiconductor', 'by Infineon Technologies ', 'by Cypress Semiconductor '], ['Cypress Semiconductor', 'by Infineon Technologies.', 'by Cypress Semiconductor.'],
  ['Spansion', 'by Infineon Technologies,', 'by Spansion,'], ['Spansion', 'by Infineon Technologies ', 'by Spansion '],
  ['Spansion', 'by Infineon,', 'by Spansion,'], ['Spansion', 'by Infineon ', 'by Spansion '],
  ['Spansion', 'by Cypress Semiconductor,', 'by Spansion,'], ['Spansion', 'by Cypress Semiconductor.', 'by Spansion.'], ['Spansion', 'by Cypress Semiconductor ', 'by Spansion '],
  ['Spansion', 'by Spansion®', 'by Spansion'],
  ['Intersil', 'by Renesas,', 'by Intersil,'], ['Intersil', 'by Renesas ', 'by Intersil '], ['Intersil', 'by Renesas.', 'by Intersil.'],
  ['Intersil', 'by Analog Devices Inc.,', 'by Intersil,'], ['Intersil', 'by Analog Devices Inc. ', 'by Intersil '], ['Intersil', 'by Analog Devices Inc./', 'by Intersil/'],
  ['Intersil', 'by Harris Semiconductor,', 'by Intersil,'], ['Intersil', 'by Harris Semiconductor ', 'by Intersil '], ['Intersil', 'by Harris Semiconductor.', 'by Intersil.'],
  ['Intersil', 'by Intersil Corporation,', 'by Intersil,'], ['Intersil', 'by Intersil Corporation ', 'by Intersil '],
  ['Fairchild Semiconductor', 'by Onsemi,', 'by Fairchild Semiconductor,'], ['Fairchild Semiconductor', 'by Onsemi ', 'by Fairchild Semiconductor '], ['Fairchild Semiconductor', 'by Onsemi.', 'by Fairchild Semiconductor.'],
  ['International Rectifier', 'by Infineon Technologies,', 'by International Rectifier,'], ['International Rectifier', 'by Infineon Technologies ', 'by International Rectifier '],
  ['International Rectifier', 'by Infineon,', 'by International Rectifier,'], ['International Rectifier', 'by Infineon ', 'by International Rectifier '],
  ['IDT', 'by Renesas,', 'by IDT,'], ['IDT', 'by Renesas ', 'by IDT '], ['IDT', 'by Renesas.', 'by IDT.'],
  ['IDT', 'by Waldom Electronics,', 'by IDT,'], ['IDT', 'by Waldom Electronics ', 'by IDT '],
  ['Microsemi', 'by Microchip,', 'by Microsemi,'], ['Microsemi', 'by Microchip ', 'by Microsemi '], ['Microsemi', 'by Microchip.', 'by Microsemi.'],
  ['Microsemi', 'by Microsemi Corporation,', 'by Microsemi,'], ['Microsemi', 'by Microsemi Corporation ', 'by Microsemi '],
  ['Lattice Semiconductor', 'by Lattice Semiconductor Corporation,', 'by Lattice Semiconductor,'],
  ['Lattice Semiconductor', 'by Lattice Semiconductor Corporation ', 'by Lattice Semiconductor '],
  ['Lattice Semiconductor', 'by Lattice Semiconductor Corporation.', 'by Lattice Semiconductor.'],
  ['Analog Devices', 'by Analog Devices Inc..', 'by Analog Devices.'],
  ['Analog Devices', 'by Analog Devices Inc.,', 'by Analog Devices,'],
  ['Analog Devices', 'by Analog Devices Inc. ', 'by Analog Devices '],
  ['Analog Devices', 'by Analog Devices Inc./', 'by Analog Devices/'],
  ['Cypress Semiconductor', 'by Waldom Electronics,', 'by Cypress Semiconductor,'],
  ['Xilinx', 'by Waldom Electronics,', 'by Xilinx,'],
];

for (const [mfr, old, rep] of DESC_RULES) {
  const n = await fixDescBatch(mfr, old, rep);
  if (n > 0) console.log(`  ✅ ${mfr}: "${old}" → "${rep}": ${n}`);
}

console.log(`\n  描述修正合计: ${totalDesc.toLocaleString()}\n`);

// ═══════════════════════════════════════════════════════════
// PART 3: Manufacturer 表同步
// ═══════════════════════════════════════════════════════════
console.log('━━━ PART 3: Manufacturer 表同步 ━━━\n');

if (!DRY) {
  const slugify = n => n.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const brands = ['Spansion','Intersil','IDT','ISSI','AKM Semiconductor','MACOM','SOC Technologies',
    'LSI','MoSys','Burr-Brown','Moxa','HY Electronic','SMSC','Sensata Technologies','Mornsun','Digi International'];
  for (const name of brands) {
    const slug = slugify(name);
    const cnt = await p.product.count({ where: { manufacturer: name } });
    if (cnt === 0) continue;
    const exists = await p.manufacturer.findFirst({ where: { OR: [{ name }, { slug }] } });
    if (!exists) {
      try { await p.manufacturer.create({ data: { name, slug } }); console.log(`  ✅ 新增: ${name}`); } catch {}
    } else if (exists.name !== name) {
      await p.manufacturer.update({ where: { id: exists.id }, data: { name } });
      console.log(`  ✅ 更新: ${exists.name} → ${name}`);
    }
  }
  // Slug fixes
  for (const [name, slug] of [['Alpha & Omega Semiconductor','alpha-and-omega-semiconductor'],['B&K Precision','bandk-precision'],['Omron Automation & Safety','omron-automation-and-safety']]) {
    await p.manufacturer.updateMany({ where: { name }, data: { slug } });
  }
  // Clean stale
  for (const name of ['Intel/Altera','Winbond','Skyworks','Actel','Freescale','Nuvoton','SST','Infineon','Broadcom',
    'Asahi Kasei Microdevices(AKM)','International Rectifier(IR)','Nexperia Energy Harvesting Solutions(Nowi)','Standard Microsystems(SMSC)']) {
    const cnt = await p.product.count({ where: { manufacturer: name } });
    if (cnt === 0) { const d = await p.manufacturer.deleteMany({ where: { name } }); if (d.count) console.log(`  🗑️ 删除: ${name}`); }
  }
}

// ═══════════════════════════════════════════════════════════
// DONE
// ═══════════════════════════════════════════════════════════
console.log('\n' + '='.repeat(70));
console.log(`  完成! 厂商修正: ${totalMfr.toLocaleString()} | 描述修正: ${totalDesc.toLocaleString()}`);
console.log('='.repeat(70));
await p.$disconnect();
