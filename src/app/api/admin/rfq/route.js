import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';

// GET: List all RFQ submissions
export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const status = searchParams.get('status') || '';
    const limit = 20;

    const where = {};
    if (status) where.status = status;

    const [submissions, total] = await Promise.all([
      prisma.rfqSubmission.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rfqSubmission.count({ where }),
    ]);

    return NextResponse.json({
      submissions: submissions.map(s => ({ ...s, parts: JSON.parse(s.parts || '[]') })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: Update RFQ status
export async function PUT(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'RFQ ID required' }, { status: 400 });

    const updateData = {};
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status === 'processing' || data.status === 'quoted' || data.status === 'closed') {
      updateData.processedAt = new Date();
    }

    const submission = await prisma.rfqSubmission.update({
      where: { id: data.id },
      data: updateData,
    });
    return NextResponse.json(submission);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Delete RFQ
export async function DELETE(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'RFQ ID required' }, { status: 400 });

    await prisma.rfqSubmission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
