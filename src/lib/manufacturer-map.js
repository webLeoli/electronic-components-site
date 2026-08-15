/**
 * Compatibility shim — the brand-name authority now lives in
 * lib/manufacturer-canonical.js.
 *
 * This file used to carry its own 200-entry standardization map, but nothing on
 * the write path imported it: only two admin API routes did. So an admin who
 * typed "Micron Technology Inc." got the brand stored as "Micron" while the
 * bulk importers stored "Micron Technology Inc." verbatim — the two disagreed,
 * and the disagreement is one of the ways duplicate brands got in.
 *
 * Its old table also went further than merging duplicates: it renamed ~90
 * single-spelling brands to strip legal suffixes. Those are cosmetic renames
 * that move live product URLs, so they are not applied; they are listed with
 * product counts in docs/data-quality-audit.md for a separate decision.
 *
 * Existing callers keep working; both names now resolve through the single table.
 */
import {
  canonicalManufacturer,
  manufacturerSlug as canonicalSlug,
} from './manufacturer-canonical';

/** Canonical display name for a brand. */
export function standardizeName(name) {
  return canonicalManufacturer(name);
}

/** URL slug for a brand, canonicalizing the name first. */
export function manufacturerSlug(name) {
  return canonicalSlug(canonicalManufacturer(name));
}
