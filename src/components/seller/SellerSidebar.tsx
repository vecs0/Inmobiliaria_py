'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  LogOut,
  PlusCircle,
  BarChart2,
  Zap,
  KeyRound
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useLeadRealtime } from '@/hooks/use-lead-realtime';

const menuItems = [
  { icon: LayoutDashboard, label: 'Panel Control', href: '/vendedor' },
  { icon: Building2, label: 'Mis Propiedades', href: '/vendedor/propiedades' },
  { icon: Users, label: 'Leads / Consultas', href: '/vendedor/leads' },
  { icon: BarChart2, label: 'Analitica', href: '/vendedor/analytics' },
  { icon: Zap, label: 'Destacados', href: '/vendedor/destacados' },
  { icon: KeyRound, label: 'API Keys', href: '/vendedor/api-keys' },
  { icon: CreditCard, label: 'Suscripcion', href: '/vendedor/suscripcion' },
  { icon: Settings, label: 'Configuracion', href: '/vendedor/configuracion' },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const { unreadCount } = useLeadRealtime();

  return (
    <div className="w-64 bg-[#1a2e4a] text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-2 border-b border-white/10">
        <div className="w-8 h-8 rounded-[6px] flex items-center justify-center bg-[#B8922A]">
          <span className="text-white font-bold text-xs font-serif">IP</span>
        </div>
        <span className="font-serif text-lg font-bold">
          Inmobiliaria<span className="text-[#B8922A]">PY</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/vendedor/publicar"
          className="flex items-center gap-2 w-full bg-[#B8922A] hover:bg-[#a17f25] text-white px-4 py-3 rounded-lg font-medium transition-colors mb-6 shadow-lg shadow-[#B8922A]/20"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Nueva Propiedad</span>
        </Link>

        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const isLeadsLink = item.href === '/vendedor/leads';

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-[#B8922A]" : "group-hover:text-[#B8922A]"
              )} />
              <div className="flex items-center gap-2 flex-1">
                <span className="font-medium text-sm">{item.label}</span>
                {isLeadsLink && unreadCount !== null && unreadCount > 0 && (
                  <Badge
                    className="bg-[#B8922A] text-white px-1.5 py-0 h-5 min-w-[20px] text-[10px] rounded-full"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-colors"
          onClick={() => {}}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Cerrar Sesion</span>
        </button>
      </div>
    </div>
  );
}
