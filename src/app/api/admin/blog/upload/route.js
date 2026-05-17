import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/admin-auth';
import {
  buildImageAlt,
  buildSeoImageName,
  getUploadPolicy,
  monthPath,
  validateImageUpload,
} from '@/lib/image-upload-policy';

// POST: Upload blog image file. Videos are intentionally not accepted here
// because blog uploads live on the app server and can grow too quickly.
export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title') || '';
    const slug = formData.get('slug') || '';
    const context = formData.get('context') === 'cover' ? 'cover' : 'inline';
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const policy = getUploadPolicy('blog');
    const validation = validateImageUpload({
      fileName: file.name,
      mimeType: file.type,
      size: buffer.length,
      buffer,
      policy,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const datePath = monthPath();
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog', ...datePath.split('/'));
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueName = buildSeoImageName({
      folder: 'blog',
      ext: validation.ext,
      title,
      slug,
      context,
      originalName: file.name,
    });
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    const url = `/uploads/blog/${datePath}/${uniqueName}`;
    const alt = buildImageAlt({
      folder: 'blog',
      title,
      context,
      originalName: file.name,
    });

    return NextResponse.json({
      url,
      filename: uniqueName,
      size: buffer.length,
      type: file.type,
      alt,
      dimensions: validation.dimensions,
      markdown: `![${alt}](${url})`,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
