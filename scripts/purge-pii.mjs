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

// 3. Delete old spam RFQs (and their BOM files).
//
// Deletion is irreversible, so it is restricted to submissions carrying a
// high-confidence signal (see HARD_SPAM_REASONS in src/app/api/rfq/route.js).
// Rows flagged only by soft heuristics — including everything the retired
// all-caps-name rule caught before 2026-08-02 — are left in place for a human
// to judge, because deleting one of those destroys a real sales lead.
const HARD_SPAM_REASONS = ['honeypot_filled', 'invalid_parts_json', 'no_valid_parts'];
const spamWhere = {
  status: 'spam',
  submittedAt: { lt: DAYS_30 },
  OR: HARD_SPAM_REASONS.map(reason => ({ notes: { contains: reason } })),
};
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
log(`Spam RFQs deleted (>30d, high-confidence only): ${spamRows.length}`);

const retained = await prisma.rfqSubmission.count({
  where: { status: 'spam', submittedAt: { lt: DAYS_30 }, NOT: spamWhere },
});
if (retained) {
  log(`Spam RFQs retained for review (soft flags only): ${retained} — check /admin/rfq?status=spam`);
}

await prisma.$disconnect();
log('PII purge complete.');
