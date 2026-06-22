'use client';

import React from 'react';
import { Play, Pause, Eye } from 'lucide-react';
import { Button } from '@/components/ui/LayoutPrimitives';
import { useAudioSystem } from '@/context/AudioPlayerContext';

interface ProductCardButtonProps {
  product: any;
  onBuyClick?: () => void; // Dibuat opsional karena fungsi dialihkan ke halaman rute dinamis internal
}

export default function ProductCardButton({ product }: ProductCardButtonProps) {
  const { activeTrackId, isPlaying, triggerPlayback } = useAudioSystem();
  const currentIsPlaying = activeTrackId === product.id && isPlaying;

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
    <div className="space-y-2 font-sans">
      {/* Tombol Pemutar Audio Preview */}
      <Button 
        variant="secondary" 
        onClick={() => triggerPlayback(product.id, resolveAudioPlaybackUrl())} 
        className="!py-2 border-zinc-800/80 hover:border-zinc-700"
      >
        {currentIsPlaying ? <Pause size={14} className="text-rose-400" /> : <Play size={14} className="text-emerald-400" />}
        <span className="text-[10px] tracking-wider">{currentIsPlaying ? 'Stop Preview' : 'Play Preview'}</span>
      </Button>

      {/* DIUBAH: Mengalihkan aksi tombol langsung untuk membuka halaman detail shareable */}
      <a href={`/shop/${product.id}`} className="block w-full">
        <Button variant="primary" className="!py-2.5 text-[10px] tracking-wider">
          <Eye size={14} /> View Module
        </Button>
      </a>
    </div>
  );
}