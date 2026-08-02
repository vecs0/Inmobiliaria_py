'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Shield, Building2, UserCheck, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function FloatingRoleButton() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    } else {
      setProfile(null);
    }
  }, [user]);

  // Don't show inside active panels or auth pages to avoid UI clutter
  const hidePaths = ['/auth', '/vendedor', '/admin'];
  if (hidePaths.some((p) => pathname?.startsWith(p))) {
    return null;
  }

  if (!profile) return null;

  const role = profile.role;
  let label = 'Mi Panel';
  let targetHref = '/vendedor';
  let IconComponent = LayoutDashboard;
  let badgeColor = 'bg-[#B8922A] text-white';

  if (role === 'admin') {
    label = 'Administrador';
    targetHref = '/admin';
    IconComponent = Shield;
    badgeColor = 'bg-[#1a2e4a] border border-[#B8922A] text-[#B8922A]';
  } else if (role === 'agent') {
    label = 'Panel Agente';
    targetHref = '/admin';
    IconComponent = UserCheck;
    badgeColor = 'bg-[#B8922A] text-white';
  } else if (role === 'seller_empresa') {
    label = 'Empresa Inmobiliaria';
    targetHref = '/vendedor';
    IconComponent = Building2;
    badgeColor = 'bg-white text-[#1a2e4a]';
  } else if (role === 'seller') {
    label = 'Vendedor';
    targetHref = '/vendedor';
    IconComponent = LayoutDashboard;
    badgeColor = 'bg-[#B8922A] text-white';
  } else {
    // Standard user comprador
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <div className="relative group">
          {/* Ambient Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#B8922A] to-[#e5bc4b] rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

          <Link href={targetHref} className="relative flex items-center gap-3 bg-[#1a2e4a] border border-[#B8922A]/40 text-white rounded-full pl-3 pr-4 py-2.5 shadow-2xl transition-all duration-300 hover:border-[#B8922A] hover:scale-105 active:scale-95">
            {/* Left circular icon container */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1a2e4a] to-[#243d63] border border-[#B8922A]/30 flex items-center justify-center text-[#B8922A] group-hover:text-white group-hover:border-[#B8922A] transition-all">
              <IconComponent size={20} className="animate-pulse" />
            </div>

            {/* Label and Badge */}
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono tracking-widest text-[#B8922A] uppercase font-bold">ROL ACTIVO</span>
              <span className="text-xs font-semibold font-body leading-none text-white/90 group-hover:text-white transition-colors">{label}</span>
            </div>

            {/* Accent Arrow */}
            <ArrowRight size={14} className="text-white/40 group-hover:text-[#B8922A] group-hover:translate-x-1 transition-all duration-300 ml-1" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
