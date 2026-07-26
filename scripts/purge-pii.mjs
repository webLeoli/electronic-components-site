// PII retention enforcement, aligned with the privacy policy:
//   - RFQ submissions older than 24 months: strip ipAddress/userAgent/trackingData
//     (the business record - parts, contact info, notes - is kept)
//   - Contact submissions older than 24 months: strip ipAddress
//   - Spam-flagged RFQs older than 30 days: delete outright (incl. BOM file)
//
// Usage: node scripts/purge-pii.mjs [--dry-run]
// Run monthly (cron / Windows Task Scheduler).
import 'dotenv/config';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const dryRun = process.argv.includes('--dry-run');
const prisma = new PrismaClient();
const log = (msg) => console.log(`${dryRun ? '[dry-run] ' : ''}${msg}`);

const MONTHS_24 = new Date(Date.now() - 24 * 30 * 86400000);
const DAYS_30 = new Date(Date.now() - 30 * 86400000);

// 1. Anonymize old RFQs (keep the business record, drop the behavioral profile)
const oldRfqWhere = {
  submittedAt: { lt: MONTHS_24 },
  OR: [{ ipAddress: { not: null } }, { userAgent: { not: null } }, { trackingData: { not: null } }],
};
const rfqCount = await prisma.rfqSubmission.count({ where: oldRfqWhere });
if (!dryRun && rfqCount) {
  await prisma.rfqSubmission.updateMany({
    where: oldRfqWhere,
    data: { ipAddress: null, userAgent: null, trackingData: null },
  });
}
log(`RFQs anonymized (>24mo): ${rfqCount}`);

// 2. Anonymize old contact submissions
const oldContactWhere = { submittedAt: { lt: MONTHS_24 }, ipAddress: { not: null } };
const contactCount = await prisma.contactSubmission.count({ where: oldContactWhere });
if (!dryRun && contactCount) {
  await prisma.contactSubmission.updateMany({ where: oldContactWhere, data: { ipAddress: null } });
}
log(`Contacts anonymized (>24mo): ${contactCount}`);

// 3. Delete old spam RFQs (and their BOM files)
const spamWhere = { status: 'spam', submittedAt: { lt: DAYS_30 } };
const spamRows = await prisma.rfqSubmission.findMany({
  where: spamWhere,
  select: { id: true, bomFile: true },
});
if (!dryRun && spamRows.length) {
  for (const row of spamRows) {
    if (row.bomFile) {
      const filePath = path.join(process.cwd(), 'data', 'bom-uploads', path.basename(row.bomFile));
      await unlink(filePath).catch(() => {});
    }
  }
  await prisma.rfqSubmission.deleteMany({ where: spamWhere });
}
log(`Spam RFQs deleted (>30d): ${spamRows.length}`);

await prisma.$disconnect();
log('PII purge complete.');
