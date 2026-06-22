import React from 'react';
import { PageContainer, Badge } from '@/components/ui/LayoutPrimitives';
import RefreshButton from '@/features/dashboard/components/RefreshButton';
import PayTriggerButton from '@/features/shop/components/PayTriggerButton';
import { supabase } from '@/lib/supabase';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, BUCKET_NAME } from '@/lib/r2';
import { ShieldCheck, MailWarning, ArrowRight, CheckCircle2, FileX, Download, Disc } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Fungsi penarik data transaksi internal Supabase
async function getOrderRecordState(orderId: string) {
  const { data } = await supabase
    .from('orders')
    .select('*, products(*)')
    .eq('id', orderId)
    .single();
  return data;
}

// ENGINE DETEKSI KEDALUWARSA REAL-TIME: Panggil API Server Midtrans V2 Status
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

  // JIKA REFRESH BERJALAN & STATUS LOKAL MASIH PENDING, KROSCEK KE MIDTRANS LANGSUNG
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

  // GENERATOR LINK DOWNLOAD UTUH CLOUDFLARE R2 HANGUS 48 JAM
  let secureDownloadUrl = '#';
  if (isPaymentSuccess && orderDetails.products?.master_file_key) {
    try {
      // PERBAIKAN: Menggunakan GetObjectCommand untuk membaca biner paket unduhan, bukan PutObjectCommand
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: orderDetails.products.master_file_key,
      });
      // Mengunci link agar hangus tepat dalam 48 jam (172800 detik) demi proteksi antipembajakan
      secureDownloadUrl = await getSignedUrl(r2Client, command, { expiresIn: 172800 });
    } catch (err) {
      console.error("Presigned download generator pipeline error:", err);
    }
  }

  return (
    <PageContainer className="flex items-center justify-center min-h-[85vh]">
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative text-center">
        
        {/* KONDISI A: TRANSAKSI KEDALUWARSA / PEMBAYARAN GAGAL */}
        {isPaymentFailed ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
              <FileX className="text-rose-400" size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase text-rose-400">Tautan Kedaluwarsa</h1>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Batas waktu pembayaran invoice untuk item <span className="text-zinc-100 font-bold">{orderDetails.products?.title}</span> telah habis. Sesi link ini ditutup otomatis oleh sistem proteksi.
            </p>
          </div>
        ) : isPaymentSuccess ? (
          /* KONDISI B: PEMBAYARAN BERHASIL LUNAS */
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2 border border-emerald-500/20">
              <CheckCircle2 className="text-emerald-400" size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase text-zinc-100">Pembayaran Berhasil!</h1>
            
            <p className="text-zinc-400 text-xs font-sans">
              Terima kasih, akses paket sekuenser <span className="text-zinc-100 font-bold uppercase">{orderDetails.products?.title}</span> Anda telah dibuka. Tautan unduhan master biner juga otomatis dikirimkan ke email Anda.
            </p>

            {/* BOX INSTRUKSI AKTIVASI: TAMPIL JIKA EMAIL BELUM PERNAH TERDAFTAR */}
            {isActivationRequired && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-left space-y-2 text-[11px] font-sans leading-relaxed text-amber-200">
                <p className="font-mono text-amber-400 font-black uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <MailWarning size={12} /> Aktivasi Akun Anda Melalui Email
                </p>
                <p>• Sistem mendeteksi email <span className="text-zinc-100 font-bold underline">{orderDetails.customer_email}</span> belum teraktivasi.</p>
                <p>• Tautan kata sandi akun otomatis telah kami kirimkan ke kotak masuk Anda. Harap konfirmasi aktivasi sekarang agar repositori aset Anda tersimpan rapi.</p>
              </div>
            )}

            {/* TOMBOL UNDUH DIGITAL PRODUK LANGSUNG DARI CLOUDFLARE R2 NODE */}
            <div className="pt-2">
              <a 
                href={secureDownloadUrl} 
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-black py-4 rounded-xl text-xs uppercase tracking-widest transition active:scale-[0.98] shadow-lg shadow-emerald-500/10"
              >
                <Download size={14} /> Unduh Berkas Master (.ZIP)
              </a>
              <span className="block text-[9px] text-zinc-600 font-mono mt-1.5 uppercase tracking-wider">Tautan Enkripsi Cloudflare R2 Hangus dalam 48 Jam</span>
            </div>
          </div>
        ) : (
          /* KONDISI C: MENUNGGU PEMBAYARAN (REFRESH PERSISTENT TOMBOL TETAP ADA) */
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center mb-4 border border-zinc-900">
              <Disc className="text-emerald-400 animate-spin-slow" size={20} />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase text-zinc-300">Invoice Gateway Node</h1>
            <p className="text-zinc-400 text-xs font-sans">
              Sesi transaksi aman terkunci. Silakan klik tombol di bawah untuk melunasi item <span className="text-zinc-200 font-black uppercase">{orderDetails.products?.title}</span>.
            </p>
            
            <div className="pt-2 animate-in fade-in zoom-in-95 duration-200">
              {/* Token ditarik langsung dari database row orderDetails.payment_token */}
              <PayTriggerButton 
                snapToken={orderDetails.payment_token || ''} 
                orderId={resolvedParams.orderId} 
              />
            </div>
          </div>
        )}

        {/* METADATA STRUKTUR INVOICE */}
        <div className="my-6 p-4 bg-zinc-950 border border-zinc-900 rounded-xl text-left font-mono text-[11px] space-y-2.5">
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