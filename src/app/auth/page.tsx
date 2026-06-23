'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { PageContainer, Button } from '@/components/ui/LayoutPrimitives';
import { supabase } from '@/lib/supabase';
import { KeyRound, User, Mail, Phone, EyeOff } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// 1. KOMPONEN KONTEN UTAMA (AUTH PORTAL)
function AuthPortalContent() {
  const searchParams = useSearchParams();
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // MANIFES INPUT STATE KLIEN
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // SINKRONISASI OTOMATIS PARAMETER EMAIL DARI HALAMAN CHECKOUT
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      setIsLoginView(false); // Otomatis alihkan visual ke form Register Account
    }
  }, [searchParams]);

  const executeAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLoginView) {
        // ALUR MASUK (SIGN IN): Langsung lewat Supabase Client Auth
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        window.location.href = '/dashboard';
      } else {
        // ALUR DAFTAR (REGISTER): Lewat API Handler untuk bypass limit & localhost trap
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, whatsapp })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Gagal mengeksekusi pipeline pendaftaran.');
        }

        alert('Registrasi Berhasil! Pipa SMTP Gmail aman. Silakan buka kotak masuk atau spam email Anda untuk mengklik tautan aktivasi akun.');
        setIsLoginView(true); // Kembalikan ke halaman login setelah sukses daftar
      }
    } catch (err: any) {
      alert(`Otentikasi Gagal: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    if (!email) return alert('Input email akun Anda terlebih dahulu pada kolom.');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-callback`,
    });
    
    if (error) alert(error.message);
    else alert('Tautan pemulihan enkripsi aman telah dikirim ke alamat email Gmail Anda.');
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
      
      <div className="text-center select-none">
        <div className="mx-auto w-10 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 border border-emerald-500/20">
          <KeyRound className="text-emerald-400" size={18} />
        </div>
        <h2 className="text-sm font-black tracking-tight uppercase text-zinc-100">
          {isLoginView ? 'Login Account' : 'Register Account'}
        </h2>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
          {isLoginView ? 'Welcome Back!' : 'Start Creating Account'}
        </p>
      </div>

      <form onSubmit={executeAuthAction} className="space-y-4 text-xs">
        
        {/* TAMPILKAN KOLOM NAME HANYA JIKA MODE REGISTER ACTIVE */}
        {!isLoginView && (
          <div className="relative animate-in slide-in-from-top-2 duration-200">
            <User size={12} className="absolute left-4 top-3.5 text-zinc-600" />
            <input 
              type="text" 
              required 
              placeholder="NAMA LENGKAP" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition tracking-wide" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
        )}

        {/* KOLOM EMAIL */}
        <div className="relative">
          <Mail size={12} className="absolute left-4 top-3.5 text-zinc-600" />
          <input 
            type="email" 
            required 
            placeholder="ALAMAT@EMAIL.COM" 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none transition tracking-wide" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>

        {/* TAMPILKAN KOLOM WHATSAPP HANYA JIKA MODE REGISTER ACTIVE */}
        {!isLoginView && (
          <div className="relative animate-in slide-in-from-top-2 duration-200">
            <Phone size={12} className="absolute left-4 top-3.5 text-zinc-600" />
            <input 
              type="tel" 
              required 
              placeholder="NOMOR WHATSAPP (0851xxx)" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none transition tracking-widest" 
              value={whatsapp} 
              onChange={(e) => setWhatsapp(e.target.value)} 
            />
          </div>
        )}

        {/* KOLOM PASSWORD */}
        <div className="relative">
          <EyeOff size={12} className="absolute left-4 top-3.5 text-zinc-600" />
          <input 
            type="password" 
            required 
            placeholder="KATA SANDI" 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none transition tracking-widest" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={loading} className="!py-3 text-[10px] tracking-widest font-black uppercase">
            {loading ? 'Registering...' : isLoginView ? 'Sign In' : 'Create Account'}
          </Button>
        </div>
      </form>

      {/* NAVIGASI SWITCH BOTTOM TOGGLE */}
      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-4 border-t border-zinc-900 select-none">
        <button 
          type="button" 
          onClick={() => setIsLoginView(!isLoginView)} 
          className="hover:text-zinc-100 uppercase transition tracking-wider"
        >
          {isLoginView ? '// Create Account' : '// Return to Login'}
        </button>
        {isLoginView && (
          <button 
            type="button" 
            onClick={handlePasswordRecovery} 
            className="hover:text-rose-400 uppercase transition tracking-wider"
          >
            Forgot Password?
          </button>
        )}
      </div>
    </div>
  );
}

// 2. EXPORT HALAMAN UTAMA DENGAN SUSPENSE BOUNDARY PROTEKSI BUILD
export default function AuthPortalPage() {
  return (
    <PageContainer className="flex items-center justify-center min-h-screen">
      <Suspense fallback={
        <div className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest animate-pulse">
          Loading Security Network...
        </div>
      }>
        <AuthPortalContent />
      </Suspense>
    </PageContainer>
  );
}