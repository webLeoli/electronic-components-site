import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Final cleanup of parenthesized names
const fixes = [
  ['Asahi Kasei Microdevices(AKM)', 'AKM Semiconductor'],
  ['Digi International Inc. (Digi)', 'Digi International'],
  ['Nexperia Energy Harvesting Solutions(Nowi)', 'Nexperia'],
  ['System-On-Chip (SOC) Technologies', 'SOC Technologies'],
  ['Azoteq (Pty) Ltd.', 'Azoteq'],
  ['International Rectifier(IR)', 'International Rectifier'],
  ['HY Electronic (Cayman) Limited', 'HY Electronic'],
  ['Standard Microsystems(SMSC)', 'SMSC'],
];

let total = 0;
for (const [from, to] of fixes) {
  const result = await p.product.updateMany({
    where: { manufacturer: from },
    data: { manufacturer: to }
  });
  if (result.count > 0) {
    total += result.count;
    console.log(`✅ "${from}" → "${to}": ${result.count}`);
  }
}
console.log(`\nFixed: ${total} products`);

// Verify
const remaining = await p.product.groupBy({
  by: ['manufacturer'],
  _count: { _all: true },
  orderBy: { _count: { manufacturer: 'desc' } }
});
const ugly = remaining.filter(m => m.manufacturer && (
  m.manufacturer.includes('/') || m.manufacturer.includes('®') || 
  m.manufacturer.includes('™') || m.manufacturer.includes('(')
));
if (ugly.length === 0) console.log('\n✅ 所有厂商名已标准化！无异常字符');
else ugly.forEach(i => console.log('⚠️ Still:', i.manufacturer, i._count._all));

console.log(`\nTotal manufacturers: ${remaining.length}`);

await p.$disconnect();
