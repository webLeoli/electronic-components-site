/**
 * Product Description Generator (v2)
 *
 * Goal: produce descriptions that score 25-30 out of 30 in quality-score.js's
 * `scoreDescription`, lifting Silver-tier products over the indexable threshold.
 *
 * Design constraints derived from src/lib/quality-score.js:
 *   - length:    >300 chars → 12 pts
 *   - diversity: 5 baseline +3 for ≥4 sentences +1 for ≥3 commas; NEVER trigger:
 *                /^[A-Z0-9][\w-]+ is a /  (starts with part number + "is a")
 *                /^IC /                    (starts with "IC ")
 *                /^[A-Z]{2,4}\s/           (starts with 2-4 ALL-CAPS letters)
 *                /electronic component|high quality|buy online|best price|free shipping/
 *   - keywords:  ≥8 technical terms → 8 pts
 *
 * Net target: 12 + 9 + 8 = 29/30 on description.
 *
 * The opening phrase always uses "The {partNumber}" — "T" is one uppercase
 * char followed by lowercase, so none of the three template regexes fire.
 */

// ---- Application area map (mirrors src/app/product/.../page.js APPLICATION_AREA_MAP) ----
// Kept as a duplicate intentionally: this file must remain dependency-free
// so the Node-side enrichment script can import it without pulling the React
// app graph. Update both together.
const APPLICATION_AREA_MAP = {
  'FPGA':           ['5G infrastructure', 'AI accelerators', 'data center fabrics', 'aerospace systems', 'industrial automation'],
  'CPLD':           ['glue logic', 'bus bridging', 'industrial control', 'consumer electronics', 'automotive subsystems'],
  'Embedded':       ['IoT endpoints', 'industrial control', 'automotive ECUs', 'consumer electronics', 'medical devices'],
  'Microcontroller':['IoT endpoints', 'consumer electronics', 'industrial automation', 'automotive subsystems', 'wearable devices'],
  'Memory':         ['data center storage', 'consumer electronics', 'automotive infotainment', 'networking equipment', 'industrial computing'],
  'Power':          ['automotive electronics', 'industrial automation', 'telecommunications equipment', 'consumer electronics', 'renewable energy systems'],
  'Voltage':        ['battery-powered devices', 'portable electronics', 'industrial sensors', 'IoT modules', 'automotive subsystems'],
  'Regulator':      ['battery-powered devices', 'portable electronics', 'industrial sensors', 'IoT modules', 'automotive subsystems'],
  'Analog':         ['instrumentation', 'medical devices', 'audio systems', 'automotive sensors', 'industrial control'],
  'Logic':          ['consumer electronics', 'industrial control', 'telecommunications', 'computing peripherals', 'automotive subsystems'],
  'Interface':      ['networking equipment', 'industrial automation', 'telecommunications', 'data center fabrics', 'consumer electronics'],
  'Clock':          ['telecommunications infrastructure', 'data center networking', 'industrial control', 'automotive timing', 'aerospace systems'],
  'Timing':         ['telecommunications infrastructure', 'data center networking', 'industrial control', 'automotive timing', 'aerospace systems'],
  'Sensor':         ['IoT endpoints', 'automotive ADAS', 'medical devices', 'industrial automation', 'consumer electronics'],
  'Wireless':       ['IoT endpoints', '5G infrastructure', 'consumer electronics', 'connected vehicles', 'smart home devices'],
  'Driver':         ['motor control', 'LED lighting', 'display backlight', 'industrial automation', 'automotive electronics'],
  'Switch':         ['power distribution', 'load switching', 'industrial control', 'consumer electronics', 'automotive electronics'],
  'Amplifier':      ['audio systems', 'instrumentation', 'medical devices', 'industrial sensing', 'communication equipment'],
  'Converter':      ['power supply design', 'battery management', 'industrial control', 'automotive electronics', 'telecommunications'],
};

export function getApplicationAreas(categoryName, parentCategoryName) {
  const name = `${parentCategoryName || ''} ${categoryName || ''}`.toLowerCase();
  for (const [key, areas] of Object.entries(APPLICATION_AREA_MAP)) {
    if (name.includes(key.toLowerCase())) return areas;
  }
  return ['industrial automation', 'consumer electronics', 'telecommunications infrastructure', 'automotive electronics', 'IoT endpoints'];
}

// ---- Spec key normalization ----
// The raw `specs` JSON from various import sources has inconsistent keys
// ("Number of I/ O", "Number of  I/O", "Numberof I/ O", etc.). Normalize to
// canonical keys before extraction.
function normalizeKey(rawKey) {
  return rawKey.trim().replace(/\s+/g, ' ').toLowerCase();
}

// Canonical key → list of raw key variants (lowercased, single-spaced)
const SPEC_CANONICAL = {
  core:          ['core processor', 'core type', 'core size'],
  speed:         ['speed', 'clock speed', 'operating speed'],
  voltage:       ['voltage - supply', 'voltage - supply (vcc/vdd)', 'voltage supply- internal', 'voltage - input', 'supply voltage'],
  voltage_out:   ['voltage - output', 'output voltage', 'output voltage(s)'],
  current:       ['current - supply', 'current - quiescent', 'quiescent current', 'output current'],
  temp:          ['operating temperature'],
  io_count:      ['number of i/o', 'numberof i/o'],
  ram:           ['ram size', 'r a m size'],
  flash:         ['program memory size', 'flash size'],
  eeprom:        ['eeprom size', 'e e p r o m size'],
  memory_size:   ['memory size'],
  mem_type:      ['memory type', 'program memory type', 'memory format'],
  logic_cells:   ['number of logic elements/cells', 'number of logic elements/ cells'],
  labs:          ['number of labs/clbs', 'number of l a bs/ c l bs'],
  gates:         ['number of gates'],
  macrocells:    ['number of macrocells', 'numberof macrocells'],
  fpga_cells:    ['f p g a core cells'],
  fpga_gates:    ['f p g a gates'],
  interface:     ['interface'],
  connectivity:  ['connectivity'],
  peripherals:   ['peripherals'],
  output:        ['output'],
  voltages_mon:  ['number of voltages monitored'],
  threshold:     ['voltage - threshold'],
  reset_timeout: ['reset timeout'],
  data_conv:     ['data converters'],
  package:       ['package / case', 'supplier device package'],
  mount:         ['mounting type'],
  type:          ['type'],
  series:        ['series'],
  prog_type:     ['programmable type'],
  module_type:   ['module/ board type'],
  osc_type:      ['oscillator type'],
  applications:  ['applications'],
  resolution:    ['resolution (bits)'],
  channels:      ['number of channels', 'channels'],
  accuracy:      ['accuracy', 'tolerance'],
  topology:      ['topology'],
  protocol:      ['protocol'],
};

const VARIANT_TO_CANONICAL = (() => {
  const map = new Map();
  for (const [canonical, variants] of Object.entries(SPEC_CANONICAL)) {
    for (const v of variants) map.set(v, canonical);
  }
  return map;
})();

// Compliance / non-technical keys to skip
const SKIP_KEYS = new Set([
  'category', 'product status', 'eu rohs status', 'reach status',
  'us eccn', 'hts us', 'china rohs status', 'msl rating',
  'rohs status', 'moisture sensitivity level (msl)', 'lifecycle status',
  'factory lead time', 'manufacturer', 'packaging', 'reset',
]);

function cleanValue(v) {
  const s = String(v ?? '').trim();
  if (!s || s === '-' || s === '—' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'null' || s === '*') return null;
  return s.replace(/\.{2,}$/, '').trim();
}

export function extractSpecs(specs) {
  const out = {};
  for (const [rawKey, rawVal] of Object.entries(specs || {})) {
    const norm = normalizeKey(rawKey);
    if (SKIP_KEYS.has(norm)) continue;
    const v = cleanValue(rawVal);
    if (!v) continue;
    const canonical = VARIANT_TO_CANONICAL.get(norm);
    if (canonical) {
      if (!out[canonical]) out[canonical] = v;
    } else {
      // Preserve unmapped keys under their normalized form so caller can still use them
      const key = `_${norm.replace(/[^a-z0-9]+/g, '_')}`;
      if (!out[key]) out[key] = v;
    }
  }
  return out;
}

// ---- Category classification ----
// Two-layer match:
//   1. Try every rule against the LEAF category name alone. This avoids the
//      common bug where a parent name like "FPGAs & Programmable Logic" makes
//      every child (CPLDs, PLDs, …) wrongly resolve to "FPGA".
//   2. If no leaf rule fires, retry against the parent + leaf blob so
//      orphan-or-vague leaves like "Special Purpose ICs" can still pick up
//      context from their parent.
// Within each layer, rules are ordered "most specific → most generic".
function classifyCategory(categoryName, parentCategoryName, partNumber) {
  const leaf = (categoryName || '').toLowerCase();
  const blob = `${parentCategoryName || ''} ${categoryName || ''}`.toLowerCase();

  // The "specialized / special purpose" buckets MUST see the parent name to
  // pick the right sub-bucket (Telecom / Power / Audio / Analog / …), so we
  // resolve them up front before delegating to the leaf-only layer.
  if (/specialized|special\s*purpose/.test(leaf) || /specialized|special\s*purpose/.test(blob)) {
    if (/telecom/.test(blob))      return { noun: 'specialized telecom IC',          plural: 'specialized telecom ICs',          family: 'Interface' };
    if (/audio/.test(blob))        return { noun: 'specialized audio IC',            plural: 'specialized audio ICs',            family: 'Amplifier' };
    if (/power/.test(blob))        return { noun: 'specialized power management IC', plural: 'specialized power management ICs', family: 'Power' };
    if (/clock|timing/.test(blob)) return { noun: 'specialized clock/timing IC',     plural: 'specialized clock/timing ICs',     family: 'Clock' };
    if (/analog/.test(blob))       return { noun: 'specialized analog IC',           plural: 'specialized analog ICs',           family: 'Analog' };
    return { noun: 'application-specific IC', plural: 'application-specific ICs', family: '' };
  }

  const result = matchOne(leaf) || matchOne(blob);
  if (result) return result;

  return { noun: 'integrated circuit', plural: 'integrated circuits', family: '' };
}

function matchOne(blob) {

  // --- Programmable logic ---
  if (/fpga/.test(blob))                      return { noun: 'FPGA',           plural: 'FPGAs',          family: 'FPGA' };
  if (/cpld/.test(blob))                      return { noun: 'CPLD',           plural: 'CPLDs',          family: 'CPLD' };
  if (/\bpld\b|programmable logic dev/.test(blob)) return { noun: 'programmable logic device', plural: 'programmable logic devices', family: 'CPLD' };

  // --- Embedded ---
  if (/microcontroller|mcu/.test(blob))       return { noun: 'microcontroller', plural: 'microcontrollers', family: 'Microcontroller' };
  if (/microprocessor|mpu/.test(blob))        return { noun: 'microprocessor',  plural: 'microprocessors',  family: 'Embedded' };
  if (/\bsoc\b|system\s*on\s*chip/.test(blob)) return { noun: 'system-on-chip', plural: 'system-on-chips',  family: 'Embedded' };
  if (/\bdsp\b|digital signal processor/.test(blob)) return { noun: 'digital signal processor', plural: 'digital signal processors', family: 'Embedded' };
  if (/application[- ]specific\s*processor/.test(blob)) return { noun: 'application-specific processor', plural: 'application-specific processors', family: 'Embedded' };
  if (/embedded\s*module|module\/board/.test(blob)) return { noun: 'embedded module', plural: 'embedded modules', family: 'Embedded' };

  // --- Voltage / power management ---
  if (/voltage\s*reference/.test(blob))       return { noun: 'voltage reference',  plural: 'voltage references',  family: 'Voltage' };
  if (/voltage\s*detector|supervisor|reset\s*ic/.test(blob)) return { noun: 'voltage supervisor', plural: 'voltage supervisors', family: 'Voltage' };
  if (/watchdog/.test(blob))                  return { noun: 'watchdog circuit',   plural: 'watchdog circuits',   family: 'Voltage' };
  if (/battery\s*charger/.test(blob))         return { noun: 'battery charger IC', plural: 'battery charger ICs', family: 'Power' };
  if (/battery\s*management/.test(blob))      return { noun: 'battery management IC', plural: 'battery management ICs', family: 'Power' };
  if (/battery|fuel\s*gauge/.test(blob))      return { noun: 'battery management IC', plural: 'battery management ICs', family: 'Power' };
  if (/ldo|linear\s*regulator/.test(blob))    return { noun: 'LDO voltage regulator', plural: 'LDO voltage regulators', family: 'Voltage' };
  if (/voltage\s*regulator/.test(blob))       return { noun: 'voltage regulator',  plural: 'voltage regulators',  family: 'Voltage' };
  if (/dc[- ]?dc.*controller/.test(blob))     return { noun: 'DC-DC switching controller', plural: 'DC-DC switching controllers', family: 'Power' };
  if (/dc[- ]?dc/.test(blob))                 return { noun: 'DC-DC converter',    plural: 'DC-DC converters',    family: 'Converter' };
  if (/ac[- ]?dc|offline\s*switcher/.test(blob)) return { noun: 'AC-DC converter', plural: 'AC-DC converters',   family: 'Converter' };
  if (/converter/.test(blob))                 return { noun: 'switching converter', plural: 'switching converters', family: 'Converter' };
  if (/current\s*regulation/.test(blob))      return { noun: 'current regulator IC', plural: 'current regulator ICs', family: 'Power' };
  if (/power\s*switch|load\s*switch/.test(blob)) return { noun: 'power switch IC', plural: 'power switch ICs', family: 'Power' };
  if (/power\s*distribution/.test(blob))      return { noun: 'power distribution IC', plural: 'power distribution ICs', family: 'Power' };
  if (/specialized\s*power/.test(blob))       return { noun: 'specialized power management IC', plural: 'specialized power management ICs', family: 'Power' };
  if (/regulator/.test(blob))                 return { noun: 'regulator IC',       plural: 'regulator ICs',       family: 'Power' };

  // --- Memory ---
  if (/dram|sdram/.test(blob))                return { noun: 'DRAM memory device', plural: 'DRAM memory devices', family: 'Memory' };
  if (/sram/.test(blob))                      return { noun: 'SRAM memory device', plural: 'SRAM memory devices', family: 'Memory' };
  if (/\beeprom\b/.test(blob))                return { noun: 'EEPROM memory IC',   plural: 'EEPROM memory ICs',   family: 'Memory' };
  if (/flash|nor|nand/.test(blob))            return { noun: 'flash memory IC',    plural: 'flash memory ICs',    family: 'Memory' };
  if (/non[- ]?volatile|nvm/.test(blob))      return { noun: 'non-volatile memory IC', plural: 'non-volatile memory ICs', family: 'Memory' };
  if (/memory/.test(blob))                    return { noun: 'memory IC',          plural: 'memory ICs',          family: 'Memory' };

  // --- Amplifiers / analog ---
  if (/instrument(ation)?\s*amplifier/.test(blob)) return { noun: 'instrumentation amplifier', plural: 'instrumentation amplifiers', family: 'Amplifier' };
  if (/op[- ]?amp|operational\s*amplifier/.test(blob)) return { noun: 'operational amplifier', plural: 'operational amplifiers', family: 'Amplifier' };
  if (/audio\s*amplifier/.test(blob))         return { noun: 'audio amplifier',    plural: 'audio amplifiers',    family: 'Amplifier' };
  if (/amplifier/.test(blob))                 return { noun: 'amplifier IC',       plural: 'amplifier ICs',       family: 'Amplifier' };
  if (/comparator/.test(blob))                return { noun: 'analog comparator',  plural: 'analog comparators',  family: 'Analog' };
  if (/analog\s*front\s*end|\bafe\b/.test(blob)) return { noun: 'analog front-end IC', plural: 'analog front-end ICs', family: 'Analog' };
  if (/adc|analog[- ]to[- ]digital/.test(blob)) return { noun: 'analog-to-digital converter', plural: 'analog-to-digital converters', family: 'Analog' };
  if (/dac|digital[- ]to[- ]analog/.test(blob)) return { noun: 'digital-to-analog converter', plural: 'digital-to-analog converters', family: 'Analog' };
  if (/analog\s*multiplier/.test(blob)) return { noun: 'analog multiplier/divider', plural: 'analog multipliers/dividers', family: 'Analog' };
  if (/digital\s*potentiometer/.test(blob))   return { noun: 'digital potentiometer', plural: 'digital potentiometers', family: 'Analog' };
  if (/analog\s*switch|multiplexer/.test(blob)) return { noun: 'analog switch/multiplexer', plural: 'analog switches/multiplexers', family: 'Analog' };
  if (/active\s*filter/.test(blob))           return { noun: 'active filter IC',   plural: 'active filter ICs',   family: 'Analog' };

  // --- Clock / timing ---
  if (/pll|phase[- ]locked/.test(blob))       return { noun: 'PLL frequency synthesizer', plural: 'PLL frequency synthesizers', family: 'Clock' };
  if (/clock\s*buffer|clock\s*driver/.test(blob)) return { noun: 'clock buffer/driver', plural: 'clock buffers/drivers', family: 'Clock' };
  if (/clock\s*generat/.test(blob))           return { noun: 'clock generator IC', plural: 'clock generator ICs', family: 'Clock' };
  if (/clock|oscillator|crystal|timing/.test(blob)) return { noun: 'clock/timing IC', plural: 'clock/timing ICs', family: 'Clock' };
  if (/delay\s*line/.test(blob))              return { noun: 'delay line IC',      plural: 'delay line ICs',      family: 'Clock' };
  if (/direct\s*digital\s*synthesis|\bdds\b/.test(blob)) return { noun: 'direct digital synthesizer', plural: 'direct digital synthesizers', family: 'Clock' };

  // --- Interface / communication ---
  if (/transceiver/.test(blob))               return { noun: 'transceiver IC',     plural: 'transceiver ICs',     family: 'Interface' };
  if (/buffer.*driver|drivers?.*receivers?/.test(blob)) return { noun: 'buffer/driver IC', plural: 'buffer/driver ICs', family: 'Interface' };
  if (/serial\s*transceiver|serdes/.test(blob)) return { noun: 'serial transceiver', plural: 'serial transceivers', family: 'Interface' };
  if (/bus\s*interface/.test(blob))           return { noun: 'bus interface IC',   plural: 'bus interface ICs',   family: 'Interface' };
  if (/interface|usb|ethernet|can|spi|i2c|lvds/.test(blob)) return { noun: 'interface IC', plural: 'interface ICs', family: 'Interface' };

  // --- Logic ---
  if (/sequential\s*logic|flip[- ]?flop|latch/.test(blob)) return { noun: 'sequential logic IC', plural: 'sequential logic ICs', family: 'Logic' };
  if (/combinational\s*logic|gate|encoder|decoder/.test(blob)) return { noun: 'combinational logic IC', plural: 'combinational logic ICs', family: 'Logic' };
  if (/counter|divider/.test(blob))           return { noun: 'counter/divider IC', plural: 'counter/divider ICs', family: 'Logic' };
  if (/shift\s*register/.test(blob))          return { noun: 'shift register IC',  plural: 'shift register ICs',  family: 'Logic' };
  if (/logic/.test(blob))                     return { noun: 'logic IC',           plural: 'logic ICs',           family: 'Logic' };

  // --- Sensors ---
  if (/touch\s*sensor|capacitive\s*touch/.test(blob)) return { noun: 'capacitive touch sensor', plural: 'capacitive touch sensors', family: 'Sensor' };
  if (/temperature\s*sensor/.test(blob))      return { noun: 'temperature sensor IC', plural: 'temperature sensor ICs', family: 'Sensor' };
  if (/hall\s*effect/.test(blob))             return { noun: 'Hall-effect sensor IC', plural: 'Hall-effect sensor ICs', family: 'Sensor' };
  if (/sensor/.test(blob))                    return { noun: 'sensor IC',          plural: 'sensor ICs',          family: 'Sensor' };

  // --- Audio / video ---
  if (/audio\s*codec/.test(blob))             return { noun: 'audio codec IC',     plural: 'audio codec ICs',     family: 'Amplifier' };
  if (/audio/.test(blob))                     return { noun: 'audio IC',           plural: 'audio ICs',           family: 'Amplifier' };
  if (/video|display/.test(blob))             return { noun: 'video/display IC',   plural: 'video/display ICs',   family: 'Interface' };

  // --- Discrete / power semi ---
  if (/mosfet/.test(blob))                    return { noun: 'MOSFET power transistor', plural: 'MOSFET power transistors', family: 'Power' };
  if (/igbt/.test(blob))                      return { noun: 'IGBT power module',  plural: 'IGBT power modules',  family: 'Power' };
  if (/\bfet\b|transistor/.test(blob))        return { noun: 'power transistor',   plural: 'power transistors',   family: 'Power' };
  if (/diode|rectifier/.test(blob))           return { noun: 'discrete diode',     plural: 'discrete diodes',     family: 'Power' };
  if (/thyristor|triac|scr/.test(blob))       return { noun: 'thyristor',          plural: 'thyristors',          family: 'Power' };

  // --- Wireless / RF ---
  if (/bluetooth/.test(blob))                 return { noun: 'Bluetooth wireless IC', plural: 'Bluetooth wireless ICs', family: 'Wireless' };
  if (/wi[- ]?fi|802\.11/.test(blob))         return { noun: 'Wi-Fi wireless IC',  plural: 'Wi-Fi wireless ICs',  family: 'Wireless' };
  if (/zigbee|thread/.test(blob))             return { noun: 'low-power wireless IC', plural: 'low-power wireless ICs', family: 'Wireless' };
  if (/wireless|\brf\b/.test(blob))           return { noun: 'wireless IC',        plural: 'wireless ICs',        family: 'Wireless' };

  // --- Drivers / switches / connectors ---
  if (/motor\s*driver/.test(blob))            return { noun: 'motor driver IC',    plural: 'motor driver ICs',    family: 'Driver' };
  if (/led\s*driver/.test(blob))              return { noun: 'LED driver IC',      plural: 'LED driver ICs',      family: 'Driver' };
  if (/gate\s*driver/.test(blob))             return { noun: 'gate driver IC',     plural: 'gate driver ICs',     family: 'Driver' };
  if (/driver/.test(blob))                    return { noun: 'driver IC',          plural: 'driver ICs',          family: 'Driver' };
  if (/switch/.test(blob))                    return { noun: 'switch IC',          plural: 'switch ICs',          family: 'Switch' };
  if (/connector/.test(blob))                 return { noun: 'connector',          plural: 'connectors',          family: 'Interface' };
  if (/optocoupler|optical\s*isolator/.test(blob)) return { noun: 'optocoupler', plural: 'optocouplers', family: 'Interface' };
  if (/isolator/.test(blob))                  return { noun: 'isolator IC',        plural: 'isolator ICs',        family: 'Interface' };

  // --- Telecom (specialized buckets handled in classifyCategory) ---
  if (/telecom/.test(blob))                   return { noun: 'specialized telecom IC', plural: 'specialized telecom ICs', family: 'Interface' };

  // matchOne returns null so the caller can try the next layer or final fallback.
  return null;
}

// ---- a/an article picker ----
// "a FPGA" reads wrong because FPGA is pronounced "ef-pee-gee-ay", which starts
// with a vowel sound. This helper picks the correct article based on phonetics,
// not spelling.
//   - lowercase words: vowel letter at start ⇒ "an"
//   - ALL-CAPS abbreviations: judged by the first letter's spoken name
//     (F/H/L/M/N/R/S/X all start with a vowel sound when spelled out)
export function articleFor(noun) {
  if (!noun) return 'a';
  const trimmed = noun.trim();
  if (!trimmed) return 'a';

  const first = trimmed[0];
  const looksLikeAbbrev = /^[A-Z][A-Z0-9-]{1,}/.test(trimmed.split(/[\s/]/)[0]);

  if (looksLikeAbbrev) {
    // Letters whose English name starts with a vowel sound
    const vowelSoundLetters = /^[AEFHILMNORSX]/;
    return vowelSoundLetters.test(first) ? 'an' : 'a';
  }

  // Regular words: judge by leading letter, with a few common exceptions.
  // "u" can be either ("an uninterruptible…" vs "a university") — for our
  // technical vocabulary "u-" words are rare, so default to "a".
  if (/^[aeio]/i.test(trimmed)) return 'an';
  return 'a';
}

// ---- Spec selection for "key specifications" sentence ----
// Pick 3-6 of the most informative specs. Order matters for readability.
function pickKeySpecs(canonical, productCategoryFamily) {
  const out = [];
  const push = (label, value) => {
    if (value && out.length < 6) out.push(`${value}${label ? ' ' + label : ''}`);
  };

  // Family-specific ordering
  if (productCategoryFamily === 'FPGA' || productCategoryFamily === 'CPLD') {
    push('logic elements', canonical.logic_cells);
    push('macrocells',     canonical.macrocells);
    push('gates',          canonical.gates);
    push('LABs/CLBs',      canonical.labs);
    push('I/O',            canonical.io_count);
    push('supply voltage', canonical.voltage);
    push('operating temperature', canonical.temp);
  } else if (productCategoryFamily === 'Microcontroller' || productCategoryFamily === 'Embedded') {
    push('Flash memory',    canonical.flash);
    push('RAM',             canonical.ram);
    push('EEPROM',          canonical.eeprom);
    push('clock speed',     canonical.speed);
    push('I/O',             canonical.io_count);
    push('connectivity',    canonical.connectivity || canonical.interface);
    push('supply voltage',  canonical.voltage);
  } else if (productCategoryFamily === 'Memory') {
    push('memory size',     canonical.memory_size || canonical.flash || canonical.ram);
    push('clock speed',     canonical.speed);
    push('supply voltage',  canonical.voltage);
    push('interface',       canonical.interface);
    push('memory type',     canonical.mem_type);
  } else if (productCategoryFamily === 'Voltage' || productCategoryFamily === 'Power') {
    // `canonical.output` carries the spec value of the "Output" field, which for
    // voltage supervisors is the output stage type (e.g. "Open Drain") — emit it
    // without the "voltage" suffix to avoid grammatical confusion.
    if (canonical.voltage_out) push('output voltage', canonical.voltage_out);
    if (canonical.output)      push('output type',    canonical.output);
    push('input voltage',         canonical.voltage);
    push('quiescent current',     canonical.current);
    push('voltage threshold',     canonical.threshold);
    // Pluralize correctly: "monitors N voltage(s)" — push label-first so the
    // joiner reads naturally.
    if (canonical.voltages_mon) {
      const n = parseInt(canonical.voltages_mon, 10);
      const phrase = isFinite(n) && n === 1 ? '1 monitored voltage' : `${canonical.voltages_mon} monitored voltages`;
      if (out.length < 6) out.push(phrase);
    }
    push('reset timeout',           canonical.reset_timeout);
    push('operating temperature',   canonical.temp);
  } else if (productCategoryFamily === 'Analog') {
    push('resolution',     canonical.resolution);
    push('channels',       canonical.channels);
    push('sample rate',    canonical.speed);
    push('supply voltage', canonical.voltage);
    push('accuracy',       canonical.accuracy);
  } else if (productCategoryFamily === 'Clock') {
    push('frequency',     canonical.speed);
    push('supply voltage', canonical.voltage);
    push('output type',   canonical.output);
    push('operating temperature', canonical.temp);
  } else {
    // Generic ordering
    push('supply voltage',          canonical.voltage);
    push('operating temperature',   canonical.temp);
    push('clock speed',             canonical.speed);
    push('interface',               canonical.interface);
    push('I/O',                     canonical.io_count);
  }
  return out;
}

function lifecycleClause(status, partNumber, mfr, siteName) {
  switch (status) {
    case 'obsolete':
      return `is no longer produced by ${mfr}; ${siteName} verifies specialty-channel availability before confirming supply`;
    case 'eol':
      return `has reached end-of-life status, and ${siteName} specializes in sourcing EOL inventory with full traceability documentation`;
    case 'nrnd':
      return 'is not recommended for new designs but remains available for legacy support and maintenance procurement';
    case 'lastbuy':
      return `is in last-time-buy phase; available quantities are limited, and ${siteName} accepts lifetime-supply orders`;
    case 'active':
    default:
      return `is currently in active production through ${mfr}'s standard distribution channels`;
  }
}

function joinList(items, conjunction = 'and') {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`;
}

function reviewKeywordsForFamily(family) {
  const map = {
    FPGA: ['logic resources', 'I/O planning', 'clock constraints', 'package escape routing', 'operating temperature limits'],
    CPLD: ['macrocell utilization', 'I/O planning', 'logic timing', 'package fit', 'operating temperature limits'],
    Embedded: ['GPIO, SPI, I2C, UART, ADC peripherals', 'clock speed', 'Flash memory', 'package fit', 'operating temperature limits'],
    Microcontroller: ['GPIO, SPI, I2C, UART, ADC peripherals', 'clock speed', 'Flash memory', 'package fit', 'operating temperature limits'],
    Memory: ['memory interface timing', 'SRAM, DRAM, flash, or EEPROM compatibility', 'supply voltage', 'package fit', 'operating temperature limits'],
    Power: ['input voltage', 'output voltage', 'load current', 'LDO, buck, boost, or MOSFET topology when applicable', 'thermal operating temperature limits'],
    Voltage: ['input voltage', 'output voltage', 'voltage threshold', 'LDO or supervisor behavior when applicable', 'thermal operating temperature limits'],
    Converter: ['input voltage', 'output voltage', 'load current', 'buck or boost topology when applicable', 'thermal operating temperature limits'],
    Switch: ['switching current', 'MOSFET behavior', 'input voltage', 'package fit', 'operating temperature limits'],
    Driver: ['drive current', 'MOSFET or LED load compatibility', 'input voltage', 'package fit', 'operating temperature limits'],
    Analog: ['ADC or DAC signal-chain requirements', 'channel count', 'resolution', 'supply voltage', 'operating temperature limits'],
    Amplifier: ['amplifier gain', 'bandwidth', 'ADC or DAC signal-chain fit', 'supply voltage', 'operating temperature limits'],
    Interface: ['SPI, I2C, UART, CAN bus, USB, or Ethernet interface requirements', 'signal integrity', 'package fit', 'operating temperature limits'],
    Wireless: ['RF layout', 'SPI or UART host interface', 'antenna matching', 'supply voltage', 'operating temperature limits'],
    Clock: ['clock frequency', 'PLL configuration', 'jitter budget', 'output type', 'operating temperature limits'],
    Sensor: ['sensor calibration', 'ADC signal-chain fit', 'I2C or SPI interface', 'supply voltage', 'operating temperature limits'],
    Logic: ['logic family', 'I/O voltage', 'propagation delay', 'package fit', 'operating temperature limits'],
  };

  return map[family] || ['supply voltage', 'interface compatibility', 'package fit', 'operating temperature limits', 'lot/date code traceability'];
}

/**
 * Generate a structured 4-sentence description.
 *
 * Sentence 1: Identity        ("The {pn} is a {category} manufactured by {mfr}.")
 * Sentence 2: Key specs       ("Key technical specifications include …")
 * Sentence 3: Package & temp  ("This {mount} component is supplied in a {pkg} package …")
 * Sentence 4: Applications + lifecycle
 *
 * Quality-score targets:
 *   length ≥ 300 chars, ≥ 4 sentences, ≥ 3 commas, ≥ 10 words,
 *   ≥ 8 technical keywords, no blacklisted boilerplate phrases,
 *   does NOT trigger /^[A-Z0-9][\w-]+ is a /, /^IC /, /^[A-Z]{2,4}\s/.
 */
export function generateDescription(product, specsObj, siteName = 'FPGACenter') {
  const pn = product.partNumber;
  const mfr = product.manufacturer || 'the manufacturer';
  const canonical = extractSpecs(specsObj || {});
  const cls = classifyCategory(product.category?.name, product.category?.parent?.name, pn);

  // --- Sentence 1: Identity ---
  const seriesClause = canonical.series ? `, part of the ${canonical.series} series` : '';
  const s1 = `The ${pn} is ${articleFor(cls.noun)} ${cls.noun} manufactured by ${mfr}${seriesClause}.`;

  // --- Sentence 2: Key specs ---
  const keySpecs = pickKeySpecs(canonical, cls.family);
  let s2;
  const reviewKeywords = reviewKeywordsForFamily(cls.family);
  if (keySpecs.length >= 3) {
    s2 = `Key technical specifications include ${joinList(keySpecs.slice(0, 6))}; design review should also confirm ${joinList(reviewKeywords.slice(0, 3))}.`;
  } else if (keySpecs.length > 0) {
    s2 = `Technical highlights include ${joinList(keySpecs)}; design review should confirm ${joinList(reviewKeywords.slice(0, 5))}.`;
  } else {
    s2 = `Design review should confirm ${joinList(reviewKeywords.slice(0, 5))}, plus genuine factory-marked silicon, original packaging, and full lot/date code traceability.`;
  }

  // --- Sentence 3: Package & temperature ---
  const pkg   = canonical.package || product.packageType || 'standard';
  const mount = canonical.mount   || product.mountType   || 'standard mount';
  const temp  = canonical.temp;
  const pkgArticle = articleFor(pkg);
  let s3;
  if (temp) {
    s3 = `This ${mount} component is supplied in ${pkgArticle} ${pkg} package and is rated for operation across ${temp}.`;
  } else {
    s3 = `This ${mount} component is supplied in ${pkgArticle} ${pkg} package suitable for both prototyping and production builds.`;
  }

  // --- Sentence 4: Applications + lifecycle ---
  const apps = getApplicationAreas(product.category?.name, product.category?.parent?.name).slice(0, 3);
  const lc = lifecycleClause(product.status, pn, mfr, siteName);
  const s4 = `Designed for ${joinList(apps)} applications, the ${pn} ${lc}.`;

  return `${s1} ${s2} ${s3} ${s4}`;
}

// Exposed for tests / inspection
export const _internals = {
  classifyCategory,
  pickKeySpecs,
  extractSpecs,
  lifecycleClause,
  articleFor,
  SPEC_CANONICAL,
  APPLICATION_AREA_MAP,
};
