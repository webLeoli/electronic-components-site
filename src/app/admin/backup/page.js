'use client';
import { useEffect, useState } from 'react';

const TYPE_DEFS = [
  { key: 'blogPosts', label: 'Blog posts', hint: 'filtered by last-updated date', default: true },
  { key: 'blogCategories', label: 'Blog categories', hint: 'always full (tiny)', default: true },
  { key: 'rfq', label: 'RFQ inquiries', hint: 'filtered by submission date', default: true },
  { key: 'contacts', label: 'Contact messages', hint: 'filtered by submission date', default: true },
  { key: 'products', label: 'Products (incremental)', hint: 'only rows updated in range', default: false },
];

function isoDaysAgo(days) {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 10);
}

export default function AdminBackupPage() {
  const [selected, setSelected] = useState(
    Object.fromEntries(TYPE_DEFS.map((t) => [t.key, t.default])),
  );
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(isoDaysAgo(0));
  const [counts, setCounts] = useState(null);
  const [overCap, setOverCap] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [error, setError] = useState('');

  const types = TYPE_DEFS.filter((t) => selected[t.key]).map((t) => t.key).join(',');

  useEffect(() => {
    const params = new URLSearchParams({ types, from, to });
    const timer = setTimeout(() => {
      if (!types) { setCounts(null); return; }
      setLoadingCounts(true);
      setError('');
      fetch(`/api/admin/backup?${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) throw new Error(d.error);
          setCounts(d.counts || {});
          setOverCap(Boolean(d.productsOverCap));
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoadingCounts(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [types, from, to]);

  const download = () => {
    const params = new URLSearchParams({ types, from, to, download: '1' });
    window.location.href = `/api/admin/backup?${params}`;
  };

  const totalRows = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Data Backup</h1>
        <p>Export blog, inquiry, and incremental product data for a date range as a JSON file you can store locally</p>
      </div>

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>What to back up</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TYPE_DEFS.map((t) => (
            <label key={t.key} style={{ fontSize: 14, color: '#e2e8f0' }}>
              <input
                type="checkbox"
                checked={selected[t.key]}
                onChange={(e) => setSelected((s) => ({ ...s, [t.key]: e.target.checked }))}
              />{' '}
              {t.label}{' '}
              <span style={{ fontSize: 12, color: '#64748b' }}>({t.hint})</span>
              {counts && counts[t.key] !== undefined && (
                <span style={{ fontSize: 12, color: '#38bdf8', marginLeft: 8 }}>
                  {counts[t.key].toLocaleString()} rows
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Date range</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>From</span>
            <input type="date" className="admin-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>To</span>
            <input type="date" className="admin-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          {presets.map((p) => (
            <button
              key={p.days}
              className="admin-btn-sm admin-btn-ghost"
              onClick={() => { setFrom(isoDaysAgo(p.days)); setTo(isoDaysAgo(0)); }}
            >
              {p.label}
            </button>
          ))}
          <button className="admin-btn-sm admin-btn-ghost" onClick={() => { setFrom(''); setTo(''); }}>
            All time
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', margin: '10px 0 0' }}>
          Leave both dates empty for a full export. Blog posts use last-updated time, so edited
          articles are picked up by the next period backup.
        </p>
      </div>

      {error && (
        <div className="admin-card" style={{ marginBottom: 16, borderLeft: '3px solid #ef4444' }}>
          <span style={{ color: '#fca5a5', fontSize: 13 }}>⚠ {error}</span>
        </div>
      )}

      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            className="admin-btn admin-btn-primary"
            onClick={download}
            disabled={!types || loadingCounts || totalRows === 0 || overCap}
          >
            ⬇️ Download Backup ({loadingCounts ? '...' : totalRows.toLocaleString()} rows)
          </button>
          {overCap && (
            <span style={{ fontSize: 12, color: '#f59e0b' }}>
              Too many products in range - narrow the dates (cap 50,000)
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: '#64748b', margin: '12px 0 0' }}>
          Restore on any environment with:{' '}
          <code style={{ color: '#94a3b8' }}>node scripts/restore-backup.mjs backup.json</code>{' '}
          (add <code style={{ color: '#94a3b8' }}>--dry-run</code> to preview). Restores are
          idempotent: posts/categories/products upsert by slug or part number, inquiries skip
          already-present ids.
        </p>
      </div>
    </div>
  );
}
