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

export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
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
