'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/LayoutPrimitives';
import CheckoutModal from '@/features/shop/components/CheckoutModal';
import { useAudioSystem } from '@/context/AudioPlayerContext';
import { supabase } from '@/lib/supabase';
import { Music, Play, Pause, CreditCard, Cpu, Activity, Disc } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  artist_name: string;
  bpm: number;
  genre: string | string[]; // PERBAIKAN TIPE DATA: Menerima string tunggal atau array string dari Supabase
  price: number;
  discount_percent: number;
  preview_url: string;
}

export default function ProductDetailContainer({ product }: { product: Product }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isOwned, setIsOwned] = useState(false);
  const { activeTrackId, isPlaying, triggerPlayback } = useAudioSystem();
  
  const currentIsPlaying = activeTrackId === product.id && isPlaying;
  const hasDiscount = product.discount_percent > 0;
  
  const finalPrice = hasDiscount 
    ? product.price * (1 - product.discount_percent / 100) 
    : product.price;

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (!session?.user?.email) return;

        const { data: ownedOrders, error } = await supabase
          .from('orders')
          .select('id')
          .eq('product_id', product.id)
          .eq('customer_email', session.user.email)
          .eq('status', 'settlement')
          .limit(1);

        if (error) {
          console.error('Failed to check product ownership:', error);
          return;
        }

        setIsOwned(Array.isArray(ownedOrders) && ownedOrders.length > 0);
      } catch (err) {
        console.error('Ownership check failed:', err);
      }
    };

    checkOwnership();
  }, [product.id]);

  const resolveAudioPlaybackUrl = () => {
    if (!product.preview_url) return '#';
    if (product.preview_url.startsWith('http') && !product.preview_url.includes('pub-')) {
      return product.preview_url;
    }
    const extractionKey = product.preview_url.includes('public/previews/')
      ? 'public/previews/' + product.preview_url.split('public/previews/').pop()
      : product.preview_url;
      
    return `/api/audio/preview?key=${encodeURIComponent(extractionKey)}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative">
      
      {/* SISI KIRI: AUDIO AUDITION DECK FRAME (35% VIEWPORT) */}
      <div className="lg:col-span-4 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group min-h-[300px]">
        <div className="absolute top-[-20%] left-[-20%] w-72 h-72 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex justify-between items-start z-10 select-none">
          <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-900 text-emerald-400">
            <Music size={20} />
          </div>
          {hasDiscount ? (
            <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              Save {product.discount_percent}%
            </span>
          ) : (
            <Badge type="NEW" />
          )}
        </div>

        {/* Lingkaran Piringan Hitam Studio Interaktif */}
        <div className="my-auto py-6 flex justify-center items-center relative z-10">
          <Disc 
            size={120} 
            className={`text-zinc-800/40 transition-transform duration-[4000ms] ease-linear ${currentIsPlaying ? 'animate-spin' : ''}`} 
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => triggerPlayback(product.id, resolveAudioPlaybackUrl())}
              className="w-14 h-14 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-xl hover:bg-zinc-200 hover:scale-105 active:scale-95 transition z-20"
            >
              {currentIsPlaying ? <Pause size={18} className="text-rose-600 fill-rose-600" /> : <Play size={18} className="text-zinc-950 fill-zinc-950 ml-0.5" />}
            </button>
          </div>
        </div>

        <p className="text-[10px] font-mono text-zinc-500 text-center uppercase tracking-widest select-none z-10">
          {currentIsPlaying ? 'Playing Preview' : 'Play Preview'}
        </p>
      </div>

      {/* SISI KANAN: SPESIFIKASI BLUEPRINT & VALUE INVOICES (65% VIEWPORT) */}
      <div className="lg:col-span-8 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative">
        <div className="space-y-6">
          <header className="space-y-1">
            <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-zinc-500 select-none">
              <Cpu size={12} className="text-emerald-400" />ID // <span className="text-zinc-400 select-all">{product.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-zinc-100">
              {product.title}
            </h1>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wide">
              Engineered By // <span className="text-zinc-300 font-bold">{product.artist_name}</span>
            </p>
          </header>

          {/* GRID MANIFES SPESIFIKASI MONOSPACED */}
          <div className="grid grid-cols-2 gap-4 border-y border-zinc-900/80 py-6 text-xs font-mono select-none">
            <div className="space-y-1 p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl">
              <span className="text-zinc-600 text-[10px] uppercase tracking-wider block">Tempo</span>
              <span className="text-zinc-200 font-bold text-sm flex items-center gap-1.5">
                <Activity size={12} className="text-emerald-500" /> {product.bpm} BPM
              </span>
            </div>
            <div className="space-y-1 p-4 bg-zinc-950/40 border border-zinc-800/10 rounded-xl">
              <span className="text-zinc-600 text-[10px] uppercase tracking-wider block">Genre</span>
              <span className="text-emerald-400 font-bold text-xs uppercase block truncate pt-0.5" title={Array.isArray(product.genre) ? product.genre.join(', ') : product.genre}>
                {/* FIX UTAMA: Melakukan join array string secara eksplisit dengan pemisah koma dan spasi */}
                {Array.isArray(product.genre) ? product.genre.join(', ') : product.genre}
              </span>
            </div>
          </div>
        </div>

        {/* BARIS TATA LETAK HARGA & PEMUTUS AKSI CHECKOUT */}
        <div className="mt-8 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-0.5 select-none">
            <span className="text-[10px] text-zinc-500 font-mono block uppercase tracking-widest">Price</span>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="font-mono text-emerald-400 font-bold text-xl">
                IDR {Math.round(finalPrice).toLocaleString('id-ID')}
              </span>
              {hasDiscount && (
                <span className="font-mono text-zinc-600 line-through text-xs">
                  IDR {Number(product.price).toLocaleString('id-ID')}
                </span>
              )}
            </div>
          </div>

          <div className="sm:w-56">
            {isOwned ? (
              <button
                type="button"
                disabled
                className="w-full bg-zinc-800 text-zinc-500 cursor-not-allowed font-black py-4 rounded-xl text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-inner"
              >
                <CreditCard size={14} /> Already Owned
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-black py-4 rounded-xl text-xs uppercase tracking-widest transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-black/40 select-none"
              >
                <CreditCard size={14} /> Beli sekarang
              </button>
            )}
          </div>
        </div>

      </div>

      {/* RENDER MODAL CHECKOUT TERISOLASI LAYAR PENUH */}
      {modalOpen && (
        <CheckoutModal 
          product={{ ...product, price: finalPrice }} 
          onClose={() => setModalOpen(false)} 
        />
      )}
    </div>
  );
}