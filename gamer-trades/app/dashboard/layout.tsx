'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PixelSidebar from '@/components/layout/PixelSidebar';
import HUDBar from '@/components/layout/HUDBar';
import { useAuth } from '@/lib/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace('/login');
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a' }}>
        <div style={{ fontSize: '12px', color: '#00ffff', textShadow: '0 0 8px #00ffff' }}>LOADING...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <PixelSidebar />
      <div style={{ marginLeft: '200px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <HUDBar />
        <main style={{ marginTop: '48px', flex: 1, padding: '16px', minHeight: 'calc(100vh - 48px)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
