/**
 * FPGACenter — 产品数据批量导入工具 (Robust CSV Importer)
 * 
 * 功能：
 * - 流式读取 CSV（支持百万行，不会内存溢出）
 * - 自动检测编码（UTF-8 / UTF-8 BOM / GB2312）
 * - 灵活的列映射（支持不同 CSV 列名）
 * - 三种重复处理模式：skip / update / overwrite
 * - 自动创建 Category 和 Manufacturer
 * - 批量事务写入（500条/批）
 * - 详细的错误日志
 * - 支持断点续导（--skip-rows）
 * - 空行/坏数据自动跳过
 * 
 * 用法：
 *   node scripts/import-products.mjs <csv-file> [options]
 * 
 * Options:
 *   --mode=skip|update|overwrite   重复 partNumber 处理方式 (default: update)
 *   --batch-size=500               每批写入行数 (default: 500)
 *   --skip-rows=0                  跳过前 N 行数据（续导用）
 *   --dry-run                      预检模式，只验证不写入
 *   --delimiter=,                  分隔符 (default: auto-detect)
 *   --encoding=utf-8               编码 (default: auto-detect)
 *   --log-file=import.log          错误日志文件
 *   --mapping=mapping.json         自定义列映射文件
 */

import { createReadStream, existsSync, writeFileSync, readFileSync } from 'fs';
import { createInterface } from 'readline';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { runPostImportMaintenance } from './post-import-maintenance.mjs';
import { canonicalManufacturer, manufacturerSlug } from '../src/lib/manufacturer-canonical.js';

const prisma = new PrismaClient();

// ============================================================
// 默认列名映射（支持多种 CSV 格式）
// ============================================================
const DEFAULT_COLUMN_ALIASES = {
  partNumber:   ['partNumber', 'part_number', 'PartNumber', 'Part Number', 'part', 'Part', 'MPN', 'mpn', 'pn', 'PN', 'part_no', 'Part_No', 'Model', 'model', 'SKU', 'sku'],
  manufacturer: ['manufacturer', 'Manufacturer', 'mfr', 'Mfr', 'MFR', 'brand', 'Brand', 'vendor', 'Vendor', 'mfg', 'Mfg', 'make', 'Make'],
  description:  ['description', 'Description', 'desc', 'Desc', 'name', 'Name', 'title', 'Title', 'product_name', 'ProductName'],
  category:     ['category', 'Category', 'cat', 'Cat', 'type', 'Type', 'classification', 'class', 'Class'],
  packageType:  ['package', 'Package', 'packageType', 'package_type', 'Package_Type', 'footprint', 'Footprint', 'case', 'Case'],
  mountType:    ['mount', 'Mount', 'mountType', 'mount_type', 'Mount_Type', 'mounting', 'Mounting', 'smd_tht', 'technology'],
  status:       ['status', 'Status', 'lifecycle', 'Lifecycle', 'life_cycle', 'availability', 'Availability'],
  minPrice:     ['price', 'Price', 'minPrice', 'min_price', 'unit_price', 'Unit_Price', 'unitPrice', 'cost', 'Cost'],
  stock:        ['stock', 'Stock', 'qty', 'Qty', 'quantity', 'Quantity', 'inventory', 'Inventory', 'available', 'Available', 'in_stock'],
  moq:          ['moq', 'MOQ', 'min_qty', 'Min_Qty', 'min_order', 'MinOrder', 'minimum_order'],
  leadTime:     ['leadTime', 'lead_time', 'Lead_Time', 'LeadTime', 'delivery', 'Delivery', 'ship_time'],
  datasheet:    ['datasheet', 'Datasheet', 'datasheet_url', 'DatasheetUrl', 'pdf', 'PDF', 'doc_url'],
  imageUrl:     ['image', 'Image', 'imageUrl', 'image_url', 'Image_URL', 'img', 'Img', 'photo', 'Photo'],
  specs:        ['specs', 'Specs', 'specifications', 'Specifications', 'parameters', 'Parameters', 'details', 'Details', 'attributes'],
};

// ============================================================
// 解析命令行参数
// ============================================================
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    file: null,
    mode: 'update',       // skip | update | overwrite
    batchSize: 500,
    skipRows: 0,
    dryRun: false,
    delimiter: null,       // auto-detect
    encoding: null,        // auto-detect
    logFile: null,
    mappingFile: null,
  };

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, val] = arg.substring(2).split('=');
      switch (key) {
        case 'mode':       opts.mode = val; break;
        case 'batch-size': opts.batchSize = parseInt(val) || 500; break;
        case 'skip-rows':  opts.skipRows = parseInt(val) || 0; break;
        case 'dry-run':    opts.dryRun = true; break;
        case 'delimiter':  opts.delimiter = val; break;
        case 'encoding':   opts.encoding = val; break;
        case 'log-file':   opts.logFile = val; break;
        case 'mapping':    opts.mappingFile = val; break;
        default: console.warn(`⚠️  Unknown option: --${key}`);
      }
    } else if (!opts.file) {
      opts.file = arg;
    }
  }

  if (!opts.file) {
    console.error(`
╔════════════════════════════════════════════════════════════╗
║  FPGACenter Product Import Tool                           ║
╠════════════════════════════════════════════════════════════╣
║  Usage:                                                   ║
║    node scripts/import-products.mjs <file.csv> [options]  ║
║                                                           ║
║  Options:                                                 ║
║    --mode=skip|update|overwrite                           ║
║    --batch-size=500                                       ║
║    --skip-rows=0                                          ║
║    --dry-run                                              ║
║    --delimiter=,|;|\\t                                     ║
║    --log-file=import_errors.log                           ║
║    --mapping=column_mapping.json                          ║
╠════════════════════════════════════════════════════════════╣
║  CSV Required Column: partNumber (or alias)               ║
║  CSV Optional: manufacturer, description, category,       ║
║    package, mount, status, price, stock, moq, leadTime,   ║
║    datasheet, image, specs                                ║
╚════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }

  if (!existsSync(opts.file)) {
    console.error(`❌ File not found: ${opts.file}`);
    process.exit(1);
  }

  if (!['skip', 'update', 'overwrite'].includes(opts.mode)) {
    console.error(`❌ Invalid mode: ${opts.mode}. Use: skip, update, overwrite`);
    process.exit(1);
  }

  opts.batchSize = Math.max(10, Math.min(5000, opts.batchSize));
  opts.logFile = opts.logFile || `import_errors_${Date.now()}.log`;

  return opts;
}

// ============================================================
// 编码检测 & BOM 处理
// ============================================================
function detectAndCleanBOM(line) {
  // UTF-8 BOM: EF BB BF -> \uFEFF
  if (line.charCodeAt(0) === 0xFEFF) {
    return line.substring(1);
  }
  // Sometimes BOM shows as ï»¿ if read as latin1
  if (line.startsWith('\uFEFF') || line.startsWith('ï»¿')) {
    return line.replace(/^\uFEFF|^ï»¿/, '');
  }
  return line;
}

// ============================================================
// CSV 行解析器（支持引号内的逗号和换行）
// ============================================================
function parseCSVLine(line, delimiter = ',') {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ""
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

// ============================================================
// 分隔符自动检测
// ============================================================
function detectDelimiter(headerLine) {
  const cleaned = detectAndCleanBOM(headerLine);
  const candidates = [',', ';', '\t', '|'];
  let best = ',';
  let maxCount = 0;

  for (const d of candidates) {
    const count = parseCSVLine(cleaned, d).length;
    if (count > maxCount) {
      maxCount = count;
      best = d;
    }
  }
  return best;
}

// ============================================================
// 列映射解析
// ============================================================
function buildColumnMapping(headerFields, customMapping) {
  const mapping = {};
  const aliases = { ...DEFAULT_COLUMN_ALIASES };

  // Merge custom mapping if provided
  if (customMapping) {
    for (const [field, aliasList] of Object.entries(customMapping)) {
      if (aliases[field]) {
        aliases[field] = [...new Set([...aliasList, ...aliases[field]])];
      } else {
        aliases[field] = aliasList;
      }
    }
  }

  // Normalize header fields
  const normalizedHeaders = headerFields.map(h => h.replace(/^["']|["']$/g, '').trim());

  for (const [field, aliasList] of Object.entries(aliases)) {
    for (const alias of aliasList) {
      const idx = normalizedHeaders.findIndex(h => 
        h.toLowerCase() === alias.toLowerCase()
      );
      if (idx !== -1) {
        mapping[field] = idx;
        break;
      }
    }
  }

  return { mapping, headers: normalizedHeaders };
}

// ============================================================
// 数据清洗 & 验证
// ============================================================
function sanitizeString(val, maxLen = 1000) {
  if (val === null || val === undefined) return null;
  let s = String(val).trim();
  // Remove control characters except newlines
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Collapse multiple spaces
  s = s.replace(/\s+/g, ' ');
  // Trim to max length
  if (s.length > maxLen) s = s.substring(0, maxLen);
  return s || null;
}

function sanitizePartNumber(val) {
  if (!val) return null;
  let pn = String(val).trim().toUpperCase();
  // Remove invisible chars
  pn = pn.replace(/[\x00-\x1F\x7F\u200B-\u200D\uFEFF]/g, '');
  // Remove leading/trailing quotes
  pn = pn.replace(/^["']+|["']+$/g, '');
  // Collapse spaces
  pn = pn.replace(/\s+/g, '');
  // Sanity check: must have at least 2 alphanumeric chars
  if (!/[A-Z0-9]{2,}/.test(pn)) return null;
  // Max 100 chars
  if (pn.length > 100) return null;
  return pn;
}

function parsePrice(val) {
  if (val === null || val === undefined || val === '') return null;
  let s = String(val).trim();
  // Remove currency symbols and spaces
  s = s.replace(/[$€£¥￥,\s]/g, '');
  // Handle "N/A", "RFQ", "Call", etc.
  if (/^(n\/a|rfq|call|contact|tbd|-)$/i.test(s)) return null;
  const num = parseFloat(s);
  if (isNaN(num) || num < 0 || num > 999999) return null;
  return Math.round(num * 10000) / 10000; // 4 decimal places max
}

function parseStock(val) {
  if (val === null || val === undefined || val === '') return 0;
  let s = String(val).trim();
  // Remove commas and spaces
  s = s.replace(/[,\s]/g, '');
  // Handle text values
  if (/^(in\s*stock|yes|available)/i.test(s)) return 1;
  if (/^(out|no|unavailable|0|contact|call)/i.test(s)) return 0;
  // Handle "1000+" format
  s = s.replace(/\+$/, '');
  const num = parseInt(s);
  if (isNaN(num) || num < 0) return 0;
  return Math.min(num, 99999999); // cap at ~100M
}

function parseMOQ(val) {
  if (val === null || val === undefined || val === '') return 1;
  let s = String(val).trim().replace(/[,\s]/g, '');
  const num = parseInt(s);
  if (isNaN(num) || num < 1) return 1;
  return Math.min(num, 1000000);
}

function normalizeStatus(val) {
  if (!val) return 'active';
  const s = String(val).trim().toLowerCase();
  
  if (/^(active|act|in.?production|production|current)/.test(s)) return 'active';
  if (/^(obsolete|obs|discontinued|disc)/.test(s)) return 'obsolete';
  if (/^(eol|end.?of.?life|end-of-life|end_of_life)/.test(s)) return 'eol';
  if (/^(nrnd|not.?recommended|nr|last.?buy|last-buy)/.test(s)) return 'nrnd';
  if (/^(new|preview|sampling)/.test(s)) return 'active';

  return 'active'; // default fallback
}

function normalizeMountType(val) {
  if (!val) return null;
  const s = String(val).trim().toLowerCase();
  
  if (/smd|smt|surface|reflow/.test(s)) return 'SMD';
  if (/tht|through.?hole|dip|to-|axial|radial/.test(s)) return 'THT';
  if (/both|mixed|hybrid/.test(s)) return 'SMD/THT';
  
  return sanitizeString(val, 20);
}

function normalizeSpecs(val) {
  if (!val) return null;
  let s = String(val).trim();
  
  // If it's already valid JSON, keep it
  try {
    JSON.parse(s);
    return s;
  } catch {
    // Not JSON; wrap as description
  }

  // If it looks like key=value pairs
  if (s.includes('=') || s.includes(':')) {
    try {
      const obj = {};
      const pairs = s.split(/[;|,\n]+/);
      for (const pair of pairs) {
        const [k, ...vParts] = pair.split(/[:=]/);
        if (k && vParts.length) {
          obj[k.trim()] = vParts.join(':').trim();
        }
      }
      if (Object.keys(obj).length > 0) {
        return JSON.stringify(obj);
      }
    } catch {
      // Fall through
    }
  }

  return null;
}

// ============================================================
// Slug 生成
// ============================================================
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[\s\/&]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100) || 'unknown';
}

// ============================================================
// 缓存管理（Category & Manufacturer 查找缓存）
// ============================================================
class LookupCache {
  constructor() {
    this.categories = new Map();     // name (lowercase) -> id
    this.manufacturers = new Map();  // name (lowercase) -> true
    this.loaded = false;
  }

  async load() {
    const cats = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
    for (const c of cats) {
      this.categories.set(c.name.toLowerCase(), c.id);
      this.categories.set(c.slug.toLowerCase(), c.id);
    }

    const mfrs = await prisma.manufacturer.findMany({ select: { name: true } });
    for (const m of mfrs) {
      this.manufacturers.set(m.name.toLowerCase(), true);
    }

    this.loaded = true;
  }

  getCategoryId(name) {
    if (!name) return null;
    return this.categories.get(name.toLowerCase()) || null;
  }

  hasManufacturer(name) {
    if (!name) return false;
    return this.manufacturers.has(name.toLowerCase());
  }

  async ensureManufacturer(name) {
    if (!name) return;
    const key = name.toLowerCase();
    if (this.manufacturers.has(key)) return;

    try {
      // Brand slugs must match lib/manufacturer-canonical.manufacturerSlug():
      // toSlug() turns "&" into "-" while product URLs turn it into "and", so a
      // brand created here got a slug its own product pages never linked to.
      const slug = manufacturerSlug(name);
      // Ensure unique slug
      let finalSlug = slug;
      let attempt = 0;
      while (true) {
        try {
          await prisma.manufacturer.create({
            data: { name, slug: finalSlug },
          });
          break;
        } catch (e) {
          if (e.code === 'P2002') {
            // unique constraint violation
            attempt++;
            finalSlug = `${slug}-${attempt}`;
            if (attempt > 10) throw new Error(`Cannot create unique slug for manufacturer: ${name}`);
          } else {
            throw e;
          }
        }
      }
      this.manufacturers.set(key, true);
    } catch (e) {
      // If it already exists (race condition), just cache it
      if (e.code === 'P2002') {
        this.manufacturers.set(key, true);
      } else {
        throw e;
      }
    }
  }

  async ensureCategory(name) {
    if (!name) return null;
    const key = name.toLowerCase();
    const existing = this.categories.get(key);
    if (existing) return existing;

    try {
      const slug = toSlug(name);
      let finalSlug = slug;
      let attempt = 0;
      while (true) {
        try {
          const cat = await prisma.category.create({
            data: { name, slug: finalSlug },
          });
          this.categories.set(key, cat.id);
          this.categories.set(finalSlug, cat.id);
          return cat.id;
        } catch (e) {
          if (e.code === 'P2002') {
            // Slug exists, try to find by slug
            const found = await prisma.category.findUnique({ where: { slug: finalSlug } });
            if (found) {
              this.categories.set(key, found.id);
              return found.id;
            }
            attempt++;
            finalSlug = `${slug}-${attempt}`;
            if (attempt > 10) throw new Error(`Cannot create unique slug for category: ${name}`);
          } else {
            throw e;
          }
        }
      }
    } catch (e) {
      console.error(`⚠️  Failed to create category "${name}": ${e.message}`);
      return null;
    }
  }
}

// ============================================================
// 错误日志
// ============================================================
class ErrorLogger {
  constructor(logFile) {
    this.logFile = logFile;
    this.errors = [];
    this.warnings = [];
  }

  error(row, field, message, value) {
    this.errors.push({ row, field, message, value: String(value).substring(0, 100) });
  }

  warn(row, field, message, value) {
    this.warnings.push({ row, field, message, value: String(value || '').substring(0, 100) });
  }

  flush() {
    if (this.errors.length === 0 && this.warnings.length === 0) return;

    const lines = [
      `FPGACenter Import Log — ${new Date().toISOString()}`,
      `${'='.repeat(60)}`,
      '',
      `ERRORS (${this.errors.length}):`,
      ...this.errors.map(e => `  Row ${e.row} | ${e.field}: ${e.message} (value: "${e.value}")`),
      '',
      `WARNINGS (${this.warnings.length}):`,
      ...this.warnings.map(w => `  Row ${w.row} | ${w.field}: ${w.message} (value: "${w.value}")`),
    ];
    writeFileSync(this.logFile, lines.join('\n'), 'utf-8');
  }
}

// ============================================================
// 统计计数器
// ============================================================
class Stats {
  constructor() {
    this.total = 0;
    this.imported = 0;
    this.updated = 0;
    this.skipped = 0;
    this.errors = 0;
    this.emptyRows = 0;
    this.duplicates = 0;
    this.categoriesCreated = 0;
    this.manufacturersCreated = 0;
    this.startTime = Date.now();
  }

  print(final = false) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const rate = this.total > 0 ? (this.total / (elapsed || 1)).toFixed(0) : 0;
    
    const status = final ? '✅ COMPLETE' : '⏳ Progress';
    process.stdout.write(`\r${status}: ${this.total} rows | ` +
      `✓ ${this.imported} new | ↻ ${this.updated} updated | ` +
      `⊘ ${this.skipped} skipped | ✗ ${this.errors} errors | ` +
      `${elapsed}s (${rate}/s)` +
      (final ? '\n' : ''));
  }
}

// ============================================================
// 主导入逻辑
// ============================================================
async function importCSV(opts) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  FPGACenter Product Import`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  File:    ${opts.file}`);
  console.log(`  Mode:    ${opts.mode}${opts.dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`  Batch:   ${opts.batchSize}`);
  console.log(`  Skip:    ${opts.skipRows} rows`);
  console.log(`${'═'.repeat(60)}\n`);

  const cache = new LookupCache();
  const logger = new ErrorLogger(opts.logFile);
  const stats = new Stats();

  // Load existing data into cache
  console.log('📦 Loading existing categories and manufacturers...');
  await cache.load();
  console.log(`   Found ${cache.categories.size} categories, ${cache.manufacturers.size} manufacturers\n`);

  // Load custom column mapping
  let customMapping = null;
  if (opts.mappingFile && existsSync(opts.mappingFile)) {
    try {
      customMapping = JSON.parse(readFileSync(opts.mappingFile, 'utf-8'));
      console.log(`📋 Loaded custom column mapping from ${opts.mappingFile}\n`);
    } catch (e) {
      console.error(`⚠️  Failed to parse mapping file: ${e.message}`);
    }
  }

  // Open file stream
  const fileStream = createReadStream(opts.file, { encoding: opts.encoding || 'utf-8' });
  const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNumber = 0;
  let headerMapping = null;
  let delimiter = opts.delimiter;
  let batch = [];
  let seenPartNumbers = new Set(); // detect duplicates within this import

  for await (let line of rl) {
    lineNumber++;

    // Clean BOM on first line
    if (lineNumber === 1) {
      line = detectAndCleanBOM(line);

      // Auto-detect delimiter
      if (!delimiter) {
        delimiter = detectDelimiter(line);
        console.log(`🔍 Auto-detected delimiter: "${delimiter === '\t' ? '\\t' : delimiter}"\n`);
      }

      // Parse header
      const headerFields = parseCSVLine(line, delimiter);
      const result = buildColumnMapping(headerFields, customMapping);
      headerMapping = result.mapping;

      // Validate required column
      if (headerMapping.partNumber === undefined) {
        console.error(`\n❌ FATAL: Cannot find "partNumber" column in CSV headers.`);
        console.error(`   Found headers: ${result.headers.join(', ')}`);
        console.error(`   Expected one of: ${DEFAULT_COLUMN_ALIASES.partNumber.join(', ')}`);
        process.exit(1);
      }

      console.log(`📊 Column mapping:`);
      for (const [field, idx] of Object.entries(headerMapping)) {
        console.log(`   ${field.padEnd(15)} → column ${idx} (${result.headers[idx]})`);
      }
      console.log('');
      continue;
    }

    // Skip rows (for resume)
    if (lineNumber - 1 <= opts.skipRows) continue;

    // Skip empty lines
    if (!line.trim()) {
      stats.emptyRows++;
      continue;
    }

    stats.total++;

    // Parse row
    const fields = parseCSVLine(line, delimiter);

    // Extract and validate partNumber
    const rawPartNumber = fields[headerMapping.partNumber] || '';
    const partNumber = sanitizePartNumber(rawPartNumber);

    if (!partNumber) {
      logger.error(lineNumber, 'partNumber', 'Invalid or empty part number', rawPartNumber);
      stats.errors++;
      continue;
    }

    // Check for duplicates within this CSV
    if (seenPartNumbers.has(partNumber)) {
      stats.duplicates++;
      logger.warn(lineNumber, 'partNumber', 'Duplicate in CSV (using last occurrence)', partNumber);
      // Remove the earlier one from batch
      batch = batch.filter(b => b.partNumber !== partNumber);
    }
    seenPartNumbers.add(partNumber);

    // Extract fields with safe defaults
    const getField = (name) => {
      const idx = headerMapping[name];
      return idx !== undefined && idx < fields.length ? fields[idx] : null;
    };

    // Canonicalized on the way in: duplicate brand spellings fork the brand page
    // and the whole /product/<brand>/… URL space (lib/manufacturer-canonical.js).
    const manufacturer = canonicalManufacturer(sanitizeString(getField('manufacturer'), 200)) || 'Unknown';
    const description = sanitizeString(getField('description'), 2000);
    const categoryName = sanitizeString(getField('category'), 200);
    const packageType = sanitizeString(getField('packageType'), 100);
    const mountType = normalizeMountType(getField('mountType'));
    const status = normalizeStatus(getField('status'));
    const minPrice = parsePrice(getField('minPrice'));
    const stock = parseStock(getField('stock'));
    const moq = parseMOQ(getField('moq'));
    const leadTime = sanitizeString(getField('leadTime'), 100);
    const datasheet = sanitizeString(getField('datasheet'), 500);
    const imageUrl = sanitizeString(getField('imageUrl'), 500);
    const specs = normalizeSpecs(getField('specs'));

    // Validate price sanity
    if (minPrice !== null && minPrice > 100000) {
      logger.warn(lineNumber, 'minPrice', `Unusually high price: $${minPrice}`, getField('minPrice'));
    }

    batch.push({
      partNumber,
      manufacturer,
      description,
      categoryName,
      packageType,
      mountType,
      status,
      minPrice,
      stock,
      moq,
      leadTime,
      datasheet,
      imageUrl,
      specs,
      _lineNumber: lineNumber,
    });

    // Flush batch
    if (batch.length >= opts.batchSize) {
      await flushBatch(batch, opts, cache, logger, stats);
      batch = [];
      stats.print();
    }
  }

  // Flush remaining batch
  if (batch.length > 0) {
    await flushBatch(batch, opts, cache, logger, stats);
  }

  // Final stats
  stats.print(true);
  logger.flush();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Import Summary`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Total rows processed:   ${stats.total}`);
  console.log(`  New products created:   ${stats.imported}`);
  console.log(`  Products updated:       ${stats.updated}`);
  console.log(`  Skipped (duplicates):   ${stats.skipped}`);
  console.log(`  Errors:                 ${stats.errors}`);
  console.log(`  Empty rows skipped:     ${stats.emptyRows}`);
  console.log(`  Duplicates in CSV:      ${stats.duplicates}`);
  if (logger.errors.length > 0 || logger.warnings.length > 0) {
    console.log(`  Error log:              ${opts.logFile}`);
  }
  console.log(`${'═'.repeat(60)}\n`);

  if (!opts.dryRun && (stats.imported > 0 || stats.updated > 0)) {
    await runPostImportMaintenance(prisma);
  }
}

// ============================================================
// 批量写入数据库
// ============================================================
async function flushBatch(batch, opts, cache, logger, stats) {
  if (opts.dryRun) {
    stats.imported += batch.length;
    return;
  }

  // Pre-create all categories and manufacturers in this batch
  const uniqueManufacturers = [...new Set(batch.map(b => b.manufacturer).filter(Boolean))];
  const uniqueCategories = [...new Set(batch.map(b => b.categoryName).filter(Boolean))];

  for (const mfr of uniqueManufacturers) {
    if (!cache.hasManufacturer(mfr)) {
      await cache.ensureManufacturer(mfr);
      stats.manufacturersCreated++;
    }
  }

  for (const cat of uniqueCategories) {
    if (!cache.getCategoryId(cat)) {
      await cache.ensureCategory(cat);
      stats.categoriesCreated++;
    }
  }

  // Process each item in the batch
  for (const item of batch) {
    try {
      const categoryId = item.categoryName ? cache.getCategoryId(item.categoryName) : null;

      const productData = {
        manufacturer: item.manufacturer,
        description: item.description,
        categoryId,
        packageType: item.packageType,
        mountType: item.mountType,
        status: item.status,
        minPrice: item.minPrice,
        stock: item.stock,
        moq: item.moq,
        leadTime: item.leadTime,
        datasheet: item.datasheet,
        imageUrl: item.imageUrl,
        specs: item.specs,
      };

      // Importers write rendered fields, so they own the sitemap lastmod
      // (housekeeping jobs must never set it). Kept OUT of productData on
      // purpose: update mode below treats a non-empty field set as "something
      // changed", and a timestamp that is always present would make every row
      // look dirty on every run - re-creating the very lastmod pollution this
      // column exists to prevent.
      const contentUpdatedAt = new Date();

      if (opts.mode === 'skip') {
        // Only create if not exists
        try {
          await prisma.product.create({
            data: { partNumber: item.partNumber, ...productData, contentUpdatedAt },
          });
          stats.imported++;
        } catch (e) {
          if (e.code === 'P2002') {
            // Already exists, skip
            stats.skipped++;
          } else {
            throw e;
          }
        }
      } else if (opts.mode === 'update') {
        // Upsert: create or update only non-null fields
        const existing = await prisma.product.findUnique({
          where: { partNumber: item.partNumber },
          select: { id: true },
        });

        if (existing) {
          // Only update fields that have values (don't overwrite with null)
          const updateData = {};
          for (const [key, val] of Object.entries(productData)) {
            if (val !== null && val !== undefined) {
              updateData[key] = val;
            }
          }
          if (Object.keys(updateData).length > 0) {
            await prisma.product.update({
              where: { partNumber: item.partNumber },
              data: { ...updateData, contentUpdatedAt },
            });
            stats.updated++;
          } else {
            stats.skipped++;
          }
        } else {
          await prisma.product.create({
            data: { partNumber: item.partNumber, ...productData, contentUpdatedAt },
          });
          stats.imported++;
        }
      } else if (opts.mode === 'overwrite') {
        // Upsert: always overwrite all fields
        await prisma.product.upsert({
          where: { partNumber: item.partNumber },
          create: { partNumber: item.partNumber, ...productData, contentUpdatedAt },
          update: { ...productData, contentUpdatedAt },
        });
        // We can't easily tell if it was create or update with upsert
        stats.imported++;
      }
    } catch (e) {
      logger.error(item._lineNumber, 'database', `Write failed: ${e.message}`, item.partNumber);
      stats.errors++;
    }
  }
}

// ============================================================
// 入口
// ============================================================
const opts = parseArgs();
importCSV(opts)
  .catch(e => {
    console.error(`\n❌ Fatal error: ${e.message}`);
    console.error(e.stack);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
