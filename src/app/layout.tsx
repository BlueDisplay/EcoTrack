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
  metadataBase: new URL('https://eco-tracker-olive.vercel.app'),
  title: {
    default: 'EcoTrack — Cartografia Participativa de Riesgos',
    template: '%s | EcoTrack',
  },
  description:
    'Plataforma de monitoreo ambiental, deteccion de contaminacion por IA y analisis de datos historicos para Hermosillo, Sonora.',
  keywords: [
    'EcoTrack',
    'medio ambiente',
    'Hermosillo',
    'mapa',
    'contaminacion',
    'IA',
    'riesgos hidrometeorologicos',
  ],
  authors: [{ name: 'EcoTrack Team' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'EcoTrack — Cartografia Participativa de Riesgos',
    description:
      'Plataforma de ciencia ciudadana para monitoreo colaborativo de riesgos hidrometeorologicos en Hermosillo, Sonora.',
    url: 'https://eco-tracker-olive.vercel.app',
    siteName: 'EcoTrack Sonora',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'EcoTrack logo' }],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'EcoTrack — Cartografia Participativa de Riesgos',
    description:
      'Monitoreo ambiental colaborativo para Hermosillo, Sonora.',
    images: ['/icon-512.png'],
  },
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
