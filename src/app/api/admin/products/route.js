import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import prisma from '@/lib/db';
import { requireAuth, requireEditor } from '@/lib/admin-auth';
import { computeQualityScore } from '@/lib/quality-score';
import { shouldProductBeIndexable } from '@/lib/indexing-policy';
import { manufacturerSlug, standardizeName } from '@/lib/manufacturer-map';
import { revalidateProduct, revalidateManufacturer } from '@/lib/revalidate';
import { clearProductMemoryCache } from '@/lib/product-memory-cache';

// GET: List products with search/pagination
export async function GET(request) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(50, parseInt(searchParams.get('limit')) || 20);
    const search = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';

    const where = {};
    if (search) {
      where.OR = [
        { partNumber: { contains: search } },
        { manufacturer: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return apiError(e, 'admin/products');
  }
}

// POST: Create product
export async function POST(request) {
  const authError = await requireEditor(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.partNumber) return NextResponse.json({ error: 'Part number required' }, { status: 400 });

    const product = await prisma.product.create({
      data: {
        partNumber: data.partNumber.trim(),
        // Canonical spelling, matching what the Manufacturer row below is created
        // with — the raw value used to be stored here, so a product typed as
        // "Nexperia USA Inc." never appeared on the Nexperia brand page.
        manufacturer: standardizeName(data.manufacturer) || 'Unknown',
        description: data.description || null,
        categoryId: data.categoryId || null,
        packageType: data.packageType || null,
        mountType: data.mountType || null,
        status: data.status || 'active',
        minPrice: data.minPrice ? parseFloat(data.minPrice) : null,
        stock: data.stock ? parseInt(data.stock) : 0,
        moq: data.moq ? parseInt(data.moq) : 1,
        leadTime: data.leadTime || null,
        specs: data.specs || null,
        datasheet: data.datasheet || null,
        imageUrl: data.imageUrl || null,
        // Rendered content is being written, so the sitemap lastmod moves.
        contentUpdatedAt: new Date(),
      },
      // Same reason as the update path below: scoreImage needs the category.
      include: {
        category: { select: { name: true, slug: true, parent: { select: { name: true } } } },
      },
    });

    // Auto-sync: ensure manufacturer exists in Manufacturer table
    const mfrName = data.manufacturer?.trim();
    if (mfrName) {
      const stdName = standardizeName(mfrName);
      const exists = await prisma.manufacturer.findFirst({
        where: { name: stdName },
      });
      if (!exists) {
        await prisma.manufacturer.create({
          data: { name: stdName, slug: manufacturerSlug(stdName) },
        });
      }
    }

    // Auto-compute quality score for new product
    const qResult = computeQualityScore(product);
    const indexable = await shouldProductBeIndexable(qResult.score);
    const scored = await prisma.product.update({
      where: { id: product.id },
      data: { qualityScore: qResult.score, indexable },
    });

    revalidateProduct(scored.partNumber, scored.manufacturer);
    revalidateManufacturer(manufacturerSlug(scored.manufacturer));
    clearProductMemoryCache();

    return NextResponse.json(scored, { status: 201 });
  } catch (e) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Part number already exists' }, { status: 409 });
    return apiError(e, 'admin/products');
  }
}

// PUT: Update product
export async function PUT(request) {
  const authError = await requireEditor(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    // Whitelist of fields that pass through directly
    const STRING_FIELDS = [
      'manufacturer', 'description', 'categoryId', 'packageType',
      'mountType', 'status', 'leadTime', 'specs', 'datasheet', 'imageUrl',
    ];
    const updateData = {};
    for (const field of STRING_FIELDS) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }
    // Special-case fields requiring transformation
    if (data.partNumber !== undefined) updateData.partNumber = data.partNumber.trim();

    // Changing the part number changes what the row IS, so any duplicate
    // relationship built from the old number is void. Two ways it goes wrong if
    // left alone: a consolidated row keeps 301ing to a part it no longer varies
    // from, and rows pointing AT this one keep redirecting to a part number that
    // is now something else. Clearing both sides parks the rows as ordinary
    // pages; scripts/dedupe-part-numbers.mjs re-establishes the link on its next
    // run if the new number really is a variant.
    const partNumberChanged = data.partNumber !== undefined
      && data.partNumber.trim() !== (await prisma.product.findUnique({
        where: { id: data.id }, select: { partNumber: true },
      }))?.partNumber;
    if (partNumberChanged) updateData.duplicateOfId = null;
    // Same reason as the create path: the brand page matches products by exact
    // name, so an edit must not reintroduce a duplicate spelling.
    if (data.manufacturer !== undefined) updateData.manufacturer = standardizeName(data.manufacturer);
    if (data.minPrice !== undefined) updateData.minPrice = data.minPrice ? parseFloat(data.minPrice) : null;
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
    if (data.moq !== undefined) updateData.moq = parseInt(data.moq);

    // Every field above is rendered on the product page, so an edit here is a
    // genuine content change and should move the sitemap lastmod. The score
    // write that follows must not - it is housekeeping.
    if (Object.keys(updateData).length > 0) updateData.contentUpdatedAt = new Date();

    const product = await prisma.product.update({
      where: { id: data.id },
      data: updateData,
      // Category included for scoreImage: it resolves the package-family image
      // from the same text blob the product page uses, category name included.
      // Scoring a category-less object here would disagree with the batch
      // scorer (scripts/compute-quality-scores.mjs) for the same row.
      include: {
        category: { select: { name: true, slug: true, parent: { select: { name: true } } } },
      },
    });

    // Release anything that was redirecting to this row: those rows were told
    // this part number is the canonical spelling of theirs, which is no longer
    // a claim we can make.
    if (partNumberChanged) {
      await prisma.product.updateMany({
        where: { duplicateOfId: product.id },
        data: { duplicateOfId: null },
      });
    }

    // Auto-recompute quality score after update. A row consolidated into another
    // part (duplicateOfId) stays out of the index no matter how it scores — its
    // URL 301s to the survivor, so indexing it would advertise a redirect.
    const qResult = computeQualityScore(product);
    const indexable = product.duplicateOfId != null
      ? false
      : await shouldProductBeIndexable(qResult.score);
    const scored = await prisma.product.update({
      where: { id: product.id },
      data: { qualityScore: qResult.score, indexable },
    });

    // Auto-sync: ensure manufacturer exists in Manufacturer table
    if (data.manufacturer) {
      const stdName = standardizeName(data.manufacturer.trim());
      const exists = await prisma.manufacturer.findFirst({
        where: { name: stdName },
      });
      if (!exists) {
        await prisma.manufacturer.create({
          data: { name: stdName, slug: manufacturerSlug(stdName) },
        });
      }
    }

    revalidateProduct(scored.partNumber, scored.manufacturer);
    revalidateManufacturer(manufacturerSlug(scored.manufacturer));
    clearProductMemoryCache();

    return NextResponse.json(scored);
  } catch (e) {
    return apiError(e, 'admin/products');
  }
}

// DELETE: Delete product
export async function DELETE(request) {
  const authError = await requireEditor(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { partNumber: true, manufacturer: true },
    });
    await prisma.product.delete({ where: { id } });

    if (existing) {
      revalidateProduct(existing.partNumber, existing.manufacturer);
      revalidateManufacturer(manufacturerSlug(existing.manufacturer));
    }
    clearProductMemoryCache();
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e, 'admin/products');
  }
}
