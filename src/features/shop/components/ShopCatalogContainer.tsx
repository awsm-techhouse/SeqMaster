'use client';

import React, { useState } from 'react';
import ProductCardButton from '@/features/shop/components/ProductCardButton';
import CheckoutModal from '@/features/shop/components/CheckoutModal';
import { Badge } from '@/components/ui/LayoutPrimitives';
import { Search, Music, Tag } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  artist_name: string;
  bpm: number;
  genre: string;
  price: number;
  discount_percent: number;
  preview_url: string;
}

export default function ShopCatalogContainer({ items }: { items: Product[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mengelola produk terpilih yang akan dibeli langsung di level atas container (State Lifting)
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<Product | null>(null);

  const filteredProducts = items.filter((product) => {
    const titleMatch = product.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const artistMatch = product.artist_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Memastikan komparasi array genre aman dari error tipe data
    const genreMatch = Array.isArray(product.genre)
      ? product.genre.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
      : false;

    return titleMatch || artistMatch || genreMatch;
  });

  return (
    <div className="space-y-8">
      {/* BAR PENCARIAN DEEP INSET INLINE */}
      <div className="relative max-w-md group">
        <Search size={14} className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
        <input
          type="text"
          placeholder="Cari berdasarkan judul, nama artis, atau genre..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition placeholder-zinc-600 shadow-inner"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* HIGH-DENSITY GRID RETAIL COMPLIANCE */}
      {filteredProducts.length === 0 ? (
        <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-12 text-center">
          <p className="text-xs text-zinc-600 font-mono uppercase tracking-wider">Arsip katalog kosong.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredProducts.map((product) => {
            const hasDiscount = product.discount_percent > 0;
            const finalPrice = hasDiscount 
              ? product.price * (1 - product.discount_percent / 100) 
              : product.price;

            return (
              <article 
                key={product.id} 
                className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between group transition-all duration-300 hover:border-zinc-700/60"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900 text-emerald-400">
                      <Music size={14} />
                    </div>
                    {hasDiscount ? (
                      /* DIUBAH: Mengganti kelas warna rose menjadi warna hijau emerald studio */
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                        <Tag size={10} /> Save {product.discount_percent}%
                      </span>
                    ) : (
                      <Badge type="NEW" />
                    )}
                  </div>

                  <h3 className="font-black tracking-tight uppercase text-zinc-100 text-xs line-clamp-1 group-hover:text-emerald-400 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                    BY // {product.artist_name}
                  </p>

                  <div className="space-y-1.5 border-y border-zinc-900/80 py-2.5 my-3 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase tracking-wider text-[9px]">BPM</span>
                      <span className="font-mono text-zinc-300 font-bold">{product.bpm} BPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase tracking-wider text-[9px]">Genre</span>
                      <span className="font-mono text-zinc-400 uppercase text-[9px] truncate max-w-[100px]">
                        {Array.isArray(product.genre) ? product.genre.join(', ') : product.genre}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="mb-4 space-y-0.5">
                    <span className="text-[9px] text-zinc-600 font-mono block uppercase tracking-widest">Asset Value</span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-mono text-emerald-400 font-bold text-xs">
                        IDR {Math.round(finalPrice).toLocaleString('id-ID')}
                      </span>
                      {hasDiscount && (
                        <span className="font-mono text-zinc-600 line-through text-[10px]">
                          IDR {Number(product.price).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ProductCardButton 
                    product={{ ...product, price: finalPrice }} 
                    onBuyClick={() => setSelectedProductForCheckout({ ...product, price: finalPrice })}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal checkout diletakkan mandiri di luar perulangan grid array */}
      {selectedProductForCheckout && (
        <CheckoutModal 
          product={selectedProductForCheckout} 
          onClose={() => setSelectedProductForCheckout(null)} 
        />
      )}
    </div>
  );
}