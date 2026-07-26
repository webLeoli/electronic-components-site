// Backfill/refresh the Product.isProgrammableLogic flag from the canonical
// predicate in src/lib/fpga-series-data.js (single source of truth - no
// duplicated SQL here).
//
// Run after bulk product imports (and once after adding the column):
//   node scripts/flag-programmable-logic.mjs
//
// Idempotent: clears rows that no longer match, sets rows that now match.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { buildProgrammableLogicWhere } from '../src/lib/fpga-series-data.js';

const prisma = new PrismaClient();
const plWhere = buildProgrammableLogicWhere();

const t0 = Date.now();
const cleared = await prisma.product.updateMany({
  where: { isProgrammableLogic: true, NOT: plWhere },
  data: { isProgrammableLogic: false },
});
const flagged = await prisma.product.updateMany({
  where: { AND: [plWhere, { isProgrammableLogic: false }] },
  data: { isProgrammableLogic: true },
});
const total = await prisma.product.count({ where: { isProgrammableLogic: true } });
console.log(
  `cleared: ${cleared.count}, newly flagged: ${flagged.count}, total flagged: ${total} (${Math.round((Date.now() - t0) / 1000)}s)`,
);
await prisma.$disconnect();
