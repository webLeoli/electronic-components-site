'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRfqCart, MAX_CART_ITEMS } from '@/lib/rfq-cart';

export default function BomTool() {
  const [lines, setLines] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [parsed, setParsed] = useState(false);
  const fileInputRef = useRef(null);
  const { addItem, count: cartCount } = useRfqCart();

  // Parse CSV/TSV text into structured lines
  const parseBOM = (text) => {
    if (!text.trim()) { setParseError('Please paste or upload BOM data.'); return; }
    setParseError('');

    const rows = text.trim().split('\n').map(row => {
      // Try tab first, then comma
      let cols = row.split('\t');
      if (cols.length < 2) cols = row.split(',');
      return cols.map(c => c.trim().replace(/^["']|["']$/g, ''));
    });

    // Detect header row
    let startIndex = 0;
    const firstRow = rows[0].map(c => c.toLowerCase());
    if (firstRow.some(c => ['part', 'partnum', 'part number', 'partnumber', 'mpn', 'mfr part', 'component'].includes(c))) {
      startIndex = 1;
    }

    // Try to identify columns
    let partCol = 0, mfrCol = -1, qtyCol = -1, descCol = -1;
    if (startIndex === 1) {
      firstRow.forEach((h, i) => {
        if (['part', 'partnum', 'part number', 'partnumber', 'mpn', 'mfr part', 'component', 'p/n'].includes(h)) partCol = i;
        if (['manufacturer', 'mfr', 'mfg', 'brand', 'vendor'].includes(h)) mfrCol = i;
        if (['qty', 'quantity', 'count', 'amount', 'qty.'].includes(h)) qtyCol = i;
        if (['description', 'desc', 'value', 'comment', 'note'].includes(h)) descCol = i;
      });
    }

    const parsed = rows.slice(startIndex)
      .filter(row => row[partCol]?.trim())
      .map(row => ({
        partNumber: row[partCol] || '',
        manufacturer: mfrCol >= 0 ? (row[mfrCol] || '') : '',
        qty: qtyCol >= 0 ? (row[qtyCol] || '1') : '1',
        description: descCol >= 0 ? (row[descCol] || '') : '',
        selected: true,
      }));

    if (parsed.length === 0) {
      setParseError('No valid part numbers found. Please check your format.');
      return;
    }

    setLines(parsed);
    setParsed(true);
  };

  // Handle file upload
  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setPasteText(text);
      parseBOM(text);
    };
    reader.readAsText(file);
  };

  // Toggle selection
  const toggleLine = (index) => {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, selected: !l.selected } : l));
  };

  // Toggle all
  const toggleAll = () => {
    const allSelected = lines.every(l => l.selected);
    setLines(prev => prev.map(l => ({ ...l, selected: !allSelected })));
  };

  // Add selected to RFQ cart — merge with existing items
  const addToRfq = () => {
    const selected = lines.filter(l => l.selected);
    if (selected.length === 0) return;
    for (const l of selected) {
      addItem(l.partNumber, l.manufacturer, parseInt(l.qty) || 1);
    }
  };

  const selectedCount = lines.filter(l => l.selected).length;
  // The cart caps at MAX_CART_ITEMS and silently ignores adds past it. Surface
  // that BEFORE the buyer clicks Submit, or lines vanish without a trace.
  const cartCapacity = Math.max(0, MAX_CART_ITEMS - cartCount);
  const overCapacity = selectedCount > cartCapacity;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="separator">›</span>
        <span style={{ color: 'var(--color-text-primary)' }}>BOM Tool</span>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: 'var(--space-sm)' }}>
            BOM <span className="text-accent">Quote Tool</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            Upload your Bill of Materials and get quotes for all components at once.
            We support CSV, TSV, and paste-from-Excel formats.
          </p>
        </div>

        {!parsed ? (
          <>
            {/* Upload Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
              {/* File Upload */}
              <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>📁</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Upload CSV / TSV</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
                  Upload a .csv or .txt file with your BOM data
                </p>
                <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                  {fileName || 'Choose File'}
                </button>
                <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              </div>

              {/* Paste Section */}
              <div className="card" style={{ padding: 'var(--space-xl)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>📋 Paste from Excel / Spreadsheet</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
                  Copy rows from your spreadsheet and paste below
                </p>
                <textarea
                  className="input"
                  rows={6}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder={"Part Number\tManufacturer\tQty\nSTM32F103C8T6\tSTMicroelectronics\t100\nATMEGA328P-AU\tMicrochip\t50\nLM7805CT\tTexas Instruments\t200"}
                  style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                />
              </div>
            </div>

            {parseError && (
              <div style={{ background: 'rgba(255,61,0,0.1)', border: '1px solid rgba(255,61,0,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 'var(--space-md)', color: '#fca5a5', fontSize: '14px' }}>
                ⚠️ {parseError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                <strong>Supported formats:</strong> CSV, TSV, or tab-separated values from Excel. Include headers like &quot;Part Number, Manufacturer, Qty&quot; for best results.
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => parseBOM(pasteText)}>
                🔄 Parse BOM
              </button>
            </div>

            {/* Example Format */}
            <div className="card" style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-xl)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>📝 Example Format</h3>
              <pre style={{
                background: 'var(--color-bg-primary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', overflow: 'auto',
              }}>
{`Part Number,Manufacturer,Qty,Description
STM32F103C8T6,STMicroelectronics,100,ARM Cortex-M3 MCU
ATMEGA328P-AU,Microchip,50,AVR Microcontroller
LM7805CT,Texas Instruments,200,5V Voltage Regulator
IRF540NPBF,Infineon,300,N-Channel MOSFET`}
              </pre>
            </div>
          </>
        ) : (
          <>
            {/* Parsed Results */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{lines.length} parts found</span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                  ({selectedCount} selected)
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-secondary" onClick={() => { setParsed(false); setLines([]); setPasteText(''); setFileName(''); }}>
                  ← Upload New BOM
                </button>
                <button className="btn btn-primary" onClick={addToRfq} disabled={selectedCount === 0}>
                  Add {selectedCount} Parts to RFQ →
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" checked={lines.every(l => l.selected)} onChange={toggleAll} />
                    </th>
                    <th>#</th>
                    <th>Part Number</th>
                    <th>Manufacturer</th>
                    <th>Qty</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} style={{ opacity: line.selected ? 1 : 0.5 }}>
                      <td><input type="checkbox" checked={line.selected} onChange={() => toggleLine(i)} /></td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{i + 1}</td>
                      <td className="part-number">
                        <Link href={`/search?q=${encodeURIComponent(line.partNumber)}`}>{line.partNumber}</Link>
                      </td>
                      <td>{line.manufacturer || '—'}</td>
                      <td>{line.qty}</td>
                      <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {line.description || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {overCapacity && (
              <div className="alert alert-warning" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', color: 'var(--color-warning, #b45309)', fontSize: '14px' }}>
                The RFQ form holds up to {MAX_CART_ITEMS} lines ({cartCapacity} slot{cartCapacity === 1 ? '' : 's'} left in your current inquiry).
                Only the first {cartCapacity} selected parts will carry over — for a larger BOM, attach the file directly on the RFQ page instead.
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-lg)', gap: 'var(--space-md)' }}>
              <Link href="/rfq" className="btn btn-primary btn-lg" onClick={addToRfq}>
                Submit RFQ for {overCapacity ? `${cartCapacity} of ${selectedCount}` : selectedCount} Parts →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
