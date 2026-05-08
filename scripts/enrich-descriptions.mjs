/**
 * Step B: Product Description Enrichment
 * 
 * Generates unique, SEO-friendly descriptions from specs data.
 * Target: 29 chars avg → 120-200 chars avg
 * 
 * Strategy: Build description from structured data fields, NOT from templates.
 * Each product's unique specs combination produces a unique description.
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const BATCH_SIZE = 500;
const DRY_RUN = process.argv.includes('--dry-run');

// Spec keys that carry real technical value (cleaned/normalized)
const VALUABLE_SPECS = {
  // Core technical
  'Core Processor': 'core',
  'Core Size': 'core_size',
  'Core Type': 'core_type',
  'Speed': 'speed',
  'Voltage - Supply': 'voltage',
  'Voltage - Supply (Vcc/Vdd)': 'voltage',
  'Voltage Supply- Internal': 'voltage',
  'Voltage - Input': 'voltage',
  'Operating Temperature': 'temp',
  'Number of I/ O': 'io_count',
  'Number of I/O': 'io_count',
  'Numberof I/ O': 'io_count',
  // Memory
  'R A M Size': 'ram',
  'RAM Size': 'ram',
  'Program Memory Size': 'flash',
  'Flash Size': 'flash',
  'Memory Size': 'memory_size',
  'E E P R O M Size': 'eeprom',
  'Program Memory Type': 'mem_type',
  'Total R A M bits': 'ram_bits',
  // Logic
  'Number of Logic Elements/ Cells': 'logic_cells',
  'Number of Logic Elements/Cells': 'logic_cells',
  'Number of L A Bs/ C L Bs': 'labs',
  'Number of LABs/CLBs': 'labs',
  'Number of gates': 'gates',
  'Number of Macrocells': 'macrocells',
  'Numberof Macrocells': 'macrocells',
  'F P G A Core Cells': 'fpga_cells',
  'F P G A Gates': 'fpga_gates',
  // Interface / Connectivity
  'Interface': 'interface',
  'Connectivity': 'connectivity',
  'Peripherals': 'peripherals',
  // Analog
  'Output': 'output',
  'Number of Voltages Monitored': 'voltages_monitored',
  'Voltage - Threshold': 'threshold_voltage',
  'Reset Timeout': 'reset_timeout',
  'Data Converters': 'data_converters',
  // Package
  'Package / Case': 'package',
  'Supplier Device Package': 'device_package',
  'Mounting Type': 'mount',
  // Other
  'Applications': 'applications',
  'Series': 'series',
  'Type': 'type',
  'Programmable Type': 'prog_type',
  'Module/ Board Type': 'module_type',
  'Memory Type': 'mem_type',
  'Memory Format': 'mem_format',
  'Oscillator Type': 'osc_type',
};

// Keys to skip (compliance, non-technical)
const SKIP_KEYS = new Set([
  'Category', 'Product Status', 'EU RoHS Status', 'REACH Status',
  'US ECCN', 'HTS US', 'China RoHS Status', 'MSL Rating',
  'RoHS Status', 'Moisture Sensitivity Level (MSL)', 'Lifecycle Status',
  'Factory Lead Time', 'Manufacturer', 'Packaging', 'Reset',
]);

function cleanSpecKey(key) {
  return key.trim().replace(/\s+/g, ' ');
}

function cleanSpecValue(value) {
  const v = String(value).trim();
  if (!v || v === '-' || v === 'N/A' || v === 'n/a' || v === '—') return null;
  // Remove trailing truncation from long values
  return v.replace(/\.{2,}$/, '').trim();
}

function generateDescription(product, specs) {
  const parts = [];
  const mfr = product.manufacturer;
  const pn = product.partNumber;
  
  // 1. Opening: Part number + manufacturer + category context
  // Use the existing short description as a seed if it contains useful info
  const existingDesc = (product.description || '').trim();
  
  // Extract useful technical specs
  const techSpecs = {};
  for (const [rawKey, value] of Object.entries(specs)) {
    const key = cleanSpecKey(rawKey);
    if (SKIP_KEYS.has(key)) continue;
    const cleaned = cleanSpecValue(value);
    if (!cleaned) continue;
    
    // Map to normalized key or use original
    const mapped = VALUABLE_SPECS[key];
    if (mapped) {
      techSpecs[mapped] = cleaned;
    } else if (!key.includes('RoHS') && !key.includes('ECCN') && !key.includes('REACH')) {
      // Include unmapped specs that aren't compliance-related
      techSpecs[key.toLowerCase().replace(/[^a-z0-9]/g, '_')] = cleaned;
    }
  }

  // 2. Build the description sentence by sentence
  
  // Opening with core identity
  const coreType = techSpecs.core || techSpecs.core_type || techSpecs.core_size || '';
  const type = techSpecs.type || '';
  
  if (coreType && coreType !== '-') {
    parts.push(`${pn} is a ${coreType} ${type ? type + ' ' : ''}device by ${mfr}`);
  } else if (type && type.length > 3) {
    parts.push(`${pn} is a ${type} by ${mfr}`);
  } else {
    parts.push(`${pn} by ${mfr}`);
  }

  // Memory info
  const memParts = [];
  if (techSpecs.flash) memParts.push(`${techSpecs.flash} Flash`);
  if (techSpecs.ram) memParts.push(`${techSpecs.ram} RAM`);
  if (techSpecs.eeprom) memParts.push(`${techSpecs.eeprom} EEPROM`);
  if (techSpecs.memory_size) memParts.push(`${techSpecs.memory_size} memory`);
  if (memParts.length > 0) {
    parts.push(`featuring ${memParts.join(', ')}`);
  }

  // Speed / frequency
  if (techSpecs.speed && techSpecs.speed !== '-') {
    parts.push(`${techSpecs.speed} operating frequency`);
  }

  // Logic density (for FPGAs/CPLDs)
  if (techSpecs.logic_cells) {
    parts.push(`${techSpecs.logic_cells} logic elements`);
  } else if (techSpecs.macrocells) {
    parts.push(`${techSpecs.macrocells} macrocells`);
  } else if (techSpecs.fpga_cells) {
    parts.push(`${techSpecs.fpga_cells} core cells`);
  } else if (techSpecs.gates && techSpecs.gates !== '-') {
    parts.push(`${techSpecs.gates} gates`);
  }

  // I/O
  if (techSpecs.io_count && techSpecs.io_count !== '-') {
    parts.push(`${techSpecs.io_count} I/O`);
  }

  // Voltage
  if (techSpecs.voltage && techSpecs.voltage !== '-') {
    parts.push(`${techSpecs.voltage} supply voltage`);
  }

  // Interface / connectivity
  if (techSpecs.interface) {
    parts.push(`with ${techSpecs.interface} interface`);
  } else if (techSpecs.connectivity) {
    parts.push(`with ${techSpecs.connectivity} connectivity`);
  } else if (techSpecs.peripherals) {
    parts.push(`with ${techSpecs.peripherals}`);
  }

  // Package
  const pkg = techSpecs.package || product.packageType || '';
  const mount = techSpecs.mount || product.mountType || '';
  if (pkg) {
    parts.push(`in ${pkg} package`);
  }

  // Temperature
  if (techSpecs.temp && techSpecs.temp !== '-') {
    parts.push(`rated for ${techSpecs.temp}`);
  }

  // Series
  if (techSpecs.series && techSpecs.series !== '-') {
    parts.push(`part of the ${techSpecs.series} series`);
  }

  // Applications
  if (techSpecs.applications && techSpecs.applications !== '-') {
    parts.push(`designed for ${techSpecs.applications} applications`);
  }

  // Join parts with proper punctuation
  let desc = '';
  if (parts.length <= 2) {
    desc = parts.join(' ') + '.';
  } else {
    // First part is the opening, rest are comma-separated features
    desc = parts[0] + ', ' + parts.slice(1).join(', ') + '.';
  }

  // Lifecycle note for obsolete parts (adds unique value)
  if (product.status === 'obsolete') {
    desc += ' This part is discontinued. FPGACenter specializes in sourcing obsolete components.';
  } else if (product.status === 'lastbuy') {
    desc += ' Last-time buy opportunity — limited availability.';
  }

  return desc;
}

async function main() {
  const total = await prisma.product.count();
  console.log(`Total products: ${total.toLocaleString()}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE — writing to database'}\n`);

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let cursor = 0;

  // Show samples first
  if (DRY_RUN) {
    console.log('=== Sample Enriched Descriptions ===\n');
    const samples = await prisma.product.findMany({
      select: { partNumber: true, manufacturer: true, description: true, specs: true, packageType: true, mountType: true, status: true, category: { select: { name: true } } },
      take: 20,
      orderBy: { id: 'asc' },
    });
    
    for (const p of samples) {
      const specs = JSON.parse(p.specs || '{}');
      const newDesc = generateDescription(p, specs);
      console.log(`${p.partNumber} (${p.category?.name || 'no cat'})`);
      console.log(`  OLD: "${p.description}" (${p.description?.length || 0} chars)`);
      console.log(`  NEW: "${newDesc}" (${newDesc.length} chars)`);
      console.log();
    }
    
    await prisma.$disconnect();
    return;
  }

  // Live mode: batch update all products
  while (true) {
    const products = await prisma.product.findMany({
      where: { id: { gt: cursor } },
      select: { id: true, partNumber: true, manufacturer: true, description: true, specs: true, packageType: true, mountType: true, status: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
    });

    if (products.length === 0) break;

    const updates = [];
    for (const product of products) {
      const specs = JSON.parse(product.specs || '{}');
      const newDesc = generateDescription(product, specs);

      // Only update if new description is meaningfully longer
      const oldLen = (product.description || '').length;
      if (newDesc.length > oldLen + 20) {
        updates.push(
          prisma.product.update({
            where: { id: product.id },
            data: { description: newDesc },
          })
        );
        updated++;
      } else {
        skipped++;
      }
    }

    if (updates.length > 0) {
      await prisma.$executeRawUnsafe('BEGIN');
      try {
        // Use individual updates in batches to avoid connection exhaustion
        for (let i = 0; i < updates.length; i += 50) {
          await Promise.all(updates.slice(i, i + 50));
        }
        await prisma.$executeRawUnsafe('COMMIT');
      } catch (e) {
        await prisma.$executeRawUnsafe('ROLLBACK');
        console.error(`Error at cursor ${cursor}:`, e.message);
      }
    }

    cursor = products[products.length - 1].id;
    processed += products.length;

    if (processed % 10000 === 0) {
      console.log(`Progress: ${processed.toLocaleString()} / ${total.toLocaleString()} | Updated: ${updated.toLocaleString()} | Skipped: ${skipped.toLocaleString()}`);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Processed: ${processed.toLocaleString()}`);
  console.log(`Updated:   ${updated.toLocaleString()}`);
  console.log(`Skipped:   ${skipped.toLocaleString()}`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
