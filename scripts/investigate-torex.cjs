const { PrismaClient } = require('@prisma/client');

// Inline minimal version of computeQualityScore for diagnostic purposes
function scoreDescription(description) {
  if (!description || typeof description !== 'string') return { total: 0, length: 0, diversity: 0, keywords: 0 };
  const desc = description.trim();
  const len = desc.length;
  let length = 0;
  if (len > 300) length = 12;
  else if (len > 200) length = 10;
  else if (len > 150) length = 8;
  else if (len > 100) length = 6;
  else if (len > 60) length = 4;
  else if (len > 30) length = 2;

  let diversity = 5;
  const templatePatterns = [
    /^[A-Z0-9][\w-]+ is a /i,
    /^IC /i,
    /^[A-Z]{2,4}\s/,
  ];
  const templateMatches = templatePatterns.filter(p => p.test(desc)).length;
  diversity -= templateMatches * 2;
  const sentenceCount = (desc.match(/[.!?]+/g) || []).length;
  if (sentenceCount >= 4) diversity += 3;
  else if (sentenceCount >= 2) diversity += 2;
  else if (sentenceCount >= 1) diversity += 1;
  const wordCount = desc.split(/\s+/).length;
  if (wordCount < 5) diversity -= 3;
  else if (wordCount < 10) diversity -= 1;
  if ((desc.match(/,/g) || []).length >= 3) diversity += 1;
  const boilerplatePatterns = [/electronic component/i, /high quality/i, /buy online/i, /best price/i, /free shipping/i];
  const boilerplateCount = boilerplatePatterns.filter(p => p.test(desc)).length;
  diversity -= boilerplateCount;
  diversity = Math.max(0, Math.min(10, diversity));

  const technicalTerms = [/cortex/i, /arm/i, /risc-v/i, /dsp/i, /fpga/i, /cpld/i, /mcu/i, /mpu/i, /soc/i, /\d+\s*(mhz|ghz|khz)/i, /\d+\s*(kb|mb|gb)/i, /\d+\s*bit/i, /\d+[\.\d]*\s*v/i, /\d+\s*(ma|µa|ua|a)\b/i, /spi/i, /i2c|i²c/i, /uart/i, /usart/i, /can\s*bus/i, /usb/i, /ethernet/i, /gpio/i, /adc/i, /dac/i, /pwm/i, /pll/i, /lqfp/i, /bga/i, /qfn/i, /soic/i, /tssop/i, /dip/i, /flash/i, /sram/i, /dram/i, /eeprom/i, /sdram/i, /ldo/i, /buck/i, /boost/i, /mosfet/i, /igbt/i, /\-\d+°?c/i, /operating\s+temperature/i];
  const matchedTerms = technicalTerms.filter(t => t.test(desc)).length;
  let keywords = 0;
  if (matchedTerms >= 8) keywords = 8;
  else if (matchedTerms >= 5) keywords = 6;
  else if (matchedTerms >= 3) keywords = 4;
  else if (matchedTerms >= 1) keywords = 2;
  return { total: Math.min(30, length + diversity + keywords), length, diversity, keywords };
}

function scoreSpecs(specsStr) {
  if (!specsStr || specsStr === '{}' || specsStr === '') return { total: 0, keyCount: 0, valueQuality: 0 };
  let specs;
  try { specs = typeof specsStr === 'string' ? JSON.parse(specsStr) : specsStr; }
  catch { return { total: 0, keyCount: 0, valueQuality: 0 }; }
  const entries = Object.entries(specs);
  const count = entries.length;
  let keyCount = 0;
  if (count >= 15) keyCount = 15;
  else if (count >= 10) keyCount = 12;
  else if (count >= 7) keyCount = 9;
  else if (count >= 4) keyCount = 6;
  else if (count >= 2) keyCount = 3;
  else if (count >= 1) keyCount = 1;
  const meaningfulValues = entries.filter(([, v]) => {
    const val = String(v).trim();
    return val.length > 0 && val !== '-' && val !== 'N/A' && val !== 'n/a' && val !== 'null';
  }).length;
  const ratio = count > 0 ? meaningfulValues / count : 0;
  return { total: Math.min(25, keyCount + Math.round(ratio * 10)), keyCount, valueQuality: Math.round(ratio * 10) };
}

function scorePricing(p) { if (p == null) return 0; if (p > 0) return 15; return 5; }
function scoreDatasheet(d) { if (!d) return 0; const s = d.trim(); if (!s) return 0; if (s.startsWith('http')) return 10; return 4; }
function scoreImage(i) { return (i && i.trim()) ? 10 : 0; }
function scoreLifecycle(s) { const m = { active: 10, lastbuy: 8, nrnd: 5, eol: 3, obsolete: 2 }; return m[s] || 2; }

function fullScore(p) {
  const specs = p.specs ? (() => { try { return JSON.parse(p.specs); } catch { return {}; } })() : {};
  const desc = scoreDescription(p.description);
  const sp = scoreSpecs(p.specs);
  const pr = scorePricing(p.minPrice);
  const ds = scoreDatasheet(p.datasheet);
  const im = scoreImage(p.imageUrl);
  const lc = scoreLifecycle(p.status);
  return { desc, specs: sp, pricing: pr, datasheet: ds, image: im, lifecycle: lc, total: desc.total + sp.total + pr + ds + im + lc, specCount: Object.keys(specs).length };
}

async function statsFor(prisma, mfrName) {
  const total = await prisma.product.count({ where: { manufacturer: mfrName } });
  if (total === 0) return null;

  const counts = await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*) FILTER (WHERE LENGTH(COALESCE(description, '')) < 50)::int AS d_lt50,
      COUNT(*) FILTER (WHERE LENGTH(COALESCE(description, '')) BETWEEN 50 AND 99)::int AS d_50_99,
      COUNT(*) FILTER (WHERE LENGTH(COALESCE(description, '')) BETWEEN 100 AND 149)::int AS d_100_149,
      COUNT(*) FILTER (WHERE LENGTH(COALESCE(description, '')) BETWEEN 150 AND 199)::int AS d_150_199,
      COUNT(*) FILTER (WHERE LENGTH(COALESCE(description, '')) >= 200)::int AS d_gte200,
      COUNT(*) FILTER (WHERE description IS NULL OR description = '')::int AS d_null,

      COUNT(*) FILTER (WHERE status = 'active')::int AS s_active,
      COUNT(*) FILTER (WHERE status = 'obsolete')::int AS s_obs,
      COUNT(*) FILTER (WHERE status = 'eol')::int AS s_eol,
      COUNT(*) FILTER (WHERE status = 'nrnd')::int AS s_nrnd,

      COUNT(*) FILTER (WHERE "minPrice" IS NULL)::int AS p_null,
      COUNT(*) FILTER (WHERE "minPrice" = 0)::int AS p_zero,
      COUNT(*) FILTER (WHERE "minPrice" > 0)::int AS p_pos,

      COUNT(*) FILTER (WHERE datasheet IS NOT NULL AND datasheet != '')::int AS has_ds,
      COUNT(*) FILTER (WHERE "imageUrl" IS NOT NULL AND "imageUrl" != '')::int AS has_img,

      COUNT(*) FILTER (WHERE "qualityScore" < 20)::int AS q_0_19,
      COUNT(*) FILTER (WHERE "qualityScore" BETWEEN 20 AND 44)::int AS q_20_44,
      COUNT(*) FILTER (WHERE "qualityScore" BETWEEN 45 AND 69)::int AS q_45_69,
      COUNT(*) FILTER (WHERE "qualityScore" >= 70)::int AS q_gte70,

      COUNT(*) FILTER (WHERE indexable = true)::int AS indexable,

      AVG(LENGTH(COALESCE(description, '')))::int AS avg_desc_len,
      AVG("qualityScore")::float AS avg_score
    FROM "Product"
    WHERE manufacturer = $1
  `, mfrName);

  const specStats = await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*) FILTER (WHERE specs IS NULL OR specs = '' OR specs = '{}')::int AS s_0,
      COUNT(*) FILTER (WHERE specs IS NOT NULL AND specs != '' AND specs != '{}' AND (LENGTH(specs) - LENGTH(REPLACE(specs, ':', ''))) BETWEEN 1 AND 3)::int AS s_1_3,
      COUNT(*) FILTER (WHERE specs IS NOT NULL AND specs != '' AND specs != '{}' AND (LENGTH(specs) - LENGTH(REPLACE(specs, ':', ''))) BETWEEN 4 AND 7)::int AS s_4_7,
      COUNT(*) FILTER (WHERE specs IS NOT NULL AND specs != '' AND specs != '{}' AND (LENGTH(specs) - LENGTH(REPLACE(specs, ':', ''))) BETWEEN 8 AND 15)::int AS s_8_15,
      COUNT(*) FILTER (WHERE specs IS NOT NULL AND specs != '' AND specs != '{}' AND (LENGTH(specs) - LENGTH(REPLACE(specs, ':', ''))) > 15)::int AS s_gt15
    FROM "Product"
    WHERE manufacturer = $1
  `, mfrName);

  return { total, ...counts[0], ...specStats[0] };
}

(async () => {
  const p = new PrismaClient();

  const torex = await statsFor(p, 'Torex Semiconductor');
  const micro = await statsFor(p, 'Microchip');

  function pct(n, total) { return total > 0 ? `${((n / total) * 100).toFixed(1)}%` : 'n/a'; }

  function fmt(label, t, m) {
    console.log(`  ${label.padEnd(24)} Torex: ${String(t).padStart(8)} (${pct(t, torex.total).padStart(6)})  |  Microchip: ${String(m).padStart(8)} (${pct(m, micro.total).padStart(6)})`);
  }

  console.log('===== TOREX vs MICROCHIP comparison =====\n');
  console.log(`Total: Torex=${torex.total.toLocaleString()}  Microchip=${micro.total.toLocaleString()}\n`);

  console.log('Description length distribution:');
  fmt('null/empty', torex.d_null, micro.d_null);
  fmt('<50 chars', torex.d_lt50, micro.d_lt50);
  fmt('50-99', torex.d_50_99, micro.d_50_99);
  fmt('100-149', torex.d_100_149, micro.d_100_149);
  fmt('150-199', torex.d_150_199, micro.d_150_199);
  fmt('>=200', torex.d_gte200, micro.d_gte200);
  console.log(`  avg desc len: Torex=${torex.avg_desc_len}  Microchip=${micro.avg_desc_len}\n`);

  console.log('Status distribution:');
  fmt('active', torex.s_active, micro.s_active);
  fmt('obsolete', torex.s_obs, micro.s_obs);
  fmt('eol', torex.s_eol, micro.s_eol);
  fmt('nrnd', torex.s_nrnd, micro.s_nrnd);

  console.log('\nPrice fields:');
  fmt('minPrice null', torex.p_null, micro.p_null);
  fmt('minPrice = 0', torex.p_zero, micro.p_zero);
  fmt('minPrice > 0', torex.p_pos, micro.p_pos);

  console.log('\nDatasheet / Image:');
  fmt('has datasheet', torex.has_ds, micro.has_ds);
  fmt('has imageUrl', torex.has_img, micro.has_img);

  console.log('\nSpecs field count (approximated by colon count):');
  fmt('0 specs', torex.s_0, micro.s_0);
  fmt('1-3 specs', torex.s_1_3, micro.s_1_3);
  fmt('4-7 specs', torex.s_4_7, micro.s_4_7);
  fmt('8-15 specs', torex.s_8_15, micro.s_8_15);
  fmt('>15 specs', torex.s_gt15, micro.s_gt15);

  console.log('\nQuality score tiers:');
  fmt('0-19 (noindex)', torex.q_0_19, micro.q_0_19);
  fmt('20-44 (bronze)', torex.q_20_44, micro.q_20_44);
  fmt('45-69 (silver)', torex.q_45_69, micro.q_45_69);
  fmt('>=70 (gold)', torex.q_gte70, micro.q_gte70);
  console.log(`  avg quality score: Torex=${torex.avg_score?.toFixed(1)}  Microchip=${micro.avg_score?.toFixed(1)}`);

  console.log('\nIndexable:');
  fmt('indexable=true', torex.indexable, micro.indexable);

  // 10 random Torex samples
  console.log('\n===== 10 Torex random samples =====');
  const samples = await p.$queryRawUnsafe(`SELECT "partNumber", description, "packageType", "mountType", status, "minPrice", stock, datasheet, "imageUrl", "qualityScore", specs FROM "Product" WHERE manufacturer = 'Torex Semiconductor' ORDER BY random() LIMIT 10`);

  for (const s of samples) {
    const score = fullScore(s);
    console.log(`\n${s.partNumber} | status=${s.status} | qScore=${s.qualityScore}`);
    console.log(`  desc (${(s.description || '').length}c): "${(s.description || '').substring(0, 120)}"`);
    console.log(`  package=${s.packageType}  mount=${s.mountType}  price=${s.minPrice}  stock=${s.stock}  ds=${!!s.datasheet}  img=${!!s.imageUrl}`);
    console.log(`  specCount=${score.specCount}`);
    console.log(`  computed: desc=${score.desc.total} (len=${score.desc.length} div=${score.desc.diversity} kw=${score.desc.keywords}) | specs=${score.specs.total} | pricing=${score.pricing} | ds=${score.datasheet} | img=${score.image} | lc=${score.lifecycle} | TOTAL=${score.total}`);
  }

  // For 3 Torex samples, show their specs keys
  console.log('\n===== Torex specs keys sample =====');
  const k = await p.$queryRawUnsafe(`SELECT "partNumber", specs FROM "Product" WHERE manufacturer = 'Torex Semiconductor' AND specs IS NOT NULL AND specs != '' AND specs != '{}' LIMIT 5`);
  for (const s of k) {
    try {
      const obj = JSON.parse(s.specs);
      console.log(`  ${s.partNumber}: keys = [${Object.keys(obj).slice(0, 10).join(', ')}]${Object.keys(obj).length > 10 ? '...' : ''}`);
    } catch { console.log(`  ${s.partNumber}: invalid JSON`); }
  }

  await p.$disconnect();
})();
