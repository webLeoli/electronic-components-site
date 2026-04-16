import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Check current counts
  const existingCount = await prisma.product.count();
  console.log(`Current products: ${existingCount}`);

  // Get existing categories
  const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  console.log(`Categories: ${categories.map(c => c.name).join(', ')}`);

  // Get existing manufacturers
  const manufacturers = await prisma.manufacturer.findMany({ select: { id: true, name: true, slug: true } });
  console.log(`Manufacturers: ${manufacturers.map(m => m.name).join(', ')}`);

  // Build category map
  const catMap = {};
  for (const c of categories) {
    catMap[c.slug] = c.id;
  }

  // Build manufacturer list
  const mfrNames = manufacturers.map(m => m.name);

  // =============================================
  // 50 realistic electronic component products
  // =============================================
  const products = [
    // --- FPGA ---
    { partNumber: 'XC7A200T-2FBG484I', manufacturer: 'Xilinx', description: 'Artix-7 FPGA, 215,360 logic cells, 484-BGA package, industrial temp', categorySlug: 'fpga', packageType: 'BGA-484', mountType: 'SMD', minPrice: 125.50, stock: 45, moq: 1, leadTime: '2-3 weeks' },
    { partNumber: 'XC7K325T-2FFG900I', manufacturer: 'Xilinx', description: 'Kintex-7 FPGA, 326,080 logic cells, 900-BGA package', categorySlug: 'fpga', packageType: 'BGA-900', mountType: 'SMD', minPrice: 380.00, stock: 12, moq: 1, leadTime: '3-4 weeks' },
    { partNumber: 'EP4CE115F29C7N', manufacturer: 'Intel', description: 'Cyclone IV FPGA, 114,480 LEs, 780-FBGA package', categorySlug: 'fpga', packageType: 'FBGA-780', mountType: 'SMD', minPrice: 95.00, stock: 28, moq: 1, leadTime: '2-3 weeks' },
    { partNumber: 'LFE5U-85F-6BG381C', manufacturer: 'Lattice Semiconductor', description: 'ECP5 FPGA, 84K LUT4s, 381-caBGA package', categorySlug: 'fpga', packageType: 'BGA-381', mountType: 'SMD', minPrice: 42.00, stock: 65, moq: 1, leadTime: '1-2 weeks' },
    { partNumber: 'GW2A-LV18PG256C8', manufacturer: 'Gowin', description: 'Arora II FPGA, 20,736 LUT4, 256-QFN package', categorySlug: 'fpga', packageType: 'QFN-256', mountType: 'SMD', minPrice: 18.50, stock: 150, moq: 5, leadTime: 'In stock' },

    // --- Microcontrollers ---
    { partNumber: 'STM32F407VGT6', manufacturer: 'STMicroelectronics', description: 'ARM Cortex-M4 MCU, 1MB Flash, 192KB SRAM, 168MHz', categorySlug: 'microcontrollers', packageType: 'LQFP-100', mountType: 'SMD', minPrice: 12.80, stock: 230, moq: 1, leadTime: 'In stock' },
    { partNumber: 'STM32H743ZIT6', manufacturer: 'STMicroelectronics', description: 'ARM Cortex-M7 MCU, 2MB Flash, 1MB SRAM, 480MHz', categorySlug: 'microcontrollers', packageType: 'LQFP-144', mountType: 'SMD', minPrice: 18.50, stock: 85, moq: 1, leadTime: 'In stock' },
    { partNumber: 'ATSAMD51J20A-AU', manufacturer: 'Microchip', description: 'ARM Cortex-M4F MCU, 1MB Flash, 256KB SRAM, 120MHz', categorySlug: 'microcontrollers', packageType: 'TQFP-64', mountType: 'SMD', minPrice: 7.20, stock: 120, moq: 1, leadTime: 'In stock' },
    { partNumber: 'ESP32-S3-WROOM-1-N16R8', manufacturer: 'Espressif', description: 'WiFi+BLE SoC module, 16MB Flash, 8MB PSRAM, dual-core', categorySlug: 'microcontrollers', packageType: 'Module', mountType: 'SMD', minPrice: 3.50, stock: 500, moq: 5, leadTime: 'In stock' },
    { partNumber: 'RP2040', manufacturer: 'Raspberry Pi', description: 'Dual-core ARM Cortex-M0+ MCU, 264KB SRAM, 30 GPIO', categorySlug: 'microcontrollers', packageType: 'QFN-56', mountType: 'SMD', minPrice: 0.80, stock: 1000, moq: 10, leadTime: 'In stock' },
    { partNumber: 'ATSAME70Q21B-AN', manufacturer: 'Microchip', description: 'ARM Cortex-M7 MCU, 2MB Flash, 384KB SRAM, 300MHz, Ethernet', categorySlug: 'microcontrollers', packageType: 'LQFP-144', mountType: 'SMD', minPrice: 14.90, stock: 55, moq: 1, leadTime: '1-2 weeks' },
    { partNumber: 'MKL26Z256VLH4', manufacturer: 'NXP', description: 'ARM Cortex-M0+ MCU, 256KB Flash, 32KB SRAM, USB', categorySlug: 'microcontrollers', packageType: 'QFP-64', mountType: 'SMD', minPrice: 3.20, stock: 340, moq: 5, leadTime: 'In stock' },

    // --- Memory ---
    { partNumber: 'MT41K512M16HA-125:A', manufacturer: 'Micron', description: 'DDR3L SDRAM, 8Gb (512M x 16), 1.35V, 800MHz', categorySlug: 'memory', packageType: 'BGA-96', mountType: 'SMD', minPrice: 8.50, stock: 200, moq: 10, leadTime: 'In stock' },
    { partNumber: 'IS42S16160J-7TLI', manufacturer: 'ISSI', description: 'SDRAM, 256Mb (16M x 16), 3.3V, 143MHz', categorySlug: 'memory', packageType: 'TSOP-54', mountType: 'SMD', minPrice: 3.80, stock: 320, moq: 5, leadTime: 'In stock' },
    { partNumber: 'W25Q256JVEIQ', manufacturer: 'Winbond', description: 'NOR Flash, 256Mb, SPI/Dual/Quad, 133MHz', categorySlug: 'memory', packageType: 'SOIC-16', mountType: 'SMD', minPrice: 4.20, stock: 180, moq: 5, leadTime: 'In stock' },
    { partNumber: 'S29GL512T10TFI020', manufacturer: 'Infineon', description: 'NOR Flash, 512Mb, parallel interface, 110ns', categorySlug: 'memory', packageType: 'TSOP-56', mountType: 'SMD', minPrice: 12.00, stock: 45, moq: 1, leadTime: '2-3 weeks' },
    { partNumber: 'K4B4G1646E-BYMA', manufacturer: 'Samsung', description: 'DDR3 SDRAM, 4Gb (256M x 16), 1.35V, 933MHz', categorySlug: 'memory', packageType: 'BGA-96', mountType: 'SMD', minPrice: 5.60, stock: 280, moq: 10, leadTime: 'In stock' },
    { partNumber: 'AS4C256M16D3LB-12BIN', manufacturer: 'Alliance Memory', description: 'DDR3L SDRAM, 4Gb (256M x 16), 1.35V, automotive', categorySlug: 'memory', packageType: 'BGA-96', mountType: 'SMD', minPrice: 9.80, stock: 60, moq: 5, leadTime: '1-2 weeks' },

    // --- Power Management ---
    { partNumber: 'TPS65987DDK', manufacturer: 'Texas Instruments', description: 'USB Type-C and PD Controller with integrated power switches', categorySlug: 'power-management', packageType: 'BGA-40', mountType: 'SMD', minPrice: 6.50, stock: 90, moq: 1, leadTime: 'In stock' },
    { partNumber: 'LT3045EMSE#PBF', manufacturer: 'Analog Devices', description: 'Ultra-low noise LDO regulator, 500mA, 0.8µVrms', categorySlug: 'power-management', packageType: 'MSOP-12', mountType: 'SMD', minPrice: 5.80, stock: 145, moq: 1, leadTime: 'In stock' },
    { partNumber: 'TPS54360BDDAR', manufacturer: 'Texas Instruments', description: 'Step-down DC-DC converter, 60V input, 3.5A output', categorySlug: 'power-management', packageType: 'SOIC-8', mountType: 'SMD', minPrice: 3.20, stock: 250, moq: 5, leadTime: 'In stock' },
    { partNumber: 'MP2315GJ-Z', manufacturer: 'Monolithic Power Systems', description: 'Step-down converter, 24V, 3A, 500kHz, high efficiency', categorySlug: 'power-management', packageType: 'TSOT-23-8', mountType: 'SMD', minPrice: 1.50, stock: 600, moq: 10, leadTime: 'In stock' },
    { partNumber: 'BQ25895RTWR', manufacturer: 'Texas Instruments', description: 'I2C controlled battery charger, USB-PD, 5A', categorySlug: 'power-management', packageType: 'QFN-24', mountType: 'SMD', minPrice: 4.10, stock: 175, moq: 5, leadTime: 'In stock' },
    { partNumber: 'ADP5054ACPZ-R7', manufacturer: 'Analog Devices', description: 'Quad output PMU, 4-channel DC-DC, 1.2A each', categorySlug: 'power-management', packageType: 'LFCSP-48', mountType: 'SMD', minPrice: 8.90, stock: 42, moq: 1, leadTime: '2-3 weeks' },

    // --- Analog / Mixed Signal ---
    { partNumber: 'AD9361BBCZ', manufacturer: 'Analog Devices', description: 'RF Agile Transceiver, 70MHz-6GHz, 2x2 MIMO', categorySlug: 'analog', packageType: 'BGA-144', mountType: 'SMD', minPrice: 180.00, stock: 15, moq: 1, leadTime: '4-6 weeks' },
    { partNumber: 'ADS1256IDBR', manufacturer: 'Texas Instruments', description: '24-bit ADC, 30kSPS, 8-channel, low noise', categorySlug: 'analog', packageType: 'SSOP-28', mountType: 'SMD', minPrice: 12.50, stock: 80, moq: 1, leadTime: '1-2 weeks' },
    { partNumber: 'DAC8568SCPW', manufacturer: 'Texas Instruments', description: '16-bit DAC, 8-channel, SPI interface, 2.5V reference', categorySlug: 'analog', packageType: 'TSSOP-16', mountType: 'SMD', minPrice: 9.80, stock: 95, moq: 1, leadTime: 'In stock' },
    { partNumber: 'OPA1612AIDR', manufacturer: 'Texas Instruments', description: 'Dual op-amp, ultra-low distortion, audio grade, 1.1nV/√Hz', categorySlug: 'analog', packageType: 'SOIC-8', mountType: 'SMD', minPrice: 4.50, stock: 210, moq: 5, leadTime: 'In stock' },
    { partNumber: 'MAX11131ATI+', manufacturer: 'Analog Devices', description: '12-bit ADC, 16-channel, 3MSPS, SPI interface', categorySlug: 'analog', packageType: 'TQFN-28', mountType: 'SMD', minPrice: 7.80, stock: 65, moq: 1, leadTime: '1-2 weeks' },

    // --- Interface / Communications ---
    { partNumber: 'DP83867IRRGZ', manufacturer: 'Texas Instruments', description: 'Gigabit Ethernet PHY, RGMII, industrial temp', categorySlug: 'interface', packageType: 'QFN-48', mountType: 'SMD', minPrice: 6.30, stock: 110, moq: 1, leadTime: 'In stock' },
    { partNumber: 'FT4232HQ-REEL', manufacturer: 'FTDI', description: 'Quad USB to UART/MPSSE bridge, Hi-Speed USB 2.0', categorySlug: 'interface', packageType: 'QFN-64', mountType: 'SMD', minPrice: 8.50, stock: 75, moq: 1, leadTime: 'In stock' },
    { partNumber: 'SN65LVDS386DGG', manufacturer: 'Texas Instruments', description: 'Quad LVDS receiver, 3V, 400Mbps per channel', categorySlug: 'interface', packageType: 'TSSOP-16', mountType: 'SMD', minPrice: 3.90, stock: 190, moq: 5, leadTime: 'In stock' },
    { partNumber: 'MCP2517FD-H/SL', manufacturer: 'Microchip', description: 'CAN FD controller, SPI interface, up to 8Mbps', categorySlug: 'interface', packageType: 'SOIC-14', mountType: 'SMD', minPrice: 2.80, stock: 320, moq: 5, leadTime: 'In stock' },
    { partNumber: 'MAX3232ECPE+', manufacturer: 'Analog Devices', description: 'Dual RS-232 transceiver, 3.0-5.5V, 250kbps', categorySlug: 'interface', packageType: 'DIP-16', mountType: 'THT', minPrice: 2.10, stock: 400, moq: 10, leadTime: 'In stock' },

    // --- Sensors ---
    { partNumber: 'BME680', manufacturer: 'Bosch', description: 'Environmental sensor: temperature, humidity, pressure, gas', categorySlug: 'sensors', packageType: 'LGA-8', mountType: 'SMD', minPrice: 8.20, stock: 130, moq: 5, leadTime: 'In stock' },
    { partNumber: 'ICM-42688-P', manufacturer: 'TDK InvenSense', description: '6-axis IMU, accelerometer + gyroscope, ±16g/±2000dps', categorySlug: 'sensors', packageType: 'LGA-14', mountType: 'SMD', minPrice: 5.50, stock: 200, moq: 5, leadTime: 'In stock' },
    { partNumber: 'VL53L5CX', manufacturer: 'STMicroelectronics', description: 'ToF multizone ranging sensor, 8x8 zones, up to 4m', categorySlug: 'sensors', packageType: 'LGA-16', mountType: 'SMD', minPrice: 6.80, stock: 85, moq: 1, leadTime: '1-2 weeks' },
    { partNumber: 'ACS712ELCTR-30A-T', manufacturer: 'Allegro MicroSystems', description: 'Hall-effect current sensor, ±30A, analog output', categorySlug: 'sensors', packageType: 'SOIC-8', mountType: 'SMD', minPrice: 3.50, stock: 250, moq: 10, leadTime: 'In stock' },

    // --- Connectors ---
    { partNumber: 'USB4105-GF-A', manufacturer: 'GCT', description: 'USB Type-C receptacle, 24-pin, SMD, mid-mount', categorySlug: 'connectors', packageType: 'SMD', mountType: 'SMD', minPrice: 0.65, stock: 2000, moq: 50, leadTime: 'In stock' },
    { partNumber: 'SFP-10G-SR', manufacturer: 'Finisar', description: '10GBASE-SR SFP+ transceiver module, 850nm, 300m', categorySlug: 'connectors', packageType: 'SFP+', mountType: 'Pluggable', minPrice: 25.00, stock: 30, moq: 1, leadTime: '1-2 weeks' },
    { partNumber: 'MOLEX-87832-1420', manufacturer: 'Molex', description: '2mm pitch wire-to-board connector, 14-pin, vertical', categorySlug: 'connectors', packageType: 'THT', mountType: 'THT', minPrice: 1.20, stock: 500, moq: 20, leadTime: 'In stock' },

    // --- Capacitors / Passives ---
    { partNumber: 'GRM32ER71H106KA12L', manufacturer: 'Murata', description: 'MLCC capacitor, 10µF, 50V, X7R, 1210 package', categorySlug: 'passive-components', packageType: '1210', mountType: 'SMD', minPrice: 0.25, stock: 5000, moq: 100, leadTime: 'In stock' },
    { partNumber: 'C3216X7R2A105K160AA', manufacturer: 'TDK', description: 'MLCC capacitor, 1µF, 100V, X7R, 1206 package', categorySlug: 'passive-components', packageType: '1206', mountType: 'SMD', minPrice: 0.12, stock: 8000, moq: 200, leadTime: 'In stock' },
    { partNumber: 'CRCW060310K0FKEA', manufacturer: 'Vishay', description: 'Thick film resistor, 10kΩ, 0.1W, ±1%, 0603', categorySlug: 'passive-components', packageType: '0603', mountType: 'SMD', minPrice: 0.02, stock: 10000, moq: 500, leadTime: 'In stock' },
    { partNumber: 'SRR1260A-100M', manufacturer: 'Bourns', description: 'Shielded power inductor, 10µH, 6A, 18mΩ DCR', categorySlug: 'passive-components', packageType: '1260', mountType: 'SMD', minPrice: 1.80, stock: 450, moq: 10, leadTime: 'In stock' },

    // --- Discrete Semiconductors ---
    { partNumber: 'IRFP4368PBF', manufacturer: 'Infineon', description: 'N-channel MOSFET, 75V, 350A, 1.46mΩ, TO-247AC', categorySlug: 'discrete', packageType: 'TO-247AC', mountType: 'THT', minPrice: 8.50, stock: 120, moq: 5, leadTime: 'In stock' },
    { partNumber: 'SIHG20N50C-GE3', manufacturer: 'Vishay', description: 'N-channel MOSFET, 500V, 20A, TO-247AC', categorySlug: 'discrete', packageType: 'TO-247AC', mountType: 'THT', minPrice: 4.20, stock: 80, moq: 5, leadTime: 'In stock' },
    { partNumber: 'STPS30H100CG-TR', manufacturer: 'STMicroelectronics', description: 'Schottky diode, 100V, 30A, dual common cathode', categorySlug: 'discrete', packageType: 'D2PAK', mountType: 'SMD', minPrice: 2.80, stock: 200, moq: 10, leadTime: 'In stock' },

    // --- Clock / Timing ---
    { partNumber: 'SI5351A-B-GTR', manufacturer: 'Skyworks', description: 'Clock generator, I2C programmable, 3 outputs, 200MHz', categorySlug: 'clock-timing', packageType: 'MSOP-10', mountType: 'SMD', minPrice: 2.50, stock: 300, moq: 10, leadTime: 'In stock' },
    { partNumber: 'CDCE913PWR', manufacturer: 'Texas Instruments', description: 'PLL clock synthesizer, 3 outputs, I2C, 230MHz', categorySlug: 'clock-timing', packageType: 'TSSOP-14', mountType: 'SMD', minPrice: 3.80, stock: 140, moq: 5, leadTime: 'In stock' },
  ];

  // Ensure needed categories exist
  const neededSlugs = [...new Set(products.map(p => p.categorySlug))];
  const categoryDefs = {
    'fpga': 'FPGA',
    'microcontrollers': 'Microcontrollers',
    'memory': 'Memory',
    'power-management': 'Power Management',
    'analog': 'Analog & Mixed Signal',
    'interface': 'Interface ICs',
    'sensors': 'Sensors',
    'connectors': 'Connectors',
    'passive-components': 'Passive Components',
    'discrete': 'Discrete Semiconductors',
    'clock-timing': 'Clock & Timing',
  };

  for (const slug of neededSlugs) {
    if (!catMap[slug]) {
      const cat = await prisma.category.upsert({
        where: { slug },
        update: {},
        create: { name: categoryDefs[slug] || slug, slug },
      });
      catMap[slug] = cat.id;
      console.log(`  Created category: ${cat.name} (id=${cat.id})`);
    }
  }

  // Ensure needed manufacturers exist
  const neededMfrs = [...new Set(products.map(p => p.manufacturer))];
  for (const mfrName of neededMfrs) {
    if (!mfrNames.includes(mfrName)) {
      const slug = mfrName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      await prisma.manufacturer.upsert({
        where: { slug },
        update: {},
        create: { name: mfrName, slug },
      });
      mfrNames.push(mfrName);
      console.log(`  Created manufacturer: ${mfrName}`);
    }
  }

  // Insert products
  let created = 0;
  let skipped = 0;
  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { partNumber: p.partNumber } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        partNumber: p.partNumber,
        manufacturer: p.manufacturer,
        description: p.description,
        categoryId: catMap[p.categorySlug] || null,
        packageType: p.packageType,
        mountType: p.mountType,
        minPrice: p.minPrice,
        stock: p.stock,
        moq: p.moq,
        leadTime: p.leadTime,
        status: 'active',
      },
    });
    created++;
  }

  const totalCount = await prisma.product.count();
  console.log(`\n✅ Done! Created: ${created}, Skipped (duplicates): ${skipped}`);
  console.log(`Total products in database: ${totalCount}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
