'use client';

import { useState } from 'react';
import Link from 'next/link';
import { decodePartNumber, EXAMPLE_PARTS } from '@/lib/fpga-part-decode';

export default function DecoderTool() {
  const [input, setInput] = useState('');
  const trimmed = input.trim();
  const result = trimmed.length >= 4 ? decodePartNumber(trimmed) : null;

  return (
    <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
      <label htmlFor="pn-input" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
        FPGA / CPLD part number
      </label>
      <input
        id="pn-input"
        type="text"
        className="input"
        style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', padding: '14px 16px', width: '100%' }}
        placeholder="e.g. XC7A35T-1CPG236C"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'var(--space-sm)' }}>
        {EXAMPLE_PARTS.map(pn => (
          <button
            key={pn}
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            onClick={() => setInput(pn)}
          >
            {pn}
          </button>
        ))}
      </div>

      {trimmed.length >= 4 && !result && (
        <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', borderRadius: '8px', background: 'var(--color-bg-secondary)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          <strong>Not recognized as an FPGA/CPLD ordering code we can decode.</strong>{' '}
          The tool covers Xilinx 7-series, Spartan-6, UltraScale, XC9500, Altera Cyclone/Stratix (EP), MAX II/V/10,
          Lattice MachXO, and Microchip ProASIC3/IGLOO schemes. You can still{' '}
          <Link href={`/search?q=${encodeURIComponent(trimmed)}`}>search our catalog</Link> or{' '}
          <Link href={`/rfq?part=${encodeURIComponent(trimmed)}`}>request a quote</Link> for this part.
        </div>
      )}

      {result && (
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{result.normalized}</span>
            <span className="badge badge-info">{result.vendor}</span>
            <span className="badge badge-success">{result.family}</span>
          </div>

          {result.segments.length > 0 && (
            <div className="table-wrapper">
              <table className="table" style={{ fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Segment</th>
                    <th style={{ width: '160px' }}>Field</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {result.segments.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{s.part}</td>
                      <td style={{ fontWeight: 600 }}>{s.label}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{s.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.notes.map((note, i) => (
            <p key={i} style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: 'var(--space-sm)', lineHeight: 1.6 }}>
              ⓘ {note}
            </p>
          ))}

          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginTop: 'var(--space-lg)' }}>
            <Link href={`/search?q=${encodeURIComponent(result.normalized)}`} className="btn btn-secondary">
              Search catalog for this part
            </Link>
            <Link href={`/rfq?part=${encodeURIComponent(result.normalized)}`} className="btn btn-primary">
              Request a quote
            </Link>
            {result.seriesSlug && (
              <Link href={`/fpga-sourcing/${result.seriesSlug}`} className="btn btn-secondary">
                {result.family} sourcing guide
              </Link>
            )}
          </div>

          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 'var(--space-md)', lineHeight: 1.5 }}>
            * Decode is based on published vendor numbering schemes and is an identification aid, not an
            authority. Always confirm against the vendor ordering guide before purchasing.
          </p>
        </div>
      )}
    </div>
  );
}
