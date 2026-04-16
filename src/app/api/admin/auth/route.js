import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

// --- Brute-force protection: IP-based rate limiting ---
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5;

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const key = ip || 'unknown';
  if (!loginAttempts.has(key)) loginAttempts.set(key, []);
  const timestamps = loginAttempts.get(key).filter(t => now - t < RATE_LIMIT_WINDOW);
  loginAttempts.set(key, timestamps);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  return true;
}

// POST: Login
export async function POST(request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    if (!checkLoginRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email/Username and Password are required' }, { status: 400 });
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

        const token = `${user.id}:${user.role}:${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
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
      let adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        adminPassword = 'fpgacenter2026';
      }
      try {
        const setting = await prisma.adminSetting.findUnique({ where: { key: 'admin_password' } });
        if (setting) adminPassword = setting.value;
      } catch {}

      if (password === adminPassword) {
        const token = `0:admin:${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
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

// GET: Get current user info from session
export async function GET(request) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const parts = sessionToken.split(':');
    if (parts.length < 3) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = parseInt(parts[0]);
    const role = parts[1];

    if (userId === 0) {
      // Legacy mode
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
