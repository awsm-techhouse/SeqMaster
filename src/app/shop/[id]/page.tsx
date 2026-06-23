import React from 'react';
import { PageContainer } from '@/components/ui/LayoutPrimitives';
import { supabase } from '@/lib/supabase';
import ProductDetailContainer from '@/features/shop/components/ProductDetailContainer';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic'; // Melewati caching agar pembacaan diskon selalu real-time

async function getSingleSequencerData(id: string) {
  // Attempt to enforce `is_active` filter; if the column is missing, fall back
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, artist_name, bpm, genre, price, discount_percent, preview_url')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.warn('is_active filter failed for product detail, falling back:', err.message || err);
    const { data, error } = await supabase
      .from('products')
      .select('id, title, artist_name, bpm, genre, price, discount_percent, preview_url')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failure tracking deep link record identifier (unfiltered):', error);
      return null;
    }
    return data;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SequencerDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const product = await getSingleSequencerData(resolvedParams.id);

  if (!product) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-4">
          <p className="text-xs font-mono uppercase text-rose-400">404 // Node Matrix Not Found</p>
          <a href="/shop" className="text-xs uppercase underline tracking-wider text-zinc-400 hover:text-zinc-100">
            Kembali ke Katalog Toko
          </a>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      {/* Tombol Navigasi Mundur Minimalis */}
      <div className="mb-2 select-none">
        <a 
          href="/shop" 
          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={12} /> Kembali ke Repositori
        </a>
      </div>

      {/* Kontainer Utama Client-Side untuk Eksekusi Pemutar Audio & Checkout */}
      <ProductDetailContainer product={product} />
    </PageContainer>
  );
}