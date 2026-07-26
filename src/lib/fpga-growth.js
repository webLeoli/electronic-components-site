import prisma from '@/lib/db';
import { productPath } from '@/lib/seo';
import {
  getFpgaSeries,
  getFpgaSeriesBySlug,
  buildSeriesWhere,
  buildProgrammableLogicWhere,
} from '@/lib/fpga-series-data';

// Pure series data + where-builders live in fpga-series-data.js (alias-free so
// scripts can import them); re-exported here to keep the public API stable.
export { getFpgaSeries, getFpgaSeriesBySlug, buildSeriesWhere, buildProgrammableLogicWhere };

export async function getSeriesStats(series) {
  const where = buildSeriesWhere(series);
  const [total, inStock, eolLike, samples] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.count({ where: buildSeriesWhere(series, { stockedOnly: true }) }),
    prisma.product.count({
      where: {
        AND: [
          buildSeriesWhere(series),
          { status: { in: ['obsolete', 'eol', 'nrnd'] } },
        ],
      },
    }),
    prisma.product.findMany({
      where,
      select: {
        partNumber: true,
        manufacturer: true,
        description: true,
        packageType: true,
        stock: true,
        minPrice: true,
        status: true,
        category: { select: { slug: true, name: true } },
      },
      orderBy: [{ stock: 'desc' }, { qualityScore: 'desc' }, { partNumber: 'asc' }],
      take: 8,
    }),
  ]);

  return {
    ...series,
    total,
    inStock,
    eolLike,
    samples: samples.map(product => ({
      ...product,
      href: productPath(product.partNumber, product.manufacturer),
    })),
  };
}
