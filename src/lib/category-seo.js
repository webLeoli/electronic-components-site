/**
 * Per-category SEO copy generator.
 *
 * Inputs: a category snapshot row from scripts/categories-snapshot.json
 *   {
 *     slug, name, productCount, indexableCount,
 *     topMfrs:   [string, string, string],
 *     topParts:  [partNumber, ...],
 *     childNames:[string, ...],
 *     packageSamples: [string, ...],
 *   }
 *
 * Outputs:
 *   { seoTitle, seoDesc }
 *
 * Constraints we enforce:
 *   - seoTitle â‰?60 chars (Google SERP soft limit)
 *   - seoDesc  â‰?160 chars (Google snippet truncation)
 *   - 4 title variants Ã— 5 desc variants, picked by slug hash so two adjacent
 *     categories don't read identically
 *   - No boilerplate words ("electronic component", "best price", "free shipping")
 *   - Always names â‰? actual top manufacturers â€?turns it into unique copy
 *     rather than templated filler
 */

const SITE_NAME = 'FPGACenter';

// IMPORTANT: titles must NOT include "| FPGACenter" â€?the Next.js root layout
// applies a `%s | FPGACenter` template automatically. Adding the suffix here
// would produce "... | FPGACenter | FPGACenter" in the rendered <title>.

// ---- Manufacturer name shortening ----
// Catalogue/distributor names are often verbose. Trim suffixes and clip at
// the first comma so we can fit two brands in a 60-char title.
const MFR_ALIASES = {
  'ISSI, Integrated Silicon Solution Inc': 'ISSI',
  'Analog Devices Inc.': 'Analog Devices',
  'Analog Devices Inc./Maxim Integrated':  'Analog Devices',
  'Maxim Integrated':                      'Maxim',
  'Rochester Electronics':                 'Rochester',
  'Texas Instruments':                     'Texas Instruments',
  'Lattice Semiconductor':                 'Lattice',
  'Cypress Semiconductor':                 'Cypress',
  'Fairchild Semiconductor':               'Fairchild',
  'International Rectifier':               'Int. Rectifier',
  'Skyworks Solutions':                    'Skyworks',
  'Micron Technology Inc.':                'Micron',
  'Winbond Electronics':                   'Winbond',
  'Alliance Memory':                       'Alliance',
  'Alpha & Omega Semiconductor':           'AOS',
  'Allegro MicroSystems':                  'Allegro',
  'ON Semiconductor':                      'Onsemi',
  'STMicroelectronics':                    'ST',
  'Infineon Technologies':                 'Infineon',
  'NTE Electronics Inc.':                  'NTE',
  'Advanced Monolithic Systems':           'AMS',
  'Torex Semiconductor':                   'Torex',
};

export function shortMfr(name) {
  if (!name) return '';
  if (MFR_ALIASES[name]) return MFR_ALIASES[name];
  // Generic shortener: clip at first comma, strip common corporate suffixes.
  return name
    .split(',')[0]
    .replace(/\s+(Inc\.?|Corp\.?|Corporation|Limited|Ltd\.?|LLC|GmbH|AG|Co\.?,?\s*Ltd\.?|Technologies|Technology|Semiconductor|Semiconductors|Electronics)\s*$/i, '')
    .trim();
}

// ---- Slug hash â†?deterministic variant picker ----
// We want every category to consistently pick the same variant across reruns
// (idempotent writes) but the 141 categories spread across all variants.
function slugHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ---- Title variants (â‰?0 chars) ----
//
// Format slot rules:
//   {name}  â†?category name as-is
//   {mfr1}, {mfr2}  â†?short-form manufacturer names
//   {count} â†?product count, e.g. "24,893"
//
// Each variant is paired with a fallback in case the dynamic content overshoots.
// Titles without the "| FPGACenter" suffix â€?the root layout's metadata
// template will append it. Budget is therefore ~45 chars (60 chars target
// minus ~15 for " | FPGACenter").
const TITLE_BUDGET = 45;
const TITLE_VARIANTS = [
  ({ name, mfr1, mfr2 })          => `${name} â€?${mfr1} & ${mfr2} Sourcing`,
  ({ name, mfr1, mfr2 })          => `Buy ${name} â€?${mfr1}, ${mfr2}`,
  ({ name, mfr1 })                => `${mfr1} ${name} Sourcing`,
  ({ name, count })               => `${name} â€?${count} Part Numbers`,
];

function titleFallback(name) {
  return name;
}

export function buildSeoTitle(snapshot) {
  const name = snapshot.name;
  const variantIdx = slugHash(snapshot.slug) % TITLE_VARIANTS.length;
  const mfrs = (snapshot.topMfrs || []).map(shortMfr).filter(Boolean);
  const ctx = {
    name,
    mfr1: mfrs[0] || 'major brands',
    mfr2: mfrs[1] || 'top vendors',
    count: snapshot.productCount?.toLocaleString() || 'thousands of',
  };

  for (let offset = 0; offset < TITLE_VARIANTS.length; offset++) {
    const builder = TITLE_VARIANTS[(variantIdx + offset) % TITLE_VARIANTS.length];
    const title = builder(ctx);
    if (title.length <= TITLE_BUDGET) return title;
  }
  return titleFallback(name);
}

// ---- Description variants (target 120-160 chars) ----

const CTA_SHORT = [
  'No MOQ, IDEA-1010 inspected.',
  'No MOQ, fast global shipping.',
  'Volume pricing, no minimum order.',
  'IDEA-1010 inspected, worldwide delivery.',
  'RFQ support for verified supply.',
];

const PACKAGE_MENTION = [
  ({ pkg1, pkg2 }) => `Common packages: ${pkg1}, ${pkg2}`,
  ({ pkg1, pkg2 }) => `${pkg1} and ${pkg2} packages listed`,
  ({ pkg1 })       => `Including ${pkg1} options`,
  ({ pkg1, pkg2, pkg3 }) => `${pkg1}, ${pkg2}, ${pkg3} available`,
];

const DESC_VARIANTS = [
  ({ count, name, mfr1, mfr2, mfr3, pkgPhrase, cta }) =>
    `Browse ${count} ${name} part numbers from ${mfr1}, ${mfr2}, and ${mfr3} at ${SITE_NAME}. ${pkgPhrase}. ${cta}`,
  ({ count, name, mfr1, mfr2, pkgPhrase, cta }) =>
    `${count} ${name} part numbers from ${mfr1}, ${mfr2}, and other major brands. ${pkgPhrase}. ${cta}`,
  ({ name, mfr1, mfr2, mfr3, pkgPhrase, cta }) =>
    `Source ${name} components â€?${mfr1}, ${mfr2}, ${mfr3} listed at ${SITE_NAME}. ${pkgPhrase}. ${cta}`,
  ({ count, name, mfr1, mfr2, cta }) =>
    `Find ${name} from ${mfr1}, ${mfr2}, and additional brands. ${count} part numbers available at ${SITE_NAME}. ${cta}`,
  ({ count, name, mfr1, mfr2, mfr3, cta }) =>
    `${SITE_NAME} stocks ${count} ${name} part numbers across ${mfr1}, ${mfr2}, and ${mfr3}. ${cta}`,
];

// Build "Common packages: A, B" phrase, or empty string if no packages.
function buildPackagePhrase(snapshot, variantSeed) {
  const pkgs = (snapshot.packageSamples || []).slice(0, 3);
  if (pkgs.length === 0) return '';
  const builder = PACKAGE_MENTION[variantSeed % PACKAGE_MENTION.length];
  return builder({
    pkg1: pkgs[0] || '',
    pkg2: pkgs[1] || pkgs[0] || '',
    pkg3: pkgs[2] || pkgs[1] || pkgs[0] || '',
  });
}

export function buildSeoDesc(snapshot) {
  const name = snapshot.name;
  const mfrs = (snapshot.topMfrs || []).map(shortMfr).filter(Boolean);
  const seed = slugHash(snapshot.slug);

  const ctx = {
    name,
    count: snapshot.productCount?.toLocaleString() || 'thousands of',
    mfr1: mfrs[0] || 'leading brands',
    mfr2: mfrs[1] || 'authorized vendors',
    mfr3: mfrs[2] || 'specialty suppliers',
    pkgPhrase: buildPackagePhrase(snapshot, seed),
    cta: CTA_SHORT[seed % CTA_SHORT.length],
  };

  // Try variants until one fits â‰?60 chars.
  for (let offset = 0; offset < DESC_VARIANTS.length; offset++) {
    const builder = DESC_VARIANTS[(seed + offset) % DESC_VARIANTS.length];
    let desc = builder(ctx);
    // Some variants reference pkgPhrase but it might be empty â€?clean up
    // double-period artefacts before length-checking.
    desc = desc.replace(/\.\s*\.\s*/g, '. ').replace(/\s+/g, ' ').trim();
    if (desc.length <= 160) return desc;
  }

  // Fallback: shortest possible â€?just product count + name + cta.
  return `${ctx.count} ${name} part numbers listed at ${SITE_NAME}. ${ctx.cta}`.slice(0, 160);
}

export function buildCategorySeo(snapshot) {
  // Empty category â€?write nothing, leave seoTitle/seoDesc null so the
  // existing default copy in generateCategoryMeta() takes over.
  if (!snapshot.productCount || snapshot.productCount === 0) {
    return { seoTitle: null, seoDesc: null };
  }
  return {
    seoTitle: buildSeoTitle(snapshot),
    seoDesc:  buildSeoDesc(snapshot),
  };
}

// Exposed for tests
export const _internals = { shortMfr, slugHash, TITLE_VARIANTS, DESC_VARIANTS, CTA_SHORT, PACKAGE_MENTION };
