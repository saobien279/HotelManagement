import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import { HotelProvider } from '@/context/HotelContext';
import { UIProvider } from '@/components/ui/UIProvider';
import { NotificationProvider } from '@/context/NotificationContext';

export const metadata: Metadata = {
  title: 'HotelOS – Hệ thống Quản lý Khách sạn',
  description: 'Hệ thống quản lý khách sạn toàn diện: đặt phòng, tiền sảnh, buồng phòng, dịch vụ, báo cáo và quản trị.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <HotelProvider>
          <NotificationProvider>
            <UIProvider>
              <AppShell>
                {children}
              </AppShell>
            </UIProvider>
          </NotificationProvider>
        </HotelProvider>
      </body>
    </html>
  );
}
