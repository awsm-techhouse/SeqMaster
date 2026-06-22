'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { PageContainer, Button, Badge } from '@/components/ui/LayoutPrimitives';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Layers, PlusCircle, CheckCircle, Save, LogOut, Lock, FileAudio, FileArchive, Trash2, Sliders, Pencil, XCircle } from 'lucide-react';

export default function AdminControlConsole() {
  const [isPending, startTransition] = useTransition();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [incomingJobs, setIncomingJobs] = useState<any[]>([]);
  const [publishedProducts, setPublishedProducts] = useState<any[]>([]);

  // ENGINE STATE UTK SISTEM UPDATE / EDIT (MANIFES TERPADU)
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genreInput, setGenreInput] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [bpmPulse, setBpmPulse] = useState<number>(128);

  // Storage Upload Processing State
  const [mp3PreviewUrl, setMp3PreviewUrl] = useState('');
  const [mp3FileName, setMp3FileName] = useState('');
  const [mp3Uploading, setMp3Uploading] = useState(false);
  const [zipMasterKey, setZipMasterKey] = useState('');
  const [zipFileName, setZipFileName] = useState('');
  const [zipUploading, setZipUploading] = useState(false);

  // Dynamic Invoicing Allocation State per Job
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [allocatedPrice, setAllocatedPrice] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [snapTokenInput, setSnapTokenInput] = useState('');

  // EVALUASI TIMEOUT FORCE LOGOUT 1 JAM
  useEffect(() => {
    const sessionExpiryTimestamp = localStorage.getItem('seqmaster_admin_expiry');
    
    if (sessionExpiryTimestamp && Date.now() < parseInt(sessionExpiryTimestamp)) {
      setIsAdminAuthenticated(true);
      loadAllGlobalBriefs();
      loadAllPublishedProducts();

      const remainingLifetime = parseInt(sessionExpiryTimestamp) - Date.now();
      const logoutTimer = setTimeout(() => {
        executeAdminForceLogout();
        alert('Sesi admin kedaluwarsa demi keamanan (Kunci otomatis 1 jam).');
      }, remainingLifetime);

      return () => clearTimeout(logoutTimer);
    } else {
      executeAdminForceLogout();
    }
  }, [isAdminAuthenticated]);

  const loadAllGlobalBriefs = async () => {
    const { data } = await supabase.from('jasa_orders').select('*').order('created_at', { ascending: false });
    if (data) setIncomingJobs(data);
  };

  const loadAllPublishedProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setPublishedProducts(data);
  };

  const handleAdminLoginSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput })
      });
      const data = await response.json();
      
      if (data.authenticated) {
        const expiryTime = Date.now() + 3600000;
        localStorage.setItem('seqmaster_admin_expiry', expiryTime.toString());
        setIsAdminAuthenticated(true);
      } else {
        alert(data.error || 'Akses ditolak.');
      }
    } catch (err) {
      alert('Koneksi pipa otentikasi admin terputus.');
    }
  };

  const executeAdminForceLogout = () => {
    localStorage.removeItem('seqmaster_admin_expiry');
    setIsAdminAuthenticated(false);
    setAdminPasswordInput('');
    resetFormState();
  };

  const handleBinaryFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'preview' | 'master') => {
    const targetFile = event.target.files?.[0];
    if (!targetFile) return;

    if (type === 'preview') {
      if (!targetFile.name.endsWith('.mp3')) {
        return alert('Format berkas ditolak! Preview audio wajib berformat .mp3.');
      }
      setMp3Uploading(true);
      setMp3FileName(targetFile.name);
    } else {
      if (!targetFile.name.endsWith('.zip')) {
        return alert('Format berkas ditolak! Berkas master wajib berformat .zip.');
      }
      setZipUploading(true);
      setZipFileName(targetFile.name);
    }

    try {
      const uploadPayload = new FormData();
      uploadPayload.append('file', targetFile);
      uploadPayload.append('type', type);

      const response = await fetch('/api/admin/upload', { method: 'POST', body: uploadPayload });
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const rawTextError = await response.text();
        throw new Error(`Server Action Non-JSON: ${rawTextError.slice(0, 100)}`);
      }

      const result = await response.json();

      if (result.success) {
        if (type === 'preview') setMp3PreviewUrl(result.location);
        else setZipMasterKey(result.objectKey);
      } else {
        alert(result.error || 'Gagal memproses berkas.');
      }
    } catch (err: any) {
      alert(err.message || 'Komunikasi cloud storage terputus.');
    } finally {
      setMp3Uploading(false);
      setZipUploading(false);
    }
  };

  // LOGIKA UTUT SUBMIT FORMULIR (DUAL ACTION: INSERT ATAU UPDATE)
  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mp3PreviewUrl || !zipMasterKey) return alert('Lengkapi unggahan berkas R2 terlebih dahulu.');

    startTransition(async () => {
      const formattedGenres = genreInput.split(',').map(g => g.trim()).filter(g => g.length > 0).join(', ');

      const productPayload = {
        title,
        artist_name: artist,
        bpm: Number(bpmPulse),
        genre: formattedGenres,
        price: Number(price),
        discount_percent: Number(discountPercent),
        preview_url: mp3PreviewUrl,
        master_file_key: zipMasterKey,
        is_active: true
      };

      if (isEditingMode && editingProductId) {
        // JALUR UPDATE: Memperbarui record modifikasi data sekuenser utuh berdasarkan ID target
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProductId);

        if (!error) {
          alert('Sukses: Informasi perubahan data sekuenser berhasil disimpan ke basis data!');
          resetFormState();
          loadAllPublishedProducts();
        } else {
          alert(`Update Gagal: ${error.message}`);
        }
      } else {
        // JALUR INSERT: Membuat baris produk ritme sekuenser baru
        const generatedProductId = `SEQ-PROD-${Date.now()}`;
        const { error } = await supabase
          .from('products')
          .insert([{ id: generatedProductId, ...productPayload }]);

        if (!error) {
          alert('Sukses mempublikasikan sekuenser baru!');
          resetFormState();
          loadAllPublishedProducts();
        } else {
          alert(`Insert Gagal: ${error.message}`);
        }
      }
    });
  };

  // PEMICU EDIT: Memindahkan data dari list inventory masuk kembali ke dalam formulir input
  const triggerEditProductFlow = (product: any) => {
    setIsEditingMode(true);
    setEditingProductId(product.id);
    
    setTitle(product.title || '');
    setArtist(product.artist_name || '');
    setBpmPulse(product.bpm || 128);
    setGenreInput(product.genre || '');
    setPrice(product.price || 0);
    setDiscountPercent(product.discount_percent || 0);
    setMp3PreviewUrl(product.preview_url || '');
    setZipMasterKey(product.master_file_key || '');
    
    // Mengekstrak label teks nama berkas dari sisa string URL/Key objek R2
    setMp3FileName(product.preview_url ? 'Preview-Audio-Loaded.mp3' : '');
    setZipFileName(product.master_file_key ? 'Master-Package-Loaded.zip' : '');
  };

  const resetFormState = () => {
    setIsEditingMode(false);
    setEditingProductId(null);
    setTitle(''); setArtist(''); setGenreInput(''); setPrice(0); setDiscountPercent(0); setBpmPulse(128);
    setMp3PreviewUrl(''); setMp3FileName(''); setZipMasterKey(''); setZipFileName('');
  };

  const handleDeleteProductRecord = (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus mutasi produk ini dari e-commerce secara permanen?')) return;
    
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/products/delete?id=${productId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          alert(data.message);
          if (editingProductId === productId) resetFormState();
          loadAllPublishedProducts();
        } else {
          alert(data.error);
        }
      } catch (err) {
        alert('Gagal menghapus produk.');
      }
    });
  };

  const handleUpdateInvoiceSpecs = (jobId: string) => {
    startTransition(async () => {
      const { error } = await supabase
        .from('jasa_orders')
        .update({ price: Number(allocatedPrice), admin_notes: adminNotes, payment_token: snapTokenInput })
        .eq('id', jobId);

      if (!error) {
        alert('Struktur Invoice terperbarui!');
        loadAllGlobalBriefs();
        setSelectedJobId(null);
      }
    });
  };

  const handleForceFinishJob = (jobId: string, payStatus: string) => {
    if (payStatus !== 'settlement') return alert('Selesaikan termin transaksi pembayaran pembeli terlebih dahulu.');
    startTransition(async () => {
      const { error } = await supabase.from('jasa_orders').update({ status: 'finished' }).eq('id', jobId);
      if (!error) loadAllGlobalBriefs();
    });
  };

  if (!isAdminAuthenticated) {
    return (
      <PageContainer className="flex items-center justify-center min-h-screen">
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-8 max-w-sm w-full shadow-2xl space-y-6">
          <div className="text-center">
            <Lock className="mx-auto text-rose-400 mb-2" size={18} />
            <h2 className="text-xs font-black tracking-tight uppercase text-zinc-100">Console Security Boundary</h2>
          </div>
          <form onSubmit={handleAdminLoginSubmission} className="space-y-4">
            <input type="password" required placeholder="Enter Admin Password" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 text-center tracking-widest focus:border-rose-500 focus:outline-none" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} />
            <Button type="submit">Verify Token</Button>
          </form>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-12">
      <header className="border-b border-zinc-900 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase text-zinc-100 flex items-center gap-2">
            <ShieldCheck size={16} className="text-rose-500" /> Control Tower Admin Central
          </h1>
        </div>
        <Button variant="secondary" onClick={executeAdminForceLogout} className="!w-24 !py-1.5 text-[10px]">Logout</Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* PANEL FORMULIR INPUT TERSTRUKTUR (KOLOM KIRI - BISA BERUBAH WARNA SAAT EDIT MODE) */}
        <div className={`backdrop-blur-md border rounded-2xl p-6 shadow-xl space-y-4 transition-colors duration-300 lg:col-span-5 ${isEditingMode ? 'bg-amber-500/5 border-amber-500/30' : 'bg-zinc-900/40 border-zinc-800/60'}`}>
          <h2 className="text-xs font-black tracking-tight uppercase text-zinc-300 flex items-center gap-1.5">
            <PlusCircle size={14} className={isEditingMode ? 'text-amber-400' : 'text-emerald-400'} /> 
            {isEditingMode ? 'Modify Sequencer Asset' : 'Inject New Sequencer'}
          </h2>
          
          <form onSubmit={handleFormSubmission} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">Judul Lagu / Track Title</label>
              <input type="text" required placeholder="Contoh: Sequencer Pop Rock Track A" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">Nama Artis</label>
                <input type="text" required placeholder="Contoh: Alex Vance" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={artist} onChange={(e) => setArtist(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">Tempo Kecepatan</label>
                <input type="number" required placeholder="128 BPM" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={bpmPulse} onChange={(e) => setBpmPulse(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">Genre Klasifikasi (Dipisah Koma)</label>
              <input type="text" required placeholder="Contoh: Synthwave, Cyberpunk, Electro" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={genreInput} onChange={(e) => setGenreInput(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">Harga Base (Rupiah)</label>
                <input type="number" required placeholder="Rp 450000" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none transition" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">Potongan Diskon (%)</label>
                <input type="number" min="0" max="100" required placeholder="0%" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 font-mono text-rose-400 focus:border-emerald-500 focus:outline-none transition" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="block text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Cloud Storage Nodes (Upload Ulang Jika Ingin Mengganti Berkas)</span>
              <div className="relative border border-dashed border-zinc-800 rounded-xl p-3 bg-zinc-950/40 text-center hover:border-emerald-500/50 transition">
                <input type="file" accept=".mp3" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => handleBinaryFileUpload(e, 'preview')} />
                <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1.5">
                  <FileAudio size={12} className={mp3PreviewUrl ? 'text-emerald-400' : 'text-zinc-600'} />
                  {mp3Uploading ? 'Uploading Preview...' : mp3FileName ? `Preview: ${mp3FileName}` : 'Drop Audio Preview (.MP3)'}
                </p>
              </div>
              <div className="relative border border-dashed border-zinc-800 rounded-xl p-3 bg-zinc-950/40 text-center hover:border-emerald-500/50 transition">
                <input type="file" accept=".zip" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => handleBinaryFileUpload(e, 'master')} />
                <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1.5">
                  <FileArchive size={12} className={zipMasterKey ? 'text-cyan-400' : 'text-zinc-600'} />
                  {zipUploading ? 'Uploading Package...' : zipFileName ? `Package: ${zipFileName}` : 'Drop Master Code (.ZIP)'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending || mp3Uploading || zipUploading} className={isEditingMode ? '!bg-amber-400 !text-zinc-950 hover:!bg-amber-500' : ''}>
                {isPending ? 'Processing Storage Matrix...' : isEditingMode ? 'Save Matrix Modifications' : 'Publish New Sequencer Node'}
              </Button>
              {isEditingMode && (
                <button type="button" onClick={resetFormState} className="px-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-xl transition flex items-center justify-center" title="Cancel Modification">
                  <XCircle size={14} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* WORKFLOW TRACKER JASA & DATA MANAGEMENT LIST INVENTORY (KOLOM KANAN) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SUB-PANEL UTUH MANAGEMENT LIST: SEKARANG MEMILIKI TOMBOL EDIT SINKRON */}
          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xs font-black tracking-tight uppercase text-zinc-300 flex items-center gap-1 mb-4">
              <Sliders size={12} className="text-emerald-400" /> Active Storefront Catalog Inventory
            </h2>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {publishedProducts.length === 0 ? (
                <p className="text-xs text-zinc-600 font-mono py-2">Belum ada sekuenser terbit di database.</p>
              ) : (
                publishedProducts.map(p => (
                  <div key={p.id} className={`p-3 border rounded-xl flex justify-between items-center font-mono text-[11px] transition-colors ${editingProductId === p.id ? 'bg-amber-500/5 border-amber-500/30' : 'bg-zinc-950 border-zinc-900'}`}>
                    <div className="truncate max-w-[65%]">
                      <h4 className="font-bold text-zinc-300 truncate font-sans uppercase text-xs">{p.title}</h4>
                      <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">IDR {Number(p.price).toLocaleString('id-ID')} // Disc {p.discount_percent}% // {p.bpm} BPM</span>
                    </div>
                    <div className="flex gap-2">
                      {/* TOMBOL EDIT MODIFIKASI DATA (Sesuai Permintaan) */}
                      <button 
                        type="button" 
                        onClick={() => triggerEditProductFlow(p)} 
                        className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition"
                        title="Edit Modul Sequencer"
                      >
                        <Pencil size={12} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteProductRecord(p.id)} 
                        className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition"
                        title="Delete Permanen"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PRODUCTION SERVICE MATRIX */}
          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xs font-black tracking-tight uppercase text-zinc-300 flex items-center gap-1 mb-4">
              <Layers size={12} /> Production Service Matrix (jasa_orders)
            </h2>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {incomingJobs.map((job) => (
                <div key={job.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-zinc-900 pb-2 flex-wrap gap-2">
                    <div>
                      <h3 className="font-black text-zinc-200 font-sans uppercase text-xs">{job.project_title}</h3>
                      <p className="text-[9px] text-zinc-500">WA: {job.whatsapp_number} // Cat: {job.category}</p>
                    </div>
                    <div className="flex gap-1.5 text-[9px]"><Badge type={job.status} /><Badge type={job.payment_status} /></div>
                  </div>
                  {selectedJobId === job.id ? (
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2 mt-2 font-sans">
                      <input type="number" placeholder="Set Price (IDR)" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100" value={allocatedPrice} onChange={(e) => setAllocatedPrice(Number(e.target.value))} />
                      <input type="text" placeholder="Midtrans Snap Token" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100" value={snapTokenInput} onChange={(e) => setSnapTokenInput(e.target.value)} />
                      <input type="text" placeholder="Internal Notes" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
                      <div className="flex gap-2"><Button variant="primary" onClick={() => handleUpdateInvoiceSpecs(job.id)} className="!py-1.5 text-[10px]">Save</Button><Button variant="ghost" onClick={() => setSelectedJobId(null)} className="!py-1.5 text-[10px]">Cancel</Button></div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="text-zinc-400">Price: IDR {Number(job.price).toLocaleString('id-ID')}</span>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setSelectedJobId(job.id); setAllocatedPrice(job.price); setAdminNotes(job.admin_notes || ''); setSnapTokenInput(job.payment_token || ''); }} className="!py-1 !px-2 text-[9px] !w-24">Invoice Specs</Button>
                        {job.status === 'pending' && <Button variant="primary" onClick={() => handleForceFinishJob(job.id, job.payment_status)} className="!py-1 !px-2 text-[9px] !w-16">Finish</Button>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}