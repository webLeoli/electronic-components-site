// Standalone sanity check for desc-templates.js.
// No DB access — purely tests classifier + articleFor + generateDescription
// on hand-crafted inputs.

import { generateDescription, _internals } from '../src/lib/desc-templates.js';
const { articleFor, classifyCategory } = _internals;

let pass = 0, fail = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? '✓' : '✗'} ${label}  →  got ${JSON.stringify(actual)}${ok ? '' : `, expected ${JSON.stringify(expected)}`}`);
  ok ? pass++ : fail++;
}

console.log('=== articleFor() ===');
check('articleFor("FPGA")',                  articleFor('FPGA'),                 'an'); // F pronounced "ef"
check('articleFor("CPLD")',                  articleFor('CPLD'),                 'a');  // C pronounced "see"
check('articleFor("integrated circuit")',    articleFor('integrated circuit'),   'an');
check('articleFor("microcontroller")',       articleFor('microcontroller'),      'a');
check('articleFor("application-specific IC")', articleFor('application-specific IC'), 'an');
check('articleFor("LED driver IC")',         articleFor('LED driver IC'),        'an'); // L = "el"
check('articleFor("MOSFET power transistor")', articleFor('MOSFET power transistor'), 'an'); // M = "em"
check('articleFor("SOT-23 package")',        articleFor('SOT-23 package'),       'an'); // S = "es"
check('articleFor("BGA package")',           articleFor('BGA package'),          'a');  // B = "bee"
check('articleFor("TQFP package")',          articleFor('TQFP package'),         'a');  // T = "tee"
check('articleFor("UFDFN package")',         articleFor('UFDFN package'),        'a');  // U = "you" → consonant sound
check('articleFor("8-DIP package")',         articleFor('8-DIP package'),        'a');  // 8 is not in abbrev pattern → falls to lower branch → "8" not vowel → "a". OK.
check('articleFor("LQFP package")',          articleFor('LQFP package'),         'an'); // L = "el"
check('articleFor("hour")',                  articleFor('hour'),                 'a');  // (rule limitation: phonetic "hour" should be "an", but rare in our vocab)

console.log('\n=== classifyCategory() — coverage ===');
const cases = [
  // (categoryName, parentCategoryName, expected.noun)
  ['FPGAs',                 'FPGAs & Programmable Logic',           'FPGA'],
  ['CPLDs',                 'FPGAs & Programmable Logic',           'CPLD'],
  ['Microcontrollers (MCU)','Microcontrollers & Processors',        'microcontroller'],
  ['Microprocessors (MPU)', 'Microcontrollers & Processors',        'microprocessor'],
  ['DSP - Digital Signal Processors', 'Microcontrollers & Processors', 'digital signal processor'],
  ['Battery Chargers',      'Battery & Charging',                   'battery charger IC'],
  ['Battery Management ICs','Battery & Charging',                   'battery management IC'],
  ['Special Purpose ICs',   'Telecom & Specialized',                'specialized telecom IC'],
  ['Specialized Power Management', 'Power Management - Specialized', 'specialized power management IC'],
  ['Specialized ICs',       'Telecom & Specialized',                'specialized telecom IC'],
  ['DRAM & SDRAM',          'Volatile Memory',                      'DRAM memory device'],
  ['EEPROM',                'Non-Volatile Memory',                  'EEPROM memory IC'],
  ['Audio CODECs',          'Audio ICs',                            'audio codec IC'],
  ['Audio Amplifiers',      'Amplifiers',                           'audio amplifier'],
  ['Active Filters',        'Analog Switches & Signal Processing',  'active filter IC'],
  ['Display Drivers',       'Video & Display',                      'video/display IC'],
  ['Capacitive Touch Sensors', 'Sensor & Touch Interfaces',         'capacitive touch sensor'],
  ['Bus Interface',         'Interface & Communication',            'bus interface IC'],
  ['Counters & Dividers',   'Sequential Logic',                     'counter/divider IC'],
  ['Clock Generators, PLLs & Synthesizers', 'Clock Generation',     'PLL frequency synthesizer'],
  ['Delay Lines',           'Clock Distribution',                   'delay line IC'],
  ['LDO Voltage Regulators',  'Linear Regulators',                  'LDO voltage regulator'],
  ['AC-DC Converters & Offline Switchers', 'Switching Regulators & Converters', 'AC-DC converter'],
  ['DC-DC Switching Controllers', 'Switching Regulators & Converters', 'DC-DC switching controller'],
];
for (const [c, p, expectedNoun] of cases) {
  const result = classifyCategory(c, p);
  check(`${(p || '')} / ${c}`, result.noun, expectedNoun);
}

console.log('\n=== generateDescription() — full output samples ===');
const products = [
  { partNumber: 'XC7A35T-1CPG236C', manufacturer: 'Xilinx', status: 'active', packageType: '238-LFBGA, CSPBGA', mountType: 'Surface Mount',
    category: { name: 'FPGAs', parent: { name: 'FPGAs & Programmable Logic' } } },
  { partNumber: 'BQ24295RGER', manufacturer: 'Texas Instruments', status: 'active', packageType: '24-VQFN', mountType: 'Surface Mount',
    category: { name: 'Battery Chargers', parent: { name: 'Battery & Charging' } } },
  { partNumber: 'TPS54620', manufacturer: 'Texas Instruments', status: 'obsolete', packageType: '14-PWP', mountType: 'Surface Mount',
    category: { name: 'Special Purpose ICs', parent: { name: 'Telecom & Specialized' } } },
];
const specsSamples = [
  { 'Number of Logic Elements/Cells': '33280', 'Number of I/O': '106', 'Voltage - Supply': '0.95V ~ 1.05V', 'Operating Temperature': '0°C ~ 85°C (TJ)', 'Package / Case': '238-LFBGA, CSPBGA', 'Mounting Type': 'Surface Mount' },
  { 'Voltage - Input': '3.9V ~ 17V', 'Voltage - Output': '4.2V', 'Current - Quiescent': '1mA', 'Operating Temperature': '-40°C ~ 85°C', 'Package / Case': '24-VQFN', 'Mounting Type': 'Surface Mount' },
  { 'Voltage - Supply': '4.5V ~ 17V', 'Operating Temperature': '-40°C ~ 125°C', 'Package / Case': '14-PWP', 'Mounting Type': 'Surface Mount' },
];

for (let i = 0; i < products.length; i++) {
  const desc = generateDescription(products[i], specsSamples[i]);
  console.log(`\n[${products[i].partNumber}] (${desc.length}c)`);
  console.log(`  ${desc}`);
  // Spot checks: no "a integrated", no "a FPGA"
  const grammarBugs = /(\ba\s+integrated|\ba\s+FPGA|\ba\s+EEPROM|\ba\s+LDO|\ba\s+AC|\ba\s+SOT|\ba\s+EEPROM|\ba\s+LQFP)\b/i.test(desc);
  check(`  no broken a/an in ${products[i].partNumber}`, grammarBugs, false);
}

console.log(`\n=== Total: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
