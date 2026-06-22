import React from 'react';

interface BadgeProps {
  type: 'HOT' | 'NEW' | 'settlement' | 'capture' | 'finished' | 'pending';
}

export default function Badge({ type }: BadgeProps) {
  const styles = {
    HOT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    NEW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    settlement: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    capture: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    finished: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border uppercase transition-colors ${styles[type]}`}>
      {type}
    </span>
  );
}