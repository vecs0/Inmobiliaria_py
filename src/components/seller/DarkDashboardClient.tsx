'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, MessageSquare, Phone, Calendar, DollarSign, Eye, ShieldAlert } from 'lucide-react';

interface DarkDashboardClientProps {
  stats: {
    active_properties: number;
    leads_total: number;
    views_7d: number;
    conversion_rate: number;
  };
  recentLeads: any[];
  recentProperties: any[];
}

export function DarkDashboardClient({ stats, recentLeads, recentProperties }: DarkDashboardClientProps) {
  const router = useRouter();

  // Map state to human-readable strings and badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="status-pill active">● Activa</span>;
      case 'draft':
        return <span className="status-pill draft">○ Borrador</span>;
      case 'sold':
        return <span className="status-pill sold">✓ Vendida</span>;
      default:
        return <span className="status-pill draft">○ {status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="stats-row">
        {[
          { k: 'Vistas totales', v: stats.views_7d.toLocaleString('es-PY'), d: '+18.4%', up: true, spark: 'up' },
          { k: 'Consultas', v: stats.leads_total.toLocaleString('es-PY'), d: '+24.1%', up: true, spark: 'up' },
          { k: 'Visitas agendadas', v: stats.active_properties.toLocaleString('es-PY'), d: '−3.2%', up: false, spark: 'dn' },
          { k: 'Ingresos en negociación', v: `USD ${(stats.active_properties * 145000).toLocaleString('es-PY')}`, d: '+42.0%', up: true, spark: 'up' }
        ].map((s) => (
          <div key={s.k} className="stat-card">
            <div className="k">{s.k}</div>
            <div className="v">{s.v}</div>
            <div className={`delta ${s.up ? 'up' : 'dn'}`}>
              <span>{s.up ? '↗' : '↘'}</span> {s.d} <span style={{ color: 'var(--gray)' }}>esta semana</span>
            </div>
            <Sparkline up={s.spark === 'up'} />
          </div>
        ))}
      </div>

      {/* Chart + Recent Leads */}
      <div className="dash-row">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Vistas & consultas</h3>
            <div className="meta">ÚLTIMOS 30 DÍAS</div>
          </div>
          <ChartViewsLeads />
          <div className="legend">
            <span><span className="swatch" /> Vistas</span>
            <span><span className="swatch b" /> Consultas</span>
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Últimas consultas</h3>
            <div className="meta">HOY</div>
          </div>
          <div className="flex flex-col gap-4">
            {recentLeads.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Sin consultas registradas hoy.</div>
            ) : (
              recentLeads.map((l: any, i: number) => {
                const initial = l.name ? l.name[0] : 'C';
                const source = l.phone ? 'WhatsApp' : 'Formulario';
                const timeDiff = 'hace ' + Math.floor(Math.random() * 5 + 1) + ' h';
                return (
                  <div key={l.id} className="flex items-center gap-3.5 py-3 border-b border-white/5 last:border-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1a2e4a] to-[#B8922A] flex items-center justify-center font-serif text-sm text-white font-bold uppercase">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{l.name}</div>
                      <div className="text-xs text-gray-400 truncate">{l.email}</div>
                    </div>
                    <div className="text-right font-mono text-[10px] text-gray-400 tracking-wider">
                      <div className="text-[#B8922A] font-bold">{source.toUpperCase()}</div>
                      <div>{timeDiff}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Properties Table */}
      <div className="dash-panel">
        <div className="dash-panel-head">
          <h3>Mis propiedades</h3>
          <Link href="/vendedor/publicar" className="btn btn-gold" style={{ padding: '10px 18px', fontSize: 11 }}>
            + Publicar nueva
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="list-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Propiedad</th>
                <th>Ubicación</th>
                <th>Precio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentProperties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No tienes propiedades publicadas. ¡Publica tu primera propiedad ahora!
                  </td>
                </tr>
              ) : (
                recentProperties.map((p: any) => {
                  const priceFormatted = p.price > 0 ? `USD ${Number(p.price).toLocaleString('es-PY')}` : 'Consultar';
                  const pId = p.id.substring(0, 7).toUpperCase();
                  return (
                    <tr key={p.id}>
                      <td className="gold">{pId}</td>
                      <td className="row-title">{p.title}</td>
                      <td style={{ color: 'var(--gray)' }}>Paraguay</td>
                      <td className="gold">{priceFormatted}</td>
                      <td>{getStatusBadge(p.status)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Sparkline
function Sparkline({ up = true }: { up?: boolean }) {
  const points = up
    ? '0,18 10,16 20,17 30,12 40,13 50,8 60,9 70,4 80,5'
    : '0,4 10,6 20,5 30,9 40,8 50,12 60,11 70,15 80,16';
  return (
    <svg className="spark" width="80" height="22" viewBox="0 0 80 22">
      <polyline points={points} fill="none" stroke={up ? 'var(--gold)' : '#ef4444'} strokeWidth="1.2" />
    </svg>
  );
}

// Dual line chart
function ChartViewsLeads() {
  const w = 660, h = 220;
  const views = [40, 65, 50, 78, 95, 110, 90, 130, 145, 120, 160, 175, 150, 190, 210, 195, 220, 245, 230, 260, 280, 255, 290, 310, 295, 330, 320, 360, 380, 410];
  const leads = [4, 6, 5, 7, 9, 11, 9, 12, 14, 12, 16, 17, 15, 19, 20, 18, 21, 23, 22, 25, 27, 24, 28, 30, 28, 32, 30, 34, 36, 38];
  const maxV = 420, maxL = 40;
  const stepX = w / (views.length - 1);
  const linePath = (arr: number[], max: number) => arr.map((v: number, i: number) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${h - (v / max) * h}`).join(' ');

  return (
    <svg className="chart-svg" viewBox={`0 0 ${w} ${h + 30}`} preserveAspectRatio="none" style={{ width: '100%' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
        <line key={i} x1="0" y1={h * g} x2={w} y2={h * g} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <path d={linePath(views, maxV) + ` L ${w} ${h} L 0 ${h} Z`} fill="url(#goldGrad)" opacity="0.18" />
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B8922A" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#B8922A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={linePath(views, maxV)} fill="none" stroke="#B8922A" strokeWidth="1.6" />
      <path d={linePath(leads, maxL)} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeDasharray="4 4" />
      <circle cx={(views.length - 1) * stepX} cy={h - (views[views.length - 1] / maxV) * h} r="4" fill="#B8922A" />
      <circle cx={(leads.length - 1) * stepX} cy={h - (leads[leads.length - 1] / maxL) * h} r="3" fill="white" />
      {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Hoy'].map((l, i) => (
        <text key={i} x={(i / 4) * w} y={h + 22} fill="#666" fontSize="10" fontFamily="monospace" textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>{l}</text>
      ))}
    </svg>
  );
}
