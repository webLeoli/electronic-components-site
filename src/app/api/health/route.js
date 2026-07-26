import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Deployment / uptime health check. Point update.sh's HEALTH_URL (and any
// uptime monitor) at /api/health so a broken deploy is detected immediately.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: 'ok', db: 'up', time: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    console.error('[health] DB check failed:', e.message);
    return NextResponse.json(
      { status: 'degraded', db: 'down' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
