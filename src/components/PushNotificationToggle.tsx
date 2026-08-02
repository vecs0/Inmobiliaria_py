"use client";

import React from 'react';
import { useServiceWorker } from '@/hooks/use-service-worker';

export function PushNotificationToggle() {
  const { isSupported, permission, requestPermission, subscribeToPush } = useServiceWorker();
  const [loading, setLoading] = React.useState(false);

  if (!isSupported) {
    return (
      <div style={{
        padding: '12px',
        background: 'var(--bg-mid)',
        border: '1px solid var(--gray-line)',
        borderRadius: '8px',
        fontSize: '14px',
        color: 'var(--gray)',
      }}>
        Las notificaciones push no son compatibles con este navegador.
      </div>
    );
  }

  const handleEnable = async () => {
    setLoading(true);
    const granted = await requestPermission();
    if (granted) {
      await subscribeToPush();
    }
    setLoading(false);
  };

  if (permission === 'granted') {
    return (
      <div style={{
        padding: '12px',
        background: '#10B98120',
        border: '1px solid #10B981',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#10B981',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '18px' }}>✓</span>
        Notificaciones push activadas
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div style={{
        padding: '12px',
        background: '#EF444420',
        border: '1px solid #EF4444',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#EF4444',
      }}>
        Las notificaciones están bloqueadas. Actívalas en la configuración del navegador.
      </div>
    );
  }

  return (
    <button
      onClick={handleEnable}
      disabled={loading}
      style={{
        padding: '12px 20px',
        background: 'var(--gold)',
        border: 'none',
        borderRadius: '8px',
        color: 'var(--white)',
        fontSize: '14px',
        fontWeight: '500',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? 'Activando...' : 'Activar notificaciones push'}
    </button>
  );
}
