'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sliders, Layers, Terminal, Disc, Menu, X, User } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Daftar navigasi utama e-commerce SeqMaster
  const navigationItems = [
    { name: 'Home', href: '/', icon: <Disc size={14} /> },
    { name: 'Sequencer Shop', href: '/shop', icon: <Sliders size={14} /> },
    { name: 'Audio Services', href: '/services', icon: <Layers size={14} /> },
    { name: 'Dashboard Profile', href: '/dashboard', icon: <User size={14} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-zinc-950/70 backdrop-blur-md border-b border-zinc-900/80 shadow-2xl shadow-black/20 select-none">
      {/* Pembatasan Viewport Maksimal Sesuai Standar Apple Shop Constraints */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* IDENTITAS BRAND LOGO */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center gap-2 group">
              <div className="p-1.5 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-emerald-500/30 transition-colors">
                <Disc size={16} className="text-emerald-400 animate-spin-slow" />
              </div>
              <span className="font-black tracking-tight uppercase text-zinc-100 text-sm tracking-widest font-sans">
                SeqMaster
              </span>
            </a>
          </div>

          {/* NAVIGASI DESKTOP VIEWPORT */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center gap-1 font-mono">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? 'text-emerald-400 bg-zinc-900/60 border border-zinc-800/40 font-bold'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/30'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </a>
                );
              })}
            </div>
          </div>

          {/* TRIGGER MENU MOBILE INTERAKTIF */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-zinc-400 hover:text-zinc-100 transition"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={14} /> : <Menu size={14} />}
            </button>
          </div>

        </div>
      </div>

      {/* DRAWER MENU MOBILE RESPONSIVE PANEL */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-900 bg-zinc-950/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="px-2 pt-2 pb-4 space-y-1 font-mono">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'text-emerald-400 bg-zinc-900 border border-zinc-800/50 font-bold'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}