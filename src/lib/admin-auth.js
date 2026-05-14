import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Shared admin authentication helper for API routes.
 *
 * Token format: `userId:role:timestamp:hmac` (HMAC-SHA256 signed)
 * Only 4-part signed tokens are accepted — unsigned tokens are rejected.
 */

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET is required in production.');
}

const EFFECTIVE_SESSION_SECRET = SESSION_SECRET || 'dev-only-session-secret';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

/**
 * Verify and parse a signed session token.
 * Returns { userId, role } or null if invalid.
 */
function verifyToken(token) {
  if (!token) return null;
  try {
    const parts = token.split(':');
    // Require 4-part HMAC-signed format: userId:role:timestamp:hmac
    if (parts.length < 4) return null;

    const hmac = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join(':');
    if (!hmac || hmac.length !== 64) return null;
    if (!/^\d+:(admin|editor|viewer):\d+$/.test(payload)) return null;

    const expectedHmac = crypto
      .createHmac('sha256', EFFECTIVE_SESSION_SECRET)
      .update(payload)
      .digest('hex');
    // Use timingSafeEqual to prevent timing attacks
    const hmacBuf = Buffer.from(hmac, 'hex');
    const expectedBuf = Buffer.from(expectedHmac, 'hex');
    if (hmacBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(hmacBuf, expectedBuf)) return null;

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
