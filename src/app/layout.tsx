import React from 'react';
import { AudioPlayerProvider } from '@/context/AudioPlayerContext';
import Header from '@/components/ui/Header';
import '@/app/globals.css';
import { midtransSnapScriptUrl } from '@/lib/midtrans';

export const metadata = {
  title: 'SeqMaster Hub - Premium Audio Architecture',
  description: 'Dark Luxury Studio E-Commerce Systems',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="bg-zinc-950 text-zinc-50 antialiased" suppressHydrationWarning>
      <head>
        {/* Menyisipkan CDN skrip resmi Midtrans Snap global berdasarkan env */}
        <script 
          src={midtransSnapScriptUrl}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} 
          defer 
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-zinc-950 selection:bg-emerald-500/20 selection:text-emerald-400">
        
        {/* Menyediakan Global Client State Audio ke seluruh elemen */}
        <AudioPlayerProvider>
          
          {/* PERSISTENT HEADER FRAME: Selalu menetap melintasi rute halaman */}
          <Header />
          
          {/* Konten Halaman Utama Aplikasi */}
          {children}
          
        </AudioPlayerProvider>
      </body>
    </html>
  );
}