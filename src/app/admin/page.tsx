'use client';

import React, { useState, useEffect, useTransition } from 'react';
import PageContainer from '@/components/ui/PageContainer';
import Button from '@/components/ui/Button';
import { 
  Terminal, ShieldAlert, PlusCircle, LayoutGrid, AudioLines, 
  Trash2, Edit3, UploadCloud, CheckCircle2, ExternalLink, 
  MessageSquare, Mail, RefreshCw, X, Download, DollarSign, FileText,
  LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminConsolePage() {
  // PROTOKOL OTENTIKASI SECURE TERMINAL
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'manage' | 'jasa'>('add');
  const [isPending, startTransition] = useTransition();

  // STATE KATALOG PRODUK SEQUENCER
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [bpm, setBpm] = useState('');
  const [genre, setGenre] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [previewUrl, setPreviewUrl] = useState('');
  const [masterFileKey, setMasterFileKey] = useState('');

  // STATE MANAGEMENT JASA ORDERS & INVOICE MULTI-TERMIN
  const [jasaOrders, setJasaOrders] = useState<any[]>([]);
  const [servicePrices, setServicePrices] = useState<Record<string, string>>({});
  const [serviceNotes, setServiceNotes] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // TRACKING UTILITY UPLOAD LOG
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingMaster, setUploadingMaster] = useState(false);

  // LIFECYCLE 1: VALIDASI AWAL SESI SAAT MOUNTING
  useEffect(() => {
    const authSession = localStorage.getItem('seq_admin_session');
    const authExpiry = localStorage.getItem('seq_admin_expiry');
    
    if (authSession === 'true' && authExpiry && Date.now() < Number(authExpiry)) {
      setIsAuthenticated(true);
      fetchRealTimeRecords();
    } else {
      clearAdminSession();
    }
  }, []);

  // LIFECYCLE 2: ENGINE PROTEKSI TIMEOUT BACKGROUND (CEK OTOMATIS SETIAP 10 DETIK)
  useEffect(() => {
    if (!isAuthenticated) return;

    const sessionSecurityTicker = setInterval(() => {
      const authExpiry = localStorage.getItem('seq_admin_expiry');
      
      if (!authExpiry || Date.now() >= Number(authExpiry)) {
        alert('Sesi operasional administrative Anda telah kedaluwarsa (Batas Maksimal 1 Jam). Akses terminal dikunci otomatis.');
        clearAdminSession();
      }
    }, 10000);

    return () => clearInterval(sessionSecurityTicker);
  }, [isAuthenticated]);

  const clearAdminSession = () => {
    localStorage.removeItem('seq_admin_session');
    localStorage.removeItem('seq_admin_expiry');
    setIsAuthenticated(false);
  };

  // REFAKTOR UTAMA: Otentikasi via secure server pipeline API route
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem('seq_admin_session', 'true');
        localStorage.setItem('seq_admin_expiry', String(Date.now() + 3600000)); // Token Kedaluwarsa 1 Jam
        setIsAuthenticated(true);
        fetchRealTimeRecords();
      } else {
        alert(result.error || 'Akses ditolak.');
      }
    } catch (err: any) {
      alert(`Authentication gateway communication failure: ${err.message}`);
    }
  };

  const fetchRealTimeRecords = async () => {
    const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (prodData) setProducts(prodData);

    const { data: serviceData } = await supabase
      .from('jasa_orders')
      .select('*, jasa_invoices(*)')
      .order('created_at', { ascending: false });
    if (serviceData) {
      setJasaOrders(serviceData);
      
      const initialPrices: Record<string, string> = {};
      const initialNotes: Record<string, string> = {};
      serviceData.forEach(order => {
        initialPrices[order.id] = order.price ? Number(order.price).toLocaleString('id-ID') : '';
        initialNotes[order.id] = order.payment_notes || '';
      });
      setServicePrices(initialPrices);
      setServiceNotes(initialNotes);
    }
  };

  const formatInputToRupiah = (value: string) => {
    const cleanNumber = value.replace(/[^0-9]/g, '');
    return cleanNumber ? Number(cleanNumber).toLocaleString('id-ID') : '';
  };

  const handleUpdateServiceInvoice = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const rawPrice = servicePrices[orderId] ? Number(servicePrices[orderId].replace(/[^0-9]/g, '')) : 0;
      const response = await fetch('/api/admin/services/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          price: rawPrice,
          payment_notes: serviceNotes[orderId] || ''
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal memperbarui invoice jasa.');

      alert('Harga penawaran & Catatan Invoice Jasa Sukses Di-update!');
      fetchRealTimeRecords();
    } catch (err: any) {
      alert(`Gagal Menerapkan Update Finansial: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBinaryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'preview' | 'master') => {
    const targetFile = e.target.files?.[0];
    if (!targetFile) return;

    if (type === 'preview') setUploadingPreview(true);
    if (type === 'master') setUploadingMaster(true);

    try {
      const formData = new FormData();
      formData.append('file', targetFile);
      formData.append('type', type);

      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal mengunggah berkas.');

      if (type === 'preview') {
        setPreviewUrl(result.objectKey);
        alert('Berkas Audio Preview .MP3 Berhasil Diamankan ke R2!');
      } else {
        setMasterFileKey(result.objectKey);
        alert('Berkas Master Sequencer .ZIP Berhasil Dikunci ke R2!');
      }
    } catch (err: any) {
      alert(`Upload Failed: ${err.message}`);
    } finally {
      setUploadingPreview(false);
      setUploadingMaster(false);
    }
  };

  const handleCommitProductRelease = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const numericPrice = Number(price.replace(/[^0-9]/g, ''));
        const productPayload = {
          title,
          artist_name: artist,
          bpm: Number(bpm),
          genre: genre.split(',').map(g => g.trim()).filter(Boolean),
          price: numericPrice,
          discount_percent: Number(discount),
          preview_url: previewUrl,
          master_file_key: masterFileKey
        };

        if (editingId) {
          const { error } = await supabase.from('products').update(productPayload).eq('id', editingId);
          if (error) throw error;
          alert('Data Komponen Sequencer Sukses Diperbarui!');
        } else {
          const { error = null } = await supabase.from('products').insert([productPayload]);
          if (error) throw error;
          alert('Modul Sequencer Baru Berhasil Dipublikasikan!');
        }

        resetFormFields();
        fetchRealTimeRecords();
      } catch (err: any) {
        alert(`Transaction Blocked: ${err.message}`);
      }
    });
  };

  const handleTriggerEditMode = (prod: any) => {
    setEditingId(prod.id);
    setTitle(prod.title);
    setArtist(prod.artist_name);
    setBpm(String(prod.bpm));
    setGenre(Array.isArray(prod.genre) ? prod.genre.join(', ') : prod.genre);
    setPrice(Number(prod.price).toLocaleString('id-ID'));
    setDiscount(String(prod.discount_percent || 0));
    setPreviewUrl(prod.preview_url);
    setMasterFileKey(prod.master_file_key);
    setActiveTab('add');
  };

  const handleRemoveProductRecord = async (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin memusnahkan produk sekuenser ini dari katalog?')) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) alert(error.message);
    else {
      alert('Aset sekuenser berhasil dihapus dari database.');
      fetchRealTimeRecords();
    }
  };

  const handleFinishJasaOrder = async (orderId: string) => {
    if (!confirm('Tandai status pengerjaan proyek kustom ini selesai penuh?')) return;
    const { error } = await supabase.from('jasa_orders').update({ status: 'finished' }).eq('id', orderId);
    if (error) alert(error.message);
    else {
      alert('Status proyek diperbarui menjadi Finished.');
      fetchRealTimeRecords();
    }
  };

  const resetFormFields = () => {
    setEditingId(null);
    setTitle('');
    setArtist('');
    setBpm('');
    setGenre('');
    setPrice('');
    setDiscount('0');
    setPreviewUrl('');
    setMasterFileKey('');
  };

  if (!isAuthenticated) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[85vh]">
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-8 max-w-sm w-full text-center space-y-5">
          <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <ShieldAlert className="text-rose-400" size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight uppercase text-zinc-100">Administrative Gate</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Protected Cyber Terminal</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input type="password" required placeholder="ENTER TERMINAL KEY" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-100 text-center font-mono focus:border-rose-500 focus:outline-none transition tracking-widest" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit">Access Terminal</Button>
          </form>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-6 space-y-8 animate-in fade-in duration-300">
      
      {/* HUB NAVIGASI TAB UTAMA */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
        <div className="text-left">
          <h1 className="text-lg font-black tracking-tight uppercase text-zinc-100 flex items-center gap-2">
            <Terminal className="text-emerald-400" size={16} /> Command Console Central
          </h1>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Operational active control hub</p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950/60 p-1.5 border border-zinc-900 rounded-2xl">
          <button onClick={() => { setActiveTab('add'); if(!editingId) resetFormFields(); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'add' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}><PlusCircle size={14} /> {editingId ? 'Edit Mode' : 'Upload Sequencer'}</button>
          <button onClick={() => setActiveTab('manage')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'manage' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}><LayoutGrid size={14} /> Manage Sequencer</button>
          <button onClick={() => setActiveTab('jasa')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition relative ${activeTab === 'jasa' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}><AudioLines size={14} /> Jasa Order</button>
          <button onClick={fetchRealTimeRecords} className="p-2 text-zinc-500 hover:text-zinc-200 transition rounded-xl"><RefreshCw size={14} /></button>
          
          <button 
            onClick={() => { if (confirm('Keluar dari panel administrative admin?')) clearAdminSession(); }} 
            className="p-2 bg-zinc-900 border border-zinc-800 text-rose-400 hover:bg-rose-950/20 hover:border-rose-900 transition rounded-xl ml-2 flex items-center gap-1 px-3 text-[10px] font-mono uppercase tracking-wider font-bold"
            title="Terminate Admin Session"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </div>

      {/* PANEL 1: ADD & UPLOAD PRODUCT FORM */}
      {activeTab === 'add' && (
        <div className={`bg-zinc-900/40 backdrop-blur-md border ${editingId ? 'border-amber-500/30' : 'border-zinc-800/60'} rounded-3xl p-8 max-w-3xl mx-auto shadow-xl space-y-6`}>
          <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
            <h2 className={`text-sm font-black uppercase tracking-wide ${editingId ? 'text-amber-400' : 'text-zinc-200'}`}>
              {editingId ? '📝 Edit Existing Sequencer Payload' : 'Upload New Sequencer'}
            </h2>
            {editingId && (
              <button onClick={resetFormFields} className="text-zinc-500 hover:text-zinc-200 p-1 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-1"><X size={10} /> Cancel Edit</button>
            )}
          </div>

          <form onSubmit={handleCommitProductRelease} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Judul Sequencer</label>
              <input type="text" required placeholder="SYNTHWAVE TRACK" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 uppercase" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Nama Artis / Producer</label>
              <input type="text" required placeholder="TECHHOUSE LABS" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 uppercase" value={artist} onChange={(e) => setArtist(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Tempo (BPM)</label>
              <input type="number" required placeholder="128" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 font-mono" value={bpm} onChange={(e) => setBpm(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Genre (Pisah Dengan Koma)</label>
              <input type="text" required placeholder="EDM, CYBERPUNK" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 uppercase" value={genre} onChange={(e) => setGenre(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Harga Utama (IDR)</label>
              <input type="text" required placeholder="250.000" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-emerald-400 font-mono font-bold" value={price} onChange={(e) => setPrice(formatInputToRupiah(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Diskon (%)</label>
              <input type="number" min="0" max="100" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 font-mono" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Audio Preview (.MP3)</label>
              <div className="relative bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center min-h-[90px]">
                <input type="file" accept="audio/mpeg" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleBinaryFileUpload(e, 'preview')} />
                {uploadingPreview ? (
                  <p className="text-[10px] font-mono text-zinc-400 animate-pulse"><RefreshCw size={10} className="animate-spin inline mr-1" /> Uploading to R2...</p>
                ) : previewUrl ? (
                  <p className="text-[11px] font-mono text-emerald-400 font-bold"><CheckCircle2 size={12} className="inline mr-1" /> LOCKED // {previewUrl.slice(0, 20)}...</p>
                ) : (
                  <p className="text-[10px] text-zinc-500"><UploadCloud size={14} className="inline mr-1" /> Upload File MP3</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Master Sequencer (.ZIP)</label>
              <div className="relative bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center min-h-[90px]">
                <input type="file" accept=".zip" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleBinaryFileUpload(e, 'master')} />
                {uploadingMaster ? (
                  <p className="text-[10px] font-mono text-zinc-400 animate-pulse"><RefreshCw size={10} className="animate-spin inline mr-1" /> Locking Vault...</p>
                ) : masterFileKey ? (
                  <p className="text-[11px] font-mono text-emerald-400 font-bold"><CheckCircle2 size={12} className="inline mr-1" /> VAULT LOCKED // {masterFileKey.slice(0, 20)}...</p>
                ) : (
                  <p className="text-[10px] text-zinc-500"><UploadCloud size={14} className="inline mr-1" /> Upload File ZIP</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2 pt-3">
              <Button type="submit" disabled={uploadingPreview || uploadingMaster} className="w-full text-xs font-black uppercase py-4 tracking-widest">
                {editingId ? 'Update Sequencer' : 'Upload New Sequencer'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* PANEL 2: CATALOG MANAGEMENT LIST */}
      {activeTab === 'manage' && (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl space-y-4">
          {products.length === 0 ? (
            <p className="text-zinc-500 text-xs font-mono py-8">NO DATA DISCOVERED INSIDE CORE INVENTORY.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-mono text-[10px] bg-zinc-950/20">
                    <th className="py-3 px-4">Metadata Node</th>
                    <th className="py-3 px-4">Artis</th>
                    <th className="py-3 px-4">Genre / BPM</th>
                    <th className="py-3 px-4">Financial Grid</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-100 uppercase">{prod.title}</td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400 uppercase">{prod.artist_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-zinc-300 font-mono block">{prod.bpm} BPM</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.isArray(prod.genre) && prod.genre.map((g: string, i: number) => (
                            <span key={i} className="bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-500 uppercase">{g}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {prod.discount_percent > 0 ? (
                          <span className="text-emerald-400 font-bold block">IDR {Number(prod.price * (1 - prod.discount_percent / 100)).toLocaleString('id-ID')}</span>
                        ) : (
                          <span className="text-zinc-300 font-bold block">IDR {Number(prod.price).toLocaleString('id-ID')}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleTriggerEditMode(prod)} className="bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-zinc-400 hover:text-amber-400 p-2 rounded-xl transition"><Edit3 size={12} /></button>
                          <button onClick={() => handleRemoveProductRecord(prod.id)} className="bg-zinc-950 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 p-2 rounded-xl transition"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PANEL 3: DYNAMIC MILESTONE JASA ORDERS CONSOLE */}
      {activeTab === 'jasa' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl text-left select-none">
            <h2 className="text-sm font-black uppercase text-zinc-200">Custom Audio Services Milestone Matrix</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Multi-term transaction logger history pipeline engine</p>
          </div>

          {jasaOrders.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 text-center">
              <p className="text-zinc-500 text-xs font-mono py-4">NO CUSTOM AUDIO PROJECT BRIEF SUBMISSIONS REGISTERED.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 text-left text-xs">
              {jasaOrders.map((order) => (
                <div key={order.id} className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  
                  {/* KOLOM A: MANIFES INFORMASI BRIEF KLIEN */}
                  <div className="space-y-4 lg:col-span-1 border-r border-zinc-800/40 pr-0 lg:pr-6">
                    <div>
                      <span className="bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest block w-max mb-1.5">{order.category || 'Custom Service'}</span>
                      <h3 className="text-sm font-black uppercase tracking-wide text-zinc-100">{order.project_title || 'Untitled Project Brief'}</h3>
                      <span className="block text-[10px] font-mono text-zinc-600 mt-0.5">ORDER ID: {order.id}</span>
                    </div>

                    <div className="bg-zinc-950/60 p-3 border border-zinc-900/80 rounded-xl font-mono text-[10px] space-y-1 text-zinc-400">
                      <p><span className="text-zinc-600">CLIENT:</span> {order.customer_name}</p>
                      <p><span className="text-zinc-600">WHATSAPP:</span> <a href={`https://wa.me/${order.whatsapp_number}`} target="_blank" className="text-emerald-400 underline">{order.whatsapp_number}</a></p>
                      <p className="truncate"><span className="text-zinc-600">EMAIL:</span> {order.customer_email}</p>
                    </div>

                    <div className="flex gap-2">
                      {order.reference_url && <a href={order.reference_url} target="_blank" className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl font-mono text-[10px] text-zinc-300 hover:text-zinc-100"><ExternalLink size={10} className="inline mr-1" /> Ref Link</a>}
                      {order.stems_url && <a href={order.stems_url} target="_blank" className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-mono text-[10px] text-emerald-400 font-bold"><Download size={10} className="inline mr-1" /> Stems Drive</a>}
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[9px] font-mono text-zinc-500 uppercase">Briefing Notes:</span>
                      <div className="bg-zinc-950 border border-zinc-900 p-2 rounded-xl text-zinc-400 text-[11px] max-h-[80px] overflow-y-auto whitespace-pre-wrap">{order.notes || '-'}</div>
                    </div>
                  </div>

                  {/* KOLOM B: HISTORI MULTI-TERMIN INVOICE (EDITABLE PANEL) */}
                  <div className="space-y-3 lg:col-span-1 border-r border-zinc-800/40 pr-0 lg:pr-6">
                    <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 border-b border-zinc-900 pb-1.5">📜 Payment Invoice Term History</span>
                    
                    {(!order.jasa_invoices || order.jasa_invoices.length === 0) ? (
                      <p className="text-zinc-600 italic font-mono text-[10px] py-4">Belum ada invoice termin yang diterbitkan.</p>
                    ) : (
                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                        {order.jasa_invoices.map((inv: any) => (
                          <form key={inv.id} onSubmit={async (e) => {
                            e.preventDefault();
                            const f = e.currentTarget;
                            const amt = (f.elements.namedItem('edit_amt') as HTMLInputElement).value;
                            const dsc = (f.elements.namedItem('edit_dsc') as HTMLInputElement).value;
                            try {
                              const res = await fetch('/api/admin/services/invoice', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  invoice_id: inv.id,
                                  amount: Number(amt.replace(/[^0-9]/g, '')),
                                  description: dsc
                                })
                              });
                              if (!res.ok) throw new Error('Gagal merubah data.');
                              alert('Termin Invoice Berhasil Diperbarui!');
                              fetchRealTimeRecords();
                            } catch (err: any) { alert(err.message); }
                          }} className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 space-y-2 text-left">
                            <div className="flex justify-between items-center border-b border-zinc-900 pb-1 mb-1">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase">INV: {inv.id}</span>
                              <span className={`px-1.5 py-0.2 font-mono text-[8px] font-black rounded border uppercase ${inv.status === 'settlement' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'}`}>
                                {inv.status === 'settlement' ? 'Lunas' : inv.status}
                              </span>
                            </div>
                            <input type="text" name="edit_dsc" required defaultValue={inv.description} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-zinc-100 uppercase" disabled={inv.status === 'settlement'} />
                            <div className="flex gap-2">
                              <input type="text" name="edit_amt" required defaultValue={Number(inv.amount).toLocaleString('id-ID')} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] font-mono text-emerald-400 font-bold" onChange={(e) => e.target.value = formatInputToRupiah(e.target.value)} disabled={inv.status === 'settlement'} />
                              {inv.status !== 'settlement' && (
                                <button type="submit" className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-[9px] font-black uppercase px-2 rounded-lg transition">Save</button>
                              )}
                            </div>
                          </form>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* KOLOM C: INJEKSI GENERATE TAGIHAN TERMIN BARU */}
                  <div className="space-y-3 lg:col-span-1">
                    <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 border-b border-zinc-900 pb-1.5">➕ Issue New Payment Milestone</span>
                    
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const targetForm = e.currentTarget;
                      const amtInput = targetForm.elements.namedItem('term_amount') as HTMLInputElement;
                      const descInput = targetForm.elements.namedItem('term_desc') as HTMLInputElement;
                      
                      try {
                        const response = await fetch('/api/admin/services/invoice', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            jasa_order_id: order.id,
                            amount: Number(amtInput.value.replace(/[^0-9]/g, '')),
                            description: descInput.value,
                            customer_name: order.customer_name,
                            customer_email: order.customer_email,
                            whatsapp_number: order.whatsapp_number,
                            project_title: order.project_title
                          })
                        });
                        if (!response.ok) throw new Error('Gagal memproses tagihan.');
                        alert('Tagihan termin sukses diterbitkan dan dikirim langsung ke email klien!');
                        targetForm.reset();
                        fetchRealTimeRecords();
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }} className="space-y-3">
                      <div className="space-y-1">
                        <input type="text" name="term_desc" required placeholder="CONTOH: DP 50% / PELUNASAN" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 uppercase focus:border-emerald-500 focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <input type="text" name="term_amount" required placeholder="NOMINAL HARGA (IDR)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 font-bold focus:border-emerald-500 focus:outline-none" onChange={(e) => e.target.value = formatInputToRupiah(e.target.value)} />
                      </div>
                      <button type="submit" className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-black py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition">
                        Terbitkan & Blast Invoice
                      </button>
                    </form>

                    {order.status === 'pending' && (
                      <div className="pt-3 border-t border-zinc-900 mt-2">
                        <button onClick={() => handleFinishJasaOrder(order.id)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition">Selesaikan Kontrak (Finish)</button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </PageContainer>
  );
}