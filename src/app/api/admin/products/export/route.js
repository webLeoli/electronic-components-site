import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const products = await prisma.product.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { partNumber: 'asc' },
    });

    // Build CSV
    const headers = ['Part Number', 'Manufacturer', 'Description', 'Category', 'Status', 'Stock', 'Min Price', 'MOQ', 'Lead Time', 'Package', 'Mount Type', 'Datasheet', 'Image URL'];
    const rows = products.map(p => [
      p.partNumber,
      p.manufacturer || '',
      (p.description || '').replace(/"/g, '""'),
      p.category?.name || '',
      p.status,
      p.stock || 0,
      p.minPrice || '',
      p.moq || 1,
      p.leadTime || '',
      p.packageType || '',
      p.mountType || '',
      p.datasheet || '',
      p.imageUrl || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="fpgacenter-products-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
