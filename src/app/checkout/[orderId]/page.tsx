import React from 'react';
import { PageContainer, Badge } from '@/components/ui/LayoutPrimitives';
import RefreshButton from '@/features/dashboard/components/RefreshButton';
import PayTriggerButton from '@/features/shop/components/PayTriggerButton';
import { ShieldCheck, MailWarning, ArrowRight, CheckCircle2, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getOrderRecordState(orderId: string) {
  const { data } = await supabase
    .from('orders')
    .select('*, products(title)')
    .eq('id', orderId)
    .single();
  return data;
}

interface PageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function CheckoutStatusPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedQueries = await searchParams;
  const orderDetails = await getOrderRecordState(resolvedParams.orderId);

  const isPaymentSuccess = orderDetails?.status === 'settlement' || orderDetails?.status === 'capture';
  const isActivationRequired = orderDetails?.requires_activation === true;
  const snapToken = resolvedQueries.token || orderDetails?.payment_token || '';

  return (
    <PageContainer className="flex items-center justify-center min-h-[85vh]">
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-8 max-w-md w-full shadow-2xl relative text-center">
        
        {/* KONDISI 1: PEMBAYARAN SUKSES DAN WAJIB AKTIVASI (USER BARU) */}
        {isPaymentSuccess && isActivationRequired ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="mx-auto w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
              <MailWarning className="text-amber-400" size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase text-zinc-100">Buka Email Aktivasi Anda</h1>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Pembayaran sebesar <span className="text-emerald-400 font-mono font-bold">IDR {Number(orderDetails?.total_amount).toLocaleString('id-ID')}</span> sukses diterima[cite: 382].
            </p>
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 text-left space-y-2 text-[11px] font-sans leading-relaxed text-zinc-300">
              <p className="font-mono text-zinc-500 text-[10px] uppercase tracking-wider border-b border-zinc-900 pb-1.5">Sistem Keamanan Akun</p>
              <p>• Tautan konfirmasi pembuatan akun otomatis dikirim ke <span className="text-zinc-100 font-semibold underline">{orderDetails?.customer_email}</span>.</p>
              <p>• Selesaikan proses aktivasi dari email untuk membuka kunci berkas di Dashboard[cite: 382].</p>
            </div>
          </div>
        ) : isPaymentSuccess ? (
          /* KONDISI 2: PEMBAYARAN SUKSES & EMAIL SUDAH ADA (USER LAMA) */
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
              <CheckCircle2 className="text-emerald-400" size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase text-zinc-100">Pembayaran Berhasil!</h1>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Akses modul sekuenser digital <span className="text-zinc-200 font-bold uppercase">{orderDetails?.products?.title}</span> telah diaktifkan penuh di akun Anda.
            </p>
          </div>
        ) : (
          /* KONDISI 3: TRANSAKSI MASIH PENDING (TAMPILKAN UTILLITAS TOMBOL PILIH METODE BAYAR) */
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-800/40 flex items-center justify-center mb-4 border border-zinc-800 animate-pulse">
              <Wallet className="text-emerald-400" size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase text-zinc-300">Invoice Gateway Node</h1>
            <p className="text-zinc-400 text-xs font-sans">
              Menunggu pemrosesan pembayaran untuk item <span className="text-zinc-200 font-bold">{orderDetails?.products?.title}</span>.
            </p>
            
            {snapToken && (
              <div className="pt-2 animate-in fade-in zoom-in-95 duration-200">
                {/* Menyisipkan Leaf Client Component untuk memicu pop-up Snap */}
                <PayTriggerButton snapToken={snapToken} orderId={resolvedParams.orderId} />
              </div>
            )}
          </div>
        )}

        {/* METADATA LEDGER RENDER */}
        <div className="my-6 p-4 bg-zinc-950 border border-zinc-900 rounded-xl text-left font-mono text-[11px] space-y-2.5">
          <div className="flex justify-between"><span className="text-zinc-600">ORDER HASH</span><span className="text-zinc-400 select-all">{resolvedParams.orderId}</span></div>
          <div className="flex justify-between items-center"><span className="text-zinc-600">LEDGER STATE</span><Badge type={orderDetails?.status || 'pending'} /></div>
          <div className="flex justify-between"><span className="text-zinc-600">TOTAL VALUE</span><span className="text-emerald-400 font-bold">IDR {Number(orderDetails?.total_amount).toLocaleString('id-ID')}</span></div>
        </div>

        <div className="flex gap-3 items-center pt-2">
          <RefreshButton />
          <a href="/dashboard" className="w-full inline-flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition active:scale-[0.98]">
            Ke Dashboard <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </PageContainer>
  );
}