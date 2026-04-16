import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { requireAuth } from '@/lib/admin-auth';

// Max file size: 5MB
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];

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

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, SVG, GIF`,
      }, { status: 400 });
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
    const ext = path.extname(file.name).toLowerCase() || '.jpg';
    const filename = generateSeoFilename(
      { partNumber, manufacturer, categoryName, categorySlug, folder: safeFolder },
      ext
    );

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
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
