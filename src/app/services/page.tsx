'use client';

import React, { useState, useTransition } from 'react';
import { PageContainer, Button } from '@/components/ui/LayoutPrimitives';
import { Layers, Play, Pause, Headphones, CheckCircle2, Music4 } from 'lucide-react';

type ServiceCategory = 'mixing' | 'producing' | 'sequencer';

export default function ServicesPage() {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ServiceCategory>('mixing');
  
  // Audio state untuk demo Before vs After
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoState, setDemoState] = useState<'before' | 'after'>('before');
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [refUrl, setRefUrl] = useState('');
  const [stemsUrl, setStemsUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const toggleAuditionDemo = (type: 'before' | 'after') => {
    if (audioObj) {
      audioObj.pause();
    }
    
    // Alamat berkas audio kualitas 128kbps demi optimalisasi bandwidth loading mobile
    const targetUrl = type === 'before' 
      ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' 
      : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';

    const newAudio = new Audio(targetUrl);
    newAudio.play().catch(() => {});
    setAudioObj(newAudio);
    setDemoState(type);
    setIsPlayingDemo(true);
  };

  const handleStopAudition = () => {
    if (audioObj) audioObj.pause();
    setIsPlayingDemo(false);
  };

  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          project_title: title, 
          category: activeTab, // Mengirimkan 'mixing', 'producing', atau 'sequencer'
          reference_url: refUrl, 
          stems_url: stemsUrl,
          notes, 
          customer_name: name, 
          customer_email: email, 
          whatsapp_number: whatsapp
        };
        
        const res = await fetch('/api/services/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          alert('Brief Berhasil Dikirim! Manajemen operasional SeqMaster akan memvalidasi rincian harga kustom via WhatsApp.');
          setTitle(''); setRefUrl(''); setStemsUrl(''); setNotes(''); setName(''); setEmail(''); setWhatsapp('');
          if (audioObj) audioObj.pause();
          setIsPlayingDemo(false);
        }
      } catch (err) {
        console.error('Relational transmission error:', err);
        alert('Gagal mengirim brief. Periksa koneksi server.');
      }
    });
  };

  // Logika pembaca teks panduan dinamis (Smart Contextual UI Text)
  const getDynamicPlaceholders = () => {
    switch (activeTab) {
      case 'sequencer':
        return {
          title: "Judul Proyek / Nama Musisi (Contoh: Kaelen - Synthwave Project X)",
          reference: "Tautan Referensi Ketukan/Pola Drum (Spotify / YouTube Link)",
          stems: "Tautan Guideline / Sketsa Progresi Chord MIDI (WeTransfer / Drive)",
          notes: "Deskripsi arsitektur sekuenser: Sebutkan target VSTi, preferensi fills drum, dan pembagian birama lagu..."
        };
      case 'producing':
        return {
          title: "Judul Lagu Baru & Rencana Identitas Rilis",
          reference: "Tautan Referensi Komposisi / Sound Design Kiblat Produser",
          stems: "Tautan Rekaman Mentah Vokal / Panduan Gitar Akustik Dasar",
          notes: "Deskripsi kebutuhan full producing: Kebutuhan instrumentasi tambahan, aransemen strings, dll..."
        };
      default:
        return {
          title: "Judul Projek & Nama Band / Musisi",
          reference: "Tautan Referensi Target Hasil Mixing & Mastering",
          stems: "Tautan Unduhan Berkas Mentah Multi-track Stems Audio (.ZIP)",
          notes: "Catatan khusus untuk audio engineer: Aturan panning, pembagian frekuensi low-end, instruksi vocal-effect..."
        };
    }
  };

  const currentPlaceholders = getDynamicPlaceholders();

  return (
    <PageContainer>
      <header className="mb-10 border-b border-zinc-900 pb-6">
        <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-100 flex items-center gap-2 select-none">
          <Headphones size={20} className="text-cyan-400" /> Advanced Audio Engineering
        </h1>
        <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">
          Premium Consultation & Production Services for Musicians and Producers
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* KOLOM KIRI: SHOWCASE AUDITION DEMO STUDIO (APPLE GLASS SURFACE) */}
        <div className="lg:col-span-4 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-xs font-black tracking-tight uppercase text-zinc-300 flex items-center gap-1.5 select-none">
            <Music4 size={12} className="text-emerald-400" /> Mixing & Mastering Demo
          </h2>
          
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 text-center space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
              SeqMaster Processing Demo
            </span>
            
            <div className="flex gap-2 justify-center">
              <Button 
                variant={isPlayingDemo && demoState === 'before' ? 'primary' : 'secondary'} 
                onClick={() => toggleAuditionDemo('before')} 
                className="!py-2 !w-28 text-[10px]"
              >
                Raw Before
              </Button>
              <Button 
                variant={isPlayingDemo && demoState === 'after' ? 'primary' : 'secondary'} 
                onClick={() => toggleAuditionDemo('after')} 
                className="!py-2 !w-28 text-[10px]"
              >
                Master After
              </Button>
            </div>

            {isPlayingDemo && (
              <button 
                type="button"
                onClick={handleStopAudition} 
                className="text-[10px] font-mono uppercase text-rose-400 flex items-center gap-1 mx-auto mt-2 hover:text-rose-300 transition"
              >
                <Pause size={10} /> Stop Audition Loop
              </button>
            )}
          </div>

          <div className="text-[11px] text-zinc-400 space-y-2.5 border-t border-zinc-900 pt-4 font-normal">
            <p className="font-bold text-zinc-300 uppercase tracking-wide text-[10px]">SeqMaster Services:</p>
            <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-400" /> Mixing & Mastering</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-400" /> Music Production</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-400" /> Custom Sequencer</div>
          </div>
        </div>

        {/* KOLOM KANAN: FORM BRIEFING UTUH DENGAN STRUKTUR PISAH 3 KATEGORI */}
        <div className="lg:col-span-8 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 shadow-xl">
          
          {/* BARIS SELEKTOR TAB TIGA KATEGORI (Sesuai Instruksi Tambahan) */}
          <div className="flex flex-wrap gap-4 border-b border-zinc-900 pb-4 mb-6 select-none">
            <button 
              type="button"
              onClick={() => setActiveTab('mixing')} 
              className={`text-xs font-black uppercase tracking-wider transition-colors pb-1 ${activeTab === 'mixing' ? 'text-zinc-100 border-b border-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Mixing & Mastering
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('producing')} 
              className={`text-xs font-black uppercase tracking-wider transition-colors pb-1 ${activeTab === 'producing' ? 'text-zinc-100 border-b border-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Full Producing
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('sequencer')} 
              className={`text-xs font-black uppercase tracking-wider transition-colors pb-1 ${activeTab === 'sequencer' ? 'text-zinc-100 border-b border-zinc-100' : 'text-zinc-400/80 hover:text-zinc-300'}`}
            >
              Custom Sequencer
            </button>
          </div>

          <form onSubmit={handleFormSubmission} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                type="text" 
                required 
                placeholder={currentPlaceholders.title}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition placeholder-zinc-600" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
              <input 
                type="url" 
                required 
                placeholder={currentPlaceholders.reference}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition placeholder-zinc-600" 
                value={refUrl} 
                onChange={(e) => setRefUrl(e.target.value)} 
              />
            </div>
            
            <input 
              type="url" 
              required 
              placeholder={currentPlaceholders.stems}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition placeholder-zinc-600" 
              value={stemsUrl} 
              onChange={(e) => setStemsUrl(e.target.value)} 
            />
            
            <textarea 
              placeholder={currentPlaceholders.notes}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 min-h-[90px] focus:border-emerald-500 focus:outline-none transition placeholder-zinc-600 font-sans" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
            />
            
            {/* AREA ISOLASI IDENTITAS PELANGGAN */}
            <div className="border-t border-zinc-900 pt-4 space-y-4">
              <span className="text-[9px] font-mono uppercase text-zinc-500 block tracking-wider">
                Operator Vault Verification Fields
              </span>
              <input 
                type="text" 
                required 
                placeholder="Nama Lengkap Anda" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition placeholder-zinc-600" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="email" 
                  required 
                  placeholder="Alamat Email Kontak Aktif" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition placeholder-zinc-600" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
                <input 
                  type="tel" 
                  required 
                  placeholder="Nomor WhatsApp (Aktif Valid)" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition placeholder-zinc-600" 
                  value={whatsapp} 
                  onChange={(e) => setWhatsapp(e.target.value)} 
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isPending}>
                <Layers size={14} /> 
                {isPending ? 'Transmitting Data Array...' : `Submit ${activeTab === 'sequencer' ? 'Custom Sequencer' : activeTab} Brief`}
              </Button>
            </div>
          </form>

        </div>
      </div>
    </PageContainer>
  );
}