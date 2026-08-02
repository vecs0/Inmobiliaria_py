"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Home, Building2, ShoppingBag } from 'lucide-react';
import type { AccountType } from '@/lib/store/register-store';

interface AccountTypeCardProps {
  type: AccountType;
  selected: boolean;
  onSelect: (type: AccountType) => void;
  title: string;
  description: string;
  icon: 'buyer' | 'particular' | 'empresa';
}

const iconMap = {
  buyer: Home,
  particular: ShoppingBag,
  empresa: Building2,
};

export function AccountTypeCard({
  type,
  selected,
  onSelect,
  title,
  description,
  icon,
}: AccountTypeCardProps) {
  const Icon = iconMap[icon];

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(type)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        w-full p-4 rounded-xl border-2 text-left
        transition-all duration-200 cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8922A] focus-visible:ring-offset-2
        ${selected
          ? 'border-[#B8922A] shadow-md'
          : 'border-gray-200 hover:border-gray-300 bg-white'
        }
      `}
      style={selected ? { background: '#F5EDD6' } : {}}
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={{
            backgroundColor: selected ? '#B8922A' : '#f3f4f6',
          }}
          transition={{ duration: 0.2 }}
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
        >
          <Icon
            className={`w-6 h-6 transition-colors ${
              selected ? 'text-white' : 'text-gray-500'
            }`}
          />
        </motion.div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-semibold leading-tight"
            style={{ color: '#1a2e4a' }}
          >
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">
            {description}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
