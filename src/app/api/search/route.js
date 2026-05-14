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
  return true;
}

/**
 * GET /api/search?q=STM32&limit=10
 * Public product search API used by Blog Editor and BOM tool.
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
    const where = {
      OR: [
        { partNumber: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { manufacturer: { contains: q, mode: 'insensitive' } },
      ],
    };

    const products = await prisma.product.findMany({
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
    });

    return NextResponse.json({ products, total: products.length });
  } catch (e) {
    console.error('[API Search] Error:', e.message);
    return NextResponse.json({ products: [], total: 0, error: 'Search failed' }, { status: 500 });
  }
}
