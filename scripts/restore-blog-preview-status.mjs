import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const snapshotPath = new URL('../docs/blog-preview-status-backup-2026-08-03.json', import.meta.url);
const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));

try {
  await prisma.$transaction(
    snapshot.posts.map((post) => prisma.blogPost.update({
      where: { id: post.id },
      data: {
        status: post.status,
        publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
      },
    }))
  );

  console.log(`Restored ${snapshot.posts.length} blog posts to the state captured at ${snapshot.capturedAt}.`);
} finally {
  await prisma.$disconnect();
}
