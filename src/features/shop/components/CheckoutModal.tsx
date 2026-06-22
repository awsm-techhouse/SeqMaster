'use client';

import React, { useState, useTransition } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/LayoutPrimitives';
import { useRouter } from 'next/navigation';

export default function CheckoutModal({ product, onClose }: { product: any; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCheckoutInit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch('/api/checkout/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            product_id: product.id, 
            customer_name: name, 
            customer_email: email, 
            whatsapp_number: whatsapp, 
            amount: product.price 
          })
        });

        // FIXED: Menangkap crash internal server (Trap Fix)
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Gagal memproses inisialisasi invoice di server.');
        }

        const data = await res.json();
        
        if (data.orderId) {
          // Menggunakan router push internal Next.js App Router agar transisi mulus
          router.push(`/checkout/${data.orderId}`);
        } else {
          throw new Error('Server tidak mengembalikan ID Transaksi (orderId) yang valid.');
        }
      } catch (err: any) {
        console.error('Checkout error detail:', err);
        // Menampilkan alert agar Anda tahu pasti letak kesalahannya jika terjadi error di backend
        alert(`Gagal Checkout: ${err.message || err}`);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative text-center">
        <button type="button" onClick={onClose} className="absolute top-5 right-5 text-zinc-500 hover:text-zinc-200 transition p-1.5 rounded-xl hover:bg-zinc-800/40">
          <X size={16} />
        </button>
        
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20 select-none">
          <ShieldCheck className="text-emerald-400" size={22} />
        </div>

        <h3 className="text-base font-black tracking-tight uppercase text-zinc-100 mb-1 select-none">Secure Terminal Checkout</h3>
        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-6">{product.title} // Matrix Asset Node</p>

        <form onSubmit={handleCheckoutInit} className="space-y-5 text-sm">
          <div>
            <label className="block text-[11px] text-zinc-400 uppercase font-mono tracking-widest mb-1.5 text-center">Name</label>
            <input type="text" required placeholder="NAMA LENGKAP ANDA" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-3.5 text-sm text-zinc-100 text-center placeholder:text-center focus:border-emerald-500 focus:outline-none transition shadow-inner" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 uppercase font-mono tracking-widest mb-1.5 text-center">Email</label>
            <input type="email" required placeholder="ALAMAT@EMAIL.COM" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-3.5 text-sm text-zinc-100 text-center placeholder:text-center focus:border-emerald-500 focus:outline-none transition shadow-inner" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 uppercase font-mono tracking-widest mb-1.5 text-center">Whatsapp</label>
            <input type="tel" required placeholder="0851XXXXXXXX" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-3.5 text-sm text-zinc-100 text-center placeholder:text-center focus:border-emerald-500 focus:outline-none transition shadow-inner" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isPending} className="!py-4 text-xs tracking-widest font-black uppercase">
              {isPending ? 'Mempersiapkan Pipeline Transaksi...' : 'Beli sekarang'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}