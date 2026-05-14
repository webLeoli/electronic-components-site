import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/admin-auth';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 1. Channel breakdown
    const channelBreakdown = await prisma.rfqSubmission.groupBy({
      by: ['sourceChannel'],
      where: {
        submittedAt: { gte: since },
        status: { not: 'spam' },
      },
      _count: { sourceChannel: true },
    });
    // Sort in JS — more reliable across Prisma versions
    channelBreakdown.sort((a, b) => b._count.sourceChannel - a._count.sourceChannel);

    // 2. Recent RFQs with tracking
    const recentRfqs = await prisma.rfqSubmission.findMany({
      where: {
        submittedAt: { gte: since },
        status: { not: 'spam' },
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        country: true,
        parts: true,
        sourceChannel: true,
        landingPage: true,
        trackingData: true,
        submittedAt: true,
        status: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: 200,
    });

    // 3. Deep analysis of tracking data
    const productAttribution = {};  // product -> {views, discovery sources}
    const discoveryMethods = {};    // How products were found
    const landingPages = {};
    const landingPageTypes = {};    // Type of landing page (product_page, homepage, etc.)
    const deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
    const osBreakdown = {};
    const browserBreakdown = {};
    const dailyRfqs = {};
    const searchKeywords = {};      // Search engine keywords that led to RFQs
    const rfqTriggers = {};         // Where users initiated the RFQ
    const journeyLengths = [];      // How many pages before RFQ
    let totalProductsViewed = 0;

    for (const rfq of recentRfqs) {
      // Daily count
      const dateKey = rfq.submittedAt.toISOString().split('T')[0];
      dailyRfqs[dateKey] = (dailyRfqs[dateKey] || 0) + 1;

      // Landing pages
      if (rfq.landingPage) {
        landingPages[rfq.landingPage] = (landingPages[rfq.landingPage] || 0) + 1;
      }

      if (!rfq.trackingData) continue;

      try {
        const tracking = JSON.parse(rfq.trackingData);

        // Device / OS / Browser
        const device = tracking.device || 'unknown';
        deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;

        if (tracking.os) {
          osBreakdown[tracking.os] = (osBreakdown[tracking.os] || 0) + 1;
        }
        if (tracking.browser) {
          browserBreakdown[tracking.browser] = (browserBreakdown[tracking.browser] || 0) + 1;
        }

        // Landing page type
        if (tracking.landing_page_type) {
          landingPageTypes[tracking.landing_page_type] = (landingPageTypes[tracking.landing_page_type] || 0) + 1;
        }

        // Product views -> RFQ attribution with discovery source
        if (tracking.products_viewed && Array.isArray(tracking.products_viewed)) {
          totalProductsViewed += tracking.products_viewed.length;
          for (const pv of tracking.products_viewed) {
            const key = pv.pn;
            if (!productAttribution[key]) {
              productAttribution[key] = { partNumber: pv.pn, manufacturer: pv.mfr || '', rfqCount: 0, discoverySources: {} };
            }
            productAttribution[key].rfqCount++;

            // Track how products were discovered
            const via = pv.via || 'unknown';
            productAttribution[key].discoverySources[via] = (productAttribution[key].discoverySources[via] || 0) + 1;
            discoveryMethods[via] = (discoveryMethods[via] || 0) + 1;
          }
        }

        // Search keywords from referrer
        if (tracking.referrer_parsed?.keyword) {
          const kw = tracking.referrer_parsed.keyword.toLowerCase().trim();
          if (kw) searchKeywords[kw] = (searchKeywords[kw] || 0) + 1;
        }
        // Also from user's on-site searches
        if (tracking.searches && Array.isArray(tracking.searches)) {
          for (const sq of tracking.searches) {
            const kw = sq.toLowerCase().trim();
            if (kw) searchKeywords[kw] = (searchKeywords[kw] || 0) + 1;
          }
        }

        // RFQ trigger point
        if (tracking.rfq_trigger?.trigger) {
          const t = tracking.rfq_trigger.trigger;
          rfqTriggers[t] = (rfqTriggers[t] || 0) + 1;
        }

        // Journey length
        if (tracking.page_views) {
          journeyLengths.push(tracking.page_views);
        }
      } catch {}
    }

    // Process aggregations
    const topProducts = Object.values(productAttribution)
      .sort((a, b) => b.rfqCount - a.rfqCount)
      .slice(0, 30)
      .map(p => ({
        ...p,
        topDiscovery: Object.entries(p.discoverySources)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([method, count]) => ({ method, count })),
      }));

    const topLandingPages = Object.entries(landingPages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([page, count]) => ({ page, count }));

    const topSearchKeywords = Object.entries(searchKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 30)
      .map(([keyword, count]) => ({ keyword, count }));

    const totalRfqs = recentRfqs.length;
    const avgJourneyLength = journeyLengths.length > 0
      ? Math.round(journeyLengths.reduce((a, b) => a + b, 0) / journeyLengths.length)
      : 0;

    const channelLabels = channelBreakdown.map(c => ({
      channel: c.sourceChannel || 'direct',
      count: c._count.sourceChannel,
      percentage: totalRfqs > 0 ? Math.round((c._count.sourceChannel / totalRfqs) * 100) : 0,
    }));

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      summary: {
        totalRfqs,
        totalProductsViewed,
        avgProductsPerRfq: totalRfqs > 0 ? Math.round(totalProductsViewed / totalRfqs * 10) / 10 : 0,
        totalChannels: channelLabels.length,
        avgJourneyLength,
      },
      channels: channelLabels,
      topProducts,
      topLandingPages,
      landingPageTypes: Object.entries(landingPageTypes)
        .sort(([,a], [,b]) => b - a)
        .map(([type, count]) => ({ type, count })),
      topSearchKeywords,
      discoveryMethods: Object.entries(discoveryMethods)
        .sort(([,a], [,b]) => b - a)
        .map(([method, count]) => ({ method, count })),
      rfqTriggers: Object.entries(rfqTriggers)
        .sort(([,a], [,b]) => b - a)
        .map(([trigger, count]) => ({ trigger, count })),
      deviceBreakdown,
      osBreakdown,
      browserBreakdown,
      dailyRfqs: Object.entries(dailyRfqs).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count })),
      recentRfqs: recentRfqs.slice(0, 100).map(rfq => {
        let tracking = {};
        try { tracking = rfq.trackingData ? JSON.parse(rfq.trackingData) : {}; } catch {}
        return {
          id: rfq.id,
          name: rfq.name,
          company: rfq.company,
          country: rfq.country,
          partsCount: (() => { try { return JSON.parse(rfq.parts).length; } catch { return 0; } })(),
          sourceChannel: rfq.sourceChannel || 'direct',
          landingPage: rfq.landingPage,
          landingPageType: tracking.landing_page_type,
          productsViewed: (tracking.products_viewed || []).map(pv => ({
            pn: pv.pn,
            via: pv.via,
          })),
          searches: tracking.searches || [],
          adClick: tracking.ad_click ? tracking.ad_click.label : null,
          referrerName: tracking.referrer_parsed?.name || null,
          referrerKeyword: tracking.referrer_parsed?.keyword || null,
          rfqTrigger: tracking.rfq_trigger?.trigger || null,
          journey: tracking.journey || [],
          device: tracking.device,
          os: tracking.os,
          browser: tracking.browser,
          pageViews: tracking.page_views,
          sessionDuration: tracking.session_duration_sec,
          submittedAt: rfq.submittedAt,
          status: rfq.status,
        };
      }),
    });
  } catch (e) {
    console.error('Analytics API error:', e);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
