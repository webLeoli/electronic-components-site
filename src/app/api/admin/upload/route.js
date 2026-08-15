import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { requireAuth } from '@/lib/admin-auth';
import {
  buildImageAlt,
  buildSeoImageName,
  getUploadPolicy,
  validateImageUpload,
} from '@/lib/image-upload-policy';
import { enforceMaxBody } from '@/lib/request-limits';

// Ceiling for the whole multipart body, above every per-folder policy (max
// 2MB) plus its envelope. The policy check is what reports a precise limit to
// the user; this only stops the heap from filling first.
const UPLOAD_MAX_BODY = 8 * 1024 * 1024;

export async function POST(request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    // Ahead of formData(), which buffers the whole body. The per-policy size
    // check below only runs once that has already happened; this is the
    // coarse ceiling that keeps an oversized upload out of the heap. Policies
    // top out at 2MB, so the largest legitimate upload is far under this.
    const tooLarge = enforceMaxBody(request, UPLOAD_MAX_BODY);
    if (tooLarge) return tooLarge;

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'products';

    // Product/category metadata for smart filename
    const partNumber = formData.get('partNumber') || '';
    const manufacturer = formData.get('manufacturer') || '';
    const categoryName = formData.get('categoryName') || '';
    const categorySlug = formData.get('categorySlug') || '';

    if (!file || !file.name) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const policy = getUploadPolicy(folder);
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

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', policy.folder);

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filename = buildSeoImageName({
      folder: policy.folder,
      ext: validation.ext,
      partNumber,
      manufacturer,
      categoryName,
      categorySlug,
      originalName: file.name,
    });

    // Write file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return public URL + generated alt text
    const publicUrl = `/uploads/${policy.folder}/${filename}`;
    const altText = buildImageAlt({
      folder: policy.folder,
      partNumber,
      manufacturer,
      categoryName,
      originalName: file.name,
    });

    return NextResponse.json({
      url: publicUrl,
      filename,
      alt: altText,
      size: buffer.length,
      type: file.type,
      dimensions: validation.dimensions,
      policy: {
        maxBytes: policy.maxBytes,
        maxWidth: policy.maxWidth,
        maxHeight: policy.maxHeight,
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
