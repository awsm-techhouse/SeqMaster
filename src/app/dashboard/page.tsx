'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { PageContainer, Button, Badge } from '@/components/ui/LayoutPrimitives';
import { supabase } from '@/lib/supabase';
import { Terminal, Download, CreditCard, RefreshCw } from 'lucide-react';

export default function UserDashboard() {
  const [userSession, setUserSession] = useState<any>(null);
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  const [customServices, setCustomServices] = useState<any[]>([]);
  const [downloadTargetId, setDownloadTargetId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSecureProfileData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/auth';
        return;
      }
      setUserSession(session.user);

      // Ambil transaksi retail produk digital lunas dari tabel orders
      const { data: retailData } = await supabase
        .from('orders')
        .select('*, products(title)')
        .eq('customer_email', session.user.email)
        .eq('status', 'settlement');
      if (retailData) setPurchasedItems(retailData);

      // Ambil seluruh pengajuan proyek dari tabel jasa_orders
      const { data: serviceData } = await supabase
        .from('jasa_orders')
        .select('*')
        .eq('customer_email', session.user.email);
      if (serviceData) setCustomServices(serviceData);
    }
    loadSecureProfileData();
  }, []);

  const triggerSecurePresignedDownload = async (orderId: string) => {
    setDownloadTargetId(orderId);
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const resJson = await res.json();
      if (resJson.downloadUrl) {
        window.location.href = resJson.downloadUrl; // Streaming direct binary zip secure link R2
      } else {
        alert(resJson.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadTargetId(null);
    }
  };

  const executeServiceMidtransPayment = (jobId: string, token: string) => {
    // @ts-ignore
    window.snap.pay(token, {
      onSuccess: () => { window.location.reload(); }
    });
  };

  return (
    <PageContainer className="space-y-10">
      <header className="border-b border-zinc-900 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase text-zinc-100 flex items-center gap-2">
            <Terminal size={16} className="text-emerald-400" /> Secure Storage Terminal
          </h1>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5 select-all">{userSession?.email}</p>
        </div>
        <Button variant="secondary" onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')} className="!w-24 !py-1.5">Logout</Button>
      </header>

      {/* RETAIL SEQUENCER MATRIX LIBRARY */}
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xs font-black tracking-tight uppercase text-zinc-300 mb-4">Acquired Binary Patches</h2>
        {purchasedItems.length === 0 ? (
          <p className="text-xs text-zinc-600 font-mono py-2">Belum ada modul sekuenser retail berstatus lunas.</p>
        ) : (
          <div className="space-y-3">
            {purchasedItems.map((item) => (
              <div key={item.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 uppercase">{item.products?.title || 'Sequencer Core Pack'}</h4>
                  <span className="font-mono text-[9px] text-zinc-500 select-all block mt-0.5">HASH: {item.id}</span>
                </div>
                <div className="w-full sm:w-44 flex items-center justify-between sm:justify-end gap-3">
                  <Badge type="settlement" />
                  <Button variant="secondary" onClick={() => triggerSecurePresignedDownload(item.id)} disabled={downloadTargetId === item.id} className="!py-2 text-[10px]">
                    {downloadTargetId === item.id ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />} Fetch Pack
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CUSTOM SERVICE PROJECT TRACKER */}
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xs font-black tracking-tight uppercase text-zinc-300 mb-4">Engineering Orders Matrix</h2>
        {customServices.length === 0 ? (
          <p className="text-xs text-zinc-600 font-mono py-2">Tidak ada pesanan brief produksi kustom terdaftar.</p>
        ) : (
          <div className="space-y-4">
            {customServices.map((job) => (
              <div key={job.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black uppercase text-zinc-200 font-sans">{job.project_title}</h4>
                    <span className="text-[10px] text-zinc-500 uppercase">Kategori: {job.category}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-zinc-400">Project:</span><Badge type={job.status} />
                    <span className="text-[10px] text-zinc-400">Payment:</span><Badge type={job.payment_status} />
                  </div>
                </div>

                {/* Info Catatan Tambahan/Harga Admin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-900 pt-3 text-[11px]">
                  <div>
                    <span className="text-zinc-600 block text-[9px] uppercase">Admin Adjustment Invoices</span>
                    <span className="font-mono text-emerald-400 font-bold">IDR {Number(job.price).toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[9px] uppercase">Production Ledger Notes</span>
                    <span className="text-zinc-400 font-sans">{job.admin_notes || 'Menunggu verifikasi rincian harga manual oleh tim admin.'}</span>
                  </div>
                </div>

                {/* Munculkan Tombol Pembayaran Jika Admin Sudah Mengisi Invoice Token */}
                {job.payment_token && job.payment_status === 'pending' && (
                  <div className="pt-2 flex justify-end">
                    <div className="w-full sm:w-48">
                      <Button variant="primary" onClick={() => executeServiceMidtransPayment(job.id, job.payment_token)} className="!py-2 text-[10px]">
                        <CreditCard size={12} /> Selesaikan Pembayaran
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}