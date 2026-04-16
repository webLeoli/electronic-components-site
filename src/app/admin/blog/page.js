'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, status: statusFilter, q: search });
    const res = await fetch(`/api/admin/blog?${params}`);
    const data = await res.json();
    setPosts(data.posts || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts(); 
  }, [fetchPosts]);

  const deletePost = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' });
    fetchPosts();
  };

  const updateStatus = async (id, status) => {
    await fetch('/api/admin/blog', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchPosts();
  };

  const statusColors = { draft: '#64748b', published: '#10b981', archived: '#f59e0b' };

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Blog Posts <span className="admin-count">({total})</span></h1>
          <p>Manage technical articles for SEO</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => router.push('/admin/blog/editor')}>
          ✏️ New Article
        </button>
      </div>

      <div className="admin-toolbar">
        <input
          type="text"
          className="admin-input admin-search-input"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="admin-input admin-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="draft">📝 Draft</option>
          <option value="published">✅ Published</option>
          <option value="archived">📦 Archived</option>
        </select>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Views</th>
                <th>Reading</th>
                <th>Updated</th>
                <th style={{ width: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="admin-td-center">Loading...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={7} className="admin-td-center">No articles yet. Click &quot;New Article&quot; to create one.</td></tr>
              ) : posts.map(p => (
                <tr key={p.id}>
                  <td>
                    <div>
                      <a href={`/blog/${p.slug}`} target="_blank" style={{ color: '#f8fafc', fontWeight: 600 }}>{p.title}</a>
                      {p.excerpt && <div style={{ color: '#64748b', fontSize: 11, marginTop: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.excerpt}</div>}
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{p.category?.name || '—'}</td>
                  <td>
                    <span style={{ background: statusColors[p.status] || '#64748b', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{p.viewCount?.toLocaleString()}</td>
                  <td style={{ fontSize: 12, color: '#94a3b8' }}>{p.readingTime || 1} min</td>
                  <td style={{ fontSize: 11, color: '#64748b' }}>{new Date(p.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn-sm admin-btn-primary" onClick={() => router.push(`/admin/blog/editor?id=${p.id}`)}>Edit</button>
                      {p.status === 'draft' && (
                        <button className="admin-btn-sm admin-btn-success" onClick={() => updateStatus(p.id, 'published')}>Publish</button>
                      )}
                      {p.status === 'published' && (
                        <button className="admin-btn-sm admin-btn-ghost" onClick={() => updateStatus(p.id, 'archived')}>Archive</button>
                      )}
                      <button className="admin-btn-sm admin-btn-danger" onClick={() => deletePost(p.id, p.title)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
