import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';
import { computeQualityScore, TIERS } from '@/lib/quality-score';
import { getIndexingPolicy, isScoreIndexable, setIndexingPolicy } from '@/lib/indexing-policy';

/**
 * GET /api/admin/quality
 * Returns quality score distribution stats and indexing status.
 */
export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Paginated product list by quality
    if (action === 'products') {
      const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
      const limit = Math.min(50, parseInt(searchParams.get('limit')) || 20);
      const tier = searchParams.get('tier') || '';
      const search = searchParams.get('q') || '';

      const where = {};
      if (tier) {
        const tierDef = TIERS[tier];
        if (tierDef) {
          const nextTier = tier === 'gold' ? null :
                           tier === 'silver' ? TIERS.gold :
                           tier === 'bronze' ? TIERS.silver :
                           TIERS.bronze;
          where.qualityScore = {
            gte: tierDef.min,
            ...(nextTier ? { lt: nextTier.min } : {}),
          };
        }
      }
      if (search) {
        where.OR = [
          { partNumber: { contains: search } },
          { manufacturer: { contains: search } },
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          select: {
            id: true, partNumber: true, manufacturer: true, description: true,
            status: true, qualityScore: true, indexable: true,
            minPrice: true, stock: true, imageUrl: true, datasheet: true,
            specs: true, packageType: true,
          },
          orderBy: { qualityScore: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return NextResponse.json({
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Default: return tier distribution stats
    const [total, indexableCount, goldCount, silverCount, bronzeCount, noindexCount, avgScore, policy] =
      await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { indexable: true } }),
        prisma.product.count({ where: { qualityScore: { gte: 70 } } }),
        prisma.product.count({ where: { qualityScore: { gte: 45, lt: 70 } } }),
        prisma.product.count({ where: { qualityScore: { gte: 20, lt: 45 } } }),
        prisma.product.count({ where: { qualityScore: { lt: 20 } } }),
        prisma.product.aggregate({ _avg: { qualityScore: true } }),
        getIndexingPolicy(),
      ]);

    // Get last indexing action from AdminSettings
    let lastAction = null;
    try {
      const setting = await prisma.adminSetting.findUnique({
        where: { key: 'quality_last_action' },
      });
      if (setting) lastAction = JSON.parse(setting.value);
    } catch {}

    return NextResponse.json({
      total,
      indexable: indexableCount,
      avgScore: Math.round((avgScore._avg.qualityScore || 0) * 10) / 10,
      tiers: {
        gold: goldCount,
        silver: silverCount,
        bronze: bronzeCount,
        noindex: noindexCount,
      },
      policy,
      lastAction,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/quality
 * Batch operations: re-score, enable/disable indexing by tier.
 */
export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { action, threshold } = body;

    // --- Action: batch re-score all products ---
    if (action === 'rescore') {
      // Respect the persisted policy when the caller didn't pass an explicit
      // threshold. Falling back to a hardcoded 45 here used to silently undo
      // a 70-threshold rollout if anyone clicked "Re-score All" without args.
      const currentPolicy = await getIndexingPolicy();
      const indexThreshold = threshold ?? currentPolicy.threshold;
      const policy = { threshold: indexThreshold, disabled: false };
      const BATCH = 2000;
      const total = await prisma.product.count();
      let processed = 0;
      let indexed = 0;
      const batches = Math.ceil(total / BATCH);

      for (let i = 0; i < batches; i++) {
        const products = await prisma.product.findMany({
          skip: i * BATCH,
          take: BATCH,
          orderBy: { id: 'asc' },
        });

        const updates = products.map(p => {
          const result = computeQualityScore(p);
          const indexableFlag = isScoreIndexable(result.score, policy);
          if (indexableFlag) indexed++;
          processed++;
          return prisma.product.update({
            where: { id: p.id },
            data: { qualityScore: result.score, indexable: indexableFlag },
          });
        });

        await prisma.$transaction(updates);
      }

      // Record action
      await setIndexingPolicy(policy);
      await prisma.adminSetting.upsert({
        where: { key: 'quality_last_action' },
        create: { key: 'quality_last_action', value: JSON.stringify({
          action: 'rescore', threshold: indexThreshold,
          processed, indexed, timestamp: new Date().toISOString(),
        })},
        update: { value: JSON.stringify({
          action: 'rescore', threshold: indexThreshold,
          processed, indexed, timestamp: new Date().toISOString(),
        })},
      });

      return NextResponse.json({ success: true, processed, indexed });
    }

    // --- Action: enable indexing by threshold ---
    if (action === 'enable_tier') {
      const currentPolicy = await getIndexingPolicy();
      const minScore = threshold ?? currentPolicy.threshold;
      await setIndexingPolicy({ threshold: minScore, disabled: false });
      const result = await prisma.product.updateMany({
        where: { qualityScore: { gte: minScore } },
        data: { indexable: true },
      });
      const disableResult = await prisma.product.updateMany({
        where: { qualityScore: { lt: minScore } },
        data: { indexable: false },
      });

      await prisma.adminSetting.upsert({
        where: { key: 'quality_last_action' },
        create: { key: 'quality_last_action', value: JSON.stringify({
          action: 'enable_tier', threshold: minScore,
          enabled: result.count, disabled: disableResult.count,
          timestamp: new Date().toISOString(),
        })},
        update: { value: JSON.stringify({
          action: 'enable_tier', threshold: minScore,
          enabled: result.count, disabled: disableResult.count,
          timestamp: new Date().toISOString(),
        })},
      });

      return NextResponse.json({
        success: true,
        enabled: result.count,
        disabled: disableResult.count,
      });
    }

    // --- Action: disable all indexing ---
    if (action === 'disable_all') {
      await setIndexingPolicy({ disabled: true });
      const result = await prisma.product.updateMany({
        data: { indexable: false },
      });

      await prisma.adminSetting.upsert({
        where: { key: 'quality_last_action' },
        create: { key: 'quality_last_action', value: JSON.stringify({
          action: 'disable_all', affected: result.count,
          timestamp: new Date().toISOString(),
        })},
        update: { value: JSON.stringify({
          action: 'disable_all', affected: result.count,
          timestamp: new Date().toISOString(),
        })},
      });

      return NextResponse.json({ success: true, affected: result.count });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/quality
 * Per-product override: force index or noindex a specific product.
 */
export async function PUT(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { productId, indexable: forceIndexable } = await request.json();
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

    const product = await prisma.product.update({
      where: { id: productId },
      data: { indexable: !!forceIndexable },
    });

    return NextResponse.json({ success: true, product });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
