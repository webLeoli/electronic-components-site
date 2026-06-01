import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

console.log('='.repeat(80));
console.log('  穷尽核查 v3 — 多维度全面检测');
console.log('  检查前缀之外的所有潜在问题');
console.log('='.repeat(80) + '\n');

let issueCount = 0;
function reportIssue(severity, msg, samples = []) {
  issueCount++;
  const icon = severity === 'critical' ? '🔴' : severity === 'warn' ? '🟡' : '⚪';
  console.log(`  ${icon} ${msg}`);
  if (samples.length) console.log(`     → ${samples.join(', ')}`);
}

// ============================================================
// CHECK 1: 厂商名中的隐藏字符（空格、制表符、零宽字符）
// ============================================================
console.log('=== CHECK 1: 厂商名隐藏字符/空白问题 ===\n');

const allMfrNames = (await p.product.groupBy({ by: ['manufacturer'], _count: { _all: true } }))
  .filter(m => m.manufacturer);

for (const m of allMfrNames) {
  const name = m.manufacturer;
  // Leading/trailing whitespace
  if (name !== name.trim()) {
    reportIssue('critical', `厂商名有前后空格: "${name}" (${m._count._all} products)`);
  }
  // Double spaces
  if (/\s{2,}/.test(name)) {
    reportIssue('critical', `厂商名有连续空格: "${name}" (${m._count._all} products)`);
  }
  // Non-ASCII invisible chars (zero-width, BOM, etc.)
  if (/[\u200B\u200C\u200D\uFEFF\u00A0\u2000-\u200A]/.test(name)) {
    reportIssue('critical', `厂商名有隐藏Unicode字符: "${name}" (${m._count._all} products)`);
  }
  // Tab or newline
  if (/[\t\n\r]/.test(name)) {
    reportIssue('critical', `厂商名有制表符/换行: "${name}" (${m._count._all} products)`);
  }
  // HTML entities
  if (/&amp;|&lt;|&gt;|&quot;/.test(name)) {
    reportIssue('warn', `厂商名含HTML实体: "${name}" (${m._count._all} products)`);
  }
}
if (issueCount === 0) console.log('  ✅ 无隐藏字符/空白问题\n');
else console.log('');

// ============================================================
// CHECK 2: 型号中的异常字符
// ============================================================
console.log('=== CHECK 2: 产品型号异常字符 ===\n');
const startIssues2 = issueCount;

const badPNs = await p.$queryRaw`
  SELECT "partNumber", manufacturer 
  FROM "Product" 
  WHERE "partNumber" ~ '[^\x20-\x7E]'
  LIMIT 20
`;
if (badPNs.length > 0) {
  reportIssue('warn', `${badPNs.length}+ 个型号包含非ASCII字符`);
  for (const b of badPNs.slice(0, 5)) {
    const hex = [...b.partNumber].map(c => c.charCodeAt(0) > 127 ? `[U+${c.charCodeAt(0).toString(16).toUpperCase()}]` : c).join('');
    reportIssue('info', `  "${b.partNumber}" (${b.manufacturer}) → ${hex}`);
  }
}

// Empty part numbers
const emptyPNs = await p.product.count({ where: { partNumber: '' } });
if (emptyPNs > 0) reportIssue('critical', `${emptyPNs} 个空型号`);

// Very short part numbers (likely errors)
const shortPNs = await p.product.findMany({
  where: { partNumber: { not: '' } },
  select: { partNumber: true, manufacturer: true },
  orderBy: { partNumber: 'asc' }
});
const tooShort = shortPNs.filter(p => p.partNumber.length < 3);
if (tooShort.length > 0) {
  reportIssue('warn', `${tooShort.length} 个型号少于3个字符`);
  tooShort.slice(0, 10).forEach(p => reportIssue('info', `  "${p.partNumber}" (${p.manufacturer})`));
}

if (issueCount === startIssues2) console.log('  ✅ 型号格式正常\n');
else console.log('');

// ============================================================
// CHECK 3: 厂商名大小写不一致 (case-insensitive duplicates)
// ============================================================
console.log('=== CHECK 3: 大小写不一致的厂商名 ===\n');
const startIssues3 = issueCount;

const caseGroups = {};
for (const m of allMfrNames) {
  const key = m.manufacturer.toLowerCase();
  if (!caseGroups[key]) caseGroups[key] = [];
  caseGroups[key].push({ name: m.manufacturer, count: m._count._all });
}
for (const [, group] of Object.entries(caseGroups)) {
  if (group.length > 1) {
    const desc = group.map(g => `"${g.name}"(${g.count})`).join(' vs ');
    reportIssue('critical', `大小写重复: ${desc}`);
  }
}
if (issueCount === startIssues3) console.log('  ✅ 无大小写重复\n');
else console.log('');

// ============================================================
// CHECK 4: 厂商 Slug 碰撞检测（不同厂商名生成相同 URL slug）
// ============================================================
console.log('=== CHECK 4: 厂商 Slug 碰撞 ===\n');
const startIssues4 = issueCount;

function slugify(name) {
  return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const slugMap = {};
for (const m of allMfrNames) {
  const slug = slugify(m.manufacturer);
  if (!slugMap[slug]) slugMap[slug] = [];
  slugMap[slug].push({ name: m.manufacturer, count: m._count._all });
}
for (const [slug, group] of Object.entries(slugMap)) {
  if (group.length > 1) {
    const desc = group.map(g => `"${g.name}"(${g.count})`).join(' vs ');
    reportIssue('critical', `Slug碰撞 "/${slug}": ${desc}`);
  }
}
if (issueCount === startIssues4) console.log('  ✅ 无 Slug 碰撞\n');
else console.log('');

// ============================================================
// CHECK 5: 产品描述中厂商名与分配厂商矛盾
// ============================================================
console.log('=== CHECK 5: 描述与厂商矛盾检测 (抽样) ===\n');
const startIssues5 = issueCount;

// Sample: check if description says "by XXX" but manufacturer is different
const descChecks = [
  { mfr: 'Intel', descContains: 'by Altera', shouldBe: 'Altera' },
  { mfr: 'Microchip', descContains: 'by Atmel', shouldBe: 'Atmel' },
  { mfr: 'Analog Devices', descContains: 'by Maxim', shouldBe: 'Maxim' },
  { mfr: 'Analog Devices', descContains: 'by Linear Technology', shouldBe: 'Linear Technology' },
  { mfr: 'Onsemi', descContains: 'by Fairchild', shouldBe: 'Fairchild' },
  { mfr: 'Renesas', descContains: 'by Intersil', shouldBe: 'Intersil' },
  { mfr: 'Renesas', descContains: 'by IDT', shouldBe: 'IDT' },
  { mfr: 'Infineon Technologies', descContains: 'by Cypress', shouldBe: 'Cypress' },
  { mfr: 'Infineon Technologies', descContains: 'by International Rectifier', shouldBe: 'International Rectifier' },
  { mfr: 'NXP Semiconductors', descContains: 'by Freescale', shouldBe: 'Freescale' },
];

for (const check of descChecks) {
  const count = await p.product.count({
    where: {
      manufacturer: check.mfr,
      description: { contains: check.descContains, mode: 'insensitive' }
    }
  });
  if (count > 0) {
    const samples = await p.product.findMany({
      where: {
        manufacturer: check.mfr,
        description: { contains: check.descContains, mode: 'insensitive' }
      },
      select: { partNumber: true, description: true },
      take: 3
    });
    reportIssue('critical',
      `${count}x "${check.mfr}" 产品描述中含 "${check.descContains}" (应为 ${check.shouldBe})`,
      samples.map(s => s.partNumber)
    );
  }
}
if (issueCount === startIssues5) console.log('  ✅ 描述与厂商一致\n');
else console.log('');

// ============================================================
// CHECK 6: 产品页面标题/Meta 中厂商名不正确的风险
// 检查 generateProductMeta 使用的 manufacturer 字段
// ============================================================
console.log('=== CHECK 6: 空 manufacturer/description 统计 ===\n');

const noMfr = await p.$queryRaw`
  SELECT COUNT(*) as cnt FROM "Product" WHERE manufacturer IS NULL OR manufacturer = ''
`;
const noDesc = await p.product.count({ where: { description: '' } });
const nullDesc = await p.$queryRaw`
  SELECT COUNT(*) as cnt FROM "Product" WHERE description IS NULL
`;
console.log(`  空/NULL厂商: ${Number(noMfr[0]?.cnt || 0)}`);
console.log(`  空描述: ${noDesc}`);
console.log(`  NULL描述: ${Number(nullDesc[0]?.cnt || 0)}`);

// ============================================================
// CHECK 7: 产品型号碰撞（相同 partNumber 但不同产品）
// ============================================================
console.log('\n=== CHECK 7: partNumber 唯一性 ===\n');

const dupPNs = await p.$queryRaw`
  SELECT "partNumber", COUNT(*) as cnt 
  FROM "Product" 
  GROUP BY "partNumber" 
  HAVING COUNT(*) > 1 
  LIMIT 10
`;
if (dupPNs.length === 0) {
  console.log('  ✅ partNumber 全部唯一');
} else {
  for (const d of dupPNs) {
    reportIssue('critical', `重复型号 "${d.partNumber}" 出现 ${d.cnt} 次`);
  }
}

// ============================================================
// CHECK 8: 数据库中 Altera 产品是否都有合理型号
// ============================================================
console.log('\n=== CHECK 8: 品牌修复后的产品验证 ===\n');

const brandsToVerify = ['Altera', 'Atmel', 'Maxim Integrated', 'Linear Technology', 
  'Intersil', 'IDT', 'Fairchild Semiconductor', 'International Rectifier',
  'Cypress Semiconductor', 'Microsemi', 'Spansion', 'Xilinx'];

for (const brand of brandsToVerify) {
  const count = await p.product.count({ where: { manufacturer: brand } });
  // Get prefix distribution
  const samples = await p.product.findMany({
    where: { manufacturer: brand },
    select: { partNumber: true },
    take: 500
  });
  const prefixes = {};
  for (const s of samples) {
    const prefix = s.partNumber.substring(0, 3);
    prefixes[prefix] = (prefixes[prefix] || 0) + 1;
  }
  const topPrefixes = Object.entries(prefixes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([p, c]) => `${p}(${c})`)
    .join(', ');
  console.log(`  ${brand}: ${count.toLocaleString()} — Top: ${topPrefixes}`);
}

// ============================================================
// CHECK 9: Manufacturer 表完整性
// ============================================================
console.log('\n=== CHECK 9: Manufacturer 表与 Product 同步 ===\n');
const startIssues9 = issueCount;

const mfrTable = await p.manufacturer.findMany({ select: { name: true, slug: true } });
const mfrTableNames = new Set(mfrTable.map(m => m.name));
const productMfrs = new Set(allMfrNames.map(m => m.manufacturer));

const inProductOnly = [...productMfrs].filter(n => !mfrTableNames.has(n));
const inTableOnly = [...mfrTableNames].filter(n => !productMfrs.has(n));

if (inProductOnly.length > 0) {
  reportIssue('warn', `${inProductOnly.length} 个厂商在产品中但不在 Manufacturer 表`);
  for (const n of inProductOnly) {
    const c = allMfrNames.find(m => m.manufacturer === n)?._count._all || 0;
    if (c > 10) reportIssue('info', `  "${n}" (${c} products)`);
  }
}
if (inTableOnly.length > 0) {
  reportIssue('info', `${inTableOnly.length} 个厂商在 Manufacturer 表但无产品（可清理）`);
}
if (issueCount === startIssues9) console.log('  ✅ 完全同步\n');
else console.log('');

// ============================================================
// CHECK 10: 描述中包含错误的旧厂商名（数据库更新后描述未更新）
// ============================================================
console.log('\n=== CHECK 10: 描述中残留旧厂商名 ===\n');
const startIssues10 = issueCount;

const descMismatches = [
  { mfr: 'Altera', wrongDesc: 'by Intel', checkPrefix: ['EP', '5C', '10A', '10M'] },
  { mfr: 'Atmel', wrongDesc: 'by Microchip', checkPrefix: ['AT'] },
  { mfr: 'Linear Technology', wrongDesc: 'by Analog Devices', checkPrefix: ['LTC', 'LTM', 'LT1', 'LT3'] },
  { mfr: 'Maxim Integrated', wrongDesc: 'by Analog Devices', checkPrefix: ['MAX', 'DS'] },
  { mfr: 'Xilinx', wrongDesc: 'by AMD', checkPrefix: ['XC'] },
  { mfr: 'Cypress Semiconductor', wrongDesc: 'by Infineon', checkPrefix: ['CY'] },
  { mfr: 'Spansion', wrongDesc: 'by Infineon', checkPrefix: ['S25', 'S29'] },
  { mfr: 'Intersil', wrongDesc: 'by Renesas', checkPrefix: ['ISL'] },
  { mfr: 'Intersil', wrongDesc: 'by Analog', checkPrefix: ['ICL'] },
  { mfr: 'Fairchild Semiconductor', wrongDesc: 'by Onsemi', checkPrefix: ['FAN', 'FD'] },
  { mfr: 'International Rectifier', wrongDesc: 'by Infineon', checkPrefix: ['IRF'] },
  { mfr: 'IDT', wrongDesc: 'by Renesas', checkPrefix: ['IDT', '8V'] },
];

for (const check of descMismatches) {
  const count = await p.product.count({
    where: {
      manufacturer: check.mfr,
      description: { contains: check.wrongDesc, mode: 'insensitive' }
    }
  });
  if (count > 0) {
    const samples = await p.product.findMany({
      where: {
        manufacturer: check.mfr,
        description: { contains: check.wrongDesc, mode: 'insensitive' }
      },
      select: { partNumber: true, description: true },
      take: 3
    });
    reportIssue('warn',
      `${count}x "${check.mfr}" 描述含 "${check.wrongDesc}" (描述需更新)`,
      samples.map(s => `${s.partNumber}: "${s.description?.substring(0, 50)}..."`)
    );
  }
}
if (issueCount === startIssues10) console.log('  ✅ 描述中无残留旧名\n');
else console.log('');

// ============================================================
// CHECK 11: 产品页 URL 安全性（特殊字符会导致路由崩溃）
// ============================================================
console.log('\n=== CHECK 11: 产品 URL 安全性 ===\n');
const startIssues11 = issueCount;

// Check for part numbers that could break URLs
const dangerousPNs = await p.product.findMany({
  where: {
    OR: [
      { partNumber: { contains: '/' } },
      { partNumber: { contains: '\\' } },
      { partNumber: { contains: '?' } },
      { partNumber: { contains: '#' } },
      { partNumber: { contains: '%' } },
    ]
  },
  select: { partNumber: true, manufacturer: true },
  take: 20
});
if (dangerousPNs.length > 0) {
  reportIssue('warn', `${dangerousPNs.length} 个型号含 URL 危险字符 (/, \\, ?, #, %)`);
  dangerousPNs.slice(0, 5).forEach(p => reportIssue('info', `  "${p.partNumber}" (${p.manufacturer})`));
} else {
  console.log('  ✅ 所有型号 URL 安全');
}
console.log('');

// ============================================================
// CHECK 12: 厂商名 slug 与实际 Manufacturer 表 slug 一致性
// ============================================================
console.log('=== CHECK 12: productPath() slug vs Manufacturer 表 slug ===\n');
const startIssues12 = issueCount;

for (const mfr of mfrTable) {
  const expectedSlug = slugify(mfr.name);
  if (mfr.slug !== expectedSlug) {
    reportIssue('warn', `Manufacturer slug 不一致: "${mfr.name}" → 表中="${mfr.slug}" vs 计算="${expectedSlug}"`);
  }
}
if (issueCount === startIssues12) console.log('  ✅ Slug 一致\n');
else console.log('');

// ============================================================
// FINAL SUMMARY
// ============================================================
console.log('\n' + '='.repeat(80));
console.log(`  核查完成 — 发现 ${issueCount} 个问题`);
console.log('='.repeat(80) + '\n');

await p.$disconnect();
