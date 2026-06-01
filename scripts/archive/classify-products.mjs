/**
 * Classify 722K products into the 3-level category tree
 * Maps specs.Category from JSONL format to our new taxonomy
 * 
 * Usage:
 *   node scripts/classify-products.mjs            # Full run
 *   node scripts/classify-products.mjs --dry-run   # Preview only
 *   node scripts/classify-products.mjs --stats      # Show current stats
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');
const STATS_ONLY = process.argv.includes('--stats');
const BATCH_SIZE = 500;

// ─── MAPPING TABLE ───
// Maps "Integrated Circuits (ICs)/SubCategory" → our L3 slug
// This is the primary classification method (from specs.Category)
const CATEGORY_MAP = {
  // === Embedded & Programmable ===
  'Microcontroller, Microprocessor, FPGA Modules': '__mcu_modules__', // special: split by description
  'FPGAs (Field Programmable Gate Array)': 'fpgas',
  'CPLDs (Complex Programmable Logic Devices)': 'cplds',
  'PLDs (Programmable Logic Device)': 'plds',
  'FPGAs (Field Programmable Gate Array) with Microcontrollers': 'fpgas-with-mcu',
  'Configuration Proms for FPGAs': 'fpga-config-proms',
  'Configuration PROMs for FPGAs': 'fpga-config-proms',
  'System On Chip (SoC)': 'soc',
  'DSP (Digital Signal Processors)': 'dsp',
  'Application Specific': 'application-specific-processors',

  // === Power Management ===
  'Linear Controllers': 'linear-regulators-ldo',
  'Linear Regulator Controllers': 'linear-regulator-controllers',
  'Voltage Reference': 'voltage-references',
  'DC DC Switching Regulators': 'dc-dc-switching-regulators',
  'DC DC Switching Controllers': 'dc-dc-switching-controllers',
  'AC DC Converters, Offline Switchers': 'ac-dc-converters',
  'PFC (Power Factor Correction)': 'pfc-controllers',
  'Linear and Switching  Controllers': 'linear-switching-controllers',
  'Battery Management': 'battery-management',
  'Battery Chargers': 'battery-chargers',
  'LED Drivers': 'led-drivers',
  'Motor Drivers, Controllers': 'motor-drivers',
  'Gate Drivers': 'gate-drivers',
  'Full, Half-Bridge Drivers': 'bridge-drivers',
  'Lighting, Ballast Controllers': 'lighting-ballast-controllers',
  'Laser Drivers': 'laser-drivers',
  'Power Distribution Switches, Load Drivers': 'power-distribution-switches',
  'Hot Swap Controllers': 'hot-swap-controllers',
  'OR Controllers, Ideal Diodes': 'or-controllers-ideal-diodes',
  'Current Regulation/Management': 'current-regulation',
  'Supervisors': 'supervisors-reset',
  'Power Supply Controllers, Monitors': 'power-supply-controllers',
  'Power Over Ethernet (PoE) Controllers': 'poe-controllers',
  'Thermal Management': 'thermal-management',
  'Energy Metering': 'energy-metering',
  'Power Management - Specialized': 'specialized-power-management',

  // === Memory (split by description keywords) ===
  'Memory Integrated Circuit': '__memory__',
  'FIFOs Memory': 'fifo-memory',
  'Memory Batteries': 'general-memory',

  // === Analog & Mixed Signal ===
  'Amplifiers - Instrumentation, OP Amps, Buffer Amps': 'op-amps',
  'Amplifiers - Audio': 'audio-amplifiers',
  'Amplifiers - Video Amps and Modules': 'video-amplifiers',
  'Amplifiers - Special Purpose': 'special-purpose-amplifiers',
  'Analog to Digital Converters (ADC)': 'adc',
  'Digital to Analog Converters (DAC)': 'dac',
  'ADCs/DACs - Special Purpose': 'adc-dac-special',
  'Analog Front End (AFE)': 'analog-front-end',
  'Analog Switches, Multiplexers, Demultiplexers': 'analog-switches-mux',
  'Analog Switches - Special Purpose': 'analog-switches-special',
  'Comparators Linear': 'analog-comparators',
  'Digital Potentiometers': 'digital-potentiometers',
  'Filters - Active': 'active-filters',
  'Analog Multipliers, Dividers': 'analog-multipliers-dividers',
  'RMS to DC Converters': 'rms-dc-converters',
  'V/F and F/V Converters': 'vf-fv-converters',
  'Direct Digital Synthesis (DDS)': 'dds',

  // === Logic ===
  'Gates and Inverters': 'gates-inverters',
  'Buffers, Drivers, Receivers, Transceivers': 'logic-buffers-drivers',
  'Flip Flops': 'flip-flops',
  'Latches': 'latches',
  'Counters, Dividers': 'counters-dividers',
  'Shift Registers': 'shift-registers',
  'Signal Switches, Multiplexers, Decoders': 'signal-switches-mux-decoders',
  'Comparators Logic': 'logic-comparators',
  'Digital Comparators': 'logic-comparators',
  'Parity Generators and Checkers': 'parity-generators',
  'Multivibrators': 'multivibrators',
  'Specialty Logic': 'specialty-logic',

  // === Interface & Communication ===
  'Drivers, Receivers, Transceivers': 'drivers-receivers-transceivers',
  'UARTs (Universal Asynchronous Receiver Transmitter)': 'uarts',
  'Serializers, Deserializers': 'serializers-deserializers',
  'Translators, Level Shifters': 'translators-level-shifters',
  'I/O Expanders': 'io-expanders',
  'Signal Buffers, Repeaters, Splitters': 'signal-buffers-repeaters',
  'Signal Terminators': 'signal-terminators',
  'Universal Bus Functions': 'universal-bus-functions',
  'Universal Bus Transceivers': 'universal-bus-functions',
  'Controllers Interface': 'interface-controllers-ic',
  'Controllers': 'interface-controllers-ic',
  'Modules': 'interface-modules',
  'Modems - ICs and Modules': 'modems',
  'Sensor and Detector Interfaces': 'sensor-detector-interfaces',
  'Touch Screen Controllers': 'touch-screen-controllers',
  'Sensor, Capacitive Touch': 'capacitive-touch-sensors',

  // === Clock & Timing ===
  'Clock Generators, PLLs, Frequency Synthesizers': 'clock-generators-plls',
  'Programmable Timers and Oscillators': 'programmable-timers-oscillators',
  'Real Time Clocks': 'real-time-clocks',
  'Clock Buffers, Drivers': 'clock-buffers-drivers',
  'Delay Lines': 'delay-lines',

  // === Audio, Video & Telecom ===
  'CODECs': 'audio-codecs',
  'Audio Special Purpose': 'audio-special-purpose',
  'Voice Record and Playback': 'voice-record-playback',
  'Voice Record and Playback ICs': 'voice-record-playback',
  'Video Processing': 'video-processing',
  'Display Drivers': 'display-drivers',
  'Encoders, Decoders, Converters': 'encoders-decoders-converters',
  'Telecom': 'telecom-ics',
  'Specialized ICs': 'specialized-ics',
  'Specialized': 'specialized-ics',
  'Special Purpose': 'special-purpose-ics',
};

// Memory sub-classification by description keywords (order matters: first match wins)
const MEMORY_RULES = [
  { keywords: ['SRAM'], slug: 'sram' },
  { keywords: ['NAND'], slug: 'flash-memory' },
  { keywords: ['NOR FLASH', 'NOR-FLASH'], slug: 'flash-memory' },
  { keywords: ['FLASH'], slug: 'flash-memory' },
  { keywords: ['EEPROM'], slug: 'eeprom' },
  { keywords: ['EPROM'], slug: 'eprom' },
  { keywords: ['FRAM', 'MRAM'], slug: 'fram-mram' },
  { keywords: ['DDR', 'SDRAM', 'DRAM'], slug: 'dram-sdram' },
  { keywords: ['NVRAM', ' ROM'], slug: 'rom-nvram' },
];

// MCU Modules sub-classification by description keywords
const MCU_RULES = [
  { keywords: ['MPU ', 'MICROPROCESSOR'], slug: 'microprocessors' },
  { keywords: ['DSP '], slug: 'dsp' },
  { keywords: ['SOC ', 'SYSTEM-ON-CHIP', 'SYSTEM ON CHIP'], slug: 'soc' },
  { keywords: ['FPGA'], slug: 'embedded-modules-general' },
  { keywords: ['MODULE', 'EVALUATION', 'DEVELOPMENT', 'DEMO BOARD'], slug: 'embedded-modules-general' },
  // Default: MCU
  { keywords: ['MCU', 'MICROCONTROLLER', 'IC MCU', 'ARM ', 'CORTEX', 'AVR ', 'PIC1', 'PIC2', 'PIC3', '8051', 'RISC-V'], slug: 'microcontrollers' },
];

function classifyMemory(desc) {
  const upper = (desc || '').toUpperCase();
  for (const rule of MEMORY_RULES) {
    if (rule.keywords.some(kw => upper.includes(kw))) return rule.slug;
  }
  return 'general-memory';
}

function classifyMcuModules(desc) {
  const upper = (desc || '').toUpperCase();
  for (const rule of MCU_RULES) {
    if (rule.keywords.some(kw => upper.includes(kw))) return rule.slug;
  }
  return 'microcontrollers'; // default
}

async function showStats() {
  console.log('📊 Current category distribution:\n');
  const cats = await prisma.category.findMany({
    include: { _count: { select: { products: true } }, parent: { select: { name: true } } },
    orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
  });

  const total = await prisma.product.count();
  const uncategorized = await prisma.product.count({ where: { categoryId: null } });

  let currentParent = null;
  for (const cat of cats) {
    const parentName = cat.parent?.name;
    if (parentName !== currentParent) {
      currentParent = parentName;
      if (parentName) console.log(`\n  📂 ${parentName}`);
    }
    const prefix = cat.parent ? '    ' : '\n📁 ';
    const pct = total > 0 ? (cat._count.products / total * 100).toFixed(1) : '0';
    if (cat._count.products > 0 || !cat.parent) {
      console.log(`${prefix}${cat.name.padEnd(45)} ${cat._count.products.toLocaleString().padStart(8)} (${pct}%)`);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Total products:        ${total.toLocaleString()}`);
  console.log(`  Categorized:           ${(total - uncategorized).toLocaleString()}`);
  console.log(`  Uncategorized:         ${uncategorized.toLocaleString()}`);
  console.log(`  Categories:            ${cats.length}`);
}

async function classify() {
  console.log(`${DRY_RUN ? '🔍 DRY RUN' : '🚀 LIVE RUN'} — Classifying products...\n`);

  // Load all categories and build slug → id map
  const allCats = await prisma.category.findMany({ select: { id: true, slug: true } });
  const slugToId = new Map(allCats.map(c => [c.slug, c.id]));

  // Validate all mapped slugs exist
  const allSlugs = new Set([...Object.values(CATEGORY_MAP)].filter(s => !s.startsWith('__')));
  for (const slug of allSlugs) {
    if (!slugToId.has(slug)) {
      console.error(`❌ Missing category slug: "${slug}" — run setup-categories.mjs first!`);
      process.exit(1);
    }
  }
  console.log(`✅ All ${allSlugs.size} target category slugs verified\n`);

  // Process products in batches
  const total = await prisma.product.count();
  let processed = 0, updated = 0, skipped = 0, noMatch = 0;
  const stats = new Map(); // slug → count

  let cursor = undefined;
  while (true) {
    const products = await prisma.product.findMany({
      take: BATCH_SIZE,
      skip: cursor ? 1 : 0,
      ...(cursor ? { cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: { id: true, specs: true, description: true, partNumber: true },
    });

    if (products.length === 0) break;
    cursor = products[products.length - 1].id;

    const updates = [];
    for (const product of products) {
      processed++;
      let targetSlug = null;

      // Parse specs.Category
      let specsCat = null;
      try {
        const specsObj = product.specs ? JSON.parse(product.specs) : {};
        specsCat = specsObj['Category'];
      } catch {}

      if (specsCat) {
        const subCat = specsCat.split('/').slice(1).join('/').trim();
        const mapped = CATEGORY_MAP[subCat];

        if (mapped === '__memory__') {
          targetSlug = classifyMemory(product.description);
        } else if (mapped === '__mcu_modules__') {
          targetSlug = classifyMcuModules(product.description);
        } else if (mapped) {
          targetSlug = mapped;
        }
      }

      if (!targetSlug) {
        noMatch++;
        continue;
      }

      const catId = slugToId.get(targetSlug);
      if (!catId) {
        noMatch++;
        continue;
      }

      stats.set(targetSlug, (stats.get(targetSlug) || 0) + 1);

      if (!DRY_RUN) {
        updates.push(prisma.product.update({
          where: { id: product.id },
          data: { categoryId: catId },
        }));
      }
      updated++;
    }

    // Flush batch
    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    const pct = (processed / total * 100).toFixed(1);
    process.stdout.write(`\r  📦 ${processed.toLocaleString()} / ${total.toLocaleString()} (${pct}%) | ✅ ${updated.toLocaleString()} classified, ⚠️ ${noMatch} unmatched`);
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log(`${DRY_RUN ? '🔍 DRY RUN' : '✅'} Classification complete!`);
  console.log(`   Total processed:  ${processed.toLocaleString()}`);
  console.log(`   Classified:       ${updated.toLocaleString()}`);
  console.log(`   No match:         ${noMatch.toLocaleString()}`);
  console.log('='.repeat(60));

  // Show top categories
  console.log('\n📊 Top 20 categories by product count:');
  const sorted = [...stats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [slug, count] of sorted) {
    console.log(`  ${slug.padEnd(45)} ${count.toLocaleString().padStart(8)}`);
  }
}

async function main() {
  if (STATS_ONLY) {
    await showStats();
  } else {
    await classify();
  }
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
