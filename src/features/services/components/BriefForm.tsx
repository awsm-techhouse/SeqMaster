'use client';

import React, { useState, useTransition } from 'react';
import { Layers, Send } from 'lucide-react';
import { Button } from '@/components/ui/LayoutPrimitives';
import { supabase } from '@/lib/supabase';

export default function BriefForm() {
  const [projectTitle, setProjectTitle] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [stemsUrl, setStemsUrl] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCustomServiceDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // Penyelarasan skema memetakan brief langsung ke tabel valid 'jasa_orders' (Sesuai Bug Fix 1)
      const { error } = await supabase
        .from('jasa_orders')
        .insert([{
          project_title: projectTitle,
          reference_url: referenceUrl,
          stems_url: stemsUrl,
          status: 'pending'
        }]);

      if (error) {
        alert(error.message);
      } else {
        alert('Spesifikasi brief proyek terkirim. Admin akan mengontak Anda via WhatsApp.');
        setProjectTitle('');
        setReferenceUrl('');
        setStemsUrl('');
      }
    });
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 shadow-xl w-full max-w-xl mx-auto">
      <header className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-900">
        <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-emerald-400"><Layers size={14} /></div>
        <div>
          <h3 className="font-black tracking-tight uppercase text-zinc-100 text-xs">Audio Production Briefing Form</h3>
          <p className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">Relational Engine Target: jasa_orders</p>
        </div>
      </header>

      <form onSubmit={handleCustomServiceDispatch} className="space-y-4">
        <input type="text" required placeholder="Project Working Title & Musician Identity" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
        <input type="url" required placeholder="Style Reference Blueprint Link (Spotify / YouTube)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} />
        <input type="url" required placeholder="Consolidated Stems Archive Directory Link (Cloud Drive / WeTransfer)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={stemsUrl} onChange={(e) => setStemsUrl(e.target.value)} />
        <Button type="submit" disabled={isPending}><Send size={14} /> {isPending ? 'Transmitting Specs Data...' : 'Dispatch Project Specifications'}</Button>
      </form>
    </div>
  );
}