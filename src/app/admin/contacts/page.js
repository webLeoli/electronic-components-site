'use client';
import { useEffect, useState, useCallback } from 'react';

export default function AdminContactsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, status: statusFilter });
    const res = await fetch(`/api/admin/contacts?${params}`);
    const data = await res.json();
    setSubmissions(data.submissions || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const updateStatus = async (id, status) => {
    await fetch('/api/admin/contacts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchContacts();
  };

  const deleteContact = async (id) => {
    if (!confirm('Delete this contact submission?')) return;
    await fetch(`/api/admin/contacts?id=${id}`, { method: 'DELETE' });
    fetchContacts();
  };

  const statusColors = {
    new: '#3b82f6', read: '#f59e0b', replied: '#10b981', closed: '#6b7280', spam: '#ef4444',
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Contact Messages <span className="admin-count">({total})</span></h1>
      </div>

      <div className="admin-toolbar">
        <select
          className="admin-input admin-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="new">🔵 New</option>
          <option value="read">🟡 Read</option>
          <option value="replied">🟢 Replied</option>
          <option value="closed">⚫ Closed</option>
          <option value="spam">🔴 Spam</option>
        </select>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="admin-empty">
            <span style={{ fontSize: 48 }}>✉️</span>
            <p>No contact messages{statusFilter ? ` with status "${statusFilter}"` : ''}</p>
          </div>
        ) : (
          <div className="admin-rfq-list">
            {submissions.map(msg => (
              <div key={msg.id} className={`admin-rfq-item ${expandedId === msg.id ? 'expanded' : ''}`}>
                <div className="admin-rfq-header" onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}>
                  <div className="admin-rfq-meta">
                    <span className="admin-rfq-status" style={{ background: statusColors[msg.status] || '#6b7280' }}>
                      {msg.status.toUpperCase()}
                    </span>
                    <strong>{msg.name}</strong>
                    <span className="admin-rfq-email">{msg.email}</span>
                    {msg.company && <span className="admin-rfq-company">@ {msg.company}</span>}
                  </div>
                  <div className="admin-rfq-right">
                    <span style={{ fontSize: 13, color: '#94a3b8', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.subject}
                    </span>
                    <span className="admin-rfq-date">{new Date(msg.submittedAt).toLocaleDateString()}</span>
                    <span className="admin-rfq-expand">{expandedId === msg.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedId === msg.id && (
                  <div className="admin-rfq-detail">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      {/* Contact Info */}
                      <div className="admin-rfq-contact">
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                          👤 Contact Info
                        </h4>
                        <div><strong>Name:</strong> {msg.name}</div>
                        <div><strong>Email:</strong> <a href={`mailto:${msg.email}`}>{msg.email}</a></div>
                        {msg.company && <div><strong>Company:</strong> {msg.company}</div>}
                        {msg.phone && <div><strong>Phone:</strong> {msg.phone}</div>}
                        {msg.ipAddress && <div className="admin-rfq-ip"><strong>IP:</strong> {msg.ipAddress}</div>}
                      </div>

                      {/* Message */}
                      <div style={{
                        background: 'var(--color-bg-secondary, #0f1729)', borderRadius: '8px',
                        padding: '14px 16px', fontSize: '13px', lineHeight: 1.8,
                      }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                          📧 {msg.subject}
                        </h4>
                        <p style={{ whiteSpace: 'pre-wrap', color: '#e2e8f0', lineHeight: 1.7 }}>{msg.message}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {msg.notes && (
                      <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px' }}>
                        <strong>Admin Notes:</strong> {msg.notes}
                      </div>
                    )}

                    <div className="admin-rfq-actions">
                      <select
                        className="admin-input-sm"
                        value={msg.status}
                        onChange={(e) => updateStatus(msg.id, e.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                        <option value="closed">Closed</option>
                        <option value="spam">Spam</option>
                      </select>
                      <a href={`mailto:${msg.email}?subject=RE: ${msg.subject} - FPGACenter&body=Dear ${msg.name},%0A%0AThank you for reaching out.%0A%0A`} className="admin-btn-sm admin-btn-primary">
                        Reply via Email
                      </a>
                      <button className="admin-btn-sm admin-btn-danger" onClick={() => deleteContact(msg.id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
