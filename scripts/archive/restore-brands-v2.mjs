import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');
console.log(DRY_RUN ? '🔍 DRY RUN\n' : '⚡ LIVE MODE\n');

// Additional brand restoration rules (missed in first pass)
const EXTRA_RULES = [
  // Altera: more prefixes we missed
  ['Intel', '1SM', 'Altera'],       // Stratix 10 MX
  ['Intel', '1SX', 'Altera'],       // Stratix 10 SX  
  ['Intel', '1ST', 'Altera'],       // Stratix 10 TX
  ['Intel', '2CG', 'Altera'],       // Agilex
  ['Intel', 'AGF', 'Altera'],       // Agilex F (broader than AGFB)
  ['Intel', 'AGI', 'Altera'],       // Agilex I (broader than AGIB)
  ['Intel', 'AGM', 'Altera'],       // Agilex M
  
  // Atmel: broader AT prefix for remaining Microchip→Atmel (but careful not to catch non-Atmel)
  ['Microchip', 'AT17', 'Atmel'],   // Configuration devices
  ['Microchip', 'AT26', 'Atmel'],   // SPI Flash
  ['Microchip', 'AT27', 'Atmel'],   // EPROM
  ['Microchip', 'AT28', 'Atmel'],   // EEPROM
  ['Microchip', 'AT29', 'Atmel'],   // Flash
  ['Microchip', 'AT43', 'Atmel'],   // USB
  ['Microchip', 'AT49', 'Atmel'],   // Flash
  ['Microchip', 'AT73', 'Atmel'],   // Mixed signal
  ['Microchip', 'AT76', 'Atmel'],   // Wireless
  ['Microchip', 'AT97', 'Atmel'],   // Multimedia
  ['Microchip', 'ATUC', 'Atmel'],   // UCxx MCUs
  ['Microchip', 'ATWIL', 'Atmel'],  // Wireless
  ['Microchip', 'ATAES', 'Atmel'],  // Crypto
  
  // Fairchild: more FD prefixes
  ['Onsemi', 'FDP', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDS', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDT', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDV', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDN', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDMS', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDMC', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDC', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDD', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDF', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDG', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDY', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDZ', 'Fairchild Semiconductor'],
  ['Onsemi', 'FQA', 'Fairchild Semiconductor'],
  ['Onsemi', 'FQB', 'Fairchild Semiconductor'],
  
  // Cypress products under Infineon
  ['Infineon Technologies', 'CY8C', 'Cypress Semiconductor'],
  ['Infineon Technologies', 'CY7C', 'Cypress Semiconductor'],
  ['Infineon Technologies', 'CY14', 'Cypress Semiconductor'],
  ['Infineon Technologies', 'CY15', 'Cypress Semiconductor'],
  ['Infineon Technologies', 'CY62', 'Cypress Semiconductor'],
  ['Infineon Technologies', 'CY2', 'Cypress Semiconductor'],
  ['Infineon Technologies', 'CYBL', 'Cypress Semiconductor'],
  ['Infineon Technologies', 'CYPD', 'Cypress Semiconductor'],
  ['Infineon Technologies', 'CYW', 'Cypress Semiconductor'],
  ['Infineon Technologies', 'FM', 'Cypress Semiconductor'],
  
  // Flip Electronics & Waldom are distributors — keep their brand as-is
  // Rochester Electronics is an authorized distributor — keep as-is  
  // These are CORRECT because the distributor IS the source
];

let totalUpdated = 0;
const summary = {};

for (const [currentMfr, prefix, correctBrand] of EXTRA_RULES) {
  const count = await p.product.count({
    where: { manufacturer: currentMfr, partNumber: { startsWith: prefix } }
  });
  if (count === 0) continue;

  if (!DRY_RUN) {
    const result = await p.product.updateMany({
      where: { manufacturer: currentMfr, partNumber: { startsWith: prefix } },
      data: { manufacturer: correctBrand }
    });
    totalUpdated += result.count;
    summary[correctBrand] = (summary[correctBrand] || 0) + result.count;
    console.log(`✅ ${currentMfr} → ${correctBrand} (${prefix}): ${result.count}`);
  } else {
    totalUpdated += count;
    summary[correctBrand] = (summary[correctBrand] || 0) + count;
    console.log(`📋 ${currentMfr} → ${correctBrand} (${prefix}): ${count}`);
  }
}

console.log(`\n${DRY_RUN ? 'Would update' : 'Updated'}: ${totalUpdated} products`);
console.log('\nBy brand:');
Object.entries(summary).sort((a,b) => b[1] - a[1]).forEach(([b,c]) => console.log(`  ${b}: ${c}`));

await p.$disconnect();
