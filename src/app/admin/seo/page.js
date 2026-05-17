'use client';

import { useEffect, useState } from 'react';

const DEFAULT_ROBOTS = `User-Agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: https://fpgacenter.com/sitemap.xml`;

function StatBox({ label, value, tone = '#e2e8f0' }) {
  return (
    <div className="admin-card" style={{ padding: '14px', textAlign: 'center' }}>
      <div style={{ fontSize: '24px', fontWeight: 800, color: tone }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

export default function AdminSeoPage() {
  const [settings, setSettings] = useState({
    robots_txt: '',
    sitemap_urls: '',
  });
  const [sitemap, setSitemap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo');
      const data = await res.json();
      setSettings({
        robots_txt: data.robots_txt || DEFAULT_ROBOTS,
        sitemap_urls: data.sitemap_urls || '',
      });
      setSitemap(data.sitemap || null);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load SEO settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        setMessage({ type: 'error', text: 'Failed to save settings.' });
        return;
      }

      setMessage({ type: 'success', text: 'SEO settings saved.' });
      await loadSettings();
    } catch {
      setMessage({ type: 'error', text: 'Connection error.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading SEO data...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>SEO Tools</h1>
        <p>Manage robots.txt, custom sitemap URLs, and generated sitemap status.</p>
      </div>

      {message && (
        <div
          className={`admin-alert admin-alert-${message.type === 'success' ? 'success' : 'danger'}`}
          style={{ marginBottom: '20px' }}
        >
          {message.text}
        </div>
      )}

      {sitemap && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <StatBox label="Total Products" value={sitemap.totalProducts} />
          <StatBox label="Indexable Products" value={sitemap.indexableProducts} tone="#22c55e" />
          <StatBox label="Product Sitemaps" value={sitemap.productSitemaps} tone="#38bdf8" />
          <StatBox label="URLs Per Product Sitemap" value={sitemap.productsPerSitemap} />
          <StatBox label="Custom URLs" value={sitemap.customUrlCount} />
          <StatBox label="Total Sitemap Files" value={sitemap.totalSitemaps} tone="#f59e0b" />
        </div>
      )}

      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Robots.txt Editor</h2>
          </div>
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.6 }}>
              Changes saved here are served by the live <code>/robots.txt</code> route.
            </p>
            <div className="admin-field">
              <textarea
                className="admin-input"
                rows={12}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', backgroundColor: '#0f1729' }}
                value={settings.robots_txt}
                onChange={event => setSettings({ ...settings, robots_txt: event.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Robots.txt'}
              </button>
              <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="admin-btn" style={{ background: '#334155', color: '#fff' }}>
                View Live
              </a>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Sitemap Manager</h2>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px' }}>Dynamic Sitemap</h3>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
                Product URLs are generated from products marked indexable in the quality controls. Product sitemap files are split automatically and capped below the 50,000 URL limit.
              </p>
            </div>

            <div className="admin-field">
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Custom URLs</label>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                One path per line. Use paths such as <code>/special-page</code>. Same-domain absolute URLs are also accepted.
              </p>
              <textarea
                className="admin-input"
                rows={7}
                placeholder="/landing-page-1&#10;/campaign/summer-sale"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', backgroundColor: '#0f1729' }}
                value={settings.sitemap_urls}
                onChange={event => setSettings({ ...settings, sitemap_urls: event.target.value })}
              />
            </div>

            {sitemap && (
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, margin: '12px 0 0' }}>
                Current output: <code>/sitemap.xml</code>, <code>/sitemap/static.xml</code>, <code>/sitemap/categories.xml</code>, and <code>{sitemap.productSitemaps}</code> product sitemap file{sitemap.productSitemaps === 1 ? '' : 's'}.
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Custom URLs'}
              </button>
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="admin-btn" style={{ background: '#334155', color: '#fff' }}>
                View Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
