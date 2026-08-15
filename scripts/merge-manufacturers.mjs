/**
 * Collapse duplicate manufacturer spellings onto their canonical brand.
 *
 * Source of truth: src/lib/manufacturer-canonical.js. This script only APPLIES
 * that table to existing rows — it never decides what merges into what.
 *
 * What it does, in order:
 *   1. Product.manufacturer  — rewrite alias spellings to the canonical name.
 *      The brand name is rendered on the product page and the brand slug is part
 *      of the product URL, so contentUpdatedAt moves for these rows (sitemap
 *      lastmod should reflect a URL move).
 *   1b. Product.description — the generated copy names the brand inline ("… is a
 *      flash memory IC manufactured by Micron Technology Inc."). Renaming only
 *      the column leaves 29,542 pages whose body text contradicts their own
 *      heading, so the old spelling is rewritten in the prose too.
 *   2. Manufacturer rows     — make sure a row exists for each canonical name
 *      (inheriting any profile fields the retired row had), then delete the
 *      alias rows.
 *   3. Empty brand shells    — delete rows that never had products under any
 *      spelling (EMPTY_BRAND_SHELLS), after re-verifying they are still empty.
 *   4. VACUUM ANALYZE        — the rewrite touches up to ~90K rows; without this
 *      the planner keeps stale stats on a heavily indexed column.
 *
 * Old URLs keep working two ways: next.config.mjs generates
 * /manufacturer/<old> → /manufacturer/<new> and /product/<old>/:part →
 * /product/<new>/:part from the same table, and the product route independently
 * 301s any non-canonical brand segment.
 *
 * Usage:
 *   node scripts/merge-manufacturers.mjs              # dry run (default)
 *   node scripts/merge-manufacturers.mjs --apply      # write
 *
 * Dry run is the default on purpose: this moves live URLs, and re-running it
 * cannot undo that.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  canonicalManufacturer,
  manufacturerSlug,
  EMPTY_BRAND_SHELLS,
  MANUFACTURER_ALIAS_GROUPS,
} from '../src/lib/manufacturer-canonical.js';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

// Profile fields worth carrying over from a retired brand row when the surviving
// canonical row has nothing in that slot.
const PROFILE_FIELDS = [
  'logo', 'website', 'country', 'description',
  'specialties', 'founded', 'headquarters', 'stockNote',
];

function header(text) {
  console.log('');
  console.log('━'.repeat(70));
  console.log(`  ${text}`);
  console.log('━'.repeat(70));
}

async function run() {
  console.log(`Mode: ${APPLY ? '✏️  APPLY (writing)' : '🔍 DRY RUN (no writes) — pass --apply to commit'}`);

  // ── 1. Product.manufacturer rewrites ────────────────────────────────────
  const productBrands = await prisma.$queryRawUnsafe(
    `SELECT "manufacturer" AS name, COUNT(*)::int AS n FROM "Product" GROUP BY 1 ORDER BY 2 DESC`
  );

  const rewrites = productBrands
    .map(row => ({ from: row.name, to: canonicalManufacturer(row.name), n: row.n }))
    .filter(row => row.to && row.to !== row.from);

  header(`1. Product rows to re-brand: ${rewrites.reduce((s, r) => s + r.n, 0).toLocaleString()} in ${rewrites.length} spellings`);
  for (const r of rewrites) {
    console.log(`  ${String(r.n).padStart(7)}  "${r.from}"  →  "${r.to}"`);
    console.log(`           /product/${manufacturerSlug(r.from)}/…  →  /product/${manufacturerSlug(r.to)}/…`);
  }

  if (APPLY) {
    for (const r of rewrites) {
      const updated = await prisma.$executeRawUnsafe(
        // contentUpdatedAt moves: the rendered brand name and the canonical URL
        // both change. updatedAt is bumped by Prisma's @updatedAt on raw SQL? No —
        // raw SQL bypasses it, so set it explicitly to keep the two consistent.
        `UPDATE "Product"
            SET "manufacturer" = $1, "contentUpdatedAt" = NOW(), "updatedAt" = NOW()
          WHERE "manufacturer" = $2`,
        r.to, r.from
      );
      console.log(`  ✅ ${updated.toLocaleString()} rows: "${r.from}" → "${r.to}"`);
    }
  }

  // ── 1b. Brand name inside the generated description ─────────────────────
  // Driven by the alias table rather than by what step 1 just moved, so it also
  // repairs rows merged by an earlier run and is safe to re-run.
  //
  // Two shapes of replacement, and only one of them needs a guard:
  //
  //   shrinking  "Micron Technology Inc." → "Micron Technology"
  //     Safe unguarded, and idempotent: after the rewrite the old string is gone.
  //   expanding  "Micron" → "Micron Technology"
  //     Must skip rows whose description already contains the canonical name, or
  //     a description reading "Micron Technology Inc." becomes "Micron Technology
  //     Technology Inc.".
  //
  // The expansion case is exactly `canonical.includes(alias)`. Guarding both
  // shapes (the first version of this) silently skipped the common one, because
  // "Micron Technology Inc." does contain "Micron Technology".
  const copyPairs = [];
  for (const [canonical, aliases] of Object.entries(MANUFACTURER_ALIAS_GROUPS)) {
    for (const alias of aliases) {
      if (alias !== canonical) copyPairs.push({ alias, canonical, expanding: canonical.includes(alias) });
    }
  }
  copyPairs.sort((a, b) => b.alias.length - a.alias.length);

  header('1b. Descriptions still naming a retired spelling');
  let copyTotal = 0;
  for (const pair of copyPairs) {
    const guard = pair.expanding ? `AND "description" NOT LIKE '%' || $1 || '%'` : '';
    const [{ n }] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS n FROM "Product"
        WHERE "manufacturer" = $1
          AND "description" LIKE '%' || $2 || '%'
          ${guard}`,
      pair.canonical, pair.alias
    );
    if (n === 0) continue;
    copyTotal += n;
    console.log(`  ${String(n).padStart(7)}  "${pair.alias}" → "${pair.canonical}"${pair.expanding ? '  (guarded)' : ''}`);

    if (APPLY) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Product"
            SET "description" = replace("description", $2, $1),
                "contentUpdatedAt" = NOW(), "updatedAt" = NOW()
          WHERE "manufacturer" = $1
            AND "description" LIKE '%' || $2 || '%'
            ${guard}`,
        pair.canonical, pair.alias
      );
    }
  }
  if (copyTotal === 0) console.log('  none');

  // ── 2. Manufacturer table reconciliation ────────────────────────────────
  const brandRows = await prisma.manufacturer.findMany();
  const byName = new Map(brandRows.map(b => [b.name, b]));

  const aliasRows = brandRows.filter(b => {
    const canonical = canonicalManufacturer(b.name);
    return canonical && canonical !== b.name;
  });

  // Canonical names that now carry products but have no brand row of their own.
  const canonicalNames = new Set([
    ...productBrands.map(p => canonicalManufacturer(p.name)).filter(Boolean),
    ...aliasRows.map(a => canonicalManufacturer(a.name)),
  ]);
  const missingRows = [...canonicalNames].filter(name => !byName.has(name));

  header(`2. Brand rows: create ${missingRows.length}, retire ${aliasRows.length}`);
  for (const name of missingRows) {
    const donor = aliasRows.find(a => canonicalManufacturer(a.name) === name);
    console.log(`  + create "${name}" (/${manufacturerSlug(name)})${donor ? ` — inheriting profile from "${donor.name}"` : ''}`);
  }
  for (const a of aliasRows) {
    console.log(`  - retire "${a.name}" (/${a.slug})  →  "${canonicalManufacturer(a.name)}"`);
    console.log(`           /manufacturer/${a.slug}  →  /manufacturer/${manufacturerSlug(canonicalManufacturer(a.name))}`);
  }

  if (APPLY) {
    for (const name of missingRows) {
      const donor = aliasRows.find(a => canonicalManufacturer(a.name) === name);
      const data = { name, slug: manufacturerSlug(name) };
      for (const field of PROFILE_FIELDS) {
        if (donor?.[field]) data[field] = donor[field];
      }
      // The donor still owns the target slug until it is deleted below.
      if (donor && donor.slug === data.slug) {
        await prisma.manufacturer.update({ where: { id: donor.id }, data: { slug: `${donor.slug}-retired` } });
      }
      const created = await prisma.manufacturer.create({ data });
      byName.set(name, created);
      console.log(`  ✅ created "${name}" (/${created.slug})`);
    }

    for (const a of aliasRows) {
      const target = byName.get(canonicalManufacturer(a.name));
      if (!target) {
        console.log(`  ⚠️  skipped "${a.name}": no canonical row to merge into`);
        continue;
      }
      // Fill blanks on the survivor from the row being retired.
      const patch = {};
      for (const field of PROFILE_FIELDS) {
        if (!target[field] && a[field]) patch[field] = a[field];
      }
      if (Object.keys(patch).length > 0) {
        await prisma.manufacturer.update({ where: { id: target.id }, data: patch });
        console.log(`  ↳ copied ${Object.keys(patch).join(', ')} from "${a.name}" to "${target.name}"`);
      }
      await prisma.manufacturer.delete({ where: { id: a.id } });
      console.log(`  ✅ retired "${a.name}"`);
    }
  }

  // ── 2b. Slugs that drifted from the name ────────────────────────────────
  // A stored slug can fall out of sync without the brand being renamed: the
  // accent folding added to manufacturerSlug() turned "Weidmüller" from
  // weidm-ller into weidmuller, but nothing rewrote the Manufacturer row, so the
  // sitemap kept advertising a URL that immediately 301s. Reconcile against the
  // function that generates product URLs — it is the authority.
  const currentRows = await prisma.manufacturer.findMany({ select: { id: true, name: true, slug: true } });
  const takenSlugs = new Set(currentRows.map(r => r.slug));
  const drifted = currentRows.filter(r => r.slug !== manufacturerSlug(r.name));

  header(`2b. Brand rows whose slug no longer matches their name: ${drifted.length}`);
  for (const row of drifted) {
    const wanted = manufacturerSlug(row.name);
    const collides = takenSlugs.has(wanted);
    console.log(`  "${row.name}": /${row.slug} → /${wanted}${collides ? '  ⚠️ slug already taken, skipping' : ''}`);
    if (APPLY && !collides) {
      await prisma.manufacturer.update({ where: { id: row.id }, data: { slug: wanted } });
      takenSlugs.delete(row.slug);
      takenSlugs.add(wanted);
    }
  }
  if (drifted.length === 0) console.log('  none');
  if (drifted.length > 0) {
    console.log('  ↳ add the old slug to LEGACY_BRAND_SLUGS in lib/manufacturer-canonical.js so it keeps 301ing.');
  }

  // ── 3. Empty brand shells ───────────────────────────────────────────────
  const shellRows = await prisma.manufacturer.findMany({
    where: { name: { in: EMPTY_BRAND_SHELLS } },
    select: { id: true, name: true, slug: true },
  });
  const shellCounts = await prisma.$queryRawUnsafe(
    `SELECT "manufacturer" AS name, COUNT(*)::int AS n FROM "Product"
      WHERE "manufacturer" = ANY($1::text[]) GROUP BY 1`,
    EMPTY_BRAND_SHELLS
  );
  const stillUsed = new Map(shellCounts.map(r => [r.name, r.n]));

  header(`3. Empty brand shells: ${shellRows.length} rows`);
  const deletableShells = [];
  for (const shell of shellRows) {
    const n = stillUsed.get(shell.name) || 0;
    if (n > 0) {
      console.log(`  ⚠️  keep "${shell.name}" — now has ${n} products (list in manufacturer-canonical.js is stale)`);
    } else {
      deletableShells.push(shell);
      console.log(`  - delete "${shell.name}" (/${shell.slug})`);
    }
  }

  if (APPLY && deletableShells.length > 0) {
    const deleted = await prisma.manufacturer.deleteMany({
      where: { id: { in: deletableShells.map(s => s.id) } },
    });
    console.log(`  ✅ deleted ${deleted.count} empty brand rows`);
  }

  // ── 4. Post-state ───────────────────────────────────────────────────────
  if (APPLY) {
    // Bulk UPDATE on an indexed column leaves dead tuples and stale stats behind;
    // Product.manufacturer backs a btree, two composite indexes and a trigram GIN.
    console.log('\n  🧹 VACUUM ANALYZE "Product" …');
    await prisma.$executeRawUnsafe('VACUUM (ANALYZE) "Product"');
    await prisma.$executeRawUnsafe('ANALYZE "Manufacturer"');
  }

  const [brandTotal, emptyBrands, distinctBrands] = await Promise.all([
    prisma.manufacturer.count(),
    prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS n FROM "Manufacturer" m
        WHERE NOT EXISTS (SELECT 1 FROM "Product" p WHERE p."manufacturer" = m.name)`
    ),
    prisma.$queryRawUnsafe(`SELECT COUNT(DISTINCT "manufacturer")::int AS n FROM "Product"`),
  ]);

  header('Result');
  console.log(`  Manufacturer rows:            ${brandTotal}`);
  console.log(`  …with zero products:          ${emptyBrands[0].n}`);
  console.log(`  Distinct brands in Product:   ${distinctBrands[0].n}`);
  if (!APPLY) {
    console.log('\n  ℹ️  DRY RUN — nothing written. Re-run with --apply.');
  } else {
    console.log('\n  ⚠️  Cached aggregates now hold the previous catalogue (brand list, category');
    console.log('     trees and counts, sitemap shards). They expire on their own timers, so purge');
    console.log('     them deliberately:');
    console.log('       curl -X POST https://fpgacenter.com/api/admin/revalidate \\');
    console.log('            -H "Content-Type: application/json" -H "Cookie: <admin session>" \\');
    console.log('            -d \'{"all": true}\'');
    console.log('     or restart the app.');
  }

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
