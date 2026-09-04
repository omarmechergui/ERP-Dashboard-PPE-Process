'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '../lib/auth';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

function LayoutContent({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isPublicPage = pathname === '/login' || pathname === '/register';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-sm font-medium">Chargement de la session...</p>
      </div>
    );
  }

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-8 pt-24 bg-slate-150 text-slate-900 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}
