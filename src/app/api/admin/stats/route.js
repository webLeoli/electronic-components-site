import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const [productCount, categoryCount, manufacturerCount, rfqCount, contactCount, recentProducts] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.manufacturer.count(),
      prisma.rfqSubmission.count(),
      prisma.contactSubmission.count().catch(() => 0),
      prisma.product.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { partNumber: true, manufacturer: true, status: true, stock: true, minPrice: true, createdAt: true },
      }),
    ]);

    // Status breakdown
    const statusCounts = await prisma.product.groupBy({
      by: ['status'],
      _count: true,
    });

    // RFQ breakdown
    const rfqStatusCounts = await prisma.rfqSubmission.groupBy({
      by: ['status'],
      _count: true,
    });

    return NextResponse.json({
      products: productCount,
      categories: categoryCount,
      manufacturers: manufacturerCount,
      rfqs: rfqCount,
      contacts: contactCount,
      statusBreakdown: Object.fromEntries(statusCounts.map(s => [s.status, s._count])),
      rfqBreakdown: Object.fromEntries(rfqStatusCounts.map(s => [s.status, s._count])),
      recentProducts,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
