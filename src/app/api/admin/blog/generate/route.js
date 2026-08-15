import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { revalidateBlog } from '@/lib/revalidate';
import { stripDangerousHtml, calcReadingTime } from '@/lib/blog-content';
import {
  getAiWriterConfig,
  saveAiWriterConfig,
  maskAiWriterConfig,
  generateArticle,
  generateCoverImage,
  findRelevantParts,
  isCliProvider,
} from '@/lib/ai-writer';

// LLM generation can take several minutes on long articles (CLI providers
// especially).
export const maxDuration = 600;

// The stored baseUrl receives the stored API key as a Bearer header, so it must
// never be attacker-chosen: require http(s), and https for anything that is not
// clearly a local endpoint. Blocks SSRF/key-exfiltration via a hostile baseUrl.
function validateBaseUrl(value, label) {
  if (!value) return null;
  let url;
  try {
    url = new URL(value);
  } catch {
    return `${label} is not a valid URL`;
  }
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) {
    return `${label} must use https:// (plain http is only allowed for localhost)`;
  }
  return null;
}

// AI writer config + generation are admin-only: the config controls where the
// stored API keys are sent, and generation can spawn server-side CLI processes.
export async function GET(request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const config = await getAiWriterConfig();
  return NextResponse.json({ config: maskAiWriterConfig(config) });
}

// PUT: save config. Empty apiKey fields keep the stored secret.
export async function PUT(request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const urlError =
      validateBaseUrl(body?.text?.baseUrl, 'Text Base URL') ||
      validateBaseUrl(body?.image?.baseUrl, 'Image Base URL');
    if (urlError) return NextResponse.json({ error: urlError }, { status: 400 });
    const saved = await saveAiWriterConfig(body);
    return NextResponse.json({ config: maskAiWriterConfig(saved) });
  } catch (e) {
    return apiError(e, 'admin/blog/generate');
  }
}

// POST: generate an article and save it as a DRAFT.
// Body: { topic, keywords?, categoryId?, generateImage? }
export async function POST(request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const { topic, keywords, categoryId, generateImage } = await request.json();
    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const config = await getAiWriterConfig();
    // CLI providers authenticate via a local `codex login` / Claude Code login,
    // so no API key is required for them.
    if (!isCliProvider(config.text.provider) && !config.text.apiKey) {
      return NextResponse.json(
        { error: 'No text API key configured. Save your provider settings first.' },
        { status: 400 },
      );
    }

    let categoryName = null;
    if (categoryId) {
      const cat = await prisma.blogCategory.findUnique({ where: { id: parseInt(categoryId) } });
      categoryName = cat?.name || null;
    }

    // Ground the prompt in real inventory.
    const parts = await findRelevantParts(topic.trim(), keywords);

    const article = await generateArticle(config, {
      topic: topic.trim(),
      keywords: (keywords || '').trim(),
      categoryName,
      parts,
    });

    // Ensure slug uniqueness without failing the whole run on a collision.
    let slug = article.slug;
    for (let i = 2; i <= 20; i++) {
      const existing = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
      if (!existing) break;
      slug = `${article.slug}-${i}`;
    }

    // Cover image is best-effort: null falls back to the themed generated cover.
    let coverImage = null;
    if (generateImage) {
      coverImage = await generateCoverImage(config.image, { title: article.title, slug });
    }

    const content = stripDangerousHtml(article.contentMarkdown);
    const post = await prisma.blogPost.create({
      data: {
        title: article.title.slice(0, 200),
        slug,
        excerpt: (article.excerpt || '').slice(0, 300) || null,
        content,
        coverImage,
        status: 'draft',
        publishedAt: null,
        author: 'FPGACenter Team',
        categoryId: categoryId ? parseInt(categoryId) : null,
        tags: article.tags || null,
        seoTitle: (article.seoTitle || '').slice(0, 70) || null,
        seoDesc: (article.seoDesc || '').slice(0, 170) || null,
        seoKeywords: article.seoKeywords || null,
        relatedProducts: article.relatedProducts || null,
        readingTime: calcReadingTime(content),
      },
    });

    revalidateBlog(post.slug);
    return NextResponse.json(
      { post, imageGenerated: Boolean(coverImage), partsUsed: parts.length },
      { status: 201 },
    );
  } catch (e) {
    return apiError(e, 'admin/blog/generate');
  }
}
