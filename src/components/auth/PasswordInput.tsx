"use client";

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
}

export function PasswordInput({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder = '••••••••',
  id = 'password',
  name = 'password',
  autoComplete = 'new-password',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const checks = {
    minLength: value.length >= 8,
    hasUppercase: /[A-Z]/.test(value),
    hasNumber: /[0-9]/.test(value),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;

  return (
    <div className="w-full">
      <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#1a2e4a" }}>
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`
            w-full pl-11 pr-11 py-3 border rounded-lg bg-white
            text-sm font-normal text-gray-800 placeholder-gray-400
            transition-all duration-200
            focus:outline-none focus:ring-2
            ${error ? 'border-red-400 focus:ring-red-300 focus:border-red-400' : 'border-gray-200 focus:ring-[#B8922A]/20 focus:border-[#B8922A]'}
          `}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {[
            { key: 'minLength', label: '8+ caracteres' },
            { key: 'hasUppercase', label: '1 mayúscula' },
            { key: 'hasNumber', label: '1 número' },
          ].map(({ key, label: checkLabel }) => (
            <span
              key={key}
              className={`flex items-center gap-1 text-xs transition-colors ${
                checks[key as keyof typeof checks] ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {checks[key as keyof typeof checks] ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {checkLabel}
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center leading-none">!</span>
          {error}
        </p>
      )}
    </div>
  );
}
