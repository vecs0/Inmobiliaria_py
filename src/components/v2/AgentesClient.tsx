'use client';

import { useState, useTransition } from 'react';

export type AgentRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  whatsapp: string;
  photo: string;
  properties_count?: number;
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

export function AgentesClient({
  agents,
  maxAgents,
}: {
  agents: AgentRow[];
  maxAgents: number;
}) {
  const [list, setList] = useState<AgentRow[]>(agents);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', title: 'Agente inmobiliario', whatsapp: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  const canAdd = list.length < maxAgents;

  function patch(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    setError('');
  }

  async function handleInvite() {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!form.email.includes('@')) { setError('Ingresá un email válido.'); return; }
    setError('');

    startTransition(async () => {
      try {
        const res = await fetch('/api/seller/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? 'Error al invitar.'); return; }
        setList((prev) => [...prev, json.agent as AgentRow]);
        setSuccess(`Invitación enviada a ${form.email}`);
        setForm({ name: '', email: '', phone: '', title: 'Agente inmobiliario', whatsapp: '' });
        setShowForm(false);
      } catch (e: any) {
        setError(e.message ?? 'Error inesperado.');
      }
    });
  }

  async function handleRemove(agentId: string) {
    if (!confirm('¿Eliminar este agente?')) return;
    try {
      const res = await fetch(`/api/seller/agents/${agentId}`, { method: 'DELETE' });
      if (res.ok) setList((prev) => prev.filter((a) => a.id !== agentId));
    } catch { /* ignore */ }
  }

  return (
    <div>
      <div className="dash-topbar">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, width: '100%' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>EMPRESA</div>
            <h1>Mis <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>agentes.</span></h1>
          </div>
          {canAdd && (
            <button
              type="button"
              onClick={() => { setShowForm(true); setSuccess(''); }}
              className="btn-gold"
              style={{ padding: '12px 24px', fontSize: 13 }}
            >
              + Invitar agente
            </button>
          )}
        </div>
      </div>

      {success && (
        <div style={{ background: 'rgba(76,175,125,0.1)', border: '1px solid rgba(76,175,125,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#4caf7d', fontSize: 14 }}>
          ✓ {success}
        </div>
      )}

      {!canAdd && (
        <div style={{ background: 'rgba(200,168,100,0.08)', border: '1px solid rgba(200,168,100,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: 'var(--gold)', fontSize: 14 }}>
          Límite de {maxAgents} agentes alcanzado. Actualizá tu plan para agregar más.
        </div>
      )}

      {/* Lista de agentes */}
      {list.length === 0 ? (
        <div className="dash-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>◈</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 8 }}>Sin agentes todavía</h3>
          <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 20 }}>
            Invitá a tu equipo para que gestionen propiedades bajo tu empresa.
          </p>
          {canAdd && (
            <button type="button" onClick={() => setShowForm(true)} className="btn-gold" style={{ padding: '10px 24px', fontSize: 14 }}>
              Invitar primer agente →
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {list.map((agent) => (
            <div key={agent.id} className="dash-panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                {agent.photo ? (
                  <img src={agent.photo} alt={agent.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'rgba(200,168,100,0.1)', border: '1px solid rgba(200,168,100,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, color: 'var(--gold)',
                  }}>
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{agent.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray)' }}>{agent.title}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--gray)' }}>✉ {agent.email}</div>
                {agent.phone && <div style={{ fontSize: 13, color: 'var(--gray)' }}>📞 {agent.phone}</div>}
                {agent.whatsapp && <div style={{ fontSize: 13, color: 'var(--gray)' }}>💬 {agent.whatsapp}</div>}
              </div>
              {agent.properties_count !== undefined && (
                <div style={{ fontSize: 12, color: 'var(--gray)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                  {agent.properties_count} propiedad{agent.properties_count !== 1 ? 'es' : ''} asignada{agent.properties_count !== 1 ? 's' : ''}
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(agent.id)}
                style={{ background: 'none', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 6, padding: '6px 14px', color: '#ff6b6b', cursor: 'pointer', fontSize: 12 }}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal invitar */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'var(--bg-mid)', border: '1px solid var(--gray-line)',
            borderRadius: 16, padding: 36, width: '100%', maxWidth: 480,
          }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 24 }}>
              Invitar agente
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input value={form.name} onChange={(e) => patch('name', e.target.value)} placeholder="Ana García" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={form.email} onChange={(e) => patch('email', e.target.value)} placeholder="agente@empresa.com" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Cargo</label>
                <input value={form.title} onChange={(e) => patch('title', e.target.value)} placeholder="Agente inmobiliario" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input value={form.phone} onChange={(e) => patch('phone', e.target.value)} placeholder="+595 9XX XXX XXX" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp</label>
                <input value={form.whatsapp} onChange={(e) => patch('whatsapp', e.target.value)} placeholder="+595 9XX XXX XXX" style={fieldStyle} />
              </div>
            </div>

            {error && <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 16 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); }}
                style={{ flex: 1, background: 'none', border: '1px solid var(--gray-line)', borderRadius: 8, padding: '12px', color: 'var(--gray)', cursor: 'pointer', fontSize: 14 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInvite}
                disabled={isPending}
                className="btn-gold"
                style={{ flex: 1, padding: '12px', fontSize: 14, opacity: isPending ? 0.7 : 1, cursor: isPending ? 'not-allowed' : 'pointer' }}
              >
                {isPending ? 'Invitando…' : 'Enviar invitación →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
