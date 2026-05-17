// Standalone test for category-seo.js — runs against the snapshot JSON
// instead of the DB so it's safe to run anytime.

import { readFileSync } from 'node:fs';
import { buildCategorySeo, _internals } from '../src/lib/category-seo.js';

const snapshot = JSON.parse(readFileSync('scripts/categories-snapshot.json', 'utf8'));

let titleOver = 0, descOver = 0, descUnder = 0, bothMissing = 0;
const titleLengths = [], descLengths = [];
const variantUse = new Map();

console.log('=== Sample outputs (first 12 non-empty categories) ===\n');

let printed = 0;
for (const cat of snapshot) {
  const seo = buildCategorySeo(cat);
  if (!seo.seoTitle && !seo.seoDesc) { bothMissing++; continue; }

  // Budget is 45 chars; the layout appends " | FPGACenter" → final ~60.
  if (seo.seoTitle.length > 45) titleOver++;
  if (seo.seoDesc.length  > 160) descOver++;
  if (seo.seoDesc.length  < 80)  descUnder++;
  titleLengths.push(seo.seoTitle.length);
  descLengths.push(seo.seoDesc.length);

  if (printed < 12) {
    printed++;
    console.log(`[${cat.slug}]  prod=${cat.productCount} mfrs=[${cat.topMfrs.slice(0,3).map(_internals.shortMfr).join(', ')}]`);
    console.log(`  T(${seo.seoTitle.length}c): ${seo.seoTitle}`);
    console.log(`  D(${seo.seoDesc.length}c):  ${seo.seoDesc}\n`);
  }
}

const avg = arr => Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
const max = arr => Math.max(...arr);
const min = arr => Math.min(...arr);

console.log('=== Aggregate stats ===');
console.log(`Categories with copy:       ${titleLengths.length}`);
console.log(`Categories skipped (empty): ${bothMissing}`);
console.log(`Title length: min=${min(titleLengths)} avg=${avg(titleLengths)} max=${max(titleLengths)}  | over 60: ${titleOver}`);
console.log(`Desc  length: min=${min(descLengths)}  avg=${avg(descLengths)} max=${max(descLengths)} | over 160: ${descOver} | under 80: ${descUnder}`);

// Boilerplate-word check
const boilerplate = [/electronic component/i, /high quality/i, /buy online/i, /best price/i, /free shipping/i];
let boilerplateHits = 0;
for (const cat of snapshot) {
  const seo = buildCategorySeo(cat);
  if (!seo.seoDesc) continue;
  if (boilerplate.some(re => re.test(seo.seoDesc) || re.test(seo.seoTitle || ''))) boilerplateHits++;
}
console.log(`Boilerplate-word hits: ${boilerplateHits} (must be 0)`);

// Pass / fail
const pass = titleOver === 0 && descOver === 0 && boilerplateHits === 0;
console.log(`\n${pass ? '✓ PASS' : '✗ FAIL'} — all categories within length budget and free of boilerplate`);
process.exit(pass ? 0 : 1);
