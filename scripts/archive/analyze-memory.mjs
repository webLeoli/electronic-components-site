/**
 * Deep-dive analysis: Memory, MCU/Modules, and other large flat categories
 * to find sub-type distribution via Description + Type fields
 */
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const filePath = 'C:\\Users\\Acer\\Downloads\\ics.jsonl';

// Categories to deep-analyze
const targets = {
  'Memory Integrated Circuit': { types: new Map(), descKeywords: new Map() },
  'Microcontroller, Microprocessor, FPGA Modules': { types: new Map(), descKeywords: new Map() },
  'Specialized ICs': { types: new Map(), descKeywords: new Map() },
  'Specialized': { types: new Map(), descKeywords: new Map() },
  'Special Purpose': { types: new Map(), descKeywords: new Map() },
  'Application Specific': { types: new Map(), descKeywords: new Map() },
};

// Memory keyword matchers
const memoryKeywords = [
  'SRAM', 'SDRAM', 'DDR', 'DRAM', 'Flash', 'NOR Flash', 'NAND', 
  'EEPROM', 'EPROM', 'FRAM', 'MRAM', 'NVRAM', 'ROM', 'FIFO',
  'CAM', 'PROM',
];

// MCU/Module keyword matchers
const mcuKeywords = [
  'MCU', 'Microcontroller', 'FPGA', 'MPU', 'Microprocessor',
  'DSP', 'SoC', 'ARM', 'RISC-V', 'AVR', 'PIC', '8051',
  'Module', 'Development', 'Evaluation',
];

let totalLines = 0;

const rl = createInterface({
  input: createReadStream(filePath, { encoding: 'utf-8' }),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  if (!line.trim()) continue;
  totalLines++;

  try {
    const item = JSON.parse(line);
    const specs = item.specifications || {};
    const catString = specs['Category'] || '';
    const subCat = catString.split('/').slice(1).join('/').trim();
    const desc = (item['Description'] || '').toUpperCase();
    const typeVal = specs['Type'] || '';

    if (!targets[subCat]) continue;
    const t = targets[subCat];

    // Count Type values
    if (typeVal) {
      t.types.set(typeVal, (t.types.get(typeVal) || 0) + 1);
    } else {
      t.types.set('(no Type)', (t.types.get('(no Type)') || 0) + 1);
    }

    // For Memory: match keywords in description
    if (subCat === 'Memory Integrated Circuit') {
      let matched = false;
      for (const kw of memoryKeywords) {
        if (desc.includes(kw.toUpperCase())) {
          t.descKeywords.set(kw, (t.descKeywords.get(kw) || 0) + 1);
          matched = true;
          break; // first match wins
        }
      }
      if (!matched) t.descKeywords.set('(other)', (t.descKeywords.get('(other)') || 0) + 1);
    }

    // For MCU/Modules: match keywords
    if (subCat === 'Microcontroller, Microprocessor, FPGA Modules') {
      let matched = false;
      for (const kw of mcuKeywords) {
        if (desc.includes(kw.toUpperCase())) {
          t.descKeywords.set(kw, (t.descKeywords.get(kw) || 0) + 1);
          matched = true;
          break;
        }
      }
      if (!matched) t.descKeywords.set('(other)', (t.descKeywords.get('(other)') || 0) + 1);
    }
  } catch {}
  if (totalLines % 100000 === 0) process.stdout.write(`\r  Scanned ${totalLines.toLocaleString()}...`);
}

console.log(`\n\n${'='.repeat(70)}`);
console.log(`DEEP ANALYSIS — ${totalLines.toLocaleString()} products scanned`);
console.log(`${'='.repeat(70)}\n`);

for (const [catName, data] of Object.entries(targets)) {
  const totalInCat = [...data.types.values()].reduce((a, b) => a + b, 0);
  if (totalInCat === 0) continue;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📁 ${catName} — ${totalInCat.toLocaleString()} products`);
  console.log(`${'─'.repeat(60)}`);

  // Types
  console.log(`\n  📋 Type field distribution (top 20):`);
  const sortedTypes = [...data.types.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [type, count] of sortedTypes) {
    console.log(`    ${type.padEnd(50)} ${count.toLocaleString().padStart(8)} (${(count/totalInCat*100).toFixed(1)}%)`);
  }

  // Description keywords
  if (data.descKeywords.size > 0) {
    console.log(`\n  🔍 Description keyword matches:`);
    const sortedKw = [...data.descKeywords.entries()].sort((a, b) => b[1] - a[1]);
    for (const [kw, count] of sortedKw) {
      console.log(`    ${kw.padEnd(50)} ${count.toLocaleString().padStart(8)} (${(count/totalInCat*100).toFixed(1)}%)`);
    }
  }
}
