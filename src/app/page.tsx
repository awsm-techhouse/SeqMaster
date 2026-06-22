import React from 'react';
import { PageContainer, Button } from '@/components/ui/LayoutPrimitives';
import { Sliders, Layers, Terminal, ArrowRight, Cpu, Disc } from 'lucide-react';

export default function HomePage() {
  return (
    <PageContainer className="relative overflow-hidden flex flex-col justify-between min-h-screen">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

      <header className="my-auto max-w-3xl z-10 py-12 text-center md:text-left">
        {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800/60 text-[10px] font-mono tracking-widest text-emerald-400 uppercase mb-6">
          <Cpu size={12} className="animate-pulse" /> Platform Environment Core Live
        </div> */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight uppercase text-zinc-100 leading-[0.95]">
           BELI SEQUENCER<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-600">PESAN JASA AUDIO ENGINEERING</span>
        </h1>
        <p className="text-zinc-400 text-xs md:text-sm mt-6 font-light max-w-xl leading-relaxed">
          Penjualan sequencer premium instan, jasa rekaman, aransemen, serta mixing & mastering audio profesional.
        </p>
      </header>

      {/* CORE TWO-WAY NAVIGATION PANELS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 z-10">
        {/* PANEL TOKO RETAIL */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-8 shadow-xl flex flex-col justify-between group">
          <div>
            <Sliders size={20} className="text-emerald-400 mb-4" />
            <h2 className="text-md font-black tracking-tight uppercase text-zinc-100">Sequencer Shop Catalog</h2>
            <p className="text-zinc-400 text-xs mt-2 font-light">Cari sequencer premium instan yang sesuai dengan kebutuhan music Anda.</p>
          </div>
          <a href="/shop" className="block mt-8"><Button variant="primary">Explore Shop <ArrowRight size={14} /></Button></a>
        </div>

        {/* PANEL JASA AUDIO PRODUCTION */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-8 shadow-xl flex flex-col justify-between group">
          <div>
            <Layers size={20} className="text-cyan-400 mb-4" />
            <h2 className="text-md font-black tracking-tight uppercase text-zinc-100">Custom Audio Services</h2>
            <p className="text-zinc-400 text-xs mt-2 font-light">Pesan jasa audio engineering profesional untuk kebutuhan produksi musik Anda.</p>
          </div>
          <a href="/services" className="block mt-8"><Button variant="secondary">Pesan Jasa <ArrowRight size={14} /></Button></a>
        </div>
      </section>

<footer className="border-t border-zinc-900 pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-zinc-600 gap-4 select-none">
        <p className="flex items-center gap-1.5">
          <Terminal size={12} className="text-zinc-500" /> Copyright © 2026 SeqMaster. All Systems Operational.
        </p>
        <div className="flex items-center gap-6 flex-wrap justify-center sm:justify-end">
          <a 
            href="mailto:awsm.techhouse@gmail.com" 
            className="hover:text-emerald-400 transition-colors flex items-center gap-1 uppercase tracking-wider"
          >
            Email // awsm.techhouse@gmail.com
          </a>
          <a 
            href="https://wa.me/+6285111234860" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-emerald-400 transition-colors flex items-center gap-1 uppercase tracking-wider"
          >
            WhatsApp // +62 851-1123-4860
          </a>
        </div>
      </footer>
    </PageContainer>
  );
}