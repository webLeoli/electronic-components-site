import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

console.log('='.repeat(80));
console.log('  第六轮穷尽核查 — 全新角度');
console.log('='.repeat(80) + '\n');

let issues = 0;

// ============================================================
// A. 反向检查：从描述中提取真实厂商名，与 manufacturer 字段对比
// ============================================================
console.log('=== A. 反向描述验证（从描述提取厂商名与字段对比）===\n');

const descPatterns = [
  { regex: /by (Intel)[,. ]/, brand: 'Intel' },
  { regex: /by (Microchip)[,. ]/, brand: 'Microchip' },
  { regex: /by (Analog Devices)[,. ]/, brand: 'Analog Devices' },
  { regex: /by (Renesas)[,. ]/, brand: 'Renesas' },
  { regex: /by (Infineon)[,. ]/, brand: 'Infineon' },
  { regex: /by (Onsemi|ON Semiconductor)[,. ]/i, brand: 'Onsemi' },
  { regex: /by (AMD)[,. ]/, brand: 'AMD' },
  { regex: /by (NXP)[,. ]/, brand: 'NXP' },
  { regex: /by (STMicroelectronics|STM)[,. ]/i, brand: 'STMicroelectronics' },
];

// Instead of checking all 720K, check specific at-risk brands
const riskBrands = [
  'Altera', 'Atmel', 'Linear Technology', 'Maxim Integrated',
  'Xilinx', 'Cypress Semiconductor', 'Spansion', 'Intersil',
  'Fairchild Semiconductor', 'International Rectifier', 'IDT',
  'Microsemi', 'ISSI',
];

for (const brand of riskBrands) {
  // Sample 100 products and verify their descriptions
  const samples = await p.product.findMany({
    where: { manufacturer: brand },
    select: { partNumber: true, description: true, manufacturer: true },
    take: 200,
  });
  
  let wrongCount = 0;
  const wrongSamples = [];
  
  for (const prod of samples) {
    if (!prod.description) continue;
    for (const pat of descPatterns) {
      const match = prod.description.match(pat.regex);
      if (match && pat.brand !== brand && !brand.includes(pat.brand)) {
        wrongCount++;
        if (wrongSamples.length < 2) {
          wrongSamples.push(`${prod.partNumber}: "...${prod.description.substring(0, 70)}..."`);
        }
        break;
      }
    }
  }
  
  if (wrongCount > 0) {
    issues++;
    console.log(`  🔴 ${brand}: ${wrongCount}/${samples.length} 个样本描述含错误厂商名`);
    wrongSamples.forEach(s => console.log(`     ${s}`));
  } else {
    console.log(`  ✅ ${brand}: ${samples.length} 个样本 — 描述正确`);
  }
}

// ============================================================
// B. 完全反向：查所有描述含"by Altera"的产品是否都在 Altera 下
// ============================================================
console.log('\n=== B. 反向一致性（描述说是X品牌，manufacturer字段也应该是X）===\n');

const reverseChecks = [
  ['by Altera,', 'Altera'],
  ['by Atmel,', 'Atmel'],
  ['by Linear Technology,', 'Linear Technology'],
  ['by Maxim Integrated', 'Maxim Integrated'],
  ['by Xilinx,', 'Xilinx'],
  ['by Cypress Semiconductor,', 'Cypress Semiconductor'],
  ['by Spansion,', 'Spansion'],
  ['by Intersil,', 'Intersil'],
  ['by Fairchild Semiconductor,', 'Fairchild Semiconductor'],
  ['by International Rectifier,', 'International Rectifier'],
  ['by IDT,', 'IDT'],
];

for (const [descText, expectedMfr] of reverseChecks) {
  const mismatched = await p.product.findMany({
    where: {
      description: { contains: descText },
      NOT: { manufacturer: expectedMfr },
    },
    select: { partNumber: true, manufacturer: true, description: true },
    take: 5,
  });
  
  if (mismatched.length > 0) {
    // Count total
    const totalMismatch = await p.product.count({
      where: {
        description: { contains: descText },
        NOT: { manufacturer: expectedMfr },
      },
    });
    issues++;
    console.log(`  🔴 ${totalMismatch}x 描述含"${descText}"但厂商非 ${expectedMfr}:`);
    mismatched.forEach(m => console.log(`     "${m.partNumber}" → 厂商="${m.manufacturer}"`));
  } else {
    console.log(`  ✅ "${descText}" — 所有匹配产品都在 ${expectedMfr} 下`);
  }
}

// ============================================================
// C. 描述中完全没有任何厂商引用的产品 — SEO 质量检查
// ============================================================
console.log('\n=== C. 无描述/极短描述产品 ===\n');

const nullDesc = await p.$queryRaw`SELECT COUNT(*)::int as cnt FROM "Product" WHERE description IS NULL`;
const emptyDesc = await p.product.count({ where: { description: '' } });
const shortDesc = await p.product.count({ where: { description: { not: '' } } });
// Count descriptions shorter than 20 chars
const veryShort = await p.$queryRaw`SELECT COUNT(*)::int as cnt FROM "Product" WHERE description IS NOT NULL AND length(description) < 20 AND description != ''`;

console.log(`  NULL 描述: ${nullDesc[0].cnt}`);
console.log(`  空描述: ${emptyDesc}`);
console.log(`  极短描述(<20字符): ${veryShort[0].cnt}`);

// ============================================================
// D. 每个厂商的前5个产品抽样展示（供人工目视检查）
// ============================================================
console.log('\n=== D. 核心厂商产品抽样目视检查 ===\n');

const topBrands = [
  'Rochester Electronics', 'Texas Instruments', 'Renesas', 'Microchip',
  'Torex Semiconductor', 'Maxim Integrated', 'Linear Technology',
  'Altera', 'Xilinx', 'Atmel', 'Cypress Semiconductor', 'Spansion',
  'Intersil', 'IDT', 'Fairchild Semiconductor', 'International Rectifier',
  'Microsemi', 'Analog Devices', 'Lattice Semiconductor',
];

for (const brand of topBrands) {
  const count = await p.product.count({ where: { manufacturer: brand } });
  const samples = await p.product.findMany({
    where: { manufacturer: brand },
    select: { partNumber: true, description: true },
    take: 3,
    orderBy: { partNumber: 'asc' },
  });
  console.log(`\n  【${brand}】 (${count.toLocaleString()} products)`);
  for (const s of samples) {
    const desc = (s.description || '无描述').substring(0, 80);
    console.log(`    ${s.partNumber} → ${desc}`);
  }
}

// ============================================================
// E. 厂商总数统计，按数量排名
// ============================================================
console.log('\n\n=== E. 厂商排名 Top 30 ===\n');

const ranking = await p.product.groupBy({
  by: ['manufacturer'],
  _count: { _all: true },
  orderBy: { _count: { manufacturer: 'desc' } },
  take: 30,
});
const total = await p.product.count();
const mfrCount = (await p.product.groupBy({ by: ['manufacturer'] })).length;

console.log(`总产品: ${total.toLocaleString()} | 厂商: ${mfrCount}\n`);
for (const r of ranking) {
  const pct = ((r._count._all / total) * 100).toFixed(1);
  console.log(`  ${r._count._all.toString().padStart(7)}  (${pct.padStart(4)}%)  ${r.manufacturer}`);
}

// ============================================================
// F. 最后检查：是否有"描述中提到另一个品牌但没有修正"
// ============================================================
console.log('\n=== F. 全面描述品牌泄露扫描 ===\n');

const leakChecks = [
  { mfr: 'Altera', leakText: 'Intel' },
  { mfr: 'Atmel', leakText: 'Microchip' },
  { mfr: 'Linear Technology', leakText: 'Analog Devices' },
  { mfr: 'Maxim Integrated', leakText: 'Analog Devices' },
  { mfr: 'Xilinx', leakText: 'AMD' },
  { mfr: 'Cypress Semiconductor', leakText: 'Infineon' },
  { mfr: 'Spansion', leakText: 'Infineon' },
  { mfr: 'Intersil', leakText: 'Renesas' },
  { mfr: 'Fairchild Semiconductor', leakText: 'Onsemi' },
  { mfr: 'International Rectifier', leakText: 'Infineon' },
  { mfr: 'IDT', leakText: 'Renesas' },
];

for (const check of leakChecks) {
  const count = await p.product.count({
    where: {
      manufacturer: check.mfr,
      description: { contains: check.leakText, mode: 'insensitive' },
    },
  });
  if (count > 0) {
    const samples = await p.product.findMany({
      where: {
        manufacturer: check.mfr,
        description: { contains: check.leakText, mode: 'insensitive' },
      },
      select: { partNumber: true, description: true },
      take: 3,
    });
    issues++;
    console.log(`  🔴 ${check.mfr}: ${count}x 描述仍含 "${check.leakText}"`);
    samples.forEach(s => console.log(`     ${s.partNumber}: "${s.description?.substring(0, 80)}..."`));
  } else {
    console.log(`  ✅ ${check.mfr}: 描述中无 "${check.leakText}" 泄露`);
  }
}

console.log('\n' + '='.repeat(80));
console.log(`  核查完成 — ${issues === 0 ? '✅ 零问题！数据完全一致' : `发现 ${issues} 个问题`}`);
console.log('='.repeat(80));

await p.$disconnect();
