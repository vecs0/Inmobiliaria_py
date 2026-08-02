"use client";

import React from 'react';

interface AdminUsersClientProps {
  users: any[];
}

export function AdminUsersClient({ users }: AdminUsersClientProps) {
  return (
    <div style={{ background: 'var(--bg-mid)', border: '1px solid var(--gray-line)', borderRadius: '12px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-dark)', borderBottom: '1px solid var(--gray-line)' }}>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Email</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Nombre</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Creado</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Último acceso</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid var(--gray-line)' }}>
              <td style={{ padding: '16px', color: 'var(--white)' }}>{user.email}</td>
              <td style={{ padding: '16px', color: 'var(--gray)' }}>{user.raw_user_meta_data?.full_name || '-'}</td>
              <td style={{ padding: '16px', color: 'var(--gray)', fontSize: '14px' }}>
                {new Date(user.created_at).toLocaleDateString('es-PY')}
              </td>
              <td style={{ padding: '16px', color: 'var(--gray)', fontSize: '14px' }}>
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('es-PY') : 'Nunca'}
              </td>
              <td style={{ padding: '16px' }}>
                <button style={{ padding: '6px 12px', background: 'var(--bg-dark)', border: '1px solid var(--gray-line)', borderRadius: '6px', color: 'var(--white)', fontSize: '12px', cursor: 'pointer' }}>
                  Ver
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray)' }}>
                No hay usuarios registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
