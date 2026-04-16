import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getAdminSession } from '@/lib/admin-auth';

// PUT: Change password (self)
export async function PUT(request) {
  try {
    const raw = getAdminSession(request);
    const sessionUser = raw ? { id: raw.userId, role: raw.role } : null;
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (sessionUser.id > 0) {
      // === Multi-user mode: change own password ===
      const user = await prisma.adminUser.findUnique({ where: { id: sessionUser.id } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } else {
      // === Legacy mode: change shared password ===
      let adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        console.warn('[Auth] ADMIN_PASSWORD env var is not set! Using insecure default.');
        adminPassword = 'fpgacenter2026';
      }
      try {
        const setting = await prisma.adminSetting.findUnique({ where: { key: 'admin_password' } });
        if (setting) adminPassword = setting.value;
      } catch {}

      if (currentPassword !== adminPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }

      await prisma.adminSetting.upsert({
        where: { key: 'admin_password' },
        update: { value: newPassword },
        create: { key: 'admin_password', value: newPassword },
      });

      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
