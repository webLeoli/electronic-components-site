import { NextResponse } from 'next/server';

// Pages accessible only by role (matches admin layout NAV_ITEMS)
const ROLE_RESTRICTED_PAGES = {
  // editor & viewer: cannot access these
  admin_only: ['/admin/users', '/admin/settings'],
  // viewer: cannot access these  
  editor_and_above: ['/admin/blog', '/admin/analytics'],
};

const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Required in EVERY environment - a known fallback secret would allow forged
// admin sessions whenever the env var is missing (see src/lib/admin-auth.js).
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required. Set it in .env.');
}

const EFFECTIVE_SESSION_SECRET = SESSION_SECRET;

/**
 * Verify a session token using Web Crypto API (Edge Runtime compatible).
 * Only accepts 4-part HMAC-SHA256 signed tokens: userId:role:timestamp:hmac
 * Returns { userId, role } or null.
 */
async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const parts = token.split(':');
    // Reject anything that isn't a 4-part signed token
    if (parts.length < 4) return null;

    const hmac = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join(':');

    // Validate structure before crypto
    if (!hmac || hmac.length !== 64) return null;
    if (!/^\d+:(admin|editor|viewer):\d+$/.test(payload)) return null;

    // Cryptographic HMAC-SHA256 verification using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(EFFECTIVE_SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedHmac = Array.from(new Uint8Array(sigBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison to prevent timing attacks
    if (hmac.length !== expectedHmac.length) return null;
    let mismatch = 0;
    for (let i = 0; i < hmac.length; i++) {
      mismatch |= hmac.charCodeAt(i) ^ expectedHmac.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    // Extract and validate fields
    const userId = parseInt(parts[0]);
    const role = parts[1];
    const timestamp = parseInt(parts[2]);

    if (isNaN(userId) || isNaN(timestamp)) return null;
    if (Date.now() - timestamp > SESSION_MAX_AGE) return null;

    return { userId, role };
  } catch {
    return null;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* routes (except login page)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionToken = request.cookies.get('admin_session')?.value;
    const session = await verifySessionToken(sessionToken);

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
    const session = await verifySessionToken(sessionToken);

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
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
