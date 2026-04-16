import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';

// GET: List all manufacturers
export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    // Count products per manufacturer via raw query
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Create manufacturer
export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const slug = data.slug || data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: data.name.trim(),
        slug,
        logo: data.logo || null,
        website: data.website || null,
        country: data.country || null,
      },
    });
    return NextResponse.json(manufacturer, { status: 201 });
  } catch (e) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Manufacturer already exists' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: Update manufacturer
export async function PUT(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'Manufacturer ID required' }, { status: 400 });

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.slug !== undefined) updateData.slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.country !== undefined) updateData.country = data.country;

    const manufacturer = await prisma.manufacturer.update({
      where: { id: data.id },
      data: updateData,
    });
    return NextResponse.json(manufacturer);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
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

    await prisma.manufacturer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
