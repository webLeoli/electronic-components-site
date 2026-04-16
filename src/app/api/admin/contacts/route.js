import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';
  const perPage = 20;

  const where = status ? { status } : {};

  const [submissions, total] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.contactSubmission.count({ where }),
  ]);

  return NextResponse.json({
    submissions,
    total,
    totalPages: Math.ceil(total / perPage),
  });
}

export async function PUT(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id, status, notes } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const data = {};
  if (status) data.status = status;
  if (notes !== undefined) data.notes = notes;

  const updated = await prisma.contactSubmission.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await prisma.contactSubmission.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
