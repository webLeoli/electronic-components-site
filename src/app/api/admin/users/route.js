import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getAdminSession } from '@/lib/admin-auth';

// GET: List all admin users
export async function GET(request) {
  const session = getAdminSession(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can manage users' }, { status: 403 });
  }

  try {
    const users = await prisma.adminUser.findMany({
      select: {
        id: true, email: true, name: true, role: true,
        isActive: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch (e) {
    return apiError(e, 'admin/users');
  }
}

// POST: Create new admin user
export async function POST(request) {
  const session = getAdminSession(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 });
  }

  try {
    const { email, password, name, userRole } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (!['admin', 'editor', 'viewer'].includes(userRole || 'editor')) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole || 'editor',
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (e) {
    return apiError(e, 'admin/users');
  }
}

// PUT: Update user (role, status, reset password)
export async function PUT(request) {
  const session = getAdminSession(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can update users' }, { status: 403 });
  }

  try {
    const { id, name, role: newRole, isActive, newPassword } = await request.json();
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (newRole !== undefined && ['admin', 'editor', 'viewer'].includes(newRole)) {
      updateData.role = newRole;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (e) {
    return apiError(e, 'admin/users');
  }
}

// DELETE: Delete user
export async function DELETE(request) {
  const session = getAdminSession(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can delete users' }, { status: 403 });
  }
  const callerId = session.userId;

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    // Prevent self-deletion
    if (id === callerId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e, 'admin/users');
  }
}
