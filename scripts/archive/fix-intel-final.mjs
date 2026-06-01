import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

let total = 0;
async function fix(where, data, label) {
  const result = await p.product.updateMany({ where, data });
  if (result.count > 0) { total += result.count; console.log(`✅ ${label}: ${result.count}`); }
}

// Intel MPF/MPM series → Altera (MAX Plus II devices)
await fix(
  { manufacturer: 'Intel', partNumber: { startsWith: 'MPF8' } },
  { manufacturer: 'Altera' },
  'Intel(MPF8) → Altera'
);
await fix(
  { manufacturer: 'Intel', partNumber: { startsWith: 'MPM' } },
  { manufacturer: 'Altera' },
  'Intel(MPM) → Altera'
);

// XC40200XV is APEX (Altera), not Xilinx
await fix(
  { manufacturer: 'Intel', partNumber: 'XC40200XV-07BG560C' },
  { manufacturer: 'Altera' },
  'Intel(XC40200XV) → Altera'
);

// ARRIA 10 products → Altera
await fix(
  { manufacturer: 'Intel', partNumber: { startsWith: 'ARRIA' } },
  { manufacturer: 'Altera' },
  'Intel(ARRIA) → Altera'
);

// FLIXF → Altera (FLEX)
await fix(
  { manufacturer: 'Intel', partNumber: { startsWith: 'FLIX' } },
  { manufacturer: 'Altera' },
  'Intel(FLIX) → Altera'
);

console.log(`\nFixed: ${total} products`);

// Final Intel count
const remaining = await p.product.count({ where: { manufacturer: 'Intel' } });
console.log(`Intel remaining: ${remaining}`);

await p.$disconnect();
