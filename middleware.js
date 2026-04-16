import { NextResponse } from 'next/server';

// Pages accessible only by role (matches admin layout NAV_ITEMS)
const ROLE_RESTRICTED_PAGES = {
  // editor & viewer: cannot access these
  admin_only: ['/admin/users', '/admin/settings'],
  // viewer: cannot access these  
  editor_and_above: ['/admin/blog', '/admin/analytics'],
};

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* routes (except login page)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionToken = request.cookies.get('admin_session')?.value;

    if (!sessionToken) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate token format: userId:role:timestamp-hash
    let role = 'admin';
    try {
      const parts = sessionToken.split(':');
      const timestampPart = parts.length >= 3 ? parts[2] : parts[0];
      const [timestamp] = timestampPart.split('-');
      const sessionAge = Date.now() - parseInt(timestamp);
      // Sessions expire after 24 hours
      if (sessionAge > 24 * 60 * 60 * 1000) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      role = parts.length >= 2 ? parts[1] : 'admin';
    } catch {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based page access control
    const dashboardUrl = new URL('/admin', request.url);

    // Only admins can access users & settings pages
    if (role !== 'admin' && ROLE_RESTRICTED_PAGES.admin_only.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(dashboardUrl);
    }

    // Viewers cannot access blog & analytics pages (editor or above required)
    if (role === 'viewer' && ROLE_RESTRICTED_PAGES.editor_and_above.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Protect /api/admin/* (except auth endpoints)
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) {
    const sessionToken = request.cookies.get('admin_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role-based access control for write operations
    const method = request.method;
    if (method !== 'GET') {
      const parts = sessionToken.split(':');
      const role = parts.length >= 2 ? parts[1] : 'admin';

      // Viewers can only read
      if (role === 'viewer') {
        return NextResponse.json({ error: 'Viewer accounts have read-only access' }, { status: 403 });
      }

      // Editors cannot modify users or settings
      if (role === 'editor') {
        if (pathname.startsWith('/api/admin/users') || pathname.startsWith('/api/admin/settings')) {
          return NextResponse.json({ error: 'Editor accounts cannot modify users or settings' }, { status: 403 });
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
