import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

const searchAttempts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;
const MIN_QUERY_LENGTH = 3;

function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip || 'unknown';
  const prev = searchAttempts.get(key) || [];
  const timestamps = prev.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    searchAttempts.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  searchAttempts.set(key, timestamps);
  // Periodically purge stale entries to prevent memory leak
  if (searchAttempts.size > 10000) {
    for (const [k, ts] of searchAttempts) {
      if (ts.every(t => now - t > RATE_LIMIT_WINDOW)) searchAttempts.delete(k);
    }
  }
  return true;
}

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
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const q = (searchParams.get('q') || '').trim().substring(0, 100);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit')) || 20, 1), 25);

  if (!checkRateLimit(ip)) {
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

    // True total count (capped at reasonable limit)
    const totalPrefix = await prisma.product.count({
      where: { partNumber: { startsWith: q, mode: 'insensitive' } },
    });
    const totalContains = await prisma.product.count({
      where: {
        OR: [
          { partNumber: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { manufacturer: { contains: q, mode: 'insensitive' } },
        ],
        partNumber: { notIn: [...prefixIds] },
      },
    });

    return NextResponse.json({ products, total: totalPrefix + totalContains });
  } catch (e) {
    console.error('[API Search] Error:', e.message);
    return NextResponse.json({ products: [], total: 0, error: 'Search failed' }, { status: 500 });
  }
}
