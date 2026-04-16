import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';

// GET: List products with search/pagination
export async function GET(request) {
  const authError = requireAuth(request);
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Create product
export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.partNumber) return NextResponse.json({ error: 'Part number required' }, { status: 400 });

    const product = await prisma.product.create({
      data: {
        partNumber: data.partNumber.trim(),
        manufacturer: data.manufacturer || 'Unknown',
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
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Part number already exists' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: Update product
export async function PUT(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const updateData = {};
    if (data.partNumber !== undefined) updateData.partNumber = data.partNumber.trim();
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.packageType !== undefined) updateData.packageType = data.packageType;
    if (data.mountType !== undefined) updateData.mountType = data.mountType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.minPrice !== undefined) updateData.minPrice = data.minPrice ? parseFloat(data.minPrice) : null;
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
    if (data.moq !== undefined) updateData.moq = parseInt(data.moq);
    if (data.leadTime !== undefined) updateData.leadTime = data.leadTime;
    if (data.specs !== undefined) updateData.specs = data.specs;
    if (data.datasheet !== undefined) updateData.datasheet = data.datasheet;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

    const product = await prisma.product.update({
      where: { id: data.id },
      data: updateData,
    });
    return NextResponse.json(product);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Delete product
export async function DELETE(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
