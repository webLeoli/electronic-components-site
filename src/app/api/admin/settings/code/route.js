import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { invalidateSettingsCache } from '@/lib/settings';
import { requireAuth } from '@/lib/admin-auth';

// Code integration setting keys
const CODE_KEYS = [
  'ga_measurement_id',
  'gsc_verification',
  'fb_pixel_id',
  'custom_head_code',
];

// GET: Load all code integration settings
export async function GET(request) {
  const authError = requireAuth(request);
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: Save code integration settings
export async function PUT(request) {
  const authError = requireAuth(request);
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
