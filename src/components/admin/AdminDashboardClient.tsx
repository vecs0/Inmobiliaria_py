"use client";

import React from 'react';

interface AdminDashboardClientProps {
  stats: {
    totalUsers: number;
    totalProperties: number;
    activeListings: number;
    totalSellers: number;
  };
  recentListings: any[];
  recentUsers: any[];
}

export function AdminDashboardClient({ stats, recentListings, recentUsers }: AdminDashboardClientProps) {
  return (
    <div>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard title="Usuarios Totales" value={stats.totalUsers} icon="👥" color="#3B82F6" />
        <StatCard title="Propiedades" value={stats.totalProperties} icon="🏠" color="#10B981" />
        <StatCard title="Listings Activos" value={stats.activeListings} icon="✨" color="#F59E0B" />
        <StatCard title="Vendedores" value={stats.totalSellers} icon="🏢" color="#8B5CF6" />
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <ActivitySection
          title="Propiedades Recientes"
          items={recentListings}
          renderItem={(item) => (
            <div key={item.id} style={{ padding: '12px', borderBottom: '1px solid var(--gray-line)' }}>
              <div style={{ fontWeight: '500', color: 'var(--white)', marginBottom: '4px' }}>{item.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                {new Date(item.created_at).toLocaleDateString('es-PY')} · {item.status}
              </div>
            </div>
          )}
        />
        <ActivitySection
          title="Usuarios Recientes"
          items={recentUsers}
          renderItem={(item) => (
            <div key={item.id} style={{ padding: '12px', borderBottom: '1px solid var(--gray-line)' }}>
              <div style={{ fontWeight: '500', color: 'var(--white)', marginBottom: '4px' }}>{item.email}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                {new Date(item.created_at).toLocaleDateString('es-PY')}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-mid)',
      border: '1px solid var(--gray-line)',
      borderRadius: '12px',
      padding: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <span style={{ fontSize: '12px', color: 'var(--gray)' }}>{title}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--white)' }}>{value}</div>
    </div>
  );
}

function ActivitySection({ title, items, renderItem }: { title: string; items: any[]; renderItem: (item: any) => React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-mid)', border: '1px solid var(--gray-line)', borderRadius: '12px', padding: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--white)', marginBottom: '16px' }}>{title}</h3>
      <div style={{ maxHeight: '300px', overflow: 'auto' }}>
        {items.length > 0 ? items.map(renderItem) : <p style={{ color: 'var(--gray)', fontSize: '14px' }}>Sin actividad reciente</p>}
      </div>
    </div>
  );
}
