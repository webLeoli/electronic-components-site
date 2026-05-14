'use client';
import { useEffect, useState, useCallback } from 'react';

const TIER_CONFIG = {
  gold:    { label: 'Gold',    emoji: '🥇', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  min: 70 },
  silver:  { label: 'Silver',  emoji: '🥈', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', min: 45 },
  bronze:  { label: 'Bronze',  emoji: '🥉', color: '#eab308', bg: 'rgba(234,179,8,0.12)',  min: 20 },
  noindex: { label: 'Noindex', emoji: '⛔', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  min: 0 },
};

function TierBadge({ tier, score }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.noindex;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
      background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      {cfg.emoji} {score !== undefined ? `${score}` : cfg.label}
    </span>
  );
}

function getTier(score) {
  if (score >= 70) return 'gold';
  if (score >= 45) return 'silver';
  if (score >= 20) return 'bronze';
  return 'noindex';
}

// --- Visual bar chart component ---
function TierBar({ tiers, total }) {
  if (!total) return null;
  const tierOrder = ['gold', 'silver', 'bronze', 'noindex'];
  return (
    <div style={{ display: 'flex', height: '32px', borderRadius: '8px', overflow: 'hidden', background: '#0f172a' }}>
      {tierOrder.map(tier => {
        const count = tiers[tier] || 0;
        const pct = (count / total) * 100;
        if (pct < 0.5) return null;
        const cfg = TIER_CONFIG[tier];
        return (
          <div
            key={tier}
            title={`${cfg.label}: ${count.toLocaleString()} (${pct.toFixed(1)}%)`}
            style={{
              width: `${pct}%`, background: cfg.color, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: '#fff',
              transition: 'width 0.5s ease',
            }}
          >
            {pct > 5 ? `${pct.toFixed(0)}%` : ''}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminQualityPage() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [prodTotal, setProdTotal] = useState(0);
  const [prodPage, setProdPage] = useState(1);
  const [prodPages, setProdPages] = useState(1);
  const [tierFilter, setTierFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState(false);
  const [opResult, setOpResult] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/quality');
      const data = await res.json();
      setStats(data);
    } catch {}
  }, []);

  // Fetch product list
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'products', page: prodPage, tier: tierFilter, q: search,
      });
      const res = await fetch(`/api/admin/quality?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setProdTotal(data.total || 0);
      setProdPages(data.totalPages || 1);
    } catch {}
    setLoading(false);
  }, [prodPage, tierFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchStats]);
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Batch operations
  const handleOperation = async (action, threshold) => {
    const confirmMsg = action === 'disable_all'
      ? 'This will remove ALL products from the sitemap. Are you sure?'
      : action === 'rescore'
      ? `Re-score all products and set indexing threshold to ${threshold}?`
      : `Enable indexing for all products with score ≥ ${threshold}?`;

    if (!confirm(confirmMsg)) return;

    setOperating(true);
    setOpResult(null);
    try {
      const res = await fetch('/api/admin/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, threshold }),
      });
      const data = await res.json();
      if (res.ok) {
        setOpResult({ type: 'success', text: JSON.stringify(data) });
        fetchStats();
        fetchProducts();
      } else {
        setOpResult({ type: 'error', text: data.error || 'Operation failed' });
      }
    } catch (e) {
      setOpResult({ type: 'error', text: e.message });
    }
    setOperating(false);
  };

  // Per-product toggle
  const toggleIndexable = async (productId, current) => {
    try {
      await fetch('/api/admin/quality', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, indexable: !current }),
      });
      fetchProducts();
      fetchStats();
    } catch {}
  };

  // Search debounce
  const [searchTimer, setSearchTimer] = useState(null);
  const handleSearch = (val) => {
    setSearch(val);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => setProdPage(1), 300));
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Quality & Indexing Control</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {['overview', 'products'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`admin-btn-sm ${activeTab === tab ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {tab === 'overview' ? '📊 Overview & Controls' : '📋 Product Quality List'}
          </button>
        ))}
      </div>

      {/* Operation result */}
      {opResult && (
        <div className={`admin-alert admin-alert-${opResult.type === 'success' ? 'success' : 'danger'}`}
          style={{ marginBottom: '16px' }}>
          {opResult.text}
        </div>
      )}

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && stats && (
        <>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div className="admin-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#e2e8f0' }}>{stats.total?.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Total Products</div>
            </div>
            <div className="admin-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#22c55e' }}>{stats.indexable?.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Indexable</div>
            </div>
            <div className="admin-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#3b82f6' }}>{stats.avgScore}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Avg Score</div>
            </div>
            <div className="admin-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>
                {stats.total ? ((stats.indexable / stats.total) * 100).toFixed(1) : 0}%
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Index Rate</div>
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="admin-card" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#e2e8f0' }}>Quality Tier Distribution</h3>
            <TierBar tiers={stats.tiers} total={stats.total} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
              {Object.entries(TIER_CONFIG).map(([tier, cfg]) => (
                <div key={tier} style={{
                  padding: '12px', borderRadius: '8px', background: cfg.bg,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '20px' }}>{cfg.emoji}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: cfg.color, margin: '4px 0' }}>
                    {(stats.tiers?.[tier] || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {cfg.label} ({cfg.min}+)
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {stats.total ? ((stats.tiers?.[tier] || 0) / stats.total * 100).toFixed(1) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Batch Controls */}
          <div className="admin-card" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#e2e8f0' }}>Batch Indexing Controls</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {/* Re-score all */}
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => handleOperation('rescore', 45)}
                disabled={operating}
                style={{ padding: '12px', fontSize: '13px' }}
              >
                {operating ? '⏳ Processing...' : '🔄 Re-score All Products'}
                <br />
                <span style={{ fontSize: '10px', opacity: 0.7 }}>Recompute 0-100 scores</span>
              </button>

              {/* Enable Gold only */}
              <button
                className="admin-btn"
                style={{ padding: '12px', fontSize: '13px', background: '#166534', color: '#fff', border: 'none', borderRadius: '8px' }}
                onClick={() => handleOperation('enable_tier', 70)}
                disabled={operating}
              >
                🥇 Index Gold Only (≥70)
                <br />
                <span style={{ fontSize: '10px', opacity: 0.7 }}>~{stats.tiers?.gold?.toLocaleString()} products</span>
              </button>

              {/* Enable Gold + Silver */}
              <button
                className="admin-btn"
                style={{ padding: '12px', fontSize: '13px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px' }}
                onClick={() => handleOperation('enable_tier', 45)}
                disabled={operating}
              >
                🥈 Index Silver+ (≥45)
                <br />
                <span style={{ fontSize: '10px', opacity: 0.7 }}>~{((stats.tiers?.gold || 0) + (stats.tiers?.silver || 0)).toLocaleString()} products</span>
              </button>

              {/* Disable all */}
              <button
                className="admin-btn admin-btn-danger"
                style={{ padding: '12px', fontSize: '13px' }}
                onClick={() => handleOperation('disable_all')}
                disabled={operating}
              >
                ⛔ Disable All Indexing
                <br />
                <span style={{ fontSize: '10px', opacity: 0.7 }}>Emergency stop</span>
              </button>
            </div>
          </div>

          {/* Last Action */}
          {stats.lastAction && (
            <div className="admin-card" style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '13px', color: '#94a3b8' }}>Last Action</h3>
              <pre style={{ fontSize: '11px', color: '#64748b', margin: 0, overflow: 'auto' }}>
                {JSON.stringify(stats.lastAction, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}

      {/* === PRODUCTS TAB === */}
      {activeTab === 'products' && (
        <>
          {/* Filters */}
          <div className="admin-toolbar" style={{ marginBottom: '16px' }}>
            <input
              type="text"
              className="admin-input admin-search-input"
              placeholder="Search part number or manufacturer..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <select
              className="admin-input admin-select"
              value={tierFilter}
              onChange={(e) => { setTierFilter(e.target.value); setProdPage(1); }}
            >
              <option value="">All Tiers</option>
              <option value="gold">🥇 Gold (≥70)</option>
              <option value="silver">🥈 Silver (45-69)</option>
              <option value="bronze">🥉 Bronze (20-44)</option>
              <option value="noindex">⛔ Noindex (&lt;20)</option>
            </select>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
            Showing {prodTotal.toLocaleString()} products
          </div>

          {/* Product Quality Table */}
          <div className="admin-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Manufacturer</th>
                    <th style={{ width: '80px' }}>Score</th>
                    <th style={{ width: '80px' }}>Tier</th>
                    <th style={{ width: '80px' }}>Indexed</th>
                    <th>Description</th>
                    <th style={{ width: '60px' }}>Specs</th>
                    <th style={{ width: '60px' }}>Price</th>
                    <th style={{ width: '60px' }}>DS</th>
                    <th style={{ width: '60px' }}>Img</th>
                    <th style={{ width: '90px' }}>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={11} className="admin-td-center">Loading...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan={11} className="admin-td-center">No products found</td></tr>
                  ) : products.map(p => {
                    const tier = getTier(p.qualityScore);
                    const hasSpecs = p.specs && p.specs !== '{}' && p.specs !== '';
                    const hasDS = p.datasheet && p.datasheet.startsWith('http');
                    const hasImg = !!p.imageUrl;
                    const hasPrice = p.minPrice > 0;
                    return (
                      <tr key={p.id}>
                        <td className="admin-td-mono">
                          <a href={`/product/${(p.manufacturer || 'unknown').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}/${p.partNumber}`} target="_blank" rel="noopener">{p.partNumber}</a>
                        </td>
                        <td style={{ fontSize: '12px' }}>{p.manufacturer}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, fontFamily: 'monospace' }}>
                          {p.qualityScore}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <TierBadge tier={tier} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ color: p.indexable ? '#22c55e' : '#ef4444' }}>
                            {p.indexable ? '✅' : '❌'}
                          </span>
                        </td>
                        <td style={{
                          maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', color: '#94a3b8', fontSize: '11px',
                        }}>
                          {p.description || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ color: hasSpecs ? '#22c55e' : '#475569' }}>{hasSpecs ? '✓' : '—'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ color: hasPrice ? '#22c55e' : '#475569' }}>{hasPrice ? `$${p.minPrice.toFixed(2)}` : '—'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ color: hasDS ? '#22c55e' : '#475569' }}>{hasDS ? '✓' : '—'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ color: hasImg ? '#22c55e' : '#475569' }}>{hasImg ? '✓' : '—'}</span>
                        </td>
                        <td>
                          <button
                            className={`admin-btn-sm ${p.indexable ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                            onClick={() => toggleIndexable(p.id, p.indexable)}
                            style={{ fontSize: '10px', padding: '2px 8px' }}
                          >
                            {p.indexable ? 'Noindex' : 'Index'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {prodPages > 1 && (
              <div className="admin-pagination">
                <button disabled={prodPage <= 1} onClick={() => setProdPage(prodPage - 1)} className="admin-btn-sm">← Prev</button>
                <span className="admin-page-info">Page {prodPage} of {prodPages}</span>
                <button disabled={prodPage >= prodPages} onClick={() => setProdPage(prodPage + 1)} className="admin-btn-sm">Next →</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
