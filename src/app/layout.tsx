import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Navbar } from '@/components/layout/navbar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Toaster } from 'sonner';
import './globals.css';

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'EcoTrack — Cartografía Participativa de Riesgos',
    template: '%s | EcoTrack',
  },
  description:
    'Plataforma de monitoreo ambiental, detección de contaminación por IA y análisis de datos históricos para Hermosillo, Sonora.',
  keywords: [
    'EcoTrack',
    'medio ambiente',
    'Hermosillo',
    'mapa',
    'contaminación',
    'IA',
    'riesgos hidrometeorológicos',
  ],
  authors: [{ name: 'EcoTrack Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#10b981',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={font.variable}>
      <body className="font-sans text-slate-700 antialiased">
        <Navbar />
        <main className="min-h-[calc(100dvh-4rem)] pb-16 lg:pb-0">
          {children}
        </main>
        <MobileNav />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
