import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Check for any remaining compound/ugly names
const ugly = await p.product.groupBy({
  by: ['manufacturer'],
  _count: { _all: true },
  orderBy: { _count: { manufacturer: 'desc' } }
});
const issues = ugly.filter(m => m.manufacturer && (
  m.manufacturer.includes('/') || m.manufacturer.includes('®') || 
  m.manufacturer.includes('™') || m.manufacturer.includes('(')
));
if (issues.length === 0) console.log('✅ 无复合/特殊字符厂商名');
else issues.forEach(i => console.log('⚠️', i.manufacturer, i._count._all));

// Check Intel remaining
const intel = await p.product.count({ where: { manufacturer: 'Intel' } });
const intelSamples = await p.product.findMany({
  where: { manufacturer: 'Intel' },
  select: { partNumber: true },
  take: 15, orderBy: { partNumber: 'asc' }
});
console.log(`\nIntel remaining: ${intel}`);
console.log('Samples:', intelSamples.map(s => s.partNumber).join(', '));

// Check ADI/Maxim remaining
const adiMaxim = await p.product.count({ where: { manufacturer: 'Analog Devices Inc./Maxim Integrated' } });
console.log('ADI/Maxim remaining:', adiMaxim);
const adiInc = await p.product.count({ where: { manufacturer: 'Analog Devices Inc.' } });
console.log('Analog Devices Inc. remaining:', adiInc);

// Final top 20
console.log('\n--- Final Top 20 ---');
const top = await p.product.groupBy({
  by: ['manufacturer'],
  _count: { _all: true },
  orderBy: { _count: { manufacturer: 'desc' } },
  take: 20
});
const total = await p.product.count();
const mfrCount = ugly.length;
console.log(`Total: ${total.toLocaleString()} products | ${mfrCount} manufacturers\n`);
for (const m of top) {
  console.log(`  ${m._count._all.toString().padStart(7)}  ${m.manufacturer}`);
}

await p.$disconnect();
