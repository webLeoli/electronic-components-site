import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';
import { revalidateCategory } from '@/lib/revalidate';

// GET: List all categories as tree
export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
        parent: { select: { name: true } },
      },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ categories });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Create category
export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.name || !data.slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: data.name.trim(),
        slug: data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        parentId: data.parentId || null,
        icon: data.icon || null,
        seoTitle: data.seoTitle || null,
        seoDesc: data.seoDesc || null,
        sortOrder: data.sortOrder || 0,
      },
    });
    revalidateCategory(category.slug);
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: Update category
export async function PUT(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'Category ID required' }, { status: 400 });

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.slug !== undefined) updateData.slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (data.parentId !== undefined) updateData.parentId = data.parentId || null;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
    if (data.seoDesc !== undefined) updateData.seoDesc = data.seoDesc;
    if (data.sortOrder !== undefined) updateData.sortOrder = parseInt(data.sortOrder);

    const category = await prisma.category.update({
      where: { id: data.id },
      data: updateData,
    });
    revalidateCategory(category.slug);
    return NextResponse.json(category);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Delete category
export async function DELETE(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'Category ID required' }, { status: 400 });

    // Check for products using this category
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json({ error: `Cannot delete: ${productCount} products are in this category` }, { status: 409 });
    }

    // Check for child categories
    const childCount = await prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      return NextResponse.json({ error: `Cannot delete: ${childCount} subcategories exist` }, { status: 409 });
    }

    const existing = await prisma.category.findUnique({ where: { id }, select: { slug: true } });
    await prisma.category.delete({ where: { id } });
    if (existing) revalidateCategory(existing.slug);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
