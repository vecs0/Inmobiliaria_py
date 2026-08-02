'use client';

import { useState, useEffect } from 'react';

type SyncLog = {
  date: string;
  imported: number;
  deduplicated: number;
  errors: number;
  source: string;
};

type FrequencyOption = {
  value: string;
  label: string;
};

const FREQUENCIES: FrequencyOption[] = [
  { value: 'manual', label: 'Manual (solo cuando yo ejecuto)' },
  { value: 'daily', label: 'Diaria (1 vez por día)' },
  { value: 'twice_daily', label: '2 veces al día' },
  { value: 'hourly', label: 'Cada hora' },
];

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

const STORAGE_KEY = 'inmopy_sync_config';

export function SincronizacionClient({
  initialLogs,
}: {
  initialLogs: SyncLog[];
}) {
  const [feedUrl, setFeedUrl] = useState('');
  const [frequency, setFrequency] = useState('manual');
  const [enabled, setEnabled] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<SyncLog[]>(initialLogs);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Cargar config guardada en localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const cfg = JSON.parse(saved);
        setFeedUrl(cfg.feedUrl ?? '');
        setFrequency(cfg.frequency ?? 'manual');
        setEnabled(cfg.enabled ?? false);
        setLastSync(cfg.lastSync ?? null);
      }
    } catch { /* ignore */ }
  }, []);

  function saveConfig(patch: Partial<{ feedUrl: string; frequency: string; enabled: boolean; lastSync: string }>) {
    const current = { feedUrl, frequency, enabled, lastSync, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    if ('feedUrl' in patch) setFeedUrl(patch.feedUrl!);
    if ('frequency' in patch) setFrequency(patch.frequency!);
    if ('enabled' in patch) setEnabled(patch.enabled!);
    if ('lastSync' in patch) setLastSync(patch.lastSync!);
  }

  async function handleSync() {
    if (!feedUrl.trim()) { setError('Ingresá la URL del feed XML.'); return; }
    setError('');
    setSyncing(true);

    try {
      const res = await fetch('/api/import/xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: feedUrl.trim(), profile: 'generic' }),
      });
      const json = await res.json();

      if (!res.ok) { setError(json.error ?? 'Error al sincronizar.'); return; }

      const now = new Date().toISOString();
      const newLog: SyncLog = {
        date: now,
        imported: json.imported ?? 0,
        deduplicated: json.deduplicated ?? 0,
        errors: json.errors ?? 0,
        source: feedUrl.trim(),
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 20));
      saveConfig({ lastSync: now });
    } catch (e: any) {
      setError(e.message ?? 'Error inesperado.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>EMPRESA</div>
          <h1>Sincronización <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>XML.</span></h1>
          <p style={{ color: 'var(--gray)', fontSize: 14, marginTop: 8 }}>
            Mantené tu catálogo actualizado automáticamente desde tu feed XML.
          </p>
        </div>
      </div>

      {/* Config */}
      <div className="dash-panel" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--gray)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
          Configuración del feed
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>URL del feed XML *</label>
            <input
              value={feedUrl}
              onChange={(e) => saveConfig({ feedUrl: e.target.value })}
              placeholder="https://tuproveedor.com/propiedades.xml"
              style={fieldStyle}
            />
            <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 6 }}>
              El feed debe ser accesible públicamente y responder en formato XML estándar.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Frecuencia de sincronización</label>
            <select
              value={frequency}
              onChange={(e) => saveConfig({ frequency: e.target.value })}
              style={{ ...fieldStyle, cursor: 'pointer' }}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Toggle activo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--gray-line)' }}>
            <button
              type="button"
              onClick={() => saveConfig({ enabled: !enabled })}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: enabled ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: enabled ? 22 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: enabled ? '#000' : 'rgba(255,255,255,0.5)',
                transition: 'left 0.2s',
              }} />
            </button>
            <div>
              <div style={{ fontSize: 14, color: enabled ? 'var(--fg)' : 'var(--gray)' }}>
                Sincronización automática {enabled ? 'activada' : 'desactivada'}
              </div>
              {enabled && frequency !== 'manual' && (
                <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                  {FREQUENCIES.find((f) => f.value === frequency)?.label}
                </div>
              )}
            </div>
          </div>
        </div>

        {lastSync && (
          <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 16 }}>
            Última sincronización: {new Date(lastSync).toLocaleString('es-PY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}

        {error && <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 12 }}>{error}</p>}

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || !feedUrl.trim()}
            className="btn-gold"
            style={{ padding: '12px 28px', fontSize: 14, opacity: (syncing || !feedUrl.trim()) ? 0.6 : 1, cursor: (syncing || !feedUrl.trim()) ? 'not-allowed' : 'pointer' }}
          >
            {syncing ? 'Sincronizando…' : '↻ Sincronizar ahora'}
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="dash-panel">
        <div style={{ fontSize: 11, color: 'var(--gray)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
          Historial de sincronizaciones
        </div>

        {logs.length === 0 ? (
          <p style={{ color: 'var(--gray)', fontSize: 14 }}>
            Todavía no se realizaron sincronizaciones. Configurá tu feed y ejecutá la primera sincronización.
          </p>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Importadas</th>
                <th>Deduplicadas</th>
                <th>Errores</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--gray)', fontSize: 13 }}>
                    {new Date(log.date).toLocaleString('es-PY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="gold">{log.imported}</td>
                  <td style={{ color: 'var(--gray)' }}>{log.deduplicated}</td>
                  <td style={{ color: log.errors > 0 ? '#ff6b6b' : 'var(--gray)' }}>{log.errors}</td>
                  <td>
                    <span style={{
                      fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: 20, fontFamily: 'var(--font-mono)',
                      color: log.errors === 0 ? '#4caf7d' : '#ff6b6b',
                      background: log.errors === 0 ? 'rgba(76,175,125,0.1)' : 'rgba(255,107,107,0.1)',
                    }}>
                      {log.errors === 0 ? 'OK' : 'Parcial'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
