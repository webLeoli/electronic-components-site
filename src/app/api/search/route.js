import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * GET /api/search?q=STM32&limit=10
 * Public product search API used by Blog Editor and BOM tool.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit')) || 20, 1), 50);

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], total: 0 });
  }

  try {
    const where = {
      OR: [
        { partNumber: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { manufacturer: { contains: q, mode: 'insensitive' } },
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          partNumber: true,
          manufacturer: true,
          description: true,
          minPrice: true,
          stock: true,
          status: true,
          categoryId: true,
        },
        orderBy: { stock: 'desc' },
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total });
  } catch (e) {
    console.error('[API Search] Error:', e.message);
    return NextResponse.json({ products: [], total: 0, error: 'Search failed' }, { status: 500 });
  }
}
