'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  createSavedSearch,
  deleteSavedSearch,
  toggleSavedSearch,
} from '@/lib/supabase/saved-searches-actions';
import type { SavedSearch } from '@/lib/supabase/types';
import { PushNotificationToggle } from '@/components/PushNotificationToggle';

const DEPARTAMENTOS = [
  'Asunción', 'Central', 'Alto Paraná', 'Itapúa', 'Amambay',
  'Caaguazú', 'San Pedro', 'Concepción', 'Cordillera', 'Guairá',
  'Caazapá', 'Misiones', 'Paraguarí', 'Ñeembucú', 'Presidente Hayes',
  'Boquerón', 'Alto Paraguay',
];

const TIPOS = ['Casa', 'Apartamento', 'Terreno', 'Local comercial'];

interface AlertasClientProps {
  initialAlerts: SavedSearch[];
}

export function AlertasClient({ initialAlerts }: AlertasClientProps) {
  const [alerts, setAlerts] = useState<SavedSearch[]>(initialAlerts);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [tipo, setTipo] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');

  function resetForm() {
    setName(''); setDepartamento(''); setTipo('');
    setPrecioMin(''); setPrecioMax(''); setError('');
  }

  async function handleCreate() {
    if (!name.trim()) { setError('Ponele un nombre a la alerta.'); return; }
    setError('');
    const filters: Record<string, unknown> = {};
    if (departamento) filters.department = departamento;
    if (tipo) filters.type = tipo;
    if (precioMin) filters.price_min = Number(precioMin);
    if (precioMax) filters.price_max = Number(precioMax);

    const result = await createSavedSearch(name, filters as any);
    if (!result.success) { setError(result.error ?? 'Error al crear alerta.'); return; }

    startTransition(() => {
      if (result.data) setAlerts((prev) => [result.data!, ...prev]);
      setShowModal(false);
      resetForm();
    });
  }

  async function handleDelete(id: string) {
    await deleteSavedSearch(id);
    startTransition(() => setAlerts((prev) => prev.filter((a) => a.id !== id)));
  }

  async function handleToggle(id: string, current: boolean) {
    await toggleSavedSearch(id, !current);
    startTransition(() =>
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, active: !current } : a))
    );
  }

  const labelFor = (a: SavedSearch) => {
    const f = a.filters as Record<string, unknown>;
    const parts: string[] = [];
    if (f.department) parts.push(String(f.department));
    if (f.type) parts.push(String(f.type));
    if (f.price_min || f.price_max) {
      const min = f.price_min ? `USD ${Number(f.price_min).toLocaleString()}` : '';
      const max = f.price_max ? `USD ${Number(f.price_max).toLocaleString()}` : '';
      if (min && max) parts.push(`${min} - ${max}`);
      else if (min) parts.push(`Desde ${min}`);
      else parts.push(`Hasta ${max}`);
    }
    return parts.length ? parts.join(' · ') : 'Sin filtros específicos';
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ color: 'var(--gray)', fontSize: 14 }}>
          {alerts.length} de 10 alertas usadas
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <PushNotificationToggle />
          <button
            onClick={() => setShowModal(true)}
            className="btn-gold"
            disabled={alerts.length >= 10}
            style={{ fontSize: 13, padding: '8px 20px' }}
          >
            + Nueva alerta
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 12 }}>
            No tenés alertas activas
          </h2>
          <p style={{ color: 'var(--gray)', maxWidth: 400, margin: '0 auto 32px' }}>
            Creá una alerta y te avisamos cuando aparezca una propiedad que coincida con tu búsqueda.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-gold">
            Crear primera alerta
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.map((alert) => (
            <div key={alert.id} style={{
              background: 'var(--bg-mid)',
              border: `1px solid ${alert.active ? 'var(--gold)' : 'var(--gray-line)'}`,
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{alert.name}</div>
                <div style={{ color: 'var(--gray)', fontSize: 13 }}>{labelFor(alert)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(alert.id, alert.active)}
                  title={alert.active ? 'Desactivar' : 'Activar'}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: alert.active ? 'var(--gold)' : 'var(--gray-line)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    left: alert.active ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                  }} />
                </button>
                <span style={{ fontSize: 12, color: alert.active ? 'var(--gold)' : 'var(--gray)', minWidth: 60 }}>
                  {alert.active ? 'Activa' : 'Pausada'}
                </span>
                <button
                  onClick={() => handleDelete(alert.id)}
                  title="Eliminar alerta"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', fontSize: 18, lineHeight: 1, padding: 4 }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva alerta */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'var(--bg-mid)',
            border: '1px solid var(--gray-line)',
            borderRadius: 16, padding: 32, width: '100%', maxWidth: 460,
          }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 20 }}>
              Nueva alerta
            </h3>

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Nombre de la alerta *
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Apartamento en Asunción"
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={labelStyle}>Departamento</span>
              <select value={departamento} onChange={(e) => setDepartamento(e.target.value)} style={inputStyle}>
                <option value="">Todos</option>
                {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={labelStyle}>Tipo de propiedad</span>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
                <option value="">Todos</option>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <label>
                <span style={labelStyle}>Precio mín (USD)</span>
                <input type="number" value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} placeholder="0" style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>Precio máx (USD)</span>
                <input type="number" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} placeholder="Sin límite" style={inputStyle} />
              </label>
            </div>

            {error && (
              <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 16 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                style={{ background: 'none', border: '1px solid var(--gray-line)', borderRadius: 8, padding: '10px 20px', color: 'var(--gray)', cursor: 'pointer', fontSize: 14 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="btn-gold"
                style={{ fontSize: 14, padding: '10px 24px' }}
              >
                Crear alerta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 6,
  background: 'var(--bg-dark)', border: '1px solid var(--gray-line)',
  borderRadius: 8, padding: '10px 12px', color: 'var(--fg)',
  fontSize: 14, outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--gray)',
  letterSpacing: '0.08em', textTransform: 'uppercase',
};
