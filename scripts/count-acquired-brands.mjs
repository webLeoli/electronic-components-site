import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Altera part number prefixes (FPGA/CPLD)
const ALTERA_PREFIXES = ['EP', '5CS', '5CG', '5CE', '5A', '5S', '10M', '10CL', '10C', '10AT', '10AX', '10AS', 'EPM', 'EPC', 'MAX'];
// Atmel part number prefixes (MCU/Memory)
const ATMEL_PREFIXES = ['AT', 'ATMEGA', 'ATTINY', 'ATSAM', 'AT89', 'AT91', 'AT32', 'AT25', 'AT24', 'AT45'];
// Fairchild prefixes
const FAIRCHILD_PREFIXES = ['FAN', 'FDC', 'FDD', 'FDF', 'FDG', 'FDN', 'FDP', 'FDS', 'FDT', 'FDV', 'FDMS', 'FQP', 'FQD', 'FQPF', 'KA', 'LM'];
// Linear Tech prefixes  
const LT_PREFIXES = ['LT', 'LTC', 'LTM', 'LTP'];
// Intersil prefixes
const INTERSIL_PREFIXES = ['ISL', 'ICL', 'ICM', 'HIP', 'EL', 'X9'];
// Microsemi prefixes
const MICROSEMI_PREFIXES = ['A2F', 'A3P', 'APA', 'AX', 'IGLOO', 'ProASIC', 'RTG4', 'RTAX', 'SmartFusion'];
// Freescale prefixes
const FREESCALE_PREFIXES = ['MC9', 'MK', 'MCIMX', 'MPC', 'MCF', 'MC33', 'MC34', 'FRDM'];
// Spansion prefixes
const SPANSION_PREFIXES = ['S25FL', 'S29', 'S34', 'MB', 'CY15', 'FM25'];
// Dialog prefixes
const DIALOG_PREFIXES = ['DA', 'SLG'];
// IR prefixes
const IR_PREFIXES = ['IR', 'IRFP', 'IRFZ', 'IRF', 'IRLZ', 'IRS', 'AUIR'];

async function countByPrefix(manufacturer, prefixes, label) {
  let total = 0;
  for (const prefix of prefixes) {
    const count = await p.product.count({
      where: {
        manufacturer,
        partNumber: { startsWith: prefix }
      }
    });
    if (count > 0) total += count;
  }
  // Deduplicate (some prefixes overlap)
  const actualCount = await p.product.count({
    where: {
      manufacturer,
      OR: prefixes.map(pr => ({ partNumber: { startsWith: pr } }))
    }
  });
  console.log(`  ${label}: ${actualCount} products (within "${manufacturer}")`);
  return actualCount;
}

console.log('\n=== 被母公司吞并的品牌产品数量 ===\n');

const intelTotal = await p.product.count({ where: { manufacturer: 'Intel' } });
console.log(`Intel 总产品: ${intelTotal}`);
await countByPrefix('Intel', ALTERA_PREFIXES, 'Altera 系列');

const mcTotal = await p.product.count({ where: { manufacturer: 'Microchip' } });
console.log(`\nMicrochip 总产品: ${mcTotal}`);
await countByPrefix('Microchip', ATMEL_PREFIXES, 'Atmel 系列');

const onsemiTotal = await p.product.count({ where: { manufacturer: 'Onsemi' } });
console.log(`\nOnsemi 总产品: ${onsemiTotal}`);
await countByPrefix('Onsemi', FAIRCHILD_PREFIXES, 'Fairchild 系列');

const adiTotal = await p.product.count({ where: { manufacturer: { in: ['Analog Devices Inc.', 'Analog Devices Inc./Maxim Integrated'] } } });
console.log(`\nAnalog Devices 总产品: ${adiTotal}`);
await countByPrefix('Analog Devices Inc.', LT_PREFIXES, 'Linear Tech (ADI)');
await countByPrefix('Analog Devices Inc./Maxim Integrated', LT_PREFIXES, 'Linear Tech (ADI/Maxim)');

const renTotal = await p.product.count({ where: { manufacturer: 'Renesas' } });
console.log(`\nRenesas 总产品: ${renTotal}`);
await countByPrefix('Renesas', INTERSIL_PREFIXES, 'Intersil 系列');
await countByPrefix('Renesas', DIALOG_PREFIXES, 'Dialog 系列');

const infTotal = await p.product.count({ where: { manufacturer: { in: ['Infineon Technologies', 'Infineon'] } } });
console.log(`\nInfineon 总产品: ${infTotal}`);
await countByPrefix('Infineon Technologies', IR_PREFIXES, 'IR 系列');

await p.$disconnect();
