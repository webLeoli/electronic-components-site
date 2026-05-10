'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getProductVisualType, getComponentSvg, generateProductAlt, generateImageFilename } from '@/lib/component-images';

// Inline mini product icon for admin table (client-side)
function MiniProductIcon({ product, size = 32 }) {
  const visual = getProductVisualType(product);
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

// Image preview with upload — sends product metadata for smart filename
function ImageField({ value, onChange, folder = 'products', label = 'Product Image', partNumber = '', manufacturer = '' }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const suggestedAlt = generateProductAlt({ partNumber, manufacturer });
  const suggestedFilename = generateImageFilename({ partNumber, manufacturer });

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    // Send product metadata for SEO filename generation
    if (partNumber) formData.append('partNumber', partNumber);
    if (manufacturer) formData.append('manufacturer', manufacturer);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        onChange(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch { alert('Upload failed'); }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="admin-form-group admin-form-full">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Preview */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            width: 120, height: 120, borderRadius: '10px', cursor: 'pointer',
            border: `2px dashed ${dragOver ? '#4285F4' : value ? 'transparent' : '#334155'}`,
            background: dragOver ? 'rgba(66,133,244,0.08)' : value ? '#0f172a' : '#1e293b',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', transition: 'all 0.2s', flexShrink: 0,
          }}
        >
          {uploading ? (
            <span style={{ color: '#64748b', fontSize: 12 }}>Uploading...</span>
          ) : value ? (
            <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span style={{ fontSize: 10, color: '#475569', marginTop: 4, textAlign: 'center' }}>
                Click or drag
              </span>
            </>
          )}
        </div>

        {/* URL input + actions */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <input
            className="admin-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste image URL or upload a file"
            style={{ fontSize: 12 }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" className="admin-btn-sm admin-btn-ghost"
              onClick={() => fileInputRef.current?.click()}>
              📁 Upload
            </button>
            {value && (
              <button type="button" className="admin-btn-sm admin-btn-danger"
                onClick={() => onChange('')}>
                ✕ Remove
              </button>
            )}
          </div>
          <span style={{ fontSize: 10, color: '#475569' }}>
            Supports: JPEG, PNG, WebP, SVG, GIF (max 5MB)
          </span>
          {partNumber && (
            <div style={{ fontSize: 10, color: '#475569', marginTop: 4, borderTop: '1px solid #1e293b', paddingTop: 4 }}>
              <div>📝 Auto filename: <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{suggestedFilename}</span></div>
              <div>🏷️ Auto alt text: <span style={{ color: '#94a3b8' }}>{suggestedAlt}</span></div>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" hidden
          onChange={(e) => { if (e.target.files[0]) handleUpload(e.target.files[0]); }} />
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null); // Full edit modal
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, q: search, status: statusFilter });
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, search, statusFilter]);

  // Load categories for dropdown
  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts(); 
  }, [fetchProducts]);

  // Debounced search
  const [searchTimer, setSearchTimer] = useState(null);
  const handleSearch = (val) => {
    setSearch(val);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => setPage(1), 300));
  };

  const handleDelete = async (id, partNumber) => {
    if (!confirm(`Delete "${partNumber}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const openEditor = (product) => {
    // Parse specs JSON for editing
    let specsObj = {};
    try { specsObj = product.specs ? JSON.parse(product.specs) : {}; } catch { specsObj = {}; }
    setEditProduct({
      ...product,
      specsText: Object.entries(specsObj).map(([k, v]) => `${k}: ${v}`).join('\n'),
    });
    setSaveMsg(null);
  };

  const openCreateForm = () => {
    setEditProduct({
      id: null,
      partNumber: '', manufacturer: '', description: '',
      categoryId: null, packageType: '', mountType: '', status: 'active',
      minPrice: '', stock: 0, moq: 1, leadTime: '1-3 days',
      datasheet: '', imageUrl: '', specsText: '',
    });
    setShowCreateForm(true);
    setSaveMsg(null);
  };

  const saveProduct = async () => {
    if (!editProduct.partNumber?.trim()) {
      setSaveMsg({ type: 'error', text: 'Part number is required' });
      return;
    }
    setSaving(true);
    setSaveMsg(null);

    // Convert specsText back to JSON
    let specsJson = null;
    if (editProduct.specsText?.trim()) {
      const obj = {};
      editProduct.specsText.split('\n').forEach(line => {
        const [key, ...valParts] = line.split(':');
        if (key?.trim()) obj[key.trim()] = valParts.join(':').trim();
      });
      specsJson = JSON.stringify(obj);
    }

    const body = {
      ...editProduct,
      specs: specsJson,
      categoryId: editProduct.categoryId ? parseInt(editProduct.categoryId) : null,
      minPrice: editProduct.minPrice ? parseFloat(editProduct.minPrice) : null,
      stock: parseInt(editProduct.stock) || 0,
      moq: parseInt(editProduct.moq) || 1,
    };
    delete body.specsText;
    delete body.category;
    delete body.createdAt;
    delete body.updatedAt;

    const method = editProduct.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/products', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      setSaveMsg({ type: 'success', text: editProduct.id ? 'Product updated!' : 'Product created!' });
      fetchProducts();
      setTimeout(() => { setEditProduct(null); setShowCreateForm(false); }, 800);
    } else {
      setSaveMsg({ type: 'error', text: data.error || 'Failed to save' });
    }
    setSaving(false);
  };

  const closeEditor = () => { setEditProduct(null); setShowCreateForm(false); };

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Products <span className="admin-count">({total})</span></h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="/api/admin/products/export" className="admin-btn admin-btn-ghost" download>⬇ Export CSV</a>
          <button className="admin-btn admin-btn-primary" onClick={openCreateForm}>+ New Product</button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-toolbar">
        <input
          type="text"
          className="admin-input admin-search-input"
          placeholder="Search part number, manufacturer, description..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          className="admin-input admin-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="obsolete">Obsolete</option>
          <option value="eol">End of Life</option>
          <option value="nrnd">NRND</option>
        </select>
      </div>

      {/* Product Table */}
      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '44px' }}></th>
                <th>Part Number</th>
                <th>Manufacturer</th>
                <th>Category</th>
                <th>Description</th>
                <th>Status</th>
                <th>Stock</th>
                <th>Price</th>
                <th style={{ width: '80px' }}>Quality</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="admin-td-center">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={10} className="admin-td-center">No products found</td></tr>
              ) : products.map(p => (
                <tr key={p.id}>
                  {/* Image/Icon Column */}
                  <td style={{ padding: '4px 6px' }}>
                    {p.imageUrl ? (
                      <div style={{
                        width: 36, height: 36, borderRadius: '6px', overflow: 'hidden',
                        background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <img src={p.imageUrl} alt={generateProductAlt(p)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    ) : (
                      <MiniProductIcon product={p} size={36} />
                    )}
                  </td>
                  <td className="admin-td-mono">
                    <a href={`/product/${p.partNumber}`} target="_blank">{p.partNumber}</a>
                  </td>
                  <td>{p.manufacturer}</td>
                  <td>{p.category?.name || <span style={{ color: '#475569' }}>—</span>}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#94a3b8', fontSize: 12 }}>
                    {p.description || '—'}
                  </td>
                  <td><span className={`admin-badge-sm status-${p.status}`}>{p.status}</span></td>
                  <td>{p.stock?.toLocaleString()}</td>
                  <td>{p.minPrice ? `$${p.minPrice.toFixed(2)}` : 'RFQ'}</td>
                  <td>
                    {(() => {
                      const score = p.qualityScore || 0;
                      const tier = score >= 70 ? 'gold' : score >= 45 ? 'silver' : score >= 20 ? 'bronze' : 'noindex';
                      const colors = { gold: '#22c55e', silver: '#3b82f6', bronze: '#eab308', noindex: '#ef4444' };
                      const emojis = { gold: '🥇', silver: '🥈', bronze: '🥉', noindex: '⛔' };
                      return (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          fontSize: '11px', fontWeight: 600, color: colors[tier],
                        }}>
                          {emojis[tier]} {score}
                          {p.indexable && <span style={{ color: '#22c55e', marginLeft: '2px' }}>•</span>}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn-sm admin-btn-primary" onClick={() => openEditor(p)}>Edit</button>
                      <button className="admin-btn-sm admin-btn-danger" onClick={() => handleDelete(p.id, p.partNumber)}>Del</button>
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

      {/* Full Product Editor Modal */}
      {editProduct && (
        <div className="admin-modal-overlay" onClick={closeEditor}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Show current image or generate icon */}
                {editProduct.imageUrl ? (
                  <div style={{ width: 40, height: 40, borderRadius: '8px', overflow: 'hidden', background: '#0f172a', flexShrink: 0 }}>
                    <img src={editProduct.imageUrl} alt={generateProductAlt(editProduct)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                ) : editProduct.partNumber ? (
                  <MiniProductIcon product={editProduct} size={40} />
                ) : null}
                <h2>{editProduct.id ? `Edit: ${editProduct.partNumber}` : 'Create New Product'}</h2>
              </div>
              <button className="admin-modal-close" onClick={closeEditor}>✕</button>
            </div>

            <div className="admin-modal-body">
              {saveMsg && (
                <div className={`admin-alert admin-alert-${saveMsg.type === 'success' ? 'success' : 'danger'}`}>
                  {saveMsg.text}
                </div>
              )}

              <div className="admin-form-grid">
                {/* Row 1: Core Identity */}
                <div className="admin-form-group">
                  <label>Part Number *</label>
                  <input className="admin-input" value={editProduct.partNumber || ''} onChange={e => setEditProduct({ ...editProduct, partNumber: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Manufacturer *</label>
                  <input className="admin-input" value={editProduct.manufacturer || ''} onChange={e => setEditProduct({ ...editProduct, manufacturer: e.target.value })} />
                </div>

                {/* Row 2: Classification */}
                <div className="admin-form-group">
                  <label>Category</label>
                  <select className="admin-input" value={editProduct.categoryId || ''} onChange={e => setEditProduct({ ...editProduct, categoryId: e.target.value || null })}>
                    <option value="">— No Category —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.parent ? `${c.parent.name} → ` : ''}{c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Status</label>
                  <select className="admin-input" value={editProduct.status || 'active'} onChange={e => setEditProduct({ ...editProduct, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="obsolete">Obsolete</option>
                    <option value="eol">End of Life</option>
                    <option value="nrnd">Not Recommended</option>
                  </select>
                </div>

                {/* Row 3: Description (full width) */}
                <div className="admin-form-group admin-form-full">
                  <label>Description</label>
                  <input className="admin-input" value={editProduct.description || ''} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} placeholder="e.g. ARM Cortex-M3 MCU, 72MHz, 64KB Flash" />
                </div>

                {/* Row 4: Physical */}
                <div className="admin-form-group">
                  <label>Package Type</label>
                  <input className="admin-input" value={editProduct.packageType || ''} onChange={e => setEditProduct({ ...editProduct, packageType: e.target.value })} placeholder="e.g. LQFP-48, BGA-256" />
                </div>
                <div className="admin-form-group">
                  <label>Mount Type</label>
                  <select className="admin-input" value={editProduct.mountType || ''} onChange={e => setEditProduct({ ...editProduct, mountType: e.target.value })}>
                    <option value="">— Select —</option>
                    <option value="SMD">SMD</option>
                    <option value="THT">Through-Hole (THT)</option>
                    <option value="BGA">BGA</option>
                    <option value="DIP">DIP</option>
                    <option value="QFP">QFP</option>
                    <option value="SOP">SOP</option>
                  </select>
                </div>

                {/* Row 5: Pricing & Stock */}
                <div className="admin-form-group">
                  <label>Unit Price (USD)</label>
                  <input className="admin-input" type="number" step="0.01" value={editProduct.minPrice ?? ''} onChange={e => setEditProduct({ ...editProduct, minPrice: e.target.value })} placeholder="0.00" />
                </div>
                <div className="admin-form-group">
                  <label>Stock</label>
                  <input className="admin-input" type="number" value={editProduct.stock ?? 0} onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })} />
                </div>

                {/* Row 6: MOQ & Lead Time */}
                <div className="admin-form-group">
                  <label>MOQ (Min Order Qty)</label>
                  <input className="admin-input" type="number" value={editProduct.moq ?? 1} onChange={e => setEditProduct({ ...editProduct, moq: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Lead Time</label>
                  <input className="admin-input" value={editProduct.leadTime || ''} onChange={e => setEditProduct({ ...editProduct, leadTime: e.target.value })} placeholder="e.g. 1-3 days" />
                </div>

                {/* Row 7: Datasheet Link */}
                <div className="admin-form-group admin-form-full">
                  <label>Datasheet URL</label>
                  <input className="admin-input" value={editProduct.datasheet || ''} onChange={e => setEditProduct({ ...editProduct, datasheet: e.target.value })} placeholder="https://..." />
                </div>

                {/* Row 8: Image Upload */}
                <ImageField
                  value={editProduct.imageUrl}
                  onChange={(url) => setEditProduct({ ...editProduct, imageUrl: url })}
                  folder="products"
                  label="Product Image"
                  partNumber={editProduct.partNumber}
                  manufacturer={editProduct.manufacturer}
                />

                {/* Row 9: Technical Specs (full width textarea) */}
                <div className="admin-form-group admin-form-full">
                  <label>Technical Specifications <span style={{ color: '#64748b', fontWeight: 400 }}>(one per line: Key: Value)</span></label>
                  <textarea
                    className="admin-input admin-textarea"
                    rows={6}
                    value={editProduct.specsText || ''}
                    onChange={e => setEditProduct({ ...editProduct, specsText: e.target.value })}
                    placeholder={"Core: ARM Cortex-M3\nFrequency: 72 MHz\nFlash: 64 KB\nSram: 20 KB\nVoltage: 2.0V - 3.6V"}
                  />
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={closeEditor}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={saveProduct} disabled={saving}>
                {saving ? 'Saving...' : (editProduct.id ? 'Save Changes' : 'Create Product')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
