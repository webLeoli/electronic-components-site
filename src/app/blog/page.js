import prisma from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import { getBlogCoverImage, getBlogCoverTheme } from '@/lib/blog-cover';
import './blog.css';

export const revalidate = 3600;

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page) || 1);

  // Category filters canonicalize to /blog (faceted views of the same
  // collection), but paginated pages self-canonicalize: pointing page 2+ at
  // page 1 tells Google they are duplicates and buries every post beyond the
  // first page.
  const canonicalUrl = page > 1 ? `${SITE_URL}/blog?page=${page}` : `${SITE_URL}/blog`;
  const title = page > 1 ? `Technical Articles & Guides - Page ${page}` : 'Technical Articles & Guides';

  return {
    title,
    description: 'Expert guides, product comparisons, and technical articles about FPGAs, MCUs, and electronic components. Stay updated with industry knowledge.',
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description: 'Expert guides, product comparisons, and technical articles about FPGAs, MCUs, and electronic components.',
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} Blog` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description: 'Expert guides, product comparisons, and technical articles about FPGAs, MCUs, and electronic components.',
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

export default async function BlogPage({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page) || 1);
  const categorySlug = sp?.category || '';
  const limit = 12;

  const where = { status: 'published' };
  if (categorySlug) {
    const cat = await prisma.blogCategory.findUnique({ where: { slug: categorySlug } });
    if (cat) where.categoryId = cat.id;
  }

  const [posts, total, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
    prisma.blogCategory.findMany({
      select: { id: true, name: true, slug: true, _count: { select: { posts: { where: { status: 'published' } } } } },
      orderBy: { name: 'asc' },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // A page past the end must 404, not render an indexable empty state.
  if (page > 1 && posts.length === 0) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Technical Articles | ${SITE_NAME}`,
    url: `${SITE_URL}/blog`,
    description: 'Expert guides, product comparisons, and technical articles about FPGAs, MCUs, and electronic components.',
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Technical Articles' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="blog-page">
        <div className="container">
          <div className="blog-hero">
            <span className="blog-hero-kicker">FPGACenter Knowledge Base</span>
            <h1>Technical Articles & Guides</h1>
            <p>Lifecycle, FPGA/CPLD sourcing, quality inspection, and procurement guides for hard-to-find components.</p>
          </div>

          {categories.length > 0 && (
            <div className="blog-category-tabs">
              <Link href="/blog" className={`blog-cat-tab ${!categorySlug ? 'active' : ''}`}>All</Link>
              {categories.filter(c => c._count.posts > 0).map(c => (
                <Link key={c.id} href={`/blog?category=${c.slug}`} className={`blog-cat-tab ${categorySlug === c.slug ? 'active' : ''}`}>
                  {c.name} <span className="blog-cat-count">({c._count.posts})</span>
                </Link>
              ))}
            </div>
          )}

          {posts.length === 0 ? (
            <div className="blog-empty">
              <span className="blog-empty-mark">No posts</span>
              <h2>No articles yet</h2>
              <p>Check back soon for technical guides and product insights.</p>
            </div>
          ) : (
            <div className="blog-grid">
              {posts.map(post => {
                const coverImage = getBlogCoverImage(post);
                const coverTheme = getBlogCoverTheme(post);

                return (
                  <Link href={`/blog/${post.slug}`} key={post.id} className="blog-card">
                    <div
                      className={`blog-card-cover ${coverImage ? 'has-image' : `blog-cover-generated ${coverTheme.className}`}`}
                      style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}
                    >
                      {!coverImage && (
                        <div className="blog-cover-generated-inner">
                          <span>{coverTheme.label}</span>
                          <strong>{coverTheme.title}</strong>
                        </div>
                      )}
                    </div>
                    <div className="blog-card-body">
                      {post.category && (
                        <span className="blog-card-cat">{post.category.name}</span>
                      )}
                      <h2 className="blog-card-title">{post.title}</h2>
                      {post.excerpt && (
                        <p className="blog-card-excerpt">{post.excerpt}</p>
                      )}
                      <div className="blog-card-meta">
                        <span>{post.author}</span>
                        <span aria-hidden="true">/</span>
                        <span>{post.readingTime || 1} min read</span>
                        <span aria-hidden="true">/</span>
                        <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="blog-pagination">
              {page > 1 && (
                <Link
                  href={page - 1 === 1
                    ? (categorySlug ? `/blog?category=${categorySlug}` : '/blog')
                    : `/blog?page=${page - 1}${categorySlug ? `&category=${categorySlug}` : ''}`}
                  className="blog-page-btn"
                >
                  Previous
                </Link>
              )}
              <span className="blog-page-info">Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={`/blog?page=${page + 1}${categorySlug ? `&category=${categorySlug}` : ''}`} className="blog-page-btn">Next</Link>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
