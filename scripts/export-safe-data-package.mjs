#!/usr/bin/env node
/**
 * Export a safe production data package.
 *
 * Included by default:
 *   Product, Category, Manufacturer, BlogCategory, BlogPost,
 *   and explicitly allowed SEO/indexing AdminSetting keys.
 *
 * Excluded always:
 *   RFQ submissions, contact submissions, admin users, uploaded files,
 *   env secrets, and build artifacts.
 */

import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_ADMIN_SETTING_KEYS,
  DEFAULT_TABLES,
  exportDataPackage,
  normalizeAdminSettingKeys,
  normalizeTables,
  timestamp,
} from './safe-data-package-lib.mjs';

const prisma = new PrismaClient();

function parseArgs() {
  const opts = {
    output: `data-packages/fpgacenter-data-${timestamp()}`,
    tables: DEFAULT_TABLES,
    adminSettingKeys: DEFAULT_ADMIN_SETTING_KEYS,
    batchSize: 5000,
  };

  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [key, value = ''] = arg.slice(2).split('=');
    switch (key) {
      case 'output':
        opts.output = value;
        break;
      case 'tables':
        opts.tables = normalizeTables(value);
        break;
      case 'admin-setting-keys':
        opts.adminSettingKeys = normalizeAdminSettingKeys(value);
        break;
      case 'batch-size':
        opts.batchSize = Math.max(100, Math.min(20000, Number.parseInt(value, 10) || 5000));
        break;
      default:
        throw new Error(`Unknown option: --${key}`);
    }
  }

  return opts;
}

async function main() {
  const opts = parseArgs();

  console.log('Safe data export');
  console.log(`  output: ${opts.output}`);
  console.log(`  tables: ${opts.tables.join(', ')}`);
  console.log(`  admin setting keys: ${opts.adminSettingKeys.join(', ')}`);
  console.log('');

  const { outputDir, manifest } = await exportDataPackage(prisma, {
    outputDir: opts.output,
    tables: opts.tables,
    adminSettingKeys: opts.adminSettingKeys,
    batchSize: opts.batchSize,
  });

  console.log('');
  console.log(`Export complete: ${outputDir}`);
  for (const [table, count] of Object.entries(manifest.counts)) {
    console.log(`  ${table}: ${Number(count).toLocaleString()}`);
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
