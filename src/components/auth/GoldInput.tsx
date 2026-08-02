"use client";

import React from 'react';
import { User, Mail, Phone, Building2, Hash, Globe, CheckCircle } from 'lucide-react';

interface GoldInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label: string;
  error?: string;
  success?: boolean;
  icon?: 'email' | 'password' | 'name' | 'phone' | 'cedula' | 'company' | 'ruc' | 'website' | 'confirm';
}

const iconMap = {
  email: Mail,
  password: null,
  name: User,
  phone: Phone,
  cedula: Hash,
  company: Building2,
  ruc: Hash,
  website: Globe,
  confirm: null,
};

export function GoldInput({
  label,
  error,
  success,
  icon: iconType,
  className = '',
  ...props
}: GoldInputProps) {
  const Icon = iconType ? iconMap[iconType] : null;

  return (
    <div className="w-full">
      <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#1a2e4a" }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        )}
        <input
          className={`
            w-full px-4 py-3 border rounded-lg bg-white
            text-sm font-normal text-gray-800 placeholder-gray-400
            transition-all duration-200
            focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-red-400 focus:ring-red-300 focus:border-red-400' : success ? 'border-green-400 focus:ring-green-300 focus:border-green-400' : 'border-gray-200 focus:ring-[#B8922A]/20 focus:border-[#B8922A]'}
            ${className}
          `}
          {...props}
        />
        {success && !error && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center leading-none">!</span>
          {error}
        </p>
      )}
    </div>
  );
}
