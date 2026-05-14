import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/admin-auth';

const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
};

function hasValidMediaSignature(buffer, type) {
  if (type === 'image/jpeg') return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  if (type === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
  }
  if (type === 'image/gif') {
    const header = buffer.subarray(0, 6).toString('ascii');
    return header === 'GIF87a' || header === 'GIF89a';
  }
  if (type === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  if (type === 'video/webm') return buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
  if (type === 'video/mp4') return buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  return false;
}

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

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_FILE_TYPES[file.type] || !ALLOWED_FILE_TYPES[file.type].includes(ext)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    if (!hasValidMediaSignature(buffer, file.type)) {
      return NextResponse.json({ error: 'File content does not match the declared media type' }, { status: 400 });
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
