'use client';

import React, { useState, useTransition } from 'react';
import { Layers, Send } from 'lucide-react';
import { Button } from '@/components/ui/LayoutPrimitives';

export default function BriefForm() {
  const [projectTitle, setProjectTitle] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [stemsUrl, setStemsUrl] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCustomServiceDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          project_title: projectTitle,
          category: 'custom',
          reference_url: referenceUrl,
          stems_url: stemsUrl,
          customer_name: customerName,
          customer_email: customerEmail,
          whatsapp_number: whatsappNumber,
          notes: notes
        };

        const res = await fetch('/api/services/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
          alert('Spesifikasi brief proyek terkirim. Admin akan mengontak Anda via WhatsApp.');
          setProjectTitle('');
          setReferenceUrl('');
          setStemsUrl('');
          setCustomerName('');
          setCustomerEmail('');
          setWhatsappNumber('');
          setNotes('');
        } else {
          alert(`Error: ${data.error || 'Failed to submit brief'}`);
        }
      } catch (error) {
        console.error('Brief submission error:', error);
        alert('Gagal mengirim brief. Periksa koneksi server.');
      }
    });
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 shadow-xl w-full max-w-xl mx-auto">
      <header className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-900">
        <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-emerald-400"><Layers size={14} /></div>
        <div>
          <h3 className="font-black tracking-tight uppercase text-zinc-100 text-xs">Audio Production Briefing Form</h3>
          <p className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">Quick Project Submission</p>
        </div>
      </header>

      <form onSubmit={handleCustomServiceDispatch} className="space-y-4">
        <input type="text" required placeholder="Project Working Title & Musician Identity" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
        <input type="text" required placeholder="Your Full Name" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <input type="email" required placeholder="Your Email Address" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
        <input type="tel" required placeholder="WhatsApp Number (62xxx)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
        <input type="url" placeholder="Style Reference Blueprint Link (Spotify / YouTube)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} />
        <input type="url" placeholder="Stems Archive Directory Link (Cloud Drive / WeTransfer)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition" value={stemsUrl} onChange={(e) => setStemsUrl(e.target.value)} />
        <textarea placeholder="Additional notes or special requests..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition resize-none" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button type="submit" disabled={isPending}><Send size={14} /> {isPending ? 'Transmitting Specs Data...' : 'Dispatch Project Specifications'}</Button>
      </form>
    </div>
  );
}