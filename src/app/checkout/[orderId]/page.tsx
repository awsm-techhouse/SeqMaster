import React from 'react';
import { PageContainer, Badge } from '@/components/ui/LayoutPrimitives';
import RefreshButton from '@/features/dashboard/components/RefreshButton';
import { ShieldCheck, MailWarning, ArrowRight, CheckCircle2 } from 'lucide-react';
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
}

export default async function CheckoutStatusPage({ params }: PageProps) {
  const resolvedParams = await params;
  const orderDetails = await getOrderRecordState(resolvedParams.orderId);

  const isPaymentSuccess = orderDetails?.status === 'settlement' || orderDetails?.status === 'capture';
  const isActivationRequired = orderDetails?.requires_activation === true;

  return (
    <PageContainer className="flex items-center justify-center min-h-[85vh]">
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-8 max-w-md w-full shadow-2xl relative text-center">
        
        {/* KONDISI 1: JIKA SUKSES DAN WAJIB AKTIVASI AKUN (PENGGUNA BARU) */}
        {isPaymentSuccess && isActivationRequired ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="mx-auto w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
              <MailWarning className="text-amber-400" size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase text-zinc-100">
              Buka Email Aktivasi Anda
            </h1>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Pembayaran Anda sebesar <span className="text-emerald-400 font-mono font-bold">IDR {Number(orderDetails?.total_amount).toLocaleString('id-ID')}</span> telah berhasil kami terima.
            </p>
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 text-left space-y-2 text-[11px] font-sans leading-relaxed text-zinc-300">
              <p className="font-mono text-zinc-500 text-[10px] uppercase tracking-wider border-b border-zinc-900 pb-1.5">Sistem Keamanan Akun</p>
              <p>• Tautan konfirmasi pembuatan akun otomatis telah dikirimkan ke alamat <span className="text-zinc-100 font-semibold underline">{orderDetails?.customer_email}</span>.</p>
              <p>• Harap buka kotak masuk atau folder spam email Anda, lalu klik tautan aktivasi di dalamnya untuk mengaktifkan akun node Anda.</p>
              <p>• Setelah akun aktif, Anda dapat masuk ke Dashboard untuk mengklaim unduhan master berkas ZIP sekuenser Anda.</p>
            </div>
          </div>
        ) : isPaymentSuccess ? (
          /* KONDISI 2: JIKA PEMBAYARAN SUKSES DAN EMAIL SUDAH TERDAFTAR (AMAN) */
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
              <CheckCircle2 className="text-emerald-400" size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase text-zinc-100">
              Pembayaran Berhasil!
            </h1>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Identitas email Anda terverifikasi aman di dalam sistem. Akses unduhan paket modul sekuenser digital <span className="text-zinc-200 font-bold uppercase">{orderDetails?.products?.title}</span> telah diaktifkan penuh.
            </p>
          </div>
        ) : (
          /* KONDISI 3: MENUNGGU PEMBAYARAN / PROSES VERIFIKASI */
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-800/40 flex items-center justify-center mb-4 border border-zinc-800">
              <ShieldCheck className="text-zinc-500" size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase text-zinc-300">
              Menunggu Sinkronisasi...
            </h1>
            <p className="text-zinc-500 text-xs font-sans">
              Menunggu klaring jaringan pembayaran Midtrans gateway selesai diproses.
            </p>
          </div>
        )}

        {/* RINGKASAN METADATA TRANSAKSI */}
        <div className="my-6 p-4 bg-zinc-950 border border-zinc-900 rounded-xl text-left font-mono text-[11px] space-y-2.5 select-all">
          <div className="flex justify-between"><span className="text-zinc-600">ORDER HASH</span><span className="text-zinc-400">{resolvedParams.orderId}</span></div>
          <div className="flex justify-between items-center"><span className="text-zinc-600">LEDGER STATE</span><Badge type={orderDetails?.status || 'pending'} /></div>
        </div>

        {/* NAVIGASI KONTROL FOOTER */}
        <div className="flex gap-3 items-center pt-2">
          <RefreshButton />
          <a href="/dashboard" className="w-full inline-flex items-center justify-center gap-2 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition active:scale-[0.98]">
            Ke Dashboard <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </PageContainer>
  );
}