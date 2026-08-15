import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { BLOG_COVER_MANIFEST } from '../src/lib/blog-cover-manifest.js';

const prisma = new PrismaClient();

try {
  const updates = [];

  for (const [slug, cover] of Object.entries(BLOG_COVER_MANIFEST)) {
    if (!cover.src.startsWith('/')) throw new Error(`${slug}: cover must use a site-relative URL`);
    await access(join(process.cwd(), 'public', cover.src.slice(1)));
    await access(join(process.cwd(), 'public', cover.src.replace(/\.webp$/i, '-640.webp').slice(1)));

    updates.push(prisma.blogPost.update({
      where: { slug },
      data: { coverImage: cover.src },
      select: { slug: true, coverImage: true },
    }));
  }

  const result = await prisma.$transaction(updates);
  console.log(`Synchronized ${result.length} blog cover paths.`);
} finally {
  await prisma.$disconnect();
}
