import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import {
  MIN_SEARCH_QUERY_LENGTH,
  MAX_SEARCH_QUERY_LENGTH,
  SEARCH_RATE_LIMIT,
  SEARCH_COUNT_CAP,
  countSearchMatches,
} from '@/lib/search-policy';
import { canonicalNamesForQuery } from '@/lib/manufacturer-canonical';


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
  const q = (searchParams.get('q') || '').trim().substring(0, MAX_SEARCH_QUERY_LENGTH);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit')) || 20, 1), 25);

  if (!(await rateLimit(ip, SEARCH_RATE_LIMIT))) {
    return NextResponse.json({ products: [], total: 0, error: 'Too many search requests' }, { status: 429 });
  }

  if (!q || q.length < MIN_SEARCH_QUERY_LENGTH) {
    return NextResponse.json({ products: [], total: 0 });
  }

  try {
    // Layer 1: prefix matches on partNumber (highest relevance).
    // duplicateOfId: null drops rows consolidated by dedupe-part-numbers.mjs —
    // a punctuation variant of a part already in the list is not a second result.
    const prefixMatches = await prisma.product.findMany({
      where: { partNumber: { startsWith: q, mode: 'insensitive' }, duplicateOfId: null },
      select: PRODUCT_SELECT,
      orderBy: { stock: 'desc' },
      take: limit,
    });
    const prefixIds = new Set(prefixMatches.map(p => p.partNumber));

    // Layer 2: identifier matches — part number or brand anywhere in the string,
    // plus the canonical name of any brand named by a retired spelling. Cheap
    // enough to sort globally by stock (94ms and 1ms measured on the worst term).
    const remaining = limit - prefixMatches.length;
    let products = [...prefixMatches];
    if (remaining > 0) {
      const identifierMatches = await prisma.product.findMany({
        where: {
          OR: [
            { partNumber: { contains: q, mode: 'insensitive' } },
            { manufacturer: { contains: q, mode: 'insensitive' } },
            ...canonicalNamesForQuery(q).map(name => ({ manufacturer: { equals: name } })),
          ],
          partNumber: { notIn: [...prefixIds] },
          duplicateOfId: null,
        },
        select: PRODUCT_SELECT,
        orderBy: { stock: 'desc' },
        take: remaining,
      });
      products = products.concat(identifierMatches);
      identifierMatches.forEach(p => prefixIds.add(p.partNumber));
    }

    // Layer 3: description matches, only if the precise layers left room.
    //
    // This layer must NOT sort in the database. A word like "regulator" appears
    // in ~100K descriptions, and ORDER BY stock over that set forces a full sort:
    // 1,446 ms, against 9 ms for the same query without it. Instead take a small
    // candidate pool — the planner stops as soon as it has that many rows — and
    // rank those in memory, so "in stock first" still holds for what is shown.
    const stillMissing = limit - products.length;
    if (stillMissing > 0) {
      const DESCRIPTION_POOL = 300;
      const pool = await prisma.product.findMany({
        where: {
          description: { contains: q, mode: 'insensitive' },
          partNumber: { notIn: [...prefixIds] },
          duplicateOfId: null,
        },
        select: PRODUCT_SELECT,
        take: DESCRIPTION_POOL,
      });
      pool.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
      products = products.concat(pool.slice(0, stillMissing));
    }

    // One distinct total: partNumber-contains is a superset of the prefix
    // layer, so a single OR count is both cheaper (one query instead of two)
    // and correct - the old prefix+contains sum could double-count prefix
    // rows beyond the first page.
    //
    // Counted only up to SEARCH_COUNT_CAP: an exact count of a broad term was
    // 6.3s of the ~7s response, and no caller can use a number that large.
    // `totalCapped` tells the caller to render "2,000+" rather than "2,000".
    const { total, capped } = await countSearchMatches(prisma, {
      textOr: [
        { partNumber: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { manufacturer: { contains: q, mode: 'insensitive' } },
      ],
      brandNames: canonicalNamesForQuery(q),
      baseWhere: { duplicateOfId: null },
    });

    return NextResponse.json({ products, total, totalCapped: capped, countCap: SEARCH_COUNT_CAP });
  } catch (e) {
    console.error('[API Search] Error:', e.message);
    return NextResponse.json({ products: [], total: 0, error: 'Search failed' }, { status: 500 });
  }
}
