"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setUserRole } from '@/app/admin/actions';

const ROLES = ['user', 'seller', 'seller_empresa', 'agent', 'admin'];

interface AdminUsersClientProps {
  users: any[];
  currentUserId: string;
}

export function AdminUsersClient({ users, currentUserId }: AdminUsersClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function changeRole(id: string, role: string) {
    setError(null);
    startTransition(async () => {
      const res = await setUserRole(id, role);
      if (!res.ok) setError(res.error ?? 'Error');
      router.refresh();
    });
  }

  return (
    <>
    {error && <div style={{ color: '#F87171', marginBottom: 12, fontSize: 14 }}>{error}</div>}
    <div style={{ background: 'var(--bg-mid)', border: '1px solid var(--gray-line)', borderRadius: '12px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-dark)', borderBottom: '1px solid var(--gray-line)' }}>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Email</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Nombre</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Creado</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Último acceso</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Rol</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid var(--gray-line)' }}>
              <td style={{ padding: '16px', color: 'var(--white)' }}>{user.email}</td>
              <td style={{ padding: '16px', color: 'var(--gray)' }}>{user.full_name || '-'}</td>
              <td style={{ padding: '16px', color: 'var(--gray)', fontSize: '14px' }}>
                {new Date(user.created_at).toLocaleDateString('es-PY')}
              </td>
              <td style={{ padding: '16px', color: 'var(--gray)', fontSize: '14px' }}>
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('es-PY') : 'Nunca'}
              </td>
              <td style={{ padding: '16px' }}>
                <select
                  value={user.role}
                  disabled={pending || user.id === currentUserId}
                  onChange={(e) => changeRole(user.id, e.target.value)}
                  style={{ padding: '6px 10px', background: 'var(--bg-dark)', border: '1px solid var(--gray-line)', borderRadius: 6, color: 'var(--white)', fontSize: 12 }}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
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
    </>
  );
}
