import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireEditor } from '@/lib/admin-auth';
import {
  buildImageAlt,
  buildSeoImageName,
  getUploadPolicy,
  monthPath,
  validateImageUpload,
} from '@/lib/image-upload-policy';
import { enforceMaxBody } from '@/lib/request-limits';

// See /api/admin/upload: coarse ceiling ahead of formData(), well above the
// blog policy's own limit so the policy stays the thing that reports the error.
const BLOG_UPLOAD_MAX_BODY = 8 * 1024 * 1024;

// POST: Upload blog image file. Videos are intentionally not accepted here
// because blog uploads live on the app server and can grow too quickly.
export async function POST(request) {
  const authError = await requireEditor(request);
  if (authError) return authError;
  try {
    const tooLarge = enforceMaxBody(request, BLOG_UPLOAD_MAX_BODY);
    if (tooLarge) return tooLarge;

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
    return apiError(e, 'admin/blog/upload');
  }
}
