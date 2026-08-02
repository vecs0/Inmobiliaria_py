"use client";

import React from 'react';

interface AdminAnalyticsClientProps {
  listingsByMonth: any[];
  listingsByStatus: any[];
  listingsByType: any[];
}

export function AdminAnalyticsClient({ listingsByMonth, listingsByStatus, listingsByType }: AdminAnalyticsClientProps) {
  // Calculate stats
  const statusCounts = listingsByStatus.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeCounts = listingsByType.reduce((acc, item) => {
    acc[item.operation_type] = (acc[item.operation_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
      <AnalyticsCard
        title="Propiedades por Estado"
        data={Object.entries(statusCounts).map(([key, value]) => ({ label: key, value: value as number }))}
      />
      <AnalyticsCard
        title="Propiedades por Tipo de Operación"
        data={Object.entries(typeCounts).map(([key, value]) => ({ label: key, value: value as number }))}
      />
      <AnalyticsCard
        title="Propiedades por Mes"
        data={listingsByMonth.reduce((acc, item) => {
          const month = new Date(item.created_at).toLocaleDateString('es-PY', { month: 'long', year: 'numeric' });
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)}
      />
    </div>
  );
}

function AnalyticsCard({ title, data }: { title: string; data: Record<string, number> | Array<{ label: string; value: number }> }) {
  const dataArray = Array.isArray(data) ? data : Object.entries(data).map(([label, value]) => ({ label, value }));
  const maxValue = Math.max(...dataArray.map(d => d.value), 1);

  return (
    <div style={{ background: 'var(--bg-mid)', border: '1px solid var(--gray-line)', borderRadius: '12px', padding: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--white)', marginBottom: '20px' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {dataArray.map((item, index) => (
          <div key={index}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--gray)', fontSize: '14px' }}>{item.label}</span>
              <span style={{ color: 'var(--white)', fontSize: '14px', fontWeight: '500' }}>{item.value}</span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: 'var(--gold)',
                  borderRadius: '4px',
                  width: `${(item.value / maxValue) * 100}%`,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        ))}
        {dataArray.length === 0 && (
          <p style={{ color: 'var(--gray)', fontSize: '14px' }}>Sin datos disponibles</p>
        )}
      </div>
    </div>
  );
}
