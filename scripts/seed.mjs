// Seed script: populate database with sample categories and products
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Integrated Circuits', slug: 'integrated-circuits', icon: '⚡', seoTitle: 'Integrated Circuits (ICs) - Buy Online', seoDesc: 'Browse our extensive inventory of integrated circuits including microcontrollers, FPGAs, memory ICs, power management, and interface ICs.', children: [
    { name: 'Microcontrollers', slug: 'microcontrollers', icon: '🔧', seoTitle: 'Microcontrollers - MCU', seoDesc: 'Buy microcontrollers from STM, Microchip, NXP, Renesas. ARM Cortex, AVR, PIC, 8051 architectures.' },
    { name: 'FPGAs', slug: 'fpgas', icon: '🧩', seoTitle: 'FPGAs - Field Programmable Gate Arrays', seoDesc: 'Xilinx, Intel Altera, Lattice FPGAs. Spartan, Artix, Cyclone, MAX series.' },
    { name: 'CPLDs', slug: 'cplds', icon: '📐', seoTitle: 'CPLDs - Complex Programmable Logic Devices', seoDesc: 'CPLDs from Xilinx, Intel Altera, Lattice. XC9500, MAX series.' },
    { name: 'Memory ICs', slug: 'memory-ics', icon: '💾', seoTitle: 'Memory ICs - SRAM, DRAM, Flash', seoDesc: 'Memory chips: SRAM, SDRAM, DDR, Flash, EEPROM, FRAM from major manufacturers.' },
    { name: 'Power Management ICs', slug: 'power-management-ics', icon: '⚡', seoTitle: 'Power Management ICs - PMIC', seoDesc: 'Voltage regulators, DC-DC converters, LDOs, battery management ICs.' },
    { name: 'Interface ICs', slug: 'interface-ics', icon: '↔️', seoTitle: 'Interface ICs - Drivers, Transceivers', seoDesc: 'UART, SPI, I2C, CAN, USB, Ethernet interface ICs and transceivers.' },
    { name: 'Analog ICs', slug: 'analog-ics', icon: '📈', seoTitle: 'Analog ICs - Op Amps, ADC, DAC', seoDesc: 'Operational amplifiers, ADCs, DACs, comparators, analog multiplexers.' },
    { name: 'Clock & Timing ICs', slug: 'clock-timing-ics', icon: '⏰', seoTitle: 'Clock & Timing ICs', seoDesc: 'PLLs, clock generators, buffers, real-time clocks, timer ICs.' },
  ]},
  { name: 'Discrete Semiconductors', slug: 'discrete-semiconductors', icon: '🔌', seoTitle: 'Discrete Semiconductors', seoDesc: 'MOSFETs, transistors, diodes, IGBTs, thyristors from leading manufacturers.', children: [
    { name: 'MOSFETs', slug: 'mosfets', icon: '⚡' },
    { name: 'Diodes', slug: 'diodes', icon: '➡️' },
    { name: 'BJT Transistors', slug: 'bjt-transistors', icon: '🔀' },
    { name: 'IGBTs', slug: 'igbts', icon: '🔋' },
    { name: 'Thyristors', slug: 'thyristors', icon: '⚙' },
  ]},
  { name: 'Capacitors', slug: 'capacitors', icon: '⊞', seoTitle: 'Capacitors', seoDesc: 'Ceramic, electrolytic, film, tantalum capacitors from Murata, TDK, Samsung, Kemet.' },
  { name: 'Resistors', slug: 'resistors', icon: 'Ω', seoTitle: 'Resistors', seoDesc: 'Chip resistors, through-hole, resistor arrays, specialty resistors.' },
  { name: 'Connectors', slug: 'connectors', icon: '🔗', seoTitle: 'Connectors & Interconnects', seoDesc: 'Board-to-board, FPC, USB, terminal blocks, D-Sub connectors.' },
  { name: 'Sensors', slug: 'sensors', icon: '📡', seoTitle: 'Sensors & Transducers', seoDesc: 'Temperature, pressure, motion, optical sensors and transducers.' },
  { name: 'Optoelectronics', slug: 'optoelectronics', icon: '💡', seoTitle: 'Optoelectronics - LEDs, Displays', seoDesc: 'LEDs, LCD/OLED displays, fiber optics, laser diodes, optocouplers.' },
  { name: 'Crystals & Oscillators', slug: 'crystals-oscillators', icon: '📶', seoTitle: 'Crystals & Oscillators', seoDesc: 'Quartz crystals, oscillators, resonators, VCOs.' },
  { name: 'Relays', slug: 'relays', icon: '⚙', seoTitle: 'Relays', seoDesc: 'Power relays, signal relays, solid state relays, reed relays.' },
  { name: 'Switches', slug: 'switches', icon: '🔘', seoTitle: 'Switches', seoDesc: 'Tactile, DIP, toggle, pushbutton, rocker switches.' },
  { name: 'Power Supplies', slug: 'power-supplies', icon: '🔋', seoTitle: 'Power Supplies', seoDesc: 'Board-mount and off-board AC-DC, DC-DC converters, LED drivers.' },
  { name: 'RF / RFID', slug: 'rf-rfid', icon: '📻', seoTitle: 'RF, IF & RFID Components', seoDesc: 'RF amplifiers, antennas, transceivers, RFID readers and tags.' },
];

const PRODUCTS = [
  // Microcontrollers
  { partNumber: 'STM32F103C8T6', manufacturer: 'STMicroelectronics', description: 'ARM Cortex-M3 MCU, 72MHz, 64KB Flash, 20KB SRAM, LQFP-48', categorySlug: 'microcontrollers', packageType: 'LQFP-48', mountType: 'SMD', status: 'active', minPrice: 2.85, stock: 15000, moq: 1, leadTime: '1-3 days', specs: JSON.stringify({ core: 'ARM Cortex-M3', frequency: '72 MHz', flash: '64 KB', sram: '20 KB', gpio: 37, adc: '2x 12-bit', uart: 3, spi: 2, i2c: 2, voltage: '2.0V - 3.6V', temperature: '-40°C to +85°C' }) },
  { partNumber: 'STM32F407VGT6', manufacturer: 'STMicroelectronics', description: 'ARM Cortex-M4 MCU with FPU, 168MHz, 1MB Flash, 192KB SRAM, LQFP-100', categorySlug: 'microcontrollers', packageType: 'LQFP-100', mountType: 'SMD', status: 'active', minPrice: 8.50, stock: 5000, moq: 1, leadTime: '1-3 days', specs: JSON.stringify({ core: 'ARM Cortex-M4F', frequency: '168 MHz', flash: '1 MB', sram: '192 KB', gpio: 82, adc: '3x 12-bit', uart: 6, spi: 3, i2c: 3, usb: 'OTG HS/FS', ethernet: 'Yes', voltage: '1.8V - 3.6V' }) },
  { partNumber: 'ATMEGA328P-AU', manufacturer: 'Microchip', description: '8-bit AVR MCU, 20MHz, 32KB Flash, 2KB SRAM, TQFP-32', categorySlug: 'microcontrollers', packageType: 'TQFP-32', mountType: 'SMD', status: 'active', minPrice: 1.95, stock: 12000, moq: 1, leadTime: '1-3 days', specs: JSON.stringify({ core: 'AVR 8-bit', frequency: '20 MHz', flash: '32 KB', sram: '2 KB', eeprom: '1 KB', gpio: 23, adc: '8-ch 10-bit', uart: 1, spi: 1, i2c: 1, voltage: '1.8V - 5.5V' }) },
  { partNumber: 'ATMEGA2560-16AU', manufacturer: 'Microchip', description: '8-bit AVR MCU, 16MHz, 256KB Flash, 8KB SRAM, TQFP-100', categorySlug: 'microcontrollers', packageType: 'TQFP-100', mountType: 'SMD', status: 'active', minPrice: 9.20, stock: 3000, moq: 1, specs: JSON.stringify({ core: 'AVR 8-bit', frequency: '16 MHz', flash: '256 KB', sram: '8 KB' }) },
  { partNumber: 'PIC16F877A-I/P', manufacturer: 'Microchip', description: '8-bit PIC MCU, 20MHz, 14KB Flash, 368B SRAM, DIP-40', categorySlug: 'microcontrollers', packageType: 'DIP-40', mountType: 'THT', status: 'obsolete', minPrice: 3.50, stock: 800, moq: 1, specs: JSON.stringify({ core: 'PIC 8-bit', frequency: '20 MHz', flash: '14 KB', sram: '368 B' }) },
  { partNumber: 'ESP32-WROOM-32E', manufacturer: 'Espressif', description: 'Wi-Fi + Bluetooth MCU Module, Dual-Core 240MHz, 4MB Flash', categorySlug: 'microcontrollers', packageType: 'Module', mountType: 'SMD', status: 'active', minPrice: 2.10, stock: 20000, moq: 1, specs: JSON.stringify({ core: 'Xtensa Dual-Core LX6', frequency: '240 MHz', flash: '4 MB', sram: '520 KB', wifi: '802.11 b/g/n', bluetooth: 'BLE 4.2' }) },

  // FPGAs
  { partNumber: 'XC6SLX9-2TQG144C', manufacturer: 'Xilinx', description: 'Spartan-6 FPGA, 9152 Logic Cells, 144-TQFP', categorySlug: 'fpgas', packageType: 'TQFP-144', mountType: 'SMD', status: 'obsolete', minPrice: 12.50, stock: 500, moq: 1, leadTime: '3-5 days', specs: JSON.stringify({ family: 'Spartan-6', logicCells: 9152, slices: 1430, blockRam: '576 Kb', dsp: 16, io: 102, voltage: '1.2V core', speed: '-2' }) },
  { partNumber: 'XC7A35T-1CPG236C', manufacturer: 'Xilinx', description: 'Artix-7 FPGA, 33280 Logic Cells, 236-BGA', categorySlug: 'fpgas', packageType: 'BGA-236', mountType: 'SMD', status: 'active', minPrice: 18.90, stock: 2000, moq: 1, specs: JSON.stringify({ family: 'Artix-7', logicCells: 33280, blockRam: '1800 Kb', dsp: 90, io: 106 }) },
  { partNumber: 'EP4CE6E22C8N', manufacturer: 'Intel/Altera', description: 'Cyclone IV FPGA, 6272 Logic Elements, 144-EQFP', categorySlug: 'fpgas', packageType: 'EQFP-144', mountType: 'SMD', status: 'eol', minPrice: 6.80, stock: 1500, moq: 1, specs: JSON.stringify({ family: 'Cyclone IV E', logicElements: 6272, embeddedMemory: '270 Kb', pll: 2, io: 91 }) },
  { partNumber: 'EPM240T100C5N', manufacturer: 'Intel/Altera', description: 'MAX II CPLD, 240 Logic Elements, TQFP-100', categorySlug: 'cplds', packageType: 'TQFP-100', mountType: 'SMD', status: 'eol', minPrice: 3.20, stock: 3000, moq: 1, specs: JSON.stringify({ family: 'MAX II', logicElements: 240, io: 80, voltage: '3.3V / 2.5V / 1.8V' }) },

  // Analog & Power
  { partNumber: 'LM7805CT', manufacturer: 'Texas Instruments', description: 'Linear Voltage Regulator, 5V, 1.5A, TO-220', categorySlug: 'power-management-ics', packageType: 'TO-220', mountType: 'THT', status: 'active', minPrice: 0.45, stock: 8500, moq: 1, specs: JSON.stringify({ type: 'Linear Regulator', outputVoltage: '5V', outputCurrent: '1.5A', inputVoltage: '7V - 35V', dropout: '2V' }) },
  { partNumber: 'AMS1117-3.3', manufacturer: 'Advanced Monolithic Systems', description: 'LDO Voltage Regulator, 3.3V, 1A, SOT-223', categorySlug: 'power-management-ics', packageType: 'SOT-223', mountType: 'SMD', status: 'active', minPrice: 0.08, stock: 100000, moq: 10, specs: JSON.stringify({ type: 'LDO Regulator', outputVoltage: '3.3V', outputCurrent: '1A', dropout: '1.3V' }) },
  { partNumber: 'NE555P', manufacturer: 'Texas Instruments', description: 'Precision Timer IC, DIP-8', categorySlug: 'analog-ics', packageType: 'DIP-8', mountType: 'THT', status: 'active', minPrice: 0.15, stock: 50000, moq: 1, specs: JSON.stringify({ type: 'Timer', channels: 1, frequency: 'DC to 500kHz', voltage: '4.5V - 16V' }) },
  { partNumber: 'AD9361BBCZ', manufacturer: 'Analog Devices', description: 'RF Agile Transceiver, 70MHz-6GHz, 144-LFCSP', categorySlug: 'interface-ics', packageType: 'LFCSP-144', mountType: 'SMD', status: 'nrnd', minPrice: 85.00, stock: 200, moq: 1, leadTime: '5-7 days', specs: JSON.stringify({ type: 'RF Transceiver', bandwidth: '200kHz to 56MHz', frequency: '70MHz to 6GHz', adc: '12-bit', interface: 'CMOS/LVDS' }) },

  // Discrete
  { partNumber: 'IRF540NPBF', manufacturer: 'Infineon', description: 'N-Channel MOSFET, 100V, 33A, TO-220', categorySlug: 'mosfets', packageType: 'TO-220', mountType: 'THT', status: 'active', minPrice: 0.65, stock: 25000, moq: 1, specs: JSON.stringify({ type: 'N-Channel MOSFET', vds: '100V', id: '33A', rdsOn: '44 mΩ', vgs: '±20V', pd: '130W' }) },
  { partNumber: 'IRFZ44NPBF', manufacturer: 'Infineon', description: 'N-Channel MOSFET, 55V, 49A, TO-220', categorySlug: 'mosfets', packageType: 'TO-220', mountType: 'THT', status: 'active', minPrice: 0.55, stock: 30000, moq: 1, specs: JSON.stringify({ type: 'N-Channel MOSFET', vds: '55V', id: '49A', rdsOn: '17.5 mΩ' }) },
  { partNumber: '1N4007', manufacturer: 'ON Semiconductor', description: 'Standard Rectifier Diode, 1000V, 1A, DO-41', categorySlug: 'diodes', packageType: 'DO-41', mountType: 'THT', status: 'active', minPrice: 0.02, stock: 500000, moq: 100, specs: JSON.stringify({ type: 'Rectifier Diode', vrrm: '1000V', io: '1A', vf: '1.1V' }) },

  // passives
  { partNumber: 'GRM188R71C104KA01D', manufacturer: 'Murata', description: 'MLCC Capacitor, 100nF, 16V, X7R, 0603', categorySlug: 'capacitors', packageType: '0603', mountType: 'SMD', status: 'active', minPrice: 0.005, stock: 1000000, moq: 100, specs: JSON.stringify({ type: 'MLCC', capacitance: '100nF', voltage: '16V', dielectric: 'X7R', tolerance: '±10%' }) },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.manufacturer.deleteMany();

  // Create categories
  const categoryMap = {};
  for (const cat of CATEGORIES) {
    const parent = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        seoTitle: cat.seoTitle || null,
        seoDesc: cat.seoDesc || null,
        sortOrder: CATEGORIES.indexOf(cat),
      },
    });
    categoryMap[cat.slug] = parent.id;

    if (cat.children) {
      for (const child of cat.children) {
        const childCat = await prisma.category.create({
          data: {
            name: child.name,
            slug: child.slug,
            icon: child.icon || cat.icon,
            parentId: parent.id,
            seoTitle: child.seoTitle || null,
            seoDesc: child.seoDesc || null,
            sortOrder: cat.children.indexOf(child),
          },
        });
        categoryMap[child.slug] = childCat.id;
      }
    }
  }
  console.log(`✅ Created ${Object.keys(categoryMap).length} categories`);

  // Create manufacturers
  const manufacturerSet = new Set(PRODUCTS.map(p => p.manufacturer));
  for (const name of manufacturerSet) {
    await prisma.manufacturer.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/[\s\/]+/g, '-').replace(/[^a-z0-9-]/g, ''),
      },
    });
  }
  console.log(`✅ Created ${manufacturerSet.size} manufacturers`);

  // Create products
  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        partNumber: p.partNumber,
        manufacturer: p.manufacturer,
        description: p.description,
        categoryId: categoryMap[p.categorySlug] || null,
        packageType: p.packageType,
        mountType: p.mountType,
        status: p.status,
        minPrice: p.minPrice,
        stock: p.stock,
        moq: p.moq || 1,
        leadTime: p.leadTime || null,
        specs: p.specs || null,
      },
    });
  }
  console.log(`✅ Created ${PRODUCTS.length} products`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
