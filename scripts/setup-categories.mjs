/**
 * Setup 3-level category tree for FPGACenter
 * Based on actual analysis of 722,484 products from ics.jsonl
 * Usage: node scripts/setup-categories.mjs [--clean]
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const clean = process.argv.includes('--clean');

// ─── FULL 3-LEVEL TAXONOMY ───
// Format: { name, slug, seoTitle, seoDesc, children: [{ name, slug, children: [{ name, slug }] }] }
const CATEGORIES = [
  {
    name: 'Embedded & Programmable',
    slug: 'embedded',
    seoTitle: 'Embedded Processors, FPGAs & Programmable ICs',
    seoDesc: 'Microcontrollers, FPGAs, CPLDs, DSPs, SoCs and programmable logic devices from leading manufacturers. Hard-to-find and obsolete parts available.',
    children: [
      { name: 'Microcontrollers & Processors', slug: 'mcu-processors', children: [
        { name: 'Microcontrollers (MCU)', slug: 'microcontrollers' },
        { name: 'Microprocessors (MPU)', slug: 'microprocessors' },
        { name: 'System On Chip (SoC)', slug: 'soc' },
        { name: 'DSP - Digital Signal Processors', slug: 'dsp' },
        // Slug kept for URL stability; the category holds clock generators,
        // buffers, jitter attenuators and oscillators, not processors. See
        // scripts/rename-clock-timing-category.mjs. A re-run of this script
        // overwrites `name`, so this entry must stay in step with that rename.
        { name: 'Clock Generators & Timing ICs', slug: 'application-specific-processors' },
      ]},
      { name: 'FPGAs & Programmable Logic', slug: 'fpgas-programmable-logic', children: [
        { name: 'FPGAs', slug: 'fpgas' },
        { name: 'CPLDs', slug: 'cplds' },
        { name: 'PLDs - Programmable Logic Devices', slug: 'plds' },
        { name: 'FPGAs with Microcontrollers', slug: 'fpgas-with-mcu' },
        { name: 'Configuration PROMs for FPGAs', slug: 'fpga-config-proms' },
      ]},
      { name: 'Embedded Modules', slug: 'embedded-modules', children: [
        { name: 'MCU, MPU & FPGA Modules', slug: 'embedded-modules-general' },
      ]},
    ],
  },
  {
    name: 'Power Management',
    slug: 'power-management',
    seoTitle: 'Power Management ICs - Regulators, Controllers, Drivers',
    seoDesc: 'Voltage regulators, DC-DC converters, LED drivers, motor drivers, battery management and power supervisors. No MOQ, global shipping.',
    children: [
      { name: 'Voltage Regulators', slug: 'voltage-regulators', children: [
        { name: 'Linear Regulators (LDO)', slug: 'linear-regulators-ldo' },
        { name: 'Linear Regulator Controllers', slug: 'linear-regulator-controllers' },
        { name: 'Voltage References', slug: 'voltage-references' },
      ]},
      { name: 'Switching Regulators & Converters', slug: 'switching-regulators', children: [
        { name: 'DC-DC Switching Regulators', slug: 'dc-dc-switching-regulators' },
        { name: 'DC-DC Switching Controllers', slug: 'dc-dc-switching-controllers' },
        { name: 'AC-DC Converters & Offline Switchers', slug: 'ac-dc-converters' },
        { name: 'PFC Controllers', slug: 'pfc-controllers' },
        { name: 'Linear & Switching Controllers', slug: 'linear-switching-controllers' },
      ]},
      { name: 'Battery & Charging', slug: 'battery-charging', children: [
        { name: 'Battery Management ICs', slug: 'battery-management' },
        { name: 'Battery Chargers', slug: 'battery-chargers' },
      ]},
      { name: 'LED & Motor Drivers', slug: 'led-motor-drivers', children: [
        { name: 'LED Drivers', slug: 'led-drivers' },
        { name: 'Motor Drivers & Controllers', slug: 'motor-drivers' },
        { name: 'Gate Drivers', slug: 'gate-drivers' },
        { name: 'Full & Half-Bridge Drivers', slug: 'bridge-drivers' },
        { name: 'Lighting & Ballast Controllers', slug: 'lighting-ballast-controllers' },
        { name: 'Laser Drivers', slug: 'laser-drivers' },
      ]},
      { name: 'Power Switches & Distribution', slug: 'power-switches', children: [
        { name: 'Power Distribution Switches', slug: 'power-distribution-switches' },
        { name: 'Hot Swap Controllers', slug: 'hot-swap-controllers' },
        { name: 'OR Controllers & Ideal Diodes', slug: 'or-controllers-ideal-diodes' },
        { name: 'Current Regulation & Management', slug: 'current-regulation' },
      ]},
      { name: 'Power Supervisors & Control', slug: 'power-supervisors', children: [
        { name: 'Supervisors & Reset ICs', slug: 'supervisors-reset' },
        { name: 'Power Supply Controllers & Monitors', slug: 'power-supply-controllers' },
        { name: 'PoE Controllers', slug: 'poe-controllers' },
        { name: 'Thermal Management ICs', slug: 'thermal-management' },
        { name: 'Energy Metering ICs', slug: 'energy-metering' },
      ]},
      { name: 'Power Management - Specialized', slug: 'power-specialized', children: [
        { name: 'Specialized Power Management', slug: 'specialized-power-management' },
      ]},
    ],
  },
  {
    name: 'Memory',
    slug: 'memory',
    seoTitle: 'Memory ICs - SRAM, DRAM, Flash, EEPROM',
    seoDesc: 'SRAM, SDRAM, DDR, Flash, EEPROM, FRAM, FIFO and other memory integrated circuits. Obsolete and hard-to-find memory chips available.',
    children: [
      { name: 'Volatile Memory', slug: 'volatile-memory', children: [
        { name: 'SRAM', slug: 'sram' },
        { name: 'DRAM & SDRAM', slug: 'dram-sdram' },
        { name: 'FIFO Memory', slug: 'fifo-memory' },
      ]},
      { name: 'Non-Volatile Memory', slug: 'non-volatile-memory', children: [
        { name: 'Flash Memory', slug: 'flash-memory' },
        { name: 'EEPROM', slug: 'eeprom' },
        { name: 'EPROM', slug: 'eprom' },
        { name: 'FRAM & MRAM', slug: 'fram-mram' },
        { name: 'ROM & NVRAM', slug: 'rom-nvram' },
      ]},
      { name: 'Other Memory', slug: 'other-memory', children: [
        { name: 'General Memory ICs', slug: 'general-memory' },
      ]},
    ],
  },
  {
    name: 'Analog & Mixed Signal',
    slug: 'analog',
    seoTitle: 'Analog ICs - Op Amps, ADC, DAC, Comparators',
    seoDesc: 'Operational amplifiers, ADCs, DACs, analog switches, comparators, digital potentiometers and analog front-end ICs.',
    children: [
      { name: 'Amplifiers', slug: 'amplifiers', children: [
        { name: 'Op Amps & Instrumentation Amplifiers', slug: 'op-amps' },
        { name: 'Audio Amplifiers', slug: 'audio-amplifiers' },
        { name: 'Video Amplifiers', slug: 'video-amplifiers' },
        { name: 'Special Purpose Amplifiers', slug: 'special-purpose-amplifiers' },
      ]},
      { name: 'Data Converters', slug: 'data-converters', children: [
        { name: 'ADC - Analog to Digital Converters', slug: 'adc' },
        { name: 'DAC - Digital to Analog Converters', slug: 'dac' },
        { name: 'ADC/DAC - Special Purpose', slug: 'adc-dac-special' },
        { name: 'Analog Front End (AFE)', slug: 'analog-front-end' },
      ]},
      { name: 'Analog Switches & Signal Processing', slug: 'analog-switches', children: [
        { name: 'Analog Switches & Multiplexers', slug: 'analog-switches-mux' },
        { name: 'Analog Switches - Special Purpose', slug: 'analog-switches-special' },
        { name: 'Analog Comparators', slug: 'analog-comparators' },
        { name: 'Digital Potentiometers', slug: 'digital-potentiometers' },
        { name: 'Active Filters', slug: 'active-filters' },
      ]},
      { name: 'Other Analog', slug: 'other-analog', children: [
        { name: 'Analog Multipliers & Dividers', slug: 'analog-multipliers-dividers' },
        { name: 'RMS to DC Converters', slug: 'rms-dc-converters' },
        { name: 'V/F and F/V Converters', slug: 'vf-fv-converters' },
        { name: 'Direct Digital Synthesis (DDS)', slug: 'dds' },
      ]},
    ],
  },
  {
    name: 'Logic',
    slug: 'logic',
    seoTitle: 'Logic ICs - Gates, Flip-Flops, Buffers, Counters',
    seoDesc: 'Standard logic ICs including gates, inverters, flip-flops, latches, shift registers, counters, buffers and decoders.',
    children: [
      { name: 'Combinational Logic', slug: 'combinational-logic', children: [
        { name: 'Gates & Inverters', slug: 'gates-inverters' },
        { name: 'Signal Switches, MUX & Decoders', slug: 'signal-switches-mux-decoders' },
        { name: 'Parity Generators & Checkers', slug: 'parity-generators' },
        { name: 'Logic Comparators', slug: 'logic-comparators' },
      ]},
      { name: 'Sequential Logic', slug: 'sequential-logic', children: [
        { name: 'Flip-Flops', slug: 'flip-flops' },
        { name: 'Latches', slug: 'latches' },
        { name: 'Counters & Dividers', slug: 'counters-dividers' },
        { name: 'Shift Registers', slug: 'shift-registers' },
        { name: 'Multivibrators', slug: 'multivibrators' },
      ]},
      { name: 'Buffers & Drivers', slug: 'buffers-drivers', children: [
        { name: 'Buffers, Drivers, Receivers & Transceivers', slug: 'logic-buffers-drivers' },
        { name: 'Specialty Logic', slug: 'specialty-logic' },
      ]},
    ],
  },
  {
    name: 'Interface & Communication',
    slug: 'interface',
    seoTitle: 'Interface ICs - Transceivers, Drivers, Controllers',
    seoDesc: 'Serial interface transceivers, UARTs, level shifters, I/O expanders, serializers, USB controllers and communication ICs.',
    children: [
      { name: 'Serial Transceivers', slug: 'serial-transceivers', children: [
        { name: 'Drivers, Receivers & Transceivers', slug: 'drivers-receivers-transceivers' },
        { name: 'UARTs', slug: 'uarts' },
        { name: 'Serializers & Deserializers', slug: 'serializers-deserializers' },
      ]},
      { name: 'Bus Interface', slug: 'bus-interface', children: [
        { name: 'Translators & Level Shifters', slug: 'translators-level-shifters' },
        { name: 'I/O Expanders', slug: 'io-expanders' },
        { name: 'Signal Buffers, Repeaters & Splitters', slug: 'signal-buffers-repeaters' },
        { name: 'Signal Terminators', slug: 'signal-terminators' },
        { name: 'Universal Bus Functions', slug: 'universal-bus-functions' },
      ]},
      { name: 'Interface Controllers & Modules', slug: 'interface-controllers', children: [
        { name: 'Interface Controllers', slug: 'interface-controllers-ic' },
        { name: 'Interface Modules', slug: 'interface-modules' },
        { name: 'Modems', slug: 'modems' },
      ]},
      { name: 'Sensor & Touch Interfaces', slug: 'sensor-touch-interfaces', children: [
        { name: 'Sensor & Detector Interfaces', slug: 'sensor-detector-interfaces' },
        { name: 'Touch Screen Controllers', slug: 'touch-screen-controllers' },
        { name: 'Capacitive Touch Sensors', slug: 'capacitive-touch-sensors' },
      ]},
    ],
  },
  {
    name: 'Clock & Timing',
    slug: 'clock-timing',
    seoTitle: 'Clock & Timing ICs - PLLs, Oscillators, RTC',
    seoDesc: 'Clock generators, PLLs, frequency synthesizers, programmable oscillators, real-time clocks, clock buffers and delay lines.',
    children: [
      { name: 'Clock Generation', slug: 'clock-generation', children: [
        { name: 'Clock Generators, PLLs & Synthesizers', slug: 'clock-generators-plls' },
        { name: 'Direct Digital Synthesis (DDS)', slug: 'clock-dds' },
      ]},
      { name: 'Oscillators & Timers', slug: 'oscillators-timers', children: [
        { name: 'Programmable Timers & Oscillators', slug: 'programmable-timers-oscillators' },
        { name: 'Real-Time Clocks (RTC)', slug: 'real-time-clocks' },
      ]},
      { name: 'Clock Distribution', slug: 'clock-distribution', children: [
        { name: 'Clock Buffers & Drivers', slug: 'clock-buffers-drivers' },
        { name: 'Delay Lines', slug: 'delay-lines' },
      ]},
    ],
  },
  {
    name: 'Audio, Video & Telecom',
    slug: 'audio-video-telecom',
    seoTitle: 'Audio, Video & Telecom ICs',
    seoDesc: 'Audio CODECs, video processors, display drivers, telecom ICs, voice recording and specialized communication integrated circuits.',
    children: [
      { name: 'Audio ICs', slug: 'audio-ics', children: [
        { name: 'Audio CODECs', slug: 'audio-codecs' },
        { name: 'Audio Special Purpose ICs', slug: 'audio-special-purpose' },
        { name: 'Voice Record & Playback', slug: 'voice-record-playback' },
      ]},
      { name: 'Video & Display', slug: 'video-display', children: [
        { name: 'Video Processing ICs', slug: 'video-processing' },
        { name: 'Display Drivers', slug: 'display-drivers' },
        { name: 'Encoders, Decoders & Converters', slug: 'encoders-decoders-converters' },
      ]},
      { name: 'Telecom & Specialized', slug: 'telecom-specialized', children: [
        { name: 'Telecom ICs', slug: 'telecom-ics' },
        { name: 'Specialized ICs', slug: 'specialized-ics' },
        { name: 'Special Purpose ICs', slug: 'special-purpose-ics' },
      ]},
    ],
  },
];

async function main() {
  console.log('🏗️  Setting up 3-level category tree...\n');

  if (clean) {
    console.log('🧹 Clean mode: removing ALL existing categories...');
    // Unlink products first
    await prisma.product.updateMany({ data: { categoryId: null } });
    // Delete all categories (children first due to FK)
    await prisma.category.deleteMany({ where: { parentId: { not: null } } });
    // Second pass for mid-level
    await prisma.category.deleteMany({ where: { parentId: { not: null } } });
    await prisma.category.deleteMany();
    console.log('  ✅ All categories removed\n');
  }

  let l1Count = 0, l2Count = 0, l3Count = 0;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat1 = CATEGORIES[i];
    // Level 1
    const level1 = await prisma.category.upsert({
      where: { slug: cat1.slug },
      update: { name: cat1.name, seoTitle: cat1.seoTitle, seoDesc: cat1.seoDesc, sortOrder: i, parentId: null },
      create: { name: cat1.name, slug: cat1.slug, seoTitle: cat1.seoTitle, seoDesc: cat1.seoDesc, sortOrder: i },
    });
    l1Count++;
    console.log(`📁 L1: ${cat1.name} (${cat1.slug})`);

    if (!cat1.children) continue;
    for (let j = 0; j < cat1.children.length; j++) {
      const cat2 = cat1.children[j];
      // Level 2
      const level2 = await prisma.category.upsert({
        where: { slug: cat2.slug },
        update: { name: cat2.name, parentId: level1.id, sortOrder: j },
        create: { name: cat2.name, slug: cat2.slug, parentId: level1.id, sortOrder: j },
      });
      l2Count++;
      console.log(`  📂 L2: ${cat2.name}`);

      if (!cat2.children) continue;
      for (let k = 0; k < cat2.children.length; k++) {
        const cat3 = cat2.children[k];
        // Level 3
        await prisma.category.upsert({
          where: { slug: cat3.slug },
          update: { name: cat3.name, parentId: level2.id, sortOrder: k },
          create: { name: cat3.name, slug: cat3.slug, parentId: level2.id, sortOrder: k },
        });
        l3Count++;
        console.log(`    📄 L3: ${cat3.name}`);
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Category tree created!`);
  console.log(`   Level 1: ${l1Count} categories`);
  console.log(`   Level 2: ${l2Count} categories`);
  console.log(`   Level 3: ${l3Count} categories`);
  console.log(`   Total:   ${l1Count + l2Count + l3Count} categories`);
  console.log(`${'='.repeat(50)}`);
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
