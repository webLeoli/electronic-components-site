import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';
import { revalidateBlog } from '@/lib/revalidate';
import { stripDangerousHtml as sanitizeHtml, calcReadingTime } from '@/lib/blog-content';

// GET: List blog posts
export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(50, parseInt(searchParams.get('limit')) || 20);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId') || '';

    const where = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Create blog post
export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const slug = data.slug?.trim() || data.title.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 120);

    const readingTime = calcReadingTime(data.content);
    const post = await prisma.blogPost.create({
      data: {
        title: data.title.trim(),
        slug,
        excerpt: data.excerpt || null,
        content: sanitizeHtml(data.content || ''),
        coverImage: data.coverImage || null,
        status: data.status || 'draft',
        publishedAt: data.status === 'published' ? new Date() : null,
        author: data.author || 'FPGACenter Team',
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        tags: data.tags || null,
        seoTitle: data.seoTitle || null,
        seoDesc: data.seoDesc || null,
        seoKeywords: data.seoKeywords || null,
        relatedProducts: data.relatedProducts || null,
        readingTime,
      },
    });
    revalidateBlog(post.slug);
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: Update blog post
export async function PUT(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.slug !== undefined) updateData.slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt || null;
    if (data.content !== undefined) {
      updateData.content = sanitizeHtml(data.content);
      updateData.readingTime = calcReadingTime(data.content);
    }
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage || null;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'published' && !data.keepPublishedAt) {
        // Only set publishedAt if not already set
        const existing = await prisma.blogPost.findUnique({ where: { id: data.id }, select: { publishedAt: true } });
        if (!existing?.publishedAt) updateData.publishedAt = new Date();
      }
    }
    if (data.author !== undefined) updateData.author = data.author;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId ? parseInt(data.categoryId) : null;
    if (data.tags !== undefined) updateData.tags = data.tags || null;
    if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle || null;
    if (data.seoDesc !== undefined) updateData.seoDesc = data.seoDesc || null;
    if (data.seoKeywords !== undefined) updateData.seoKeywords = data.seoKeywords || null;
    if (data.relatedProducts !== undefined) updateData.relatedProducts = data.relatedProducts || null;

    const post = await prisma.blogPost.update({ where: { id: data.id }, data: updateData });
    revalidateBlog(post.slug);
    return NextResponse.json(post);
  } catch (e) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Delete blog post
export async function DELETE(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    const existing = await prisma.blogPost.findUnique({ where: { id }, select: { slug: true } });
    await prisma.blogPost.delete({ where: { id } });
    if (existing) revalidateBlog(existing.slug);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
