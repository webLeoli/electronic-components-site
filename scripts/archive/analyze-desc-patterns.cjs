const { PrismaClient } = require('@prisma/client');

const patterns = [
  { id: 'is_a_by',       re: /^\S+ is a .{2,80} (device )?by [^,.]+[,.]/ },
  { id: 'discontinued',  re: /by [^.]+\.\s*This part is discontinued\./i },
  { id: 'series_star',   re: /by [^.]+ part of the \* series\.?$/i },
  { id: 'pkg_temp',      re: /by [^,]+, in .+ package, rated for/ },
  { id: 'minimal_by',    re: /^\S+ by [^.]+\.?$/ },
];

const customChecks = [
  { id: 'short_lt_30',   fn: d => d.trim().length < 30 },
  { id: 'no_desc',       fn: d => !d || d.trim().length === 0 },
];

async function analyzeDescriptions() {
  const prisma = new PrismaClient();

  const stats = {
    total: 0,
    patterns: {},
    samples: {},
    uncategorized: [],
    allDescsByPattern: {},
  };

  [...patterns, ...customChecks].forEach(p => {
    stats.patterns[p.id] = 0;
    stats.samples[p.id] = [];
    stats.allDescsByPattern[p.id] = [];
  });
  stats.patterns['uncategorized'] = 0;
  stats.samples['uncategorized'] = [];
  stats.allDescsByPattern['uncategorized'] = [];

  const batchSize = 10000;
  let cursor = undefined;
  let processed = 0;

  console.log('Starting analysis of 719K+ product descriptions...');

  while (true) {
    const batch = await prisma.product.findMany({
      select: { id: true, partNumber: true, description: true, qualityScore: true, indexable: true, manufacturer: true },
      take: batchSize,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });

    if (batch.length === 0) break;

    for (const product of batch) {
      const desc = product.description || '';
      stats.total++;

      let matched = false;

      for (const pattern of patterns) {
        if (pattern.re.test(desc)) {
          stats.patterns[pattern.id]++;
          if (stats.samples[pattern.id].length < 5) {
            stats.samples[pattern.id].push(desc);
          }
          if (stats.allDescsByPattern[pattern.id].length < 500) {
            stats.allDescsByPattern[pattern.id].push({
              partNumber: product.partNumber,
              manufacturer: product.manufacturer,
              desc: desc.substring(0, 160),
              qualityScore: product.qualityScore,
              indexable: product.indexable,
              commaCount: (desc.match(/,/g) || []).length,
            });
          }
          matched = true;
          break;
        }
      }

      if (!matched) {
        for (const check of customChecks) {
          if (check.fn(desc)) {
            stats.patterns[check.id]++;
            if (stats.samples[check.id].length < 5) {
              stats.samples[check.id].push(desc);
            }
            if (stats.allDescsByPattern[check.id].length < 500) {
              stats.allDescsByPattern[check.id].push({
                partNumber: product.partNumber,
                manufacturer: product.manufacturer,
                desc: desc.substring(0, 160),
                qualityScore: product.qualityScore,
                indexable: product.indexable,
                commaCount: (desc.match(/,/g) || []).length,
              });
            }
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        stats.patterns['uncategorized']++;
        if (stats.uncategorized.length < 25) {
          stats.uncategorized.push({
            partNumber: product.partNumber,
            manufacturer: product.manufacturer,
            desc: desc,
            qualityScore: product.qualityScore,
            indexable: product.indexable,
          });
        }
        if (stats.allDescsByPattern['uncategorized'].length < 500) {
          stats.allDescsByPattern['uncategorized'].push({
            partNumber: product.partNumber,
            manufacturer: product.manufacturer,
            desc: desc.substring(0, 160),
            qualityScore: product.qualityScore,
            indexable: product.indexable,
            commaCount: (desc.match(/,/g) || []).length,
          });
        }
      }
    }

    processed += batch.length;
    if (processed % 50000 === 0) console.log(`Processed ${processed.toLocaleString()} products...`);

    cursor = batch[batch.length - 1].id;
  }

  // Spec count distribution for is_a_by
  const isAByItems = stats.allDescsByPattern['is_a_by'];
  const specCountDist = {};
  isAByItems.forEach(item => {
    const bucket = Math.min(8, item.commaCount);
    specCountDist[bucket] = (specCountDist[bucket] || 0) + 1;
  });

  // Quality stats per pattern (sample-based, since we capped at 500 per bucket)
  const qualityByPattern = {};
  for (const [patternId, items] of Object.entries(stats.allDescsByPattern)) {
    if (items.length === 0) continue;
    const scores = items.map(i => i.qualityScore || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const indexableCount = items.filter(i => i.indexable).length;
    qualityByPattern[patternId] = {
      sampleSize: items.length,
      avgScore: avg.toFixed(1),
      indexable: indexableCount,
      indexablePct: ((indexableCount / items.length) * 100).toFixed(1),
    };
  }

  // Top mfrs per pattern (for understanding which brands dominate which template)
  const mfrByPattern = {};
  for (const [patternId, items] of Object.entries(stats.allDescsByPattern)) {
    if (items.length === 0) continue;
    const mfrCount = {};
    items.forEach(i => { mfrCount[i.manufacturer] = (mfrCount[i.manufacturer] || 0) + 1; });
    const top = Object.entries(mfrCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    mfrByPattern[patternId] = top.map(([m, c]) => `${m}(${c})`).join(', ');
  }

  await prisma.$disconnect();

  return { stats, specCountDist, qualityByPattern, mfrByPattern };
}

analyzeDescriptions().then(result => {
  const { stats, specCountDist, qualityByPattern, mfrByPattern } = result;

  console.log('\n========== DESCRIPTION PATTERN ANALYSIS ==========\n');
  console.log(`Total products scanned: ${stats.total.toLocaleString()}\n`);

  console.log('Pattern Distribution:');
  console.log('---------------------');
  const patternOrder = ['no_desc', 'short_lt_30', 'is_a_by', 'minimal_by', 'discontinued', 'series_star', 'pkg_temp', 'uncategorized'];
  patternOrder.forEach(pid => {
    const count = stats.patterns[pid] || 0;
    const pct = ((count / stats.total) * 100).toFixed(2);
    console.log(`  ${pid.padEnd(18)}: ${count.toLocaleString().padStart(8)} (${pct.padStart(6)}%)`);
  });

  console.log('\n"is_a_by" Specs Distribution (by comma count, n<=500 sample):');
  console.log('---------------------------------------------------------------');
  for (let i = 0; i <= 8; i++) {
    const count = specCountDist[i] || 0;
    if (count > 0) console.log(`  ${i}+ commas: ${count}`);
  }

  console.log('\nQuality Score & Indexability by Pattern (n<=500 sample per pattern):');
  console.log('---------------------------------------------------------------------');
  for (const [patternId, metrics] of Object.entries(qualityByPattern)) {
    console.log(`  ${patternId.padEnd(18)}: avg_score=${metrics.avgScore}, indexable=${metrics.indexable}/${metrics.sampleSize} (${metrics.indexablePct}%)`);
  }

  console.log('\nTop Manufacturers per Pattern:');
  console.log('-------------------------------');
  for (const [patternId, mfrs] of Object.entries(mfrByPattern)) {
    console.log(`  ${patternId.padEnd(18)}: ${mfrs}`);
  }

  console.log('\nUncategorized Sample (up to 10):');
  console.log('---------------------------------');
  stats.uncategorized.slice(0, 10).forEach((item, i) => {
    console.log(`  [${i + 1}] ${item.partNumber} (${item.manufacturer})  qScore=${item.qualityScore} idx=${item.indexable}`);
    console.log(`      "${item.desc.substring(0, 140)}${item.desc.length > 140 ? '...' : ''}"`);
  });

  console.log('\nSample from Each Pattern (first 2):');
  console.log('====================================');
  patternOrder.forEach(pid => {
    const samples = stats.samples[pid] || [];
    if (samples.length === 0) return;
    console.log(`\n[${pid}]`);
    samples.slice(0, 2).forEach((desc, i) => {
      console.log(`  ${i + 1}. "${desc.substring(0, 120)}${desc.length > 120 ? '...' : ''}"`);
    });
  });

  process.exit(0);
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
