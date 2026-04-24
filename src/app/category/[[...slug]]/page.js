import prisma from '@/lib/db';
import { generateCategoryMeta, SITE_URL } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToRfqButton from '@/components/AddToRfqButton';
import CategoryIcon from '@/components/CategoryIcon';
import { ProductIcon } from '@/components/ProductImage';
import { FALLBACK_CATEGORIES } from '@/lib/fallbacks';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const categories = await prisma.category.findMany({
      select: { slug: true, parent: { select: { slug: true } } },
    });
    return categories.map((c) => ({
      slug: c.parent ? [c.parent.slug, c.slug] : [c.slug],
    }));
  } catch {
    return []; // If DB unavailable at build time, skip prerendering
  }
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page) || 1);
  const categorySlug = slug?.[slug.length - 1];
  if (!categorySlug) return {
    title: 'All Categories',
    description: 'Browse all electronic component categories at FPGACenter. ICs, semiconductors, capacitors, resistors, connectors, and more.',
    alternates: { canonical: `${SITE_URL}/category` },
    openGraph: {
      title: 'All Electronic Component Categories | FPGACenter',
      description: 'Browse ICs, semiconductors, capacitors, resistors, connectors, sensors and more at FPGACenter.',
      url: `${SITE_URL}/category`,
      siteName: 'FPGACenter',
    },
  };
  
  let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  
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
  
  // Prevent deep nested slug SEO attacks (e.g., /category/foo/bar/baz/junk)
  // Our max category depth is 2, allowing 3 as a buffer. Throw 404 otherwise.
  if (slug && slug.length > 3) notFound();

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
  let category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    include: {
      parent: true,
      children: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!category) {
    const fallback = FALLBACK_CATEGORIES.find(c => c.slug === categorySlug);
    if (fallback) {
      // Create a mock category object to prevent 404 before DB is seeded
      category = { ...fallback, id: 0, children: [] };
    } else {
      notFound();
    }
  }

  // H6: Validate slug path matches actual category hierarchy
  // Prevents /category/random-junk/integrated-circuits from being equivalent to /category/integrated-circuits
  if (slug.length === 2) {
    const expectedParentSlug = category.parent?.slug;
    if (!expectedParentSlug || slug[0] !== expectedParentSlug) notFound();
  } else if (slug.length === 1 && category.parent) {
    // Single slug used for a subcategory — still valid (direct access)
  }

  // Get all descendant category IDs for product query
  const categoryIds = [category.id];
  if (category.children.length > 0) {
    categoryIds.push(...category.children.map(c => c.id));
  }

  // Build product where clause with optional filters
  const productWhere = { categoryId: { in: categoryIds } };
  if (statusFilter && ['active', 'obsolete', 'eol', 'nrnd'].includes(statusFilter)) {
    productWhere.status = statusFilter;
  }
  if (mountFilter) {
    productWhere.mountType = { contains: mountFilter, mode: 'insensitive' };
  }

  // Count total products
  const totalProducts = await prisma.product.count({
    where: productWhere,
  });

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
    include: { category: true },
  });

  // Breadcrumb
  const breadcrumbItems = [{ name: 'Home', url: '/' }];
  if (category.parent) {
    breadcrumbItems.push({ name: category.parent.name, url: `/category/${category.parent.slug}` });
  }
  breadcrumbItems.push({ name: category.name });

  return (
    <div className="container" style={{ paddingTop: 'var(--space-lg)', paddingBottom: 'var(--space-3xl)' }}>
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
          {/* Subcategories */}
          {category.children.length > 0 && (
            <div className="filter-section">
              <h3 className="filter-title">Subcategories</h3>
              <div className="filter-list">
                {category.children.map(child => (
                  <Link key={child.slug} href={`/category/${child.slug}`} className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CategoryIcon slug={child.slug} size={20} variant="badge" />
                    <span>{child.name}</span>
                  </Link>
                ))}
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
                {category.seoDesc || `Browse ${category.name} electronic components at FPGACenter.`}
              </p>
              {page === 1 && (
                <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)', fontSize: '13px', lineHeight: 1.7, maxWidth: '700px' }}>
                  FPGACenter offers a comprehensive selection of {totalProducts.toLocaleString()} {category.name.toLowerCase()} from leading manufacturers worldwide. 
                  Whether you need active production parts, hard-to-find obsolete components, or end-of-life {category.name.toLowerCase()}, 
                  our global sourcing network ensures competitive pricing with no minimum order quantity. 
                  All {category.name.toLowerCase()} undergo quality inspection per ISO 9001:2015 standards before shipment.
                </p>
              )}
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
                            <Link href={`/product/${encodeURIComponent(product.partNumber)}`}>{product.partNumber}</Link>
                          </div>
                        </td>
                        <td>{product.manufacturer}</td>
                        <td style={{ maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.description}
                        </td>
                        <td>
                          <span className={product.stock > 0 ? 'text-success' : 'text-danger'}>
                            {product.stock > 0 ? product.stock.toLocaleString() : 'Contact'}
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

// All Categories overview page
async function AllCategoriesPage() {
  let categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  if (categories.length === 0) {
    categories = FALLBACK_CATEGORIES.map(c => ({ ...c, children: [], _count: c._count || { products: 0 } }));
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>All Categories</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2xl)', fontSize: '15px' }}>
        Browse our complete catalog of electronic components by category
      </p>

      <div className="all-categories-grid">
        {categories.map(cat => (
          <div key={cat.slug} className="card all-cat-card">
            <Link href={`/category/${cat.slug}`} className="all-cat-header">
              <span style={{ width: '42px', height: '42px' }}><CategoryIcon slug={cat.slug} size={42} variant="card" /></span>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{cat.name}</h2>
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
        ))}
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
      rel="nofollow"
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
            rel="nofollow"
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
        <Link href={buildUrl(current - 1)} className="pagination-btn" rel="nofollow">← Prev</Link>
      )}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="pagination-dots">...</span>
        ) : (
          <Link
            key={p}
            href={buildUrl(p)}
            rel="nofollow"
            className={`pagination-btn ${p === current ? 'active' : ''}`}
          >
            {p}
          </Link>
        )
      )}
      {current < total && (
        <Link href={buildUrl(current + 1)} className="pagination-btn" rel="nofollow">Next →</Link>
      )}
    </div>
  );
}
