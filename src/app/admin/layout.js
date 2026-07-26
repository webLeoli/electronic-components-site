'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './admin.css';

// SVG icon paths for admin nav (consistent rendering across all platforms)
const ICONS = {
  dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
  products: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  categories: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  manufacturers: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  blog: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  rfq: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  analytics: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  seo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  settings: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  site: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  logout: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  quality: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  backup: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
};

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin', iconKey: 'dashboard', roles: ['admin', 'editor', 'viewer'] },
  { name: 'Products', path: '/admin/products', iconKey: 'products', roles: ['admin', 'editor', 'viewer'] },
  { name: 'Categories', path: '/admin/categories', iconKey: 'categories', roles: ['admin', 'editor', 'viewer'] },
  { name: 'Manufacturers', path: '/admin/manufacturers', iconKey: 'manufacturers', roles: ['admin', 'editor', 'viewer'] },
  { name: 'Blog', path: '/admin/blog', iconKey: 'blog', roles: ['admin', 'editor'] },
  { name: 'RFQ Inquiries', path: '/admin/rfq', iconKey: 'rfq', roles: ['admin', 'editor', 'viewer'] },
  { name: 'Contact Messages', path: '/admin/contacts', iconKey: 'rfq', roles: ['admin', 'editor', 'viewer'] },
  { name: 'Analytics', path: '/admin/analytics', iconKey: 'analytics', roles: ['admin', 'editor'] },
  { name: 'SEO Tools', path: '/admin/seo', iconKey: 'seo', roles: ['admin'] },
  { name: 'Quality', path: '/admin/quality', iconKey: 'quality', roles: ['admin'] },
  { name: 'Users', path: '/admin/users', iconKey: 'users', roles: ['admin'] },
  { name: 'Backup', path: '/admin/backup', iconKey: 'backup', roles: ['admin'] },
  { name: 'Settings', path: '/admin/settings', iconKey: 'settings', roles: ['admin'] },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user info — must be before any conditional return (React Hooks rule)
  useEffect(() => {
    if (pathname === '/admin/login') return; // Skip fetch on login page
    fetch('/api/admin/auth')
      .then(r => r.json())
      .then(d => { if (d.user) setCurrentUser(d.user); })
      .catch(() => {});
  }, [pathname]);

  // Don't show sidebar on login page — AFTER all Hooks
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const userRole = currentUser?.role || 'admin'; // Default admin for legacy mode
  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link href="/admin" className="admin-logo">
            <div className="logo-icon" style={{ width: 32, height: 32, fontSize: 16 }}>F</div>
            <span>FPGACenter</span>
          </Link>
          <span className="admin-badge">Admin</span>
        </div>

        <nav className="admin-nav">
          {filteredNav.map(item => (
            <Link
              key={item.path}
              href={item.path}
              className={`admin-nav-item ${
                item.path === '/admin'
                  ? pathname === '/admin' ? 'active' : ''
                  : pathname.startsWith(item.path) ? 'active' : ''
              }`}
            >
              <span className="admin-nav-icon" dangerouslySetInnerHTML={{ __html: ICONS[item.iconKey] }} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          {/* Current user info */}
          {currentUser && (
            <div style={{
              padding: '10px 16px', marginBottom: '8px',
              background: 'var(--color-bg-secondary, #0f1729)',
              borderRadius: '8px', fontSize: '12px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '2px' }}>{currentUser.name}</div>
              <div style={{ color: '#64748b', fontSize: '11px' }}>{currentUser.email}</div>
              <span style={{
                display: 'inline-block', marginTop: '4px',
                padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600,
                background: userRole === 'admin' ? 'rgba(239,68,68,0.15)' : userRole === 'editor' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                color: userRole === 'admin' ? '#ef4444' : userRole === 'editor' ? '#f59e0b' : '#3b82f6',
              }}>
                {userRole === 'admin' ? 'Admin' : userRole === 'editor' ? 'Editor' : 'Viewer'}
              </span>
            </div>
          )}
          <a href="/" className="admin-nav-item" target="_blank">
            <span className="admin-nav-icon" dangerouslySetInnerHTML={{ __html: ICONS.site }} />
            View Site
          </a>
          <button onClick={handleLogout} className="admin-nav-item admin-logout-btn">
            <span className="admin-nav-icon" dangerouslySetInnerHTML={{ __html: ICONS.logout }} />
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
