import { PrismaClient } from '@prisma/client';
import { MANUFACTURER_STANDARDIZATION, manufacturerSlug } from '../src/lib/manufacturer-map.js';

const p = new PrismaClient();
const all = await p.product.groupBy({ by: ['manufacturer'], _count: { _all: true }, orderBy: { _count: { manufacturer: 'desc' } } });

// Build standardized map
const stdMap = new Map();
for (const m of all) {
  const name = m.manufacturer;
  if (!name) continue;
  const std = MANUFACTURER_STANDARDIZATION[name] || name;
  const slug = manufacturerSlug(name);
  if (!stdMap.has(std)) stdMap.set(std, { count: 0, originals: [], slug });
  stdMap.get(std).count += m._count._all;
  if (std !== name) stdMap.get(std).originals.push(`"${name}" (${m._count._all})`);
}

// Stats
console.log(`\n原始厂商数: ${all.length}`);
console.log(`标准化后: ${stdMap.size}`);
console.log(`减少: ${all.length - stdMap.size} 个重复\n`);

// Show merges
console.log('=== 合并的厂商 ===');
for (const [std, data] of stdMap) {
  if (data.originals.length > 0) {
    console.log(`\n"${std}" (slug: ${data.slug}, total: ${data.count})`);
    data.originals.forEach(o => console.log(`  ← ${o}`));
  }
}

// Show slug samples
console.log('\n\n=== Top 20 厂商 slug ===');
const sorted = [...stdMap.entries()].sort((a, b) => b[1].count - a[1].count);
sorted.slice(0, 20).forEach(([name, data]) => {
  console.log(`  /product/${data.slug}/  → ${name} (${data.count} products)`);
});

await p.$disconnect();
