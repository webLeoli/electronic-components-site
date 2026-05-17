import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/db';
import { generateCategoryMeta, productPath, SITE_URL, SITE_NAME, hasConfirmedStock, getAvailabilityText } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToRfqButton from '@/components/AddToRfqButton';
import CategoryIcon from '@/components/CategoryIcon';
import { ProductIcon } from '@/components/ProductImage';
import { FALLBACK_CATEGORIES } from '@/lib/fallbacks';

export const revalidate = 3600;

// ----------------------------------------------------------------------------
// Category fetch: 2026-05-17 rewrite
//
// The previous implementation used a single `prisma.category.findUnique` with
// nested `include` + `_count` over children + grandchildren. On large L1s
// (embedded with 15 descendants) this produced ~12 seconds of database work
// because Prisma issued a separate SQL per `_count` and the nested LATERALs
// got expensive.
//
// New approach: one recursive CTE pulls every descendant + its direct product
// count in a single round trip (≤500ms even on the worst L1). We then rebuild
// the same tree shape the renderer already expects (`category.children[].children[]`
// with `_count.products`), so the rest of page.js is unchanged.
// ----------------------------------------------------------------------------
async function fetchCategoryTreeRaw(categorySlug) {
  const root = await prisma.category.findUnique({
    where: { slug: categorySlug },
    include: { parent: { include: { parent: true } } },
  });
  if (!root) return null;

  const rows = await prisma.$queryRawUnsafe(
    `
    WITH RECURSIVE cat_tree AS (
      SELECT id, name, slug, "parentId", "sortOrder", icon, "seoTitle", "seoDesc", 1 AS depth
      FROM "Category"
      WHERE "parentId" = $1
      UNION ALL
      SELECT c.id, c.name, c.slug, c."parentId", c."sortOrder", c.icon, c."seoTitle", c."seoDesc", t.depth + 1
      FROM "Category" c
      INNER JOIN cat_tree t ON c."parentId" = t.id
      WHERE t.depth < 3
    )
    SELECT t.id, t.name, t.slug, t."parentId", t."sortOrder", t.icon, t.depth,
           COALESCE(p.cnt, 0)::int AS direct_product_count
    FROM cat_tree t
    LEFT JOIN (
      SELECT "categoryId", COUNT(*)::int AS cnt
      FROM "Product"
      WHERE "categoryId" IN (SELECT id FROM cat_tree)
      GROUP BY "categoryId"
    ) p ON p."categoryId" = t.id
    ORDER BY t.depth, t."sortOrder" NULLS LAST, t.name
    `,
    root.id,
  );

  // Group rows by parentId so we can attach children to their parent.
  const byParent = new Map();
  for (const r of rows) {
    const parentKey = r.parentId;
    if (!byParent.has(parentKey)) byParent.set(parentKey, []);
    byParent.get(parentKey).push({
      id: r.id,
      name: r.name,
      slug: r.slug,
      parentId: r.parentId,
      sortOrder: r.sortOrder,
      icon: r.icon,
      _count: { products: r.direct_product_count },
      children: [], // filled below
    });
  }

  // Attach grandchildren onto each L2 child.
  const attachChildrenOf = (catId) => {
    const direct = byParent.get(catId) || [];
    for (const c of direct) {
      c.children = byParent.get(c.id) || [];
    }
    return direct;
  };

  root.children = attachChildrenOf(root.id);
  return root;
}

// Cross-request cache (5min) so cold-start cost is amortised over many users.
// Tag with the slug so we can invalidate a single category if its tree changes.
const fetchCategoryCached = (categorySlug) => unstable_cache(
  () => fetchCategoryTreeRaw(categorySlug),
  ['category-tree', categorySlug],
  { revalidate: 300, tags: ['category-tree', `category-tree:${categorySlug}`] },
)();

// React cache() so generateMetadata + Page in the same request share one fetch.
const getCategory = cache(fetchCategoryCached);

// Same cached treatment for the product count, which alone was 5.5s on
// embedded's 155K-row IN-list. The categoryIds list and filters are part of
// the cache key.
const getProductCountCached = (key, where) => unstable_cache(
  () => prisma.product.count({ where }),
  ['category-product-count', key],
  { revalidate: 300, tags: ['category-product-count', `category-product-count:${key}`] },
)();

export async function generateStaticParams() {
  try {
    // Flat URL strategy: every category is /category/[slug]
    const categories = await prisma.category.findMany({ select: { slug: true } });
    return categories.map((c) => ({ slug: [c.slug] }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page) || 1);
  const categorySlug = slug?.[slug.length - 1];
  if (!categorySlug) return {
    title: 'All Categories',
    description: `Browse all electronic component categories at ${SITE_NAME}. ICs, semiconductors, capacitors, resistors, connectors, and more.`,
    alternates: { canonical: `${SITE_URL}/category` },
    openGraph: {
      title: `All Electronic Component Categories | ${SITE_NAME}`,
      description: `Browse ICs, semiconductors, capacitors, resistors, connectors, sensors and more at ${SITE_NAME}.`,
      url: `${SITE_URL}/category`,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} Categories` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `All Electronic Component Categories | ${SITE_NAME}`,
      description: 'Browse ICs, semiconductors, capacitors, resistors, connectors, sensors and more.',
      images: [`${SITE_URL}/og-image.png`],
    },
  };
  
  let category = await prisma.category.findUnique({ where: { slug: categorySlug }, select: { slug: true, name: true, seoTitle: true, seoDesc: true } });
  
  if (!category) {
    const fallback = FALLBACK_CATEGORIES.find(c => c.slug === categorySlug);
    if (fallback) category = fallback;
    else return { title: 'Category Not Found' };
  }

  return generateCategoryMeta(category, { page });
}

// Pagination config
const ITEMS_PER_PAGE = 20;
const MAX_PAGES = 100; // Limit deep pagination to protect database

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  
  // Flat URL strategy: all categories at /category/[slug]
  // Reject any multi-segment URLs to enforce flat structure
  if (slug && slug.length > 1) notFound();

  const sp = await searchParams;
  // Enforce page bounds: 1 <= page <= MAX_PAGES
  const page = Math.max(1, Math.min(parseInt(sp?.page) || 1, MAX_PAGES));
  const sort = sp?.sort || 'partNumber';
  const order = sp?.order || 'asc';
  const statusFilter = sp?.status || '';
  const mountFilter = sp?.mount || '';

  // If no slug, show all categories
  if (!slug || slug.length === 0) {
    return <AllCategoriesPage />;
  }

  const categorySlug = slug[slug.length - 1];
  let category = await getCategory(categorySlug);

  if (!category) {
    const fallback = FALLBACK_CATEGORIES.find(c => c.slug === categorySlug);
    if (fallback) {
      // Create a mock category object to prevent 404 before DB is seeded
      category = { ...fallback, id: 0, children: [] };
    } else {
      notFound();
    }
  }

  // Flat URL — no hierarchy validation needed, slug uniqueness is enforced by DB

  // Get all descendant category IDs for product query
  // Collect all descendant IDs (L2 children + L3 grandchildren)
  const categoryIds = [category.id];
  if (category.children.length > 0) {
    for (const child of category.children) {
      categoryIds.push(child.id);
      // Also include grandchildren for L1 pages
      if (child.children) {
        categoryIds.push(...child.children.map(gc => gc.id));
      }
    }
  }

  // Build product where clause with optional filters
  const productWhere = { categoryId: { in: categoryIds } };
  if (statusFilter && ['active', 'obsolete', 'eol', 'nrnd'].includes(statusFilter)) {
    productWhere.status = statusFilter;
  }
  if (mountFilter) {
    productWhere.mountType = { contains: mountFilter, mode: 'insensitive' };
  }

  // Count total products. Cached for 5min — the count is the slowest single
  // query on large L1s (≥5s on embedded), and being off by a few rows during
  // the cache window has no visible effect (pagination math rounds anyway).
  const countCacheKey = JSON.stringify({
    ids: categoryIds.slice().sort(),
    status: statusFilter || null,
    mount:  mountFilter  || null,
  });
  const totalProducts = await getProductCountCached(countCacheKey, productWhere);

  // Cap total pages to prevent deep pagination queries
  const totalPages = Math.min(Math.ceil(totalProducts / ITEMS_PER_PAGE), MAX_PAGES);

  // Build sort object
  const orderBy = {};
  const validSorts = ['partNumber', 'manufacturer', 'minPrice', 'stock', 'status'];
  orderBy[validSorts.includes(sort) ? sort : 'partNumber'] = order === 'desc' ? 'desc' : 'asc';

  // Fetch products
  const products = await prisma.product.findMany({
    where: productWhere,
    orderBy,
    skip: (page - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: { category: { select: { slug: true, name: true } } },
  });

  // Breadcrumb — flat URLs, hierarchy expressed via breadcrumb trail
  const breadcrumbItems = [{ name: 'Home', url: '/' }, { name: 'Categories', url: '/category' }];
  if (category.parent?.parent) {
    breadcrumbItems.push({ name: category.parent.parent.name, url: `/category/${category.parent.parent.slug}` });
    breadcrumbItems.push({ name: category.parent.name, url: `/category/${category.parent.slug}` });
  } else if (category.parent) {
    breadcrumbItems.push({ name: category.parent.name, url: `/category/${category.parent.slug}` });
  }
  breadcrumbItems.push({ name: category.name });

  // JSON-LD BreadcrumbList for Google
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: `${SITE_URL}${item.url}` } : {}),
    })),
  };

  // JSON-LD ItemList for category products
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name,
    description: category.seoDesc || `${category.name} electronic components`,
    numberOfItems: totalProducts,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.partNumber,
      url: `${SITE_URL}${productPath(p.partNumber, p.manufacturer)}`,
    })),
  };

  // JSON-LD CollectionPage — tells Google this is a curated product listing
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.seoTitle || `${category.name} - Electronic Components`,
    description: category.seoDesc || `Browse ${category.name} electronic components at ${SITE_NAME}`,
    url: `${SITE_URL}/category/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalProducts,
    },
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-lg)', paddingBottom: 'var(--space-3xl)' }}>
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />

      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        {breadcrumbItems.map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            {i > 0 && <span className="separator">›</span>}
            {item.url && i < breadcrumbItems.length -1 ? <Link href={item.url}>{item.name}</Link> : <span style={{ color: 'var(--color-text-primary)' }}>{item.name}</span>}
          </span>
        ))}
      </nav>

      <div className="category-page-layout">
        {/* Sidebar */}
        <aside className="category-sidebar">
          {/* Subcategories — flat URL links */}
          {category.children.length > 0 && (
            <div className="filter-section">
              <h3 className="filter-title">Subcategories</h3>
              <div className="filter-list">
                {category.children.map(child => {
                  // Recursive sum: L2 count = direct products + all L3 children products
                  const totalProducts = (child._count?.products || 0)
                    + (child.children || []).reduce((sum, gc) => sum + (gc._count?.products || 0), 0);
                  return (
                  <Link key={child.slug} href={`/category/${child.slug}`} className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CategoryIcon slug={child.slug} size={20} variant="badge" />
                      <span>{child.name}</span>
                    </span>
                    {totalProducts > 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                        {totalProducts.toLocaleString()}
                      </span>
                    )}
                  </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Parent / Sibling nav */}
          {category.parent && (
            <div className="filter-section">
              <h3 className="filter-title">
                <Link href={`/category/${category.parent.slug}`} style={{ color: 'inherit' }}>
                  ← {category.parent.name}
                </Link>
              </h3>
            </div>
          )}

          {/* Quick Filters — preserve sort/order when applying filters */}
          <div className="filter-section">
            <h3 className="filter-title">Lifecycle Status</h3>
            <div className="filter-list">
              {['active', 'obsolete', 'eol'].map(s => {
                const params = new URLSearchParams({ status: s });
                if (mountFilter) params.set('mount', mountFilter);
                if (sort !== 'partNumber') params.set('sort', sort);
                if (order !== 'asc') params.set('order', order);
                const labels = { active: 'Active', obsolete: 'Obsolete', eol: 'End of Life' };
                const badgeCls = { active: 'badge-success', obsolete: 'badge-danger', eol: 'badge-warning' };
                return (
                  <Link key={s} href={`/category/${categorySlug}?${params}`} rel="nofollow" className={`filter-item ${statusFilter === s ? 'active' : ''}`}>
                    <span className={`badge ${badgeCls[s]}`} style={{ marginRight: '6px' }}>●</span> {labels[s]}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Mount Type</h3>
            <div className="filter-list">
              {['SMD', 'THT'].map(m => {
                const params = new URLSearchParams({ mount: m });
                if (statusFilter) params.set('status', statusFilter);
                if (sort !== 'partNumber') params.set('sort', sort);
                if (order !== 'asc') params.set('order', order);
                return (
                  <Link key={m} href={`/category/${categorySlug}?${params}`} rel="nofollow" className={`filter-item ${mountFilter === m ? 'active' : ''}`}>
                    {m === 'SMD' ? 'SMD' : 'Through-Hole'}
                  </Link>
                );
              })}
            </div>
          </div>

          {(statusFilter || mountFilter) && (
            <div className="filter-section">
              <Link href={`/category/${categorySlug}`} className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center' }}>
                ✕ Clear All Filters
              </Link>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="category-main">
          <div className="category-header-area">
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CategoryIcon slug={categorySlug} size={40} variant="card" />
                {category.name}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: '4px', fontSize: '14px' }}>
                {category.seoDesc || `Browse ${category.name} electronic components at ${SITE_NAME}.`}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {totalProducts.toLocaleString()} products found
              </span>
              <SortDropdown current={sort} order={order} slug={categorySlug} statusFilter={statusFilter} mountFilter={mountFilter} />
            </div>
          </div>

          {/* Products Table */}
          {products.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table className="table" id="category-products-table">
                  <thead>
                    <tr>
                      <th><SortLink field="partNumber" current={sort} order={order} slug={categorySlug} statusFilter={statusFilter} mountFilter={mountFilter}>Part Number</SortLink></th>
                      <th><SortLink field="manufacturer" current={sort} order={order} slug={categorySlug} statusFilter={statusFilter} mountFilter={mountFilter}>Manufacturer</SortLink></th>
                      <th>Description</th>
                      <th><SortLink field="stock" current={sort} order={order} slug={categorySlug} statusFilter={statusFilter} mountFilter={mountFilter}>Stock</SortLink></th>
                      <th><SortLink field="minPrice" current={sort} order={order} slug={categorySlug} statusFilter={statusFilter} mountFilter={mountFilter}>Price</SortLink></th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.partNumber}>
                        <td className="part-number">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ProductIcon product={product} size={28} />
                            <Link href={productPath(product.partNumber, product.manufacturer)}>{product.partNumber}</Link>
                          </div>
                        </td>
                        <td>{product.manufacturer}</td>
                        <td style={{ maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.description}
                        </td>
                        <td>
                          <span className={hasConfirmedStock(product) ? 'text-success' : 'text-muted'}>
                            {getAvailabilityText(product)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {product.minPrice > 0 ? `$${product.minPrice.toFixed(product.minPrice < 1 ? 4 : 2)}` : 'RFQ'}
                        </td>
                        <td>
                          <span className={`badge ${
                            product.status === 'active' ? 'badge-success' :
                            product.status === 'obsolete' ? 'badge-danger' :
                            product.status === 'eol' ? 'badge-warning' : 'badge-info'
                          }`}>
                            {product.status === 'nrnd' ? 'NRND' : product.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <AddToRfqButton
                            partNumber={product.partNumber}
                            manufacturer={product.manufacturer}
                            variant="small"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination current={page} total={totalPages} slug={categorySlug} sort={sort} order={order} statusFilter={statusFilter} mountFilter={mountFilter} />
              )}
            </>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>📦</div>
              <h3>No products found</h3>
              <p>No products in this category yet. Submit an RFQ and we&apos;ll source it for you.</p>
              <Link href="/rfq" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Submit RFQ</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// All Categories overview page — 3-level tree
async function AllCategoriesPage() {
  let categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { products: true } },
          children: {
            orderBy: { sortOrder: 'asc' },
            include: { _count: { select: { products: true } } },
          },
        },
      },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  if (categories.length === 0) {
    categories = FALLBACK_CATEGORIES.map(c => ({ ...c, children: [], _count: c._count || { products: 0 } }));
  }

  // Calculate total products per L1 (sum of all descendants)
  const getTotalProducts = (cat) => {
    let total = cat._count?.products || 0;
    if (cat.children) {
      for (const child of cat.children) {
        total += getTotalProducts(child);
      }
    }
    return total;
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>All Categories</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2xl)', fontSize: '15px' }}>
        Browse our complete catalog of integrated circuits and electronic components
      </p>

      <div className="all-categories-grid">
        {categories.map(cat => {
          const totalProducts = getTotalProducts(cat);
          return (
            <div key={cat.slug} className="card all-cat-card">
              <Link href={`/category/${cat.slug}`} className="all-cat-header">
                <span style={{ width: '42px', height: '42px' }}><CategoryIcon slug={cat.slug} size={42} variant="card" /></span>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{cat.name}</h2>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{totalProducts.toLocaleString()} products</span>
                </div>
              </Link>
              {cat.children.length > 0 && (
                <div className="all-cat-children">
                  {cat.children.map(child => (
                    <Link key={child.slug} href={`/category/${child.slug}`} className="all-cat-child-link">
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Sort link component — preserves active filters
function SortLink({ field, current, order, slug, statusFilter, mountFilter, children }) {
  const nextOrder = current === field && order === 'asc' ? 'desc' : 'asc';
  const arrow = current === field ? (order === 'asc' ? ' ↑' : ' ↓') : '';
  const params = new URLSearchParams({ sort: field, order: nextOrder });
  if (statusFilter) params.set('status', statusFilter);
  if (mountFilter) params.set('mount', mountFilter);
  return (
    <Link
      href={`/category/${slug}?${params}`}
           style={{ color: current === field ? 'var(--color-accent)' : 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
    >
      {children}{arrow}
    </Link>
  );
}

// Sort dropdown — preserves active filters
function SortDropdown({ current, order, slug, statusFilter, mountFilter }) {
  const options = [
    { value: 'partNumber', label: 'Part Number' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'minPrice', label: 'Price' },
    { value: 'stock', label: 'Stock' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Sort:</span>
      {options.map(opt => {
        const nextOrder = current === opt.value && order === 'asc' ? 'desc' : 'asc';
        const params = new URLSearchParams({ sort: opt.value, order: nextOrder });
        if (statusFilter) params.set('status', statusFilter);
        if (mountFilter) params.set('mount', mountFilter);
        return (
          <Link
            key={opt.value}
            href={`/category/${slug}?${params}`}
                       className={`btn btn-sm ${current === opt.value ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '11px' }}
          >
            {opt.label} {current === opt.value ? (order === 'asc' ? '↑' : '↓') : ''}
          </Link>
        );
      })}
    </div>
  );
}

// Pagination component — preserves sort and filter params
function Pagination({ current, total, slug, sort, order, statusFilter, mountFilter }) {
  const pages = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);

  if (start > 1) pages.push(1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('...');
  if (end < total) pages.push(total);

  const buildUrl = (p) => {
    const params = new URLSearchParams({ page: p, sort, order });
    if (statusFilter) params.set('status', statusFilter);
    if (mountFilter) params.set('mount', mountFilter);
    return `/category/${slug}?${params}`;
  };

  return (
    <div className="pagination">
      {current > 1 && (
        <Link href={buildUrl(current - 1)} className="pagination-btn">← Prev</Link>
      )}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="pagination-dots">...</span>
        ) : (
          <Link
            key={p}
            href={buildUrl(p)}
                       className={`pagination-btn ${p === current ? 'active' : ''}`}
          >
            {p}
          </Link>
        )
      )}
      {current < total && (
        <Link href={buildUrl(current + 1)} className="pagination-btn">Next →</Link>
      )}
    </div>
  );
}
