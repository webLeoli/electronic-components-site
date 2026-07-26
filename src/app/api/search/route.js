import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const SEARCH_RATE_LIMIT = { windowMs: 60 * 1000, max: 30, prefix: 'search' };
const MIN_QUERY_LENGTH = 3;

const PRODUCT_SELECT = {
  partNumber: true, manufacturer: true, description: true,
  minPrice: true, stock: true, status: true, categoryId: true,
};

/**
 * GET /api/search?q=STM32&limit=10
 * Public product search API used by Blog Editor and BOM tool.
 * Results ordered by relevance: prefix match > contains match, then by stock.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ip = getClientIp(request);
  const q = (searchParams.get('q') || '').trim().substring(0, 100);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit')) || 20, 1), 25);

  if (!(await rateLimit(ip, SEARCH_RATE_LIMIT))) {
    return NextResponse.json({ products: [], total: 0, error: 'Too many search requests' }, { status: 429 });
  }

  if (!q || q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ products: [], total: 0 });
  }

  try {
    // Layer 1: prefix matches on partNumber (highest relevance)
    const prefixMatches = await prisma.product.findMany({
      where: { partNumber: { startsWith: q, mode: 'insensitive' } },
      select: PRODUCT_SELECT,
      orderBy: { stock: 'desc' },
      take: limit,
    });
    const prefixIds = new Set(prefixMatches.map(p => p.partNumber));

    // Layer 2: fill remaining slots with contains matches (excluding prefix matches)
    const remaining = limit - prefixMatches.length;
    let products = [...prefixMatches];
    if (remaining > 0) {
      const containsMatches = await prisma.product.findMany({
        where: {
          OR: [
            { partNumber: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { manufacturer: { contains: q, mode: 'insensitive' } },
          ],
          partNumber: { notIn: [...prefixIds] },
        },
        select: PRODUCT_SELECT,
        orderBy: { stock: 'desc' },
        take: remaining,
      });
      products = products.concat(containsMatches);
    }

    // One distinct total: partNumber-contains is a superset of the prefix
    // layer, so a single OR count is both cheaper (one query instead of two)
    // and correct - the old prefix+contains sum could double-count prefix
    // rows beyond the first page.
    const total = await prisma.product.count({
      where: {
        OR: [
          { partNumber: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { manufacturer: { contains: q, mode: 'insensitive' } },
        ],
      },
    });

    return NextResponse.json({ products, total });
  } catch (e) {
    console.error('[API Search] Error:', e.message);
    return NextResponse.json({ products: [], total: 0, error: 'Search failed' }, { status: 500 });
  }
}
