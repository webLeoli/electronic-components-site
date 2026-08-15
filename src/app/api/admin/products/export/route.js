import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';

// Rows fetched per round trip. The whole point is that only this many product
// objects are ever alive at once, so keep it well under the row count.
const BATCH_SIZE = 2000;

// Every cell is quote-escaped, and cells starting with a formula trigger
// character (= + - @ tab CR) get a leading apostrophe so Excel/Sheets treat
// them as text - a part number like "=CMD(...)" must never execute on an
// admin's machine (CSV formula injection).
const csvCell = (value) => {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

const HEADERS = ['Part Number', 'Manufacturer', 'Description', 'Category', 'Status', 'Stock', 'Min Price', 'MOQ', 'Lead Time', 'Package', 'Mount Type', 'Datasheet', 'Image URL'];

const toRow = (p) => [
  p.partNumber,
  p.manufacturer || '',
  p.description || '',
  p.category?.name || '',
  p.status,
  p.stock || 0,
  p.minPrice || '',
  p.moq || 1,
  p.leadTime || '',
  p.packageType || '',
  p.mountType || '',
  p.datasheet || '',
  p.imageUrl || '',
];

/**
 * GET /api/admin/products/export — full catalogue as CSV.
 *
 * Streamed in keyset-paginated batches rather than built as one string.
 * Loading all 719K products and joining them produced a single multi-hundred-MB
 * string: nothing reached the client for over five minutes (so nginx returns
 * 504 long before the download starts), the process grew by hundreds of MB per
 * concurrent click, and aborting the download did not stop any of it — the
 * query ran to completion regardless. On the single-instance PM2 setup that is
 * enough for one admin to take the site down by double-clicking Export.
 *
 * partNumber is @unique, so it doubles as the pagination cursor and the sort
 * key stays exactly what it was.
 */
export async function GET(request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const encoder = new TextEncoder();
  let cursor = null;
  let finished = false;

  const stream = new ReadableStream({
    start(controller) {
      // Lead with a UTF-8 BOM. Excel ignores the HTTP charset when opening a
      // downloaded .csv and falls back to the OS ANSI codepage (GBK on a
      // Chinese Windows, cp1252 elsewhere), which mangles every degree sign,
      // ±, µ and Ω in the description column - and 606K of the 719K
      // descriptions contain at least one. The BOM is the only signal Excel
      // honours here.
      controller.enqueue(encoder.encode('﻿' + HEADERS.map(csvCell).join(',') + '\r\n'));
    },
    async pull(controller) {
      if (finished) return;
      try {
        const batch = await prisma.product.findMany({
          take: BATCH_SIZE,
          ...(cursor ? { skip: 1, cursor: { partNumber: cursor } } : {}),
          orderBy: { partNumber: 'asc' },
          include: { category: { select: { name: true } } },
        });

        if (batch.length === 0) {
          finished = true;
          controller.close();
          return;
        }

        cursor = batch[batch.length - 1].partNumber;
        controller.enqueue(
          encoder.encode(batch.map((p) => toRow(p).map(csvCell).join(',')).join('\r\n') + '\r\n')
        );

        if (batch.length < BATCH_SIZE) {
          finished = true;
          controller.close();
        }
      } catch (e) {
        finished = true;
        console.error('[admin/products/export] stream failed:', e);
        // The response status is already committed by the time rows flow, so
        // the only honest signal left is tearing the download rather than
        // letting a truncated CSV look complete.
        controller.error(e);
      }
    },
    cancel() {
      // Browser cancelled / connection dropped: stop issuing queries.
      finished = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="fpgacenter-products-${new Date().toISOString().split('T')[0]}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
