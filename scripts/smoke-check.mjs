/**
 * Post-deploy smoke check, run against the PUBLIC url (through nginx, not the
 * Node port). Exits non-zero on the first failure so update.sh can stop.
 *
 * These are the checks that only fail in front of a real proxy, or only fail
 * after a data migration — the ones a local `npm run build` cannot catch:
 *
 *   1. ENCODED SLASH. 59,869 part numbers contain "/", so their URLs carry %2F
 *      ("/product/nxp-semiconductors/TJA1028T%2F5V0%2F20%3A11"). Next serves
 *      these correctly, but a proxy that decodes %2F before matching the route
 *      turns every one of them into a 404 — 8% of the catalogue, silently. nginx
 *      does this whenever the location block proxies with a rewritten URI.
 *   2. RETIRED BRAND SLUG. Verifies the generated 301s in next.config.mjs are
 *      actually live, not just present in the source.
 *   3. CANONICAL BRAND PAGE + SITEMAP. Basic "the deploy is serving the new
 *      data" assertions.
 *
 * Test targets are read from the database rather than hardcoded, so the check
 * cannot rot when a part number is removed.
 *
 * Usage:
 *   BASE_URL=https://fpgacenter.com node scripts/smoke-check.mjs
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { manufacturerSlug, LEGACY_BRAND_SLUGS } from '../src/lib/manufacturer-canonical.js';

const prisma = new PrismaClient();
const BASE_URL = (process.env.BASE_URL || process.env.HEALTH_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 20000);

const failures = [];

async function check(label, path, expected) {
  const url = `${BASE_URL}${path}`;
  let status, location;
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
    status = res.status;
    location = res.headers.get('location') || '';
  } catch (e) {
    failures.push(`${label}: request failed (${e.message}) — ${url}`);
    console.log(`  ❌ ${label.padEnd(34)} request failed: ${e.message}`);
    return;
  }
  const ok = expected.includes(status);
  if (!ok) failures.push(`${label}: got ${status}, expected ${expected.join('/')} — ${url}`);
  console.log(`  ${ok ? '✅' : '❌'} ${label.padEnd(34)} ${status}${location ? ` → ${location}` : ''}`);
}

async function run() {
  console.log(`Smoke check against ${BASE_URL}\n`);

  await check('homepage', '/', [200]);
  await check('sitemap index', '/sitemap.xml', [200]);
  await check('brand sitemap shard', '/sitemap/manufacturers', [200]);

  // 1. A live product whose part number contains a slash.
  const slashPart = await prisma.product.findFirst({
    where: { partNumber: { contains: '/' }, indexable: true, duplicateOfId: null },
    select: { partNumber: true, manufacturer: true },
    orderBy: { id: 'asc' },
  });
  if (slashPart) {
    const path = `/product/${manufacturerSlug(slashPart.manufacturer)}/${encodeURIComponent(slashPart.partNumber)}`;
    await check('part number with %2F', path, [200]);
    console.log(`     (${slashPart.partNumber})`);
  } else {
    console.log('  ⏭️  no slash-bearing part in the catalogue, skipped');
  }

  // Same for the other characters a proxy or WAF is likely to mangle.
  for (const [label, needle] of [['part number with %23 (#)', '#'], ['part number with space', ' '], ['part number with %2B (+)', '+']]) {
    const row = await prisma.product.findFirst({
      where: { partNumber: { contains: needle }, indexable: true, duplicateOfId: null },
      select: { partNumber: true, manufacturer: true },
      orderBy: { id: 'asc' },
    });
    if (!row) continue;
    await check(label, `/product/${manufacturerSlug(row.manufacturer)}/${encodeURIComponent(row.partNumber)}`, [200]);
  }

  // 2. A retired brand slug must still redirect.
  const retired = Object.keys(LEGACY_BRAND_SLUGS)[0];
  if (retired) await check('retired brand slug redirects', `/manufacturer/${retired}`, [301, 308]);

  // 3. A canonical brand page with products.
  const brand = await prisma.manufacturer.findFirst({ select: { slug: true }, orderBy: { id: 'asc' } });
  if (brand) await check('canonical brand page', `/manufacturer/${brand.slug}`, [200]);

  // 4. A consolidated duplicate must redirect, not 404.
  const dupe = await prisma.product.findFirst({
    where: { duplicateOfId: { not: null } },
    select: { partNumber: true, manufacturer: true },
    orderBy: { id: 'asc' },
  });
  if (dupe) {
    await check('duplicate part redirects',
      `/product/${manufacturerSlug(dupe.manufacturer)}/${encodeURIComponent(dupe.partNumber)}`, [301, 308]);
  }

  console.log('');
  if (failures.length === 0) {
    console.log('✅ smoke check passed');
  } else {
    console.log(`❌ ${failures.length} failure(s):`);
    for (const f of failures) console.log(`   - ${f}`);
    console.log('\nIf only the %2F / %23 checks failed, the proxy is decoding the path before');
    console.log('Next sees it. For nginx, proxy the raw request URI:');
    console.log('    location / { proxy_pass http://127.0.0.1:3000; }   # no trailing path, no rewrite');
    console.log('A "proxy_pass http://127.0.0.1:3000/;" (trailing slash) or any rewrite in the');
    console.log('same block makes nginx re-encode the decoded URI and breaks these URLs.');
  }

  await prisma.$disconnect();
  process.exitCode = failures.length === 0 ? 0 : 1;
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
