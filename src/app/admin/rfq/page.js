'use client';
import { useEffect, useState, useCallback } from 'react';

// Channel color mapping
const CHANNEL_COLORS = {
  google: '#4285F4', bing: '#00809D', baidu: '#2319DC', yahoo: '#7B0099', yandex: '#FF0000',
  facebook: '#1877F2', linkedin: '#0A66C2', twitter: '#1DA1F2', reddit: '#FF4500',
  youtube: '#FF0000', instagram: '#E1306C', tiktok: '#010101', pinterest: '#E60023',
  wechat: '#07C160', weibo: '#E6162D', direct: '#FF6B00', email: '#00C853',
};

function getChannelColor(channel) {
  if (!channel) return '#64748B';
  for (const [key, color] of Object.entries(CHANNEL_COLORS)) {
    if (channel.includes(key)) return color;
  }
  return '#64748B';
}

function fmtChannel(ch) {
  if (!ch) return 'Direct';
  return ch.replace(/_/g, ' / ').replace(/\b\w/g, l => l.toUpperCase());
}

function fmtDuration(sec) {
  if (!sec) return '—';
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
}

function fmtDiscovery(method) {
  const labels = {
    search_result: '🔍 站内搜索', category_browse: '📂 分类浏览',
    homepage_popular: '🏠 首页热门', blog_related: '📝 博客推荐',
    manufacturer_page: '🏭 制造商页', direct_url: '🔗 直接链接',
  };
  return labels[method] || method;
}

function fmtTrigger(trigger) {
  const labels = {
    product_page_btn: '📦 产品页按钮', floating_btn: '💬 悬浮按钮',
    cta_section: '📢 CTA 区块', bom_tool: '📋 BOM 工具',
    homepage_cta: '🏠 首页CTA', header_nav: '🧭 顶部导航',
  };
  return labels[trigger] || trigger;
}

export default function AdminRfqPage() {
  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, status: statusFilter });
    const res = await fetch(`/api/admin/rfq?${params}`);
    const data = await res.json();
    setSubmissions(data.submissions || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRfqs(); 
  }, [fetchRfqs]);

  const updateStatus = async (id, status) => {
    await fetch('/api/admin/rfq', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchRfqs();
  };

  const deleteRfq = async (id) => {
    if (!confirm('Delete this RFQ submission?')) return;
    await fetch(`/api/admin/rfq?id=${id}`, { method: 'DELETE' });
    fetchRfqs();
  };

  const statusColors = {
    new: '#3b82f6', processing: '#f59e0b', quoted: '#10b981', closed: '#6b7280', spam: '#ef4444',
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>RFQ Inquiries <span className="admin-count">({total})</span></h1>
      </div>

      <div className="admin-toolbar">
        <select
          className="admin-input admin-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="new">🔵 New</option>
          <option value="processing">🟡 Processing</option>
          <option value="quoted">🟢 Quoted</option>
          <option value="closed">⚫ Closed</option>
          <option value="spam">🔴 Spam</option>
        </select>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="admin-empty">
            <span style={{ fontSize: 48 }}>📋</span>
            <p>No RFQ submissions{statusFilter ? ` with status "${statusFilter}"` : ''}</p>
          </div>
        ) : (
          <div className="admin-rfq-list">
            {submissions.map(rfq => {
              // Parse tracking data
              let tracking = {};
              try { tracking = rfq.trackingData ? JSON.parse(rfq.trackingData) : {}; } catch {}

              return (
                <div key={rfq.id} className={`admin-rfq-item ${expandedId === rfq.id ? 'expanded' : ''}`}>
                  <div className="admin-rfq-header" onClick={() => setExpandedId(expandedId === rfq.id ? null : rfq.id)}>
                    <div className="admin-rfq-meta">
                      <span className="admin-rfq-status" style={{ background: statusColors[rfq.status] || '#6b7280' }}>
                        {rfq.status.toUpperCase()}
                      </span>
                      <strong>{rfq.name}</strong>
                      <span className="admin-rfq-email">{rfq.email}</span>
                      {rfq.company && <span className="admin-rfq-company">@ {rfq.company}</span>}
                      {/* Source channel badge inline */}
                      {rfq.sourceChannel && (
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: '12px',
                          fontSize: '11px', fontWeight: 600, marginLeft: '8px',
                          background: `${getChannelColor(rfq.sourceChannel)}18`,
                          color: getChannelColor(rfq.sourceChannel),
                          border: `1px solid ${getChannelColor(rfq.sourceChannel)}30`,
                        }}>
                          {fmtChannel(rfq.sourceChannel)}
                        </span>
                      )}
                    </div>
                    <div className="admin-rfq-right">
                      <span className="admin-rfq-parts-count">{rfq.parts?.length || 0} parts</span>
                      <span className="admin-rfq-date">{new Date(rfq.submittedAt).toLocaleDateString()}</span>
                      <span className="admin-rfq-expand">{expandedId === rfq.id ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {expandedId === rfq.id && (
                    <div className="admin-rfq-detail">
                      {/* Contact info + Tracking side by side */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        {/* Left: Contact Info */}
                        <div className="admin-rfq-contact">
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            👤 联系信息
                          </h4>
                          <div><strong>Email:</strong> <a href={`mailto:${rfq.email}`}>{rfq.email}</a></div>
                          {rfq.phone && <div><strong>Phone:</strong> {rfq.phone}</div>}
                          {rfq.country && <div><strong>Country:</strong> {rfq.country}</div>}
                          {rfq.message && <div><strong>Message:</strong> {rfq.message}</div>}
                          {rfq.bomFile && (
                            <div style={{ marginTop: '8px' }}>
                              <strong>BOM File:</strong>{' '}
                              <a
                                href={`/api/admin/bom-download?id=${rfq.id}`}
                                download
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  padding: '4px 12px', borderRadius: '6px', fontSize: '12px',
                                  background: 'rgba(255,107,0,0.1)', color: '#FF6B00',
                                  fontWeight: 600, textDecoration: 'none',
                                  border: '1px solid rgba(255,107,0,0.2)',
                                }}
                              >
                                📎 {rfq.bomFileName || 'Download BOM'}
                              </a>
                            </div>
                          )}
                          {rfq.ipAddress && <div className="admin-rfq-ip"><strong>IP:</strong> {rfq.ipAddress}</div>}
                          {rfq.notes && <div className="admin-rfq-notes"><strong>Notes:</strong> {rfq.notes}</div>}
                        </div>

                        {/* Right: Tracking Info */}
                        <div style={{
                          background: 'var(--color-bg-secondary, #0f1729)', borderRadius: '8px',
                          padding: '14px 16px', fontSize: '13px', lineHeight: 1.8,
                        }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            📍 来源追踪
                          </h4>

                          <TrackingRow label="渠道" value={
                            <span style={{
                              padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                              background: `${getChannelColor(rfq.sourceChannel)}18`,
                              color: getChannelColor(rfq.sourceChannel),
                            }}>{fmtChannel(rfq.sourceChannel)}</span>
                          } />

                          {tracking.referrer_parsed?.name && (
                            <TrackingRow label="来源站" value={
                              <>{tracking.referrer_parsed.name} <span style={{ color: '#64748b', fontSize: '11px' }}>({tracking.referrer_parsed.type})</span></>
                            } />
                          )}
                          {tracking.referrer_parsed?.keyword && (
                            <TrackingRow label="搜索词" value={
                              <span style={{ fontFamily: 'var(--font-mono)', color: '#4285F4', fontWeight: 600 }}>{tracking.referrer_parsed.keyword}</span>
                            } />
                          )}
                          {tracking.referrer && !tracking.referrer_parsed && (
                            <TrackingRow label="Referrer" value={
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', wordBreak: 'break-all' }}>{tracking.referrer}</span>
                            } />
                          )}
                          {tracking.ad_click && (
                            <TrackingRow label="广告点击" value={
                              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', background: 'rgba(234,67,53,0.1)', color: '#EA4335', fontWeight: 600 }}>
                                {tracking.ad_click.label} ({tracking.ad_click.param})
                              </span>
                            } />
                          )}
                          {(tracking.utm_source || tracking.utm_medium || tracking.utm_campaign) && (
                            <TrackingRow label="UTM" value={
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                                {[
                                  tracking.utm_source && `source=${tracking.utm_source}`,
                                  tracking.utm_medium && `medium=${tracking.utm_medium}`,
                                  tracking.utm_campaign && `campaign=${tracking.utm_campaign}`,
                                  tracking.utm_content && `content=${tracking.utm_content}`,
                                  tracking.utm_term && `term=${tracking.utm_term}`,
                                ].filter(Boolean).join(', ')}
                              </span>
                            } />
                          )}
                          <TrackingRow label="着陆页" value={
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-accent, #FF6B00)' }}>
                              {tracking.landing_page || rfq.landingPage || '—'}
                            </span>
                          } />
                          {tracking.device && (
                            <TrackingRow label="设备" value={
                              <>{tracking.device === 'mobile' ? '📱' : tracking.device === 'tablet' ? '📟' : '🖥️'} {tracking.os || ''} / {tracking.browser || ''}</>
                            } />
                          )}
                          {tracking.session_duration_sec != null && (
                            <TrackingRow label="会话时长" value={fmtDuration(tracking.session_duration_sec)} />
                          )}
                          {tracking.page_views != null && (
                            <TrackingRow label="浏览页数" value={`${tracking.page_views} 页`} />
                          )}
                          {tracking.rfq_trigger?.trigger && (
                            <TrackingRow label="询盘触发" value={fmtTrigger(tracking.rfq_trigger.trigger)} />
                          )}
                        </div>
                      </div>

                      {/* Journey Path */}
                      {tracking.journey?.length > 0 && (
                        <div style={{
                          background: 'var(--color-bg-secondary, #0f1729)', borderRadius: '8px',
                          padding: '12px 16px', marginBottom: '12px',
                        }}>
                          <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            🗺️ 浏览路径 ({tracking.journey.length} 页)
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                            {tracking.journey.map((step, i) => (
                              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {i > 0 && <span style={{ color: '#475569', fontSize: '10px' }}>→</span>}
                                <span style={{
                                  fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                                  fontFamily: 'var(--font-mono)',
                                  background: step.startsWith('/product/') ? 'rgba(255,107,0,0.1)' : step === '/rfq' ? 'rgba(16,185,129,0.1)' : 'var(--color-bg-card, #1a2332)',
                                  color: step.startsWith('/product/') ? '#FF6B00' : step === '/rfq' ? '#10b981' : '#94a3b8',
                                  border: '1px solid var(--color-border, #1e293b)',
                                }}>
                                  {step}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Products Viewed + Searches side by side */}
                      {(tracking.products_viewed?.length > 0 || tracking.searches?.length > 0) && (
                        <div style={{ display: 'grid', gridTemplateColumns: tracking.products_viewed?.length > 0 && tracking.searches?.length > 0 ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '12px' }}>
                          {tracking.products_viewed?.length > 0 && (
                            <div style={{ background: 'var(--color-bg-secondary, #0f1729)', borderRadius: '8px', padding: '12px 16px' }}>
                              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                📦 浏览过的产品 ({tracking.products_viewed.length})
                              </h4>
                              {tracking.products_viewed.map((pv, i) => (
                                <div key={i} style={{ fontSize: '12px', padding: '3px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-accent, #FF6B00)' }}>{pv.pn}</span>
                                  {pv.mfr && <span style={{ color: '#64748b', fontSize: '11px' }}>{pv.mfr}</span>}
                                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', background: 'var(--color-bg-card, #1a2332)', color: '#64748b' }}>
                                    {fmtDiscovery(pv.via)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {tracking.searches?.length > 0 && (
                            <div style={{ background: 'var(--color-bg-secondary, #0f1729)', borderRadius: '8px', padding: '12px 16px' }}>
                              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                🔍 站内搜索
                              </h4>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {tracking.searches.map((q, i) => (
                                  <span key={i} style={{
                                    fontSize: '12px', padding: '3px 10px', borderRadius: '12px',
                                    fontFamily: 'var(--font-mono)', background: 'rgba(66,133,244,0.1)', color: '#4285F4',
                                  }}>{q}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Parts Table */}
                      <table className="admin-table admin-rfq-parts-table">
                        <thead>
                          <tr>
                            <th>Part Number</th>
                            <th>Manufacturer</th>
                            <th>Quantity</th>
                            <th>Target Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rfq.parts?.map((part, i) => (
                            <tr key={i}>
                              <td className="admin-td-mono">{part.partNumber}</td>
                              <td>{part.manufacturer || '—'}</td>
                              <td>{part.qty || '—'}</td>
                              <td>{part.targetPrice ? `$${part.targetPrice}` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="admin-rfq-actions">
                        <select
                          className="admin-input-sm"
                          value={rfq.status}
                          onChange={(e) => updateStatus(rfq.id, e.target.value)}
                        >
                          <option value="new">New</option>
                          <option value="processing">Processing</option>
                          <option value="quoted">Quoted</option>
                          <option value="closed">Closed</option>
                          <option value="spam">Spam</option>
                        </select>
                        <a href={`mailto:${rfq.email}?subject=RE: Quote Request - FPGACenter&body=Dear ${rfq.name},%0A%0AThank you for your inquiry.%0A%0A`} className="admin-btn-sm admin-btn-primary">
                          Reply via Email
                        </a>
                        <button className="admin-btn-sm admin-btn-danger" onClick={() => deleteRfq(rfq.id)}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="admin-btn-sm">← Prev</button>
            <span className="admin-page-info">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="admin-btn-sm">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function TrackingRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '2px 0' }}>
      <span style={{ color: '#64748b', fontSize: '12px', minWidth: '70px', flexShrink: 0 }}>{label}:</span>
      <span style={{ fontSize: '13px' }}>{value}</span>
    </div>
  );
}
