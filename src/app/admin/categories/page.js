'use client';
import { useEffect, useState } from 'react';
import { getCategoryVisual, getComponentSvg, CATEGORY_ICONS } from '@/lib/component-images';

// Inline SVG category icon for admin
function AdminCategoryIcon({ slug, size = 28 }) {
  const visual = getCategoryVisual(slug);
  const svgData = getComponentSvg(visual.svg);
  return (
    <div style={{
      width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '6px', background: `${visual.color}15`, flexShrink: 0,
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox={svgData.viewBox}
        style={{ color: visual.color }} dangerouslySetInnerHTML={{ __html: svgData.paths }} />
    </div>
  );
}

// All available icon types for the picker
const ICON_TYPES = Object.keys(CATEGORY_ICONS);

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCat, setEditCat] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/categories');
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  // Build tree structure
  const rootCategories = categories.filter(c => !c.parentId);
  const getChildren = (parentId) => categories.filter(c => c.parentId === parentId);

  const openEditor = (cat) => {
    setEditCat({ ...cat });
    setSaveMsg(null);
  };

  const openCreateForm = (parentId = null) => {
    setEditCat({ id: null, name: '', slug: '', parentId, icon: '', seoTitle: '', seoDesc: '', sortOrder: 0 });
    setSaveMsg(null);
  };

  const saveCat = async () => {
    if (!editCat.name?.trim()) { setSaveMsg({ type: 'error', text: 'Name is required' }); return; }
    setSaving(true);
    setSaveMsg(null);

    const slug = editCat.slug?.trim() || editCat.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const body = { ...editCat, slug };
    delete body._count;
    delete body.parent;

    const method = editCat.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/categories', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setSaveMsg({ type: 'success', text: editCat.id ? 'Updated!' : 'Created!' });
      fetchCategories();
      setTimeout(() => setEditCat(null), 600);
    } else {
      setSaveMsg({ type: 'error', text: data.error || 'Failed' });
    }
    setSaving(false);
  };

  const deleteCat = async (id, name) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      fetchCategories();
    } else {
      alert(data.error || 'Cannot delete');
    }
  };

  const CategoryRow = ({ cat, depth = 0 }) => {
    const children = getChildren(cat.id);
    const visual = getCategoryVisual(cat.slug);
    return (
      <>
        <tr>
          <td style={{ padding: '6px 8px' }}>
            <AdminCategoryIcon slug={cat.slug} size={32} />
          </td>
          <td style={{ paddingLeft: `${8 + depth * 24}px` }}>
            {depth > 0 && <span style={{ color: '#475569', marginRight: 8 }}>└</span>}
            <strong style={{ color: '#f8fafc' }}>{cat.name}</strong>
          </td>
          <td style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{cat.slug}</td>
          <td>
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: 11,
              background: `${visual.color}15`, color: visual.color, fontWeight: 600,
            }}>
              {visual.svg}
            </span>
          </td>
          <td>{cat._count?.products ?? 0}</td>
          <td>{cat.sortOrder}</td>
          <td>
            <div className="admin-actions">
              <button className="admin-btn-sm admin-btn-ghost" onClick={() => openCreateForm(cat.id)}>+ Sub</button>
              <button className="admin-btn-sm admin-btn-primary" onClick={() => openEditor(cat)}>Edit</button>
              <button className="admin-btn-sm admin-btn-danger" onClick={() => deleteCat(cat.id, cat.name)}>Del</button>
            </div>
          </td>
        </tr>
        {children.map(child => <CategoryRow key={child.id} cat={child} depth={depth + 1} />)}
      </>
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Categories <span className="admin-count">({categories.length})</span></h1>
          <p>Manage product category hierarchy and icons</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => openCreateForm()}>+ New Category</button>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '44px' }}></th>
                <th>Name</th>
                <th>Slug</th>
                <th>Icon Type</th>
                <th>Products</th>
                <th>Sort</th>
                <th style={{ width: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="admin-td-center">Loading...</td></tr>
              ) : rootCategories.length === 0 ? (
                <tr><td colSpan={7} className="admin-td-center">No categories yet</td></tr>
              ) : (
                rootCategories.map(cat => <CategoryRow key={cat.id} cat={cat} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Editor Modal */}
      {editCat && (
        <div className="admin-modal-overlay" onClick={() => setEditCat(null)}>
          <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AdminCategoryIcon slug={editCat.slug || 'integrated-circuits'} size={36} />
                <h2>{editCat.id ? `Edit: ${editCat.name}` : 'Create Category'}</h2>
              </div>
              <button className="admin-modal-close" onClick={() => setEditCat(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              {saveMsg && <div className={`admin-alert admin-alert-${saveMsg.type === 'success' ? 'success' : 'danger'}`}>{saveMsg.text}</div>}

              <div className="admin-form-group">
                <label>Category Name *</label>
                <input className="admin-input" value={editCat.name || ''} onChange={e => setEditCat({ ...editCat, name: e.target.value })} placeholder="e.g. Integrated Circuits" />
              </div>
              <div className="admin-form-group">
                <label>URL Slug</label>
                <input className="admin-input" value={editCat.slug || ''} onChange={e => setEditCat({ ...editCat, slug: e.target.value })} placeholder="auto-generated from name" />
              </div>

              {/* Icon Preview — shows which SVG will be auto-matched */}
              <div className="admin-form-group">
                <label>Icon Preview <span style={{ color: '#64748b', fontWeight: 400 }}>(auto-matched by slug)</span></label>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '12px',
                  background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b',
                }}>
                  {ICON_TYPES.map(slug => {
                    const isActive = editCat.slug === slug || (editCat.slug && slug.includes(editCat.slug));
                    return (
                      <div
                        key={slug}
                        onClick={() => setEditCat({ ...editCat, slug })}
                        title={slug}
                        style={{
                          cursor: 'pointer', padding: '4px', borderRadius: '8px',
                          border: isActive ? '2px solid #4285F4' : '2px solid transparent',
                          background: isActive ? 'rgba(66,133,244,0.1)' : 'transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        <AdminCategoryIcon slug={slug} size={36} />
                      </div>
                    );
                  })}
                </div>
                <span style={{ fontSize: 11, color: '#475569', marginTop: 4, display: 'block' }}>
                  Click an icon to apply its slug. Current match: <strong style={{ color: getCategoryVisual(editCat.slug).color }}>{getCategoryVisual(editCat.slug).svg}</strong>
                </span>
              </div>

              <div className="admin-form-group">
                <label>Parent Category</label>
                <select className="admin-input" value={editCat.parentId || ''} onChange={e => setEditCat({ ...editCat, parentId: e.target.value ? parseInt(e.target.value) : null })}>
                  <option value="">— Top Level —</option>
                  {categories.filter(c => c.id !== editCat.id).map(c => (
                    <option key={c.id} value={c.id}>{c.parent ? `${c.parent.name} → ` : ''}{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Legacy Icon (emoji)</label>
                  <input className="admin-input" value={editCat.icon || ''} onChange={e => setEditCat({ ...editCat, icon: e.target.value })} placeholder="⚡ (optional fallback)" />
                </div>
                <div className="admin-form-group">
                  <label>Sort Order</label>
                  <input className="admin-input" type="number" value={editCat.sortOrder ?? 0} onChange={e => setEditCat({ ...editCat, sortOrder: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group">
                <label>SEO Title</label>
                <input className="admin-input" value={editCat.seoTitle || ''} onChange={e => setEditCat({ ...editCat, seoTitle: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>SEO Description</label>
                <textarea className="admin-input admin-textarea" rows={2} value={editCat.seoDesc || ''} onChange={e => setEditCat({ ...editCat, seoDesc: e.target.value })} />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={() => setEditCat(null)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={saveCat} disabled={saving}>
                {saving ? 'Saving...' : (editCat.id ? 'Save Changes' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
