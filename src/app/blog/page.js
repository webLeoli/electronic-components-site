import prisma from '@/lib/db';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import './blog.css';

export const metadata = {
  title: 'Technical Articles & Guides',
  description: 'Expert guides, product comparisons, and technical articles about FPGAs, MCUs, and electronic components. Stay updated with industry knowledge.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: `Technical Articles & Guides | ${SITE_NAME}`,
    description: 'Expert guides, product comparisons, and technical articles about FPGAs, MCUs, and electronic components.',
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
  },
};

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
      include: { _count: { select: { posts: { where: { status: 'published' } } } } },
      orderBy: { name: 'asc' },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Technical Articles | ${SITE_NAME}`,
    url: `${SITE_URL}/blog`,
    description: metadata.description,
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
          {/* Hero */}
          <div className="blog-hero">
            <h1>Technical Articles & Guides</h1>
            <p>Expert insights on electronic components, design tips, and product comparisons</p>
          </div>

          {/* Category Tabs */}
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

          {/* Posts Grid */}
          {posts.length === 0 ? (
            <div className="blog-empty">
              <span style={{ fontSize: 48 }}>✍️</span>
              <h2>No articles yet</h2>
              <p>Check back soon for technical guides and product insights.</p>
            </div>
          ) : (
            <div className="blog-grid">
              {posts.map(post => (
                <Link href={`/blog/${post.slug}`} key={post.id} className="blog-card">
                  {post.coverImage && (
                    <div className="blog-card-cover" style={{ backgroundImage: `url(${post.coverImage})` }} />
                  )}
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
                      <span>·</span>
                      <span>{post.readingTime || 1} min read</span>
                      <span>·</span>
                      <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="blog-pagination">
              {page > 1 && <Link href={`/blog?page=${page - 1}${categorySlug ? `&category=${categorySlug}` : ''}`} className="blog-page-btn">← Previous</Link>}
              <span className="blog-page-info">Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={`/blog?page=${page + 1}${categorySlug ? `&category=${categorySlug}` : ''}`} className="blog-page-btn">Next →</Link>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
