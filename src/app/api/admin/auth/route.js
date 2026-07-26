import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getAdminSession } from '@/lib/admin-auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET is required in production.');
}

const EFFECTIVE_SESSION_SECRET = SESSION_SECRET || 'dev-only-session-secret';

/**
 * Create a signed session token: userId:role:timestamp:hmac
 * The HMAC prevents token forgery — only the server can create valid tokens.
 */
function createSignedToken(userId, role) {
  const payload = `${userId}:${role}:${Date.now()}`;
  const hmac = crypto
    .createHmac('sha256', EFFECTIVE_SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}:${hmac}`;
}

// --- Brute-force protection ---
// Backed by Redis when REDIS_URL is set (cluster-safe), in-memory otherwise.
// Two independent buckets: per-IP AND per-account, so neither rotating IPs nor
// spraying many accounts from one IP gets unlimited attempts.
const LOGIN_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5, prefix: 'login' };
const LOGIN_USER_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 10, prefix: 'login-user' };

// POST: Login
export async function POST(request) {
  try {
    const ip = getClientIp(request);

    if (!(await rateLimit(ip, LOGIN_RATE_LIMIT))) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email/Username and Password are required' }, { status: 400 });
    }

    if (!(await rateLimit(String(email).toLowerCase(), LOGIN_USER_RATE_LIMIT))) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // Attempt 1: Multi-user mode via AdminUser table
    let user = null;

    try {
      user = await prisma.adminUser.findUnique({ where: { email } });
    } catch {}

    if (user && user.isActive) {
      const valid = await bcrypt.compare(password, user.password);
      if (valid) {
        // Update last login
        await prisma.adminUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const token = createSignedToken(user.id, user.role);
        const response = NextResponse.json({
          success: true,
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });
        response.cookies.set('admin_session', token, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', maxAge: 24 * 60 * 60, path: '/'
        });
        return response;
      }
    }

    // Attempt 2: Fallback to Legacy Single Password Mode
    // We allow this if the email/username is explicitly 'admin'
    // or if the user simply types the master password (acting as master admin).
    if (email === 'admin' || !user) {
      let adminPassword = process.env.ADMIN_PASSWORD || null;
      let fromDb = false;
      try {
        const setting = await prisma.adminSetting.findUnique({ where: { key: 'admin_password' } });
        if (setting) { adminPassword = setting.value; fromDb = true; }
      } catch {}

      if (!adminPassword) {
        console.error('[Auth] Legacy admin password is not configured.');
        return NextResponse.json({ error: 'Admin login is not configured' }, { status: 503 });
      }

      // DB-stored master passwords are bcrypt hashes ($2...). Plaintext values
      // (legacy rows, or the ADMIN_PASSWORD env var) are compared timing-safe;
      // a matching plaintext DB row is upgraded to a hash on the spot so the
      // cleartext credential disappears from the database.
      let passwordMatch = false;
      if (adminPassword.startsWith('$2')) {
        passwordMatch = await bcrypt.compare(password, adminPassword);
      } else {
        const passwordBuf = Buffer.from(password);
        const adminPasswordBuf = Buffer.from(adminPassword);
        passwordMatch = passwordBuf.length === adminPasswordBuf.length &&
          crypto.timingSafeEqual(passwordBuf, adminPasswordBuf);
        if (passwordMatch && fromDb) {
          try {
            const hashed = await bcrypt.hash(password, 10);
            await prisma.adminSetting.update({
              where: { key: 'admin_password' },
              data: { value: hashed },
            });
          } catch {}
        }
      }
      if (passwordMatch) {
        const token = createSignedToken(0, 'admin');
        const response = NextResponse.json({
          success: true,
          user: { id: 0, email: 'admin', name: 'Super Admin', role: 'admin' },
        });
        response.cookies.set('admin_session', token, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', maxAge: 24 * 60 * 60, path: '/'
        });
        return response;
      }
    }

    return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
  } catch (e) {
    console.error('[Auth] Login error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET: Get current user info from session (uses shared HMAC verification)
export async function GET(request) {
  try {
    const session = getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { userId, role } = session;

    if (userId === 0) {
      // Legacy master admin mode
      return NextResponse.json({ user: { id: 0, email: 'admin', name: 'Admin', role: 'admin' } });
    }

    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or disabled' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE: Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_session');
  return response;
}
