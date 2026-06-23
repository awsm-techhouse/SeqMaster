'use client';

import React from 'react';
import { Play, Pause, Eye, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/LayoutPrimitives';
import { useAudioSystem } from '@/context/AudioPlayerContext';

interface ProductCardButtonProps {
  product: {
    id: string | number;
    preview_url?: string | null;
    [key: string]: unknown; // Allow other properties to be passed through
  };
  owned?: boolean;
}

export default function ProductCardButton({ product, owned = false }: ProductCardButtonProps) {
  const { activeTrackId, isPlaying, triggerPlayback } = useAudioSystem();
  const currentIsPlaying = activeTrackId === String(product.id) && isPlaying;

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
        onClick={() => triggerPlayback(String(product.id), resolveAudioPlaybackUrl())} 
        className="!py-2 border-zinc-800/80 hover:border-zinc-700"
      >
        {currentIsPlaying ? <Pause size={14} className="text-rose-400" /> : <Play size={14} className="text-emerald-400" />}
        <span className="text-[10px] tracking-wider">{currentIsPlaying ? 'Stop Preview' : 'Play Preview'}</span>
      </Button>

      {owned ? (
        <a href={`/shop/${product.id}`} className="block w-full">
          <Button variant="secondary" className="!py-2.5 text-[10px] tracking-wider opacity-90 cursor-pointer">
            <CreditCard size={14} className="inline mr-1" /> Owned
          </Button>
        </a>
      ) : (
        <a href={`/shop/${product.id}`} className="block w-full">
          <Button variant="primary" className="!py-2.5 text-[10px] tracking-wider">
            <Eye size={14} /> View Module
          </Button>
        </a>
      )}
    </div>
  );
}