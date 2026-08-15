import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { revalidatePath } from 'next/cache';
import { requireEditor } from '@/lib/admin-auth';
import { revalidateDataCaches, DATA_CACHE_TAGS } from '@/lib/revalidate';

/**
 * POST /api/admin/revalidate
 * Manually refresh ISR-cached public pages from the admin panel.
 *
 * Body:
 *   { "path": "/product/altera/EP4CE6E22C8N" }   — refresh one path
 *   { "path": "/product/[manufacturer]/[partNumber]", "type": "page" } — refresh a whole dynamic route
 *   { "all": true }                              — refresh the entire site (root layout) AND the
 *                                                  cached aggregates (category trees, counts,
 *                                                  brand list, sitemap shards)
 *   { "dataCaches": true }                       — only the aggregates, leave rendered pages alone
 *
 * revalidatePath alone does NOT clear unstable_cache() entries: those are keyed
 * by tag, so a bulk import used to leave stale product counts on category pages
 * until each 300s timer expired on its own.
 */
export async function POST(request) {
  const authError = await requireEditor(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));

    if (body.dataCaches && !body.all) {
      const tags = revalidateDataCaches();
      return NextResponse.json({ success: true, revalidated: 'data-caches', tags });
    }

    if (body.all) {
      revalidatePath('/', 'layout');
      revalidateDataCaches();
      return NextResponse.json({ success: true, revalidated: 'all', tags: DATA_CACHE_TAGS });
    }

    const path = typeof body.path === 'string' ? body.path.trim() : '';
    if (!path || !path.startsWith('/')) {
      return NextResponse.json({ error: 'A path starting with "/" (or { all: true }) is required' }, { status: 400 });
    }

    const type = body.type === 'layout' || body.type === 'page' ? body.type : undefined;
    revalidatePath(path, type);
    return NextResponse.json({ success: true, revalidated: path, type: type || 'default' });
  } catch (e) {
    return apiError(e, 'admin/revalidate');
  }
}
