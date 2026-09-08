'use client';

import React from 'react';

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function CustomInput({ label, error, className = '', ...props }: CustomInputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-xs font-medium text-zinc-400">{label}</label>}
      <input
        className={`w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
