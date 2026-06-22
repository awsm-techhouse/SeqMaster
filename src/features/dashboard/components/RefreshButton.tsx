'use client';

import React, { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/LayoutPrimitives';

export default function RefreshButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="w-36">
      {/* Memisahkan interaksi window ke Client Component sesuai ketentuan BUG FIX 2 */}
      <Button variant="secondary" onClick={() => startTransition(() => { window.location.reload(); })} disabled={isPending} className="!py-3">
        <RefreshCw size={12} className={isPending ? 'animate-spin text-emerald-400' : 'text-zinc-500'} />
        <span className="text-[10px]">Sync State</span>
      </Button>
    </div>
  );
}