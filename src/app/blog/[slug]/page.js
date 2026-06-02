import { cache } from 'react';
import prisma from '@/lib/db';
/* eslint-disable @next/next/no-img-element -- Blog cover images may be uploaded or externally hosted; remote image optimization is intentionally disabled. */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import sanitizeHtml from 'sanitize-html';
import { productPath, SITE_NAME, SITE_URL, hasConfirmedStock, getAvailabilityText } from '@/lib/seo';
import { getBlogCoverImage, getBlogCoverTheme } from '@/lib/blog-cover';
import '../blog.css';

export const revalidate = 3600;

// Deduplicate post lookup across generateMetadata and page component
const getPost = cache(async (slug) => {
  return prisma.blogPost.findUnique({
    where: { slug },
    include: { category: { select: { name: true, slug: true } } },
  });
});

const BLOG_HTML_SANITIZE_OPTIONS = {
  allowedTags: [
    'h2', 'h3', 'h4', 'p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote',
    'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure',
    'figcaption', 'img', 'a', 'hr', 'div', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'class'],
    img: ['src', 'alt', 'title', 'loading', 'width', 'height', 'class'],
    code: ['class'],
    pre: ['class'],
    div: ['class'],
    span: ['class'],
    table: ['class'],
    th: ['class'],
    td: ['class'],
    blockquote: ['class'],
    figure: ['class'],
    h2: ['id', 'class'],
    h3: ['id', 'class'],
    h4: ['id', 'class'],
    ul: ['class'],
    ol: ['class'],
    li: ['class'],
    hr: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https'],
  },
  allowedClasses: {
    '*': [/^blog-/, /^theme-/],
    code: [/^lang-/],
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
  },
};

function escapeHtmlText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function legacyBlogImagePlaceholder(caption, theme) {
  const cleanCaption = String(caption || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const title = cleanCaption || theme.title;

  return `<div class="blog-inline-image-placeholder ${theme.className}"><span>${escapeHtmlText(theme.label)}</span><strong>${escapeHtmlText(title)}</strong></div>`;
}

function replaceLegacyBlogImages(html, theme) {
  let nextHtml = html.replace(
    /<figure\b[^>]*>\s*<img\b[^>]*src=["']\/images\/blog\/[^"']+["'][^>]*>\s*(?:<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/gi,
    (_, caption) => legacyBlogImagePlaceholder(caption, theme)
  );

  nextHtml = nextHtml.replace(
    /<img\b[^>]*src=["']\/images\/blog\/[^"']+["'][^>]*>/gi,
    () => legacyBlogImagePlaceholder('', theme)
  );

  return nextHtml;
}

// Markdown to HTML converter (server-side, full featured)
// Safely handles mixed HTML+markdown content by protecting existing HTML blocks
function markdownToHtml(md) {
  if (!md) return '';
  
  // Phase 1: Protect existing HTML blocks from markdown processing
  // Extract <table>...</table>, <div>...</div>, <ul>...</ul>, <ol>...</ol>, <blockquote>...</blockquote>, <pre>...</pre>
  const protectedBlocks = [];
  let html = md.replace(/<(table|div|ul|ol|blockquote|pre|figure|section|aside|nav|header|footer|p)[\s>][\s\S]*?<\/\1>/gi, (match) => {
    const placeholder = `<!--PROTECTED_BLOCK_${protectedBlocks.length}-->`;
    protectedBlocks.push(match);
    return placeholder;
  });

  // Phase 2: Convert markdown patterns in the remaining text
  // Only escape ampersands that are NOT part of HTML entities or tags
  html = html.replace(/&(?!amp;|lt;|gt;|quot;|nbsp;|#\d+;|#x[\da-fA-F]+;)/g, '&amp;');

  // Code blocks before inline treatment
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre class="blog-code-block"><code class="lang-${lang || 'text'}">${escaped.trim()}</code></pre>`;
  });

  // Tables (markdown pipe tables)
  html = html.replace(/^\|(.+)\|\s*\n\|[\s\-:|]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (match, header, rows) => {
    const ths = header.split('|').map(h => h.trim()).filter(Boolean).map(h => `<th>${h}</th>`).join('');
    const trs = rows.trim().split('\n').map(row => {
      const tds = row.split('|').map(c => c.trim()).filter(Boolean).map(c => `<td>${c}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<div class="blog-table-wrap"><table class="blog-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
  });

  // Headings - only convert lines that start with #
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');

  // Bold, italic, inline code
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.+?)`/g, '<code class="blog-inline-code">$1</code>');

  // Images and links (images first to avoid conflict)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure class="blog-figure"><img src="$2" alt="$1" loading="lazy" /><figcaption>$1</figcaption></figure>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="blog-link">$1</a>');

  // Unordered lists (markdown - syntax, not inside HTML)
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul class="blog-list">$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote class="blog-quote">$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="blog-hr" />');

  // Paragraphs - wrap remaining text in <p> tags
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');
  html = `<p>${html}</p>`;

  // Clean up: remove <p> wrappers around block-level elements
  html = html.replace(/<p>\s*<(h[2-4]|pre|div|ul|ol|blockquote|figure|hr|table|section)/g, '<$1');
  html = html.replace(/<\/(h[2-4]|pre|div|ul|ol|blockquote|figure|hr|table|section)>\s*<\/p>/g, '</$1>');
  html = html.replace(/<p>\s*<\/p>/g, '');
  // Remove <br/> before/after block elements
  html = html.replace(/<br\/>\s*<(h[2-4]|pre|div|ul|ol|blockquote|figure|hr|table|section)/g, '<$1');
  html = html.replace(/<\/(h[2-4]|pre|div|ul|ol|blockquote|figure|hr|table|section)>\s*<br\/>/g, '</$1>');
  // Remove <p> and <br/> around placeholder comments
  html = html.replace(/<p>\s*(<!--PROTECTED_BLOCK_\d+-->)\s*<\/p>/g, '$1');
  html = html.replace(/<br\/>\s*(<!--PROTECTED_BLOCK_\d+-->)/g, '$1');
  html = html.replace(/(<!--PROTECTED_BLOCK_\d+-->)\s*<br\/>/g, '$1');

  // Phase 3: Restore protected HTML blocks
  protectedBlocks.forEach((block, i) => {
    html = html.replace(`<!--PROTECTED_BLOCK_${i}-->`, block);
  });

  return html;
}

// Extract headings for TOC
function extractToc(md) {
  const headings = [];
  const regex = /^(#{2,3}) (.+)$/gm;
  let match;
  while ((match = regex.exec(md)) !== null) {
    headings.push({ level: match[1].length, text: match[2], id: match[2] });
  }
  return headings;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Article Not Found' };
  const title = (post.seoTitle || post.title);
  const description = post.seoDesc || post.excerpt || `Read ${post.title} on ${SITE_NAME}`;
  const coverImage = getBlogCoverImage(post) || `${SITE_URL}/og-image.png`;
  return {
    title,
    description,
    keywords: post.seoKeywords || undefined,
    openGraph: { title, description, url: `${SITE_URL}/blog/${post.slug}`, siteName: SITE_NAME, type: 'article', images: [{ url: coverImage, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [coverImage] },
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || post.status !== 'published') notFound();
  const coverImage = getBlogCoverImage(post);
  const coverTheme = getBlogCoverTheme(post);

  // Increment view count (fire-and-forget) - skip bots to avoid inflated counts
  const headersList = await headers();
  const ua = (headersList.get('user-agent') || '').toLowerCase();
  const isBot = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|sogou|facebookexternalhit|twitterbot|linkedinbot|semrushbot|ahrefsbot|dotbot|mj12bot|bytespider/i.test(ua);
  if (!isBot) {
    prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  }

  // Smart content detection and conversion
  // Content may be pure HTML (from WYSIWYG), pure markdown (from seeds), or MIXED (edited seeddata)
  // Strategy: always process markdown patterns, even within HTML content
  const hasHtml = /<(h[2-4]|p|div|ul|ol|table|blockquote)\b/i.test(post.content || '');
  const hasMarkdown = /^#{2,4} /m.test(post.content || '') || /^\|.+\|$/m.test(post.content || '');
  
  let contentHtml;
  if (hasMarkdown) {
    // Has markdown patterns - always convert (whether pure markdown or mixed)
    contentHtml = markdownToHtml(post.content);
  } else if (hasHtml) {
    // Pure HTML from WYSIWYG editor
    contentHtml = post.content;
  } else {
    // Fallback: treat as markdown
    contentHtml = markdownToHtml(post.content);
  }
  
  // Post-processing: convert any remaining inline markdown patterns in HTML content
  // Using universally compatible regex (no lookbehind for Edge Runtime compat)
  contentHtml = contentHtml.replace(/(^|>)(\s*)#{4}\s+(.+?)(?=\s*(?:<|$))/gm, '$1$2<h4>$3</h4>');
  contentHtml = contentHtml.replace(/(^|>)(\s*)#{3}\s+(.+?)(?=\s*(?:<|$))/gm, '$1$2<h3>$3</h3>');
  contentHtml = contentHtml.replace(/(^|>)(\s*)#{2}\s+(.+?)(?=\s*(?:<|$))/gm, '$1$2<h2>$3</h2>');
  // Convert remaining markdown bold/italic if any
  contentHtml = contentHtml.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  contentHtml = contentHtml.replace(/(^|[\s>])\*([^*]+?)\*(?=[\s<.,;!?)]|$)/gm, '$1<em>$2</em>');
  contentHtml = replaceLegacyBlogImages(contentHtml, coverTheme);
  contentHtml = sanitizeHtml(contentHtml, BLOG_HTML_SANITIZE_OPTIONS);
  
  // Strip HTML tags from a string to get plain text
  const stripHtml = (html) => html.replace(/<[^>]+>/g, '').trim();
  
  // Generate URL-safe slug from text
  const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 80);

  // Extract headings from HTML for TOC (handles nested HTML in headings)
  const tocFromHtml = (html) => {
    const headings = [];
    const regex = /<h([23])([^>]*)>([\s\S]*?)<\/h[23]>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const text = stripHtml(match[3]);
      if (text) {
        headings.push({ level: parseInt(match[1]), text, id: slugify(text) });
      }
    }
    return headings;
  };
  // Always extract TOC from the final rendered HTML
  const toc = tocFromHtml(contentHtml);

  // Inject id attributes into h2/h3 headings for TOC anchor navigation
  contentHtml = contentHtml.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h[23]>/gi, (full, level, attrs, inner) => {
    const text = stripHtml(inner);
    const id = slugify(text);
    // Don't add id if one already exists
    if (/\bid\s*=/.test(attrs)) return full;
    return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
  });

  // Related products
  const relatedPartNumbers = (post.relatedProducts || '').split(',').map(s => s.trim()).filter(Boolean);
  let relatedProducts = [];
  if (relatedPartNumbers.length > 0) {
    relatedProducts = await prisma.product.findMany({
      where: { partNumber: { in: relatedPartNumbers } },
      select: { partNumber: true, manufacturer: true, description: true, minPrice: true, stock: true, status: true },
    });
  }

  // Related posts (same category)
  let relatedPosts = [];
  if (post.categoryId) {
    relatedPosts = await prisma.blogPost.findMany({
      where: { categoryId: post.categoryId, status: 'published', id: { not: post.id } },
      select: { title: true, slug: true, readingTime: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });
  }

  // Schema.org TechArticle - more precise than generic Article for electronics content.
  // Enables rich results for technical how-to/guide queries.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.title,
    description: post.seoDesc || post.excerpt || '',
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    author: { '@type': 'Person', name: post.author || SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
    image: getBlogCoverImage(post) || `${SITE_URL}/og-image.png`,
    wordCount: (post.content || '').split(/\s+/).length,
    inLanguage: 'en',
    ...(post.category ? { articleSection: post.category.name } : {}),
    ...(post.seoKeywords ? { keywords: post.seoKeywords } : {}),
    // Speakable - tells Google Assistant which parts to read aloud
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.blog-article-meta'],
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      ...(post.category ? [{ '@type': 'ListItem', position: 3, name: post.category.name, item: `${SITE_URL}/blog?category=${post.category.slug}` }] : []),
      { '@type': 'ListItem', position: post.category ? 4 : 3, name: post.title },
    ],
  };

  const tags = (post.tags || '').split(',').map(t => t.trim()).filter(Boolean);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <article className="blog-article-page">
        <div className="container">
          {/* Breadcrumbs */}
          <nav className="blog-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/blog">Blog</Link>
            {post.category && (
              <>
                <span>/</span>
                <Link href={`/blog?category=${post.category.slug}`}>{post.category.name}</Link>
              </>
            )}
          </nav>

          <div className="blog-article-layout">
            {/* Main Content */}
            <div className="blog-article-main">
              {/* Header */}
              <header className="blog-article-header">
                {post.category && <span className="blog-article-cat">{post.category.name}</span>}
                <h1>{post.title}</h1>
                <div className="blog-article-meta">
                  <span>{post.author}</span>
                  <span>/</span>
                  <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                  <span>/</span>
                  <span>{post.readingTime || 1} min read</span>
                  <span>/</span>
                  <span>{post.viewCount?.toLocaleString()} views</span>
                </div>
              </header>

              {/* Cover Image */}
              <div className="blog-article-cover">
                {coverImage ? (
                  coverImage.endsWith('.webp') ? (
                    <picture>
                      <source srcSet={coverImage} type="image/webp" />
                      <img src={coverImage.replace(/\.webp$/, '.png')} alt={post.title} loading="eager" fetchPriority="high" />
                    </picture>
                  ) : (
                    <img src={coverImage} alt={post.title} loading="eager" fetchPriority="high" />
                  )
                ) : (
                  <div className={`blog-cover-generated blog-article-generated-cover ${coverTheme.className}`}>
                    <div className="blog-cover-generated-inner">
                      <span>{coverTheme.label}</span>
                      <strong>{coverTheme.title}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="blog-article-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />

              {/* Tags */}
              {tags.length > 0 && (
                <div className="blog-article-tags">
                  {tags.map(tag => (
                    <span key={tag} className="blog-tag">{tag}</span>
                  ))}
                </div>
              )}

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <section className="blog-related-products">
                  <h2>Related Products</h2>
                  <div className="blog-products-grid">
                    {relatedProducts.map(p => (
                      <Link href={productPath(p.partNumber, p.manufacturer)} key={p.partNumber} className="blog-product-card">
                        <div className="blog-product-pn">{p.partNumber}</div>
                        <div className="blog-product-mfr">{p.manufacturer}</div>
                        {p.description && <div className="blog-product-desc">{p.description.substring(0, 80)}</div>}
                        <div className="blog-product-bottom">
                          <span className="blog-product-price">{p.minPrice ? `$${p.minPrice.toFixed(2)}` : 'Request Quote'}</span>
                          <span className={`blog-product-stock ${hasConfirmedStock(p) ? 'instock' : 'oos'}`}>
                            {getAvailabilityText(p)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="blog-article-sidebar">
              {/* Table of Contents */}
              {toc.length > 2 && (
                <div className="blog-sidebar-card">
                  <h3>Table of Contents</h3>
                  <nav className="blog-toc">
                    {toc.map((item, i) => (
                      <a key={i} href={`#${item.id}`} className={`blog-toc-item level-${item.level}`}>
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Related Articles */}
              {relatedPosts.length > 0 && (
                <div className="blog-sidebar-card">
                  <h3>Related Articles</h3>
                  <div className="blog-related-list">
                    {relatedPosts.map(rp => (
                      <Link href={`/blog/${rp.slug}`} key={rp.slug} className="blog-related-item">
                        <span className="blog-related-title">{rp.title}</span>
                        <span className="blog-related-meta">{rp.readingTime || 1} min read</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="blog-sidebar-card blog-cta">
                <h3>Need These Components?</h3>
                <p>Get a quote for any electronic component, with no minimum order.</p>
                <Link href="/rfq" className="blog-cta-btn">Request a Quote</Link>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
