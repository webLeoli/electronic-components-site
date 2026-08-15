import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

// Admin data backup: date-range export of business-critical data as a single
// downloadable JSON file, restorable with `node scripts/restore-backup.mjs`.
//
// Date semantics per type:
//   blogPosts        -> updatedAt   (edit a post => it appears in the next range backup)
//   rfq / contacts   -> submittedAt
//   products         -> updatedAt   (incremental: only rows touched in range)
//   blogCategories   -> no date; always exported in full when selected (tiny)
//
// Products are capped so a careless full-range export can't OOM the server or
// the user's browser - the preview shows the count first.

export const maxDuration = 300;

const PRODUCT_EXPORT_CAP = 50000;
const BATCH_SIZE = 5000;

function parseRange(searchParams) {
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const range = {};
  if (from) {
    const d = new Date(`${from}T00:00:00.000Z`);
    if (!Number.isNaN(d.getTime())) range.gte = d;
  }
  if (to) {
    const d = new Date(`${to}T23:59:59.999Z`);
    if (!Number.isNaN(d.getTime())) range.lte = d;
  }
  return Object.keys(range).length ? range : null;
}

function dateWhere(field, range) {
  return range ? { [field]: range } : {};
}

async function fetchAllBatched(model, args) {
  // Cursor-paginate by id so large exports never materialize one giant query.
  const rows = [];
  let cursor = null;
  for (;;) {
    const batch = await model.findMany({
      ...args,
      take: BATCH_SIZE,
      orderBy: { id: 'asc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    rows.push(...batch);
    if (batch.length < BATCH_SIZE) break;
    cursor = batch[batch.length - 1].id;
  }
  return rows;
}

export async function GET(request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const types = (searchParams.get('types') || 'blogPosts,blogCategories,rfq,contacts')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const range = parseRange(searchParams);
    const download = searchParams.get('download') === '1';

    const want = (t) => types.includes(t);

    // --- counts (always computed; cheap) ---
    const counts = {};
    if (want('blogPosts')) counts.blogPosts = await prisma.blogPost.count({ where: dateWhere('updatedAt', range) });
    if (want('blogCategories')) counts.blogCategories = await prisma.blogCategory.count();
    if (want('rfq')) counts.rfq = await prisma.rfqSubmission.count({ where: dateWhere('submittedAt', range) });
    if (want('contacts')) counts.contacts = await prisma.contactSubmission.count({ where: dateWhere('submittedAt', range) });
    if (want('products')) counts.products = await prisma.product.count({ where: dateWhere('updatedAt', range) });

    if (!download) {
      return NextResponse.json({
        counts,
        productCap: PRODUCT_EXPORT_CAP,
        productsOverCap: (counts.products || 0) > PRODUCT_EXPORT_CAP,
      });
    }

    if ((counts.products || 0) > PRODUCT_EXPORT_CAP) {
      return NextResponse.json(
        {
          error: `Products in range (${counts.products.toLocaleString()}) exceed the export cap of ${PRODUCT_EXPORT_CAP.toLocaleString()}. Narrow the date range.`,
        },
        { status: 400 },
      );
    }

    const data = {};
    if (want('blogCategories')) {
      data.blogCategories = await prisma.blogCategory.findMany({ orderBy: { id: 'asc' } });
    }
    if (want('blogPosts')) {
      // Embed the category slug so restore can remap categoryId across databases.
      data.blogPosts = await fetchAllBatched(prisma.blogPost, {
        where: dateWhere('updatedAt', range),
        include: { category: { select: { slug: true } } },
      });
    }
    if (want('rfq')) {
      data.rfqSubmissions = await fetchAllBatched(prisma.rfqSubmission, {
        where: dateWhere('submittedAt', range),
      });
    }
    if (want('contacts')) {
      data.contactSubmissions = await fetchAllBatched(prisma.contactSubmission, {
        where: dateWhere('submittedAt', range),
      });
    }
    if (want('products')) {
      data.products = await fetchAllBatched(prisma.product, {
        where: dateWhere('updatedAt', range),
      });
    }

    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/(\d{8})(\d{4})/, '$1-$2');
    const payload = {
      format: 'fpgacenter-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      range: { from: searchParams.get('from') || null, to: searchParams.get('to') || null },
      counts,
      data,
    };

    return new NextResponse(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="fpgacenter-backup-${stamp}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return apiError(e, 'admin/backup');
  }
}
