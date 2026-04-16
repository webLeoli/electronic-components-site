import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const cats = {
    'microcontrollers': 'Microcontrollers',
    'memory': 'Memory',
    'analog': 'Analog & Mixed Signal',
    'power-management': 'Power Management',
  };
  const catMap = {};
  for (const [slug, name] of Object.entries(cats)) {
    const c = await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
    catMap[slug] = c.id;
  }
  const mfrs = ['STMicroelectronics','NXP','Microchip','Atmel','Freescale','Renesas',
    'Cypress Semiconductor','Silicon Labs','Nuvoton','GigaDevice','Texas Instruments',
    'Analog Devices','Maxim Integrated','Linear Technology','Infineon','ON Semiconductor',
    'Micron','ISSI','Spansion','SST','Winbond','Macronix','Samsung'];
  for (const name of mfrs) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    await prisma.manufacturer.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }

  const products = [
    // ========== SCARCE/OBSOLETE STM32 ==========
    { pn: 'STM32F103C8T6', mfr: 'STMicroelectronics', desc: 'ARM Cortex-M3 MCU, 64KB Flash, 20KB SRAM, 72MHz, Blue Pill', cat: 'microcontrollers', pkg: 'LQFP-48', price: 3.50, stock: 500, lead: 'In stock' },
    { pn: 'STM32F103RCT6', mfr: 'STMicroelectronics', desc: 'ARM Cortex-M3 MCU, 256KB Flash, 48KB SRAM, 72MHz', cat: 'microcontrollers', pkg: 'LQFP-64', price: 6.80, stock: 200, lead: 'In stock' },
    { pn: 'STM32F103VET6', mfr: 'STMicroelectronics', desc: 'ARM Cortex-M3 MCU, 512KB Flash, 64KB SRAM, 72MHz', cat: 'microcontrollers', pkg: 'LQFP-100', price: 9.50, stock: 120, lead: '1-2 weeks' },
    { pn: 'STM32F103ZET6', mfr: 'STMicroelectronics', desc: 'ARM Cortex-M3 MCU, 512KB Flash, 64KB SRAM, 144-pin', cat: 'microcontrollers', pkg: 'LQFP-144', price: 12.00, stock: 80, lead: '2-3 weeks' },
    { pn: 'STM32F105RBT6', mfr: 'STMicroelectronics', desc: 'Connectivity line MCU, USB OTG, dual CAN, 128KB Flash', cat: 'microcontrollers', pkg: 'LQFP-64', price: 8.50, stock: 60, lead: '2-4 weeks' },
    { pn: 'STM32F107VCT6', mfr: 'STMicroelectronics', desc: 'Connectivity line MCU, Ethernet, USB OTG, 256KB Flash', cat: 'microcontrollers', pkg: 'LQFP-100', price: 11.00, stock: 45, lead: '3-5 weeks' },
    { pn: 'STM32F205RGT6', mfr: 'STMicroelectronics', desc: 'ARM Cortex-M3 MCU, 1MB Flash, 128KB SRAM, 120MHz', cat: 'microcontrollers', pkg: 'LQFP-64', price: 10.50, stock: 55, lead: '2-4 weeks' },
    { pn: 'STM32F207ZGT6', mfr: 'STMicroelectronics', desc: 'ARM Cortex-M3 MCU, 1MB Flash, Ethernet, 144-LQFP', cat: 'microcontrollers', pkg: 'LQFP-144', price: 15.00, stock: 30, lead: '3-5 weeks' },
    { pn: 'STM32F405RGT6', mfr: 'STMicroelectronics', desc: 'ARM Cortex-M4 MCU, 1MB Flash, 192KB SRAM, 168MHz, DSP+FPU', cat: 'microcontrollers', pkg: 'LQFP-64', price: 11.00, stock: 90, lead: '1-2 weeks' },
    { pn: 'STM32F427VIT6', mfr: 'STMicroelectronics', desc: 'ARM Cortex-M4 MCU, 2MB Flash, 256KB SRAM, 180MHz', cat: 'microcontrollers', pkg: 'LQFP-100', price: 16.00, stock: 40, lead: '3-5 weeks' },
    { pn: 'STM32F429ZIT6', mfr: 'STMicroelectronics', desc: 'ARM Cortex-M4 MCU, 2MB Flash, LCD-TFT controller, 180MHz', cat: 'microcontrollers', pkg: 'LQFP-144', price: 18.50, stock: 35, lead: '3-5 weeks' },
    { pn: 'STM32F446RET6', mfr: 'STMicroelectronics', desc: 'ARM Cortex-M4 MCU, 512KB Flash, 128KB SRAM, 180MHz', cat: 'microcontrollers', pkg: 'LQFP-64', price: 8.00, stock: 110, lead: '1-2 weeks' },
    { pn: 'STM32F767ZIT6', mfr: 'STMicroelectronics', desc: 'ARM Cortex-M7 MCU, 2MB Flash, 512KB SRAM, 216MHz', cat: 'microcontrollers', pkg: 'LQFP-144', price: 20.00, stock: 25, lead: '4-6 weeks' },
    { pn: 'STM32L151RBT6', mfr: 'STMicroelectronics', desc: 'Ultra-low-power ARM Cortex-M3 MCU, 128KB Flash, 16KB SRAM', cat: 'microcontrollers', pkg: 'LQFP-64', price: 5.50, stock: 75, lead: '2-3 weeks' },
    { pn: 'STM32L476RGT6', mfr: 'STMicroelectronics', desc: 'Ultra-low-power ARM Cortex-M4 MCU, 1MB Flash, 128KB SRAM', cat: 'microcontrollers', pkg: 'LQFP-64', price: 9.00, stock: 65, lead: '2-3 weeks' },
    // ========== OBSOLETE PIC/AVR ==========
    { pn: 'PIC18F4550-I/PT', mfr: 'Microchip', desc: 'PIC18 MCU, USB 2.0, 32KB Flash, 44-TQFP', cat: 'microcontrollers', pkg: 'TQFP-44', price: 4.50, stock: 150, lead: 'In stock' },
    { pn: 'PIC18F4680-I/PT', mfr: 'Microchip', desc: 'PIC18 MCU, CAN, 64KB Flash, ECAN module, 44-TQFP', cat: 'microcontrollers', pkg: 'TQFP-44', price: 6.00, stock: 80, lead: '1-2 weeks' },
    { pn: 'PIC16F877A-I/PT', mfr: 'Microchip', desc: 'PIC16 MCU, 14KB Flash, ADC, USART, classic legacy', cat: 'microcontrollers', pkg: 'TQFP-44', price: 5.00, stock: 100, lead: 'In stock' },
    { pn: 'PIC24FJ128GA010-I/PT', mfr: 'Microchip', desc: 'PIC24 16-bit MCU, 128KB Flash, 8KB SRAM, 100-TQFP', cat: 'microcontrollers', pkg: 'TQFP-100', price: 7.50, stock: 45, lead: '2-4 weeks' },
    { pn: 'DSPIC33FJ256GP710-I/PF', mfr: 'Microchip', desc: 'dsPIC33 DSC, 256KB Flash, 30KB SRAM, motor control', cat: 'microcontrollers', pkg: 'TQFP-100', price: 9.00, stock: 35, lead: '3-5 weeks' },
    { pn: 'ATMEGA328P-AU', mfr: 'Atmel', desc: 'AVR MCU, 32KB Flash, 2KB SRAM, 20MHz, Arduino compatible', cat: 'microcontrollers', pkg: 'TQFP-32', price: 2.50, stock: 300, lead: 'In stock' },
    { pn: 'ATMEGA2560-16AU', mfr: 'Atmel', desc: 'AVR MCU, 256KB Flash, 8KB SRAM, 16MHz, Arduino Mega', cat: 'microcontrollers', pkg: 'TQFP-100', price: 12.00, stock: 60, lead: '2-3 weeks' },
    { pn: 'ATMEGA128A-AU', mfr: 'Atmel', desc: 'AVR MCU, 128KB Flash, 4KB SRAM, 16MHz, legacy industrial', cat: 'microcontrollers', pkg: 'TQFP-64', price: 6.50, stock: 85, lead: '1-2 weeks' },
    { pn: 'AT91SAM7S256-AU', mfr: 'Atmel', desc: 'ARM7TDMI MCU, 256KB Flash, USB, legacy embedded', cat: 'microcontrollers', pkg: 'LQFP-64', price: 8.00, stock: 30, lead: '4-6 weeks' },
    { pn: 'AT91SAM9G20B-CU', mfr: 'Atmel', desc: 'ARM9 processor, 400MHz, Ethernet, USB, Linux capable', cat: 'microcontrollers', pkg: 'BGA-217', price: 12.00, stock: 20, lead: '4-8 weeks' },
    // ========== OBSOLETE NXP/Freescale ==========
    { pn: 'LPC1768FBD100', mfr: 'NXP', desc: 'ARM Cortex-M3 MCU, 512KB Flash, 64KB SRAM, Ethernet, USB', cat: 'microcontrollers', pkg: 'LQFP-100', price: 8.50, stock: 70, lead: '1-2 weeks' },
    { pn: 'LPC2368FBD100', mfr: 'NXP', desc: 'ARM7TDMI-S MCU, 512KB Flash, Ethernet, USB, CAN', cat: 'microcontrollers', pkg: 'LQFP-100', price: 10.00, stock: 35, lead: '3-5 weeks' },
    { pn: 'MK60FX512VLQ15', mfr: 'NXP', desc: 'Kinetis K60 ARM Cortex-M4 MCU, 512KB Flash, 150MHz, Ethernet', cat: 'microcontrollers', pkg: 'LQFP-144', price: 14.00, stock: 25, lead: '3-6 weeks' },
    { pn: 'MC9S12XDP512CAL', mfr: 'NXP', desc: 'S12X 16-bit MCU, 512KB Flash, CAN, automotive grade', cat: 'microcontrollers', pkg: 'LQFP-112', price: 15.00, stock: 20, lead: '4-6 weeks' },
    { pn: 'MCF52235CAL60', mfr: 'NXP', desc: 'ColdFire V2 MCU, 256KB Flash, Ethernet, USB, 60MHz', cat: 'microcontrollers', pkg: 'LQFP-100', price: 9.00, stock: 30, lead: '4-8 weeks' },
    // ========== OBSOLETE Renesas/Cypress ==========
    { pn: 'R5F100LEAFB#V0', mfr: 'Renesas', desc: 'RL78/G13 MCU, 64KB Flash, 4KB SRAM, ultra-low power', cat: 'microcontrollers', pkg: 'LQFP-48', price: 2.80, stock: 120, lead: '1-2 weeks' },
    { pn: 'R5F562N8BDFB#V1', mfr: 'Renesas', desc: 'RX62N MCU, 512KB Flash, Ethernet, USB, TFT controller', cat: 'microcontrollers', pkg: 'LQFP-144', price: 12.00, stock: 25, lead: '4-6 weeks' },
    { pn: 'CY8C5888AXI-LP096', mfr: 'Cypress Semiconductor', desc: 'PSoC 5LP, ARM Cortex-M3, programmable analog, 80MHz', cat: 'microcontrollers', pkg: 'TQFP-100', price: 11.00, stock: 30, lead: '3-5 weeks' },
    { pn: 'CY8C3866AXI-040', mfr: 'Cypress Semiconductor', desc: 'PSoC 3, 8051 core, programmable analog+digital blocks', cat: 'microcontrollers', pkg: 'TQFP-100', price: 8.00, stock: 40, lead: '3-5 weeks' },
    { pn: 'MB90F543GSPF-GS', mfr: 'Cypress Semiconductor', desc: 'Fujitsu legacy 16-bit MCU, 544KB Flash, CAN, LCD', cat: 'microcontrollers', pkg: 'LQFP-100', price: 15.00, stock: 15, lead: '6-10 weeks' },
    // ========== OBSOLETE MEMORY — EPROM ==========
    { pn: 'M27C256B-12F1', mfr: 'STMicroelectronics', desc: 'UV EPROM, 256Kb (32K x 8), 120ns, CDIP-28', cat: 'memory', pkg: 'CDIP-28', price: 8.00, stock: 50, lead: '2-4 weeks' },
    { pn: 'M27C512-12F1', mfr: 'STMicroelectronics', desc: 'UV EPROM, 512Kb (64K x 8), 120ns, CDIP-28', cat: 'memory', pkg: 'CDIP-28', price: 10.00, stock: 35, lead: '3-5 weeks' },
    { pn: 'M27C1001-10F1', mfr: 'STMicroelectronics', desc: 'UV EPROM, 1Mb (128K x 8), 100ns, CDIP-32', cat: 'memory', pkg: 'CDIP-32', price: 12.00, stock: 25, lead: '4-6 weeks' },
    { pn: 'M27C2001-10F1', mfr: 'STMicroelectronics', desc: 'UV EPROM, 2Mb (256K x 8), 100ns, CDIP-32', cat: 'memory', pkg: 'CDIP-32', price: 15.00, stock: 20, lead: '4-8 weeks' },
    { pn: 'M27C4001-10F1', mfr: 'STMicroelectronics', desc: 'UV EPROM, 4Mb (512K x 8), 100ns, CDIP-32', cat: 'memory', pkg: 'CDIP-32', price: 18.00, stock: 15, lead: '5-8 weeks' },
    { pn: 'AM27C010-120DC', mfr: 'ON Semiconductor', desc: 'UV EPROM, 1Mb (128K x 8), 120ns, CDIP-32, legacy', cat: 'memory', pkg: 'CDIP-32', price: 14.00, stock: 20, lead: '4-6 weeks' },
    // ========== OBSOLETE — EEPROM ==========
    { pn: 'AT28C256-15PU', mfr: 'Atmel', desc: 'Parallel EEPROM, 256Kb (32K x 8), 150ns, DIP-28', cat: 'memory', pkg: 'DIP-28', price: 6.00, stock: 80, lead: '1-2 weeks' },
    { pn: 'AT28C64B-15PU', mfr: 'Atmel', desc: 'Parallel EEPROM, 64Kb (8K x 8), 150ns, DIP-28', cat: 'memory', pkg: 'DIP-28', price: 4.50, stock: 100, lead: 'In stock' },
    { pn: 'X28C256P-25', mfr: 'Renesas', desc: 'Parallel EEPROM, 256Kb (32K x 8), 250ns, DIP-28', cat: 'memory', pkg: 'DIP-28', price: 8.00, stock: 30, lead: '3-5 weeks' },
    // ========== OBSOLETE — Static RAM ==========
    { pn: 'CY7C1041DV33-10ZSXI', mfr: 'Cypress Semiconductor', desc: 'Async SRAM, 4Mb (256K x 16), 10ns, 44-TSOP', cat: 'memory', pkg: 'TSOP-44', price: 8.50, stock: 40, lead: '2-4 weeks' },
    { pn: 'IS61WV51216BLL-10TLI', mfr: 'ISSI', desc: 'Async SRAM, 8Mb (512K x 16), 10ns, 44-TSOP', cat: 'memory', pkg: 'TSOP-44', price: 6.50, stock: 55, lead: '1-2 weeks' },
    { pn: 'IS62WV12816BLL-55TLI', mfr: 'ISSI', desc: 'Async SRAM, 2Mb (128K x 16), 55ns, low power, 44-TSOP', cat: 'memory', pkg: 'TSOP-44', price: 4.00, stock: 80, lead: 'In stock' },
    { pn: 'CY62256NLL-70PXC', mfr: 'Cypress Semiconductor', desc: 'Async SRAM, 256Kb (32K x 8), 70ns, DIP-28, legacy', cat: 'memory', pkg: 'DIP-28', price: 3.50, stock: 90, lead: 'In stock' },
    { pn: 'AS6C4008-55PCN', mfr: 'Alliance Memory', desc: 'Async SRAM, 4Mb (512K x 8), 55ns, DIP-32', cat: 'memory', pkg: 'DIP-32', price: 5.00, stock: 60, lead: '1-2 weeks' },
    // ========== OBSOLETE — Parallel NOR Flash ==========
    { pn: 'SST39VF1601-70-4C-EKE', mfr: 'Microchip', desc: 'NOR Flash, 16Mb (1M x 16), parallel, 70ns, 48-TSOP', cat: 'memory', pkg: 'TSOP-48', price: 4.50, stock: 65, lead: '1-2 weeks' },
    { pn: 'SST39VF6401B-70-4I-EKE', mfr: 'Microchip', desc: 'NOR Flash, 64Mb (4M x 16), parallel, 70ns, 48-TSOP', cat: 'memory', pkg: 'TSOP-48', price: 7.00, stock: 40, lead: '2-3 weeks' },
    { pn: 'S29AL016J70TFI020', mfr: 'Infineon', desc: 'NOR Flash, 16Mb, parallel, 70ns, boot sector, 48-TSOP', cat: 'memory', pkg: 'TSOP-48', price: 5.50, stock: 50, lead: '2-3 weeks' },
    { pn: 'S29GL128P90TFIR2', mfr: 'Infineon', desc: 'NOR Flash, 128Mb, parallel, 90ns, MirrorBit, TSOP-56', cat: 'memory', pkg: 'TSOP-56', price: 8.00, stock: 30, lead: '3-5 weeks' },
    { pn: 'MX29LV640EBTI-70G', mfr: 'Macronix', desc: 'NOR Flash, 64Mb (4M x 16), 70ns, bottom boot, 48-TSOP', cat: 'memory', pkg: 'TSOP-48', price: 5.00, stock: 45, lead: '2-3 weeks' },
    // ========== OBSOLETE — Legacy SPI Flash ==========
    { pn: 'SST25VF016B-50-4C-S2AF', mfr: 'Microchip', desc: 'SPI Flash, 16Mb, 50MHz, legacy serial NOR', cat: 'memory', pkg: 'SOIC-8', price: 1.80, stock: 200, lead: 'In stock' },
    { pn: 'AT45DB321D-SU', mfr: 'Atmel', desc: 'DataFlash, 32Mb, SPI, page erase, legacy design', cat: 'memory', pkg: 'SOIC-8', price: 3.50, stock: 80, lead: '1-2 weeks' },
    { pn: 'M25P64-VMF6TP', mfr: 'Micron', desc: 'SPI Flash, 64Mb, 75MHz, legacy Numonyx part', cat: 'memory', pkg: 'VDFPN-8', price: 3.00, stock: 100, lead: 'In stock' },
    // ========== OBSOLETE ANALOG — ADC ==========
    { pn: 'AD7606BSTZ', mfr: 'Analog Devices', desc: '16-bit ADC, 8-channel simultaneous sampling, 200kSPS', cat: 'analog', pkg: 'LQFP-64', price: 25.00, stock: 30, lead: '3-5 weeks' },
    { pn: 'ADS8568SPM', mfr: 'Texas Instruments', desc: '16-bit ADC, 8-channel, simultaneous sampling, 510kSPS', cat: 'analog', pkg: 'LQFP-64', price: 22.00, stock: 20, lead: '4-6 weeks' },
    { pn: 'AD7656BSTZ', mfr: 'Analog Devices', desc: '16-bit ADC, 6-channel, 250kSPS, bipolar input', cat: 'analog', pkg: 'LQFP-64', price: 28.00, stock: 15, lead: '4-8 weeks' },
    { pn: 'AD7616BSTZ', mfr: 'Analog Devices', desc: '16-bit ADC, 16-channel, 1MSPS, DAS, sequencer', cat: 'analog', pkg: 'LQFP-80', price: 35.00, stock: 12, lead: '5-8 weeks' },
    { pn: 'ADS1278IPAP', mfr: 'Texas Instruments', desc: '24-bit ADC, 8-channel, 144kSPS, delta-sigma, seismic', cat: 'analog', pkg: 'HTQFP-64', price: 18.00, stock: 25, lead: '3-5 weeks' },
    // ========== OBSOLETE ANALOG — DAC ==========
    { pn: 'AD5764RBSUZ', mfr: 'Analog Devices', desc: '16-bit DAC, 4-channel, ±10V bipolar output, SPI', cat: 'analog', pkg: 'TSSOP-28', price: 22.00, stock: 18, lead: '4-6 weeks' },
    { pn: 'DAC7724U', mfr: 'Texas Instruments', desc: '14-bit DAC, 4-channel, bipolar outputs, parallel input', cat: 'analog', pkg: 'SOIC-28', price: 15.00, stock: 20, lead: '3-5 weeks' },
    { pn: 'AD5755-1ACPZ', mfr: 'Analog Devices', desc: '16-bit DAC, 4-channel, 4-20mA/±10V industrial output', cat: 'analog', pkg: 'LFCSP-64', price: 28.00, stock: 12, lead: '5-8 weeks' },
    // ========== OBSOLETE ANALOG — Op-Amps ==========
    { pn: 'AD8099ARDZ', mfr: 'Analog Devices', desc: 'Ultralow distortion op-amp, 3.8GHz GBW, -160dBc/Hz', cat: 'analog', pkg: 'SOIC-8', price: 8.50, stock: 45, lead: '2-3 weeks' },
    { pn: 'OPA2134PA', mfr: 'Texas Instruments', desc: 'Dual FET-input audio op-amp, low distortion, DIP-8', cat: 'analog', pkg: 'DIP-8', price: 5.50, stock: 80, lead: 'In stock' },
    { pn: 'NE5532AP', mfr: 'Texas Instruments', desc: 'Dual low-noise op-amp, audio grade, DIP-8, legacy', cat: 'analog', pkg: 'DIP-8', price: 1.20, stock: 500, lead: 'In stock' },
    { pn: 'LM358AN/NOPB', mfr: 'Texas Instruments', desc: 'Dual op-amp, single supply, DIP-8, legacy industrial', cat: 'analog', pkg: 'DIP-8', price: 0.50, stock: 800, lead: 'In stock' },
    { pn: 'TL074CN', mfr: 'Texas Instruments', desc: 'Quad JFET op-amp, low noise, DIP-14, legacy', cat: 'analog', pkg: 'DIP-14', price: 0.80, stock: 600, lead: 'In stock' },
    { pn: 'AD620ANZ', mfr: 'Analog Devices', desc: 'Instrumentation amplifier, low cost, gain 1-10000, DIP-8', cat: 'analog', pkg: 'DIP-8', price: 8.00, stock: 100, lead: 'In stock' },
    { pn: 'INA128PA', mfr: 'Texas Instruments', desc: 'Precision instrumentation amplifier, 120dB CMRR, DIP-8', cat: 'analog', pkg: 'DIP-8', price: 7.50, stock: 80, lead: 'In stock' },
    // ========== OBSOLETE POWER — Legacy Regulators ==========
    { pn: 'LM2596S-5.0/NOPB', mfr: 'Texas Instruments', desc: 'Step-down regulator, 5V/3A, 150kHz, TO-263-5', cat: 'power-management', pkg: 'TO-263-5', price: 2.80, stock: 250, lead: 'In stock' },
    { pn: 'LM2596S-ADJ/NOPB', mfr: 'Texas Instruments', desc: 'Adjustable step-down regulator, 3A, 150kHz, TO-263-5', cat: 'power-management', pkg: 'TO-263-5', price: 3.00, stock: 200, lead: 'In stock' },
    { pn: 'LM2576S-5.0/NOPB', mfr: 'Texas Instruments', desc: 'Step-down regulator, 5V/3A, 52kHz, TO-263-5', cat: 'power-management', pkg: 'TO-263-5', price: 2.50, stock: 300, lead: 'In stock' },
    { pn: 'LM2575S-5.0/NOPB', mfr: 'Texas Instruments', desc: 'Simple step-down regulator, 5V/1A, 52kHz, TO-263-5', cat: 'power-management', pkg: 'TO-263-5', price: 2.00, stock: 350, lead: 'In stock' },
    { pn: 'MC34063ADR', mfr: 'ON Semiconductor', desc: 'DC-DC converter controller, 1.5A, buck/boost/inverter', cat: 'power-management', pkg: 'SOIC-8', price: 0.60, stock: 500, lead: 'In stock' },
    { pn: 'UC3842AN', mfr: 'ON Semiconductor', desc: 'Current-mode PWM controller, SMPS, 500kHz, DIP-8', cat: 'power-management', pkg: 'DIP-8', price: 0.80, stock: 400, lead: 'In stock' },
    { pn: 'TOP258PN', mfr: 'Power Integrations', desc: 'Integrated offline switcher, 36W, EcoSmart, DIP-8', cat: 'power-management', pkg: 'DIP-8', price: 3.50, stock: 120, lead: '1-2 weeks' },
    { pn: 'IR2110PBF', mfr: 'Infineon', desc: 'High/low side gate driver, 200V, bootstrap, DIP-14', cat: 'power-management', pkg: 'DIP-14', price: 3.00, stock: 200, lead: 'In stock' },
    { pn: 'IR2104PBF', mfr: 'Infineon', desc: 'Half-bridge gate driver, 600V, bootstrap, DIP-8', cat: 'power-management', pkg: 'DIP-8', price: 2.50, stock: 180, lead: 'In stock' },
    { pn: 'L7805CV', mfr: 'STMicroelectronics', desc: 'Fixed 5V linear regulator, 1.5A, TO-220, classic', cat: 'power-management', pkg: 'TO-220', price: 0.35, stock: 2000, lead: 'In stock' },
    { pn: 'L7812CV', mfr: 'STMicroelectronics', desc: 'Fixed 12V linear regulator, 1.5A, TO-220, classic', cat: 'power-management', pkg: 'TO-220', price: 0.35, stock: 1500, lead: 'In stock' },
    { pn: 'AMS1117-3.3', mfr: 'ON Semiconductor', desc: '3.3V LDO regulator, 1A, SOT-223, popular legacy', cat: 'power-management', pkg: 'SOT-223', price: 0.15, stock: 3000, lead: 'In stock' },
    { pn: 'LM317T/NOPB', mfr: 'Texas Instruments', desc: 'Adjustable linear regulator, 1.5A, 1.2-37V, TO-220', cat: 'power-management', pkg: 'TO-220', price: 0.60, stock: 1000, lead: 'In stock' },
    { pn: 'LM1117IMP-3.3/NOPB', mfr: 'Texas Instruments', desc: '3.3V LDO regulator, 800mA, SOT-223', cat: 'power-management', pkg: 'SOT-223', price: 0.80, stock: 500, lead: 'In stock' },
    // ========== OBSOLETE — Voltage References ==========
    { pn: 'REF5050AIDGKR', mfr: 'Texas Instruments', desc: '5.0V precision voltage reference, 0.05% accuracy', cat: 'analog', pkg: 'MSOP-8', price: 4.50, stock: 90, lead: 'In stock' },
    { pn: 'AD586MNZ', mfr: 'Analog Devices', desc: '5.0V precision reference, 5ppm/°C, MIL temp, CDIP-8', cat: 'analog', pkg: 'CDIP-8', price: 25.00, stock: 15, lead: '4-8 weeks' },
    { pn: 'LT1021BCN8-5/883', mfr: 'Linear Technology', desc: '5.0V precision reference, MIL-STD-883, ultra-stable', cat: 'analog', pkg: 'DIP-8', price: 35.00, stock: 10, lead: '6-10 weeks' },
    { pn: 'MAX6350CPA+', mfr: 'Maxim Integrated', desc: '5.0V ultra-precision reference, 1ppm/°C, 0.02%', cat: 'analog', pkg: 'DIP-8', price: 12.00, stock: 30, lead: '2-4 weeks' },
  ];

  let created = 0, skipped = 0;
  for (const p of products) {
    const exists = await prisma.product.findUnique({ where: { partNumber: p.pn } });
    if (exists) { skipped++; continue; }
    await prisma.product.create({
      data: {
        partNumber: p.pn, manufacturer: p.mfr, description: p.desc,
        categoryId: catMap[p.cat] || null, packageType: p.pkg,
        mountType: p.pkg?.includes('DIP') || p.pkg?.includes('TO-2') ? 'THT' : 'SMD',
        minPrice: p.price, stock: p.stock, moq: 1, leadTime: p.lead, status: 'active',
      },
    });
    created++;
  }
  const total = await prisma.product.count();
  console.log(`\n✅ Batch 2 done! Created: ${created}, Skipped: ${skipped}, Total: ${total}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
