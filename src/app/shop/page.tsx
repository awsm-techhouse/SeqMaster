import React from 'react';
import { PageContainer } from '@/components/ui/LayoutPrimitives';
import ShopCatalogContainer from '@/features/shop/components/ShopCatalogContainer';
import { supabase } from '@/lib/supabase';
import { Sliders } from 'lucide-react';

// Konfigurasi Incremental Static Regeneration (ISR) Next.js
export const revalidate = 10; 

async function getAllActiveProducts() {
  // PERBAIKAN: Menyisipkan 'discount_percent' ke dalam baris seleksi data Supabase
  const { data, error } = await supabase
    .from('products')
    .select('id, title, artist_name, bpm, genre, price, discount_percent, preview_url')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching data from products ledger:', error);
    return [];
  }
  return data || [];
}

export default async function ShopCatalogPage() {
  const initialProducts = await getAllActiveProducts();

  return (
    <PageContainer>
      {/* HEADER UTAMA TOKO DENGAN ESTETIKA REKONSILIASI RETAIL KEMEWAHAN */}
      <header className="mb-10 border-b border-zinc-900 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-100 flex items-center gap-2 select-none">
            <Sliders size={20} className="text-emerald-500" /> Sequencer Store Catalog
          </h1>
          <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">
            High-Density Architectural Patches & Sequences
          </p>
        </div>
      </header>

      {/* Menyalurkan payload dari server langsung ke kontainer interaktif client-side dengan tipe data yang sinkron */}
      <ShopCatalogContainer items={initialProducts} />
    </PageContainer>
  );
}