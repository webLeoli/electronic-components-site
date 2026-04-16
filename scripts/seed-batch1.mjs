import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();

async function main() {
  // Ensure categories exist
  const cats = {
    'fpga': 'FPGA',
    'cpld': 'CPLD',
    'microcontrollers': 'Microcontrollers',
    'memory': 'Memory',
    'analog': 'Analog & Mixed Signal',
    'power-management': 'Power Management',
    'interface': 'Interface ICs',
    'dsp': 'DSP Processors',
    'military-aerospace': 'Military & Aerospace Grade',
  };
  const catMap = {};
  for (const [slug, name] of Object.entries(cats)) {
    const c = await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
    catMap[slug] = c.id;
  }

  // Ensure manufacturers exist
  const mfrs = ['Xilinx','Intel','Altera','Lattice Semiconductor','Actel','Microsemi','Atmel',
    'Texas Instruments','Analog Devices','STMicroelectronics','Cypress Semiconductor',
    'Renesas','Maxim Integrated','Linear Technology','Microchip','Honeywell',
    'Cobham','BAE Systems','Teledyne e2v','International Rectifier'];
  for (const name of mfrs) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    await prisma.manufacturer.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }

  const products = [
    // ========== OBSOLETE FPGA — Spartan-3 ==========
    { pn: 'XC3S200-4FTG256C', mfr: 'Xilinx', desc: 'Spartan-3 FPGA, 200K gates, 4656 logic cells, 256-FTBGA', cat: 'fpga', pkg: 'FTBGA-256', price: 18.00, stock: 35, lead: '2-4 weeks' },
    { pn: 'XC3S400-4PQG208C', mfr: 'Xilinx', desc: 'Spartan-3 FPGA, 400K gates, 8064 logic cells, 208-PQFP', cat: 'fpga', pkg: 'PQFP-208', price: 22.00, stock: 20, lead: '3-5 weeks' },
    { pn: 'XC3S1000-4FGG456C', mfr: 'Xilinx', desc: 'Spartan-3 FPGA, 1M gates, 17,280 logic cells, 456-FBGA', cat: 'fpga', pkg: 'FBGA-456', price: 35.00, stock: 15, lead: '4-6 weeks' },
    { pn: 'XC3S1500-4FGG676C', mfr: 'Xilinx', desc: 'Spartan-3 FPGA, 1.5M gates, 29,952 logic cells, 676-FBGA', cat: 'fpga', pkg: 'FBGA-676', price: 45.00, stock: 10, lead: '4-6 weeks' },
    { pn: 'XC3S2000-4FGG676C', mfr: 'Xilinx', desc: 'Spartan-3 FPGA, 2M gates, 46,080 logic cells, 676-FBGA', cat: 'fpga', pkg: 'FBGA-676', price: 55.00, stock: 8, lead: '5-8 weeks' },
    { pn: 'XC3S4000-4FGG900C', mfr: 'Xilinx', desc: 'Spartan-3 FPGA, 4M gates, 62,208 logic cells, 900-FBGA', cat: 'fpga', pkg: 'FBGA-900', price: 85.00, stock: 5, lead: '6-10 weeks' },
    { pn: 'XC3S5000-4FGG900C', mfr: 'Xilinx', desc: 'Spartan-3 FPGA, 5M gates, 74,880 logic cells, 900-FBGA', cat: 'fpga', pkg: 'FBGA-900', price: 120.00, stock: 3, lead: '8-12 weeks' },
    // Spartan-3E
    { pn: 'XC3S250E-4PQG208C', mfr: 'Xilinx', desc: 'Spartan-3E FPGA, 250K gates, 5,508 LUTs, 208-PQFP', cat: 'fpga', pkg: 'PQFP-208', price: 15.00, stock: 40, lead: '2-3 weeks' },
    { pn: 'XC3S500E-4FTG256C', mfr: 'Xilinx', desc: 'Spartan-3E FPGA, 500K gates, 10,476 LUTs, 256-FTBGA', cat: 'fpga', pkg: 'FTBGA-256', price: 20.00, stock: 25, lead: '2-4 weeks' },
    { pn: 'XC3S1200E-4FGG320C', mfr: 'Xilinx', desc: 'Spartan-3E FPGA, 1.2M gates, 19,512 LUTs, 320-FBGA', cat: 'fpga', pkg: 'FBGA-320', price: 38.00, stock: 12, lead: '4-6 weeks' },
    { pn: 'XC3S1600E-4FGG484C', mfr: 'Xilinx', desc: 'Spartan-3E FPGA, 1.6M gates, 33,192 LUTs, 484-FBGA', cat: 'fpga', pkg: 'FBGA-484', price: 48.00, stock: 8, lead: '4-8 weeks' },
    // Spartan-3AN (with built-in Flash)
    { pn: 'XC3S50AN-4TQG144C', mfr: 'Xilinx', desc: 'Spartan-3AN FPGA with built-in Flash, 50K gates, 144-TQFP', cat: 'fpga', pkg: 'TQFP-144', price: 12.00, stock: 50, lead: '2-3 weeks' },
    { pn: 'XC3S200AN-4FTG256C', mfr: 'Xilinx', desc: 'Spartan-3AN FPGA with built-in Flash, 200K gates, 256-FTBGA', cat: 'fpga', pkg: 'FTBGA-256', price: 22.00, stock: 30, lead: '3-5 weeks' },
    { pn: 'XC3S700AN-4FGG484C', mfr: 'Xilinx', desc: 'Spartan-3AN FPGA with built-in Flash, 700K gates, 484-FBGA', cat: 'fpga', pkg: 'FBGA-484', price: 42.00, stock: 10, lead: '5-8 weeks' },
    { pn: 'XC3S1400AN-4FGG676C', mfr: 'Xilinx', desc: 'Spartan-3AN FPGA with built-in Flash, 1.4M gates, 676-FBGA', cat: 'fpga', pkg: 'FBGA-676', price: 65.00, stock: 5, lead: '6-10 weeks' },
    // ========== OBSOLETE FPGA — Spartan-6 ==========
    { pn: 'XC6SLX4-2TQG144C', mfr: 'Xilinx', desc: 'Spartan-6 FPGA, 3,840 logic cells, 144-TQFP', cat: 'fpga', pkg: 'TQFP-144', price: 8.50, stock: 60, lead: '1-2 weeks' },
    { pn: 'XC6SLX9-2TQG144C', mfr: 'Xilinx', desc: 'Spartan-6 FPGA, 9,152 logic cells, 144-TQFP', cat: 'fpga', pkg: 'TQFP-144', price: 12.00, stock: 80, lead: '1-2 weeks' },
    { pn: 'XC6SLX16-2CSG324C', mfr: 'Xilinx', desc: 'Spartan-6 FPGA, 14,579 logic cells, 324-BGA', cat: 'fpga', pkg: 'CSG-324', price: 18.00, stock: 45, lead: '2-3 weeks' },
    { pn: 'XC6SLX25-2FTG256C', mfr: 'Xilinx', desc: 'Spartan-6 FPGA, 24,051 logic cells, 256-FTBGA', cat: 'fpga', pkg: 'FTBGA-256', price: 25.00, stock: 30, lead: '2-4 weeks' },
    { pn: 'XC6SLX45-2CSG324C', mfr: 'Xilinx', desc: 'Spartan-6 FPGA, 43,661 logic cells, 324-BGA', cat: 'fpga', pkg: 'CSG-324', price: 32.00, stock: 22, lead: '3-5 weeks' },
    { pn: 'XC6SLX75-2FGG484C', mfr: 'Xilinx', desc: 'Spartan-6 FPGA, 74,637 logic cells, 484-FBGA', cat: 'fpga', pkg: 'FBGA-484', price: 48.00, stock: 12, lead: '4-6 weeks' },
    { pn: 'XC6SLX100-2FGG676C', mfr: 'Xilinx', desc: 'Spartan-6 FPGA, 101,261 logic cells, 676-FBGA', cat: 'fpga', pkg: 'FBGA-676', price: 65.00, stock: 8, lead: '5-8 weeks' },
    { pn: 'XC6SLX150-2FGG676C', mfr: 'Xilinx', desc: 'Spartan-6 FPGA, 147,443 logic cells, 676-FBGA', cat: 'fpga', pkg: 'FBGA-676', price: 85.00, stock: 5, lead: '6-10 weeks' },
    // ========== OBSOLETE FPGA — Virtex-4 ==========
    { pn: 'XC4VFX12-10FFG668C', mfr: 'Xilinx', desc: 'Virtex-4 FX FPGA, PowerPC, RocketIO, 12,312 logic cells', cat: 'fpga', pkg: 'FFG-668', price: 120.00, stock: 8, lead: '6-10 weeks' },
    { pn: 'XC4VLX25-10FFG668C', mfr: 'Xilinx', desc: 'Virtex-4 LX FPGA, 24,192 logic cells, 668-FFBGA', cat: 'fpga', pkg: 'FFG-668', price: 95.00, stock: 10, lead: '5-8 weeks' },
    { pn: 'XC4VLX60-10FFG1148C', mfr: 'Xilinx', desc: 'Virtex-4 LX FPGA, 59,904 logic cells, 1148-FFBGA', cat: 'fpga', pkg: 'FFG-1148', price: 180.00, stock: 5, lead: '8-12 weeks' },
    { pn: 'XC4VSX35-10FFG668C', mfr: 'Xilinx', desc: 'Virtex-4 SX FPGA, DSP optimized, 192 XtremeDSP slices', cat: 'fpga', pkg: 'FFG-668', price: 150.00, stock: 6, lead: '6-10 weeks' },
    { pn: 'XC4VFX60-10FFG1152C', mfr: 'Xilinx', desc: 'Virtex-4 FX FPGA, dual PowerPC, 12 RocketIO, 25,280 cells', cat: 'fpga', pkg: 'FFG-1152', price: 280.00, stock: 3, lead: '10-14 weeks' },
    // ========== OBSOLETE FPGA — Virtex-5 ==========
    { pn: 'XC5VLX30-1FFG324C', mfr: 'Xilinx', desc: 'Virtex-5 LX FPGA, 30,720 logic cells, 324-FFG', cat: 'fpga', pkg: 'FFG-324', price: 85.00, stock: 12, lead: '4-6 weeks' },
    { pn: 'XC5VLX50-1FFG676C', mfr: 'Xilinx', desc: 'Virtex-5 LX FPGA, 48,768 logic cells, 676-FFG', cat: 'fpga', pkg: 'FFG-676', price: 120.00, stock: 8, lead: '5-8 weeks' },
    { pn: 'XC5VLX85-1FFG676C', mfr: 'Xilinx', desc: 'Virtex-5 LX FPGA, 84,352 logic cells, 676-FFG', cat: 'fpga', pkg: 'FFG-676', price: 180.00, stock: 5, lead: '6-10 weeks' },
    { pn: 'XC5VLX110T-1FFG1136C', mfr: 'Xilinx', desc: 'Virtex-5 LXT FPGA, 110,592 cells, GTP transceivers', cat: 'fpga', pkg: 'FFG-1136', price: 250.00, stock: 4, lead: '8-12 weeks' },
    { pn: 'XC5VFX70T-1FFG1136C', mfr: 'Xilinx', desc: 'Virtex-5 FXT FPGA, PowerPC 440, GTX transceivers', cat: 'fpga', pkg: 'FFG-1136', price: 350.00, stock: 3, lead: '10-14 weeks' },
    { pn: 'XC5VSX50T-1FFG1136C', mfr: 'Xilinx', desc: 'Virtex-5 SXT FPGA, 320 DSP48E slices, signal processing', cat: 'fpga', pkg: 'FFG-1136', price: 280.00, stock: 4, lead: '8-12 weeks' },
    // ========== OBSOLETE FPGA — Altera Cyclone II/III ==========
    { pn: 'EP2C5T144C8N', mfr: 'Altera', desc: 'Cyclone II FPGA, 4,608 LEs, 144-TQFP, low cost', cat: 'fpga', pkg: 'TQFP-144', price: 8.00, stock: 100, lead: 'In stock' },
    { pn: 'EP2C8Q208C8N', mfr: 'Altera', desc: 'Cyclone II FPGA, 8,256 LEs, 208-PQFP', cat: 'fpga', pkg: 'PQFP-208', price: 12.00, stock: 60, lead: '1-2 weeks' },
    { pn: 'EP2C20F484C7N', mfr: 'Altera', desc: 'Cyclone II FPGA, 18,752 LEs, 484-FBGA', cat: 'fpga', pkg: 'FBGA-484', price: 25.00, stock: 30, lead: '2-4 weeks' },
    { pn: 'EP2C35F672C6N', mfr: 'Altera', desc: 'Cyclone II FPGA, 33,216 LEs, 672-FBGA', cat: 'fpga', pkg: 'FBGA-672', price: 45.00, stock: 15, lead: '3-6 weeks' },
    { pn: 'EP2C70F896C6N', mfr: 'Altera', desc: 'Cyclone II FPGA, 68,416 LEs, 896-FBGA', cat: 'fpga', pkg: 'FBGA-896', price: 75.00, stock: 8, lead: '5-8 weeks' },
    { pn: 'EP3C5E144C8N', mfr: 'Altera', desc: 'Cyclone III FPGA, 5,136 LEs, 144-EQFP', cat: 'fpga', pkg: 'EQFP-144', price: 10.00, stock: 80, lead: 'In stock' },
    { pn: 'EP3C10E144C8N', mfr: 'Altera', desc: 'Cyclone III FPGA, 10,320 LEs, 144-EQFP', cat: 'fpga', pkg: 'EQFP-144', price: 14.00, stock: 55, lead: '1-2 weeks' },
    { pn: 'EP3C16F484C6N', mfr: 'Altera', desc: 'Cyclone III FPGA, 15,408 LEs, 484-FBGA', cat: 'fpga', pkg: 'FBGA-484', price: 22.00, stock: 35, lead: '2-3 weeks' },
    { pn: 'EP3C25F324C6N', mfr: 'Altera', desc: 'Cyclone III FPGA, 24,624 LEs, 324-FBGA', cat: 'fpga', pkg: 'FBGA-324', price: 30.00, stock: 20, lead: '3-5 weeks' },
    { pn: 'EP3C40F484C6N', mfr: 'Altera', desc: 'Cyclone III FPGA, 39,600 LEs, 484-FBGA', cat: 'fpga', pkg: 'FBGA-484', price: 42.00, stock: 15, lead: '4-6 weeks' },
    { pn: 'EP3C80F780C6N', mfr: 'Altera', desc: 'Cyclone III FPGA, 81,264 LEs, 780-FBGA', cat: 'fpga', pkg: 'FBGA-780', price: 65.00, stock: 8, lead: '5-8 weeks' },
    { pn: 'EP3C120F780C7N', mfr: 'Altera', desc: 'Cyclone III FPGA, 119,088 LEs, 780-FBGA', cat: 'fpga', pkg: 'FBGA-780', price: 88.00, stock: 5, lead: '6-10 weeks' },
    // ========== OBSOLETE CPLD ==========
    { pn: 'XC9572XL-10VQG64C', mfr: 'Xilinx', desc: 'XC9500XL CPLD, 72 macrocells, 3.3V, 64-VQFP', cat: 'cpld', pkg: 'VQFP-64', price: 4.50, stock: 120, lead: 'In stock' },
    { pn: 'XC9536XL-10VQG44C', mfr: 'Xilinx', desc: 'XC9500XL CPLD, 36 macrocells, 3.3V, 44-VQFP', cat: 'cpld', pkg: 'VQFP-44', price: 3.20, stock: 150, lead: 'In stock' },
    { pn: 'XC2C256-7TQG144C', mfr: 'Xilinx', desc: 'CoolRunner-II CPLD, 256 macrocells, 144-TQFP', cat: 'cpld', pkg: 'TQFP-144', price: 8.00, stock: 45, lead: '2-3 weeks' },
    { pn: 'XC2C384-7FTG256C', mfr: 'Xilinx', desc: 'CoolRunner-II CPLD, 384 macrocells, 256-FTBGA', cat: 'cpld', pkg: 'FTBGA-256', price: 12.00, stock: 25, lead: '3-5 weeks' },
    { pn: 'EPM7128STC100-15N', mfr: 'Altera', desc: 'MAX 7000S CPLD, 128 macrocells, 100-TQFP, 5V', cat: 'cpld', pkg: 'TQFP-100', price: 15.00, stock: 20, lead: '4-6 weeks' },
    { pn: 'EPM3256ATC144-10N', mfr: 'Altera', desc: 'MAX 3000A CPLD, 256 macrocells, 144-TQFP', cat: 'cpld', pkg: 'TQFP-144', price: 18.00, stock: 15, lead: '4-6 weeks' },
    { pn: 'EPM240T100C5N', mfr: 'Altera', desc: 'MAX II CPLD, 240 LEs, 100-TQFP, ultra-low power', cat: 'cpld', pkg: 'TQFP-100', price: 5.50, stock: 90, lead: 'In stock' },
    { pn: 'EPM570T144C5N', mfr: 'Altera', desc: 'MAX II CPLD, 570 LEs, 144-TQFP', cat: 'cpld', pkg: 'TQFP-144', price: 7.50, stock: 60, lead: '1-2 weeks' },
    // ========== OBSOLETE — Actel/Microsemi FPGA ==========
    { pn: 'A3P250-FGG256', mfr: 'Microsemi', desc: 'ProASIC3 FPGA, 250K gates, Flash-based, non-volatile', cat: 'fpga', pkg: 'FGG-256', price: 28.00, stock: 20, lead: '3-5 weeks' },
    { pn: 'A3P1000-FGG484', mfr: 'Microsemi', desc: 'ProASIC3 FPGA, 1M gates, Flash-based, non-volatile', cat: 'fpga', pkg: 'FGG-484', price: 55.00, stock: 10, lead: '5-8 weeks' },
    { pn: 'A3PE3000-FGG896', mfr: 'Microsemi', desc: 'ProASIC3E FPGA, 3M gates, enhanced I/O, 896-FBGA', cat: 'fpga', pkg: 'FGG-896', price: 120.00, stock: 4, lead: '8-12 weeks' },
    { pn: 'AX2000-FGG896', mfr: 'Microsemi', desc: 'Axcelerator FPGA, antifuse, radiation-tolerant, 2M gates', cat: 'fpga', pkg: 'FGG-896', price: 450.00, stock: 2, lead: '12-16 weeks' },
    // ========== MILITARY/AEROSPACE GRADE ==========
    // Rad-hard FPGAs
    { pn: 'RTAX2000S-CQ352V', mfr: 'Microsemi', desc: 'RTAX-S radiation-hardened FPGA, 2M gates, antifuse', cat: 'military-aerospace', pkg: 'CQFP-352', price: 2800.00, stock: 2, lead: '16-24 weeks' },
    { pn: 'RTSX72SU-CQ208V', mfr: 'Microsemi', desc: 'RTSX-SU radiation-tolerant FPGA, 72K gates, antifuse', cat: 'military-aerospace', pkg: 'CQFP-208', price: 1200.00, stock: 3, lead: '12-20 weeks' },
    { pn: 'XQR5VFX130-1CN1752V', mfr: 'Xilinx', desc: 'Virtex-5QV rad-hard FPGA, 130K cells, space-grade', cat: 'military-aerospace', pkg: 'CCGA-1752', price: 15000.00, stock: 1, lead: '20-30 weeks' },
    // MIL-spec voltage regulators
    { pn: 'LM317MBSX/883', mfr: 'Texas Instruments', desc: 'Adjustable voltage regulator, MIL-STD-883, -55°C to +150°C', cat: 'military-aerospace', pkg: 'TO-263', price: 45.00, stock: 25, lead: '4-6 weeks' },
    { pn: 'LM7805CT/883', mfr: 'Texas Instruments', desc: '5V fixed voltage regulator, MIL-STD-883 Class B', cat: 'military-aerospace', pkg: 'TO-220', price: 35.00, stock: 30, lead: '3-5 weeks' },
    { pn: 'LT1085MK-3.3/883', mfr: 'Linear Technology', desc: '3.3V 3A LDO regulator, MIL-STD-883, ceramic package', cat: 'military-aerospace', pkg: 'TO-3', price: 85.00, stock: 10, lead: '6-10 weeks' },
    // MIL-spec op-amps
    { pn: 'OP07CSZ/883B', mfr: 'Analog Devices', desc: 'Ultra-low offset voltage op-amp, MIL-STD-883B, CDIP-8', cat: 'military-aerospace', pkg: 'CDIP-8', price: 55.00, stock: 20, lead: '4-8 weeks' },
    { pn: 'AD797BRZ/883B', mfr: 'Analog Devices', desc: 'Ultralow distortion op-amp, MIL-STD-883B, ceramic SOIC', cat: 'military-aerospace', pkg: 'CSOIC-8', price: 120.00, stock: 8, lead: '6-10 weeks' },
    { pn: 'LF356H/883', mfr: 'Texas Instruments', desc: 'JFET input op-amp, MIL-STD-883, TO-99 metal can', cat: 'military-aerospace', pkg: 'TO-99', price: 40.00, stock: 25, lead: '4-6 weeks' },
    { pn: 'OPA2277UA/883', mfr: 'Texas Instruments', desc: 'Dual precision op-amp, MIL-STD-883, CDIP-8', cat: 'military-aerospace', pkg: 'CDIP-8', price: 65.00, stock: 12, lead: '5-8 weeks' },
    // MIL-spec ADC/DAC
    { pn: 'AD574ATDZ/883B', mfr: 'Analog Devices', desc: '12-bit ADC, 25µs, MIL-STD-883B, 28-pin CDIP', cat: 'military-aerospace', pkg: 'CDIP-28', price: 180.00, stock: 5, lead: '8-12 weeks' },
    { pn: 'DAC8043FS/883B', mfr: 'Analog Devices', desc: '12-bit serial DAC, MIL-STD-883B, ceramic DIP', cat: 'military-aerospace', pkg: 'CDIP-8', price: 95.00, stock: 8, lead: '6-10 weeks' },
    { pn: 'AD7891ASZ-1/883B', mfr: 'Analog Devices', desc: '8-channel 12-bit ADC, MIL-STD-883B, 44-MQFP', cat: 'military-aerospace', pkg: 'MQFP-44', price: 220.00, stock: 4, lead: '10-14 weeks' },
    // MIL-spec memory
    { pn: 'UT8Q512K8-UCC', mfr: 'Cobham', desc: 'Rad-hard 4Mb SRAM (512K x 8), QML Class Q, space-grade', cat: 'military-aerospace', pkg: 'CQFP-44', price: 850.00, stock: 3, lead: '16-24 weeks' },
    { pn: 'UT28F256LVQMLE', mfr: 'Cobham', desc: 'Rad-hard 256K Flash, QML V, single-event latchup immune', cat: 'military-aerospace', pkg: 'CQFP-32', price: 680.00, stock: 4, lead: '12-20 weeks' },
    { pn: 'AT68166H-55DM/883', mfr: 'Atmel', desc: '64K x 4 dual-port SRAM, MIL-STD-883, 55ns', cat: 'military-aerospace', pkg: 'CDIP-48', price: 350.00, stock: 5, lead: '10-14 weeks' },
    // MIL-spec interface
    { pn: 'HS-26CT31RH', mfr: 'Renesas', desc: 'Rad-hard RS-422 quad line driver, QML Class V', cat: 'military-aerospace', pkg: 'CDFP-16', price: 280.00, stock: 6, lead: '10-14 weeks' },
    { pn: 'HS-26CT32RH', mfr: 'Renesas', desc: 'Rad-hard RS-422 quad line receiver, QML Class V', cat: 'military-aerospace', pkg: 'CDFP-16', price: 280.00, stock: 6, lead: '10-14 weeks' },
    { pn: 'SN55176BDR/883', mfr: 'Texas Instruments', desc: 'RS-485 transceiver, MIL-STD-883, ceramic DIP', cat: 'military-aerospace', pkg: 'CDIP-8', price: 75.00, stock: 15, lead: '5-8 weeks' },
    // MIL-spec power MOSFETs
    { pn: 'JANSR2N7520U3', mfr: 'International Rectifier', desc: 'JAN N-channel MOSFET, 100V, 24A, rad-hard, TO-254AA', cat: 'military-aerospace', pkg: 'TO-254AA', price: 450.00, stock: 8, lead: '8-12 weeks' },
    { pn: 'JANS2N7538', mfr: 'International Rectifier', desc: 'JAN N-channel MOSFET, 200V, 10A, MIL-PRF-19500', cat: 'military-aerospace', pkg: 'TO-254AA', price: 320.00, stock: 10, lead: '6-10 weeks' },
    // Rad-hard MCUs and DSPs
    { pn: 'UT699E-RHF', mfr: 'Cobham', desc: 'LEON3FT rad-hard SPARC V8 processor, 100MHz, space-grade', cat: 'military-aerospace', pkg: 'CQFP-256', price: 8500.00, stock: 1, lead: '24-36 weeks' },
    { pn: 'TSC21020F-25M/883B', mfr: 'Teledyne e2v', desc: 'Rad-hard 32-bit floating-point DSP, 25MFLOPS, MIL-STD-883', cat: 'military-aerospace', pkg: 'CQFP-240', price: 3200.00, stock: 2, lead: '16-24 weeks' },
    // Rad-hard DC-DC converters
    { pn: 'ISL70001ASEH', mfr: 'Renesas', desc: 'Rad-hard point-of-load regulator, 6A, QML Class V', cat: 'military-aerospace', pkg: 'CDFP-24', price: 950.00, stock: 4, lead: '12-16 weeks' },
    { pn: 'ISL70005SEH', mfr: 'Renesas', desc: 'Rad-hard 5V/3.3V LDO regulator, 500mA, QML V', cat: 'military-aerospace', pkg: 'CDFP-14', price: 480.00, stock: 6, lead: '10-14 weeks' },
    // ========== OBSOLETE — Lattice FPGA ==========
    { pn: 'LFXP2-5E-5TN144C', mfr: 'Lattice Semiconductor', desc: 'XP2 FPGA, 5K LUTs, non-volatile, 144-TQFP', cat: 'fpga', pkg: 'TQFP-144', price: 10.00, stock: 40, lead: '2-3 weeks' },
    { pn: 'LFXP2-17E-6FN484C', mfr: 'Lattice Semiconductor', desc: 'XP2 FPGA, 17K LUTs, non-volatile, 484-FPBGA', cat: 'fpga', pkg: 'FPBGA-484', price: 28.00, stock: 15, lead: '4-6 weeks' },
    { pn: 'LFE2-35E-5FN484C', mfr: 'Lattice Semiconductor', desc: 'ECP2 FPGA, 33K LUTs, SERDES, 484-FPBGA', cat: 'fpga', pkg: 'FPBGA-484', price: 35.00, stock: 12, lead: '4-6 weeks' },
    { pn: 'LFE3-35EA-6FN672C', mfr: 'Lattice Semiconductor', desc: 'ECP3 FPGA, 33K LUTs, SERDES, PCI Express, 672-FPBGA', cat: 'fpga', pkg: 'FPBGA-672', price: 55.00, stock: 8, lead: '5-8 weeks' },
    // ========== OBSOLETE — Altera Stratix/MAX ==========
    { pn: 'EP1S10F484C5N', mfr: 'Altera', desc: 'Stratix FPGA, 10,570 LEs, embedded memory, 484-FBGA', cat: 'fpga', pkg: 'FBGA-484', price: 65.00, stock: 6, lead: '6-10 weeks' },
    { pn: 'EP1S25F672C6N', mfr: 'Altera', desc: 'Stratix FPGA, 25,660 LEs, DSP blocks, 672-FBGA', cat: 'fpga', pkg: 'FBGA-672', price: 120.00, stock: 4, lead: '8-12 weeks' },
    { pn: 'EP2S30F672C3N', mfr: 'Altera', desc: 'Stratix II FPGA, 33,880 ALUTs, 672-FBGA', cat: 'fpga', pkg: 'FBGA-672', price: 150.00, stock: 3, lead: '8-12 weeks' },
    { pn: 'EP2S60F1020C3N', mfr: 'Altera', desc: 'Stratix II FPGA, 60,440 ALUTs, 1020-FBGA', cat: 'fpga', pkg: 'FBGA-1020', price: 280.00, stock: 2, lead: '10-14 weeks' },
    { pn: 'EP1C6T144C8N', mfr: 'Altera', desc: 'Cyclone I FPGA, 5,980 LEs, 144-TQFP, legacy design', cat: 'fpga', pkg: 'TQFP-144', price: 12.00, stock: 35, lead: '2-4 weeks' },
    { pn: 'EP1C12Q240C8N', mfr: 'Altera', desc: 'Cyclone I FPGA, 12,060 LEs, 240-PQFP', cat: 'fpga', pkg: 'PQFP-240', price: 22.00, stock: 18, lead: '3-5 weeks' },
    { pn: 'EP1C20F400C7N', mfr: 'Altera', desc: 'Cyclone I FPGA, 20,060 LEs, 400-FBGA', cat: 'fpga', pkg: 'FBGA-400', price: 35.00, stock: 10, lead: '4-6 weeks' },
    // ========== OBSOLETE DSP Processors ==========
    { pn: 'TMS320C6713BZDP300', mfr: 'Texas Instruments', desc: 'C6000 floating-point DSP, 300MHz, 2400MFLOPS', cat: 'dsp', pkg: 'BGA-208', price: 45.00, stock: 15, lead: '4-6 weeks' },
    { pn: 'TMS320F28335PGFA', mfr: 'Texas Instruments', desc: 'C2000 MCU+DSP, 150MHz, FPU, 176-LQFP', cat: 'dsp', pkg: 'LQFP-176', price: 28.00, stock: 25, lead: '3-5 weeks' },
    { pn: 'ADSP-21489KSWZ-4A', mfr: 'Analog Devices', desc: 'SHARC DSP, 400MHz, 2400MMACS, audio processing', cat: 'dsp', pkg: 'LQFP-176', price: 35.00, stock: 18, lead: '4-6 weeks' },
    { pn: 'ADSP-BF533SBBZ500', mfr: 'Analog Devices', desc: 'Blackfin DSP, 500MHz, video/audio processing', cat: 'dsp', pkg: 'BGA-160', price: 22.00, stock: 20, lead: '3-5 weeks' },
    { pn: 'TMS320C6455BZTZ1000', mfr: 'Texas Instruments', desc: 'C6000 fixed-point DSP, 1GHz, 8000MMACS', cat: 'dsp', pkg: 'BGA-529', price: 85.00, stock: 8, lead: '6-10 weeks' },
    { pn: 'ADSP-TS201SABPZ060', mfr: 'Analog Devices', desc: 'TigerSHARC DSP, 600MHz, 3600MFLOPS, multiprocessor', cat: 'dsp', pkg: 'BGA-576', price: 120.00, stock: 5, lead: '8-12 weeks' },
  ];

  let created = 0, skipped = 0;
  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { partNumber: p.pn } });
    if (existing) { skipped++; continue; }
    await prisma.product.create({
      data: {
        partNumber: p.pn, manufacturer: p.mfr, description: p.desc,
        categoryId: catMap[p.cat] || null, packageType: p.pkg,
        mountType: 'SMD', minPrice: p.price, stock: p.stock,
        moq: 1, leadTime: p.lead, status: 'active',
      },
    });
    created++;
  }

  const total = await prisma.product.count();
  console.log(`\n✅ Batch 1 complete! Created: ${created}, Skipped: ${skipped}`);
  console.log(`Total products in database: ${total}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
