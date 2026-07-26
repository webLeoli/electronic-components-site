import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';
import { manufacturerSlug } from '@/lib/manufacturer-map';
import { revalidateManufacturer, revalidateAllProducts } from '@/lib/revalidate';

// GET: List all manufacturers
export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const manufacturers = await prisma.manufacturer.findMany({
      orderBy: { name: 'asc' },
    });

    // Get product counts grouped by manufacturer name
    const productCounts = await prisma.product.groupBy({
      by: ['manufacturer'],
      _count: true,
    });
    const countMap = Object.fromEntries(productCounts.map(p => [p.manufacturer, p._count]));

    const enriched = manufacturers.map(m => ({
      ...m,
      productCount: countMap[m.name] || 0,
    }));

    return NextResponse.json({ manufacturers: enriched });
  } catch (e) {
    return apiError(e, 'admin/manufacturers');
  }
}

// POST: Create manufacturer
export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const name = data.name.trim();
    const slug = data.slug || manufacturerSlug(name);
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name,
        slug,
        logo: data.logo || null,
        website: data.website || null,
        country: data.country || null,
        description: data.description || null,
        specialties: data.specialties || null,
        founded: data.founded || null,
        headquarters: data.headquarters || null,
        stockNote: data.stockNote || null,
      },
    });
    revalidateManufacturer(manufacturer.slug);
    return NextResponse.json(manufacturer, { status: 201 });
  } catch (e) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Manufacturer already exists' }, { status: 409 });
    return apiError(e, 'admin/manufacturers');
  }
}

// PUT: Update manufacturer
export async function PUT(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'Manufacturer ID required' }, { status: 400 });

    // Fetch old name before update for product sync
    const oldMfr = data.name !== undefined ? await prisma.manufacturer.findUnique({ where: { id: data.id }, select: { name: true } }) : null;

    const updateData = {};
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
      // Auto-update slug when name changes (unless slug explicitly provided)
      if (data.slug === undefined) {
        updateData.slug = manufacturerSlug(data.name.trim());
      }
    }
    if (data.slug !== undefined) updateData.slug = manufacturerSlug(data.slug.trim());
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.specialties !== undefined) updateData.specialties = data.specialties;
    if (data.founded !== undefined) updateData.founded = data.founded;
    if (data.headquarters !== undefined) updateData.headquarters = data.headquarters;
    if (data.stockNote !== undefined) updateData.stockNote = data.stockNote;

    const manufacturer = await prisma.manufacturer.update({
      where: { id: data.id },
      data: updateData,
    });

    // Sync Product.manufacturer field when manufacturer name changes
    let productsRenamed = false;
    if (data.name !== undefined && oldMfr && oldMfr.name !== data.name.trim()) {
      await prisma.product.updateMany({
        where: { manufacturer: oldMfr.name },
        data: { manufacturer: data.name.trim() },
      });
      productsRenamed = true;
    }

    revalidateManufacturer(manufacturer.slug);
    // Renaming the manufacturer changes every one of its product pages' canonical
    // path, so refresh the whole product route in that (rare) case.
    if (productsRenamed) revalidateAllProducts();

    return NextResponse.json(manufacturer);
  } catch (e) {
    return apiError(e, 'admin/manufacturers');
  }
}

// DELETE: Delete manufacturer
export async function DELETE(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'Manufacturer ID required' }, { status: 400 });

    const existing = await prisma.manufacturer.findUnique({ where: { id }, select: { slug: true } });
    await prisma.manufacturer.delete({ where: { id } });
    if (existing) revalidateManufacturer(existing.slug);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e, 'admin/manufacturers');
  }
}
