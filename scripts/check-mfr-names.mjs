import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// 1. All unique manufacturer names from products
const all = await p.product.groupBy({ by: ['manufacturer'], _count: { _all: true }, orderBy: { manufacturer: 'asc' } });
console.log(`\n=== 共 ${all.length} 个不同厂商名 ===\n`);

// 2. Find duplicates / messy names
const names = all.map(m => m.manufacturer).filter(Boolean);

// Find names with special characters
console.log('--- 含特殊字符的厂商名 ---');
names.filter(n => /[\/\(\)&,.]/.test(n)).forEach(n => {
  const count = all.find(m => m.manufacturer === n)?._count._all;
  console.log(`  "${n}" (${count} products)`);
});

// Find potential duplicates (similar names)
console.log('\n--- 可能重复的厂商名 ---');
const seen = new Map();
for (const n of names) {
  const key = n.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (seen.has(key)) {
    const prev = seen.get(key);
    const c1 = all.find(m => m.manufacturer === prev)?._count._all;
    const c2 = all.find(m => m.manufacturer === n)?._count._all;
    console.log(`  "${prev}" (${c1}) ↔ "${n}" (${c2})`);
  } else {
    seen.set(key, n);
  }
}

// Find very long names
console.log('\n--- 名字过长 (>30字符) ---');
names.filter(n => n.length > 30).forEach(n => {
  const count = all.find(m => m.manufacturer === n)?._count._all;
  console.log(`  "${n}" (${count} products)`);
});

// Show what slugs would look like
console.log('\n--- 会生成奇怪 slug 的厂商名 ---');
names.forEach(n => {
  const slug = n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (slug !== n.toLowerCase().replace(/ /g, '-') || slug.includes('--')) {
    const count = all.find(m => m.manufacturer === n)?._count._all;
    console.log(`  "${n}" → slug: "${slug}" (${count} products)`);
  }
});

await p.$disconnect();
