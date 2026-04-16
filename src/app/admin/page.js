'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const DASH_ICONS = {
  products: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  categories: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  manufacturers: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  rfq: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  settings: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-page"><div className="admin-loading">Loading dashboard...</div></div>;
  if (!stats) return <div className="admin-page"><div className="admin-alert admin-alert-danger">Failed to load stats</div></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Overview of your FPGACenter platform</p>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" dangerouslySetInnerHTML={{ __html: DASH_ICONS.products }} />
          <div className="admin-stat-info">
            <div className="admin-stat-value">{stats.products?.toLocaleString()}</div>
            <div className="admin-stat-label">Total Products</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" dangerouslySetInnerHTML={{ __html: DASH_ICONS.categories }} />
          <div className="admin-stat-info">
            <div className="admin-stat-value">{stats.categories}</div>
            <div className="admin-stat-label">Categories</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" dangerouslySetInnerHTML={{ __html: DASH_ICONS.manufacturers }} />
          <div className="admin-stat-info">
            <div className="admin-stat-value">{stats.manufacturers}</div>
            <div className="admin-stat-label">Manufacturers</div>
          </div>
        </div>
        <div className="admin-stat-card accent">
          <div className="admin-stat-icon" dangerouslySetInnerHTML={{ __html: DASH_ICONS.rfq }} />
          <div className="admin-stat-info">
            <div className="admin-stat-value">{stats.rfqs}</div>
            <div className="admin-stat-label">RFQ Inquiries</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" dangerouslySetInnerHTML={{ __html: DASH_ICONS.settings }} />
          <div className="admin-stat-info">
            <div className="admin-stat-value">{stats.contacts || 0}</div>
            <div className="admin-stat-label">Contact Messages</div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Product Status</h2>
            <Link href="/admin/products" className="admin-link">View All →</Link>
          </div>
          <div className="admin-status-bars">
            {Object.entries(stats.statusBreakdown || {}).map(([status, count]) => (
              <div key={status} className="admin-status-bar">
                <span className={`admin-status-dot status-${status}`} />
                <span className="admin-status-name">{status.toUpperCase()}</span>
                <span className="admin-status-count">{count}</span>
                <div className="admin-progress">
                  <div className={`admin-progress-fill status-${status}`} style={{ width: `${(count / stats.products) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2>RFQ Status</h2>
            <Link href="/admin/rfq" className="admin-link">View All →</Link>
          </div>
          <div className="admin-status-bars">
            {Object.entries(stats.rfqBreakdown || {}).map(([status, count]) => (
              <div key={status} className="admin-status-bar">
                <span className={`admin-status-dot rfq-${status}`} />
                <span className="admin-status-name">{status.toUpperCase()}</span>
                <span className="admin-status-count">{count}</span>
              </div>
            ))}
            {Object.keys(stats.rfqBreakdown || {}).length === 0 && (
              <p className="admin-empty-text">No RFQ submissions yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Products */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2>Recently Added Products</h2>
          <Link href="/admin/products" className="admin-link">Manage →</Link>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Manufacturer</th>
                <th>Status</th>
                <th>Stock</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentProducts?.map(p => (
                <tr key={p.partNumber}>
                  <td className="admin-td-mono">{p.partNumber}</td>
                  <td>{p.manufacturer}</td>
                  <td><span className={`admin-badge-sm status-${p.status}`}>{p.status}</span></td>
                  <td>{p.stock?.toLocaleString()}</td>
                  <td>{p.minPrice ? `$${p.minPrice.toFixed(2)}` : 'RFQ'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-quick-actions">
        <Link href="/admin/products" className="admin-action-card">
          <span dangerouslySetInnerHTML={{ __html: DASH_ICONS.products }} />
          <strong>Manage Products</strong>
          <p>Add, edit, or delete products</p>
        </Link>
        <Link href="/admin/rfq" className="admin-action-card">
          <span dangerouslySetInnerHTML={{ __html: DASH_ICONS.rfq }} />
          <strong>View RFQ Inquiries</strong>
          <p>Review and respond to quotes</p>
        </Link>
        <Link href="/admin/settings" className="admin-action-card">
          <span dangerouslySetInnerHTML={{ __html: DASH_ICONS.settings }} />
          <strong>Settings</strong>
          <p>Change password, configure email</p>
        </Link>
      </div>
    </div>
  );
}
