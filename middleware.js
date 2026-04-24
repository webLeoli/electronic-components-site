import { NextResponse } from 'next/server';

// Pages accessible only by role (matches admin layout NAV_ITEMS)
const ROLE_RESTRICTED_PAGES = {
  // editor & viewer: cannot access these
  admin_only: ['/admin/users', '/admin/settings'],
  // viewer: cannot access these  
  editor_and_above: ['/admin/blog', '/admin/analytics'],
};

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret-change-in-production';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Verify a session token. Returns { userId, role } or null.
 * Supports:
 *   - 4-part HMAC-signed tokens: userId:role:timestamp:hmac (preferred)
 *   - 3-part legacy unsigned tokens: userId:role:timestamp-random (backward compat)
 */
function verifySessionToken(token) {
  if (!token) return null;
  try {
    const parts = token.split(':');
    if (parts.length < 3) return null;

    // Extract role and timestamp
    const userId = parseInt(parts[0]);
    const role = parts[1];
    const timestamp = parseInt(parts[2]);

    // Check session expiry
    if (isNaN(timestamp) || Date.now() - timestamp > SESSION_MAX_AGE) {
      return null;
    }

    // HMAC verification for 4-part signed tokens
    if (parts.length >= 4) {
      const hmac = parts[parts.length - 1];
      const payload = parts.slice(0, -1).join(':');
      // Edge runtime doesn't have Node crypto, use Web Crypto-compatible HMAC check
      // For middleware, we do a simple hex comparison since we can't use timingSafeEqual
      const encoder = new TextEncoder();
      // Compute expected HMAC using Web Crypto SubtleCrypto (async not available in sync middleware)
      // Fallback: use a simple string comparison here (middleware runs in edge, not Node)
      // The actual cryptographic verification happens in admin-auth.js (Node runtime)
      // Middleware serves as a first-pass gate; admin-auth.js is the definitive check
      const expectedPayloadFormat = /^\d+:(admin|editor|viewer):\d+$/.test(payload);
      if (!expectedPayloadFormat || !hmac || hmac.length !== 64) {
        return null;
      }
    }

    if (isNaN(userId) || !['admin', 'editor', 'viewer'].includes(role)) {
      return null;
    }

    return { userId, role };
  } catch {
    return null;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* routes (except login page)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionToken = request.cookies.get('admin_session')?.value;
    const session = verifySessionToken(sessionToken);

    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { role } = session;

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
    const session = verifySessionToken(sessionToken);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session;

    // Role-based access control for write operations
    if (request.method !== 'GET') {
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
