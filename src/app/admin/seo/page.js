'use client';
import { useState, useEffect } from 'react';

const DEFAULT_ROBOTS = `User-Agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\n\nSitemap: https://fpgacenter.com/sitemap.xml`;

export default function AdminSeoPage() {
  const [settings, setSettings] = useState({
    robots_txt: '',
    sitemap_urls: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Stats
  const [sitemapInfo, setSitemapInfo] = useState(null);

  useEffect(() => {
    // Load SEO settings
    fetch('/api/admin/seo')
      .then(r => r.json())
      .then(data => {
        setSettings({
          robots_txt: data.robots_txt || DEFAULT_ROBOTS,
          sitemap_urls: data.sitemap_urls || '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
      
    // Quick test fetch to sitemap to see if it's reachable and get size overhead roughly
    fetch('/sitemap.xml', { method: 'HEAD' })
      .then(r => {
        if (r.ok) {
           setSitemapInfo({
             status: 'Active',
             lastCheck: new Date().toLocaleTimeString(),
           });
        }
      })
      .catch(() => {});
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
      if (res.ok) {
        setMessage({ type: 'success', text: 'SEO settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error.' });
    }
    setSaving(false);
  };

  if (loading) return <div className="admin-page"><div className="admin-loading">Loading SEO data...</div></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>SEO Tools</h1>
        <p>Manage Robots.txt and Sitemap configurations</p>
      </div>
      
      {message && (
        <div className={`admin-alert admin-alert-${message.type === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      <div className="admin-grid-2">
        {/* Robots.txt Manager */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>🕷️ Robots.txt Editor</h2>
          </div>
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.6 }}>
              This file tells search engine crawlers which URLs they can access. 
              <strong>Real-time updates</strong>: Any changes here will be instantly reflected on the live <code>/robots.txt</code> path.
            </p>
            <div className="admin-field">
              <textarea
                className="admin-input"
                rows={12}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', backgroundColor: '#0f1729' }}
                value={settings.robots_txt}
                onChange={(e) => setSettings({ ...settings, robots_txt: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Robots.txt'}
              </button>
              <a href="/robots.txt" target="_blank" className="admin-btn" style={{ background: '#334155', color: '#fff' }}>
                🔗 View Live
              </a>
            </div>
          </div>
        </div>

        {/* Sitemap Manager */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>🗺️ Sitemap Manager</h2>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px' }}>⚡</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px' }}>Dynamic Sitemap</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  The sitemap is generated automatically in real-time. It includes all active products, categories, manufacturers, and blog posts.
                </p>
              </div>
            </div>
            
            <div className="admin-field">
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Custom URLs (Optional)</label>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                Enter custom paths to manually include in the sitemap (one per line). Start with a forward slash (e.g. <code>/special-promo-page</code>).
              </p>
              <textarea
                className="admin-input"
                rows={5}
                placeholder="/landing-page-1&#10;/campaign/summer-sale"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', backgroundColor: '#0f1729' }}
                value={settings.sitemap_urls}
                onChange={(e) => setSettings({ ...settings, sitemap_urls: e.target.value })}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Custom URLs'}
              </button>
              <a href="/sitemap.xml" target="_blank" className="admin-btn" style={{ background: '#334155', color: '#fff' }}>
                🔗 View Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
