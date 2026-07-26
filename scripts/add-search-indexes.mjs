// Trigram (pg_trgm) GIN indexes for ILIKE '%q%' search on the Product table.
// These cannot be expressed in schema.prisma, so they are applied via raw SQL.
//
// Usage: node scripts/add-search-indexes.mjs
//
// Uses CREATE INDEX CONCURRENTLY so a production run does not lock writes.
// Safe to re-run (IF NOT EXISTS). Expect a few minutes per index on ~700K rows.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const statements = [
  `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_partNumber_trgm_idx"
     ON "Product" USING gin ("partNumber" gin_trgm_ops)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_manufacturer_trgm_idx"
     ON "Product" USING gin ("manufacturer" gin_trgm_ops)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_description_trgm_idx"
     ON "Product" USING gin ("description" gin_trgm_ops)`,
];

for (const sql of statements) {
  const label = sql.trim().split('\n')[0];
  const t0 = Date.now();
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`OK   (${Math.round((Date.now() - t0) / 1000)}s) ${label}`);
  } catch (e) {
    console.error(`FAIL ${label}\n     ${e.message.split('\n')[0]}`);
    process.exitCode = 1;
  }
}

await prisma.$disconnect();
