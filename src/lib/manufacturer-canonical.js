/**
 * Manufacturer name canonicalization — the single write-path gate for brand names.
 *
 * WHY THIS EXISTS
 * ---------------
 * `Product.manufacturer` is free text, and the manufacturer page resolves its
 * products by exact string equality (`where: { manufacturer: name }`). Supplier
 * feeds spell the same company several ways ("Analog Devices" / "Analog Devices
 * Inc.", "Nexperia" / "Nexperia USA Inc."), and scripts/sync-manufacturers.mjs
 * turned every spelling into its own Manufacturer row. Measured on the 719,342
 * row catalogue in 2026-08: 25 spelling groups covering 86,425 products, and 35
 * brand pages showing "0 products" because their products lived under a sibling
 * spelling. Product URLs embed the brand slug (lib/seo.js productPath), so each
 * variant also forked a parallel URL space.
 *
 * Every importer MUST push names through canonicalManufacturer() before writing,
 * or the duplicates come straight back on the next feed drop.
 *
 * WHAT THIS IS NOT
 * ----------------
 * Not a corporate-ownership map. Acquired brands stay separate on purpose:
 * Xilinx, Altera, Maxim Integrated, Linear Technology, Atmel, Micrel, Spansion,
 * Cypress, Freescale, Fairchild, International Rectifier, Burr-Brown, Unitrode
 * and IDT keep their own pages, because obsolete-part demand is searched under
 * the original brand name — the whole point of this site. Only spellings of the
 * *same* entity are merged here.
 *
 * Changing this table changes live URLs. next.config.mjs generates the 301s from
 * it automatically, but the catalogue rows only move when
 * scripts/merge-manufacturers.mjs runs — add an entry and run it, or the brand
 * page and the products under it disagree.
 *
 * DO NOT PRUNE ENTRIES. Every alias here is also a live 301, and Google's
 * guidance is to keep a redirect for at least a year after a move so the signals
 * transfer permanently — longer for pages that matter. Deleting a row that looks
 * "already migrated" silently removes the redirect for a URL that is still in
 * somebody's index, bookmark or datasheet PDF. The 2026-08-15 merge moved 104,524
 * product URLs; the earliest any of these may be reconsidered is 2027-08.
 *
 * RELATIONSHIP TO lib/manufacturer-map.js
 * ---------------------------------------
 * That file held an earlier, broader version of this idea, but nothing on the
 * write path ever called it — which is why the catalogue drifted anyway. It is
 * now a compatibility shim over this module. Its suffix-strip proposals were
 * reviewed and folded in below (second block); four of its calls were wrong and
 * are listed, with reasons, at the bottom of this file.
 */

// canonical name -> every raw spelling that should collapse into it.
// Keep the canonical side free of legal suffixes (Inc./Corp./Ltd./LLC) and
// geographic ones (USA/America) unless the suffix is part of how the brand is
// actually known.
const MANUFACTURER_ALIAS_GROUPS = {
  'Analog Devices': ['Analog Devices Inc.', 'Analog Devices Inc./Maxim Integrated'],
  'Alpha & Omega Semiconductor': ['Alpha & Omega'],
  // Asahi Kasei Microdevices ships as both the full name (3 products) and the
  // AKM short form (485).
  'AKM Semiconductor': ['Asahi Kasei Microdevices', 'Asahi Kasei Microdevices(AKM)'],
  'Astera Labs': ['Astera Labs, Inc.'],
  'Azoteq': ['Azoteq (Pty) Ltd.'],
  // TI's Burr-Brown line keeps its own page (see "WHAT THIS IS NOT"); the
  // trademarked feed spelling folds into it.
  'Burr-Brown': ['TI Burr-Brown™', 'TI Burr-Brown'],
  'Digi International': ['Digi International, Inc.', 'Digi International Inc. (Digi)'],
  'Finisar': ['Finisar Corporation'],
  'FTDI': ['FTDI Chip', 'FTDI, Future Technology Devices International Ltd'],
  'GHI Electronics': ['GHI Electronics, LLC'],
  'GigaDevice': ['GigaDevice Semiconductor'],
  'Holtek': ['Holtek Semiconductor'],
  // Harris' IC business became Intersil; the feed still ships the old name and
  // it holds no products of its own.
  'Intersil': ['Intersil Corporation', 'Harris Semiconductor'],
  'ISSI': ['ISSI, Integrated Silicon Solution Inc', 'Integrated Silicon Solution Inc'],
  'Lantronix': ['Lantronix, Inc.'],
  'International Rectifier': ['International Rectifier(IR)'],
  'Lattice Semiconductor': ['Lattice Semiconductor Corporation', 'Lattice'],
  // The parts filed under bare "LSI" are LS6xxx/LS7xxx — LSI Computer Systems
  // (LSI/CSI), not LSI Corporation. Naming the page correctly is the fix.
  'LSI Computer Systems': ['LSI', 'LSI/CSI', 'LSI Computer Systems, Inc. (LSI/CSI)'],
  'Marvell': ['Marvell Technology, Inc.'],
  'Micron Technology': ['Micron Technology Inc.', 'Micron'],
  'Microsemi': ['Microsemi Corporation'],
  'Monolithic Power Systems': ['Monolithic Power Systems Inc.'],
  'MYIR Tech': ['MYIR Tech Limited'],
  'MACOM': ['Macom®'],
  'Mornsun': ['Mornsun®'],
  'MoSys': ['MoSys™'],
  'Moxa': ['Moxa®'],
  'Nexperia': ['Nexperia USA Inc.', 'Nexperia Energy Harvesting Solutions(Nowi)'],
  'Nuvoton Technology': ['Nuvoton Technology Corporation America'],
  'NXP Semiconductors': ['NXP'],
  'Omron': ['Omron Automation & Safety', 'Omron Electronic Components'],
  'Onsemi': ['ON Semiconductor'],
  'Realtek': ['Realtek Semiconductor'],
  'Richtek Technology': ['Richtek USA'],
  'ROHM Semiconductor': ['ROHM'],
  'Semtech': ['Semtech Corporation'],
  'Sensata Technologies': ['AIRPAX / Sensata'],
  'Sharp Microelectronics': ['Sharp'],
  'SMSC': ['Standard Microsystems(SMSC)'],
  'SOC Technologies': ['System-On-Chip (SOC) Technologies'],
  'Spansion': ['Spansion®'],
  'TDK InvenSense': ['InvenSense'],
  'Toshiba': ['Toshiba Semiconductor and Storage'],
  'HY Electronic': ['HY Electronic (Cayman) Limited'],
  // Xilinx keeps its own page; only the combined feed spelling folds in.
  'Xilinx': ['AMD / Xilinx', 'AMD/Xilinx'],

  // ── Legal / geographic suffix strip (applied 2026-08-15) ────────────────
  // Single-spelling brands whose catalogue name carries a corporate suffix the
  // brand is not searched by. Not duplicate merges — each of these had exactly
  // one spelling — so they were held back from the first pass and applied once
  // the redirect generation had been verified on the real duplicates.
  //
  // Same rule as above: drop Inc./Corp./Ltd./LLC/GmbH/AG/Pte and the geographic
  // qualifiers (USA/America), keep everything a buyer would type. Ownership is
  // still never merged — Micrel and Unitrode stay their own brands, they just
  // lose ", Inc." and " Corp.".
  'Skyworks': ['Skyworks Solutions'],
  'ABLIC': ['ABLIC Inc.'],
  'Diodes': ['Diodes Incorporated'],
  'Nisshinbo Micro Devices': ['Nisshinbo Micro Devices Inc.'],
  'Infineon': ['Infineon Technologies'],
  'Prolabs': ['Prolabs Ltd.'],
  'Broadcom': ['Broadcom Limited'],
  'Cirrus Logic': ['Cirrus Logic Inc.'],
  'Sanken': ['Sanken Electric'],
  'Insignis Technology': ['Insignis Technology Corporation'],
  'Fremont Micro Devices': ['Fremont Micro Devices Ltd'],
  'Everspin Technologies': ['Everspin Technologies Inc.'],
  'GSI Technology': ['GSI Technology Inc.'],
  'NTE Electronics': ['NTE Electronics Inc.'],
  'Kaga FEI': ['Kaga FEI America, Inc.'],
  // The old map shortened this to "MCC"; the full name is what a datasheet
  // search matches, so only the suffix goes.
  'Micro Commercial Components': ['Micro Commercial Components, Corp.'],
  'Kioxia': ['Kioxia America, Inc.'],
  'Trinamic': ['Trinamic Motion Control GmbH'],
  'Critical Link': ['Critical Link, LLC'],
  'Etron Technology': ['Etron Technology, Inc.'],
  'Swissbit': ['Swissbit AG'],
  'Holt Integrated Circuits': ['Holt Integrated Circuits Inc.'],
  'Micro Crystal': ['Micro Crystal AG'],
  'Efinix': ['Efinix, Inc.'],
  'Flexxon': ['Flexxon Pte Ltd'],
  'iNRCORE': ['iNRCORE, LLC'],
  'Micross Components': ['Micross Components, Inc.'],
  'Powerex': ['Powerex Inc.'],
  'Micrel': ['Micrel, Inc.'],
  'CTS': ['CTS Corporation'],
  'Ampleon': ['Ampleon USA Inc.'],
  'Motorola': ['Motorola, Inc.'],
  // "IEI" alone is too short to be a useful brand page title.
  'IEI Integration': ['IEI Integration Corp.'],
  'Netlist': ['Netlist Inc.'],
  'Octavo Systems': ['Octavo Systems LLC'],
  'Delkin Devices': ['Delkin Devices,Inc.'],
  'Intelligent Memory': ['Intelligent Memory Ltd.'],
  'Unitrode': ['Unitrode Corp.'],
  'Panjit': ['Panjit International Inc.'],
  'DLP Design': ['DLP Design Inc.'],
  'Adafruit': ['Adafruit Industries LLC'],
  'SST Sensing': ['SST Sensing Ltd.'],
  'CCS': ['CCS, Inc.'],
  'Sigma Designs': ['Sigma Designs Inc.'],
  'Wandboard': ['Wandboard.Org'],
  'HVM Technology': ['HVM Technology, Inc.'],
  'Mitex': ['Mitex, LLC'],
  'Binho': ['Binho, LLC'],
  'QST Products': ['QST Products LLC.'],
  'Grayhill': ['Grayhill Inc.'],
  'Nearson': ['Nearson Inc.'],
  'BECOM Systems': ['BECOM Systems GmbH'],
  'Terasic': ['Terasic Inc.'],
  'ECS': ['ECS Inc.'],
  'ebm-papst': ['ebm-papst Inc.'],
  'Elite Semiconductor': ['Elite Semiconductor Microelectronics Technology'],
  'Dell Technologies': ['Dell Technologies OEM Solutions'],
  'Eon Silicon': ['Eon Silicon Solution, Inc.'],
  'BK Precision': ['B&K Precision'],
};

// Flattened lookup: normalized raw spelling -> canonical name.
const ALIAS_LOOKUP = new Map();
for (const [canonical, aliases] of Object.entries(MANUFACTURER_ALIAS_GROUPS)) {
  for (const alias of aliases) {
    ALIAS_LOOKUP.set(lookupKey(alias), canonical);
  }
  // Canonical names map to themselves so re-running a migration is a no-op and
  // a feed that already uses the good spelling short-circuits.
  ALIAS_LOOKUP.set(lookupKey(canonical), canonical);
}

/**
 * Lookup key for alias matching: case- and punctuation-insensitive, so
 * "Analog Devices Inc.", "ANALOG DEVICES, INC" and "analog devices inc" all hit
 * the same entry. Deliberately NOT a suffix-stripping normalizer — that would
 * silently merge distinct companies (Samsung vs Samsung Electro-Mechanics,
 * Micrel vs Micron). Only spellings listed above are ever merged.
 */
function lookupKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[™®]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Collapse a raw feed manufacturer string to its canonical brand name.
 * Unknown brands pass through with whitespace tidied — this table is an
 * allow-list of known duplicates, not a general rewriter.
 */
function canonicalManufacturer(name) {
  const raw = String(name ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  return ALIAS_LOOKUP.get(lookupKey(raw)) || raw;
}

/**
 * URL slug for a brand. Single source of truth: lib/seo.js productPath(), the
 * manufacturer route and the import scripts all had their own copy of this, and
 * a divergence here silently 404s every product page of a brand.
 */
function manufacturerSlug(name) {
  return (name || 'unknown')
    .toLowerCase()
    // Transliterate accented letters before they are stripped as "not a-z".
    // "Weidmüller" used to slug to "weidm-ller" and "Boréas Technologies" to
    // "bor-as-technologies" — unreadable URLs for two real companies. The
    // alternative (renaming them to ASCII) would print the wrong company name on
    // the page; the name stays correct and only the slug is folded.
    // The character range below is U+0300-U+036F, the combining-marks block that
    // NFD splits accents into. It renders as invisible marks in most editors —
    // check it with a hex view before editing this line, don't retype it.
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown';
}

/**
 * Retired brand slugs that the alias table cannot express, mapped to the brand
 * that should answer for them now. next.config.mjs turns each into a 301 for both
 * /manufacturer/<slug> and /product/<slug>/:partNumber.
 *
 * Two kinds live here:
 *
 *   1. Slug-shape changes with no rename — the accent folding in
 *      manufacturerSlug() moved "Weidmüller" from weidm-ller to weidmuller.
 *   2. Brands whose rows were deleted but whose PAGES existed and were in the
 *      sitemap. Sensata Technologies, Enfis and Johanson Technology each held
 *      one or two IS25* parts that were feed errors (ISSI's flash line);
 *      scripts/fix-misattributed-parts.mjs moved those parts to ISSI and removed
 *      the empty rows. Without an entry here those three URLs would 404 and lose
 *      whatever equity they had — pointing them at the brand that now owns their
 *      only parts is the honest target.
 *
 * The twelve brands that never had a product under any spelling are deliberately
 * NOT here: redirecting content-free URLs to an unrelated page is a soft 404, so
 * they return a real 404 instead.
 */
const LEGACY_BRAND_SLUGS = {
  'weidm-ller': 'Weidmüller',
  'bor-as-technologies': 'Boréas Technologies',
  'sensata-technologies': 'ISSI',
  'enfis': 'ISSI',
  'johanson-technology': 'ISSI',
};

/**
 * Canonical brand names whose RETIRED spellings match a search query.
 *
 * After a rename the old spelling is gone from the catalogue, so a visitor
 * searching the name printed on the part ("Skyworks Solutions", "Infineon
 * Technologies", "Micron Technology Inc") got zero results — the rename made the
 * site worse at finding the very products it renamed. Search widens its query
 * with whatever canonical names the retired spellings point at.
 *
 * Matching is ANCHORED — the query has to name the brand from the start, in
 * either direction. "Nexperia USA" matches the alias "Nexperia USA Inc." and
 * yields "Nexperia"; "Micron Technology Inc" matches too.
 *
 * Anchoring is the whole trick. An unanchored substring test (the first version
 * of this) treats a query like "Inc" as naming 40 different brands, because
 * every "…, Inc." alias contains it — each one then becomes another OR branch in
 * the search query, which is both meaningless and slow. "Corp" hit 12 brands,
 * "Ltd" 7, "Semiconductor" 6. Anchored, all of those correctly expand to nothing.
 *
 * MAX_EXPANSIONS is the backstop: if a query still names several brands it is
 * too generic to be a brand search, so it expands to nothing rather than to a
 * pile of OR branches.
 */
const MAX_BRAND_EXPANSIONS = 3;

function canonicalNamesForQuery(query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (q.length < 3) return [];

  const matches = new Set();
  for (const [canonical, aliases] of Object.entries(MANUFACTURER_ALIAS_GROUPS)) {
    if (canonical.toLowerCase().includes(q)) continue; // already findable as-is
    for (const alias of aliases) {
      const a = alias.toLowerCase();
      if (a.startsWith(q) || q.startsWith(a)) { matches.add(canonical); break; }
    }
  }
  return matches.size > MAX_BRAND_EXPANSIONS ? [] : [...matches];
}

/** True when `name` is a spelling we intend to rewrite. */
function isAliasSpelling(name) {
  const canonical = canonicalManufacturer(name);
  return canonical !== '' && canonical !== String(name ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Brand rows that only ever existed as empty shells: no products under any
 * spelling, no alias target. They rendered "0 products" pages and shipped in
 * the sitemap. Kept as data so the cleanup script and any future feed can agree
 * on what to drop.
 */
/**
 * Brands in the catalogue that are distributors, not the manufacturer of the
 * parts filed under them. Rochester Electronics alone accounts for 106,452 rows,
 * 6,148 of which are the same silicon as an OEM row elsewhere in the catalogue.
 *
 * Copy and structured data must not claim these companies made the part: the
 * generated page text said "manufactured by Rochester Electronics" while the
 * OEM's own page for the same part said "no longer produced by Microchip", and
 * schema.org `brand` asserted the distributor as the brand.
 *
 * Conservative list — only companies that unambiguously resell other makers'
 * silicon. Deliberately excluded because they sell own-brand product:
 * NTE Electronics (NTE-branded cross-reference parts), Prolabs (own-brand
 * optics), Trenz Electronic / Beacon EmbeddedWorks (own modules),
 * Quality Semiconductor (a real fab-era IC maker, QSI).
 */
// CANONICAL spellings — isDistributorBrand() canonicalizes before looking up, so
// an entry written in a retired spelling silently never matches. "Micross
// Components, Inc." was listed here until the suffix strip above renamed it.
const DISTRIBUTOR_BRANDS = new Set([
  'Rochester Electronics',
  'Flip Electronics',
  'Waldom Electronics',
  'Micross Components',
]);

/** True when the brand on a row is a reseller rather than the maker. */
function isDistributorBrand(name) {
  return DISTRIBUTOR_BRANDS.has(canonicalManufacturer(name));
}

const EMPTY_BRAND_SHELLS = [
  'Airoha',
  'BAE Systems',
  'BYD Semiconductor',
  'Chipown',
  'Harting',
  'Hirose',
  'HiSilicon',
  'JAE Electronics',
  'LoRa Alliance',
  'MediaTek',
  'Mitsubishi Electric',
  'Unknown',
];

/**
 * Merges that lib/manufacturer-map.js proposed and this module deliberately does
 * NOT make. Recorded so the next person doesn't "fix" the omission:
 *
 *   Samsung Electro-Mechanics → Samsung
 *     A separate company (SEMCO), not a spelling of Samsung Electronics.
 *   Pericom Semiconductor → Diodes
 *     Acquired-brand merge. Pericom part numbers are still searched as Pericom;
 *     see "WHAT THIS IS NOT" above.
 *   Socle Technology SHARP → Sharp
 *     Socle is an independent ASIC house. The feed string is malformed, but
 *     which of the two brands owns those 14 parts is unverified — don't guess.
 *   Sharp Microelectronics → Sharp, Micron Technology → Micron,
 *   ROHM Semiconductor → ROHM, LSI Computer Systems → LSI
 *     Same groups, opposite direction. The canonical side above is the one that
 *     names the actual business unit; the map's shorter forms are ambiguous
 *     (Sharp sells appliances, LSI Corporation is a different company).
 */

export {
  MANUFACTURER_ALIAS_GROUPS,
  EMPTY_BRAND_SHELLS,
  DISTRIBUTOR_BRANDS,
  LEGACY_BRAND_SLUGS,
  canonicalManufacturer,
  canonicalNamesForQuery,
  manufacturerSlug,
  isAliasSpelling,
  isDistributorBrand,
};
