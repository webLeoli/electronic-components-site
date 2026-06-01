import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/admin-auth';

/**
 * POST /api/admin/revalidate
 * Manually refresh ISR-cached public pages from the admin panel.
 *
 * Body:
 *   { "path": "/product/altera/EP4CE6E22C8N" }   — refresh one path
 *   { "path": "/product/[manufacturer]/[partNumber]", "type": "page" } — refresh a whole dynamic route
 *   { "all": true }                              — refresh the entire site (root layout)
 */
export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));

    if (body.all) {
      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true, revalidated: 'all' });
    }

    const path = typeof body.path === 'string' ? body.path.trim() : '';
    if (!path || !path.startsWith('/')) {
      return NextResponse.json({ error: 'A path starting with "/" (or { all: true }) is required' }, { status: 400 });
    }

    const type = body.type === 'layout' || body.type === 'page' ? body.type : undefined;
    revalidatePath(path, type);
    return NextResponse.json({ success: true, revalidated: path, type: type || 'default' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
