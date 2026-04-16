'use client';
import { useEffect, useState } from 'react';

export default function AdminManufacturersPage() {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMfr, setEditMfr] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const fetchManufacturers = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/manufacturers');
    const data = await res.json();
    setManufacturers(data.manufacturers || []);
    setLoading(false);
  };

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchManufacturers(); 
  }, []);

  const openEditor = (mfr) => { setEditMfr({ ...mfr }); setSaveMsg(null); };

  const openCreateForm = () => {
    setEditMfr({ id: null, name: '', slug: '', logo: '', website: '', country: '' });
    setSaveMsg(null);
  };

  const saveMfr = async () => {
    if (!editMfr.name?.trim()) { setSaveMsg({ type: 'error', text: 'Name is required' }); return; }
    setSaving(true);
    setSaveMsg(null);

    const slug = editMfr.slug?.trim() || editMfr.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const body = { ...editMfr, slug };
    delete body.productCount;

    const method = editMfr.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/manufacturers', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setSaveMsg({ type: 'success', text: editMfr.id ? 'Updated!' : 'Created!' });
      fetchManufacturers();
      setTimeout(() => setEditMfr(null), 600);
    } else {
      setSaveMsg({ type: 'error', text: data.error || 'Failed' });
    }
    setSaving(false);
  };

  const deleteMfr = async (id, name) => {
    if (!confirm(`Delete manufacturer "${name}"?`)) return;
    const res = await fetch(`/api/admin/manufacturers?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchManufacturers();
    else alert('Failed to delete');
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Manufacturers <span className="admin-count">({manufacturers.length})</span></h1>
          <p>Manage component manufacturers</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreateForm}>+ New Manufacturer</button>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Country</th>
                <th>Website</th>
                <th>Products</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="admin-td-center">Loading...</td></tr>
              ) : manufacturers.length === 0 ? (
                <tr><td colSpan={6} className="admin-td-center">No manufacturers yet</td></tr>
              ) : manufacturers.map(m => (
                <tr key={m.id}>
                  <td>
                    <strong style={{ color: '#f8fafc' }}>{m.name}</strong>
                  </td>
                  <td style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{m.slug}</td>
                  <td>{m.country || '—'}</td>
                  <td>
                    {m.website ? (
                      <a href={m.website} target="_blank" style={{ color: '#ff6b00', fontSize: 12 }}>{m.website.replace(/https?:\/\//, '').replace(/\/$/, '')}</a>
                    ) : '—'}
                  </td>
                  <td>
                    <span style={{ background: 'rgba(255,107,0,0.1)', color: '#ff6b00', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                      {m.productCount}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn-sm admin-btn-primary" onClick={() => openEditor(m)}>Edit</button>
                      <button className="admin-btn-sm admin-btn-danger" onClick={() => deleteMfr(m.id, m.name)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manufacturer Editor Modal */}
      {editMfr && (
        <div className="admin-modal-overlay" onClick={() => setEditMfr(null)}>
          <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editMfr.id ? `Edit: ${editMfr.name}` : 'Create Manufacturer'}</h2>
              <button className="admin-modal-close" onClick={() => setEditMfr(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              {saveMsg && <div className={`admin-alert admin-alert-${saveMsg.type === 'success' ? 'success' : 'danger'}`}>{saveMsg.text}</div>}

              <div className="admin-form-group">
                <label>Manufacturer Name *</label>
                <input className="admin-input" value={editMfr.name || ''} onChange={e => setEditMfr({ ...editMfr, name: e.target.value })} placeholder="e.g. STMicroelectronics" />
              </div>
              <div className="admin-form-group">
                <label>URL Slug</label>
                <input className="admin-input" value={editMfr.slug || ''} onChange={e => setEditMfr({ ...editMfr, slug: e.target.value })} placeholder="auto-generated from name" />
              </div>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Country</label>
                  <input className="admin-input" value={editMfr.country || ''} onChange={e => setEditMfr({ ...editMfr, country: e.target.value })} placeholder="e.g. Switzerland" />
                </div>
                <div className="admin-form-group">
                  <label>Logo URL</label>
                  <input className="admin-input" value={editMfr.logo || ''} onChange={e => setEditMfr({ ...editMfr, logo: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Website</label>
                <input className="admin-input" value={editMfr.website || ''} onChange={e => setEditMfr({ ...editMfr, website: e.target.value })} placeholder="https://www.st.com" />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={() => setEditMfr(null)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={saveMfr} disabled={saving}>
                {saving ? 'Saving...' : (editMfr.id ? 'Save Changes' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
