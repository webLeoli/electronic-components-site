/**
 * Analyze category distribution in ics.jsonl
 * Outputs: top-level categories, sub-categories, counts, and samples
 */
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const filePath = process.argv[2] || 'C:\\Users\\Acer\\Downloads\\ics.jsonl';
console.log(`📂 Analyzing: ${filePath}\n`);

// Category tree: parentCategory -> { childCategory -> count }
const categoryTree = new Map();
// Manufacturer distribution
const manufacturers = new Map();
// Products with no category
let noCategoryCount = 0;
let totalLines = 0;
// Sample 'Type' field per subcategory
const typesByCategory = new Map();

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
    const catString = specs['Category'];
    const mfr = item['Manufacturer'] || 'Unknown';
    
    // Count manufacturers
    manufacturers.set(mfr, (manufacturers.get(mfr) || 0) + 1);

    if (!catString) {
      noCategoryCount++;
      continue;
    }

    // Parse "Parent/Child" format
    const parts = catString.split('/');
    const parent = parts[0]?.trim() || 'Unknown';
    const child = parts.slice(1).join('/').trim() || '(no subcategory)';

    if (!categoryTree.has(parent)) {
      categoryTree.set(parent, new Map());
    }
    const children = categoryTree.get(parent);
    children.set(child, (children.get(child) || 0) + 1);

    // Collect Type field samples
    const typeVal = specs['Type'];
    if (typeVal) {
      const key = `${parent}/${child}`;
      if (!typesByCategory.has(key)) {
        typesByCategory.set(key, new Map());
      }
      const types = typesByCategory.get(key);
      types.set(typeVal, (types.get(typeVal) || 0) + 1);
    }
  } catch (e) { /* skip */ }

  if (totalLines % 100000 === 0) {
    process.stdout.write(`\r  Scanned ${totalLines.toLocaleString()} lines...`);
  }
}

console.log(`\r\n\n${'='.repeat(70)}`);
console.log(`📊 ANALYSIS COMPLETE — ${totalLines.toLocaleString()} total products`);
console.log(`${'='.repeat(70)}\n`);

// Sort and print category tree
console.log(`🔴 Products with NO category: ${noCategoryCount.toLocaleString()}\n`);

console.log(`${'─'.repeat(70)}`);
console.log(`📁 CATEGORY TREE (${categoryTree.size} top-level categories)`);
console.log(`${'─'.repeat(70)}\n`);

// Sort parents by total count descending
const sortedParents = [...categoryTree.entries()]
  .map(([parent, children]) => {
    const total = [...children.values()].reduce((a, b) => a + b, 0);
    return { parent, children, total };
  })
  .sort((a, b) => b.total - a.total);

for (const { parent, children, total } of sortedParents) {
  console.log(`\n▪ ${parent} — ${total.toLocaleString()} products`);
  
  // Sort children by count desc
  const sortedChildren = [...children.entries()].sort((a, b) => b[1] - a[1]);
  for (const [child, count] of sortedChildren) {
    const pct = (count / totalLines * 100).toFixed(1);
    console.log(`    ├── ${child} — ${count.toLocaleString()} (${pct}%)`);
    
    // Show top 5 "Type" values for this subcategory
    const key = `${parent}/${child}`;
    const types = typesByCategory.get(key);
    if (types && types.size > 0) {
      const topTypes = [...types.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      for (const [type, cnt] of topTypes) {
        console.log(`    │     ↳ Type: "${type}" (${cnt.toLocaleString()})`);
      }
    }
  }
}

// Top 30 manufacturers
console.log(`\n${'─'.repeat(70)}`);
console.log(`🏭 TOP 30 MANUFACTURERS`);
console.log(`${'─'.repeat(70)}\n`);

const topMfr = [...manufacturers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
for (const [name, count] of topMfr) {
  const pct = (count / totalLines * 100).toFixed(1);
  console.log(`  ${name.padEnd(40)} ${count.toLocaleString().padStart(8)} (${pct}%)`);
}

console.log(`\n  ... Total manufacturers: ${manufacturers.size.toLocaleString()}`);
