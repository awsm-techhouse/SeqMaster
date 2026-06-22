import React from 'react';
import { PageContainer, Badge } from '@/components/ui/LayoutPrimitives';
import RefreshButton from '@/features/dashboard/components/RefreshButton';
import PayTriggerButton from '@/features/shop/components/PayTriggerButton';
import { supabase } from '@/lib/supabase';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, BUCKET_NAME } from '@/lib/r2';
import { ShieldCheck, ArrowRight, CheckCircle2, FileX, Download, Disc, UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getOrderRecordState(orderId: string) {
  const { data } = await supabase
    .from('orders')
    .select('*, products(*)')
    .eq('id', orderId)
    .single();
  return data;
}

async function checkLiveMidtransStatus(orderId: string): Promise<string> {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const base64Auth = Buffer.from(`${serverKey}:`).toString('base64');
    
    const response = await fetch(`https://api.sandbox.midtrans.com/v2/${orderId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${base64Auth}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) return 'pending';
    const midtransData = await response.json();
    return midtransData.transaction_status || 'pending';
  } catch (err) {
    return 'pending';
  }
}

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function CheckoutStatusPage({ params }: PageProps) {
  const resolvedParams = await params;
  let orderDetails = await getOrderRecordState(resolvedParams.orderId);

  if (!orderDetails) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[80vh]">
        <p className="text-xs font-mono text-rose-400 uppercase">404 // Transaksi Tidak Ditemukan</p>
      </PageContainer>
    );
  }

  let currentStatus = orderDetails.status;
  if (currentStatus === 'pending') {
    const liveStatus = await checkLiveMidtransStatus(resolvedParams.orderId);
    if (liveStatus === 'settlement' || liveStatus === 'capture') {
      currentStatus = 'settlement';
      await supabase.from('orders').update({ status: 'settlement' }).eq('id', resolvedParams.orderId);
    } else if (['expire', 'cancel', 'deny'].includes(liveStatus)) {
      currentStatus = 'failed';
      await supabase.from('orders').update({ status: 'failed' }).eq('id', resolvedParams.orderId);
    }
  }

  const isPaymentSuccess = currentStatus === 'settlement' || currentStatus === 'capture';
  const isPaymentFailed = currentStatus === 'failed';
  const isActivationRequired = orderDetails.requires_activation === true;

  // GENERATOR LINK DOWNLOAD UTUH CLOUDFLARE R2 (100% AMAN & SAKLEK TYPE-SAFE)
  let secureDownloadUrl = '#';
  if (isPaymentSuccess && orderDetails.products?.master_file_key) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: orderDetails.products.master_file_key,
      });
      secureDownloadUrl = await getSignedUrl(r2Client, command, { expiresIn: 172800 });
    } catch (err) {
      console.error("Presigned download generator error:", err);
    }
  }

  return (
    <PageContainer className="flex items-center justify-center min-h-[85vh]">
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative text-center">
        
        {/* KONDISI A: KEDALUWARSA */}
        {isPaymentFailed ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
              <FileX className="text-rose-400" size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase text-rose-400">Tautan Kedaluwarsa</h1>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Batas waktu pembayaran untuk item <span className="text-zinc-100 font-bold">{orderDetails.products?.title}</span> telah habis.
            </p>
          </div>
        ) : isPaymentSuccess ? (
          /* KONDISI B: PEMBAYARAN BERHASIL LUNAS */
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2 border border-emerald-500/20">
              <CheckCircle2 className="text-emerald-400" size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase text-zinc-100">Pembayaran Berhasil!</h1>
            
            <p className="text-zinc-400 text-xs px-2">
              Akses paket sekuenser <span className="text-zinc-100 font-bold uppercase">{orderDetails.products?.title}</span> Anda telah dibuka penuh. Silakan klaim berkas master Anda di bawah ini:
            </p>

            {/* TOMBOL UNDUH UTAMA CLOUDFLARE R2 */}
            <div className="pt-1">
              <a 
                href={secureDownloadUrl} 
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-black py-4 rounded-xl text-xs uppercase tracking-widest transition active:scale-[0.98] shadow-lg shadow-emerald-500/10"
              >
                <Download size={14} /> Unduh Berkas Master (.ZIP)
              </a>
            </div>

            {/* BARU: JIKA EMAIL BELUM TERDAFTAR, TAMPILKAN SEKSI DAFTAR SEKARANG */}
            {isActivationRequired && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-left space-y-4 animate-in zoom-in-95 duration-200 mt-4">
                <div className="space-y-1">
                  <h4 className="text-zinc-200 font-black uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <UserPlus size={13} className="text-emerald-400" /> Amankan Akun Repositori Anda
                  </h4>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Email <span className="text-zinc-300 font-mono font-bold">{orderDetails.customer_email}</span> belum terdaftar di sistem. Silakan buat akun sekarang agar seluruh modul yang Anda beli tersimpan rapi di Dashboard.
                  </p>
                </div>
                
                <a 
                  href={`/auth?email=${encodeURIComponent(orderDetails.customer_email)}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition active:scale-[0.98]"
                >
                  Daftar Sekarang <ArrowRight size={12} />
                </a>
              </div>
            )}
          </div>
        ) : (
          /* KONDISI C: MENUNGGU PEMBAYARAN */
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center mb-4 border border-zinc-900">
              <Disc className="text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase text-zinc-300">Invoice Gateway Node</h1>
            <p className="text-zinc-400 text-xs">
              Sesi transaksi terkunci aman. Silakan klik tombol di bawah untuk melunasi item <span className="text-zinc-200 font-black uppercase">{orderDetails.products?.title}</span>.
            </p>
            
            <div className="pt-2">
              <PayTriggerButton 
                snapToken={orderDetails.payment_token || ''} 
                orderId={resolvedParams.orderId} 
              />
            </div>
          </div>
        )}

        {/* METADATA STRUKTUR INVOICE */}
        <div className="my-6 p-4 bg-zinc-950 border border-zinc-900 rounded-xl text-left font-mono text-[11px] space-y-2.5 select-none">
          <div className="flex justify-between"><span className="text-zinc-600">ORDER HASH</span><span className="text-zinc-400 select-all">{resolvedParams.orderId}</span></div>
          <div className="flex justify-between items-center"><span className="text-zinc-600">LEDGER STATE</span><Badge type={currentStatus || 'pending'} /></div>
          <div className="flex justify-between"><span className="text-zinc-600">TOTAL VALUE</span><span className="text-emerald-400 font-bold">IDR {Number(orderDetails.total_amount).toLocaleString('id-ID')}</span></div>
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