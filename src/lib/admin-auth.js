import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Shared admin authentication helper for API routes.
 *
 * Token format: `userId:role:timestamp:hmac` (HMAC-SHA256 signed)
 * Falls back gracefully for legacy 3-part tokens (no hmac).
 */

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret-change-in-production';

/**
 * Verify and parse a signed session token.
 * Returns { userId, role } or null if invalid.
 */
function verifyToken(token) {
  if (!token) return null;
  try {
    const parts = token.split(':');
    // New format: userId:role:timestamp:hmac (4 parts)
    if (parts.length >= 4) {
      const hmac = parts[parts.length - 1];
      const payload = parts.slice(0, -1).join(':');
      const expectedHmac = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(payload)
        .digest('hex');
      // Use timingSafeEqual to prevent timing attacks
      const hmacBuf = Buffer.from(hmac, 'hex');
      const expectedBuf = Buffer.from(expectedHmac, 'hex');
      if (hmacBuf.length !== expectedBuf.length) return null;
      if (!crypto.timingSafeEqual(hmacBuf, expectedBuf)) return null;
    }
    // Accept 3-part legacy tokens (userId:role:timestamp-random)
    if (parts.length >= 2) {
      return { userId: parseInt(parts[0]), role: parts[1] };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get authenticated user from request cookies.
 * Returns { userId, role } or null.
 */
export function getAdminSession(request) {
  const token = request.cookies.get('admin_session')?.value;
  return verifyToken(token);
}

/**
 * Guard: require any valid admin session.
 * Returns a 401 Response if not authenticated, otherwise null.
 *
 * Usage:
 *   export async function GET(request) {
 *     const authError = requireAuth(request);
 *     if (authError) return authError;
 *     // ... handler logic
 *   }
 */
export function requireAuth(request) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 });
  }
  return null;
}

/**
 * Guard: require admin role specifically.
 * Returns 401 if not authenticated, 403 if insufficient role.
 */
export function requireAdmin(request) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }
  return null;
}
