'use client';

import { useState, useRef } from 'react';

type ImportResult = {
  imported: number;
  deduplicated: number;
  errors: number;
  details?: { id?: string; status: string; error?: string }[];
};

type ParsedPreview = {
  count: number;
  sample: Record<string, unknown>[];
};

const fieldStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 6,
  background: 'var(--bg-dark)', border: '1px solid var(--gray-line)',
  borderRadius: 8, padding: '10px 14px', color: 'var(--fg)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--gray)',
  letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
};

export function ImportarClient() {
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [xmlUrl, setXmlUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [parsedData, setParsedData] = useState<unknown[] | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  async function handleParse() {
    if (mode === 'file' && !file) { setError('Seleccioná un archivo XML.'); return; }
    if (mode === 'url' && !xmlUrl.trim()) { setError('Ingresá una URL de feed XML.'); return; }
    setError('');
    setParsing(true);
    setPreview(null);
    setParsedData(null);
    setResult(null);

    try {
      let body: Record<string, unknown>;

      if (mode === 'file' && file) {
        const xmlData = await file.text();
        body = { xmlData, profile: 'generic' };
      } else {
        body = { url: xmlUrl.trim(), profile: 'generic' };
      }

      // Usar el endpoint de XML para parsear
      const res = await fetch('/api/import/xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Error al procesar el archivo.');
        return;
      }

      // El endpoint xml ya importa directamente — tomamos el resultado
      // Si devuelve un resultado de importación, lo mostramos directo
      if (json.imported !== undefined) {
        setResult(json as ImportResult);
        return;
      }

      // Si devuelve propiedades para preview
      const props = Array.isArray(json) ? json : json.properties ?? [];
      setParsedData(props);
      setPreview({
        count: props.length,
        sample: props.slice(0, 3),
      });
    } catch (e: any) {
      setError(e.message ?? 'Error inesperado.');
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirmImport() {
    if (!parsedData?.length) return;
    setImporting(true);
    setError('');
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Error al importar.'); return; }
      setResult(json as ImportResult);
      setPreview(null);
      setParsedData(null);
    } catch (e: any) {
      setError(e.message ?? 'Error inesperado.');
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFile(null);
    setXmlUrl('');
    setPreview(null);
    setParsedData(null);
    setResult(null);
    setError('');
  }

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>EMPRESA</div>
          <h1>Importar <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>propiedades.</span></h1>
          <p style={{ color: 'var(--gray)', fontSize: 14, marginTop: 8 }}>
            Importación masiva desde feed XML o archivo CSV.
          </p>
        </div>
      </div>

      {!result ? (
        <>
          {/* Selector modo */}
          <div className="dash-panel" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {(['file', 'url'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(''); setPreview(null); setParsedData(null); }}
                  style={{
                    padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                    border: `1px solid ${mode === m ? 'var(--gold)' : 'var(--gray-line)'}`,
                    background: mode === m ? 'rgba(200,168,100,0.08)' : 'var(--bg-dark)',
                    color: mode === m ? 'var(--gold)' : 'var(--gray)',
                  }}
                >
                  {m === 'file' ? '↑ Archivo XML' : '🔗 URL del feed'}
                </button>
              ))}
            </div>

            {mode === 'file' ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? 'var(--gold)' : file ? 'rgba(76,175,125,0.5)' : 'var(--gray-line)'}`,
                  borderRadius: 12, padding: '40px 24px', textAlign: 'center',
                  cursor: 'pointer', transition: 'border-color 0.2s',
                  background: dragging ? 'rgba(200,168,100,0.04)' : 'transparent',
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xml,.csv"
                  onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(''); }}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: 32, marginBottom: 12 }}>{file ? '✓' : '↑'}</div>
                <div style={{ color: file ? '#4caf7d' : 'var(--gray)', fontSize: 14 }}>
                  {file ? file.name : 'Arrastrá tu archivo XML o CSV aquí'}
                </div>
                {!file && (
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 8, opacity: 0.7 }}>
                    O hacé clic para seleccionar
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label style={labelStyle}>URL del feed XML</label>
                <input
                  value={xmlUrl}
                  onChange={(e) => setXmlUrl(e.target.value)}
                  placeholder="https://tuproveedor.com/feed.xml"
                  style={fieldStyle}
                />
              </div>
            )}

            {error && <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 16 }}>{error}</p>}

            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                onClick={handleParse}
                disabled={parsing}
                className="btn-gold"
                style={{ padding: '12px 28px', fontSize: 14, opacity: parsing ? 0.7 : 1, cursor: parsing ? 'not-allowed' : 'pointer' }}
              >
                {parsing ? 'Procesando…' : 'Analizar archivo →'}
              </button>
            </div>
          </div>

          {/* Preview */}
          {preview && parsedData && (
            <div className="dash-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--gray)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                    Preview de importación
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, margin: 0 }}>
                    {preview.count} propiedades encontradas
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  style={{ background: 'none', border: '1px solid var(--gray-line)', borderRadius: 8, padding: '8px 16px', color: 'var(--gray)', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancelar
                </button>
              </div>

              {/* Sample */}
              <div style={{ overflowX: 'auto', marginBottom: 24 }}>
                <table className="list-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Ciudad</th>
                      <th>Tipo</th>
                      <th>Precio</th>
                      <th>M²</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((p: any, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--fg)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.title ?? '—'}
                        </td>
                        <td style={{ color: 'var(--gray)' }}>{p.city ?? '—'}</td>
                        <td style={{ color: 'var(--gray)' }}>{p.type ?? '—'}</td>
                        <td className="gold">{p.currency} {p.price?.toLocaleString('es-PY') ?? '—'}</td>
                        <td style={{ color: 'var(--gray)' }}>{p.sqm ?? '—'} m²</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.count > 3 && (
                <p style={{ color: 'var(--gray)', fontSize: 13, marginBottom: 20 }}>
                  … y {preview.count - 3} propiedades más.
                </p>
              )}

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importing}
                className="btn-gold"
                style={{ padding: '12px 28px', fontSize: 14, opacity: importing ? 0.7 : 1, cursor: importing ? 'not-allowed' : 'pointer' }}
              >
                {importing ? 'Importando…' : `Confirmar importación (${preview.count}) →`}
              </button>
            </div>
          )}
        </>
      ) : (
        /* Resultado */
        <div className="dash-panel">
          <div style={{ fontSize: 40, marginBottom: 16 }}>{result.errors === 0 ? '✓' : '⚠'}</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 20 }}>
            Importación {result.errors === 0 ? 'completada' : 'completada con errores'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Importadas', value: result.imported, color: '#4caf7d' },
              { label: 'Deduplicadas', value: result.deduplicated, color: 'var(--gold)' },
              { label: 'Errores', value: result.errors, color: result.errors > 0 ? '#ff6b6b' : 'var(--gray)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--bg-dark)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color, marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--gray)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>

          <button type="button" onClick={reset} className="btn-gold" style={{ padding: '10px 24px', fontSize: 14 }}>
            Nueva importación
          </button>
        </div>
      )}
    </div>
  );
}
