import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import prisma from '@/lib/db';
import { requireAuth, requireEditor } from '@/lib/admin-auth';

export async function GET(request) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  try {
    const categories = await prisma.blogCategory.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ categories });
  } catch (e) {
    return apiError(e, 'admin/blog/categories');
  }
}

export async function POST(request) {
  const authError = await requireEditor(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const slug = data.slug?.trim() || data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cat = await prisma.blogCategory.create({ data: { name: data.name.trim(), slug } });
    return NextResponse.json(cat, { status: 201 });
  } catch (e) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    return apiError(e, 'admin/blog/categories');
  }
}

export async function PUT(request) {
  const authError = await requireEditor(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.slug !== undefined) updateData.slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cat = await prisma.blogCategory.update({ where: { id: data.id }, data: updateData });
    return NextResponse.json(cat);
  } catch (e) {
    return apiError(e, 'admin/blog/categories');
  }
}

export async function DELETE(request) {
  const authError = await requireEditor(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const postCount = await prisma.blogPost.count({ where: { categoryId: id } });
    if (postCount > 0) return NextResponse.json({ error: `Cannot delete: ${postCount} posts in this category` }, { status: 409 });
    await prisma.blogCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e, 'admin/blog/categories');
  }
}
