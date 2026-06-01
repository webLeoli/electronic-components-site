import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// ============================================================
// Manufacturer Brand Restoration Script
// Restores acquired brand names based on part number prefixes
// ============================================================

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('🔍 DRY RUN MODE — no changes will be made\n');
else console.log('⚡ LIVE MODE — database will be updated\n');

// Brand restoration rules: [currentMfr, partNumberPrefix, correctBrand]
// Order matters: more specific prefixes must come before less specific ones
const BRAND_RULES = [
  // === Intel → Altera (FPGA/CPLD) ===
  ['Intel', 'EPM', 'Altera'],       // MAX series CPLD
  ['Intel', 'EPC', 'Altera'],       // Configuration devices
  ['Intel', 'EPF', 'Altera'],       // FLEX series
  ['Intel', 'EP1', 'Altera'],       // Cyclone I / Stratix
  ['Intel', 'EP2', 'Altera'],       // Cyclone II/III, Stratix II
  ['Intel', 'EP3', 'Altera'],       // Stratix III/Cyclone III
  ['Intel', 'EP4', 'Altera'],       // Stratix IV/Cyclone IV
  ['Intel', '5CS', 'Altera'],       // Cyclone V SoC
  ['Intel', '5CG', 'Altera'],       // Cyclone V GX
  ['Intel', '5CE', 'Altera'],       // Cyclone V E
  ['Intel', '5A', 'Altera'],        // Arria V
  ['Intel', '5S', 'Altera'],        // Stratix V
  ['Intel', '10M', 'Altera'],       // MAX 10
  ['Intel', '10CL', 'Altera'],      // Cyclone 10 LP
  ['Intel', '10CX', 'Altera'],      // Cyclone 10 GX
  ['Intel', '10AT', 'Altera'],      // Arria 10
  ['Intel', '10AX', 'Altera'],      // Arria 10 GX
  ['Intel', '10AS', 'Altera'],      // Arria 10 SX
  ['Intel', 'MAX', 'Altera'],       // MAX series
  ['Intel', '1SG', 'Altera'],       // Stratix 10
  ['Intel', '1SM', 'Altera'],       // Stratix 10 MX
  ['Intel', '2CG', 'Altera'],       // Agilex
  ['Intel', 'AGFB', 'Altera'],      // Agilex F
  ['Intel', 'AGIB', 'Altera'],      // Agilex I

  // === Microchip → Atmel (MCU/Memory/FPGA) ===
  ['Microchip', 'ATMEGA', 'Atmel'],    // ATmega MCUs
  ['Microchip', 'ATTINY', 'Atmel'],    // ATtiny MCUs
  ['Microchip', 'ATSAM', 'Atmel'],     // SAM MCUs (ARM)
  ['Microchip', 'AT89', 'Atmel'],      // 8051 MCUs
  ['Microchip', 'AT91', 'Atmel'],      // ARM9 MCUs
  ['Microchip', 'AT32', 'Atmel'],      // AVR32
  ['Microchip', 'AT25', 'Atmel'],      // SPI Flash/EEPROM
  ['Microchip', 'AT24', 'Atmel'],      // I2C EEPROM
  ['Microchip', 'AT45', 'Atmel'],      // DataFlash
  ['Microchip', 'AT86', 'Atmel'],      // RF transceivers
  ['Microchip', 'AT90', 'Atmel'],      // AVR MCUs
  ['Microchip', 'ATA', 'Atmel'],       // Automotive
  ['Microchip', 'ATXMEGA', 'Atmel'],   // XMEGA MCUs
  ['Microchip', 'ATECC', 'Atmel'],     // Crypto ICs
  ['Microchip', 'ATSHA', 'Atmel'],     // Crypto ICs
  ['Microchip', 'ATSTK', 'Atmel'],     // Starter kits
  ['Microchip', 'ATJIT', 'Atmel'],     // Development tools

  // === Microchip → Microsemi (FPGA/radiation-hard) ===
  ['Microchip', 'A2F', 'Microsemi'],    // SmartFusion
  ['Microchip', 'A3P', 'Microsemi'],    // ProASIC3
  ['Microchip', 'APA', 'Microsemi'],    // ProASIC
  ['Microchip', 'AX', 'Microsemi'],     // Axcelerator
  ['Microchip', 'M2S', 'Microsemi'],    // SmartFusion2
  ['Microchip', 'M2GL', 'Microsemi'],   // IGLOO2
  ['Microchip', 'MPF', 'Microsemi'],    // PolarFire
  ['Microchip', 'RTAX', 'Microsemi'],   // Radiation-tolerant
  ['Microchip', 'RT4G', 'Microsemi'],   // RTG4
  ['Microchip', 'RTPF', 'Microsemi'],   // RT PolarFire

  // === Analog Devices Inc. → Linear Technology ===
  ['Analog Devices Inc.', 'LTC', 'Linear Technology'],    // LTC ICs
  ['Analog Devices Inc.', 'LTM', 'Linear Technology'],    // LTM modules
  ['Analog Devices Inc.', 'LTP', 'Linear Technology'],    // LTP modules
  ['Analog Devices Inc.', 'LT1', 'Linear Technology'],    // LT1xxx
  ['Analog Devices Inc.', 'LT3', 'Linear Technology'],    // LT3xxx
  ['Analog Devices Inc.', 'LT4', 'Linear Technology'],    // LT4xxx
  ['Analog Devices Inc.', 'LT6', 'Linear Technology'],    // LT6xxx
  ['Analog Devices Inc.', 'LT8', 'Linear Technology'],    // LT8xxx

  // === Analog Devices Inc./Maxim Integrated → Maxim Integrated ===
  ['Analog Devices Inc./Maxim Integrated', 'MAX', 'Maxim Integrated'],   // MAX series
  ['Analog Devices Inc./Maxim Integrated', 'DS', 'Maxim Integrated'],    // Dallas Semi
  ['Analog Devices Inc./Maxim Integrated', 'ICM', 'Maxim Integrated'],   // ICM series

  // === Renesas → Intersil ===
  ['Renesas', 'ISL', 'Intersil'],       // ISL power/analog
  ['Renesas', 'ICL', 'Intersil'],       // ICL series
  ['Renesas', 'HIP', 'Intersil'],       // HIP series
  ['Renesas', 'EL', 'Intersil'],        // EL series (video)
  ['Renesas', 'X9', 'Intersil'],        // Digital potentiometers
  ['Renesas', 'HS', 'Intersil'],        // HS high-speed

  // === Renesas → IDT ===
  ['Renesas', 'IDT', 'IDT'],            // IDT timing/interface
  ['Renesas', '8V', 'IDT'],             // 8V series

  // === Renesas → Dialog ===
  ['Renesas', 'DA1', 'Dialog Semiconductor'],   // DA14xxx BLE
  ['Renesas', 'DA7', 'Dialog Semiconductor'],   // DA72xx audio
  ['Renesas', 'SLG', 'Dialog Semiconductor'],   // GreenPAK

  // === Onsemi → Fairchild ===
  ['Onsemi', 'FAN', 'Fairchild Semiconductor'],   // Fan controllers
  ['Onsemi', 'FDC', 'Fairchild Semiconductor'],   // MOSFETs
  ['Onsemi', 'FDD', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDF', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDG', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDN', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDP', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDS', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDT', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDV', 'Fairchild Semiconductor'],
  ['Onsemi', 'FDMS', 'Fairchild Semiconductor'],
  ['Onsemi', 'FQP', 'Fairchild Semiconductor'],   // Power MOSFETs
  ['Onsemi', 'FQD', 'Fairchild Semiconductor'],
  ['Onsemi', 'FQPF', 'Fairchild Semiconductor'],
  ['Onsemi', 'KA', 'Fairchild Semiconductor'],    // KA regulators

  // === Infineon → International Rectifier ===
  ['Infineon Technologies', 'IRFP', 'International Rectifier'],
  ['Infineon Technologies', 'IRFZ', 'International Rectifier'],
  ['Infineon Technologies', 'IRFB', 'International Rectifier'],
  ['Infineon Technologies', 'IRFS', 'International Rectifier'],
  ['Infineon Technologies', 'IRFI', 'International Rectifier'],
  ['Infineon Technologies', 'IRFU', 'International Rectifier'],
  ['Infineon Technologies', 'IRLZ', 'International Rectifier'],
  ['Infineon Technologies', 'IRLB', 'International Rectifier'],
  ['Infineon Technologies', 'IRLS', 'International Rectifier'],
  ['Infineon Technologies', 'IRS', 'International Rectifier'],    // Gate drivers
  ['Infineon Technologies', 'AUIR', 'International Rectifier'],   // Automotive
  ['Infineon Technologies', 'IR2', 'International Rectifier'],    // Gate drivers
  ['Infineon Technologies', 'IR3', 'International Rectifier'],
  ['Infineon Technologies', 'IR1', 'International Rectifier'],

  // === NXP → Freescale ===
  ['NXP Semiconductors', 'MC9S', 'Freescale Semiconductor'],     // S08/S12 MCUs
  ['NXP Semiconductors', 'MK', 'Freescale Semiconductor'],       // Kinetis ARM
  ['NXP Semiconductors', 'MCIMX', 'Freescale Semiconductor'],    // i.MX processors
  ['NXP Semiconductors', 'MPC', 'Freescale Semiconductor'],      // PowerPC
  ['NXP Semiconductors', 'MCF', 'Freescale Semiconductor'],      // ColdFire
  ['NXP Semiconductors', 'MC33', 'Freescale Semiconductor'],     // Analog/Power
  ['NXP Semiconductors', 'MC34', 'Freescale Semiconductor'],     // Power management
  ['NXP Semiconductors', 'FRDM', 'Freescale Semiconductor'],    // Freedom boards

  // === Cypress → Spansion (NOR Flash) ===
  ['Cypress Semiconductor', 'S25FL', 'Spansion'],   // NOR Flash
  ['Cypress Semiconductor', 'S29', 'Spansion'],     // Parallel NOR
  ['Cypress Semiconductor', 'S34', 'Spansion'],     // NAND
  ['Cypress Semiconductor', 'MB', 'Spansion'],      // Fujitsu/Spansion FRAM
];

// Execute brand restoration
let totalUpdated = 0;
const summary = [];

for (const [currentMfr, prefix, correctBrand] of BRAND_RULES) {
  const count = await p.product.count({
    where: {
      manufacturer: currentMfr,
      partNumber: { startsWith: prefix },
    }
  });

  if (count === 0) continue;

  if (!DRY_RUN) {
    const result = await p.product.updateMany({
      where: {
        manufacturer: currentMfr,
        partNumber: { startsWith: prefix },
      },
      data: { manufacturer: correctBrand }
    });
    totalUpdated += result.count;
    if (result.count > 0) {
      summary.push({ from: currentMfr, prefix, to: correctBrand, count: result.count });
      console.log(`✅ ${currentMfr} → ${correctBrand} (prefix: ${prefix}): ${result.count} products`);
    }
  } else {
    if (count > 0) {
      totalUpdated += count;
      summary.push({ from: currentMfr, prefix, to: correctBrand, count });
      console.log(`📋 ${currentMfr} → ${correctBrand} (prefix: ${prefix}): ${count} products`);
    }
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`${DRY_RUN ? '📋 Would update' : '✅ Updated'}: ${totalUpdated} products`);
console.log(`${'='.repeat(60)}\n`);

// Summary by brand
const brandSummary = {};
for (const s of summary) {
  if (!brandSummary[s.to]) brandSummary[s.to] = 0;
  brandSummary[s.to] += s.count;
}
console.log('Brand restoration summary:');
Object.entries(brandSummary)
  .sort((a, b) => b[1] - a[1])
  .forEach(([brand, count]) => console.log(`  ${brand}: ${count} products`));

await p.$disconnect();
