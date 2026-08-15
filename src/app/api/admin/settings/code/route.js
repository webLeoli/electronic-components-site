import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import prisma from '@/lib/db';
import { invalidateSettingsCache } from '@/lib/settings';
import { requireAdmin } from '@/lib/admin-auth';

// Code integration setting keys
const CODE_KEYS = [
  'ga_measurement_id',
  'gsc_verification',
  'fb_pixel_id',
  'custom_head_code',
];

// GET: Load all code integration settings
export async function GET(request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const settings = await prisma.adminSetting.findMany({
      where: { key: { in: CODE_KEYS } },
    });
    const result = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e, 'admin/settings/code');
  }
}

// PUT: Save code integration settings
// requireAdmin (not requireAuth): custom_head_code is injected site-wide into
// every visitor's page, so writing it must be restricted to the admin role at
// the route level — not only by the proxy middleware (defense in depth).
export async function PUT(request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const data = await request.json();

    for (const key of CODE_KEYS) {
      if (data[key] !== undefined) {
        const value = (data[key] || '').trim();
        if (value) {
          await prisma.adminSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          });
        } else {
          // Delete empty settings
          try {
            await prisma.adminSetting.delete({ where: { key } });
          } catch {} // Ignore if doesn't exist
        }
      }
    }

    // Invalidate settings cache so changes take effect immediately
    invalidateSettingsCache();

    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e, 'admin/settings/code');
  }
}
