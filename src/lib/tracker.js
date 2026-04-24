'use client';

/**
 * FPGACenter — Precision Traffic Tracker v2
 * 
 * Multi-layer attribution (not just UTM):
 * 
 * Layer 1: Ad Click IDs   — gclid (Google), fbclid (Facebook), msclkid (Bing), ttclid (TikTok)
 * Layer 2: UTM Parameters  — utm_source, utm_medium, utm_campaign, utm_content, utm_term
 * Layer 3: Referrer Parse  — Automatic domain detection + search keyword extraction
 * Layer 4: Page Context    — Landing page type (/product? /category? /blog? /)
 * Layer 5: User Journey    — Complete page path, product discovery source, RFQ trigger point
 * 
 * Attribution model: First-touch + Last-touch (dual), with full journey for analysis
 */

const STORAGE_KEY = 'fpgacenter_tracker';
const JOURNEY_KEY = 'fpgacenter_journey'; // Separate key for full page path (larger data)
const MAX_PRODUCT_VIEWS = 50;
const MAX_SEARCHES = 20;
const MAX_JOURNEY_STEPS = 100;

// ============================================================
// Ad Click ID Detection — works without UTM tags
// ============================================================

const AD_CLICK_PARAMS = {
  gclid:   { source: 'google',   medium: 'cpc', label: 'Google Ads' },
  gbraid:  { source: 'google',   medium: 'cpc', label: 'Google Ads (app)' },
  wbraid:  { source: 'google',   medium: 'cpc', label: 'Google Ads (web)' },
  fbclid:  { source: 'facebook', medium: 'paid_social', label: 'Facebook Ads' },
  msclkid: { source: 'bing',     medium: 'cpc', label: 'Bing Ads' },
  ttclid:  { source: 'tiktok',   medium: 'paid_social', label: 'TikTok Ads' },
  li_fat_id: { source: 'linkedin', medium: 'paid_social', label: 'LinkedIn Ads' },
  _kx:     { source: 'klaviyo',  medium: 'email', label: 'Klaviyo Email' },
};

function detectAdClickId(url) {
  for (const [param, info] of Object.entries(AD_CLICK_PARAMS)) {
    const value = url.searchParams.get(param);
    if (value) {
      return { param, value: value.substring(0, 100), ...info };
    }
  }
  return null;
}

// ============================================================
// Referrer Intelligence — extract source even without UTM
// ============================================================

const SEARCH_ENGINES = [
  { pattern: /google\./i,     name: 'Google',     queryParam: 'q', organic: 'google_organic' },
  { pattern: /bing\./i,       name: 'Bing',       queryParam: 'q', organic: 'bing_organic' },
  { pattern: /baidu\./i,      name: 'Baidu',      queryParam: 'wd', organic: 'baidu_organic' },
  { pattern: /yahoo\./i,      name: 'Yahoo',      queryParam: 'p', organic: 'yahoo_organic' },
  { pattern: /yandex\./i,     name: 'Yandex',     queryParam: 'text', organic: 'yandex_organic' },
  { pattern: /duckduckgo/i,   name: 'DuckDuckGo', queryParam: 'q', organic: 'duckduckgo_organic' },
  { pattern: /sogou\./i,      name: 'Sogou',      queryParam: 'query', organic: 'sogou_organic' },
  { pattern: /so\.com/i,      name: '360 Search', queryParam: 'q', organic: '360_organic' },
  { pattern: /ecosia\./i,     name: 'Ecosia',     queryParam: 'q', organic: 'ecosia_organic' },
  { pattern: /naver\./i,      name: 'Naver',      queryParam: 'query', organic: 'naver_organic' },
];

const SOCIAL_PLATFORMS = [
  { pattern: /facebook\.com|fb\.com|fbwat\.ch/i,  name: 'Facebook',  channel: 'facebook_social' },
  { pattern: /linkedin\.com|lnkd\.in/i,           name: 'LinkedIn',  channel: 'linkedin_social' },
  { pattern: /twitter\.com|t\.co|x\.com/i,        name: 'Twitter/X', channel: 'twitter_social' },
  { pattern: /reddit\.com/i,                       name: 'Reddit',    channel: 'reddit_social' },
  { pattern: /youtube\.com|youtu\.be/i,            name: 'YouTube',   channel: 'youtube_social' },
  { pattern: /instagram\.com/i,                    name: 'Instagram', channel: 'instagram_social' },
  { pattern: /tiktok\.com/i,                       name: 'TikTok',    channel: 'tiktok_social' },
  { pattern: /pinterest\.com/i,                    name: 'Pinterest', channel: 'pinterest_social' },
  { pattern: /wechat|weixin|wx/i,                  name: 'WeChat',    channel: 'wechat_social' },
  { pattern: /weibo\./i,                           name: 'Weibo',     channel: 'weibo_social' },
  { pattern: /whatsapp\.com/i,                     name: 'WhatsApp',  channel: 'whatsapp_social' },
  { pattern: /telegram\.org|t\.me/i,               name: 'Telegram',  channel: 'telegram_social' },
];

const MARKETPLACE_PLATFORMS = [
  { pattern: /alibaba\.com/i,     name: 'Alibaba',   channel: 'alibaba_marketplace' },
  { pattern: /aliexpress/i,       name: 'AliExpress', channel: 'aliexpress_marketplace' },
  { pattern: /digikey/i,          name: 'DigiKey',    channel: 'digikey_competitor' },
  { pattern: /mouser/i,           name: 'Mouser',     channel: 'mouser_competitor' },
  { pattern: /arrow\.com/i,       name: 'Arrow',      channel: 'arrow_competitor' },
  { pattern: /element14|farnell/i, name: 'Farnell',   channel: 'farnell_competitor' },
  { pattern: /octopart/i,         name: 'Octopart',   channel: 'octopart_aggregator' },
  { pattern: /findchips/i,        name: 'FindChips',  channel: 'findchips_aggregator' },
  { pattern: /lcsc\.com/i,        name: 'LCSC',       channel: 'lcsc_competitor' },
  { pattern: /szlcsc\.com/i,      name: 'LCSC(CN)',   channel: 'lcsc_competitor' },
];

function parseReferrer(referrerUrl) {
  if (!referrerUrl) return null;
  
  try {
    const ref = new URL(referrerUrl);
    const hostname = ref.hostname.toLowerCase();
    
    // Skip self-referrals
    if (typeof window !== 'undefined' && hostname === window.location.hostname) return null;

    // 1. Search engines — try to extract search keyword
    for (const se of SEARCH_ENGINES) {
      if (se.pattern.test(hostname)) {
        const keyword = ref.searchParams.get(se.queryParam) || null;
        return {
          type: 'search_engine',
          name: se.name,
          channel: se.organic,
          keyword, // May be null (Google encrypts most keywords)
          url: referrerUrl,
        };
      }
    }

    // 2. Social platforms
    for (const sp of SOCIAL_PLATFORMS) {
      if (sp.pattern.test(hostname)) {
        return { type: 'social', name: sp.name, channel: sp.channel, url: referrerUrl };
      }
    }

    // 3. Industry / competitor sites
    for (const mp of MARKETPLACE_PLATFORMS) {
      if (mp.pattern.test(hostname)) {
        return { type: 'industry', name: mp.name, channel: mp.channel, url: referrerUrl };
      }
    }

    // 4. Email clients
    if (/mail\.google|outlook\.live|mail\.yahoo|mail\.163|mail\.qq/i.test(hostname)) {
      return { type: 'email', name: 'Email Client', channel: 'email_client', url: referrerUrl };
    }

    // 5. Forums / Tech communities
    if (/eevblog|elektroda|electronics-lab|allaboutcircuits|forum/i.test(hostname)) {
      return { type: 'forum', name: hostname.replace(/^www\./, ''), channel: `forum_${hostname.split('.')[0]}`, url: referrerUrl };
    }

    // 6. Generic referral
    const domain = hostname.replace(/^www\./, '');
    return { type: 'referral', name: domain, channel: `referral_${domain.split('.')[0]}`, url: referrerUrl };

  } catch {
    return null;
  }
}

// ============================================================
// Landing Page Context — What kind of page did the user land on?
// ============================================================

function classifyLandingPage(pathname) {
  if (pathname === '/') return 'homepage';
  if (pathname.startsWith('/product/')) return 'product_page';
  if (pathname.startsWith('/category/')) return 'category_page';
  if (pathname.startsWith('/manufacturer')) return 'manufacturer_page';
  if (pathname.startsWith('/search')) return 'search_page';
  if (pathname.startsWith('/blog/')) return 'blog_article';
  if (pathname === '/blog') return 'blog_index';
  if (pathname === '/rfq') return 'rfq_page';
  if (pathname === '/bom') return 'bom_tool';
  return 'other_page';
}

// ============================================================
// Device & Browser Detection
// ============================================================

function getDeviceInfo() {
  if (typeof window === 'undefined') return { type: 'unknown', os: 'unknown', browser: 'unknown' };

  const ua = navigator.userAgent;
  const w = window.innerWidth;

  // Device type
  let type = 'desktop';
  if (w < 768 || /Mobile|Android|iPhone|iPod/i.test(ua)) type = 'mobile';
  else if (w < 1024 || /iPad|Tablet/i.test(ua)) type = 'tablet';

  // OS
  let os = 'other';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // Browser
  let browser = 'other';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua)) browser = 'Safari';

  return { type, os, browser, screenWidth: w, screenHeight: window.innerHeight };
}

// ============================================================
// Core Storage
// ============================================================

function getTrackerData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch { return null; }
}

function saveTrackerData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function getJourney() {
  try {
    return JSON.parse(localStorage.getItem(JOURNEY_KEY)) || [];
  } catch { return []; }
}

function saveJourney(journey) {
  try { localStorage.setItem(JOURNEY_KEY, JSON.stringify(journey)); } catch {}
}

function createFreshTracker() {
  return {
    version: 2,
    firstVisit: new Date().toISOString(),

    // === LAYER 1: Ad Click IDs ===
    adClickId: null,      // {param, value, source, medium, label}

    // === LAYER 2: UTM (first-touch) ===
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,

    // === LAYER 3: Referrer Intelligence (first-touch) ===
    referrer: null,       // Raw URL
    referrerParsed: null, // {type, name, channel, keyword?, url}

    // === LAYER 4: Landing Page ===
    landingPage: null,    // Full path
    landingPageType: null, // homepage, product_page, category_page, etc.

    // === Last-touch (updated on each new external visit) ===
    lastAdClickId: null,
    lastUtmSource: null,
    lastUtmMedium: null,
    lastUtmCampaign: null,
    lastReferrer: null,
    lastReferrerParsed: null,
    lastVisit: new Date().toISOString(),

    // === LAYER 5: User Behavior ===
    productViews: [],     // [{partNumber, manufacturer, timestamp, discoveredVia}]
    categoryViews: [],    // [{slug, timestamp}]
    searchQueries: [],    // [{query, resultsCount, timestamp}]
    pageViews: 0,
    sessionStart: Date.now(),
    rfqTrigger: null,     // Where the user clicked to start RFQ

    // === Device ===
    device: getDeviceInfo(),
  };
}

// ============================================================
// Initialization — called on every page navigation
// ============================================================

export function initTracker() {
  if (typeof window === 'undefined') return;

  let tracker = getTrackerData() || createFreshTracker();
  
  // Handle v1 → v2 migration
  if (!tracker.version || tracker.version < 2) {
    const fresh = createFreshTracker();
    fresh.firstVisit = tracker.firstVisit || fresh.firstVisit;
    fresh.utmSource = tracker.utmSource;
    fresh.utmMedium = tracker.utmMedium;
    fresh.utmCampaign = tracker.utmCampaign;
    fresh.utmContent = tracker.utmContent;
    fresh.utmTerm = tracker.utmTerm;
    fresh.referrer = tracker.referrer;
    fresh.landingPage = tracker.landingPage;
    fresh.productViews = tracker.productViews || [];
    fresh.categoryViews = tracker.categoryViews || [];
    fresh.searchQueries = tracker.searchQueries || [];
    fresh.pageViews = tracker.pageViews || 0;
    tracker = fresh;
  }

  const url = new URL(window.location.href);
  const pathname = url.pathname;

  // --- LAYER 1: Detect Ad Click IDs ---
  const adClick = detectAdClickId(url);
  if (adClick) {
    if (!tracker.adClickId) tracker.adClickId = adClick;
    tracker.lastAdClickId = adClick;

    // Auto-derive UTM if not explicitly set
    if (!url.searchParams.get('utm_source')) {
      if (!tracker.utmSource) {
        tracker.utmSource = adClick.source;
        tracker.utmMedium = adClick.medium;
      }
      tracker.lastUtmSource = adClick.source;
      tracker.lastUtmMedium = adClick.medium;
    }
  }

  // --- LAYER 2: Extract UTM parameters ---
  const utmSource = url.searchParams.get('utm_source');
  const utmMedium = url.searchParams.get('utm_medium');
  const utmCampaign = url.searchParams.get('utm_campaign');
  const utmContent = url.searchParams.get('utm_content');
  const utmTerm = url.searchParams.get('utm_term');
  const hasUtm = utmSource || utmMedium || utmCampaign;

  if (!tracker.utmSource && utmSource) tracker.utmSource = utmSource;
  if (!tracker.utmMedium && utmMedium) tracker.utmMedium = utmMedium;
  if (!tracker.utmCampaign && utmCampaign) tracker.utmCampaign = utmCampaign;
  if (!tracker.utmContent && utmContent) tracker.utmContent = utmContent;
  if (!tracker.utmTerm && utmTerm) tracker.utmTerm = utmTerm;

  if (hasUtm) {
    tracker.lastUtmSource = utmSource;
    tracker.lastUtmMedium = utmMedium;
    tracker.lastUtmCampaign = utmCampaign;
  }

  // --- LAYER 3: Referrer Intelligence ---
  if (document.referrer) {
    const parsed = parseReferrer(document.referrer);
    if (parsed) {
      if (!tracker.referrer) {
        tracker.referrer = document.referrer;
        tracker.referrerParsed = parsed;
      }
      tracker.lastReferrer = document.referrer;
      tracker.lastReferrerParsed = parsed;
    }
  }

  // --- LAYER 4: Landing Page ---
  if (!tracker.landingPage) {
    tracker.landingPage = pathname + url.search;
    tracker.landingPageType = classifyLandingPage(pathname);
  }

  // --- Update counters ---
  tracker.lastVisit = new Date().toISOString();
  tracker.pageViews = (tracker.pageViews || 0) + 1;
  tracker.device = getDeviceInfo();

  saveTrackerData(tracker);

  // --- Record journey step ---
  const journey = getJourney();
  const lastStep = journey[journey.length - 1];
  // Avoid consecutive duplicates
  if (!lastStep || lastStep.path !== pathname) {
    journey.push({
      path: pathname,
      ts: Date.now(),
      type: classifyLandingPage(pathname),
    });
    if (journey.length > MAX_JOURNEY_STEPS) {
      journey.splice(0, journey.length - MAX_JOURNEY_STEPS);
    }
    saveJourney(journey);
  }

  // --- Clean tracking params from URL (cosmetic, humans only) ---
  // Skip for bots: Googlebot's WRS executing this could cause URL mismatch
  const isBotUA = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex/i.test(navigator.userAgent || '');
  if (!isBotUA) {
    const paramsToClean = [...Object.keys(AD_CLICK_PARAMS), 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    const hasTrackingParams = paramsToClean.some(p => url.searchParams.has(p));
    if (hasTrackingParams && window.history.replaceState) {
      paramsToClean.forEach(p => url.searchParams.delete(p));
      window.history.replaceState({}, '', url.pathname + (url.search || '') + url.hash);
    }
  }
}

// ============================================================
// Event Tracking
// ============================================================

/**
 * Track a product page view with discovery context
 * @param {string} partNumber
 * @param {string} manufacturer
 * @param {string} discoveredVia - where user found this product:
 *   'search_result', 'category_browse', 'homepage_popular', 'blog_related',
 *   'rfq_prefill', 'direct_url', 'manufacturer_page'
 */
export function trackProductView(partNumber, manufacturer = '', discoveredVia = '') {
  if (typeof window === 'undefined') return;
  const tracker = getTrackerData();
  if (!tracker) return;

  // Avoid duplicate consecutive views
  const last = tracker.productViews[tracker.productViews.length - 1];
  if (last && last.partNumber === partNumber && Date.now() - new Date(last.timestamp).getTime() < 5000) {
    return;
  }

  // Auto-detect discovery source from previous journey step
  if (!discoveredVia) {
    const journey = getJourney();
    const prevStep = journey.length >= 2 ? journey[journey.length - 2] : null;
    if (prevStep) {
      if (prevStep.type === 'search_page') discoveredVia = 'search_result';
      else if (prevStep.type === 'category_page') discoveredVia = 'category_browse';
      else if (prevStep.type === 'homepage') discoveredVia = 'homepage_popular';
      else if (prevStep.type === 'blog_article') discoveredVia = 'blog_related';
      else if (prevStep.type === 'manufacturer_page') discoveredVia = 'manufacturer_page';
      else discoveredVia = `from:${prevStep.path}`;
    } else {
      discoveredVia = 'direct_url';
    }
  }

  tracker.productViews.push({
    partNumber,
    manufacturer,
    timestamp: new Date().toISOString(),
    discoveredVia,
  });

  if (tracker.productViews.length > MAX_PRODUCT_VIEWS) {
    tracker.productViews = tracker.productViews.slice(-MAX_PRODUCT_VIEWS);
  }

  saveTrackerData(tracker);
}

/**
 * Track category page view
 */
export function trackCategoryView(slug, name = '') {
  if (typeof window === 'undefined') return;
  const tracker = getTrackerData();
  if (!tracker) return;

  if (!tracker.categoryViews) tracker.categoryViews = [];
  tracker.categoryViews.push({ slug, name, timestamp: new Date().toISOString() });

  if (tracker.categoryViews.length > 20) {
    tracker.categoryViews = tracker.categoryViews.slice(-20);
  }
  saveTrackerData(tracker);
}

/**
 * Track search query
 */
export function trackSearch(query, resultsCount = null) {
  if (typeof window === 'undefined') return;
  const tracker = getTrackerData();
  if (!tracker) return;

  if (!tracker.searchQueries) tracker.searchQueries = [];
  tracker.searchQueries.push({ query, resultsCount, timestamp: new Date().toISOString() });

  if (tracker.searchQueries.length > MAX_SEARCHES) {
    tracker.searchQueries = tracker.searchQueries.slice(-MAX_SEARCHES);
  }
  saveTrackerData(tracker);
}

/**
 * Track where the user clicked to start the RFQ process
 * @param {string} trigger - 'product_page_btn', 'floating_btn', 'cta_section',
 *   'bom_tool', 'homepage_cta', 'header_nav'
 * @param {string} context - e.g., the part number or page path
 */
export function trackRfqTrigger(trigger, context = '') {
  if (typeof window === 'undefined') return;
  const tracker = getTrackerData();
  if (!tracker) return;

  tracker.rfqTrigger = {
    trigger,
    context,
    timestamp: new Date().toISOString(),
    fromPage: window.location.pathname,
  };
  saveTrackerData(tracker);
}

// ============================================================
// Get Tracking Snapshot — attached to RFQ submission
// ============================================================

export function getTrackingData() {
  if (typeof window === 'undefined') return {};
  const tracker = getTrackerData();
  if (!tracker) return {};
  const journey = getJourney();

  const sessionDuration = tracker.sessionStart
    ? Math.round((Date.now() - tracker.sessionStart) / 1000)
    : null;

  // Build compact journey summary
  const journeySummary = journey.slice(-30).map(s => s.path);

  return {
    _v: 2,

    // First-touch attribution (immutable)
    utm_source: tracker.utmSource || null,
    utm_medium: tracker.utmMedium || null,
    utm_campaign: tracker.utmCampaign || null,
    utm_content: tracker.utmContent || null,
    utm_term: tracker.utmTerm || null,
    referrer: tracker.referrer || null,
    referrer_parsed: tracker.referrerParsed || null,
    ad_click: tracker.adClickId || null,
    landing_page: tracker.landingPage || null,
    landing_page_type: tracker.landingPageType || null,
    first_visit: tracker.firstVisit || null,

    // Last-touch attribution
    last_utm_source: tracker.lastUtmSource || null,
    last_utm_medium: tracker.lastUtmMedium || null,
    last_utm_campaign: tracker.lastUtmCampaign || null,
    last_referrer: tracker.lastReferrer || null,
    last_referrer_parsed: tracker.lastReferrerParsed || null,
    last_ad_click: tracker.lastAdClickId || null,

    // User behavior
    products_viewed: (tracker.productViews || []).map(pv => ({
      pn: pv.partNumber,
      mfr: pv.manufacturer,
      via: pv.discoveredVia,
      t: pv.timestamp,
    })),
    categories_viewed: (tracker.categoryViews || []).map(cv => cv.slug),
    searches: (tracker.searchQueries || []).map(sq => sq.query),
    page_views: tracker.pageViews || 0,
    session_duration_sec: sessionDuration,
    rfq_trigger: tracker.rfqTrigger || null,

    // Journey (last 30 pages)
    journey: journeySummary,

    // Device
    device: tracker.device?.type || 'unknown',
    os: tracker.device?.os || 'unknown',
    browser: tracker.device?.browser || 'unknown',
    screen_width: tracker.device?.screenWidth || null,
  };
}

/**
 * Derive a human-readable traffic source label
 */
export function getSourceLabel(tracking) {
  if (!tracking) return 'Direct';

  // Ad click takes highest priority
  if (tracking.ad_click) return tracking.ad_click.label;

  // UTM
  if (tracking.utm_source) {
    const source = tracking.utm_source;
    const medium = tracking.utm_medium || '';
    if (medium === 'cpc' || medium === 'ppc') return `${source} (Paid)`;
    if (medium === 'email') return `${source} (Email)`;
    if (medium === 'social' || medium === 'paid_social') return `${source} (Social)`;
    return `${source}${medium ? ` / ${medium}` : ''}`;
  }

  // Parsed referrer
  if (tracking.referrer_parsed) {
    const rp = tracking.referrer_parsed;
    const label = rp.name || 'Unknown';
    if (rp.type === 'search_engine') return `${label} (Organic)`;
    if (rp.type === 'social') return label;
    if (rp.type === 'industry') return `${label} (Industry)`;
    if (rp.type === 'email') return 'Email';
    if (rp.type === 'forum') return `${label} (Forum)`;
    return label;
  }

  // Raw referrer
  if (tracking.referrer) {
    try { return new URL(tracking.referrer).hostname; } catch {}
  }

  return 'Direct';
}

/**
 * Reset behavior data after RFQ submission, keep attribution
 */
export function resetBehaviorData() {
  if (typeof window === 'undefined') return;
  const tracker = getTrackerData();
  if (!tracker) return;

  tracker.productViews = [];
  tracker.categoryViews = [];
  tracker.searchQueries = [];
  tracker.pageViews = 0;
  tracker.sessionStart = Date.now();
  tracker.rfqTrigger = null;

  saveTrackerData(tracker);
  saveJourney([]);
}
