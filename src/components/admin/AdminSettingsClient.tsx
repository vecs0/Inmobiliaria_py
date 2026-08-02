"use client";

import React from 'react';

export function AdminSettingsClient() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
      <SettingsSection
        title="Configuración General"
        fields={[
          { label: 'Nombre del sitio', type: 'text', defaultValue: 'InmobiliariaPY' },
          { label: 'Email de contacto', type: 'email', defaultValue: 'contacto@inmobiliariapy.com' },
          { label: 'URL del sitio', type: 'url', defaultValue: 'https://inmobiliariapy.com' },
        ]}
      />
      <SettingsSection
        title="Configuración de Pagos"
        fields={[
          { label: 'Stripe Publishable Key', type: 'password', defaultValue: '' },
          { label: 'Moneda por defecto', type: 'select', options: ['USD', 'PYG'], defaultValue: 'USD' },
        ]}
      />
      <SettingsSection
        title="Configuración de Email"
        fields={[
          { label: 'Resend API Key', type: 'password', defaultValue: '' },
          { label: 'Email de envío', type: 'email', defaultValue: 'noreply@inmobiliariapy.com' },
        ]}
      />
      <SettingsSection
        title="Límites y Cuotas"
        fields={[
          { label: 'Máximo propiedades gratis', type: 'number', defaultValue: '3' },
          { label: 'Máximo agentes (empresa)', type: 'number', defaultValue: '3' },
        ]}
      />
    </div>
  );
}

function SettingsSection({ title, fields }: { title: string; fields: any[] }) {
  return (
    <div style={{ background: 'var(--bg-mid)', border: '1px solid var(--gray-line)', borderRadius: '12px', padding: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--white)', marginBottom: '20px' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {fields.map((field, index) => (
          <div key={index}>
            <label style={{ display: 'block', color: 'var(--gray)', fontSize: '14px', marginBottom: '8px' }}>
              {field.label}
            </label>
            {field.type === 'select' ? (
              <select
                defaultValue={field.defaultValue}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--gray-line)',
                  borderRadius: '8px',
                  color: 'var(--white)',
                  fontSize: '14px',
                }}
              >
                {field.options?.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                defaultValue={field.defaultValue}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--gray-line)',
                  borderRadius: '8px',
                  color: 'var(--white)',
                  fontSize: '14px',
                }}
              />
            )}
          </div>
        ))}
        <button
          style={{
            marginTop: '8px',
            padding: '10px 20px',
            background: 'var(--gold)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--white)',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
