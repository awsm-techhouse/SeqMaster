'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export default function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyle = 'w-full font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition active:scale-[0.98] flex items-center justify-center gap-2 select-none disabled:opacity-40 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200 shadow-lg shadow-zinc-950/20',
    secondary: 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-zinc-800/80',
    ghost: 'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}