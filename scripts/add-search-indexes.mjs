// Trigram (pg_trgm) GIN indexes for ILIKE '%q%' search on the Product table.
//
// These ARE also declared in schema.prisma (type: Gin + gin_trgm_ops) so that
// `prisma db push` knows about them and never drops them - that exact accident
// happened once. This script exists because it builds them CONCURRENTLY (no
// write lock), which Prisma cannot do; use it for first-time production setup.
//
// Usage: node scripts/add-search-indexes.mjs
// Safe to re-run (IF NOT EXISTS). Expect a few minutes per index on ~700K rows.
// After any bulk UPDATE touching indexed columns, run VACUUM ANALYZE "Product"
// or searches degrade until autovacuum merges the GIN pending lists.
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
