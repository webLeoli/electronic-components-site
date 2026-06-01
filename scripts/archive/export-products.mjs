/**
 * FPGACenter — 产品数据批量导出 & 模板生成工具
 * 
 * 功能：
 * - 导出全部产品为 CSV
 * - 导出特定制造商/分类的产品
 * - 生成空 CSV 模板（含列名）
 * 
 * 用法：
 *   node scripts/export-products.mjs [options]
 * 
 * Options:
 *   --output=products.csv          输出文件名
 *   --manufacturer=STMicroelectronics  按制造商过滤
 *   --category=microcontrollers    按分类 slug 过滤
 *   --status=active|obsolete|eol   按状态过滤
 *   --template                     只生成空模板
 *   --format=csv|json              输出格式 (default: csv)
 */

import { writeFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    output: null,
    manufacturer: null,
    category: null,
    status: null,
    template: false,
    format: 'csv',
  };

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, val] = arg.substring(2).split('=');
      switch (key) {
        case 'output':       opts.output = val; break;
        case 'manufacturer': opts.manufacturer = val; break;
        case 'category':     opts.category = val; break;
        case 'status':       opts.status = val; break;
        case 'template':     opts.template = true; break;
        case 'format':       opts.format = val; break;
      }
    }
  }

  if (!opts.output) {
    opts.output = opts.template ? 'import-template.csv' : `export_${Date.now()}.${opts.format}`;
  }

  return opts;
}

const CSV_HEADERS = [
  'partNumber', 'manufacturer', 'description', 'category',
  'packageType', 'mountType', 'status', 'minPrice',
  'stock', 'moq', 'leadTime', 'datasheet', 'imageUrl', 'specs'
];

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function productToCSVRow(product) {
  return [
    product.partNumber,
    product.manufacturer,
    product.description,
    product.category?.name || '',
    product.packageType,
    product.mountType,
    product.status,
    product.minPrice,
    product.stock,
    product.moq,
    product.leadTime,
    product.datasheet,
    product.imageUrl,
    product.specs,
  ].map(escapeCSV).join(',');
}

async function main() {
  const opts = parseArgs();

  // Template mode
  if (opts.template) {
    const content = CSV_HEADERS.join(',') + '\n'
      + 'STM32F103C8T6,STMicroelectronics,"ARM Cortex-M3 MCU, 72MHz",Microcontrollers,LQFP-48,SMD,Active,2.85,15000,1,1-3 days,,,"{\\"Core\\":\\"ARM Cortex-M3\\",\\"Speed\\":\\"72MHz\\"}"\n';
    
    writeFileSync(opts.output, '\uFEFF' + content, 'utf-8'); // BOM for Excel compatibility
    console.log(`📋 Template saved: ${opts.output}`);
    console.log(`   Columns: ${CSV_HEADERS.join(', ')}`);
    await prisma.$disconnect();
    return;
  }

  // Build query
  const where = {};
  if (opts.manufacturer) where.manufacturer = opts.manufacturer;
  if (opts.status) where.status = opts.status;
  if (opts.category) {
    const cat = await prisma.category.findUnique({ where: { slug: opts.category } });
    if (cat) where.categoryId = cat.id;
    else {
      console.error(`❌ Category slug not found: ${opts.category}`);
      await prisma.$disconnect();
      return;
    }
  }

  const count = await prisma.product.count({ where });
  console.log(`📦 Exporting ${count} products...`);

  // Stream in batches to handle large datasets
  const BATCH = 1000;
  let offset = 0;
  const rows = [CSV_HEADERS.join(',')];

  while (offset < count) {
    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { partNumber: 'asc' },
      skip: offset,
      take: BATCH,
    });

    for (const p of products) {
      if (opts.format === 'json') {
        rows.push(JSON.stringify(p));
      } else {
        rows.push(productToCSVRow(p));
      }
    }

    offset += BATCH;
    process.stdout.write(`\r  Exported ${Math.min(offset, count)}/${count}`);
  }

  console.log('');

  if (opts.format === 'json') {
    writeFileSync(opts.output, '[\n' + rows.slice(1).join(',\n') + '\n]', 'utf-8');
  } else {
    writeFileSync(opts.output, '\uFEFF' + rows.join('\n') + '\n', 'utf-8');
  }

  console.log(`✅ Exported to: ${opts.output}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
