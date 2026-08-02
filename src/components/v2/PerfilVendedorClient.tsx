'use client';

import { useState, useTransition } from 'react';
import { updateSellerProfile } from '@/lib/actions/seller';

export type PerfilData = {
  // profiles
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  email: string;
  // seller_profiles
  company_name: string | null;
  ruc: string | null;
  website_url: string | null;
  seller_type: string;
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

export function PerfilVendedorClient({ data }: { data: PerfilData }) {
  const [form, setForm] = useState({
    full_name: data.full_name ?? '',
    phone: data.phone ?? '',
    avatar_url: data.avatar_url ?? '',
    company_name: data.company_name ?? '',
    ruc: data.ruc ?? '',
    website_url: data.website_url ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  function patch(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/seller/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.url) {
        patch('avatar_url', json.url);
      } else {
        setError(json.error ?? 'Error al subir avatar');
      }
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    if (!form.full_name.trim()) { setError('El nombre es obligatorio.'); return; }
    setError('');
    startTransition(async () => {
      const res = await updateSellerProfile(form);
      if (res.success) setSaved(true);
      else setError(res.error ?? 'Error al guardar.');
    });
  }

  const isEmpresa = data.seller_type === 'empresa';

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>MI CUENTA</div>
          <h1>Tu <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>perfil.</span></h1>
        </div>
      </div>

      <div className="dash-panel" style={{ maxWidth: 680 }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36, paddingBottom: 28, borderBottom: '1px solid var(--gray-line)' }}>
          <div style={{ position: 'relative' }}>
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt="Avatar"
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }}
              />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(200,168,100,0.1)', border: '2px solid var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: 'var(--gold)',
              }}>
                {(form.full_name || data.email).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 4 }}>
              {form.full_name || 'Sin nombre'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 10 }}>{data.email}</div>
            <label style={{
              display: 'inline-block', cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: 12, color: 'var(--gold)', border: '1px solid rgba(200,168,100,0.4)',
              borderRadius: 6, padding: '5px 14px', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em', opacity: uploading ? 0.6 : 1,
            }}>
              {uploading ? 'Subiendo…' : '↑ Cambiar foto'}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Datos personales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: 'var(--gray)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Datos personales
          </div>

          <div>
            <label style={labelStyle}>Nombre completo *</label>
            <input
              value={form.full_name}
              onChange={(e) => patch('full_name', e.target.value)}
              placeholder="Tu nombre"
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Teléfono / WhatsApp</label>
            <input
              value={form.phone}
              onChange={(e) => patch('phone', e.target.value)}
              placeholder="+595 9XX XXX XXX"
              style={fieldStyle}
            />
          </div>
        </div>

        {/* Datos empresa (solo para seller_company) */}
        {isEmpresa && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28, paddingTop: 20, borderTop: '1px solid var(--gray-line)' }}>
            <div style={{ fontSize: 11, color: 'var(--gray)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Datos de empresa
            </div>

            <div>
              <label style={labelStyle}>Nombre de la empresa</label>
              <input
                value={form.company_name}
                onChange={(e) => patch('company_name', e.target.value)}
                placeholder="Inmobiliaria XYZ"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>RUC</label>
              <input
                value={form.ruc}
                onChange={(e) => patch('ruc', e.target.value)}
                placeholder="80012345-6"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Sitio web</label>
              <input
                value={form.website_url}
                onChange={(e) => patch('website_url', e.target.value)}
                placeholder="https://tuinmobiliaria.com.py"
                style={fieldStyle}
              />
            </div>
          </div>
        )}

        {/* Errores y feedback */}
        {error && (
          <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}
        {saved && (
          <p style={{ color: '#4caf7d', fontSize: 13, marginBottom: 16 }}>✓ Cambios guardados correctamente.</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="btn-gold"
          style={{ padding: '12px 32px', fontSize: 14, opacity: isPending ? 0.7 : 1, cursor: isPending ? 'not-allowed' : 'pointer' }}
        >
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
