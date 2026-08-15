import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';

/**
 * Shared admin authentication helper for API routes.
 *
 * Token format: `userId:role:timestamp:hmac` (HMAC-SHA256 signed)
 * Only 4-part signed tokens are accepted — unsigned tokens are rejected.
 *
 * REVOCATION
 * ----------
 * The signature and the 24h expiry are not enough on their own. The token
 * carries the user id AND the role, and nothing used to look at the database
 * again, so for up to 24 hours after an administrative action:
 *
 *   - a deactivated account (isActive = false) still had full access — which
 *     means "disable the compromised account" did not actually cut anyone off,
 *     including from the RFQ inbox and its customer contact details;
 *   - a deleted account still had full access;
 *   - a demoted admin still acted as an admin, because the old role travels in
 *     the token.
 *
 * The guards below therefore re-check the account on every request. Admin
 * traffic is a handful of requests per minute, so the extra lookup costs
 * nothing that matters, and a revoked session now dies on its next request.
 *
 * This is why the guards are async: `await requireAuth(request)`.
 */

// The legacy single-password master admin signs in as user id 0 and has no
// AdminUser row. Its credential is the master password itself, so rotating that
// is what revokes it — there is no row to check.
const LEGACY_MASTER_USER_ID = 0;

const SESSION_SECRET = process.env.SESSION_SECRET;

// Required in EVERY environment. A publicly-known fallback secret would let
// anyone forge an admin session on any deploy where the env var is missing
// (e.g. NODE_ENV accidentally unset on a VPS).
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required. Set it in .env.');
}

const EFFECTIVE_SESSION_SECRET = SESSION_SECRET;
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
 * Resolve the session against the current state of the account.
 *
 * Returns { session } when the caller may proceed (with `session.role` refreshed
 * from the database), or { error } with the Response to return.
 */
async function resolveLiveSession(request) {
  const session = getAdminSession(request);
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 }) };
  }

  if (session.userId === LEGACY_MASTER_USER_ID) return { session };

  let user;
  try {
    user = await prisma.adminUser.findUnique({
      where: { id: session.userId },
      select: { isActive: true, role: true },
    });
  } catch {
    // Database unreachable. Fail CLOSED: an admin API that cannot verify who is
    // calling must not serve customer data on the strength of a cookie alone.
    return { error: NextResponse.json({ error: 'Authentication unavailable' }, { status: 503 }) };
  }

  if (!user || !user.isActive) {
    return { error: NextResponse.json({ error: 'Session revoked — please log in again' }, { status: 401 }) };
  }

  // Trust the stored role over the one in the token, so a demotion takes effect
  // immediately instead of at the token's expiry.
  return { session: { ...session, role: user.role } };
}

/**
 * Guard: require any valid, still-active admin session.
 * Returns a Response if the caller must be rejected, otherwise null.
 *
 * Usage:
 *   export async function GET(request) {
 *     const authError = await requireAuth(request);
 *     if (authError) return authError;
 *     // ... handler logic
 *   }
 */
export async function requireAuth(request) {
  const { error } = await resolveLiveSession(request);
  return error || null;
}

/**
 * Guard: require a role that may write content (admin or editor).
 * Route-level defense in depth: the edge proxy also blocks viewer writes, but
 * mutating handlers must not depend on the proxy matcher staying intact.
 */
export async function requireEditor(request) {
  const { session, error } = await resolveLiveSession(request);
  if (error) return error;
  if (session.role !== 'admin' && session.role !== 'editor') {
    return NextResponse.json({ error: 'Forbidden — write access requires editor role' }, { status: 403 });
  }
  return null;
}

/**
 * Guard: require admin role specifically.
 * Returns 401 if not authenticated, 403 if insufficient role.
 */
export async function requireAdmin(request) {
  const { session, error } = await resolveLiveSession(request);
  if (error) return error;
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }
  return null;
}
