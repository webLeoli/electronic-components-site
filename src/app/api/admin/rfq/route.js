import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { apiError } from '@/lib/api-error';
import prisma from '@/lib/db';
import { requireAuth, requireEditor } from '@/lib/admin-auth';

// GET: List all RFQ submissions
export async function GET(request) {
  const authError = await requireAuth(request);
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
    return apiError(e, 'admin/rfq');
  }
}

// PUT: Update RFQ status
export async function PUT(request) {
  const authError = await requireEditor(request);
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
    return apiError(e, 'admin/rfq');
  }
}

// DELETE: Delete RFQ
export async function DELETE(request) {
  const authError = await requireEditor(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'RFQ ID required' }, { status: 400 });

    // Remove the customer's uploaded BOM file along with the DB row -
    // deleting only the row would retain customer PII on disk indefinitely.
    const existing = await prisma.rfqSubmission.findUnique({
      where: { id },
      select: { bomFile: true },
    });
    await prisma.rfqSubmission.delete({ where: { id } });
    if (existing?.bomFile) {
      const filename = path.basename(existing.bomFile);
      const filePath = path.join(process.cwd(), 'data', 'bom-uploads', filename);
      unlink(filePath).catch(() => {}); // already gone is fine
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e, 'admin/rfq');
  }
}
