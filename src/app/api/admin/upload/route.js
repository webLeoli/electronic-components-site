import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { requireAuth } from '@/lib/admin-auth';

// Max file size: 5MB
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
};

function hasValidImageSignature(buffer, type) {
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
  return false;
}

/**
 * Generate an SEO-friendly filename from product/category metadata.
 *
 *  Input:  partNumber = "STM32F103C8T6", manufacturer = "STMicroelectronics", ext = ".webp"
 *  Output: "stm32f103c8t6-stmicroelectronics-electronic-component.webp"
 *
 *  Input:  categoryName = "Integrated Circuits", ext = ".png"
 *  Output: "integrated-circuits-electronic-components-category.png"
 */
function generateSeoFilename({ partNumber, manufacturer, categoryName, categorySlug, folder }, ext) {
  const parts = [];

  if (partNumber) {
    // Product image filename
    parts.push(slugify(partNumber));
    if (manufacturer) parts.push(slugify(manufacturer));
    parts.push('electronic-component');
  } else if (categoryName || categorySlug) {
    // Category image filename
    parts.push(categorySlug || slugify(categoryName));
    parts.push('electronic-components-category');
  } else if (folder === 'blog') {
    parts.push('blog-image');
  } else {
    parts.push('image');
  }

  // Truncate to reasonable URL length
  let name = parts.join('-').substring(0, 80);
  // Add short timestamp to ensure uniqueness (last 6 digits)
  const ts = Date.now().toString().slice(-6);
  return `${name}-${ts}${ext}`;
}

function slugify(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);
}

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
    const ext = path.extname(file.name).toLowerCase();

    // Validate type and extension. SVG is intentionally not allowed because
    // public SVG uploads can execute script in some browser contexts.
    if (!ALLOWED_FILE_TYPES[file.type] || !ALLOWED_FILE_TYPES[file.type].includes(ext)) {
      return NextResponse.json({
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
      }, { status: 400 });
    }

    if (!hasValidImageSignature(buffer, file.type)) {
      return NextResponse.json({ error: 'File content does not match the declared image type' }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB`,
      }, { status: 400 });
    }

    // Sanitize folder name
    const safeFolder = folder.replace(/[^a-z0-9-]/gi, '');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder);

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate SEO filename
    const filename = generateSeoFilename(
      { partNumber, manufacturer, categoryName, categorySlug, folder: safeFolder },
      ext
    );

    // Write file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return public URL + generated alt text
    const publicUrl = `/uploads/${safeFolder}/${filename}`;

    // Generate suggested alt text
    let altText = '';
    if (partNumber) {
      altText = `${partNumber}${manufacturer ? ` ${manufacturer}` : ''} Electronic Component`;
    } else if (categoryName) {
      altText = `${categoryName} Electronic Components`;
    }

    return NextResponse.json({
      url: publicUrl,
      filename,
      alt: altText,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
