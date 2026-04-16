'use client';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ========== Markdown → HTML converter (for migrating old content) ==========
function markdownToHtml(md) {
  if (!md) return '';
  let html = md;
  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code>${code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').trim()}</code></pre>`);
  // Tables
  html = html.replace(/^\|(.+)\|\s*\n\|[\s\-:|]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_, h, r) => {
    const ths = h.split('|').map(c=>c.trim()).filter(Boolean).map(c=>`<th>${c}</th>`).join('');
    const trs = r.trim().split('\n').map(row => {
      const tds = row.split('|').map(c=>c.trim()).filter(Boolean).map(c=>`<td>${c}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  });
  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^---$/gm, '<hr/>');
  // Inline
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, '<ul>$&</ul>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p>\s*<(h[2-4]|pre|table|ul|ol|blockquote|figure|hr|img)/g, '<$1');
  html = html.replace(/<\/(h[2-4]|pre|table|ul|ol|blockquote|figure|hr)>\s*<\/p>/g, '</$1>');
  html = html.replace(/<p>\s*<\/p>/g, '');
  return html;
}

// Detect if content is markdown (has ## or ** patterns) vs HTML
function isMarkdown(content) {
  if (!content) return false;
  return /^#{2,4} /m.test(content) || /\*\*.+\*\*/.test(content) || /^- /m.test(content);
}

function BlogEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [post, setPost] = useState({
    title: '', slug: '', excerpt: '', content: '', coverImage: '', status: 'draft',
    author: 'FPGACenter Team', categoryId: null, tags: '',
    seoTitle: '', seoDesc: '', seoKeywords: '', relatedProducts: '',
  });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // idle | saving | saved
  const [slugManual, setSlugManual] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [htmlSource, setHtmlSource] = useState('');
  const [linkModal, setLinkModal] = useState(null);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkResults, setLinkResults] = useState([]);
  const [linkSearching, setLinkSearching] = useState(false);
  const [imageModal, setImageModal] = useState(null);
  const [videoModal, setVideoModal] = useState(null);
  const [tableModal, setTableModal] = useState(null);
  const editorRef = useRef(null);
  const coverInputRef = useRef(null);
  const modalFileRef = useRef(null);
  const autoSaveRef = useRef(null);
  const localSaveRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const contentRef = useRef(''); // Track content independently of React re-renders

  // Load categories
  useEffect(() => {
    fetch('/api/admin/blog/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  // Load existing post (try localStorage draft first, then server)
  useEffect(() => {
    if (editId) {
      fetch(`/api/admin/blog?limit=100`).then(r => r.json()).then(data => {
        const found = data.posts?.find(p => p.id === parseInt(editId));
        if (found) {
          let content = found.content || '';
          // Convert markdown to HTML if needed
          if (isMarkdown(content)) {
            content = markdownToHtml(content);
          }
          // Check for a more recent localStorage draft
          try {
            const draft = localStorage.getItem(`blog_draft_${editId}`);
            if (draft) {
              const parsed = JSON.parse(draft);
              // Only use draft if it's newer than the server version (within 24h)
              if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                if (parsed.content && parsed.content !== content) {
                  content = parsed.content;
                  setAutoSaveStatus('saved');
                  flashMsg('info', '📋 Restored from local draft');
                }
              } else {
                localStorage.removeItem(`blog_draft_${editId}`);
              }
            }
          } catch {}
          contentRef.current = content;
          setPost(prev => ({ ...prev, ...found, content, categoryId: found.categoryId || null }));
          setSlugManual(true);
          // Set editor content after mount — use setTimeout for reliability
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.innerHTML = content;
            }
          }, 50);
        }
      });
    } else {
      // New post — try to restore draft
      try {
        const draft = localStorage.getItem('blog_draft_new');
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            if (parsed.title || parsed.content) {
              setPost(prev => ({
                ...prev,
                title: parsed.title || prev.title,
                content: parsed.content || prev.content,
                excerpt: parsed.excerpt || prev.excerpt,
              }));
              contentRef.current = parsed.content || '';
              setTimeout(() => {
                if (editorRef.current && parsed.content) {
                  editorRef.current.innerHTML = parsed.content;
                }
              }, 50);
              setAutoSaveStatus('saved');
              flashMsg('info', '📋 Restored from local draft');
            }
          } else {
            localStorage.removeItem('blog_draft_new');
          }
        }
      } catch {}
    }
  }, [editId]);

  // Auto-save to localStorage every 15s — protects against browser crashes, network loss
  useEffect(() => {
    if (localSaveRef.current) clearInterval(localSaveRef.current);
    localSaveRef.current = setInterval(() => {
      const currentContent = editorRef.current ? editorRef.current.innerHTML : contentRef.current;
      if (!currentContent && !post.title) return;
      try {
        const key = editId ? `blog_draft_${editId}` : 'blog_draft_new';
        localStorage.setItem(key, JSON.stringify({
          title: post.title,
          content: currentContent,
          excerpt: post.excerpt,
          timestamp: Date.now(),
        }));
        setAutoSaveStatus('saved');
      } catch {}
    }, 15000);
    return () => { if (localSaveRef.current) clearInterval(localSaveRef.current); };
  }, [post.title, post.excerpt, editId]);

  // Auto-save to server every 60s for existing posts
  useEffect(() => {
    if (editId && post.title) {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(async () => {
        const currentContent = editorRef.current ? editorRef.current.innerHTML : contentRef.current;
        if (!currentContent) return;
        setAutoSaveStatus('saving');
        try {
          await fetch('/api/admin/blog', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: parseInt(editId), content: currentContent, title: post.title }),
          });
          setAutoSaveStatus('saved');
          flashMsg('info', '✓ Auto-saved to server');
        } catch {
          setAutoSaveStatus('saved'); // still saved locally
        }
      }, 60000);
    }
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [post.title, editId]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (contentRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const flashMsg = (type, text) => {
    setSaveMsg({ type, text });
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const updateTitle = (title) => {
    const updates = { ...post, title };
    if (!slugManual) {
      updates.slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 120);
    }
    setPost(updates);
  };

  // ========== SELECTION MANAGEMENT ==========
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      // Only save if selection is inside our editor
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    if (savedSelectionRef.current && editorRef.current) {
      try {
        // Verify the saved range is still in the DOM
        if (editorRef.current.contains(savedSelectionRef.current.commonAncestorContainer)) {
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(savedSelectionRef.current);
        }
      } catch (e) {
        // Range may be invalid if DOM changed
        savedSelectionRef.current = null;
      }
    }
  };

  // ========== RICH TEXT COMMANDS ==========
  const exec = (cmd, val = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand(cmd, false, val);
    syncContent();
  };

  const syncContent = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      contentRef.current = html;
      setPost(prev => ({ ...prev, content: html }));
    }
  };

  // Format block (heading, paragraph)
  const formatBlock = (tag) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand('formatBlock', false, `<${tag}>`);
    syncContent();
  };

  // Insert HTML at cursor
  const insertHtmlAtCursor = (html) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    syncContent();
  };

  // Insert link function — MUST be defined BEFORE return
  const insertLink = () => {
    if (!linkModal?.url) return;
    const text = linkModal.text || linkModal.url;
    const url = linkModal.url;
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    const sel = window.getSelection();
    if (sel.toString()) {
      document.execCommand('createLink', false, url);
    } else {
      document.execCommand('insertHTML', false, `<a href="${url}">${text}</a>`);
    }
    syncContent();
    setLinkModal(null);
    setLinkSearch('');
    setLinkResults([]);
  };

  // Video embed helper
  const createVideoEmbed = (url) => {
    const trimmed = url.trim();
    const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
    if (ytMatch) return `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe>`;
    if (vimeoMatch) return `<iframe width="100%" height="400" src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allowfullscreen></iframe>`;
    return `<video src="${trimmed}" controls width="100%"></video>`;
  };

  // ========== INTERNAL LINK SEARCH ==========
  const searchInternalLinks = useCallback(async (query) => {
    if (!query || query.length < 2) { setLinkResults([]); return; }
    setLinkSearching(true);
    try {
      // Search products and blog posts
      const [productsRes, postsRes] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`).then(r => r.json()).catch(() => ({ products: [] })),
        fetch(`/api/admin/blog?limit=100`).then(r => r.json()).catch(() => ({ posts: [] })),
      ]);
      const products = (productsRes.products || []).map(p => ({
        type: 'product', label: p.partNumber, desc: p.description?.substring(0, 60) || p.manufacturer || '',
        url: `/product/${p.partNumber}`,
      }));
      const posts = (postsRes.posts || []).filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase()) || p.slug?.includes(query.toLowerCase())
      ).slice(0, 5).map(p => ({
        type: 'blog', label: p.title, desc: `Blog · ${p.status}`,
        url: `/blog/${p.slug}`,
      }));
      // Add category links
      const categoryLinks = categories.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3).map(c => ({
        type: 'category', label: c.name, desc: 'Category page',
        url: `/category/${c.slug}`,
      }));
      setLinkResults([...products, ...posts, ...categoryLinks]);
    } catch {
      setLinkResults([]);
    }
    setLinkSearching(false);
  }, [categories]);

  // Debounced search
  const searchTimeoutRef = useRef(null);
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchInternalLinks(linkSearch), 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [linkSearch, searchInternalLinks]);

  // ========== FILE UPLOAD ==========
  const uploadFile = async (file) => {
    if (!file) return null;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/blog/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    } catch (e) {
      flashMsg('error', `Upload failed: ${e.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (file) => {
    setCoverUploading(true);
    const result = await uploadFile(file);
    if (result) setPost(prev => ({ ...prev, coverImage: result.url }));
    setCoverUploading(false);
  };

  const handleEditorPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        (async () => {
          const result = await uploadFile(item.getAsFile());
          if (result) {
            document.execCommand('insertHTML', false, `<img src="${result.url}" alt="uploaded image" style="max-width:100%;border-radius:8px;margin:8px 0" />`);
            syncContent();
          }
        })();
        return;
      }
    }
  };

  const handleEditorDrop = (e) => {
    if (e.dataTransfer?.files?.length) {
      e.preventDefault();
      (async () => {
        const result = await uploadFile(e.dataTransfer.files[0]);
        if (result) {
          document.execCommand('insertHTML', false, `<img src="${result.url}" alt="uploaded image" style="max-width:100%;border-radius:8px;margin:8px 0" />`);
          syncContent();
        }
      })();
    }
  };

  // Image modal upload
  const handleModalImageUpload = async (file) => {
    if (!file) return;
    const result = await uploadFile(file);
    if (result) {
      setImageModal(m => ({ ...m, url: result.url, alt: file.name.replace(/\.[^.]+$/, '') }));
    }
  };

  // ========== KEYBOARD SHORTCUTS ==========
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b': e.preventDefault(); exec('bold'); break;
        case 'i': e.preventDefault(); exec('italic'); break;
        case 'u': e.preventDefault(); exec('underline'); break;
        case 'k': e.preventDefault(); saveSelection(); setLinkModal({ url: '', text: '', tab: 'internal' }); break;
        case 's': e.preventDefault(); savePost(); break;
      }
    }
  };

  // ========== SOURCE VIEW TOGGLE ==========
  // BUG FIX: When toggling back from HTML source, the contentEditable div is re-created by React
  // (conditional rendering). We must wait for React to mount the new div before setting innerHTML.
  const toggleSource = () => {
    if (showSource) {
      // Switching FROM source TO visual — save the edited HTML, let React mount the div
      const newHtml = htmlSource;
      contentRef.current = newHtml;
      setPost(prev => ({ ...prev, content: newHtml }));
      setShowSource(false);
      // React will now re-render and create the contentEditable div
      // We need to wait for it to mount, then set innerHTML
    } else {
      // Switching FROM visual TO source — grab latest content from DOM
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : contentRef.current;
      setHtmlSource(currentHtml);
      setShowSource(true);
    }
  };

  // When showSource changes from true to false, restore content to the newly mounted editor div
  useEffect(() => {
    if (!showSource && contentRef.current && editorRef.current) {
      // Small delay to ensure React has mounted the div
      const timer = setTimeout(() => {
        if (editorRef.current && editorRef.current.innerHTML !== contentRef.current) {
          editorRef.current.innerHTML = contentRef.current;
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [showSource]);

  // ========== SAVE ==========
  const savePost = async (statusOverride) => {
    if (!post.title?.trim()) { flashMsg('error', 'Title is required'); return; }
    // Grab latest content directly from DOM before saving
    let currentContent;
    if (showSource) {
      // If in source mode, use the textarea content
      currentContent = htmlSource;
    } else {
      currentContent = editorRef.current ? editorRef.current.innerHTML : contentRef.current;
    }
    contentRef.current = currentContent;
    setSaving(true);
    const body = { ...post, content: currentContent, status: statusOverride || post.status };
    body.categoryId = body.categoryId ? parseInt(body.categoryId) : null;
    delete body.category; delete body.createdAt; delete body.updatedAt;
    delete body.viewCount; delete body.readingTime; delete body.publishedAt;
    const method = editId ? 'PUT' : 'POST';
    if (editId) body.id = parseInt(editId);
    try {
      const res = await fetch('/api/admin/blog', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        const verb = statusOverride === 'published' ? 'Published!' : (editId ? 'Saved!' : 'Created!');
        flashMsg('success', `✓ ${verb}`);
        // Clear localStorage draft after successful server save
        try {
          localStorage.removeItem(editId ? `blog_draft_${editId}` : 'blog_draft_new');
          setAutoSaveStatus('idle');
        } catch {}
        // Restore editor content after save to prevent React re-render clearing it
        setTimeout(() => {
          if (editorRef.current && !showSource) {
            if (editorRef.current.innerHTML !== currentContent) {
              editorRef.current.innerHTML = currentContent;
            }
          }
        }, 50);
        if (!editId && data.id) router.replace(`/admin/blog/editor?id=${data.id}`);
      } else {
        flashMsg('error', data.error || 'Failed to save');
      }
    } catch (e) {
      flashMsg('error', 'Network error');
    }
    setSaving(false);
  };

  // ========== COMPUTED ==========
  const getWordCount = () => {
    try {
      return (editorRef.current?.innerText || '').split(/\s+/).filter(Boolean).length;
    } catch { return 0; }
  };
  const wordCount = getWordCount();
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const seoTitle = post.seoTitle || post.title || '';
  const seoDesc = post.seoDesc || post.excerpt || '';

  // ========== RENDER ==========
  return (
    <div className="wysi-wrap">
      {/* TOP BAR */}
      <div className="wysi-topbar">
        <div className="wysi-topbar-l">
          <button className="wysi-btn-ghost" onClick={() => router.push('/admin/blog')}>← Back</button>
          <span className="wysi-topbar-title">{editId ? 'Edit Article' : 'New Article'}</span>
          {saveMsg && <span className={`wysi-msg wysi-msg-${saveMsg.type}`}>{saveMsg.text}</span>}
        </div>
        <div className="wysi-topbar-r">
          {autoSaveStatus !== 'idle' && (
            <span className={`wysi-autosave-badge ${autoSaveStatus}`}>
              <span className="wysi-autosave-dot" />
              {autoSaveStatus === 'saving' ? 'Saving...' : autoSaveStatus === 'saved' ? 'Draft saved locally' : ''}
            </span>
          )}
          <button className="wysi-btn-ghost" onClick={() => savePost('draft')} disabled={saving}>Save Draft</button>
          {post.slug && editId && <a href={`/blog/${post.slug}`} target="_blank" className="wysi-btn-ghost">🌐 View</a>}
          <button className="wysi-btn-primary" onClick={() => savePost('published')} disabled={saving}>
            {saving ? 'Saving...' : '🚀 Publish'}
          </button>
        </div>
      </div>

      <div className="wysi-body">
        {/* ========== LEFT: MAIN CONTENT ========== */}
        <main className="wysi-main">
          {/* Title */}
          <input className="wysi-title"
            placeholder="Article title..."
            value={post.title}
            onChange={e => updateTitle(e.target.value)}
          />
          <div className="wysi-slug-row">
            <span>/blog/</span>
            <input value={post.slug}
              onChange={e => { setSlugManual(true); setPost(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })); }}
              placeholder="url-slug" />
            <button onClick={() => { setSlugManual(false); updateTitle(post.title); }} title="Regenerate">🔄</button>
          </div>

          {/* WYSIWYG Toolbar */}
          <div className="wysi-toolbar">
            {/* Block format — save selection on mousedown to preserve it */}
            <select
              onMouseDown={() => saveSelection()}
              onChange={e => {
                if (e.target.value) { formatBlock(e.target.value); }
                e.target.selectedIndex = 0;
              }}
              className="wysi-format-select" title="Text format" defaultValue="">
              <option value="" disabled>Format</option>
              <option value="p">Paragraph</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="blockquote">Quote</option>
              <option value="pre">Code Block</option>
            </select>
            <span className="wysi-sep" />
            <button onMouseDown={e => e.preventDefault()} onClick={() => exec('bold')} title="Bold (Ctrl+B)" className="wysi-tb-btn"><b>B</b></button>
            <button onMouseDown={e => e.preventDefault()} onClick={() => exec('italic')} title="Italic (Ctrl+I)" className="wysi-tb-btn"><em>I</em></button>
            <button onMouseDown={e => e.preventDefault()} onClick={() => exec('underline')} title="Underline (Ctrl+U)" className="wysi-tb-btn"><u>U</u></button>
            <button onMouseDown={e => e.preventDefault()} onClick={() => exec('strikeThrough')} title="Strikethrough" className="wysi-tb-btn"><s>S</s></button>
            <span className="wysi-sep" />
            <button onMouseDown={e => e.preventDefault()} onClick={() => exec('insertUnorderedList')} title="Bullet list" className="wysi-tb-btn">• List</button>
            <button onMouseDown={e => e.preventDefault()} onClick={() => exec('insertOrderedList')} title="Numbered list" className="wysi-tb-btn">1. List</button>
            <span className="wysi-sep" />
            <button onClick={() => { saveSelection(); setLinkModal({ url: '', text: '', tab: 'internal' }); }}
              title="Insert Link (Ctrl+K)" className="wysi-tb-btn">🔗 Link</button>
            <button onClick={() => { saveSelection(); setImageModal({ url: '', alt: '', tab: 'upload' }); }}
              title="Insert image" className="wysi-tb-btn">🖼 Image</button>
            <button onClick={() => { saveSelection(); setVideoModal({ url: '' }); }}
              title="Embed video" className="wysi-tb-btn">🎬 Video</button>
            <button onClick={() => { saveSelection(); setTableModal({ cols: '3', rows: '3' }); }}
              title="Insert table" className="wysi-tb-btn">📊 Table</button>
            <span className="wysi-sep" />
            <button onMouseDown={e => e.preventDefault()} onClick={() => exec('removeFormat')} title="Clear formatting" className="wysi-tb-btn">✕ Clear</button>
            <button onClick={toggleSource} title="Toggle HTML source" className={`wysi-tb-btn ${showSource ? 'active' : ''}`}>
              &lt;/&gt; {showSource ? 'Visual' : 'HTML'}
            </button>
          </div>

          {/* Content Editor */}
          {showSource ? (
            <textarea className="wysi-source-editor"
              value={htmlSource}
              onChange={e => setHtmlSource(e.target.value)}
              placeholder="HTML source code..."
            />
          ) : (
            <div ref={editorRef} className="wysi-editor"
              contentEditable
              suppressContentEditableWarning
              onInput={syncContent}
              onKeyDown={handleKeyDown}
              onPaste={handleEditorPaste}
              onDrop={handleEditorDrop}
              onDragOver={e => e.preventDefault()}
              onBlur={saveSelection}
              data-placeholder={"Start writing your article...\n\nUse the toolbar above to format text, add links, images, and more."}
            />
          )}
        </main>

        {/* ========== RIGHT: SIDEBAR ========== */}
        <aside className="wysi-sidebar">
          {/* Status & Publish */}
          <div className="wysi-panel">
            <div className="wysi-panel-title">Visibility</div>
            <div className="wysi-field-row">
              <div className="wysi-field">
                <label>STATUS</label>
                <select value={post.status} onChange={e => setPost(p => ({ ...p, status: e.target.value }))}>
                  <option value="draft">📝 Draft</option>
                  <option value="published">✅ Published</option>
                  <option value="archived">📦 Archived</option>
                </select>
              </div>
              <div className="wysi-field">
                <label>CATEGORY</label>
                <select value={post.categoryId || ''} onChange={e => setPost(p => ({ ...p, categoryId: e.target.value || null }))}>
                  <option value="">— None —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="wysi-panel">
            <div className="wysi-panel-title">Featured Image</div>
            {post.coverImage ? (
              <div className="wysi-cover-show">
                <img src={post.coverImage} alt="Cover" />
                <button onClick={() => setPost(p => ({ ...p, coverImage: '' }))} title="Remove">✕</button>
              </div>
            ) : (
              <div className="wysi-cover-drop" onClick={() => coverInputRef.current?.click()}>
                {coverUploading ? '⏳ Uploading...' : '📷 Click to upload'}
              </div>
            )}
            <input value={post.coverImage || ''} onChange={e => setPost(p => ({ ...p, coverImage: e.target.value }))}
              placeholder="or paste image URL..." className="wysi-small-input" />
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleCoverUpload(e.target.files[0]); e.target.value = ''; }} />
          </div>

          {/* Excerpt */}
          <div className="wysi-panel">
            <div className="wysi-panel-title">Excerpt</div>
            <textarea rows={3} value={post.excerpt || ''} onChange={e => setPost(p => ({ ...p, excerpt: e.target.value }))}
              placeholder="Brief summary shown in listings..." className="wysi-small-textarea" />
          </div>

          {/* Author & Tags */}
          <div className="wysi-panel">
            <div className="wysi-panel-title">Organization</div>
            <div className="wysi-field">
              <label>AUTHOR</label>
              <input value={post.author || ''} onChange={e => setPost(p => ({ ...p, author: e.target.value }))} />
            </div>
            <div className="wysi-field">
              <label>TAGS</label>
              <input value={post.tags || ''} onChange={e => setPost(p => ({ ...p, tags: e.target.value }))} placeholder="FPGA, STM32, tutorial" />
            </div>
            <div className="wysi-field">
              <label>RELATED PRODUCTS</label>
              <input value={post.relatedProducts || ''} onChange={e => setPost(p => ({ ...p, relatedProducts: e.target.value }))}
                placeholder="STM32F103C8T6, EP4CE6E22C8N" />
              <small>Comma-separated part numbers</small>
            </div>
          </div>

          {/* SEO */}
          <div className="wysi-panel wysi-panel-seo">
            <div className="wysi-panel-title">🔍 Search Engine Listing</div>
            <div className="wysi-serp-label">Google Preview</div>
            <div className="wysi-serp-card">
              <div className="wysi-serp-t">{seoTitle || 'Page Title'} | FPGACenter</div>
              <div className="wysi-serp-u">fpgacenter.com › blog › {post.slug || 'slug'}</div>
              <div className="wysi-serp-d">{seoDesc || 'Meta description preview...'}</div>
            </div>
            <div className="wysi-field">
              <label>SEO TITLE <span className="wysi-counter">{seoTitle.length}/60</span></label>
              <input value={post.seoTitle || ''} onChange={e => setPost(p => ({ ...p, seoTitle: e.target.value }))}
                placeholder={post.title || 'Custom search title'} />
            </div>
            <div className="wysi-field">
              <label>META DESCRIPTION <span className="wysi-counter">{seoDesc.length}/160</span></label>
              <textarea rows={3} value={post.seoDesc || ''} onChange={e => setPost(p => ({ ...p, seoDesc: e.target.value }))}
                placeholder="Compelling description for search engines" />
            </div>
            <div className="wysi-field">
              <label>KEYWORDS</label>
              <input value={post.seoKeywords || ''} onChange={e => setPost(p => ({ ...p, seoKeywords: e.target.value }))}
                placeholder="FPGA, microcontroller, guide" />
            </div>
          </div>
        </aside>
      </div>

      {/* ========== LINK MODAL ========== */}
      {linkModal && (
        <div className="wysi-modal-bg" onClick={() => setLinkModal(null)}>
          <div className="wysi-modal" onClick={e => e.stopPropagation()}>
            <div className="wysi-modal-header">
              <span>🔗 Insert Link</span>
              <button onClick={() => setLinkModal(null)}>✕</button>
            </div>
            <div className="wysi-modal-body">
              {/* Tab switcher */}
              <div className="wysi-link-tabs">
                <button className={linkModal.tab === 'internal' ? 'active' : ''} onClick={() => setLinkModal(m => ({ ...m, tab: 'internal' }))}>
                  🏠 Internal Link
                </button>
                <button className={linkModal.tab === 'external' ? 'active' : ''} onClick={() => setLinkModal(m => ({ ...m, tab: 'external' }))}>
                  🌐 External URL
                </button>
              </div>

              {linkModal.tab === 'internal' ? (
                <>
                  <label>Search products, blog posts, categories</label>
                  <input autoFocus value={linkSearch} onChange={e => setLinkSearch(e.target.value)}
                    placeholder="Type to search... e.g. STM32, FPGA guide" />
                  <div className="wysi-link-results">
                    {linkSearching && <div className="wysi-link-searching">Searching...</div>}
                    {!linkSearching && linkResults.length === 0 && linkSearch.length >= 2 && (
                      <div className="wysi-link-empty">No results found</div>
                    )}
                    {linkResults.map((r, i) => (
                      <div key={i} className="wysi-link-result" onClick={() => {
                        setLinkModal(m => ({ ...m, url: r.url, text: m.text || r.label }));
                      }}>
                        <span className={`wysi-link-type wysi-lt-${r.type}`}>
                          {r.type === 'product' ? '📦' : r.type === 'blog' ? '📝' : '📂'}
                        </span>
                        <div>
                          <div className="wysi-link-label">{r.label}</div>
                          <div className="wysi-link-desc">{r.desc}</div>
                        </div>
                        <span className="wysi-link-url">{r.url}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <label>URL</label>
                  <input autoFocus value={linkModal.url} onChange={e => setLinkModal(m => ({ ...m, url: e.target.value }))}
                    placeholder="https://..." onKeyDown={e => e.key === 'Enter' && linkModal.url && insertLink()} />
                </>
              )}
              <label>Link Text</label>
              <input value={linkModal.text} onChange={e => setLinkModal(m => ({ ...m, text: e.target.value }))}
                placeholder="Display text" onKeyDown={e => e.key === 'Enter' && linkModal.url && insertLink()} />
            </div>
            <div className="wysi-modal-footer">
              <button className="wysi-btn-ghost" onClick={() => setLinkModal(null)}>Cancel</button>
              <button className="wysi-btn-primary" disabled={!linkModal.url} onClick={insertLink}>Insert Link</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== IMAGE MODAL ========== */}
      {imageModal && (
        <div className="wysi-modal-bg" onClick={() => setImageModal(null)}>
          <div className="wysi-modal" onClick={e => e.stopPropagation()}>
            <div className="wysi-modal-header">
              <span>🖼 Insert Image</span>
              <button onClick={() => setImageModal(null)}>✕</button>
            </div>
            <div className="wysi-modal-body">
              <div className="wysi-link-tabs">
                <button className={imageModal.tab === 'upload' ? 'active' : ''} onClick={() => setImageModal(m => ({ ...m, tab: 'upload' }))}>📤 Upload</button>
                <button className={imageModal.tab === 'url' ? 'active' : ''} onClick={() => setImageModal(m => ({ ...m, tab: 'url' }))}>🔗 URL</button>
              </div>
              {imageModal.tab === 'upload' ? (
                <div className="wysi-upload-zone" onClick={() => modalFileRef.current?.click()}
                  onDrop={e => { e.preventDefault(); if (e.dataTransfer?.files?.[0]) handleModalImageUpload(e.dataTransfer.files[0]); }}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                  onDragLeave={e => e.currentTarget.classList.remove('dragover')}>
                  {uploading ? (
                    <div className="wysi-upload-status">⏳ Uploading...</div>
                  ) : imageModal.url ? (
                    <div className="wysi-upload-preview">
                      <img src={imageModal.url} alt="Preview" />
                      <div>✓ Uploaded</div>
                    </div>
                  ) : (
                    <div className="wysi-upload-prompt">
                      <div style={{fontSize:32,marginBottom:8}}>📁</div>
                      <div>Click or drag & drop image</div>
                      <div style={{fontSize:12,color:'#64748b',marginTop:4}}>PNG, JPG, WebP · Max 10MB</div>
                    </div>
                  )}
                  <input ref={modalFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) handleModalImageUpload(e.target.files[0]); e.target.value = ''; }} />
                </div>
              ) : (
                <>
                  <label>Image URL</label>
                  <input autoFocus value={imageModal.url} onChange={e => setImageModal(m => ({ ...m, url: e.target.value }))}
                    placeholder="https://example.com/image.jpg" />
                </>
              )}
              <label>Alt Text (SEO)</label>
              <input value={imageModal.alt || ''} onChange={e => setImageModal(m => ({ ...m, alt: e.target.value }))}
                placeholder="Describe the image" />
            </div>
            <div className="wysi-modal-footer">
              <button className="wysi-btn-ghost" onClick={() => setImageModal(null)}>Cancel</button>
              <button className="wysi-btn-primary" disabled={!imageModal.url} onClick={() => {
                insertHtmlAtCursor(`<img src="${imageModal.url}" alt="${imageModal.alt || 'image'}" style="max-width:100%;border-radius:8px;margin:12px 0" />`);
                setImageModal(null);
              }}>Insert Image</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== VIDEO MODAL ========== */}
      {videoModal && (
        <div className="wysi-modal-bg" onClick={() => setVideoModal(null)}>
          <div className="wysi-modal" onClick={e => e.stopPropagation()}>
            <div className="wysi-modal-header">
              <span>🎬 Embed Video</span>
              <button onClick={() => setVideoModal(null)}>✕</button>
            </div>
            <div className="wysi-modal-body">
              <label>Video URL</label>
              <input autoFocus value={videoModal.url} onChange={e => setVideoModal(m => ({ ...m, url: e.target.value }))}
                placeholder="YouTube, Vimeo, or MP4 URL"
                onKeyDown={e => {
                  if (e.key === 'Enter' && videoModal.url) {
                    insertHtmlAtCursor(createVideoEmbed(videoModal.url));
                    setVideoModal(null);
                  }
                }} />
              <small style={{color:'#64748b',fontSize:12}}>Supports YouTube, Vimeo, and direct MP4/WebM</small>
            </div>
            <div className="wysi-modal-footer">
              <button className="wysi-btn-ghost" onClick={() => setVideoModal(null)}>Cancel</button>
              <button className="wysi-btn-primary" disabled={!videoModal.url} onClick={() => {
                insertHtmlAtCursor(createVideoEmbed(videoModal.url));
                setVideoModal(null);
              }}>Insert Video</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== TABLE MODAL ========== */}
      {tableModal && (
        <div className="wysi-modal-bg" onClick={() => setTableModal(null)}>
          <div className="wysi-modal" onClick={e => e.stopPropagation()}>
            <div className="wysi-modal-header">
              <span>📊 Insert Table</span>
              <button onClick={() => setTableModal(null)}>✕</button>
            </div>
            <div className="wysi-modal-body">
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label>Columns</label>
                  <input type="number" min={1} max={10} value={tableModal.cols}
                    onChange={e => setTableModal(m => ({ ...m, cols: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Rows</label>
                  <input type="number" min={1} max={20} value={tableModal.rows}
                    onChange={e => setTableModal(m => ({ ...m, rows: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="wysi-modal-footer">
              <button className="wysi-btn-ghost" onClick={() => setTableModal(null)}>Cancel</button>
              <button className="wysi-btn-primary" onClick={() => {
                const cols = Math.max(1, Math.min(10, parseInt(tableModal.cols) || 3));
                const rows = Math.max(1, Math.min(20, parseInt(tableModal.rows) || 2));
                const ths = Array.from({ length: cols }, (_, i) => `<th>Header ${i + 1}</th>`).join('');
                const tds = Array.from({ length: cols }, () => '<td>&nbsp;</td>').join('');
                const trs = Array.from({ length: rows }, () => `<tr>${tds}</tr>`).join('');
                insertHtmlAtCursor(`<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`);
                setTableModal(null);
              }}>Insert Table</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlogEditorPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#64748b' }}>Loading editor...</div>}>
      <BlogEditorContent />
    </Suspense>
  );
}
