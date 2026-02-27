'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'Mapa Interactivo', icon: '🗺️', scrollTo: 'mapa-interactivo' },
  { href: '/', label: 'Estadísticas', icon: '📊', scrollTo: 'estadisticas' },
  { href: '/', label: 'Histórico', icon: '📈', scrollTo: 'historico' },
  { href: '/detector', label: 'Detector IA', icon: '📷' },
  { href: '/', label: 'Acerca de', icon: 'ℹ️', scrollTo: 'acerca-de' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (item: (typeof NAV_ITEMS)[number], e: React.MouseEvent) => {
    if (item.scrollTo && pathname === '/') {
      e.preventDefault();
      document.getElementById(item.scrollTo)?.scrollIntoView({ behavior: 'smooth' });
      setMobileOpen(false);
    }
  };

  return (
    <header className="glass-effect sticky top-0 z-40 border-b border-white/20">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <span className="text-3xl">🌍</span>
          <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            EcoTrack
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-8">
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={`${item.href}-${i}`}
              href={item.scrollTo ? `/#${item.scrollTo}` : item.href}
              onClick={(e) => handleNavClick(item, e)}
              className="nav-link text-slate-700 hover:text-emerald-600 font-medium transition-all duration-300 relative"
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {/* Status indicator */}
          <div className="status-online">
            <div className="status-indicator" />
            <span>Sistema Activo</span>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-slate-800 focus:outline-none p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="md:hidden px-6 pt-2 pb-4 space-y-3 bg-white/90 backdrop-blur-sm border-t border-white/20">
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={`mobile-${item.href}-${i}`}
              href={item.scrollTo ? `/#${item.scrollTo}` : item.href}
              onClick={(e) => handleNavClick(item, e)}
              className="block text-slate-700 hover:text-emerald-600 font-medium py-3 px-4 rounded-lg transition-colors hover:bg-emerald-50"
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
