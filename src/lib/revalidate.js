import { revalidatePath } from 'next/cache';
import { productPath } from '@/lib/seo';

/**
 * On-demand ISR revalidation helpers.
 *
 * The public pages are ISR-cached (revalidate=3600), so without these calls an
 * admin edit wouldn't show on the frontend for up to an hour. Each admin
 * mutation calls the matching helper so the affected public pages refresh
 * immediately.
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
