'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import Button from '@/components/ui/Button';
import { 
  Terminal, ShieldAlert, PlusCircle, LayoutGrid, AudioLines, 
  Trash2, Edit3, UploadCloud, FileAudio, FileArchive, CheckCircle2,
  ExternalLink, MessageSquare, Mail, RefreshCw, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminConsolePage() {
  // PROTOKOL OTENTIKASI & SECURITY TIMEOUT 1 JAM
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'manage' | 'jasa'>('add');
  const [isPending, startTransition] = useTransition();

  // STATE PRODUK SEQUENCER
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

  // STATE JASA ORDERS MANIFES
  const [jasaOrders, setJasaOrders] = useState<any[]>([]);

  // TRACKING UTILLITAS UPLOAD LOG
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingMaster, setUploadingMaster] = useState(false);

  // VALIDASI HANDSHAKE KEAMANAN SESSION
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

  const clearAdminSession = () => {
    localStorage.removeItem('seq_admin_session');
    localStorage.removeItem('seq_admin_expiry');
    setIsAuthenticated(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234Ajasaru') {
      localStorage.setItem('seq_admin_session', 'true');
      localStorage.setItem('seq_admin_expiry', String(Date.now() + 3600000)); // Batas Kedaluwarsa 1 Jam
      setIsAuthenticated(true);
      fetchRealTimeRecords();
    } else {
      alert('Kunci Sandi Admin Salah. Sesi Akses Ditolak.');
    }
  };

  // TARIK DATA RECORD DARI SUPABASE HUB
  const fetchRealTimeRecords = async () => {
    // A. Ambil Katalog Produk Sequencer
    const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (prodData) setProducts(prodData);

    // B. Ambil Seluruh Manifes Data Jasa Orders secara Utuh
    const { data: serviceData } = await supabase.from('jasa_orders').select('*').order('created_at', { ascending: false });
    if (serviceData) setJasaOrders(serviceData);
  };

  // FORMAT OTOMATIS INPUT NOMINAL RUPIAH
  const formatInputToRupiah = (value: string) => {
    const cleanNumber = value.replace(/[^0-9]/g, '');
    return cleanNumber ? Number(cleanNumber).toLocaleString('id-ID') : '';
  };

  // PIPELINE FILE UPLOAD HANDLER CLOUDFLARE R2 GATEWAY
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
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const rawTextError = await response.text();
        throw new Error(`Server Crash (Non-JSON): ${rawTextError.slice(0, 100)}`);
      }

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal mengunggah berkas.');

      if (type === 'preview') {
        setPreviewUrl(result.objectKey); // Menyimpan Object Key Bersih
        alert('Berkas Audio Preview .MP3 Berhasil Diamankan ke R2!');
      } else {
        setMasterFileKey(result.objectKey); // Menyimpan Jalur Key Terproteksi
        alert('Berkas Master Sequencer .ZIP Berhasil Dikunci ke R2!');
      }
    } catch (err: any) {
      alert(`Upload Failed: ${err.message}`);
    } finally {
      setUploadingPreview(false);
      setUploadingMaster(false);
    }
  };

  // COMMIT RELEASE DATA (CREATE / UPDATE MULTI-MODE ENGINE)
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
          // MODE EDIT: Lakukan Pembaruan Data
          const { error } = await supabase.from('products').update(productPayload).eq('id', editingId);
          if (error) throw error;
          alert('Data Komponen Sequencer Sukses Diperbarui!');
        } else {
          // MODE DAFTAR BARU: Masukkan Entri Baru
          const { error } = await supabase.from('products').insert([productPayload]);
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
    setActiveTab('add'); // Alahkan visual ke form input
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
    if (!confirm('Tandai status pengerjaan proyek kustom ini selesai?')) return;
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

  // SHIELD SCREEN OVERLAY JIKA BELUM TEROTENTIKASI
  if (!isAuthenticated) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[85vh]">
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <ShieldAlert className="text-rose-400" size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight uppercase text-zinc-100">Administrative Gate</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Protected Cyber Terminal</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input 
              type="password" 
              required 
              placeholder="ENTER TERMINAL KEY" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-100 text-center font-mono focus:border-rose-500 focus:outline-none transition tracking-widest"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="!bg-zinc-100 !text-zinc-950 hover:!bg-zinc-200 text-xs font-black uppercase tracking-wider">Access Terminal</Button>
          </form>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-6 space-y-8 animate-in fade-in duration-300">
      
      {/* PANEL UTAMA: SINKRONISASI TRI-PANEL NAVIGATION SWITCH BOARD */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
        <div className="text-left">
          <h1 className="text-lg font-black tracking-tight uppercase text-zinc-100 flex items-center gap-2">
            <Terminal className="text-emerald-400" size={16} /> Command Console Central
          </h1>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Cluster System Node Operational Hub</p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950/60 p-1.5 border border-zinc-900 rounded-2xl">
          <button 
            onClick={() => { setActiveTab('add'); if(!editingId) resetFormFields(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'add' ? (editingId ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-100 text-zinc-950') : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <PlusCircle size={14} /> {editingId ? 'Edit Mode' : 'Inject Sequencer'}
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'manage' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <LayoutGrid size={14} /> Manage Sequencer
          </button>
          <button 
            onClick={() => setActiveTab('jasa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition relative ${activeTab === 'jasa' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <AudioLines size={14} /> Jasa Order
            {jasaOrders.filter(o => o.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-950 font-mono text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                {jasaOrders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>
          <button onClick={fetchRealTimeRecords} className="p-2 text-zinc-500 hover:text-zinc-200 transition rounded-xl" title="Refresh Live Data">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* VIEW PANEL 1: INJECT NEW SEQUENCER / FORMULIR PEMBARUAN */}
      {activeTab === 'add' && (
        <div className={`bg-zinc-900/40 backdrop-blur-md border ${editingId ? 'border-amber-500/30' : 'border-zinc-800/60'} rounded-3xl p-8 max-w-3xl mx-auto shadow-xl space-y-6`}>
          <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
            <div className="text-left">
              <h2 className={`text-sm font-black uppercase tracking-wide ${editingId ? 'text-amber-400' : 'text-zinc-200'}`}>
                {editingId ? '📝 Edit Existing Sequencer Payload' : '⚡ Inject New Digital Sequencer Object'}
              </h2>
              <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Fill the metadata ledger matrix nodes</p>
            </div>
            {editingId && (
              <button onClick={resetFormFields} className="text-zinc-500 hover:text-zinc-200 p-1 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-1">
                <X size={10} /> Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleCommitProductRelease} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Judul Sequencer</label>
              <input type="text" required placeholder="CONTOH: SYNTHWAVE HORIZON TRACK" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition font-medium uppercase" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Nama Artis / Producer</label>
              <input type="text" required placeholder="CONTOH: TECHHOUSE LABS" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition font-medium uppercase" value={artist} onChange={(e) => setArtist(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Ketukan Tempo (BPM)</label>
              <input type="number" required placeholder="CONTOH: 128" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none transition" value={bpm} onChange={(e) => setBpm(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Genre (Pisah Dengan Koma)</label>
              <input type="text" required placeholder="CONTOH: ROCK, CYBERPUNK, EDM" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition font-medium uppercase" value={genre} onChange={(e) => setGenre(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Harga Utama (IDR)</label>
              <input type="text" required placeholder="CONTOH: 250.000" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none transition" value={price} onChange={(e) => setPrice(formatInputToRupiah(e.target.value))} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Diskon Potongan Harga (Persen %)</label>
              <input type="number" min="0" max="100" required placeholder="0" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none transition" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>

            {/* INTEGRASI COMPONENT UPLOAD DRAG-DROP AUDIO MP3 */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Upload File MP3 (Preview 20 Detik)</label>
              <div className="relative bg-zinc-950 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-center flex-col justify-center items-center text-center transition min-h-[90px] group">
                <input type="file" accept="audio/mpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => handleBinaryFileUpload(e, 'preview')} />
                {uploadingPreview ? (
                  <p className="text-[10px] font-mono text-zinc-400 animate-pulse uppercase flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> Uploading to Cloudflare R2 Node...</p>
                ) : previewUrl ? (
                  <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 font-bold"><CheckCircle2 size={12} /> COMPONENT LOCKED // {previewUrl.split('/').pop()?.slice(0, 20)}...</p>
                ) : (
                  <>
                    <UploadCloud size={16} className="text-zinc-600 group-hover:text-zinc-400 mb-1.5" />
                    <p className="text-[10px] text-zinc-500 font-sans">Seret berkas atau klik area untuk input .MP3</p>
                  </>
                )}
              </div>
            </div>

            {/* INTEGRASI COMPONENT UPLOAD MASTER ZIP */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Upload File ZIP (Master Trek Penuh)</label>
              <div className="relative bg-zinc-950 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-center flex-col justify-center items-center text-center transition min-h-[90px] group">
                <input type="file" accept=".zip" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => handleBinaryFileUpload(e, 'master')} />
                {uploadingMaster ? (
                  <p className="text-[10px] font-mono text-zinc-400 animate-pulse uppercase flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> Locking into Security Vault...</p>
                ) : masterFileKey ? (
                  <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 font-bold"><CheckCircle2 size={12} /> MASTER SECURE VAULT LOCKED // {masterFileKey.split('/').pop()?.slice(0, 20)}...</p>
                ) : (
                  <>
                    <UploadCloud size={16} className="text-zinc-600 group-hover:text-zinc-400 mb-1.5" />
                    <p className="text-[10px] text-zinc-500 font-sans">Seret berkas atau klik area untuk input .ZIP</p>
                  </>
                )}
              </div>
            </div>

            <div className="md:col-span-2 pt-3">
              <Button 
                type="submit" 
                disabled={isPending || uploadingPreview || uploadingMaster} 
                className={`w-full text-xs font-black uppercase py-4 tracking-widest ${editingId ? '!bg-amber-500 !text-zinc-950 hover:!bg-amber-400 shadow-amber-500/10' : '!bg-zinc-100 !text-zinc-950 hover:!bg-zinc-200'}`}
              >
                {isPending ? 'Syncing System ledger Node...' : editingId ? 'Commit Node Update Changes' : 'Commit Secure Node Release'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW PANEL 2: MANAGE SEQUENCER (LIST, EDIT, REMOVE CONTROL) */}
      {activeTab === 'manage' && (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="text-left border-b border-zinc-950 pb-3">
            <h2 className="text-sm font-black uppercase text-zinc-200">Catalog Records Tracker</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Operational active catalog inventory system data rows</p>
          </div>

          {products.length === 0 ? (
            <p className="text-zinc-500 text-xs font-mono py-8 select-none">NO DATA ACTIVE MODULES DISCOVERED INSIDE CORE INVENTORY.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300 font-sans border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-mono text-[10px] uppercase tracking-wider bg-zinc-950/20">
                    <th className="py-3 px-4">Metadata Node</th>
                    <th className="py-3 px-4">Artis / Producer</th>
                    <th className="py-3 px-4">Genre / BPM</th>
                    <th className="py-3 px-4">Financial Grid</th>
                    <th className="py-3 px-4 text-center">Operational Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-100 uppercase tracking-wide">
                        {prod.title}
                        <span className="block text-[9px] font-mono text-zinc-600 uppercase font-normal select-all mt-0.5">HASH: {prod.id}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400 uppercase tracking-wide">{prod.artist_name}</td>
                      <td className="py-3.5 px-4 space-y-1">
                        <span className="text-zinc-300 font-mono text-[11px] block">{prod.bpm} BPM</span>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(prod.genre) ? prod.genre.map((g: string, i: number) => (
                            <span key={i} className="bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-zinc-500 uppercase">{g}</span>
                          )) : null}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {prod.discount_percent > 0 ? (
                          <div className="space-y-0.5">
                            <span className="text-zinc-600 line-through text-[11px] block">IDR {Number(prod.price).toLocaleString('id-ID')}</span>
                            <span className="text-emerald-400 font-bold text-xs block">IDR {Number(prod.price * (1 - prod.discount_percent / 100)).toLocaleString('id-ID')} <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1 py-0.2 rounded font-black border border-emerald-500/20 ml-1">-{prod.discount_percent}%</span></span>
                          </div>
                        ) : (
                          <span className="text-zinc-300 font-bold block">IDR {Number(prod.price).toLocaleString('id-ID')}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleTriggerEditMode(prod)} 
                            className="bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-zinc-400 hover:text-amber-400 p-2 rounded-xl transition"
                            title="Edit Module Parameters"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            onClick={() => handleRemoveProductRecord(prod.id)} 
                            className="bg-zinc-950 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 p-2 rounded-xl transition"
                            title="Terminate Module Record"
                          >
                            <Trash2 size={12} />
                          </button>
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

      {/* VIEW PANEL 3: JASA ORDER REQUESTS MANIFES BARU UTUH (DIPISAH PENUH) */}
      {activeTab === 'jasa' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl text-left">
            <h2 className="text-sm font-black uppercase text-zinc-200">Custom Services Ledger Pipeline</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Advanced audio engineering and customization requests manager</p>
          </div>

          {jasaOrders.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 text-center">
              <p className="text-zinc-500 text-xs font-mono py-4 select-none">NO CUSTOM AUDIO PROJECT BRIEF SUBMISSIONS REGISTERED YET.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left text-xs">
              {jasaOrders.map((order) => (
                <div 
                  key={order.id} 
                  className={`bg-zinc-900/40 backdrop-blur-md border ${order.status === 'pending' ? 'border-amber-500/20 bg-gradient-to-br from-zinc-900/40 to-amber-500/[0.01]' : 'border-zinc-800/60'} rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 animate-in fade-in duration-200`}
                >
                  
                  {/* TOP CARD BAR METADATA */}
                  <div className="flex justify-between items-start border-b border-zinc-950 pb-3">
                    <div>
                      <span className="bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest block w-max mb-1.5">{order.service_type || 'Custom Service'}</span>
                      <h3 className="text-sm font-black uppercase tracking-wide text-zinc-100 select-all">{order.notes?.split('\n')?.[0]?.replace('Judul Projek: ', '') || 'Untitled Project'}</h3>
                      <span className="block text-[10px] font-mono text-zinc-600 mt-0.5">ID: {order.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 font-mono text-[9px] font-black rounded border uppercase tracking-wider ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' : 'bg-zinc-800/40 text-zinc-400 border-zinc-800/60'}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* CORE DATA LEDGER: MENAMPILKAN SEMUA DATA MANIFES PROYEK SECARA UTUH */}
                  <div className="space-y-3 font-sans leading-relaxed">
                    
                    {/* HUB KONTAK KLIEN */}
                    <div className="grid grid-cols-2 gap-3 bg-zinc-950/60 p-3 border border-zinc-900/80 rounded-2xl font-mono text-[11px] text-zinc-400">
                      <div>
                        <span className="block text-[9px] text-zinc-600 font-mono uppercase tracking-wider mb-0.5">NAMA MUSISI / KLIEN</span>
                        <span className="text-zinc-200 font-bold uppercase">{order.customer_name}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-zinc-600 font-mono uppercase tracking-wider mb-0.5">WHATSAPP LINK BRIDGE</span>
                        <a href={`https://wa.me/${order.whatsapp_number?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold underline flex items-center gap-1 hover:text-emerald-300">
                          <MessageSquare size={10} /> {order.whatsapp_number}
                        </a>
                      </div>
                      <div className="col-span-2 border-t border-zinc-900 pt-2 mt-1">
                        <span className="block text-[9px] text-zinc-600 font-mono uppercase tracking-wider mb-0.5">EMAIL ADRESS PATH</span>
                        <span className="text-zinc-300 select-all flex items-center gap-1"><Mail size={10} className="text-zinc-600" /> {order.customer_email}</span>
                      </div>
                    </div>

                    {/* MANIFES CATATAN LINK & FILE DRIVE KLIEN */}
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">🎵 Musik Referensi Link (Spotify/YouTube):</span>
                        {order.notes?.match(/Referensi Link: (.+)/)?.[1] ? (
                          <a 
                            href={order.notes.match(/Referensi Link: (.+)/)[1].trim()} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-xl font-mono text-[11px] text-zinc-300 transition-all max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
                          >
                            Buka Referensi Musik <ExternalLink size={10} className="text-zinc-500" />
                          </a>
                        ) : (
                          <span className="text-zinc-600 italic font-mono text-[11px] block pl-1">No reference links supplied by customer node.</span>
                        )}
                      </div>

                      <div>
                        <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">📦 Berkas Mentah / Multi-Track Drive Link:</span>
                        {order.notes?.match(/Drive Berkas: (.+)/)?.[1] ? (
                          <a 
                            href={order.notes.match(/Drive Berkas: (.+)/)[1].trim()} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 px-3 py-1.5 rounded-xl font-mono text-[11px] text-emerald-400 font-bold transition-all max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
                          >
                            Unduh Stems / Audio Mentah <ExternalLink size={10} className="text-emerald-500" />
                          </a>
                        ) : (
                          <span className="text-zinc-600 italic font-mono text-[11px] block pl-1">No drive storage paths found inside this brief folder.</span>
                        )}
                      </div>

                      <div>
                        <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">📝 Catatan Khusus Untuk Produser:</span>
                        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 text-zinc-300 font-sans text-xs leading-relaxed max-h-[120px] overflow-y-auto whitespace-pre-wrap shadow-inner">
                          {order.notes?.split('\n\n---')?.[0]?.replace(/Judul Projek: .+\n?/, '') || 'Tidak ada instruksi sound design tambahan.'}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* BOTTOM ACTION BAR JASA */}
                  {order.status === 'pending' && (
                    <div className="pt-3 border-t border-zinc-950">
                      <button 
                        onClick={() => handleFinishJasaOrder(order.id)}
                        className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xl shadow-black/40"
                      >
                        <CheckCircle2 size={12} /> Tandai Projek Selesai (Finish)
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </PageContainer>
  );
}