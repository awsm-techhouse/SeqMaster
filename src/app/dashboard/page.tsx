'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { PageContainer, Button, Badge } from '@/components/ui/LayoutPrimitives';
import { supabase } from '@/lib/supabase';
import { Terminal, Download, CreditCard, Layers, LogOut, Settings, KeyRound, X } from 'lucide-react';

// Perluasan deklarasi tipe data global Window agar TypeScript meloloskan objek Midtrans Snap
declare global {
  interface Window {
    snap?: any;
  }
}

export default function UserDashboard() {
  const [userSession, setUserSession] = useState<any>(null);
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  const [customServices, setCustomServices] = useState<any[]>([]);
  const [activeInvoices, setActiveInvoices] = useState<any[]>([]);
  const [downloadTargetId, setDownloadTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // STATE BARU: PENGELOLA MODAL / PANEL SETTINGS VIEW
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadSecureProfileData();
    
    // Inject Script Midtrans Snap Engine ke dokumen DOM
    const snapScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
    
    const existingScript = document.querySelector(`script[src="${snapScriptUrl}"]`);
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = snapScriptUrl;
      script.setAttribute("data-client-key", clientKey);
      document.body.appendChild(script);
    }
  }, []);

  async function loadSecureProfileData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/auth';
      return;
    }
    setUserSession(session.user);
    const { data: retailData } = await supabase
      .from('orders')
      .select('*, products(title)')
      .eq('customer_email', session.user.email || '') // FIX: Menggunakan operator fallback string aman
      .eq('status', 'settlement');
    if (retailData) setPurchasedItems(retailData);

    // 2. Ambil pengajuan proyek dari tabel jasa_orders (Menggunakan .ilike untuk kebal kapital)
    const { data: serviceData } = await supabase
      .from('jasa_orders')
      .select('*, jasa_invoices(*)')
      .ilike('customer_email', session.user.email || '');
    if (serviceData) {
      setCustomServices(serviceData);
      
      const pendingBills: any[] = [];
      serviceData.forEach(order => {
        if (order.jasa_invoices && Array.isArray(order.jasa_invoices)) {
          order.jasa_invoices.forEach((inv: any) => {
            if (inv.status === 'pending') {
              pendingBills.push({ ...inv, project_title: order.project_title });
            }
          });
        }
      });
      setActiveInvoices(pendingBills);
    }
  }

  // PROTOKOL AKSI KELUAR AKUN (LOGOUT PROTOCOL)
  const handleSecureSignOut = async () => {
    if (!confirm('Apakah Anda yakin ingin memutuskan sesi dan keluar dari sistem?')) return;
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  // PROTOKOL AKSI RESET PASSWORD MANDIRI VIA INBOX EMAIL
  const handleTriggerResetPassword = async () => {
    if (!userSession?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userSession.email, {
        redirectTo: `${window.location.origin}/auth/reset-callback`,
      });
      if (error) throw error;
      alert(`Tautan enkripsi pembaruan kata sandi sukses dikirimkan menuju: ${userSession.email}. Periksa folder kotak masuk atau spam Anda.`);
      setShowSettings(false);
    } catch (err: any) {
      alert(`Gagal memicu reset password: ${err.message}`);
    }
  };

  const handleSecureVaultDownload = async (orderId: string) => {
    setDownloadTargetId(orderId);
    try {
      const response = await fetch('/api/checkout/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Akses ditolak.');
      if (result.downloadUrl) window.location.href = result.downloadUrl;
    } catch (err: any) {
      alert(`Gagal Mengunduh: ${err.message}`);
    } finally {
      setDownloadTargetId(null);
    }
  };

  const executeServiceMidtransPayment = (invoiceId: string, snapToken: string) => {
    if (!window.snap) {
      alert("Sistem pembayaran Midtrans sedang memuat node graph. Silakan tunggu sebentar.");
      return;
    }
    window.snap.pay(snapToken, {
      onSuccess: function() {
        alert("Pembayaran termin lunas terverifikasi!");
        loadSecureProfileData();
      },
      onPending: function() {
        alert("Menunggu penyelesaian transaksi kliring.");
      },
      onError: function() {
        alert("Gerbang transaksi mendeteksi kegagalan sistem.");
      },
      onClose: function() {
        alert("Sesi pop-up gerbang pembayaran ditutup.");
      }
    });
  };

  return (
    <PageContainer className="py-6 space-y-8 animate-in fade-in duration-300 relative">
      
      {/* HEADER CONTROLS BAR DASHBOARD PROFIL */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60 pb-5 text-left relative z-20">
        <div>
          <h1 className="text-lg font-black tracking-tight uppercase text-zinc-100 flex items-center gap-2">
            <Terminal className="text-emerald-400" size={16} /> My Dashboard
          </h1>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5 select-none">
            Welcome back, <span className="text-zinc-300 font-bold">{userSession?.email || 'Authenticated User'}</span>
          </p>
        </div>
        
        {/* INTERFASE TOMBOL SISI KANAN BARU (SETTINGS & LOGOUT) */}
        <div className="flex items-center gap-2">
          {/* TOMBOL PENGATURAN / SETTINGS */}
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className={`p-2.5 border rounded-xl transition flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider ${showSettings ? 'bg-zinc-100 text-zinc-950 border-zinc-100' : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
            title="Account Configuration"
          >
            <Settings size={12} className={showSettings ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} /> Settings
          </button>
          
          {/* TOMBOL KELUAR MANDIRI MANDATORI */}
          <button 
            onClick={handleSecureSignOut} 
            className="bg-zinc-950 border border-zinc-900 hover:border-rose-950/40 text-zinc-500 hover:text-rose-400 p-2.5 rounded-xl transition flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider font-bold"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </div>

      {/* DROPDOWN SUB-PANEL SETTINGS PREMIUM BOX LAYOUT (APPLE UX STYLE) */}
      {showSettings && (
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 max-w-sm ml-auto text-left space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200 relative z-30 -mt-6">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Account Operations Node</span>
            <button onClick={() => setShowSettings(false)} className="text-zinc-600 hover:text-zinc-400 transition"><X size={12} /></button>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Memicu pengiriman instruksi pembaharuan kredensial sistem keamanan kata sandi baru menuju email utama Anda.
            </p>
            <button 
              onClick={handleTriggerResetPassword}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-bold py-2 px-3 rounded-xl text-[10px] font-mono uppercase tracking-wider transition"
            >
              <KeyRound size={11} className="text-emerald-400" /> Request Password Reset
            </button>
          </div>
        </div>
      )}

      {/* GRAP PANEL NOTIFIKASI INVOICE TERMIN AKTIF USER */}
      {activeInvoices.length > 0 && (
        <div className="space-y-3 text-left animate-in slide-in-from-top-3 duration-300">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Active Studio Invoices Pending
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeInvoices.map((inv) => (
              <div key={inv.id} className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl relative backdrop-blur-sm">
                <div>
                  <div className="flex justify-between items-center select-none">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider">Awaiting Payment</span>
                    <span className="text-[9px] font-mono text-zinc-600 uppercase">ID: {inv.id}</span>
                  </div>
                  <h4 className="text-sm font-black text-zinc-100 uppercase mt-2.5 truncate">{inv.project_title || 'Custom Audio Production'}</h4>
                  <p className="text-zinc-400 text-xs font-bold uppercase mt-1">Termin: {inv.description}</p>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-zinc-900/60">
                  <div>
                    <span className="block text-[9px] text-zinc-500 font-mono uppercase tracking-wider select-none">Amount Due</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">IDR {Number(inv.amount).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-40">
                    <Button variant="primary" onClick={() => executeServiceMidtransPayment(inv.id, inv.payment_token)} className="!py-2.5 text-[10px] w-full font-black uppercase tracking-wider">
                      <CreditCard size={11} className="inline mr-1" /> Pay Invoice
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEKSI A: REPOSITORI PRODUK TOKO YANG DIBELI LUNAS */}
      <div className="space-y-4 text-left">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest select-none">Sequencer Collections</h2>
        {purchasedItems.length === 0 ? (
          <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-6 text-center">
            <p className="text-zinc-500 text-xs font-mono uppercase">Katalog unduhan kosong. Silahkan beli pada Sequencer Shop.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchasedItems.map((item) => (
              <div key={item.id} className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 flex flex-col justify-between min-h-[130px]">
                <div>
                  <h3 className="text-xs font-mono text-zinc-600 uppercase">PRODUCT NODE</h3>
                  <p className="text-sm font-black text-zinc-100 uppercase mt-1 tracking-tight truncate">{item.products?.title}</p>
                  <span className="text-[9px] font-mono text-zinc-600 block mt-0.5">ORDER: {item.id}</span>
                </div>
                <div className="pt-3 border-t border-zinc-900">
                  <Button variant="primary" onClick={() => handleSecureVaultDownload(item.id)} disabled={downloadTargetId === item.id} className="!py-2 text-[10px] font-black uppercase tracking-widest w-full">
                    <Download size={12} className="inline mr-1" /> {downloadTargetId === item.id ? 'Requesting Presigned Url...' : 'Claim File ZIP'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEKSI B: DAFTAR PANTAU RIWAYAT PROYEK JASA AUDIO KUSTOM */}
      <div className="space-y-4 text-left">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest select-none">Custom Production Requests</h2>
        {customServices.length === 0 ? (
          <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-6 text-center">
            <p className="text-zinc-500 text-xs font-mono uppercase">Tidak ada riwayat pengerjaan jasa audio aktif.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customServices.map((job) => (
              <div key={job.id} className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-zinc-500 uppercase">{job.category}</span>
                    <h3 className="text-base font-black text-zinc-100 uppercase mt-1">{job.project_title}</h3>
                    <span className="text-[9px] font-mono text-zinc-600 block">PROJECT REF ID: {job.id}</span>
                  </div>
                  <Badge type={job.status || 'pending'} />
                </div>

                {/* LOG DATA MULTI-TERMIN HISTORY UNTUK KONSUMSI USER */}
                <div className="bg-zinc-950/60 rounded-xl p-4 border border-zinc-900 text-xs space-y-2 font-mono">
                  <span className="text-zinc-600 font-bold block text-[9px] uppercase tracking-wider flex items-center gap-1"><Layers size={10} /> Milestone Billing Terms History</span>
                  {(!job.jasa_invoices || job.jasa_invoices.length === 0) ? (
                    <p className="text-zinc-600 italic text-[10px] pl-1 py-1">Belum ada histori termin tagihan yang diterbitkan admin.</p>
                  ) : (
                    <div className="divide-y divide-zinc-900">
                      {job.jasa_invoices.map((inv: any) => (
                        <div key={inv.id} className="flex justify-between items-center py-2 text-[11px]">
                          <span className="text-zinc-400 uppercase">{inv.description}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-400 font-bold">IDR {Number(inv.amount).toLocaleString('id-ID')}</span>
                            <span className={`text-[9px] font-black uppercase ${inv.status === 'settlement' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>{inv.status === 'settlement' ? 'LUNAS' : 'PENDING'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </PageContainer>
  );
}