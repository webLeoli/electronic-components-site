import path from 'node:path';

const MB = 1024 * 1024;

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const UPLOAD_POLICIES = {
  products: {
    maxBytes: 2 * MB,
    maxWidth: 1600,
    maxHeight: 1600,
    folder: 'products',
    label: 'Product image',
  },
  categories: {
    maxBytes: 2 * MB,
    maxWidth: 1800,
    maxHeight: 1200,
    folder: 'categories',
    label: 'Category image',
  },
  manufacturers: {
    maxBytes: 1 * MB,
    maxWidth: 800,
    maxHeight: 400,
    folder: 'manufacturers',
    label: 'Manufacturer logo',
  },
  blog: {
    maxBytes: 2 * MB,
    maxWidth: 1800,
    maxHeight: 1200,
    folder: 'blog',
    label: 'Blog image',
  },
};

function slugify(value, maxLength = 80) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, maxLength);
}

function normalizePartNumber(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

function getUploadPolicy(folder) {
  const normalized = String(folder || 'products').replace(/[^a-z0-9-]/gi, '');
  return UPLOAD_POLICIES[normalized] || UPLOAD_POLICIES.products;
}

function hasValidImageSignature(buffer, type) {
  if (type === 'image/jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }
  if (type === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
  }
  if (type === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

function getImageDimensions(buffer, type) {
  if (type === 'image/png' && buffer.length >= 24) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (type === 'image/jpeg') {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xFF) return null;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2) return null;

      if (
        marker === 0xC0 || marker === 0xC1 || marker === 0xC2 ||
        marker === 0xC3 || marker === 0xC5 || marker === 0xC6 ||
        marker === 0xC7 || marker === 0xC9 || marker === 0xCA ||
        marker === 0xCB || marker === 0xCD || marker === 0xCE ||
        marker === 0xCF
      ) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }

      offset += 2 + length;
    }
  }

  // WebP dimensions are intentionally treated as unknown here. We still
  // validate signatures and size; compression/variant generation can use sharp.
  return null;
}

function validateImageUpload({ fileName, mimeType, size, buffer, policy }) {
  const ext = path.extname(fileName || '').toLowerCase();
  const allowedExts = ALLOWED_IMAGE_TYPES[mimeType];

  if (!allowedExts || !allowedExts.includes(ext)) {
    return {
      ok: false,
      error: 'Invalid image type. Allowed: JPG, PNG, WebP.',
    };
  }

  if (!hasValidImageSignature(buffer, mimeType)) {
    return {
      ok: false,
      error: 'File content does not match the declared image type.',
    };
  }

  if (size > policy.maxBytes) {
    return {
      ok: false,
      error: `${policy.label} is too large: ${(size / MB).toFixed(1)}MB. Max: ${(policy.maxBytes / MB).toFixed(0)}MB.`,
    };
  }

  const dimensions = getImageDimensions(buffer, mimeType);
  if (dimensions && (dimensions.width > policy.maxWidth || dimensions.height > policy.maxHeight)) {
    return {
      ok: false,
      error: `${policy.label} dimensions are too large: ${dimensions.width}x${dimensions.height}. Max: ${policy.maxWidth}x${policy.maxHeight}.`,
    };
  }

  return { ok: true, ext, dimensions };
}

function monthPath(date = new Date()) {
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}/${m}`;
}

function buildSeoImageName({ folder, ext, partNumber, manufacturer, categoryName, categorySlug, title, slug, context, originalName }) {
  const parts = [];

  if (folder === 'products' && partNumber) {
    parts.push(normalizePartNumber(partNumber));
    if (manufacturer) parts.push(slugify(manufacturer, 40));
    parts.push('electronic-component');
  } else if (folder === 'categories' && (categorySlug || categoryName)) {
    parts.push(slugify(categorySlug || categoryName, 60));
    parts.push('electronic-components-category');
  } else if (folder === 'manufacturers' && manufacturer) {
    parts.push(slugify(manufacturer, 60));
    parts.push('manufacturer-logo');
  } else if (folder === 'blog') {
    parts.push(slugify(slug || title || path.basename(originalName || 'blog-image', ext), 70));
    parts.push(context === 'cover' ? 'cover' : 'image');
  } else {
    parts.push(slugify(path.basename(originalName || 'image', ext), 60) || 'image');
  }

  const base = parts.filter(Boolean).join('-').replace(/-+/g, '-').substring(0, 110);
  const suffix = Date.now().toString().slice(-6);
  return `${base}-${suffix}${ext}`;
}

function buildImageAlt({ folder, partNumber, manufacturer, categoryName, title, context, originalName }) {
  if (folder === 'products' && partNumber) {
    return `${partNumber}${manufacturer ? ` ${manufacturer}` : ''} electronic component`;
  }
  if (folder === 'categories' && categoryName) {
    return `${categoryName} electronic components`;
  }
  if (folder === 'manufacturers' && manufacturer) {
    return `${manufacturer} manufacturer logo`;
  }
  if (folder === 'blog' && title) {
    return context === 'cover' ? `${title} cover image` : `${title} illustration`;
  }
  return path.basename(originalName || 'image', path.extname(originalName || '')).replace(/[-_]+/g, ' ').trim() || 'image';
}

export {
  ALLOWED_IMAGE_TYPES,
  UPLOAD_POLICIES,
  buildImageAlt,
  buildSeoImageName,
  getUploadPolicy,
  monthPath,
  slugify,
  validateImageUpload,
};
