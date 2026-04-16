'use client';

import { useEffect, useState } from 'react';

// Channel color mapping
const CHANNEL_COLORS = {
  google: '#4285F4', bing: '#00809D', baidu: '#2319DC', yahoo: '#7B0099', yandex: '#FF0000',
  facebook: '#1877F2', linkedin: '#0A66C2', twitter: '#1DA1F2', reddit: '#FF4500',
  youtube: '#FF0000', instagram: '#E1306C', tiktok: '#010101', pinterest: '#E60023',
  wechat: '#07C160', weibo: '#E6162D', direct: '#FF6B00', email: '#00C853',
  octopart: '#2196F3', findchips: '#4CAF50', digikey: '#CC0000', mouser: '#004B87',
};

function getColor(channel) {
  for (const [key, color] of Object.entries(CHANNEL_COLORS)) {
    if (channel?.includes(key)) return color;
  }
  return '#64748B';
}

function fmtChannel(ch) {
  if (!ch) return 'Direct';
  return ch.replace(/_/g, ' / ').replace(/\b\w/g, l => l.toUpperCase());
}

function fmtDiscovery(method) {
  const labels = {
    search_result: '🔍 Site Search', category_browse: '📂 Category Browse',
    homepage_popular: '🏠 Homepage', blog_related: '📝 Blog Article',
    manufacturer_page: '🏭 Manufacturer Page', direct_url: '🔗 Direct Link',
  };
  return labels[method] || method;
}

function fmtTrigger(trigger) {
  const labels = {
    product_page_btn: '📦 Product Page', floating_btn: '💬 Floating Button',
    cta_section: '📢 CTA Section', bom_tool: '📋 BOM Tool',
    homepage_cta: '🏠 Homepage CTA', header_nav: '🧭 Header Nav',
  };
  return labels[trigger] || trigger;
}

function fmtPageType(type) {
  const labels = {
    homepage: '🏠 Homepage', product_page: '📦 Product', category_page: '📂 Category',
    manufacturer_page: '🏭 Manufacturer', search_page: '🔍 Search', blog_article: '📝 Blog',
    blog_index: '📝 Blog Index', rfq_page: '📋 RFQ', bom_tool: '🛠️ BOM Tool', other_page: '📄 Other',
  };
  return labels[type] || type;
}

function fmtDuration(sec) {
  if (!sec) return '—';
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedRfq, setExpandedRfq] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="admin-page"><p style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>⏳ Loading analytics...</p></div>;
  if (!data || data.error) return <div className="admin-page"><p style={{ padding: '40px', textAlign: 'center', color: 'var(--color-danger)' }}>❌ Failed to load analytics</p></div>;

  const maxChCount = Math.max(...(data.channels || []).map(c => c.count), 1);
  const maxDailyCount = Math.max(...(data.dailyRfqs || []).map(d => d.count), 1);

  const tabs = [
    { key: 'overview',    label: '📊 流量渠道' },
    { key: 'products',    label: '📦 产品归因' },
    { key: 'keywords',    label: '🔍 搜索关键词' },
    { key: 'journey',     label: '🗺️ 用户路径' },
    { key: 'rfqs',        label: '📋 询盘详情' },
  ];

  return (
    <div className="admin-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>📊 流量分析</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>精准追踪每条询盘的流量来源、用户行为和转化路径</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[7, 30, 90, 180].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{
              padding: '6px 14px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
              borderRadius: '6px', transition: 'all 0.15s',
              background: days === d ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
              color: days === d ? '#fff' : 'var(--color-text-secondary)',
            }}>{d}天</button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: '📋', value: data.summary?.totalRfqs || 0, label: '总询盘' },
          { icon: '📦', value: data.summary?.totalProductsViewed || 0, label: '产品浏览' },
          { icon: '📈', value: data.summary?.avgProductsPerRfq || 0, label: '平均产品/询盘' },
          { icon: '🗺️', value: data.summary?.avgJourneyLength || 0, label: '平均浏览页数' },
          { icon: '🌐', value: data.summary?.totalChannels || 0, label: '流量来源数' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{s.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--color-bg-secondary)', padding: '4px', borderRadius: '8px', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '8px 16px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
            borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.15s',
            background: activeTab === tab.key ? 'var(--color-accent)' : 'transparent',
            color: activeTab === tab.key ? '#fff' : 'var(--color-text-secondary)',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ============ CHANNELS TAB ============ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Channel Breakdown */}
          <Card title="流量渠道占比">
            {(data.channels || []).length > 0 ? (data.channels || []).map((ch, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: getColor(ch.channel), marginRight: '8px' }} />
                    {fmtChannel(ch.channel)}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    {ch.count} <span style={{ fontSize: '11px' }}>({ch.percentage}%)</span>
                  </span>
                </div>
                <Bar value={ch.count} max={maxChCount} color={getColor(ch.channel)} />
              </div>
            )) : <Empty text="暂无数据，等用户提交询盘后会自动显示" />}
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Device / OS / Browser */}
            <Card title="设备 & 系统">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <MiniStat title="设备" data={data.deviceBreakdown} icons={{ desktop: '🖥️', mobile: '📱', tablet: '📟', unknown: '❓' }} />
                <MiniStat title="系统" data={data.osBreakdown} />
                <MiniStat title="浏览器" data={data.browserBreakdown} />
              </div>
            </Card>

            {/* Daily Trend */}
            <Card title="每日询盘趋势">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100px' }}>
                {(data.dailyRfqs || []).slice(-30).map((d, i) => (
                  <div key={i} title={`${d.date}: ${d.count}`} style={{
                    flex: 1, minHeight: '3px',
                    height: `${Math.max(3, (d.count / maxDailyCount) * 100)}%`,
                    background: 'var(--color-accent)', borderRadius: '2px 2px 0 0',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                <span>{(data.dailyRfqs || [])[0]?.date}</span>
                <span>{(data.dailyRfqs || []).slice(-1)[0]?.date}</span>
              </div>
            </Card>

            {/* Landing Page Types */}
            <Card title="着陆页类型">
              {(data.landingPageTypes || []).map((lt, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                  <span>{fmtPageType(lt.type)}</span>
                  <span style={{ fontWeight: 600 }}>{lt.count}</span>
                </div>
              ))}
              {(data.landingPageTypes || []).length === 0 && <Empty text="暂无数据" />}
            </Card>
          </div>
        </div>
      )}

      {/* ============ PRODUCTS TAB ============ */}
      {activeTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <Card title="产品 → 询盘归因" subtitle="用户浏览这些产品后提交了询盘">
            {(data.topProducts || []).length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={thStyle}>#</th><th style={thStyle}>Part Number</th><th style={thStyle}>Manufacturer</th>
                    <th style={thStyle}>关联询盘</th><th style={thStyle}>发现方式 (Top 3)</th>
                  </tr></thead>
                  <tbody>{(data.topProducts || []).map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-accent)' }}>{p.partNumber}</td>
                      <td style={tdStyle}>{p.manufacturer || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{p.rfqCount}×</td>
                      <td style={tdStyle}>
                        {(p.topDiscovery || []).map((d, j) => (
                          <span key={j} style={{ display: 'inline-block', padding: '2px 8px', margin: '2px 4px 2px 0', borderRadius: '12px', fontSize: '11px', background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                            {fmtDiscovery(d.method)} ({d.count})
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <Empty text="暂无产品浏览数据" />}
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card title="产品发现方式" subtitle="用户如何找到产品">
              {(data.discoveryMethods || []).map((dm, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px solid var(--color-border)' }}>
                  <span>{fmtDiscovery(dm.method)}</span>
                  <span style={{ fontWeight: 600 }}>{dm.count}</span>
                </div>
              ))}
              {(data.discoveryMethods || []).length === 0 && <Empty text="暂无数据" />}
            </Card>

            <Card title="询盘触发点" subtitle="用户从哪里点击发起询盘">
              {(data.rfqTriggers || []).map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px solid var(--color-border)' }}>
                  <span>{fmtTrigger(t.trigger)}</span>
                  <span style={{ fontWeight: 600 }}>{t.count}</span>
                </div>
              ))}
              {(data.rfqTriggers || []).length === 0 && <Empty text="暂无数据" />}
            </Card>
          </div>
        </div>
      )}

      {/* ============ KEYWORDS TAB ============ */}
      {activeTab === 'keywords' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Card title="搜索关键词 → 询盘" subtitle="用户搜索了这些词后提交了询盘（含外部搜索引擎关键词 + 站内搜索）">
            {(data.topSearchKeywords || []).length > 0 ? (
              <div>
                {(data.topSearchKeywords || []).map((kw, i) => {
                  const maxKw = data.topSearchKeywords[0]?.count || 1;
                  return (
                    <div key={i} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{kw.keyword}</span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{kw.count}×</span>
                      </div>
                      <Bar value={kw.count} max={maxKw} color="#4285F4" />
                    </div>
                  );
                })}
              </div>
            ) : <Empty text="暂无搜索关键词数据。用户从搜索引擎进入或使用站内搜索后会显示。" />}
          </Card>

          <Card title="着陆页排行" subtitle="用户第一次看到的页面">
            {(data.topLandingPages || []).length > 0 ? (
              <div>
                {(data.topLandingPages || []).map((lp, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{lp.page}</span>
                    <span style={{ fontWeight: 600, flexShrink: 0 }}>{lp.count}</span>
                  </div>
                ))}
              </div>
            ) : <Empty text="暂无着陆页数据" />}
          </Card>
        </div>
      )}

      {/* ============ JOURNEY TAB ============ */}
      {activeTab === 'journey' && (
        <Card title="用户浏览路径分析" subtitle="点击展开查看每条询盘的完整浏览路径">
          {(data.recentRfqs || []).slice(0, 20).map(rfq => (
            <div key={rfq.id} style={{ borderBottom: '1px solid var(--color-border)', padding: '12px 0' }}>
              <div onClick={() => setExpandedRfq(expandedRfq === rfq.id ? null : rfq.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>#{rfq.id}</span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{rfq.name}</span>
                  <Badge text={fmtChannel(rfq.sourceChannel)} color={getColor(rfq.sourceChannel)} />
                  {rfq.adClick && <Badge text={rfq.adClick} color="#EA4335" />}
                  {rfq.referrerKeyword && (
                    <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(66,133,244,0.1)', color: '#4285F4', borderRadius: '10px' }}>
                      🔍 {rfq.referrerKeyword}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  <span>📦 {rfq.productsViewed?.length || 0} products</span>
                  <span>📄 {rfq.pageViews || 0} pages</span>
                  <span>⏱️ {fmtDuration(rfq.sessionDuration)}</span>
                  <span style={{ transform: expandedRfq === rfq.id ? 'rotate(180deg)' : '', transition: '0.2s' }}>▼</span>
                </div>
              </div>

              {expandedRfq === rfq.id && (
                <div style={{ marginTop: '12px', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                  {/* Journey Path */}
                  {rfq.journey?.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>🗺️ 浏览路径</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                        {rfq.journey.map((page, i) => (
                          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {i > 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>→</span>}
                            <span style={{ fontSize: '11px', padding: '2px 8px', background: page.startsWith('/product/') ? 'rgba(255,107,0,0.1)' : 'var(--color-bg-card)',
                              color: page.startsWith('/product/') ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                              border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                              {page}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products Viewed */}
                  {rfq.productsViewed?.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>📦 浏览的产品 (发现方式)</div>
                      {rfq.productsViewed.map((pv, i) => (
                        <div key={i} style={{ fontSize: '12px', padding: '4px 0', display: 'flex', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-accent)' }}>{pv.pn}</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>via {fmtDiscovery(pv.via)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Searches */}
                  {rfq.searches?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>🔍 站内搜索</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {rfq.searches.map((q, i) => (
                          <span key={i} style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(66,133,244,0.1)', color: '#4285F4', borderRadius: '10px', fontFamily: 'var(--font-mono)' }}>{q}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta info */}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed var(--color-border)', fontSize: '11px', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                    {rfq.device && <span>📱 {rfq.device} / {rfq.os} / {rfq.browser}</span>}
                    {rfq.landingPage && <span>🚪 着陆: {rfq.landingPage}</span>}
                    {rfq.rfqTrigger && <span>🎯 触发: {fmtTrigger(rfq.rfqTrigger)}</span>}
                    <span>📅 {new Date(rfq.submittedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {(data.recentRfqs || []).length === 0 && <Empty text="暂无询盘数据" />}
        </Card>
      )}

      {/* ============ RFQ LIST TAB ============ */}
      {activeTab === 'rfqs' && (
        <Card title="询盘列表" subtitle="完整追踪信息">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead><tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {['ID', '客户', '公司', '零件数', '来源', '广告ID', 'Referrer关键词', '着陆页', '浏览产品', '搜索', '设备', '时长', '日期'].map(h =>
                  <th key={h} style={thStyle}>{h}</th>
                )}
              </tr></thead>
              <tbody>
                {(data.recentRfqs || []).map(rfq => (
                  <tr key={rfq.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={tdStyle}>#{rfq.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rfq.name}</td>
                    <td style={{ ...tdStyle, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rfq.company || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, textAlign: 'center' }}>{rfq.partsCount}</td>
                    <td style={tdStyle}><Badge text={fmtChannel(rfq.sourceChannel)} color={getColor(rfq.sourceChannel)} /></td>
                    <td style={tdStyle}>{rfq.adClick ? <Badge text={rfq.adClick} color="#EA4335" /> : '—'}</td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', color: '#4285F4' }}>{rfq.referrerKeyword || '—'}</td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rfq.landingPage || '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{rfq.productsViewed?.length || 0}</td>
                    <td style={{ ...tdStyle, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rfq.searches?.join(', ') || '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{rfq.device === 'mobile' ? '📱' : rfq.device === 'tablet' ? '📟' : '🖥️'}</td>
                    <td style={tdStyle}>{fmtDuration(rfq.sessionDuration)}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{new Date(rfq.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(data.recentRfqs || []).length === 0 && <Empty text="暂无询盘数据" />}
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Reusable Components
// ============================================================

const thStyle = { padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '8px 10px', verticalAlign: 'middle' };

function Card({ title, subtitle, children }) {
  return (
    <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Bar({ value, max, color }) {
  return (
    <div style={{ height: '6px', background: 'var(--color-bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.max(2, (value / max) * 100)}%`, background: color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
      background: `${color}18`, color, border: `1px solid ${color}30`, whiteSpace: 'nowrap',
    }}>{text}</span>
  );
}

function MiniStat({ title, data, icons = {} }) {
  const entries = Object.entries(data || {}).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a);
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>{title}</div>
      {entries.map(([key, val]) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '2px 0' }}>
          <span>{icons[key] || ''} {key}</span><span style={{ fontWeight: 600 }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

function Empty({ text }) {
  return <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>{text}</p>;
}
