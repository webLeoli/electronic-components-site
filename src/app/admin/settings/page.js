'use client';
import { useState, useEffect } from 'react';

export default function AdminSettingsPage() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMessage, setPwdMessage] = useState(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Code integration state
  const [codeSettings, setCodeSettings] = useState({
    ga_measurement_id: '',
    gsc_verification: '',
    fb_pixel_id: '',
    custom_head_code: '',
  });
  const [codeLoading, setCodeLoading] = useState(true);
  const [codeSaving, setCodeSaving] = useState(false);
  const [codeMessage, setCodeMessage] = useState(null);

  // Load code settings
  useEffect(() => {
    fetch('/api/admin/settings/code')
      .then(r => r.json())
      .then(data => {
        setCodeSettings(prev => ({ ...prev, ...data }));
        setCodeLoading(false);
      })
      .catch(() => setCodeLoading(false));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPwd.length < 8) {
      setPwdMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMessage({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      } else {
        setPwdMessage({ type: 'error', text: data.error || 'Failed to update password.' });
      }
    } catch {
      setPwdMessage({ type: 'error', text: 'Connection error.' });
    }
    setPwdLoading(false);
  };

  const handleSaveCode = async () => {
    setCodeSaving(true);
    setCodeMessage(null);
    try {
      const res = await fetch('/api/admin/settings/code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(codeSettings),
      });
      if (res.ok) {
        setCodeMessage({ type: 'success', text: 'Code settings saved! Changes will take effect on next page load.' });
      } else {
        const data = await res.json();
        setCodeMessage({ type: 'error', text: data.error || 'Failed to save.' });
      }
    } catch {
      setCodeMessage({ type: 'error', text: 'Connection error.' });
    }
    setCodeSaving(false);
  };

  const updateCode = (key, value) => {
    setCodeSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Settings</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>系统设置和代码集成</p>
      </div>

      {/* Code Integration */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div className="admin-card-header">
          <h2>🔗 代码集成 / Code Integration</h2>
        </div>
        <div style={{ padding: '20px' }}>
          {codeMessage && (
            <div className={`admin-alert admin-alert-${codeMessage.type === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '16px' }}>
              {codeMessage.text}
            </div>
          )}

          {codeLoading ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Loading...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Google Analytics 4 */}
              <div style={{ background: 'var(--color-bg-secondary, #0f1729)', borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>📊</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Google Analytics 4</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>跟踪网站流量、用户行为和转化</p>
                  </div>
                </div>
                <div className="admin-field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Measurement ID <span style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>(G-XXXXXXXXXX)</span></label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="G-XXXXXXXXXX"
                    value={codeSettings.ga_measurement_id}
                    onChange={e => updateCode('ga_measurement_id', e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              {/* Google Search Console */}
              <div style={{ background: 'var(--color-bg-secondary, #0f1729)', borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🔍</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Google Search Console</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>验证网站所有权，监控搜索表现</p>
                  </div>
                </div>
                <div className="admin-field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Verification Code
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#64748b', display: 'block', fontSize: '11px', marginTop: '2px' }}>
                      在 GSC → 设置 → 所有权验证 → HTML 标记 → 复制 content=&quot;...&quot; 中的内容
                    </span>
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. abc123def456..."
                    value={codeSettings.gsc_verification}
                    onChange={e => updateCode('gsc_verification', e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              {/* Facebook Pixel */}
              <div style={{ background: 'var(--color-bg-secondary, #0f1729)', borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>📘</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Facebook Pixel</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Facebook/Meta 广告转化追踪</p>
                  </div>
                </div>
                <div className="admin-field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Pixel ID <span style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>(纯数字)</span></label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="123456789012345"
                    value={codeSettings.fb_pixel_id}
                    onChange={e => updateCode('fb_pixel_id', e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              {/* Custom Head Code */}
              <div style={{ background: 'var(--color-bg-secondary, #0f1729)', borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>💻</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>自定义代码 / Custom Code</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      注入到 &lt;head&gt; 的自定义 HTML/JS 代码 (Baidu统计、Microsoft Clarity、Hotjar 等)
                    </p>
                  </div>
                </div>
                <div className="admin-field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>HTML / Script Code</label>
                  <textarea
                    className="admin-input"
                    rows={6}
                    placeholder={'<!-- Example: Baidu Analytics -->\n<script>\nvar _hmt = _hmt || [];\n(function() {\n  var hm = document.createElement("script");\n  hm.src = "https://hm.baidu.com/hm.js?YOUR_ID";\n  var s = document.getElementsByTagName("script")[0];\n  s.parentNode.insertBefore(hm, s);\n})();\n</script>'}
                    value={codeSettings.custom_head_code}
                    onChange={e => updateCode('custom_head_code', e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6, resize: 'vertical' }}
                  />
                </div>
              </div>

              <div>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={handleSaveCode}
                  disabled={codeSaving}
                  style={{ minWidth: '160px' }}
                >
                  {codeSaving ? 'Saving...' : '💾 Save Code Settings'}
                </button>
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '12px' }}>
                  保存后刷新前台页面即可生效
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="admin-card" style={{ maxWidth: 500, marginBottom: '20px' }}>
        <div className="admin-card-header">
          <h2>🔐 Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="admin-settings-form">
          {pwdMessage && (
            <div className={`admin-alert admin-alert-${pwdMessage.type === 'success' ? 'success' : 'danger'}`}>
              {pwdMessage.text}
            </div>
          )}
          <div className="admin-field">
            <label>Current Password</label>
            <input type="password" className="admin-input" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required />
          </div>
          <div className="admin-field">
            <label>New Password</label>
            <input type="password" className="admin-input" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={8} />
          </div>
          <div className="admin-field">
            <label>Confirm New Password</label>
            <input type="password" className="admin-input" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={pwdLoading}>
            {pwdLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Email Config Info */}
      <div className="admin-card" style={{ maxWidth: 500 }}>
        <div className="admin-card-header">
          <h2>📧 Email Notifications</h2>
        </div>
        <div style={{ padding: '16px 20px', color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
          <p>Email notifications are configured via environment variables in <code>.env</code>:</p>
          <div className="admin-env-block">
            <code>SMTP_HOST=smtp.gmail.com</code><br/>
            <code>SMTP_PORT=587</code><br/>
            <code>SMTP_USER=your@gmail.com</code><br/>
            <code>SMTP_PASS=your-app-password</code><br/>
            <code>SMTP_FROM=noreply@fpgacenter.com</code><br/>
            <code>ADMIN_EMAIL=admin@fpgacenter.com</code>
          </div>
          <p style={{ marginTop: 12 }}>When configured, you&apos;ll receive an email for every new RFQ submission.</p>
        </div>
      </div>
    </div>
  );
}
