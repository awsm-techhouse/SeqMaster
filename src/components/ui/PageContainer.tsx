import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen bg-zinc-950 text-zinc-50 tracking-normal ${className}`}>
      {children}
    </main>
  );
}