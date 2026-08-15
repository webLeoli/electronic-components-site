/**
 * Product Quality Scoring Engine
 *
 * Computes a 0-100 quality score for product pages to determine indexing
 * eligibility. The score is used to:
 *   1. Control which products appear in the sitemap
 *   2. Set meta robots (index/noindex) on product pages
 *   3. Prioritize crawl budget on high-quality pages
 *
 * Scoring Dimensions (total: 100 points):
 *   - Specs Richness:      40 points
 *   - Pricing Data:        18 points
 *   - Datasheet:           15 points
 *   - Lifecycle Status:    12 points
 *   - Image:               10 points
 *   - Description Quality:  5 points
 *
 * --- 2026-08-02 reweighting -------------------------------------------------
 * The original split (description 30 / specs 25 / pricing 15 / datasheet 10 /
 * image 10 / lifecycle 10) could not separate one page from another. Measured
 * against the live 719,342-row catalogue:
 *
 *   - description: every single row begins "The ", 98.7% match the generated
 *     "The <part> is a/an …" template, and the length is ~650 characters no
 *     matter what — 645-682 average across every spec-count bucket from 11 to
 *     25 keys. It scored min 23 / median 29 / max 29 out of 30. Thirty percent
 *     of the scale was measuring a fixed-length template.
 *   - specs: real spread exists (5-28 keys, median ~21) but the old curve
 *     topped out at 15 keys, so the median row already sat at the ceiling.
 *   - datasheet: 383 of 719,342 rows have one (0.05%).
 *   - image: 0 of 719,342 rows have one.
 *
 * So 20 points were unreachable, 30 were constant, and the achievable maximum
 * was 80 — which is why a "Gold ≥ 70" gate admitted 76% of the catalogue with
 * 546,939 rows crammed into the single 70-80 band.
 *
 * The weights below move the mass onto the dimensions that actually vary, and
 * stretch the specs curve across its real range. Datasheet and image keep real
 * weight because they are the strongest available differentiators the moment
 * that data exists (see docs/image-asset-management-plan.md).
 *
 * NOTE: changing these weights changes every stored qualityScore the next time
 * scripts/compute-quality-scores.mjs runs, and therefore which products are
 * indexable. Re-run it with --dry-run first and review the histogram.
 */

// Package-family image resolution. The .js extension is required, not optional:
// scripts/*.mjs import this file through plain node, which does not resolve
// extensionless specifiers the way the Next bundler does.
import { getProductRepresentativeImage } from './product-image-resolver.js';

// Indexing cut-off, calibrated against the distribution this file produces.
// Lives here so the app (lib/indexing-policy.js) and the batch scorer
// (scripts/compute-quality-scores.mjs) cannot drift apart — they previously
// disagreed, at 70 and a hardcoded 45 respectively. See indexing-policy.js for
// the rationale and the alternative cut points.
// Re-tuned twice on 2026-08-15, once per scoring change. Both times the goal was
// the same: keep the indexed SET roughly the size it was, and let the changed
// dimension decide WHICH pages are in it.
//
//   50 → 44  after scoreSpecs stopped paying for "-" placeholder slots (every
//            score moved down by the number of blanks the feed padded):
//              44 | kept 506,663 | dropped 40,468 (79% thin) | added 37,613 (0% thin)
//              47 | kept 490,488 | dropped 56,643 (67% thin) | added 25,832 (0% thin)
//              50 | kept 460,101 | dropped 87,030 (44% thin) | added 13,454 (0% thin)
//            44 was where what left was overwhelmingly padded-spec junk and what
//            entered all had real specifications.
//
//   44 → 48  after scoreImage started scoring the package-family image the page
//            actually renders instead of the always-null imageUrl column (84% of
//            rows gained 2-6 points):
//              44 | 580,300 indexable | added 36,883 (22% thin)
//              48 | 544,422 indexable | dropped 6,244 (4% thin) | added 7,249 (11% thin)
//              50 | 530,741 indexable | dropped 12,687 (3% thin)
//            48 holds the set within ~1K of its previous size (543,417).
//
// Raise it to tighten: ≥50 ≈ 531K, ≥52 ≈ 505K, ≥54 ≈ 483K, ≥56 ≈ 453K.
const DEFAULT_INDEX_THRESHOLD = 48;

// --- Quality Tier Definitions ---

// Silver's floor tracks DEFAULT_INDEX_THRESHOLD on purpose: the admin dashboard
// and the live indexing gate must not tell two different stories. Before
// 2026-08-15 it read "Silver ≥ 50" beside an actual cut of 44, so a page could be
// labelled Bronze and still be in the index.
//
// Gold moved 65 → 70 in the same pass. Measured on the stored scores afterwards:
// ≥70 is 131,393 pages (18.3%), ≥68 is 26.6%, ≥65 is 36.8%. A "Gold" band holding
// a third of the catalogue is not a label anyone can act on; 70 keeps it to the
// genuinely complete pages. Current split: Gold 18%, Silver (48-69) 57%,
// Bronze (30-47) 20%, Noindex 4%.
const TIERS = {
  gold:    { min: 70, label: 'Gold',    color: '#22c55e', emoji: '🥇' },
  silver:  { min: DEFAULT_INDEX_THRESHOLD, label: 'Silver', color: '#3b82f6', emoji: '🥈' },
  bronze:  { min: 30, label: 'Bronze',  color: '#eab308', emoji: '🥉' },
  noindex: { min: 0,  label: 'Noindex', color: '#ef4444', emoji: '⛔' },
};

/**
 * Determine the quality tier from a numeric score.
 */
function getQualityTier(score) {
  if (score >= TIERS.gold.min)   return 'gold';
  if (score >= TIERS.silver.min) return 'silver';
  if (score >= TIERS.bronze.min) return 'bronze';
  return 'noindex';
}

/**
 * Get tier metadata (label, color, emoji, min score).
 */
function getTierInfo(tier) {
  return TIERS[tier] || TIERS.noindex;
}

// --- Scoring Functions ---

// The bulk-generated description shape: "The <part> is a/an <category>
// manufactured by <mfr>. …". 98.7% of the catalogue matches it, and matching
// rows are ~650 characters regardless of how much real data backs them, so
// length/keyword heuristics cannot tell them apart.
const GENERATED_DESCRIPTION_RE = /^The \S+ is an? /;

function isGeneratedDescription(description) {
  return GENERATED_DESCRIPTION_RE.test(String(description || '').trim());
}

/**
 * Score the product description quality (0-5).
 *
 * Deliberately small. A template that every product shares carries no ranking
 * signal, so it earns a floor score; the remaining points are reserved for
 * genuinely hand-written or otherwise distinct copy, which is what this
 * dimension is meant to reward if the catalogue ever gains it.
 */
function scoreDescription(description) {
  if (!description || typeof description !== 'string') return { total: 0, length: 0, diversity: 0, keywords: 0 };

  const desc = description.trim();
  const len = desc.length;

  if (isGeneratedDescription(desc)) {
    // Floor credit: the text exists and is substantive, it just isn't unique.
    return { total: len > 200 ? 2 : 1, length: 0, diversity: 0, keywords: 0, generated: true };
  }

  // --- Length score (0-12) ---
  let length = 0;
  if (len > 300) length = 12;
  else if (len > 200) length = 10;
  else if (len > 150) length = 8;
  else if (len > 100) length = 6;
  else if (len > 60) length = 4;
  else if (len > 30) length = 2;
  // <= 30: 0 points

  // --- Pattern diversity (0-10) ---
  // Detect if description is likely auto-generated from a template
  let diversity = 5; // baseline

  // Penalty: starts with the part number (very common in auto-generated)
  const templatePatterns = [
    /^[A-Z0-9][\w-]+ is a /i,           // "XC7A35T is a ..." — common but acceptable
    /^IC /i,                              // Starts with "IC " — very short/generic
    /^[A-Z]{2,4}\s/,                      // Starts with 2-4 letter abbreviation
  ];
  // Apply template pattern penalties
  const templateMatches = templatePatterns.filter(p => p.test(desc)).length;
  diversity -= templateMatches * 2;
  // Bonus: has multiple sentences
  const sentenceCount = (desc.match(/[.!?]+/g) || []).length;
  if (sentenceCount >= 4) diversity += 3;
  else if (sentenceCount >= 2) diversity += 2;
  else if (sentenceCount >= 1) diversity += 1;

  // Penalty: very short word count
  const wordCount = desc.split(/\s+/).length;
  if (wordCount < 5) diversity -= 3;
  else if (wordCount < 10) diversity -= 1;

  // Bonus: contains comma-separated specs (indicates structured data)
  if ((desc.match(/,/g) || []).length >= 3) diversity += 1;

  // Penalty: generic boilerplate phrases
  const boilerplatePatterns = [
    /electronic component/i,
    /high quality/i,
    /buy online/i,
    /best price/i,
    /free shipping/i,
  ];
  const boilerplateCount = boilerplatePatterns.filter(p => p.test(desc)).length;
  diversity -= boilerplateCount;

  diversity = Math.max(0, Math.min(10, diversity));

  // --- Keyword richness (0-8) ---
  // Reward descriptions containing real technical terms
  const technicalTerms = [
    // Architecture/cores
    /cortex/i, /arm/i, /risc-v/i, /dsp/i, /fpga/i, /cpld/i, /mcu/i, /mpu/i, /soc/i,
    // Electrical params
    /\d+\s*(mhz|ghz|khz)/i, /\d+\s*(kb|mb|gb)/i, /\d+\s*bit/i,
    /\d+[\.\d]*\s*v/i, /\d+\s*(ma|µa|ua|a)\b/i,
    /supply\s+voltage/i, /input\s+voltage/i, /output\s+voltage/i,
    /load\s+current/i, /drive\s+current/i, /switching\s+current/i,
    /voltage\s+threshold/i, /signal\s+integrity/i, /logic\s+resources/i,
    /clock\s+constraints/i, /clock\s+frequency/i, /memory\s+interface/i,
    /interface\s+requirements/i, /package\s+(fit|escape|routing)/i,
    /thermal\s+operating\s+temperature/i,
    // Interfaces
    /spi/i, /i2c|i²c/i, /uart/i, /usart/i, /can\s*bus/i, /usb/i, /ethernet/i,
    /gpio/i, /adc/i, /dac/i, /pwm/i, /pll/i,
    // Package
    /lqfp/i, /bga/i, /qfn/i, /soic/i, /tssop/i, /dip/i,
    // Memory types
    /flash/i, /sram/i, /dram/i, /eeprom/i, /sdram/i,
    // Power
    /ldo/i, /buck/i, /boost/i, /mosfet/i, /igbt/i,
    /regulator/i, /converter/i, /supervisor/i, /voltage\s+reference/i,
    // Signal-chain / application-specific IC terms
    /amplifier/i, /audio\s+codec/i, /telecom/i, /jitter/i,
    // Operating conditions
    /\-\d+°?c/i, /operating\s+temperature/i,
  ];
  const matchedTerms = technicalTerms.filter(t => t.test(desc)).length;
  let keywords = 0;
  if (matchedTerms >= 8) keywords = 8;
  else if (matchedTerms >= 5) keywords = 6;
  else if (matchedTerms >= 3) keywords = 4;
  else if (matchedTerms >= 1) keywords = 2;

  // Non-templated copy: rescale the 0-30 sub-scores onto the 5-point budget.
  const raw = length + diversity + keywords;
  const total = Math.min(5, Math.round((raw / 30) * 5));
  return { total, length, diversity, keywords, generated: false };
}

/**
 * Score specs richness (0-40) — the catalogue's only dimension with genuine
 * spread, so it carries the most weight.
 *
 * Sub-dimensions:
 *   - Key count (0-28): stretched across the observed 5-28 range. The previous
 *     curve saturated at 15 keys, which put the median product (~21 keys) at
 *     full marks and discarded the top half of the distribution.
 *   - Value quality (0-12): share of keys carrying a real value
 *
 * --- 2026-08-15: count FILLED keys, not present keys ------------------------
 * The key-count curve used to run off Object.keys().length, and supplier feeds
 * ship a fixed key set with "-" in every slot they have no data for. So a row
 * with 26 keys and 2 real values scored the same 28 points as a fully populated
 * one, and the 0-12 value-quality term could not claw it back: measured on the
 * live catalogue, an all-"-" Rochester page scored 72 while the Microchip page
 * for the same part, with every spec filled, scored 70. 76,463 products carried
 * 8+ empty spec slots and 38,464 of them were indexable on that basis.
 *
 * Counting only filled keys makes an empty slot worth nothing instead of nearly
 * a full point, which is what "penalize thin specs" has to mean when the feed
 * pads its own schema.
 */
function scoreSpecs(specsStr) {
  if (!specsStr || specsStr === '{}' || specsStr === '') return { total: 0, keyCount: 0, valueQuality: 0 };

  let specs;
  try {
    specs = typeof specsStr === 'string' ? JSON.parse(specsStr) : specsStr;
  } catch {
    return { total: 0, keyCount: 0, valueQuality: 0 };
  }

  const entries = Object.entries(specs);
  const present = entries.length;

  // Values a feed writes to mean "we don't know": they are not specifications
  // and must not earn specification credit.
  const meaningfulValues = entries.filter(([, v]) => {
    const val = String(v).trim();
    return val.length > 0 && val !== '-' && val !== '—' && val !== 'N/A' && val !== 'n/a'
      && val !== 'NA' && val !== 'null' && val !== 'TBD' && val !== '?';
  }).length;

  // --- Key count score (0-28), over FILLED keys ---
  const count = meaningfulValues;
  let keyCount = 0;
  if (count >= 26) keyCount = 28;
  else if (count >= 24) keyCount = 25;
  else if (count >= 22) keyCount = 22;
  else if (count >= 20) keyCount = 19;
  else if (count >= 18) keyCount = 16;
  else if (count >= 16) keyCount = 13;
  else if (count >= 14) keyCount = 10;
  else if (count >= 11) keyCount = 7;
  else if (count >= 7) keyCount = 5;
  else if (count >= 4) keyCount = 3;
  else if (count >= 1) keyCount = 1;

  // --- Value quality score (0-12) ---
  // Share of the feed's own key set that is actually populated. Still ratio
  // based, so a short-but-complete spec table is not punished for being short.
  const meaningfulRatio = present > 0 ? meaningfulValues / present : 0;
  const valueQuality = Math.round(meaningfulRatio * 12);

  const total = keyCount + valueQuality;
  return { total: Math.min(40, total), keyCount, valueQuality, filledKeys: count, presentKeys: present };
}

/**
 * Score pricing data (0-18).
 */
function scorePricing(minPrice) {
  if (minPrice == null) return { total: 0 };
  if (minPrice > 0) return { total: 18 };
  return { total: 6 }; // price = 0 but field exists
}

/**
 * Score datasheet availability (0-15).
 * Only 383 products currently carry one, which makes it the single strongest
 * differentiator available today.
 */
function scoreDatasheet(datasheet) {
  if (!datasheet || typeof datasheet !== 'string') return { total: 0 };
  const ds = datasheet.trim();
  if (ds.length === 0) return { total: 0 };
  // Valid URL gets full points
  if (ds.startsWith('http://') || ds.startsWith('https://')) return { total: 15 };
  // Has some value but not a proper URL (e.g., local path) — partial credit
  return { total: 6 };
}

/**
 * Score image availability (0-10).
 *
 * --- 2026-08-15: score the image the page actually shows ---------------------
 * This used to read Product.imageUrl, which is null for all 719,342 rows, so ten
 * points of the scale could never be earned by anything — while the pages have
 * been showing package-family images from lib/product-image-resolver all along,
 * and those images are what goes into OG tags and JSON-LD.
 *
 * The resolver covers 604,143 rows (84%) and grades its own certainty, so it is
 * a real differentiator rather than a constant: an exact photo beats a confident
 * package match, which beats a category guess, which beats the 16% of rows whose
 * package data is too poor to place at all.
 *
 * Accepts a product object; a bare string is still treated as an exact image URL
 * so existing callers and tests keep working.
 */
const REPRESENTATIVE_IMAGE_POINTS = { high: 6, medium: 4, low: 2 };

function scoreImage(productOrUrl) {
  const isProduct = productOrUrl && typeof productOrUrl === 'object';
  const imageUrl = isProduct ? productOrUrl.imageUrl : productOrUrl;

  if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
    return { total: 10, kind: 'exact' };
  }
  if (!isProduct) return { total: 0, kind: 'none' };

  const representative = getProductRepresentativeImage(productOrUrl);
  if (!representative) return { total: 0, kind: 'none' };
  return {
    total: REPRESENTATIVE_IMAGE_POINTS[representative.confidence] ?? 0,
    kind: `representative:${representative.confidence}`,
  };
}

/**
 * Score lifecycle status (0-10).
 * Active products are more valuable for indexing — they represent current inventory.
 * Obsolete products still have value (niche demand) but less so.
 */
function scoreLifecycle(status) {
  const map = {
    active: 12,
    lastbuy: 9,
    nrnd: 6,
    eol: 4,
    obsolete: 2,
  };
  return { total: map[status] || 2 };
}

// --- Main Scoring Function ---

/**
 * Compute the complete quality score for a product.
 * 
 * @param {Object} product — Product record from database
 * @returns {{ score: number, tier: string, tierInfo: Object, breakdown: Object }}
 */
function computeQualityScore(product) {
  const description = scoreDescription(product.description);
  const specs = scoreSpecs(product.specs);
  const pricing = scorePricing(product.minPrice);
  const datasheet = scoreDatasheet(product.datasheet);
  // Whole product, not just imageUrl: the resolver needs package/category text.
  const image = scoreImage(product);
  const lifecycle = scoreLifecycle(product.status);

  const score = Math.min(100,
    description.total +
    specs.total +
    pricing.total +
    datasheet.total +
    image.total +
    lifecycle.total
  );

  const tier = getQualityTier(score);
  const tierInfo = getTierInfo(tier);

  return {
    score,
    tier,
    tierInfo,
    breakdown: {
      description,
      specs,
      pricing,
      datasheet,
      image,
      lifecycle,
    },
  };
}

/**
 * Determine if a product should be indexable based on score and threshold.
 * Default threshold is 50 — kept in sync with DEFAULT_INDEX_THRESHOLD in
 * lib/indexing-policy.js, which is the single source of truth for the live
 * policy. Callers should pass an explicit threshold; this default is only a
 * safe fallback.
 */
function isIndexable(score, threshold = DEFAULT_INDEX_THRESHOLD) {
  return score >= threshold;
}

export {
  computeQualityScore,
  DEFAULT_INDEX_THRESHOLD,
  isGeneratedDescription,
  getQualityTier,
  getTierInfo,
  isIndexable,
  TIERS,
  // Export individual scorers for testing/debugging
  scoreDescription,
  scoreSpecs,
  scorePricing,
  scoreDatasheet,
  scoreImage,
  scoreLifecycle,
};
