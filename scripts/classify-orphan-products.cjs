// Assign categoryId to the 188 products where categoryId IS NULL, using
// partNumber-prefix heuristics. These orphans are mostly textbook-famous
// ICs (STM32F407, ATmega2560, ESP32, NE555, AD9361, IRF540, 1N4007, etc.)
// that arrived in seed data without a category mapping.
//
// Usage:
//   node scripts/classify-orphan-products.cjs --dry-run         # show all matches, no writes
//   node scripts/classify-orphan-products.cjs                   # write to DB
//
// Strategy:
//   1. Per-partNumber rule list (regex → categorySlug). High-precision rules
//      take priority over fuzzy ones — order matters.
//   2. If no part rule fires, fall back to the manufacturer's most-common
//      category among indexable products. If the manufacturer has none, leave
//      the product orphaned (rare; logged at the end).
//   3. Look up categoryId by slug at runtime, so rules survive schema changes.
//
// After this script runs, the orphans need a quality-score recompute to flip
// indexable=true. The script prints the affected ids for piping to
// rescore-subset.mjs --file=...
const { PrismaClient } = require('@prisma/client');
const fs = require('node:fs');

const DRY_RUN = process.argv.includes('--dry-run');
const IDS_OUT = (process.argv.find(a => a.startsWith('--ids-out=')) || '').split('=')[1] || null;

// --- Rule table: partNumber prefix → category slug -------------------------
// Ordered most-specific first. The rules below cover the famous IC families
// observed in the orphan set; broader rules at the bottom catch the long tail.
const RULES = [
  // ---- Programmable logic ----
  { re: /^XC[0-9]/i,                slug: 'fpgas',                  reason: 'Xilinx FPGA part numbering' },
  { re: /^EP[2-4][CSF]/i,           slug: 'fpgas',                  reason: 'Altera Cyclone/Stratix family' },
  { re: /^EPM[0-9]/i,               slug: 'cplds',                  reason: 'Altera MAX family CPLD' },
  { re: /^EPCS[0-9]/i,              slug: 'fpga-config-proms',      reason: 'Altera config flash' },
  { re: /^ICE40/i,                  slug: 'fpgas',                  reason: 'Lattice iCE40 FPGA' },
  { re: /^GW[12][AN]/i,             slug: 'fpgas',                  reason: 'Gowin LittleBee/GW FPGA' },
  { re: /^LCMXO/i,                  slug: 'fpgas',                  reason: 'Lattice MachXO FPGA' },
  { re: /^LFE[0-9]/i,               slug: 'fpgas',                  reason: 'Lattice ECP FPGA' },
  { re: /^A3P[0-9]|^M2GL/i,         slug: 'fpgas',                  reason: 'Microsemi ProASIC3 / SmartFusion FPGA' },

  // ---- Microcontrollers ----
  { re: /^STM32/i,                  slug: 'microcontrollers',       reason: 'ST STM32 Cortex-M' },
  { re: /^STM8/i,                   slug: 'microcontrollers',       reason: 'ST STM8' },
  { re: /^ATMEGA|^ATTINY|^ATXMEGA/i, slug: 'microcontrollers',      reason: 'Atmel AVR family' },
  { re: /^AT89/i,                   slug: 'microcontrollers',       reason: 'Atmel 8051 family' },
  { re: /^PIC[0-9]/i,               slug: 'microcontrollers',       reason: 'Microchip PIC' },
  { re: /^MSP430/i,                 slug: 'microcontrollers',       reason: 'TI MSP430' },
  { re: /^NRF5/i,                   slug: 'microcontrollers',       reason: 'Nordic nRF5 series BLE SoC' },
  { re: /^CH5[0-9]/i,               slug: 'microcontrollers',       reason: 'WCH CH5x USB MCU' },
  { re: /^CH32/i,                   slug: 'microcontrollers',       reason: 'WCH CH32 ARM/RISC-V MCU' },
  { re: /^GD32/i,                   slug: 'microcontrollers',       reason: 'GigaDevice GD32 ARM MCU' },
  { re: /^SAM[0-9]/i,               slug: 'microcontrollers',       reason: 'Microchip SAM ARM MCU' },
  { re: /^N32G/i,                   slug: 'microcontrollers',       reason: 'Nations N32G ARM MCU' },

  // ---- Microprocessors / SoCs ----
  { re: /^IMX[0-9]|^MCIMX/i,        slug: 'microprocessors',        reason: 'NXP i.MX application processor' },
  { re: /^A20|^A33|^A64|^H[3-6]/i,  slug: 'microprocessors',        reason: 'Allwinner application processor' },
  { re: /^RK[0-9]/i,                slug: 'microprocessors',        reason: 'Rockchip application processor' },
  { re: /^BCM[0-9]/i,               slug: 'microprocessors',        reason: 'Broadcom application processor' },
  { re: /^RP[0-9]/i,                slug: 'microcontrollers',       reason: 'Raspberry Pi RP MCU' },

  // ---- Wireless / RF ----
  { re: /^ESP[0-9]|^ESP32|^ESP8266/i, slug: 'embedded-modules-general', reason: 'Espressif WiFi/BLE module' },
  { re: /^CC[0-9]{4}/i,             slug: 'microcontrollers',       reason: 'TI CC SimpleLink wireless MCU' },
  { re: /^AD93[6-9][01]/i,          slug: 'drivers-receivers-transceivers', reason: 'ADI AD936x RF transceiver' },
  { re: /^LTC[0-9]/i,               slug: 'voltage-regulators',     reason: 'Linear Technology / ADI LTC (most common)' },

  // ---- Memory ----
  { re: /^W25Q|^W25X/i,             slug: 'flash-memory',           reason: 'Winbond serial flash' },
  { re: /^IS62WV|^IS61|^IS64/i,     slug: 'sram',                   reason: 'ISSI SRAM' },
  { re: /^MT[0-9]/i,                slug: 'dram-sdram',             reason: 'Micron DRAM/SDRAM' },
  { re: /^K4[0-9]/i,                slug: 'dram-sdram',             reason: 'Samsung DRAM' },
  { re: /^HY5|^HY7/i,               slug: 'dram-sdram',             reason: 'Hynix DRAM' },
  { re: /^AS4C/i,                   slug: 'dram-sdram',             reason: 'Alliance Memory DRAM' },
  { re: /^FM25/i,                   slug: 'eeprom',                 reason: 'Fujitsu/Ramtron FRAM/EEPROM' },
  { re: /^24LC|^24C[0-9]/i,         slug: 'eeprom',                 reason: 'I2C EEPROM' },

  // ---- Power / regulators ----
  { re: /^AMS1117/i,                slug: 'voltage-regulators',     reason: 'AMS1117 LDO' },
  { re: /^LM78[0-9]|^LM79[0-9]/i,   slug: 'voltage-regulators',     reason: 'Classic 78xx/79xx linear regulator' },
  { re: /^LM317|^LM337/i,           slug: 'voltage-regulators',     reason: 'Adjustable linear regulator' },
  { re: /^TPS[0-9]/i,               slug: 'voltage-regulators',     reason: 'TI TPS power IC (most common: regulator)' },
  { re: /^MP[0-9]{4}/i,             slug: 'voltage-regulators',     reason: 'MPS power management' },
  { re: /^MIC[0-9]/i,               slug: 'voltage-regulators',     reason: 'Microchip/Micrel MIC LDO' },
  { re: /^MAX[0-9]/i,               slug: 'voltage-regulators',     reason: 'Maxim MAX (most common in orphans)' },
  { re: /^LP[0-9]/i,                slug: 'voltage-regulators',     reason: 'TI/NSC LP low-power regulator' },

  // ---- Discrete power / MOSFETs / Diodes ----
  // The current category schema does not have a discrete-power or discrete-diode
  // bucket. Rather than misclassify (e.g. MOSFETs landing in gate-drivers or
  // op-amps), leave these IDs orphaned so the data team can add the missing
  // categories later. (Rules below would all fall through to "skip mfr fallback".)
  { re: /^IRF|^IRFZ|^IRL/i,         slug: '__SKIP__', reason: 'MOSFET — no category in DB, skipping rather than misclassify' },
  { re: /^FQP|^FQB|^FQA/i,          slug: '__SKIP__', reason: 'MOSFET — no category in DB' },
  { re: /^AO[0-9]/i,                slug: '__SKIP__', reason: 'MOSFET — no category in DB' },
  { re: /^SI[0-9]{4}|^SIR[0-9]/i,   slug: '__SKIP__', reason: 'MOSFET — no category in DB' },
  { re: /^BSS[0-9]|^BSP[0-9]/i,     slug: '__SKIP__', reason: 'Small-signal MOSFET — no category in DB' },
  { re: /^1N[0-9]{4}|^UF[0-9]/i,    slug: '__SKIP__', reason: 'Discrete diode — no category in DB' },
  { re: /^BAT[0-9]|^SS[0-9]/i,      slug: '__SKIP__', reason: 'Schottky diode — no category in DB' },
  { re: /^SMBJ|^SMAJ|^SMCJ|^BZX/i,  slug: '__SKIP__', reason: 'TVS / zener diode — no category in DB' },

  // ---- Op-amps / amplifiers ----
  { re: /^LM358|^LM324|^LM741/i,    slug: 'amplifiers',             reason: 'Classic op-amp' },
  { re: /^TL07[12]|^TL08[12]/i,     slug: 'amplifiers',             reason: 'TI TL07x/TL08x op-amp' },
  { re: /^OPA[0-9]/i,               slug: 'amplifiers',             reason: 'TI OPA precision op-amp' },
  { re: /^AD8[0-9]{3}/i,            slug: 'amplifiers',             reason: 'ADI AD8xxx amplifier' },

  // ---- Timers / interface ----
  { re: /^NE555|^LM555|^TLC555/i,   slug: 'clock-timing',           reason: '555 timer' },
  { re: /^MAX232|^MAX3232/i,        slug: 'transceivers',           reason: 'RS-232 transceiver' },
  { re: /^FT[0-9]{3}/i,             slug: 'transceivers',           reason: 'FTDI USB-UART bridge' },
  { re: /^CH340|^CH341/i,           slug: 'transceivers',           reason: 'WCH USB-UART bridge' },

  // ---- Logic ----
  { re: /^74HC|^74LS|^74AC|^74F/i,  slug: 'logic',                  reason: '74-series logic family' },

  // ---- Sensors ----
  { re: /^MPU6|^ICM[0-9]/i,         slug: 'sensor-detector-interfaces', reason: 'InvenSense IMU' },
  { re: /^BME[0-9]|^BMP[0-9]/i,     slug: 'sensor-detector-interfaces', reason: 'Bosch environmental sensor' },
  { re: /^DHT[0-9]|^AHT[0-9]/i,     slug: 'sensor-detector-interfaces', reason: 'Humidity sensor module' },
  { re: /^DS18B20|^DS1820/i,        slug: 'sensor-detector-interfaces', reason: 'Maxim 1-Wire temperature sensor' },

  // ---- Passives ----
  // Schema has no MLCC/capacitor/resistor categories — skip rather than
  // misclassify into audio-amplifiers etc.
  { re: /^GRM[0-9]|^CL[0-9]|^EEU|^TAJ|^CRCW/i, slug: '__SKIP__', reason: 'Passive component — no category in DB' },
];

// Some part-numbers can't be inferred but the manufacturer alone is a strong
// hint. We compute this dynamically from indexable products of the same mfr.
async function manufacturerFallback(prisma, mfr) {
  if (!mfr) return null;
  const row = await prisma.$queryRawUnsafe(
    `SELECT "categoryId", COUNT(*)::int AS c FROM "Product"
     WHERE manufacturer = $1 AND indexable = true AND "categoryId" IS NOT NULL
     GROUP BY "categoryId" ORDER BY c DESC LIMIT 1`,
    mfr,
  );
  return row.length > 0 ? row[0].categoryId : null;
}

(async () => {
  const prisma = new PrismaClient();

  // Build slug → id map once
  const allCats = await prisma.category.findMany({ select: { id: true, slug: true } });
  const slugToId = new Map(allCats.map(c => [c.slug, c.id]));

  // Check for any rules whose slug doesn't exist in the DB — warn upfront
  const missingSlugs = new Set();
  for (const r of RULES) {
    if (!slugToId.has(r.slug)) missingSlugs.add(r.slug);
  }
  if (missingSlugs.size > 0) {
    console.warn(`⚠️  Rules reference slugs not in DB (these matches will fall through to mfr-fallback):`);
    for (const s of missingSlugs) console.warn(`    ${s}`);
    console.warn('');
  }

  const orphans = await prisma.product.findMany({
    where: { categoryId: null },
    select: { id: true, partNumber: true, manufacturer: true },
    orderBy: { id: 'asc' },
  });

  const updatedIds = [];
  const counts = { ruleMatched: 0, mfrFallback: 0, explicitSkip: 0, stillOrphan: 0 };
  const sampleByCategory = new Map();
  const stillOrphan = [];
  const skippedByRule = [];

  for (const o of orphans) {
    let matchedRule = null;
    let categoryId = null;
    let explicitlySkipped = false;

    for (const rule of RULES) {
      if (rule.re.test(o.partNumber)) {
        if (rule.slug === '__SKIP__') {
          explicitlySkipped = true;
          matchedRule = rule;
          break;
        }
        const id = slugToId.get(rule.slug);
        if (id) {
          categoryId = id;
          matchedRule = rule;
          break;
        }
      }
    }

    if (explicitlySkipped) {
      counts.explicitSkip++;
      skippedByRule.push({ p: o, reason: matchedRule.reason });
      continue;
    }

    if (categoryId == null) {
      categoryId = await manufacturerFallback(prisma, o.manufacturer);
      if (categoryId != null) counts.mfrFallback++;
    } else {
      counts.ruleMatched++;
    }

    if (categoryId == null) {
      counts.stillOrphan++;
      stillOrphan.push(o);
      continue;
    }

    // Group sample log by resolved category
    const catSlug = allCats.find(c => c.id === categoryId)?.slug || '?';
    if (!sampleByCategory.has(catSlug)) sampleByCategory.set(catSlug, []);
    if (sampleByCategory.get(catSlug).length < 3) {
      sampleByCategory.get(catSlug).push(`${o.partNumber} (${o.manufacturer})${matchedRule ? '  ← rule: ' + matchedRule.reason : '  ← mfr-fallback'}`);
    }

    if (!DRY_RUN) {
      await prisma.product.update({ where: { id: o.id }, data: { categoryId } });
    }
    updatedIds.push(o.id);
  }

  console.log(`\n=== Orphan classification ===`);
  console.log(`Total orphans:                ${orphans.length}`);
  console.log(`Matched by rule:              ${counts.ruleMatched}`);
  console.log(`Resolved by mfr-fallback:     ${counts.mfrFallback}`);
  console.log(`Skipped by rule (no category): ${counts.explicitSkip}  ← discrete/passive parts, DB schema gap`);
  console.log(`Still orphaned (no rule match, no mfr signal): ${counts.stillOrphan}`);
  console.log(`${DRY_RUN ? 'Would update' : 'Updated'}: ${updatedIds.length} products\n`);

  if (skippedByRule.length > 0) {
    console.log(`Skipped by rule (intentional, schema gap):`);
    const reasonCounts = {};
    for (const s of skippedByRule) reasonCounts[s.reason] = (reasonCounts[s.reason] || 0) + 1;
    for (const [r, c] of Object.entries(reasonCounts)) console.log(`  ${String(c).padStart(3)}  ${r}`);
    console.log('');
  }

  console.log(`Sample by resolved category (up to 3 each):`);
  for (const [slug, samples] of sampleByCategory) {
    console.log(`  [${slug}]`);
    for (const s of samples) console.log(`    ${s}`);
  }

  if (stillOrphan.length > 0) {
    console.log(`\nStill orphaned (${stillOrphan.length}):`);
    for (const o of stillOrphan.slice(0, 20)) console.log(`  ${o.partNumber} (${o.manufacturer})`);
    if (stillOrphan.length > 20) console.log(`  ... and ${stillOrphan.length - 20} more`);
  }

  if (IDS_OUT && !DRY_RUN) {
    fs.writeFileSync(IDS_OUT, updatedIds.join(','));
    console.log(`\nIDs written to ${IDS_OUT}`);
  }

  await prisma.$disconnect();
})();
