import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const settings = await prisma.adminSetting.findMany({
      where: { key: { in: ['robots_txt', 'sitemap_urls'] } },
    });

    const result = {
      robots_txt: '',
      sitemap_urls: '',
    };

    settings.forEach(s => {
      result[s.key] = s.value;
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch SEO settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    
    // We only process robots_txt and sitemap_urls
    const allowedKeys = ['robots_txt', 'sitemap_urls'];
    
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        await prisma.adminSetting.upsert({
          where: { key },
          update: { value: body[key] },
          create: { key, value: body[key] },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update SEO settings' }, { status: 500 });
  }
}
