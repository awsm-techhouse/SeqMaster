'use client';

import React, { useState } from 'react';
import { PageContainer, Button } from '@/components/ui/LayoutPrimitives';
import { supabase } from '@/lib/supabase';
import { KeyRound } from 'lucide-react';

export default function AuthPortalPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);

  const executeAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLoginView) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else window.location.href = '/dashboard';
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('Registrasi Terbuka! Periksa tautan masuk di kotak surel Anda.');
    }
    setLoading(false);
  };

  const handlePasswordRecovery = async () => {
    if (!email) return alert('Input email akun Anda terlebih dahulu pada kolom.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-callback`,
    });
    if (error) alert(error.message);
    else alert('Tautan pemulihan enkripsi telah dikirim ke alamat email.');
  };

  return (
    <PageContainer className="flex items-center justify-center min-h-screen">
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-8 max-w-sm w-full shadow-2xl space-y-6">
        <div className="text-center">
          <KeyRound className="mx-auto text-emerald-400 mb-2" size={18} />
          <h2 className="text-xs font-black tracking-tight uppercase text-zinc-100">{isLoginView ? 'Clear Key Authorization' : 'Deploy Profile Identity'}</h2>
        </div>

        <form onSubmit={executeAuthAction} className="space-y-4">
          <input type="email" required placeholder="Routing Email Identity" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required placeholder="Security Password Clearance" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={loading}>{loading ? 'Verifying Node Signature...' : isLoginView ? 'Sign In To Vault' : 'Publish New Core Profile'}</Button>
        </form>

        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-4 border-t border-zinc-900">
          <button type="button" onClick={() => setIsLoginView(!isLoginView)} className="hover:text-zinc-100 uppercase transition">{isLoginView ? 'Register Member' : 'Return to Login'}</button>
          {isLoginView && <button type="button" onClick={handlePasswordRecovery} className="hover:text-rose-400 uppercase transition">Forgot Crypt-Key?</button>}
        </div>
      </div>
    </PageContainer>
  );
}