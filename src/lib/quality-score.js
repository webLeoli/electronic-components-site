/**
 * Product Quality Scoring Engine
 * 
 * Computes a 0-100 quality score for product pages to determine indexing eligibility.
 * The score is used to:
 *   1. Control which products appear in the sitemap
 *   2. Set meta robots (index/noindex) on product pages
 *   3. Prioritize crawl budget on high-quality pages
 * 
 * Scoring Dimensions (total: 100 points):
 *   - Description Quality: 30 points
 *   - Specs Richness:      25 points
 *   - Pricing Data:        15 points
 *   - Datasheet:           10 points
 *   - Image:               10 points
 *   - Lifecycle Status:    10 points
 */

// --- Quality Tier Definitions ---

const TIERS = {
  gold:    { min: 70, label: 'Gold',    color: '#22c55e', emoji: '🥇' },
  silver:  { min: 45, label: 'Silver',  color: '#3b82f6', emoji: '🥈' },
  bronze:  { min: 20, label: 'Bronze',  color: '#eab308', emoji: '🥉' },
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

/**
 * Score the product description quality (0-30).
 * 
 * Sub-dimensions:
 *   - Length score (0-12): longer descriptions carry more unique content
 *   - Pattern diversity (0-10): penalize templated/repetitive sentence structures
 *   - Keyword richness (0-8): reward descriptions with technical terms
 */
function scoreDescription(description) {
  if (!description || typeof description !== 'string') return { total: 0, length: 0, diversity: 0, keywords: 0 };

  const desc = description.trim();
  const len = desc.length;

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
  // We don't have partNumber here, so check for common patterns
  const templatePatterns = [
    /^[A-Z0-9][\w-]+ is a /i,           // "XC7A35T is a ..." — common but acceptable
    /^IC /i,                              // Starts with "IC " — very short/generic
    /^[A-Z]{2,4}\s/,                      // Starts with 2-4 letter abbreviation
  ];
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
    // Interfaces
    /spi/i, /i2c|i²c/i, /uart/i, /usart/i, /can\s*bus/i, /usb/i, /ethernet/i,
    /gpio/i, /adc/i, /dac/i, /pwm/i, /pll/i,
    // Package
    /lqfp/i, /bga/i, /qfn/i, /soic/i, /tssop/i, /dip/i,
    // Memory types
    /flash/i, /sram/i, /dram/i, /eeprom/i, /sdram/i,
    // Power
    /ldo/i, /buck/i, /boost/i, /mosfet/i, /igbt/i,
    // Operating conditions
    /\-\d+°?c/i, /operating\s+temperature/i,
  ];
  const matchedTerms = technicalTerms.filter(t => t.test(desc)).length;
  let keywords = 0;
  if (matchedTerms >= 8) keywords = 8;
  else if (matchedTerms >= 5) keywords = 6;
  else if (matchedTerms >= 3) keywords = 4;
  else if (matchedTerms >= 1) keywords = 2;

  const total = length + diversity + keywords;
  return { total: Math.min(30, total), length, diversity, keywords };
}

/**
 * Score specs richness (0-25).
 * 
 * Sub-dimensions:
 *   - Key count (0-15): more spec fields = more structured data
 *   - Value quality (0-10): non-empty values with real data
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
  const count = entries.length;

  // --- Key count score (0-15) ---
  let keyCount = 0;
  if (count >= 15) keyCount = 15;
  else if (count >= 10) keyCount = 12;
  else if (count >= 7) keyCount = 9;
  else if (count >= 4) keyCount = 6;
  else if (count >= 2) keyCount = 3;
  else if (count >= 1) keyCount = 1;

  // --- Value quality score (0-10) ---
  // Count how many values are non-trivial (not just "-", "N/A", empty, etc.)
  const meaningfulValues = entries.filter(([, v]) => {
    const val = String(v).trim();
    return val.length > 0 && val !== '-' && val !== 'N/A' && val !== 'n/a' && val !== 'null';
  }).length;

  const meaningfulRatio = count > 0 ? meaningfulValues / count : 0;
  let valueQuality = Math.round(meaningfulRatio * 10);

  const total = keyCount + valueQuality;
  return { total: Math.min(25, total), keyCount, valueQuality };
}

/**
 * Score pricing data (0-15).
 */
function scorePricing(minPrice) {
  if (minPrice == null) return { total: 0 };
  if (minPrice > 0) return { total: 15 };
  return { total: 5 }; // price = 0 but field exists
}

/**
 * Score datasheet availability (0-10).
 */
function scoreDatasheet(datasheet) {
  if (!datasheet || typeof datasheet !== 'string') return { total: 0 };
  const ds = datasheet.trim();
  if (ds.length === 0) return { total: 0 };
  // Valid URL gets full points
  if (ds.startsWith('http://') || ds.startsWith('https://')) return { total: 10 };
  // Has some value but not a proper URL (e.g., local path) — partial credit
  return { total: 4 };
}

/**
 * Score image availability (0-10).
 */
function scoreImage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return { total: 0 };
  const url = imageUrl.trim();
  if (url.length === 0) return { total: 0 };
  return { total: 10 };
}

/**
 * Score lifecycle status (0-10).
 * Active products are more valuable for indexing — they represent current inventory.
 * Obsolete products still have value (niche demand) but less so.
 */
function scoreLifecycle(status) {
  const map = {
    active: 10,
    lastbuy: 8,
    nrnd: 5,
    eol: 3,
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
  const image = scoreImage(product.imageUrl);
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
 * Default threshold is 45 (Silver tier minimum).
 */
function isIndexable(score, threshold = 45) {
  return score >= threshold;
}

export {
  computeQualityScore,
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
