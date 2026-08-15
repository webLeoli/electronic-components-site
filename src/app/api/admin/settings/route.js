import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
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
      // isActive, not just existence: same revocation rule the shared guards
      // enforce. A deactivated account still holds a valid cookie for up to 24h,
      // and it must not be able to write anything — including its own password.
      if (!user || !user.isActive) {
        return NextResponse.json({ error: 'Session revoked — please log in again' }, { status: 401 });
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
      let adminPassword = process.env.ADMIN_PASSWORD || null;
      try {
        const setting = await prisma.adminSetting.findUnique({ where: { key: 'admin_password' } });
        if (setting) adminPassword = setting.value;
      } catch {}

      if (!adminPassword) {
        return NextResponse.json({ error: 'Admin password is not configured' }, { status: 503 });
      }

      // Stored value may be a bcrypt hash ($2...) or a legacy plaintext value.
      const currentOk = adminPassword.startsWith('$2')
        ? await bcrypt.compare(currentPassword || '', adminPassword)
        : currentPassword === adminPassword;
      if (!currentOk) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }

      // Always store the new master password as a bcrypt hash - never plaintext.
      const hashedNew = await bcrypt.hash(newPassword, 10);
      await prisma.adminSetting.upsert({
        where: { key: 'admin_password' },
        update: { value: hashedNew },
        create: { key: 'admin_password', value: hashedNew },
      });

      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }
  } catch (e) {
    return apiError(e, 'admin/settings');
  }
}
