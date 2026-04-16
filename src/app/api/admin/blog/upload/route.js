import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/admin-auth';

// POST: Upload image/video file
export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `File type not allowed: ${file.type}` }, { status: 400 });
    }

    // Max 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(file.name) || `.${file.type.split('/')[1]}`;
    const baseName = path.basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '-').substring(0, 60);
    const uniqueName = `${Date.now()}-${baseName}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    const url = `/uploads/blog/${uniqueName}`;
    const isVideo = file.type.startsWith('video/');

    return NextResponse.json({
      url,
      filename: uniqueName,
      size: buffer.length,
      type: file.type,
      isVideo,
      markdown: isVideo
        ? `<video src="${url}" controls width="100%"></video>`
        : `![${baseName}](${url})`,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
