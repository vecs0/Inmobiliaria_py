"use client";

import React from 'react';

const ROWS: { section: string; items: { label: string; value: string }[] }[] = [
  {
    section: 'General',
    items: [
      { label: 'Sitio', value: 'InmobiliariaPY' },
      { label: 'URL base', value: process.env.NEXT_PUBLIC_APP_URL || '(NEXT_PUBLIC_APP_URL sin definir)' },
    ],
  },
  {
    section: 'Moneda',
    items: [{ label: 'Tipo de cambio USD/PYG', value: process.env.NEXT_PUBLIC_USD_PYG_RATE || '7800 (por defecto)' }],
  },
];

export function AdminSettingsClient() {
  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 720 }}>
      <div style={{ background: 'var(--bg-mid)', border: '1px solid var(--gray-line)', borderRadius: 12, padding: 16, color: 'var(--gray)', fontSize: 14, lineHeight: 1.5 }}>
        Esta página es de solo lectura. La configuración (Stripe, Resend, límites de plan, tipo de cambio) se define mediante
        variables de entorno en Vercel y las tablas <code>plans</code> / migraciones de Supabase; no hay una tabla de ajustes editable.
      </div>
      {ROWS.map((r) => (
        <div key={r.section} style={{ background: 'var(--bg-mid)', border: '1px solid var(--gray-line)', borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--white)', marginBottom: 16 }}>{r.section}</h3>
          {r.items.map((i) => (
            <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', fontSize: 14, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--gray)' }}>{i.label}</span>
              <span style={{ color: 'var(--white)', wordBreak: 'break-all' }}>{i.value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
