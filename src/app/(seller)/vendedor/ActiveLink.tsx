'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ActiveLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function ActiveLink({ href, icon, children }: ActiveLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`dash-nav-item ${isActive ? 'active' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        fontSize: 13,
        color: isActive ? 'var(--white)' : 'var(--gray)',
        background: isActive ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
        transition: 'all 0.2s',
        borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
      }}
    >
      <span className="icon" style={{ display: 'flex', alignItems: 'center', color: isActive ? 'var(--gold)' : '#555' }}>
        {icon}
      </span>
      <span style={{ fontWeight: isActive ? 500 : 400 }}>{children}</span>
    </Link>
  );
}
