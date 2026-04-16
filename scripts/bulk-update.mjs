/**
 * FPGACenter — 产品批量更新工具
 * 
 * 只更新现有产品的特定字段（不创建新产品）
 * 适用于：批量更新价格、批量更新库存、批量改状态
 * 
 * 用法：
 *   node scripts/bulk-update.mjs <csv-file> [options]
 * 
 * CSV 必须包含 partNumber 列
 * 只有 CSV 中有值的列会被更新（空单元格跳过）
 * 
 * Options:
 *   --dry-run              预检模式
 *   --fields=price,stock   限制只更新这些字段
 *   --batch-size=500       批量大小
 *   --log-file=update.log  日志文件
 * 
 * 场景示例：
 *   批量更新价格:  准备只有 partNumber + price 的 CSV
 *   批量改状态:    准备只有 partNumber + status 的 CSV
 *   批量更新库存:  准备只有 partNumber + stock 的 CSV
 */

import { createReadStream, existsSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Reuse parsing utilities from import tool
function detectAndCleanBOM(line) {
  if (line.charCodeAt(0) === 0xFEFF) return line.substring(1);
  if (line.startsWith('\uFEFF') || line.startsWith('ï»¿')) return line.replace(/^\uFEFF|^ï»¿/, '');
  return line;
}

function parseCSVLine(line, delimiter = ',') {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = false;
      } else current += char;
    } else {
      if (char === '"') inQuotes = true;
      else if (char === delimiter) { fields.push(current.trim()); current = ''; }
      else current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function detectDelimiter(line) {
  const cleaned = detectAndCleanBOM(line);
  let best = ',', maxCount = 0;
  for (const d of [',', ';', '\t', '|']) {
    const count = parseCSVLine(cleaned, d).length;
    if (count > maxCount) { maxCount = count; best = d; }
  }
  return best;
}

// Column aliases (same as import tool)
const ALIASES = {
  partNumber:   ['partNumber', 'part_number', 'PartNumber', 'Part Number', 'part', 'MPN', 'mpn', 'pn', 'PN'],
  manufacturer: ['manufacturer', 'Manufacturer', 'mfr', 'brand'],
  description:  ['description', 'Description', 'desc', 'name'],
  categorySlug: ['category', 'Category', 'cat', 'type'],
  packageType:  ['package', 'Package', 'packageType'],
  mountType:    ['mount', 'Mount', 'mountType'],
  status:       ['status', 'Status', 'lifecycle'],
  minPrice:     ['price', 'Price', 'minPrice', 'unit_price'],
  stock:        ['stock', 'Stock', 'qty', 'quantity', 'inventory'],
  moq:          ['moq', 'MOQ', 'min_qty'],
  leadTime:     ['leadTime', 'lead_time', 'delivery'],
  datasheet:    ['datasheet', 'Datasheet'],
  imageUrl:     ['image', 'imageUrl', 'image_url'],
};

function buildMapping(headers) {
  const mapping = {};
  const normed = headers.map(h => h.replace(/^["']|["']$/g, '').trim());
  for (const [field, names] of Object.entries(ALIASES)) {
    for (const alias of names) {
      const idx = normed.findIndex(h => h.toLowerCase() === alias.toLowerCase());
      if (idx !== -1) { mapping[field] = idx; break; }
    }
  }
  return { mapping, headers: normed };
}

// Value parsers
function parsePrice(val) {
  if (!val || val === '') return undefined; // undefined = don't update
  const s = String(val).replace(/[$€£¥￥,\s]/g, '');
  if (/^(n\/a|rfq|call|contact|-)$/i.test(s)) return null;
  const num = parseFloat(s);
  return (!isNaN(num) && num >= 0 && num < 999999) ? Math.round(num * 10000) / 10000 : undefined;
}

function parseStock(val) {
  if (!val || val === '') return undefined;
  const s = String(val).replace(/[,\s+]/g, '');
  if (/^(in.?stock|yes|available)/i.test(s)) return 1;
  if (/^(out|no|unavailable|0|contact)/i.test(s)) return 0;
  const num = parseInt(s);
  return (!isNaN(num) && num >= 0) ? Math.min(num, 99999999) : undefined;
}

function parseMOQ(val) {
  if (!val || val === '') return undefined;
  const num = parseInt(String(val).replace(/[,\s]/g, ''));
  return (!isNaN(num) && num >= 1) ? Math.min(num, 1000000) : undefined;
}

function normalizeStatus(val) {
  if (!val || val === '') return undefined;
  const s = String(val).trim().toLowerCase();
  if (/^(active|act|production|current)/.test(s)) return 'active';
  if (/^(obsolete|obs|discontinued)/.test(s)) return 'obsolete';
  if (/^(eol|end.?of.?life)/.test(s)) return 'eol';
  if (/^(nrnd|not.?recommended|last.?buy)/.test(s)) return 'nrnd';
  return undefined;
}

function cleanString(val, maxLen = 1000) {
  if (!val || val === '') return undefined;
  let s = String(val).trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').replace(/\s+/g, ' ');
  return s.length > 0 ? s.substring(0, maxLen) : undefined;
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const opts = { file: null, dryRun: false, fields: null, batchSize: 500, logFile: null };

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.substring(2).split('=');
      switch (k) {
        case 'dry-run':    opts.dryRun = true; break;
        case 'fields':     opts.fields = v.split(',').map(f => f.trim()); break;
        case 'batch-size': opts.batchSize = parseInt(v) || 500; break;
        case 'log-file':   opts.logFile = v; break;
      }
    } else if (!opts.file) opts.file = arg;
  }

  if (!opts.file || !existsSync(opts.file)) {
    console.error('Usage: node scripts/bulk-update.mjs <file.csv> [--dry-run] [--fields=price,stock]');
    process.exit(1);
  }

  opts.logFile = opts.logFile || `bulk_update_${Date.now()}.log`;

  console.log(`\n${'='.repeat(50)}`);
  console.log(`  Bulk Update Tool${opts.dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`  File: ${opts.file}`);
  if (opts.fields) console.log(`  Restricted fields: ${opts.fields.join(', ')}`);
  console.log(`${'='.repeat(50)}\n`);

  const fileStream = createReadStream(opts.file, { encoding: 'utf-8' });
  const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNumber = 0;
  let headerMapping = null;
  let delimiter = null;
  const stats = { total: 0, updated: 0, notFound: 0, skipped: 0, errors: 0 };
  const errorLines = [];
  const startTime = Date.now();

  for await (let line of rl) {
    lineNumber++;

    if (lineNumber === 1) {
      line = detectAndCleanBOM(line);
      delimiter = detectDelimiter(line);
      const result = buildMapping(parseCSVLine(line, delimiter));
      headerMapping = result.mapping;

      if (headerMapping.partNumber === undefined) {
        console.error('FATAL: No partNumber column found!');
        process.exit(1);
      }

      console.log('Column mapping:');
      for (const [f, idx] of Object.entries(headerMapping)) {
        console.log(`  ${f.padEnd(15)} -> col ${idx} (${result.headers[idx]})`);
      }
      console.log('');
      continue;
    }

    if (!line.trim()) continue;
    stats.total++;

    const fields = parseCSVLine(line, delimiter);
    const rawPN = fields[headerMapping.partNumber] || '';
    const partNumber = rawPN.trim().toUpperCase().replace(/[\x00-\x1F\x7F\u200B-\u200D\uFEFF]/g, '').replace(/^["']+|["']+$/g, '');

    if (!partNumber || !/[A-Z0-9]{2,}/.test(partNumber)) {
      errorLines.push(`Row ${lineNumber}: Invalid partNumber "${rawPN}"`);
      stats.errors++;
      continue;
    }

    // Build update data
    const getField = (name) => {
      const idx = headerMapping[name];
      return idx !== undefined && idx < fields.length ? fields[idx] : '';
    };

    const updateData = {};
    const isAllowed = (f) => !opts.fields || opts.fields.includes(f);

    if (isAllowed('manufacturer')) { const v = cleanString(getField('manufacturer'), 200); if (v !== undefined) updateData.manufacturer = v; }
    if (isAllowed('description')) { const v = cleanString(getField('description'), 2000); if (v !== undefined) updateData.description = v; }
    if (isAllowed('packageType')) { const v = cleanString(getField('packageType'), 100); if (v !== undefined) updateData.packageType = v; }
    if (isAllowed('mountType'))   { const v = cleanString(getField('mountType'), 20); if (v !== undefined) updateData.mountType = v; }
    if (isAllowed('status'))      { const v = normalizeStatus(getField('status')); if (v !== undefined) updateData.status = v; }
    if (isAllowed('price'))       { const v = parsePrice(getField('minPrice')); if (v !== undefined) updateData.minPrice = v; }
    if (isAllowed('stock'))       { const v = parseStock(getField('stock')); if (v !== undefined) updateData.stock = v; }
    if (isAllowed('moq'))         { const v = parseMOQ(getField('moq')); if (v !== undefined) updateData.moq = v; }
    if (isAllowed('leadTime'))    { const v = cleanString(getField('leadTime'), 100); if (v !== undefined) updateData.leadTime = v; }
    if (isAllowed('datasheet'))   { const v = cleanString(getField('datasheet'), 500); if (v !== undefined) updateData.datasheet = v; }
    if (isAllowed('imageUrl'))    { const v = cleanString(getField('imageUrl'), 500); if (v !== undefined) updateData.imageUrl = v; }

    if (Object.keys(updateData).length === 0) {
      stats.skipped++;
      continue;
    }

    if (opts.dryRun) {
      console.log(`  [DRY] ${partNumber}: ${JSON.stringify(updateData)}`);
      stats.updated++;
      continue;
    }

    try {
      const result = await prisma.product.updateMany({
        where: { partNumber },
        data: updateData,
      });

      if (result.count > 0) {
        stats.updated++;
      } else {
        stats.notFound++;
        errorLines.push(`Row ${lineNumber}: Part not found: ${partNumber}`);
      }
    } catch (e) {
      stats.errors++;
      errorLines.push(`Row ${lineNumber}: DB error for ${partNumber}: ${e.message}`);
    }

    // Progress
    if (stats.total % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`\r  Processed ${stats.total} rows... (${elapsed}s)`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n${'='.repeat(50)}`);
  console.log(`  Update Complete (${elapsed}s)`);
  console.log(`${'='.repeat(50)}`);
  console.log(`  Total rows:   ${stats.total}`);
  console.log(`  Updated:      ${stats.updated}`);
  console.log(`  Not found:    ${stats.notFound}`);
  console.log(`  Skipped:      ${stats.skipped}`);
  console.log(`  Errors:       ${stats.errors}`);

  if (errorLines.length > 0) {
    writeFileSync(opts.logFile, errorLines.join('\n'), 'utf-8');
    console.log(`  Log file:     ${opts.logFile}`);
  }
  console.log(`${'='.repeat(50)}\n`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
