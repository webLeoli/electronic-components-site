// Backfill/refresh the Product.isProgrammableLogic flag from the canonical
// predicate in src/lib/fpga-series-data.js (single source of truth - no
// duplicated SQL here), then VACUUM ANALYZE so search stays fast.
//
// The importers run this automatically (scripts/post-import-maintenance.mjs).
// Use this entry point after ad-hoc SQL edits, or once after adding the column:
//   npm run db:maintain
//
// Idempotent: clears rows that no longer match, sets rows that now match.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { runPostImportMaintenance } from './post-import-maintenance.mjs';

const prisma = new PrismaClient();
await runPostImportMaintenance(prisma);
await prisma.$disconnect();
