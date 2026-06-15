import PixelSidebar from '@/components/layout/PixelSidebar';
import HUDBar from '@/components/layout/HUDBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
