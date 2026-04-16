'use client';
import { useEffect, useState, useCallback } from 'react';

const ROLE_LABELS = {
  admin: { label: 'Admin', color: '#ef4444', icon: '👑' },
  editor: { label: 'Editor', color: '#f59e0b', icon: '✏️' },
  viewer: { label: 'Viewer', color: '#3b82f6', icon: '👁️' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [resetPwdId, setResetPwdId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('editor');

  // Edit form
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  // Reset password form
  const [resetPassword, setResetPassword] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 403) {
        setError('Only admin users can access user management.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError('Failed to load users');
    }
    setLoading(false);
  }, []);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers(); 
  }, [fetchUsers]);

  const showMsg = (type, text) => {
    if (type === 'error') { setError(text); setSuccess(''); }
    else { setSuccess(text); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, name: newName, userRole: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg('success', `User "${newName}" created successfully`);
        setShowCreate(false);
        setNewEmail(''); setNewName(''); setNewPassword(''); setNewRole('editor');
        fetchUsers();
      } else {
        showMsg('error', data.error);
      }
    } catch {
      showMsg('error', 'Failed to create user');
    }
  };

  const handleUpdate = async (id) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName, role: editRole }),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg('success', 'User updated');
        setEditingId(null);
        fetchUsers();
      } else {
        showMsg('error', data.error);
      }
    } catch {
      showMsg('error', 'Failed to update');
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      fetchUsers();
    } catch {}
  };

  const handleResetPassword = async (id) => {
    if (!resetPassword || resetPassword.length < 8) {
      showMsg('error', 'Password must be at least 8 characters');
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, newPassword: resetPassword }),
      });
      if (res.ok) {
        showMsg('success', 'Password reset successfully');
        setResetPwdId(null);
        setResetPassword('');
      } else {
        const data = await res.json();
        showMsg('error', data.error);
      }
    } catch {
      showMsg('error', 'Failed to reset password');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showMsg('success', 'User deleted');
        fetchUsers();
      } else {
        showMsg('error', data.error);
      }
    } catch {
      showMsg('error', 'Failed to delete');
    }
  };

  if (loading) return <div className="admin-page"><div className="admin-loading">Loading users...</div></div>;
  if (error && users.length === 0) return <div className="admin-page"><div className="admin-alert admin-alert-danger">{error}</div></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>User Management <span className="admin-count">({users.length})</span></h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>管理后台用户账户和权限</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '✕ Cancel' : '+ Add User'}
        </button>
      </div>

      {error && <div className="admin-alert admin-alert-danger">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      {/* Create User Form */}
      {showCreate && (
        <div className="admin-card" style={{ marginBottom: '16px' }}>
          <div className="admin-card-header"><h2>➕ Create New User</h2></div>
          <form onSubmit={handleCreate} style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="admin-field">
              <label>Email *</label>
              <input type="email" className="admin-input" value={newEmail} onChange={e => setNewEmail(e.target.value)} required placeholder="user@example.com" />
            </div>
            <div className="admin-field">
              <label>Name *</label>
              <input type="text" className="admin-input" value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Full name" />
            </div>
            <div className="admin-field">
              <label>Password * (min 8 chars)</label>
              <input type="password" className="admin-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} placeholder="••••••••" />
            </div>
            <div className="admin-field">
              <label>Role</label>
              <select className="admin-input admin-select" value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="admin">👑 Admin — Full access</option>
                <option value="editor">✏️ Editor — Can edit content</option>
                <option value="viewer">👁️ Viewer — Read-only access</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="admin-btn admin-btn-primary">Create User</button>
            </div>
          </form>
        </div>
      )}

      {/* Role Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px', color: '#64748b' }}>
        {Object.entries(ROLE_LABELS).map(([key, { label, icon }]) => (
          <span key={key}>{icon} <strong>{label}</strong> — {key === 'admin' ? '完全权限' : key === 'editor' ? '可编辑内容' : '只读权限'}</span>
        ))}
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
                    No users yet. Click &quot;Add User&quot; to create the first admin account.
                  </td>
                </tr>
              ) : users.map(user => (
                <tr key={user.id} style={{ opacity: user.isActive ? 1 : 0.5 }}>
                  <td>
                    {editingId === user.id ? (
                      <input type="text" className="admin-input-sm" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '140px' }} />
                    ) : (
                      <strong>{user.name}</strong>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{user.email}</td>
                  <td>
                    {editingId === user.id ? (
                      <select className="admin-input-sm" value={editRole} onChange={e => setEditRole(e.target.value)} style={{ width: '100px' }}>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                        background: `${ROLE_LABELS[user.role]?.color || '#64748b'}18`,
                        color: ROLE_LABELS[user.role]?.color || '#64748b',
                      }}>
                        {ROLE_LABELS[user.role]?.icon} {ROLE_LABELS[user.role]?.label || user.role}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      style={{
                        padding: '3px 10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 600,
                        background: user.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: user.isActive ? '#10b981' : '#ef4444',
                      }}
                    >
                      {user.isActive ? '✓ Active' : '✕ Disabled'}
                    </button>
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {editingId === user.id ? (
                        <>
                          <button className="admin-btn-sm admin-btn-primary" onClick={() => handleUpdate(user.id)}>Save</button>
                          <button className="admin-btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="admin-btn-sm" onClick={() => { setEditingId(user.id); setEditName(user.name); setEditRole(user.role); }}>Edit</button>
                          <button className="admin-btn-sm" onClick={() => { setResetPwdId(resetPwdId === user.id ? null : user.id); setResetPassword(''); }}>
                            {resetPwdId === user.id ? 'Cancel' : '🔑'}
                          </button>
                          <button className="admin-btn-sm admin-btn-danger" onClick={() => handleDelete(user.id, user.name)}>✕</button>
                        </>
                      )}
                    </div>
                    {/* Inline password reset */}
                    {resetPwdId === user.id && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                        <input type="password" className="admin-input-sm" placeholder="New password (min 8)" value={resetPassword} onChange={e => setResetPassword(e.target.value)} style={{ width: '160px' }} />
                        <button className="admin-btn-sm admin-btn-primary" onClick={() => handleResetPassword(user.id)}>Reset</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
