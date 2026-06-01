import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Deep check Intel - are any remaining products actually Altera?
const intelProducts = await p.product.findMany({
  where: { manufacturer: 'Intel' },
  select: { partNumber: true, description: true },
  orderBy: { partNumber: 'asc' }
});
console.log(`Intel products remaining: ${intelProducts.length}\n`);

// Group by prefix
const groups = {};
for (const prod of intelProducts) {
  const pn = prod.partNumber;
  let prefix = pn.substring(0, 4);
  // Try to find a meaningful prefix
  if (/^[A-Z]{1,2}\d/.test(pn)) prefix = pn.match(/^[A-Z]+/)[0];
  else if (/^\d/.test(pn)) prefix = pn.substring(0, 3);
  else prefix = pn.substring(0, Math.min(5, pn.length));
  
  if (!groups[prefix]) groups[prefix] = [];
  groups[prefix].push({ pn: prod.partNumber, desc: (prod.description || '').substring(0, 60) });
}

for (const [prefix, items] of Object.entries(groups).sort((a,b) => b[1].length - a[1].length)) {
  console.log(`\n[${prefix}] (${items.length} products):`);
  items.slice(0, 3).forEach(i => console.log(`  ${i.pn} — ${i.desc}`));
}

await p.$disconnect();
