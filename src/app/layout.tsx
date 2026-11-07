import type { Metadata, Viewport } from 'next';
import './globals.css';
import { UserProvider } from '@/context/UserContext';
import Navbar from '@/components/Navbar';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'BuildTrack CRM — Construction Site Lead Capture & Conversion',
  description: 'Eliminates WhatsApp bottlenecks, tracks on-site construction leads, powers telecalling, and delivers full manager visibility.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SiteTrack',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body 
        className="min-h-full w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50 text-slate-900 font-sans"
        suppressHydrationWarning
      >
        <UserProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
