'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { StockIcon, type StockIconName } from '@/components/ui/stock-icon';

const NAV_ITEMS = [
  { href: '/', label: 'Mapa Interactivo', icon: 'map' as StockIconName, scrollTo: 'mapa-interactivo' },
  { href: '/', label: 'Estadísticas', icon: 'chart' as StockIconName, scrollTo: 'estadisticas' },
  { href: '/', label: 'Histórico', icon: 'clock' as StockIconName, scrollTo: 'historico' },
  { href: '/detector', label: 'Detector IA', icon: 'camera' as StockIconName },
  { href: '/', label: 'Acerca de', icon: 'shield' as StockIconName, scrollTo: 'acerca-de' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (item: (typeof NAV_ITEMS)[number], e: React.MouseEvent) => {
    if (item.scrollTo && pathname === '/') {
      e.preventDefault();
      document.getElementById(item.scrollTo)?.scrollIntoView({ behavior: 'smooth' });
      setMobileOpen(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'navbar-scrolled border-b border-emerald-100/50'
          : 'glass-effect border-b border-white/20'
      }`}
    >
      <nav
        className={`container mx-auto px-6 flex justify-between items-center transition-all duration-500 navbar-inner ${
          scrolled ? 'py-2.5' : 'py-4'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className={`transition-transform duration-500 ${scrolled ? 'scale-90' : 'scale-100'} group-hover:rotate-12`}>
            <StockIcon name="globe" className="w-8 h-8" />
          </div>
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
              className="nav-link text-slate-700 hover:text-emerald-600 font-medium transition-all duration-300 relative group"
            >
              <span className="mr-2 inline-flex align-middle group-hover:scale-110 transition-transform duration-300">
                <StockIcon name={item.icon} className="w-4 h-4" />
              </span>
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
            <svg className="w-7 h-7 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: mobileOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-400 ease-in-out ${
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pt-2 pb-4 space-y-1 bg-white/95 backdrop-blur-xl border-t border-emerald-100/50">
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={`mobile-${item.href}-${i}`}
              href={item.scrollTo ? `/#${item.scrollTo}` : item.href}
              onClick={(e) => handleNavClick(item, e)}
              className="flex items-center text-slate-700 hover:text-emerald-600 font-medium py-3 px-4 rounded-xl transition-all hover:bg-emerald-50 hover:translate-x-1"
            >
              <span className="mr-3 inline-flex align-middle p-1.5 bg-emerald-50 rounded-lg">
                <StockIcon name={item.icon} className="w-4 h-4" />
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
