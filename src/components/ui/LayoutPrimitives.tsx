'use client';

import React from 'react';

export function PageContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen bg-zinc-950 text-zinc-50 ${className}`}>
      {children}
    </main>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}
export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyle = 'w-full font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition active:scale-[0.98] flex items-center justify-center gap-2 select-none disabled:opacity-40 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200 shadow-xl shadow-black/40',
    secondary: 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-zinc-800/60',
    ghost: 'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Badge({ type }: { type: 'HOT' | 'NEW' | 'settlement' | 'capture' | 'finished' | 'pending' | 'failed' }) {
  const styles = {
    HOT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    NEW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    settlement: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    capture: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    finished: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    failed: 'bg-zinc-800 text-zinc-500 border-zinc-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border uppercase ${styles[type]}`}>
      {type}
    </span>
  );
}