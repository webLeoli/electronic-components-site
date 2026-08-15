import { revalidatePath, revalidateTag } from 'next/cache';
import { productPath } from '@/lib/seo';

/**
 * Every tag attached to an unstable_cache() entry in the app.
 *
 * These tags were being declared and never used: nothing in the codebase called
 * revalidateTag, so the only way a cached aggregate refreshed was its timer.
 * That forced the timers to stay short — the category tree and its per-child
 * product counts sat at 300s — and a crawler landing on an expired entry pays
 * the full cost: /category/embedded takes 5.5s cold against 61ms warm, because
 * the tree query with counts is ~0.9-2.5s and the total count another ~0.9s.
 *
 * With deliberate purging available, those timers can be long and the expensive
 * work happens on import instead of on a visitor's request.
 */
const DATA_CACHE_TAGS = [
  'category-tree',
  'category-product-count',
  'categories',
  'manufacturers',
  'homepage',
  'homepage-products',
  'sitemap',
  'fpga-sourcing',
  'robotics-sourcing',
];

/**
 * Purge the cached aggregates. Call after any bulk data change — imports,
 * merges, rescoring — or the site serves the previous catalogue's numbers until
 * each timer happens to expire.
 */
export function revalidateDataCaches(tags = DATA_CACHE_TAGS) {
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch (e) {
      console.error('[revalidate] tag failed for', tag, e?.message);
    }
  }
  return tags;
}

export { DATA_CACHE_TAGS };

/**
 * On-demand ISR revalidation helpers.
 *
 * Most public listing/content pages use ISR. Product detail pages are dynamic
 * to prevent unbounded per-SKU disk artifacts, but keeping the same targeted
 * calls makes mutations safe if route caching changes later.
 *
 * Revalidation is best-effort: a failure here must never break the mutation's
 * response, so every call is wrapped.
 */
function safe(path, type) {
  try {
    revalidatePath(path, type);
  } catch (e) {
    console.error('[revalidate] failed for', path, e?.message);
  }
}

// A single product changed (create/update/delete).
export function revalidateProduct(partNumber, manufacturer) {
  if (partNumber) safe(productPath(partNumber, manufacturer));
  safe('/'); // home surfaces featured products
}

// A manufacturer changed, or a product's manufacturer page listing changed.
export function revalidateManufacturer(slug) {
  if (slug) safe(`/manufacturer/${slug}`);
  safe('/manufacturers');
  safe('/');
}

// A category changed.
export function revalidateCategory(slug) {
  if (slug) safe(`/category/${slug}`);
  safe('/category');
  safe('/');
}

// A blog post changed (publish/edit/delete).
export function revalidateBlog(slug) {
  if (slug) safe(`/blog/${slug}`);
  safe('/blog');
  safe('/');
}

// A bulk operation touched many products (e.g. quality/indexable recompute).
// Revalidates the whole product route segment rather than thousands of paths.
export function revalidateAllProducts() {
  safe('/product/[manufacturer]/[partNumber]', 'page');
  safe('/');
}
