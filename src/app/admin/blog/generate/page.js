'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const EMPTY_CONFIG = {
  text: { provider: 'openai-compatible', baseUrl: '', apiKey: '', model: '', hasKey: false },
  image: { enabled: false, baseUrl: '', apiKey: '', model: '', size: '1536x1024', hasKey: false },
};

export default function AdminBlogGeneratePage() {
  const router = useRouter();
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [categories, setCategories] = useState([]);

  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [wantImage, setWantImage] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetch('/api/admin/blog/generate')
      .then((r) => r.json())
      .then((d) => {
        if (d.config) {
          setConfig(d.config);
          if (!d.config.text.hasKey) setShowConfig(true);
        }
      })
      .catch(() => {});
    fetch('/api/admin/blog/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!generating) return;
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [generating]);

  const saveConfig = async () => {
    setSavingConfig(true);
    setError('');
    try {
      const res = await fetch('/api/admin/blog/generate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      setConfig(data.config);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const generate = async () => {
    if (!topic.trim()) { setError('Enter a topic first'); return; }
    setGenerating(true);
    setElapsed(0);
    setResult(null);
    setError('');
    try {
      const res = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, keywords, categoryId, generateImage: wantImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const publishNow = async () => {
    if (!result?.post) return;
    setPublishing(true);
    setError('');
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: result.post.id, status: 'published' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      setResult({ ...result, post: data });
    } catch (e) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };

  const isCli = config.text.provider === 'codex-cli' || config.text.provider === 'claude-cli';
  const textReady = config.text.hasKey || isCli;

  const updateText = (field, value) =>
    setConfig((c) => ({ ...c, text: { ...c.text, [field]: value } }));
  const updateImage = (field, value) =>
    setConfig((c) => ({ ...c, image: { ...c.image, [field]: value } }));

  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 4 };
  const labelStyle = { fontSize: 12, color: '#94a3b8', fontWeight: 600 };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 };

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>AI Article Writer</h1>
          <p>Generate a draft with your own LLM API key, review it, then publish with one click</p>
        </div>
        <button className="admin-btn admin-btn-ghost" onClick={() => router.push('/admin/blog')}>
          ← All Articles
        </button>
      </div>

      {/* Provider settings */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowConfig(!showConfig)}
        >
          <h3 style={{ margin: 0 }}>
            ⚙️ Provider Settings{' '}
            <span style={{ fontSize: 12, color: textReady ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
              {isCli ? '· local CLI mode (no key)' : config.text.hasKey ? '· configured' : '· API key required'}
            </span>
          </h3>
          <span style={{ color: '#64748b' }}>{showConfig ? '▲' : '▼'}</span>
        </div>

        {showConfig && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#e2e8f0' }}>Text generation</h4>
              <div style={gridStyle}>
                <div style={fieldStyle}>
                  <span style={labelStyle}>Provider</span>
                  <select
                    className="admin-input admin-select"
                    value={config.text.provider}
                    onChange={(e) => updateText('provider', e.target.value)}
                  >
                    <option value="openai-compatible">OpenAI-compatible API (OpenAI / DeepSeek / Qwen / Moonshot / GLM ...)</option>
                    <option value="anthropic">Anthropic Claude API</option>
                    <option value="codex-cli">Codex CLI - ChatGPT subscription, no key</option>
                    <option value="claude-cli">Claude Code CLI - Claude subscription, no key</option>
                  </select>
                </div>
                {!isCli && (
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Base URL</span>
                    <input
                      className="admin-input"
                      placeholder={config.text.provider === 'anthropic' ? 'https://api.anthropic.com (default)' : 'https://api.openai.com/v1'}
                      value={config.text.baseUrl}
                      onChange={(e) => updateText('baseUrl', e.target.value)}
                    />
                  </div>
                )}
                <div style={fieldStyle}>
                  <span style={labelStyle}>Model {isCli && '(optional - CLI default if blank)'}</span>
                  <input
                    className="admin-input"
                    placeholder={
                      config.text.provider === 'anthropic' ? 'claude-opus-5'
                        : config.text.provider === 'codex-cli' ? 'e.g. gpt-5.2-codex (optional)'
                          : config.text.provider === 'claude-cli' ? 'e.g. claude-opus-5 (optional)'
                            : 'e.g. gpt-5.2 / deepseek-chat'
                    }
                    value={config.text.model}
                    onChange={(e) => updateText('model', e.target.value)}
                  />
                </div>
                {!isCli && (
                  <div style={fieldStyle}>
                    <span style={labelStyle}>API Key {config.text.hasKey && '(saved - leave blank to keep)'}</span>
                    <input
                      className="admin-input"
                      type="password"
                      placeholder={config.text.hasKey ? '••••••••' : 'sk-...'}
                      value={config.text.apiKey}
                      onChange={(e) => updateText('apiKey', e.target.value)}
                    />
                  </div>
                )}
              </div>
              {isCli && (
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 0' }}>
                  Uses the {config.text.provider === 'codex-cli' ? 'codex' : 'claude'} CLI installed on
                  the server machine and its existing login - run{' '}
                  <code>{config.text.provider === 'codex-cli' ? 'codex login' : 'claude'}</code> once in a
                  terminal on that machine to authorize. Generation consumes your subscription quota
                  instead of per-token API billing.
                </p>
              )}
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#e2e8f0' }}>
                Cover image generation{' '}
                <label style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>
                  <input
                    type="checkbox"
                    checked={config.image.enabled}
                    onChange={(e) => updateImage('enabled', e.target.checked)}
                  />{' '}
                  enabled (falls back to themed cover on failure)
                </label>
              </h4>
              {config.image.enabled && (
                <div style={gridStyle}>
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Image API Base URL (OpenAI-compatible)</span>
                    <input
                      className="admin-input"
                      placeholder="https://api.openai.com/v1"
                      value={config.image.baseUrl}
                      onChange={(e) => updateImage('baseUrl', e.target.value)}
                    />
                  </div>
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Image model</span>
                    <input
                      className="admin-input"
                      placeholder="gpt-image-1"
                      value={config.image.model}
                      onChange={(e) => updateImage('model', e.target.value)}
                    />
                  </div>
                  <div style={fieldStyle}>
                    <span style={labelStyle}>API Key {config.image.hasKey && '(saved - leave blank to keep)'}</span>
                    <input
                      className="admin-input"
                      type="password"
                      placeholder={config.image.hasKey ? '••••••••' : 'sk-...'}
                      value={config.image.apiKey}
                      onChange={(e) => updateImage('apiKey', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <button className="admin-btn admin-btn-primary" onClick={saveConfig} disabled={savingConfig}>
                {savingConfig ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generation form */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>✍️ New Article</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Topic (required)</span>
            <input
              className="admin-input"
              placeholder='e.g. "How to source obsolete Spartan-6 FPGAs in 2026" or "GD32 vs STM32 for motor control"'
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={generating}
            />
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <span style={labelStyle}>Target keywords (optional, comma-separated)</span>
              <input
                className="admin-input"
                placeholder="XC6SLX9, Spartan-6 alternative, EOL FPGA"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                disabled={generating}
              />
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Category</span>
              <select
                className="admin-input admin-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={generating}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <label style={{ fontSize: 13, color: '#94a3b8' }}>
            <input
              type="checkbox"
              checked={wantImage}
              onChange={(e) => setWantImage(e.target.checked)}
              disabled={generating || !config.image.enabled}
            />{' '}
            Generate AI cover image {!config.image.enabled && '(enable in Provider Settings first)'}
          </label>
          <div>
            <button
              className="admin-btn admin-btn-primary"
              onClick={generate}
              disabled={generating || !textReady}
            >
              {generating ? `Generating... ${elapsed}s (can take 1-3 min)` : '🤖 Generate Draft'}
            </button>
            {!textReady && (
              <span style={{ marginLeft: 12, fontSize: 12, color: '#f59e0b' }}>
                Configure an API key above first (or switch to a CLI provider)
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ marginBottom: 16, borderLeft: '3px solid #ef4444' }}>
          <span style={{ color: '#fca5a5', fontSize: 13 }}>⚠ {error}</span>
        </div>
      )}

      {/* Result */}
      {result?.post && (
        <div className="admin-card" style={{ borderLeft: '3px solid #10b981' }}>
          <h3 style={{ marginTop: 0 }}>
            {result.post.status === 'published' ? '✅ Published' : '📝 Draft ready for review'}
          </h3>
          <div style={{ marginBottom: 8 }}>
            <strong style={{ color: '#f8fafc' }}>{result.post.title}</strong>
          </div>
          {result.post.excerpt && (
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 8px' }}>{result.post.excerpt}</p>
          )}
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
            slug: /blog/{result.post.slug} · {result.post.readingTime} min read ·{' '}
            {result.imageGenerated ? 'AI cover generated' : 'themed cover (no AI image)'} ·{' '}
            {result.partsUsed} catalog parts fed to the model
          </div>
          <div className="admin-actions" style={{ display: 'flex', gap: 8 }}>
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => router.push(`/admin/blog/editor?id=${result.post.id}`)}
            >
              Review &amp; Edit
            </button>
            {result.post.status !== 'published' && (
              <button className="admin-btn admin-btn-success" onClick={publishNow} disabled={publishing}>
                {publishing ? 'Publishing...' : '🚀 Publish Now'}
              </button>
            )}
            {result.post.status === 'published' && (
              <a
                className="admin-btn admin-btn-ghost"
                href={`/blog/${result.post.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                View Live
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
