'use client';

import React, { useTransition } from 'react';
import { CreditCard } from 'lucide-react';

export default function PayTriggerButton({ snapToken, orderId }: { snapToken: string; orderId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleTriggerSnapPopup = () => {
    if (!snapToken) return;
    
    startTransition(() => {
      // @ts-ignore
      if (window.snap) {
        // @ts-ignore
        window.snap.pay(snapToken, {
          onSuccess: () => { window.location.href = `/checkout/${orderId}`; },
          onPending: () => { window.location.href = `/checkout/${orderId}`; },
          onClose: () => { console.log('Payment checkout gateway window dismissed.'); }
        });
      } else {
        alert('Midtrans Snap Client Engine gagal dimuat. Muat ulang halaman.');
      }
    });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleTriggerSnapPopup}
      className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-black/40"
    >
      <CreditCard size={14} />
      {isPending ? 'Invoking Terminal...' : 'Pilih Metode Pembayaran'}
    </button>
  );
}